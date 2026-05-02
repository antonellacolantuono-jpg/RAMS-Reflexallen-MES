// PROMPT_PNE_3 D3 — Interactive Demo Toggle Panel.
//
// State management:
//   - Initial fetch on mount, then 2s polling via setInterval (cleanup on
//     unmount). Polling will be replaced by WebSocket subscription in F2 —
//     tracked in TODO-044.
//   - Override + Start handlers wired to the /api/internal/mock-devices/*
//     endpoints from demo-api.ts; toast feedback on success/failure (Italian
//     copy matches the operator-facing tone of the rest of apps/web).
//
// This file is the only client component on the /demo route — the parent
// page.tsx stays as a server component for the notFound() gate so that
// non-DEMO_MODE deployments never ship the JS bundle.

'use client'
import * as React from 'react'
import { ToastProvider, useToast } from '@mes/ui'
import {
  DEVICE_CODES,
  getMockDeviceStatus,
  listMockDevices,
  overrideNextOutcome,
  startMockCycle,
  type DeviceOutcome,
  type MockDeviceStatus,
} from '../../lib/demo-api'
import { DeviceCard } from './DeviceCard'

const POLL_INTERVAL_MS = 2_000

const FALLBACK_DEVICES: readonly { code: string; defaultOutcome: DeviceOutcome; supported: readonly DeviceOutcome[]; expected: number }[] = [
  { code: DEVICE_CODES.LEAK, defaultOutcome: 'PASS', supported: ['PASS', 'MARGINAL', 'FAIL'], expected: 45 },
  { code: DEVICE_CODES.CAMERA, defaultOutcome: 'PASS', supported: ['PASS', 'FAIL'], expected: 8 },
  { code: DEVICE_CODES.CRIMP, defaultOutcome: 'PASS', supported: ['PASS', 'FAIL'], expected: 8 },
] as const

function buildIdleStatus(d: (typeof FALLBACK_DEVICES)[number]): MockDeviceStatus {
  return {
    deviceSerialNumber: d.code,
    state: 'idle',
    stepExecutionId: null,
    startedAt: null,
    elapsedSec: 0,
    expectedDurationSec: d.expected,
    defaultOutcome: d.defaultOutcome,
    supportedOutcomes: d.supported,
    nextOutcome: null,
    lastOutcome: null,
    telemetry: {},
  }
}

function DemoPanelInner() {
  const toast = useToast()
  const [devices, setDevices] = React.useState<MockDeviceStatus[]>(() =>
    FALLBACK_DEVICES.map(buildIdleStatus),
  )
  const [error, setError] = React.useState<string | null>(null)

  const refresh = React.useCallback(async () => {
    try {
      const fetched = await listMockDevices()
      setDevices(fetched)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }, [])

  const refreshDevice = React.useCallback(async (code: string) => {
    try {
      const updated = await getMockDeviceStatus(code)
      setDevices((prev) =>
        prev.map((d) => (d.deviceSerialNumber === updated.deviceSerialNumber ? updated : d)),
      )
    } catch {
      // Per-device refresh failures fall back to the next polling tick.
    }
  }, [])

  React.useEffect(() => {
    void refresh()
    const interval = setInterval(() => void refresh(), POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [refresh])

  const handleOverride = React.useCallback(
    async (deviceCode: string, outcome: DeviceOutcome) => {
      try {
        await overrideNextOutcome(deviceCode, outcome)
        toast.show(
          `Override programmato su ${deviceCode}: ${outcome} (sarà applicato al prossimo ciclo)`,
          tone(outcome),
        )
        await refreshDevice(deviceCode)
      } catch (err) {
        toast.show(`Errore override su ${deviceCode}: ${(err as Error).message}`, 'bad')
      }
    },
    [toast, refreshDevice],
  )

  const handleStart = React.useCallback(
    async (deviceCode: string) => {
      try {
        const stepExecutionId = `demo-${Date.now()}`
        await startMockCycle(deviceCode, stepExecutionId)
        toast.show(`Ciclo avviato su ${deviceCode}`, 'info')
        await refreshDevice(deviceCode)
      } catch (err) {
        toast.show(`Errore avvio ciclo su ${deviceCode}: ${(err as Error).message}`, 'bad')
      }
    },
    [toast, refreshDevice],
  )

  return (
    <main className="min-h-screen bg-paper p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-ink">🎛️ Demo Toggle Panel</h1>
          <p className="mt-1 text-sm text-ink-2">
            Forza gli outcome dei dispositivi per la demo. Pannello solo back-office — gli
            operatori NON devono vedere questa pagina.
          </p>
          {error && (
            <p className="mt-2 rounded-2 bg-bad-soft px-3 py-2 text-sm text-bad-ink">
              Errore di connessione all&apos;API: {error}. Riprovo ogni {POLL_INTERVAL_MS / 1000}s.
            </p>
          )}
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {devices.map((d) => (
            <DeviceCard
              key={d.deviceSerialNumber}
              device={d}
              onOverride={(outcome) => void handleOverride(d.deviceSerialNumber, outcome)}
              onStart={() => void handleStart(d.deviceSerialNumber)}
            />
          ))}
        </div>

        <p className="mt-6 text-xs text-ink-3">
          Polling stato dispositivi ogni {POLL_INTERVAL_MS / 1000}s. La sostituzione con
          WebSocket è tracciata da TODO-044.
        </p>
      </div>
    </main>
  )
}

function tone(outcome: DeviceOutcome): 'ok' | 'warn' | 'bad' {
  if (outcome === 'PASS') return 'ok'
  if (outcome === 'MARGINAL') return 'warn'
  return 'bad'
}

export function DemoPanel() {
  return (
    <ToastProvider>
      <DemoPanelInner />
    </ToastProvider>
  )
}

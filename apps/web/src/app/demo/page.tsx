// PROMPT_PNE_3 D2 — Demo Toggle Panel scaffolding (back-office only).
//
// Page returns 404 (notFound) when NEXT_PUBLIC_DEMO_MODE !== 'true'. When
// enabled it renders 3 DeviceCards in their idle scaffolding state — D4 will
// wire live API status fetching, override/start actions and WebSocket
// subscription for real-time cycle progress.
//
// CRITICAL: this page must NOT be reachable from the operator HMI. It is a
// developer/QA-only surface for forcing simulator outcomes during demos.

import { notFound } from 'next/navigation'
import { DeviceCard } from '../../components/demo/DeviceCard'
import { DEVICE_CODES, type MockDeviceStatus } from '../../lib/demo-api'

export const dynamic = 'force-dynamic'

interface ScaffoldDevice {
  code: string
  defaultOutcome: MockDeviceStatus['defaultOutcome']
  supportedOutcomes: MockDeviceStatus['supportedOutcomes']
  expectedDurationSec: number
}

const SCAFFOLD_DEVICES: ScaffoldDevice[] = [
  {
    code: DEVICE_CODES.LEAK,
    defaultOutcome: 'PASS',
    supportedOutcomes: ['PASS', 'MARGINAL', 'FAIL'],
    expectedDurationSec: 45,
  },
  {
    code: DEVICE_CODES.CAMERA,
    defaultOutcome: 'PASS',
    supportedOutcomes: ['PASS', 'FAIL'],
    expectedDurationSec: 8,
  },
  {
    code: DEVICE_CODES.CRIMP,
    defaultOutcome: 'PASS',
    supportedOutcomes: ['PASS', 'FAIL'],
    expectedDurationSec: 8,
  },
]

function buildIdleStatus(d: ScaffoldDevice): MockDeviceStatus {
  return {
    deviceSerialNumber: d.code,
    state: 'idle',
    stepExecutionId: null,
    startedAt: null,
    elapsedSec: 0,
    expectedDurationSec: d.expectedDurationSec,
    defaultOutcome: d.defaultOutcome,
    supportedOutcomes: d.supportedOutcomes,
    nextOutcome: null,
    telemetry: {},
  }
}

export default function DemoPage() {
  if (process.env['NEXT_PUBLIC_DEMO_MODE'] !== 'true') {
    notFound()
  }

  return (
    <main className="min-h-screen bg-paper p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-ink">🎛️ Demo Toggle Panel</h1>
          <p className="mt-1 text-sm text-ink-2">
            Force device outcomes for testing. Back-office only — operators must NOT see this
            panel during the demo.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {SCAFFOLD_DEVICES.map((d) => (
            <DeviceCard key={d.code} device={buildIdleStatus(d)} disabled />
          ))}
        </div>

        <p className="mt-6 text-xs text-ink-3">
          D2 scaffolding — buttons are disabled until D4 wires the override + start-cycle API
          calls and the WebSocket subscription that drives real-time cycle progress.
        </p>
      </div>
    </main>
  )
}

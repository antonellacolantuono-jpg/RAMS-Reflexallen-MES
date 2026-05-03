'use client'
import * as React from 'react'

export type MockDeviceLifecycleState = 'idle' | 'running' | 'complete'
export type MockDeviceOutcome = 'PASS' | 'MARGINAL' | 'FAIL'

export interface MockDeviceStatus {
  deviceSerialNumber: string
  state: MockDeviceLifecycleState
  stepExecutionId: string | null
  startedAt: string | null
  elapsedSec: number
  expectedDurationSec: number
  defaultOutcome: MockDeviceOutcome
  supportedOutcomes: readonly MockDeviceOutcome[]
  nextOutcome: MockDeviceOutcome | null
  lastOutcome: MockDeviceOutcome | null
  telemetry: Record<string, unknown>
}

const API_BASE_URL =
  process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000'

/**
 * PNE_4_FOCUSED D2 — polls `/api/internal/mock-devices/:serial` every
 * `intervalMs` (default 2000) and returns the latest status. Pairs with
 * `useDeviceCycle` (WS-driven sub-second telemetry) so the HMI has both fast
 * progress updates AND a periodic ground-truth status check (lastOutcome,
 * elapsedSec, telemetry snapshot). Returns null until the first response.
 *
 * Errors are swallowed silently — DEMO_MODE off / device 404 / network glitch
 * just leave the previous value in place. Production hardening (toast on
 * persistent failure) lives in F2.
 */
export function useMockDeviceStatus(
  deviceSerialNumber: string,
  intervalMs: number = 2000,
): MockDeviceStatus | null {
  const [status, setStatus] = React.useState<MockDeviceStatus | null>(null)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    let cancelled = false

    const fetchOnce = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/internal/mock-devices/${encodeURIComponent(deviceSerialNumber)}`,
          { credentials: 'include' },
        )
        if (!res.ok) return
        const body = (await res.json()) as { device?: MockDeviceStatus }
        if (!cancelled && body.device) setStatus(body.device)
      } catch {
        // Swallow — see comment above.
      }
    }

    void fetchOnce()
    const handle = setInterval(fetchOnce, intervalMs)
    return () => {
      cancelled = true
      clearInterval(handle)
    }
  }, [deviceSerialNumber, intervalMs])

  return status
}

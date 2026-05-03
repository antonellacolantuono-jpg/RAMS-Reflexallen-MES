import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useMockDeviceStatus } from './use-mock-device-status'

describe('useMockDeviceStatus', () => {
  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchSpy = vi.fn(async () =>
      new Response(
        JSON.stringify({
          device: {
            deviceSerialNumber: 'DEV-LEAK-001',
            state: 'running',
            stepExecutionId: 'se-1',
            startedAt: new Date('2026-05-03T10:00:00Z').toISOString(),
            elapsedSec: 4,
            expectedDurationSec: 45,
            defaultOutcome: 'PASS',
            supportedOutcomes: ['PASS', 'MARGINAL', 'FAIL'],
            nextOutcome: null,
            lastOutcome: null,
            telemetry: { phase: 'pressurize', pressureBar: 5.5 },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', fetchSpy)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fires the initial fetch on mount and re-polls on the configured interval', async () => {
    // Use a very short interval (50ms) and assert via real-timer waitFor that
    // multiple polls happen — exercising the setInterval loop without
    // entangling fake timers + microtasks.
    const { unmount } = renderHook(() => useMockDeviceStatus('DEV-LEAK-001', 50))

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1))
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/internal/mock-devices/DEV-LEAK-001'),
      expect.objectContaining({ credentials: 'include' }),
    )

    // Wait until at least 3 polls have fired (initial + 2 interval ticks).
    await waitFor(() => expect(fetchSpy.mock.calls.length).toBeGreaterThanOrEqual(3), {
      timeout: 1500,
    })

    unmount()
    const callsAfterUnmount = fetchSpy.mock.calls.length
    // After unmount, no more polls within ~150ms.
    await new Promise((r) => setTimeout(r, 150))
    expect(fetchSpy.mock.calls.length).toBe(callsAfterUnmount)
  })
})

// PROMPT_PNE_3 D1 — Mock device types shared across simulators.

export type DeviceOutcome = 'PASS' | 'MARGINAL' | 'FAIL'

export type MockDeviceLifecycleState = 'idle' | 'running' | 'complete'

export interface MockDeviceStatus {
  deviceSerialNumber: string
  state: MockDeviceLifecycleState
  stepExecutionId: string | null
  startedAt: string | null
  elapsedSec: number
  expectedDurationSec: number
  defaultOutcome: DeviceOutcome
  supportedOutcomes: readonly DeviceOutcome[]
  nextOutcome: DeviceOutcome | null
  /**
   * D3 — outcome of the most recently completed cycle. Populated when the
   * cycle completes; cleared when a new cycle starts (so `idle + lastOutcome`
   * means "ready, last result was X" and `running + lastOutcome=null` means
   * "first cycle in progress").
   */
  lastOutcome: DeviceOutcome | null
  telemetry: Record<string, unknown>
}

/**
 * PNE_4_FOCUSED D2 — optional per-cycle completion callback.
 *
 * The dispatcher (MockDeviceDispatcherService) registers a callback when it
 * starts a cycle as part of the step-execution device dispatch flow. The
 * simulator invokes the callback in `complete()` *in addition to* emitting the
 * `device:cycle:complete` WS event, so the dispatcher can fire the matching
 * state-machine transition (COMPLETE_OK / COMPLETE_NOK) without listening on
 * the gateway.
 *
 * Existing callers (REST controller from PNE_3) don't pass a callback — their
 * cycles complete silently from the simulator's perspective. Adding the
 * parameter is non-breaking.
 */
export type CycleCompletionListener = (outcome: DeviceOutcome) => void

export interface MockDevice {
  readonly deviceSerialNumber: string
  readonly defaultOutcome: DeviceOutcome
  readonly supportedOutcomes: readonly DeviceOutcome[]
  readonly expectedDurationSec: number
  start(
    stepExecutionId: string,
    recipeParams?: Record<string, unknown>,
    onComplete?: CycleCompletionListener,
  ): void
  stop(): void
  getStatus(): MockDeviceStatus
}

export const ALL_OUTCOMES: readonly DeviceOutcome[] = ['PASS', 'MARGINAL', 'FAIL'] as const
export const PASS_FAIL_OUTCOMES: readonly DeviceOutcome[] = ['PASS', 'FAIL'] as const

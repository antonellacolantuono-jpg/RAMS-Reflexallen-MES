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
  telemetry: Record<string, unknown>
}

export interface MockDevice {
  readonly deviceSerialNumber: string
  readonly defaultOutcome: DeviceOutcome
  readonly supportedOutcomes: readonly DeviceOutcome[]
  readonly expectedDurationSec: number
  start(stepExecutionId: string, recipeParams?: Record<string, unknown>): void
  stop(): void
  getStatus(): MockDeviceStatus
}

export const ALL_OUTCOMES: readonly DeviceOutcome[] = ['PASS', 'MARGINAL', 'FAIL'] as const
export const PASS_FAIL_OUTCOMES: readonly DeviceOutcome[] = ['PASS', 'FAIL'] as const

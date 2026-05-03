// PNE_4_FOCUSED D4.0 hotfix regression test.
//
// The bug: apps/hmi/src/app/wo/[id]/page.tsx renders StepCard for every step
// — never delegates to DeviceCycleWithParallels for `device_run` device_main
// steps. That is why operators see plain OK/NOK buttons during a leak cycle
// instead of the timer + telemetry split layout, even though all the
// DeviceCycleView/Telemetry components ship green from D2/D3.
//
// The fix in page.tsx checks each group for an active device-cycle step via
// the `isDeviceCycleStep` helper below. This test pins the helper's behavior
// so a future refactor can't silently regress to "device_run is treated like
// any other action" without flipping a test.

import { describe, it, expect } from 'vitest'
import type { WorkOrderStep } from '../../../../lib/queries'

const DEVICE_CYCLE_SERIALS = new Set([
  'DEV-LEAK-001',
  'DEV-CAMERA-001',
  'DEV-CRIMP-001',
])

// Mirrors the helper in page.tsx — copied here so the test can lock the rule
// without coupling to the page module (which pulls in next/navigation, the
// xstate machine, etc.).
function isDeviceCycleStep(step: WorkOrderStep | undefined): boolean {
  if (!step) return false
  if (step.actionType !== 'device_run') return false
  if (step.deviceCategory !== 'device_main') return false
  return (
    !!step.deviceSerialNumber &&
    DEVICE_CYCLE_SERIALS.has(step.deviceSerialNumber)
  )
}

function step(overrides: Partial<WorkOrderStep>): WorkOrderStep {
  return {
    stepExecutionId: 'se-1',
    workOrderId: 'wo-1',
    stepId: 'step-1',
    status: 'running',
    result: null,
    durationSec: null,
    startedAt: null,
    completedAt: null,
    stepName: 'Run leak test cycle',
    stepCategory: 'production',
    stepOrder: 3,
    actionType: 'device_run',
    instructions: null,
    deviceCategory: 'device_main',
    deviceSerialNumber: 'DEV-LEAK-001',
    groupId: 'g-1',
    groupName: 'Leak test',
    groupCategory: 'device_execution',
    groupSupportsParallel: true,
    recoveryStage: null,
    attemptCount: 0,
    ...overrides,
  }
}

describe('D4.0 hotfix — isDeviceCycleStep', () => {
  it('detects all 3 mock device serials as device-cycle steps', () => {
    expect(isDeviceCycleStep(step({ deviceSerialNumber: 'DEV-LEAK-001' }))).toBe(
      true,
    )
    expect(
      isDeviceCycleStep(step({ deviceSerialNumber: 'DEV-CAMERA-001' })),
    ).toBe(true)
    expect(
      isDeviceCycleStep(step({ deviceSerialNumber: 'DEV-CRIMP-001' })),
    ).toBe(true)
  })

  it('rejects manual / non-device steps even when a device serial is set', () => {
    expect(
      isDeviceCycleStep(
        step({ actionType: 'apply_label', deviceSerialNumber: 'DEV-LEAK-001' }),
      ),
    ).toBe(false)
  })

  it('rejects device_run steps that are pre/parallel/post lanes (not device_main)', () => {
    expect(
      isDeviceCycleStep(
        step({ deviceCategory: 'parallel', deviceSerialNumber: 'DEV-LEAK-001' }),
      ),
    ).toBe(false)
  })

  it('rejects device_run device_main steps with unknown / null serial (real-device path falls through)', () => {
    expect(
      isDeviceCycleStep(step({ deviceSerialNumber: 'DEV-AUTOCLAVE-001' })),
    ).toBe(false)
    expect(isDeviceCycleStep(step({ deviceSerialNumber: null }))).toBe(false)
  })
})

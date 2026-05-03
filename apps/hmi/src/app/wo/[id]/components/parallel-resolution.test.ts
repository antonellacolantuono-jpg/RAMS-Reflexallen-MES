import { describe, it, expect } from 'vitest'
import {
  resolveParallelSiblings,
  countCompletedParallels,
} from './parallel-resolution'
import type { WorkOrderStep } from '../../../../lib/queries'

function step(overrides: Partial<WorkOrderStep>): WorkOrderStep {
  return {
    stepExecutionId: 'se-' + (overrides.stepOrder ?? 0),
    workOrderId: 'wo-1',
    stepId: 'step-' + (overrides.stepOrder ?? 0),
    status: 'pending',
    result: null,
    durationSec: null,
    startedAt: null,
    completedAt: null,
    stepName: '',
    stepCategory: 'production',
    stepOrder: 0,
    actionType: 'assembly',
    instructions: null,
    deviceCategory: null,
    deviceSerialNumber: null,
    groupId: 'g-leak',
    groupName: 'Leak test',
    groupCategory: 'device_execution',
    groupSupportsParallel: true,
    recoveryStage: null,
    attemptCount: 0,
    ...overrides,
  }
}

describe('resolveParallelSiblings', () => {
  it('returns the parallel siblings of a device_main step in step-order', () => {
    const deviceMain = step({
      stepOrder: 3,
      deviceCategory: 'device_main',
      deviceSerialNumber: 'DEV-LEAK-001',
      actionType: 'device_run',
    })
    const all = [
      step({ stepOrder: 1, deviceCategory: 'pre' }),
      step({ stepOrder: 2, deviceCategory: 'pre' }),
      deviceMain,
      step({ stepOrder: 6, deviceCategory: 'parallel', actionType: 'assembly' }),
      step({ stepOrder: 4, deviceCategory: 'parallel', actionType: 'apply_label' }),
      step({ stepOrder: 5, deviceCategory: 'parallel', actionType: 'apply_label' }),
      step({ stepOrder: 7, deviceCategory: 'post' }),
    ]
    const siblings = resolveParallelSiblings(all, deviceMain)
    expect(siblings.map((s) => s.stepOrder)).toEqual([4, 5, 6])
  })

  it('returns [] when the input is not a device_main step', () => {
    const preStep = step({ stepOrder: 1, deviceCategory: 'pre' })
    const all = [
      preStep,
      step({ stepOrder: 4, deviceCategory: 'parallel' }),
    ]
    expect(resolveParallelSiblings(all, preStep)).toEqual([])
  })

  it('ignores parallels in other groups', () => {
    const deviceMain = step({
      stepOrder: 3,
      deviceCategory: 'device_main',
      groupId: 'g-leak',
    })
    const all = [
      deviceMain,
      step({ stepOrder: 4, deviceCategory: 'parallel', groupId: 'g-leak' }),
      step({ stepOrder: 1, deviceCategory: 'parallel', groupId: 'g-camera' }),
    ]
    const siblings = resolveParallelSiblings(all, deviceMain)
    expect(siblings.map((s) => s.stepOrder)).toEqual([4])
  })
})

describe('countCompletedParallels', () => {
  it('counts done + scrapped + skipped + cancelled but not running/pending', () => {
    const slots = [
      step({ stepOrder: 1, status: 'done' }),
      step({ stepOrder: 2, status: 'running' }),
      step({ stepOrder: 3, status: 'skipped' }),
      step({ stepOrder: 4, status: 'pending' }),
      step({ stepOrder: 5, status: 'scrapped' }),
    ]
    expect(countCompletedParallels(slots)).toBe(3)
  })
})

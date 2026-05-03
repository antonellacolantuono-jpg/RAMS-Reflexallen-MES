import { describe, it, expect } from 'vitest'
import {
  StepDataSchema,
  StepRecoveryConfigSchema,
  WorkflowStepInputSchema,
} from './workflow.schema'

// PROMPT_7 D1 — schema-level guarantees for the new Step.data JSON contract.
// These pin the transport shape between the workflow editor (web) and the
// step persistence layer (api). If they break, the editor save/load will
// silently lose recoveryConfig.

describe('StepRecoveryConfigSchema', () => {
  it('applies defaults when fields are omitted', () => {
    const out = StepRecoveryConfigSchema.parse({})
    expect(out).toEqual({ enabled: false, maxAttempts: 2, preRetryStepIds: [] })
  })

  it('accepts a fully populated recovery config', () => {
    const out = StepRecoveryConfigSchema.parse({
      enabled: true,
      maxAttempts: 3,
      preRetryStepIds: ['step-a', 'step-b'],
    })
    expect(out.enabled).toBe(true)
    expect(out.maxAttempts).toBe(3)
    expect(out.preRetryStepIds).toEqual(['step-a', 'step-b'])
  })

  it('rejects maxAttempts above the 0..5 budget', () => {
    expect(StepRecoveryConfigSchema.safeParse({ maxAttempts: 6 }).success).toBe(false)
    expect(StepRecoveryConfigSchema.safeParse({ maxAttempts: -1 }).success).toBe(false)
  })

  it('preRetryStepIds tolerates non-cuid strings (steps may not be persisted yet)', () => {
    const out = StepRecoveryConfigSchema.parse({
      preRetryStepIds: ['new-1715000000000', 'transient-id'],
    })
    expect(out.preRetryStepIds).toEqual(['new-1715000000000', 'transient-id'])
  })
})

describe('StepDataSchema', () => {
  it('accepts an empty object (all slots optional)', () => {
    const out = StepDataSchema.parse({})
    expect(out).toEqual({})
  })

  it('accepts the canonical recoveryConfig + photoUrl + actionType blob', () => {
    const out = StepDataSchema.parse({
      recoveryConfig: { enabled: true, maxAttempts: 2, preRetryStepIds: [] },
      photoUrl: '/uploads/leak.png',
      actionType: 'device_run',
    })
    expect(out.recoveryConfig?.enabled).toBe(true)
    expect(out.photoUrl).toBe('/uploads/leak.png')
    expect(out.actionType).toBe('device_run')
  })

  it('passes through forward-compatible extra fields (passthrough)', () => {
    const out = StepDataSchema.parse({
      recoveryConfig: { enabled: false, maxAttempts: 2, preRetryStepIds: [] },
      futureField: { nested: 1 },
    })
    expect(out['futureField']).toEqual({ nested: 1 })
  })
})

describe('WorkflowStepInputSchema with data slot', () => {
  it('accepts a step without data (backward-compatible)', () => {
    const result = WorkflowStepInputSchema.safeParse({
      order: 1,
      category: 'production',
      actionType: 'assembly',
      name: 'Pick tube',
    })
    expect(result.success).toBe(true)
  })

  it('accepts a step with a populated data slot', () => {
    const result = WorkflowStepInputSchema.safeParse({
      order: 1,
      category: 'production',
      actionType: 'device_run',
      name: 'Run leak test cycle',
      data: {
        recoveryConfig: {
          enabled: true,
          maxAttempts: 2,
          preRetryStepIds: ['ref-check', 'ref-clean'],
        },
        photoUrl: '/uploads/leak.png',
      },
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.data?.recoveryConfig?.maxAttempts).toBe(2)
    }
  })

  it('accepts a step with data: null (clearing semantics)', () => {
    const result = WorkflowStepInputSchema.safeParse({
      order: 1,
      category: 'production',
      actionType: 'assembly',
      name: 'X',
      data: null,
    })
    expect(result.success).toBe(true)
  })
})

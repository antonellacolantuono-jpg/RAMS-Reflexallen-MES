import { describe, it, expect } from 'vitest'
import { createActor } from 'xstate'
import {
  recoveryMachine,
  nextRecoveryStage,
  isMaxAttemptsReached,
  MAX_RECOVERY_ATTEMPTS,
} from './recovery.machine'

function startActor(
  overrides: Partial<{
    causeCode: string
    by: string
    attemptCount: number
  }> = {},
) {
  const actor = createActor(recoveryMachine, {
    input: {
      stepExecutionId: 'SE-001',
      workOrderId: 'WO-001',
      causeCode: overrides.causeCode ?? 'leak_test_fail',
      by: overrides.by ?? 'op-1',
      ...(overrides.attemptCount !== undefined
        ? { attemptCount: overrides.attemptCount }
        : {}),
    },
  })
  actor.start()
  return actor
}

describe('recoveryMachine — initial state', () => {
  it('starts in diagnosis', () => {
    const actor = startActor()
    expect(actor.getSnapshot().value).toBe('diagnosis')
    actor.stop()
  })

  it('initializes context with cause code, attempt 0, empty notes', () => {
    const actor = startActor()
    const ctx = actor.getSnapshot().context
    expect(ctx.causeCode).toBe('leak_test_fail')
    expect(ctx.attemptCount).toBe(0)
    expect(ctx.notes).toEqual([])
    expect(ctx.diagnosisNotes).toBeNull()
    expect(ctx.scrapReason).toBeNull()
    actor.stop()
  })

  it('preserves attemptCount from input (resume case)', () => {
    const actor = createActor(recoveryMachine, {
      input: {
        stepExecutionId: 'SE-1',
        workOrderId: 'WO-1',
        by: 'op-1',
        attemptCount: 1,
      },
    })
    actor.start()
    expect(actor.getSnapshot().context.attemptCount).toBe(1)
    actor.stop()
  })
})

describe('recoveryMachine — diagnosis stage', () => {
  it('diagnosis → attempt_1 on BEGIN_ATTEMPT', () => {
    const actor = startActor()
    actor.send({ type: 'BEGIN_ATTEMPT', by: 'op-1' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('attempt_1')
    expect(snap.context.attemptCount).toBe(1)
    actor.stop()
  })

  it('BEGIN_ATTEMPT records diagnosisNotes when provided', () => {
    const actor = startActor()
    actor.send({
      type: 'BEGIN_ATTEMPT',
      by: 'op-1',
      diagnosisNotes: 'leak at fitting',
    })
    const ctx = actor.getSnapshot().context
    expect(ctx.diagnosisNotes).toBe('leak at fitting')
    expect(ctx.notes).toContain('diagnosis: leak at fitting')
    actor.stop()
  })

  it('diagnosis → scrap on SCRAP records reason', () => {
    const actor = startActor()
    actor.send({ type: 'SCRAP', by: 'sup-1', reason: 'unrecoverable damage' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('scrap')
    expect(snap.context.scrapReason).toBe('unrecoverable damage')
    expect(snap.context.notes).toContain(
      'scrap_at_diagnosis: unrecoverable damage',
    )
    actor.stop()
  })

  it('RECORD_NOTE in diagnosis appends to notes without changing state', () => {
    const actor = startActor()
    actor.send({ type: 'RECORD_NOTE', by: 'op-1', note: 'observed crack' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('diagnosis')
    expect(snap.context.notes).toContain('observed crack')
    actor.stop()
  })
})

describe('recoveryMachine — attempt_1 stage', () => {
  it('attempt_1 → recovered on ATTEMPT_OK', () => {
    const actor = startActor()
    actor.send({ type: 'BEGIN_ATTEMPT', by: 'op-1' })
    actor.send({ type: 'ATTEMPT_OK', by: 'op-1', notes: 'reseated fitting' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('recovered')
    expect(snap.context.notes).toContain('attempt_1_ok: reseated fitting')
    actor.stop()
  })

  it('attempt_1 → attempt_2 on ATTEMPT_NOK and bumps attemptCount to 2', () => {
    const actor = startActor()
    actor.send({ type: 'BEGIN_ATTEMPT', by: 'op-1' })
    actor.send({
      type: 'ATTEMPT_NOK',
      by: 'op-1',
      notes: 'still leaking',
    })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('attempt_2')
    expect(snap.context.attemptCount).toBe(2)
    expect(snap.context.notes).toContain('attempt_1_nok: still leaking')
    actor.stop()
  })

  it('attempt_1 → scrap on SCRAP records reason', () => {
    const actor = startActor()
    actor.send({ type: 'BEGIN_ATTEMPT', by: 'op-1' })
    actor.send({ type: 'SCRAP', by: 'sup-1', reason: 'cracked beyond repair' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('scrap')
    expect(snap.context.scrapReason).toBe('cracked beyond repair')
    actor.stop()
  })
})

describe('recoveryMachine — attempt_2 stage (max attempts)', () => {
  it('attempt_2 → recovered on ATTEMPT_OK (last-chance success)', () => {
    const actor = startActor()
    actor.send({ type: 'BEGIN_ATTEMPT', by: 'op-1' })
    actor.send({ type: 'ATTEMPT_NOK', by: 'op-1' })
    actor.send({
      type: 'ATTEMPT_OK',
      by: 'op-1',
      notes: 'replaced o-ring',
    })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('recovered')
    expect(snap.context.notes).toContain('attempt_2_ok: replaced o-ring')
    actor.stop()
  })

  it('attempt_2 → scrap on ATTEMPT_NOK auto-scraps with reason auto_scrap_max_attempts', () => {
    const actor = startActor()
    actor.send({ type: 'BEGIN_ATTEMPT', by: 'op-1' })
    actor.send({ type: 'ATTEMPT_NOK', by: 'op-1' })
    actor.send({ type: 'ATTEMPT_NOK', by: 'op-1' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('scrap')
    expect(snap.context.scrapReason).toBe('auto_scrap_max_attempts')
    expect(snap.context.notes).toContain('attempt_2_nok_auto_scrap')
    actor.stop()
  })

  it('attempt_2 → scrap on explicit SCRAP records reason', () => {
    const actor = startActor()
    actor.send({ type: 'BEGIN_ATTEMPT', by: 'op-1' })
    actor.send({ type: 'ATTEMPT_NOK', by: 'op-1' })
    actor.send({
      type: 'SCRAP',
      by: 'sup-1',
      reason: 'physical damage confirmed',
    })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('scrap')
    expect(snap.context.scrapReason).toBe('physical damage confirmed')
    actor.stop()
  })
})

describe('recoveryMachine — terminal states', () => {
  it('recovered is a final state', () => {
    const actor = startActor()
    actor.send({ type: 'BEGIN_ATTEMPT', by: 'op-1' })
    actor.send({ type: 'ATTEMPT_OK', by: 'op-1' })
    expect(actor.getSnapshot().status).toBe('done')
    actor.stop()
  })

  it('scrap is a final state', () => {
    const actor = startActor()
    actor.send({ type: 'SCRAP', by: 'sup-1', reason: 'test' })
    expect(actor.getSnapshot().status).toBe('done')
    actor.stop()
  })
})

describe('nextRecoveryStage helper', () => {
  it('diagnosis + begin → attempt_1', () => {
    expect(nextRecoveryStage('diagnosis', 'begin')).toBe('attempt_1')
  })

  it('attempt_1 + nok → attempt_2', () => {
    expect(nextRecoveryStage('attempt_1', 'nok')).toBe('attempt_2')
  })

  it('attempt_2 + nok → scrap (auto)', () => {
    expect(nextRecoveryStage('attempt_2', 'nok')).toBe('scrap')
  })

  it('any stage + ok → recovered', () => {
    expect(nextRecoveryStage('attempt_1', 'ok')).toBe('recovered')
    expect(nextRecoveryStage('attempt_2', 'ok')).toBe('recovered')
    expect(nextRecoveryStage('diagnosis', 'ok')).toBe('recovered')
  })

  it('any stage + scrap → scrap', () => {
    expect(nextRecoveryStage('diagnosis', 'scrap')).toBe('scrap')
    expect(nextRecoveryStage('attempt_1', 'scrap')).toBe('scrap')
    expect(nextRecoveryStage('attempt_2', 'scrap')).toBe('scrap')
  })
})

describe('isMaxAttemptsReached helper', () => {
  it('returns false below max attempts', () => {
    expect(isMaxAttemptsReached(0)).toBe(false)
    expect(isMaxAttemptsReached(1)).toBe(false)
  })

  it('returns true at max attempts', () => {
    expect(isMaxAttemptsReached(MAX_RECOVERY_ATTEMPTS)).toBe(true)
  })

  it('returns true above max attempts', () => {
    expect(isMaxAttemptsReached(3)).toBe(true)
  })
})

import { describe, it, expect } from 'vitest'
import { createActor } from 'xstate'
import { stepExecutionMachine } from './step-execution.machine'

function startActor(
  overrides: Partial<{
    stepCategory: string
    operatorId: string | null
    by: string
  }> = {},
) {
  const actor = createActor(stepExecutionMachine, {
    input: {
      stepExecutionId: 'SE-001',
      workOrderId: 'WO-001',
      stepId: 'STEP-001',
      stepCategory: overrides.stepCategory ?? 'production',
      operatorId: overrides.operatorId ?? null,
      by: overrides.by ?? 'operator-1',
    },
  })
  actor.start()
  return actor
}

describe('stepExecutionMachine', () => {
  it('starts in pending', () => {
    const actor = startActor()
    expect(actor.getSnapshot().value).toBe('pending')
    actor.stop()
  })

  it('initializes context with defaults', () => {
    const actor = startActor()
    const ctx = actor.getSnapshot().context
    expect(ctx.stepExecutionId).toBe('SE-001')
    expect(ctx.workOrderId).toBe('WO-001')
    expect(ctx.stepId).toBe('STEP-001')
    expect(ctx.startedAt).toBeNull()
    expect(ctx.elapsedSec).toBe(0)
    expect(ctx.notes).toEqual([])
    expect(ctx.errorCode).toBeNull()
    actor.stop()
  })

  it('pending → running on START and sets startedAt', () => {
    const actor = startActor()
    actor.send({ type: 'START', by: 'op' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('running')
    expect(snap.context.startedAt).not.toBeNull()
    actor.stop()
  })

  it('ASSIGN_OPERATOR on pending updates operatorId without changing state', () => {
    const actor = startActor()
    actor.send({ type: 'ASSIGN_OPERATOR', by: 'admin', operatorId: 'op-42' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('pending')
    expect(snap.context.operatorId).toBe('op-42')
    actor.stop()
  })

  it('running → done on COMPLETE_OK', () => {
    const actor = startActor()
    actor.send({ type: 'START', by: 'op' })
    actor.send({ type: 'COMPLETE_OK', by: 'op', durationSec: 42 })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('done')
    expect(snap.context.elapsedSec).toBe(42)
    actor.stop()
  })

  it('running → blocked on COMPLETE_NOK and stores causeCode + note', () => {
    const actor = startActor()
    actor.send({ type: 'START', by: 'op' })
    actor.send({
      type: 'COMPLETE_NOK',
      by: 'op',
      causeCode: 'leak_test_fail',
      notes: 'pressure dropped',
    })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('blocked')
    expect(snap.context.causeCode).toBe('leak_test_fail')
    expect(snap.context.notes).toContain('nok: pressure dropped')
    actor.stop()
  })

  it('running → paused → running on RESUME', () => {
    const actor = startActor()
    actor.send({ type: 'START', by: 'op' })
    actor.send({ type: 'PAUSE', by: 'op', reason: 'break' })
    expect(actor.getSnapshot().value).toBe('paused')
    expect(actor.getSnapshot().context.notes).toContain('paused: break')
    actor.send({ type: 'RESUME', by: 'op' })
    expect(actor.getSnapshot().value).toBe('running')
    actor.stop()
  })

  it('REQUEST_QC is blocked when stepCategory is not quality_control', () => {
    const actor = startActor({ stepCategory: 'production' })
    actor.send({ type: 'START', by: 'op' })
    actor.send({ type: 'REQUEST_QC', by: 'op' })
    expect(actor.getSnapshot().value).toBe('running')
    actor.stop()
  })

  it('REQUEST_QC moves running → qc_hold when stepCategory=quality_control', () => {
    const actor = startActor({ stepCategory: 'quality_control' })
    actor.send({ type: 'START', by: 'op' })
    actor.send({ type: 'REQUEST_QC', by: 'op' })
    expect(actor.getSnapshot().value).toBe('qc_hold')
    actor.stop()
  })

  it('qc_hold → done on QC_APPROVE', () => {
    const actor = startActor({ stepCategory: 'quality_control' })
    actor.send({ type: 'START', by: 'op' })
    actor.send({ type: 'REQUEST_QC', by: 'op' })
    actor.send({ type: 'QC_APPROVE', by: 'sup', approverId: 'sup-1' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('done')
    expect(snap.context.notes).toContain('qc_approve: sup-1')
    actor.stop()
  })

  it('qc_hold → blocked on QC_REJECT and sets causeCode=qc_reject', () => {
    const actor = startActor({ stepCategory: 'quality_control' })
    actor.send({ type: 'START', by: 'op' })
    actor.send({ type: 'REQUEST_QC', by: 'op' })
    actor.send({
      type: 'QC_REJECT',
      by: 'sup',
      approverId: 'sup-1',
      reason: 'visual defect',
    })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('blocked')
    expect(snap.context.causeCode).toBe('qc_reject')
    expect(snap.context.notes.some((n) => n.includes('qc_reject by sup-1'))).toBe(
      true,
    )
    actor.stop()
  })

  it('blocked → scrapped on MARK_SCRAPPED', () => {
    const actor = startActor()
    actor.send({ type: 'START', by: 'op' })
    actor.send({
      type: 'COMPLETE_NOK',
      by: 'op',
      causeCode: 'damage',
    })
    actor.send({ type: 'MARK_SCRAPPED', by: 'sup', reason: 'irreparable' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('scrapped')
    expect(snap.context.notes).toContain('scrapped: irreparable')
    actor.stop()
  })

  it('blocked → recovered on RECOVER', () => {
    const actor = startActor()
    actor.send({ type: 'START', by: 'op' })
    actor.send({ type: 'COMPLETE_NOK', by: 'op', causeCode: 'leak' })
    actor.send({ type: 'RECOVER', by: 'tech', notes: 'reseated o-ring' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('recovered')
    expect(snap.context.notes).toContain('recover: reseated o-ring')
    actor.stop()
  })

  it('scrapped → recovered on RECOVER (recover-after-scrap path)', () => {
    const actor = startActor()
    actor.send({ type: 'START', by: 'op' })
    actor.send({ type: 'COMPLETE_NOK', by: 'op', causeCode: 'crack' })
    actor.send({ type: 'MARK_SCRAPPED', by: 'sup', reason: 'crack' })
    actor.send({ type: 'RECOVER', by: 'tech', notes: 'salvaged sub-component' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('recovered')
    expect(snap.context.notes).toContain('recover_after_scrap: salvaged sub-component')
    actor.stop()
  })

  it('recovered → running on RESUME_AFTER_RECOVERY', () => {
    const actor = startActor()
    actor.send({ type: 'START', by: 'op' })
    actor.send({ type: 'COMPLETE_NOK', by: 'op', causeCode: 'leak' })
    actor.send({ type: 'RECOVER', by: 'tech' })
    actor.send({ type: 'RESUME_AFTER_RECOVERY', by: 'op' })
    expect(actor.getSnapshot().value).toBe('running')
    actor.stop()
  })

  it('recovered → done on COMPLETE_AFTER_RECOVERY', () => {
    const actor = startActor()
    actor.send({ type: 'START', by: 'op' })
    actor.send({ type: 'COMPLETE_NOK', by: 'op', causeCode: 'leak' })
    actor.send({ type: 'RECOVER', by: 'tech' })
    actor.send({ type: 'COMPLETE_AFTER_RECOVERY', by: 'sup' })
    expect(actor.getSnapshot().value).toBe('done')
    actor.stop()
  })

  it('SKIP from pending → skipped (terminal)', () => {
    const actor = startActor()
    actor.send({ type: 'SKIP', by: 'sup', reason: 'not applicable' })
    expect(actor.getSnapshot().value).toBe('skipped')
    actor.stop()
  })

  it('SKIP from running → skipped', () => {
    const actor = startActor()
    actor.send({ type: 'START', by: 'op' })
    actor.send({ type: 'SKIP', by: 'sup', reason: 'no material' })
    expect(actor.getSnapshot().value).toBe('skipped')
    actor.stop()
  })

  it('SKIP from paused → skipped', () => {
    const actor = startActor()
    actor.send({ type: 'START', by: 'op' })
    actor.send({ type: 'PAUSE', by: 'op' })
    actor.send({ type: 'SKIP', by: 'sup', reason: 'abandoned' })
    expect(actor.getSnapshot().value).toBe('skipped')
    actor.stop()
  })

  it('SKIP from blocked → skipped', () => {
    const actor = startActor()
    actor.send({ type: 'START', by: 'op' })
    actor.send({ type: 'COMPLETE_NOK', by: 'op', causeCode: 'fail' })
    actor.send({ type: 'SKIP', by: 'sup', reason: 'redo elsewhere' })
    expect(actor.getSnapshot().value).toBe('skipped')
    actor.stop()
  })

  it('CANCEL from running → cancelled', () => {
    const actor = startActor()
    actor.send({ type: 'START', by: 'op' })
    actor.send({ type: 'CANCEL', by: 'sup', reason: 'wo cancelled' })
    expect(actor.getSnapshot().value).toBe('cancelled')
    actor.stop()
  })

  it('CANCEL from blocked → cancelled', () => {
    const actor = startActor()
    actor.send({ type: 'START', by: 'op' })
    actor.send({ type: 'COMPLETE_NOK', by: 'op', causeCode: 'x' })
    actor.send({ type: 'CANCEL', by: 'sup', reason: 'closeout' })
    expect(actor.getSnapshot().value).toBe('cancelled')
    actor.stop()
  })

  it('ERROR from running → error and captures errorCode/message', () => {
    const actor = startActor()
    actor.send({ type: 'START', by: 'op' })
    actor.send({
      type: 'ERROR',
      by: 'system',
      errorCode: 'DEVICE_TIMEOUT',
      message: 'extruder did not respond',
    })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('error')
    expect(snap.context.errorCode).toBe('DEVICE_TIMEOUT')
    expect(snap.context.errorMessage).toBe('extruder did not respond')
    actor.stop()
  })

  it('error → pending on RESET clears errorCode/message', () => {
    const actor = startActor()
    actor.send({ type: 'START', by: 'op' })
    actor.send({
      type: 'ERROR',
      by: 'system',
      errorCode: 'X',
      message: 'y',
    })
    actor.send({ type: 'RESET', by: 'admin', supervisorId: 'admin-1' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('pending')
    expect(snap.context.errorCode).toBeNull()
    expect(snap.context.errorMessage).toBeNull()
    expect(snap.context.notes).toContain('reset by admin-1')
    actor.stop()
  })

  it('TICK accumulates elapsedSec while running', () => {
    const actor = startActor()
    actor.send({ type: 'START', by: 'op' })
    actor.send({ type: 'TICK' })
    actor.send({ type: 'TICK', secondsDelta: 4 })
    expect(actor.getSnapshot().context.elapsedSec).toBe(5)
    actor.stop()
  })

  it('RECORD_NOTE appends to notes without changing state (running)', () => {
    const actor = startActor()
    actor.send({ type: 'START', by: 'op' })
    actor.send({ type: 'RECORD_NOTE', by: 'op', note: 'humidity 45%' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('running')
    expect(snap.context.notes).toEqual(['humidity 45%'])
    actor.stop()
  })

  it('RECORD_NOTE works in paused and blocked too', () => {
    const actor = startActor()
    actor.send({ type: 'START', by: 'op' })
    actor.send({ type: 'PAUSE', by: 'op' })
    actor.send({ type: 'RECORD_NOTE', by: 'op', note: 'paused-note' })
    actor.send({ type: 'RESUME', by: 'op' })
    actor.send({ type: 'COMPLETE_NOK', by: 'op', causeCode: 'x' })
    actor.send({ type: 'RECORD_NOTE', by: 'sup', note: 'blocked-note' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('blocked')
    expect(snap.context.notes).toContain('paused-note')
    expect(snap.context.notes).toContain('blocked-note')
    actor.stop()
  })

  it('done is final — events are no-ops after completion', () => {
    const actor = startActor()
    actor.send({ type: 'START', by: 'op' })
    actor.send({ type: 'COMPLETE_OK', by: 'op' })
    const before = actor.getSnapshot()
    expect(before.status).toBe('done')
    actor.send({ type: 'PAUSE', by: 'op' })
    actor.send({ type: 'CANCEL', by: 'sup', reason: 'too late' })
    const after = actor.getSnapshot()
    expect(after.value).toBe('done')
    actor.stop()
  })

  it('cancelled is final', () => {
    const actor = startActor()
    actor.send({ type: 'CANCEL', by: 'sup', reason: 'x' })
    expect(actor.getSnapshot().status).toBe('done')
    expect(actor.getSnapshot().value).toBe('cancelled')
    actor.stop()
  })

  it('skipped is final', () => {
    const actor = startActor()
    actor.send({ type: 'SKIP', by: 'sup', reason: 'x' })
    expect(actor.getSnapshot().status).toBe('done')
    expect(actor.getSnapshot().value).toBe('skipped')
    actor.stop()
  })

  it('lastTransitionAt and lastTransitionBy update on every transition', () => {
    const actor = startActor()
    const t0 = actor.getSnapshot().context.lastTransitionAt
    actor.send({ type: 'START', by: 'op-7' })
    const ctx = actor.getSnapshot().context
    expect(ctx.lastTransitionBy).toBe('op-7')
    expect(ctx.lastTransitionAt >= t0).toBe(true)
    actor.stop()
  })

  it('full happy path: pending → running → done', () => {
    const actor = startActor()
    actor.send({ type: 'START', by: 'op' })
    actor.send({ type: 'COMPLETE_OK', by: 'op', durationSec: 30 })
    expect(actor.getSnapshot().value).toBe('done')
    expect(actor.getSnapshot().context.elapsedSec).toBe(30)
    actor.stop()
  })

  it('full recovery path: running → blocked → scrapped → recovered → done', () => {
    const actor = startActor()
    actor.send({ type: 'START', by: 'op' })
    actor.send({ type: 'COMPLETE_NOK', by: 'op', causeCode: 'fail' })
    actor.send({ type: 'MARK_SCRAPPED', by: 'sup', reason: 'irreparable' })
    actor.send({ type: 'RECOVER', by: 'tech', notes: 'partial recovery' })
    actor.send({ type: 'COMPLETE_AFTER_RECOVERY', by: 'sup' })
    expect(actor.getSnapshot().value).toBe('done')
    actor.stop()
  })

  it('CANCEL works from error state', () => {
    const actor = startActor()
    actor.send({ type: 'START', by: 'op' })
    actor.send({
      type: 'ERROR',
      by: 'system',
      errorCode: 'X',
      message: 'y',
    })
    actor.send({ type: 'CANCEL', by: 'admin', reason: 'unrecoverable' })
    expect(actor.getSnapshot().value).toBe('cancelled')
    actor.stop()
  })
})

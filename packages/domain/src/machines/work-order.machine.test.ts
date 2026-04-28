import { describe, it, expect } from 'vitest'
import { createActor } from 'xstate'
import { workOrderMachine } from './work-order.machine.js'

function startActor(qtyTarget = 10, by = 'planner') {
  const actor = createActor(workOrderMachine, {
    input: { workOrderId: 'WO-001', qtyTarget, by },
  })
  actor.start()
  return actor
}

describe('workOrderMachine', () => {
  it('starts in draft', () => {
    const actor = startActor()
    expect(actor.getSnapshot().value).toBe('draft')
    actor.stop()
  })

  it('draft → planned → released → in_progress', () => {
    const actor = startActor()
    actor.send({ type: 'PLAN', by: 'planner' })
    expect(actor.getSnapshot().value).toBe('planned')
    actor.send({ type: 'RELEASE', by: 'planner' })
    expect(actor.getSnapshot().value).toBe('released')
    actor.send({ type: 'START', by: 'operator' })
    expect(actor.getSnapshot().value).toBe('in_progress')
    actor.stop()
  })

  it('records output quantities', () => {
    const actor = startActor()
    actor.send({ type: 'PLAN', by: 'planner' })
    actor.send({ type: 'RELEASE', by: 'planner' })
    actor.send({ type: 'START', by: 'operator' })
    actor.send({ type: 'RECORD_OUTPUT', qty: 5, good: 4, scrap: 1, by: 'operator' })
    const ctx = actor.getSnapshot().context
    expect(ctx.qtyProduced).toBe(5)
    expect(ctx.qtyGood).toBe(4)
    expect(ctx.qtyScrap).toBe(1)
    actor.stop()
  })

  it('in_progress → on_hold → in_progress (resume)', () => {
    const actor = startActor()
    actor.send({ type: 'PLAN', by: 'planner' })
    actor.send({ type: 'RELEASE', by: 'planner' })
    actor.send({ type: 'START', by: 'operator' })
    actor.send({ type: 'HOLD', reason: 'Material shortage', by: 'supervisor' })
    expect(actor.getSnapshot().value).toBe('on_hold')
    expect(actor.getSnapshot().context.holdReason).toBe('Material shortage')
    actor.send({ type: 'RESUME', by: 'supervisor' })
    expect(actor.getSnapshot().value).toBe('in_progress')
    expect(actor.getSnapshot().context.holdReason).toBeNull()
    actor.stop()
  })

  it('completes to partially_completed when qty < target', () => {
    const actor = startActor(10)
    actor.send({ type: 'PLAN', by: 'planner' })
    actor.send({ type: 'RELEASE', by: 'planner' })
    actor.send({ type: 'START', by: 'operator' })
    actor.send({ type: 'RECORD_OUTPUT', qty: 5, good: 5, scrap: 0, by: 'operator' })
    actor.send({ type: 'COMPLETE', by: 'supervisor' })
    expect(actor.getSnapshot().value).toBe('partially_completed')
    actor.stop()
  })

  it('completes to completed when qty >= target', () => {
    const actor = startActor(5)
    actor.send({ type: 'PLAN', by: 'planner' })
    actor.send({ type: 'RELEASE', by: 'planner' })
    actor.send({ type: 'START', by: 'operator' })
    actor.send({ type: 'RECORD_OUTPUT', qty: 5, good: 5, scrap: 0, by: 'operator' })
    actor.send({ type: 'COMPLETE', by: 'supervisor' })
    expect(actor.getSnapshot().value).toBe('completed')
    actor.stop()
  })

  it('completed → closed (terminal)', () => {
    const actor = startActor(5)
    actor.send({ type: 'PLAN', by: 'planner' })
    actor.send({ type: 'RELEASE', by: 'planner' })
    actor.send({ type: 'START', by: 'operator' })
    actor.send({ type: 'RECORD_OUTPUT', qty: 5, good: 5, scrap: 0, by: 'operator' })
    actor.send({ type: 'COMPLETE', by: 'supervisor' })
    actor.send({ type: 'CLOSE', by: 'admin' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('closed')
    expect(snap.status).toBe('done')
    actor.stop()
  })

  it('draft → cancelled', () => {
    const actor = startActor()
    actor.send({ type: 'CANCEL', by: 'planner' })
    expect(actor.getSnapshot().value).toBe('cancelled')
    actor.stop()
  })
})

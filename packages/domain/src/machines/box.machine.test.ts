import { describe, it, expect } from 'vitest'
import { createActor } from 'xstate'
import { boxMachine } from './box.machine.js'

function startActor(maxUnits = 20) {
  const actor = createActor(boxMachine, {
    input: { boxId: 'BOX-001', boxTypeId: 'BT-STD', maxUnits, by: 'system' },
  })
  actor.start()
  return actor
}

describe('boxMachine', () => {
  it('starts in empty state', () => {
    const actor = startActor()
    expect(actor.getSnapshot().value).toBe('empty')
    actor.stop()
  })

  it('empty → filling via START_FILLING', () => {
    const actor = startActor()
    actor.send({ type: 'START_FILLING', workOrderId: 'WO-001', lotId: 'LOT-001', by: 'operator' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('filling')
    expect(snap.context.workOrderId).toBe('WO-001')
    expect(snap.context.lotId).toBe('LOT-001')
    actor.stop()
  })

  it('filling: ADD_UNITS increments currentUnits', () => {
    const actor = startActor(20)
    actor.send({ type: 'START_FILLING', workOrderId: 'WO-001', lotId: 'LOT-001', by: 'operator' })
    actor.send({ type: 'ADD_UNITS', qty: 10, by: 'operator' })
    expect(actor.getSnapshot().context.currentUnits).toBe(10)
    actor.send({ type: 'ADD_UNITS', qty: 5, by: 'operator' })
    expect(actor.getSnapshot().context.currentUnits).toBe(15)
    actor.stop()
  })

  it('ADD_UNITS caps at maxUnits', () => {
    const actor = startActor(10)
    actor.send({ type: 'START_FILLING', workOrderId: 'WO-001', lotId: 'LOT-001', by: 'operator' })
    actor.send({ type: 'ADD_UNITS', qty: 15, by: 'operator' }) // 15 > maxUnits=10
    expect(actor.getSnapshot().context.currentUnits).toBe(10)
    actor.stop()
  })

  it('filling → full → sealed', () => {
    const actor = startActor()
    actor.send({ type: 'START_FILLING', workOrderId: 'WO-001', lotId: 'LOT-001', by: 'operator' })
    actor.send({ type: 'ADD_UNITS', qty: 20, by: 'operator' })
    actor.send({ type: 'MARK_FULL', by: 'operator' })
    expect(actor.getSnapshot().value).toBe('full')
    actor.send({ type: 'SEAL', by: 'supervisor' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('sealed')
    expect(snap.context.sealedAt).not.toBeNull()
    actor.stop()
  })

  it('MARK_FULL blocked when currentUnits is 0', () => {
    const actor = startActor()
    actor.send({ type: 'START_FILLING', workOrderId: 'WO-001', lotId: 'LOT-001', by: 'operator' })
    actor.send({ type: 'MARK_FULL', by: 'operator' })
    expect(actor.getSnapshot().value).toBe('filling') // guard prevents it
    actor.stop()
  })

  it('full → filling via REOPEN', () => {
    const actor = startActor()
    actor.send({ type: 'START_FILLING', workOrderId: 'WO-001', lotId: 'LOT-001', by: 'operator' })
    actor.send({ type: 'ADD_UNITS', qty: 20, by: 'operator' })
    actor.send({ type: 'MARK_FULL', by: 'operator' })
    actor.send({ type: 'REOPEN', by: 'supervisor' })
    expect(actor.getSnapshot().value).toBe('filling')
    actor.stop()
  })

  it('sealed → shipped → returned', () => {
    const actor = startActor()
    actor.send({ type: 'START_FILLING', workOrderId: 'WO-001', lotId: 'LOT-001', by: 'operator' })
    actor.send({ type: 'ADD_UNITS', qty: 10, by: 'operator' })
    actor.send({ type: 'MARK_FULL', by: 'operator' })
    actor.send({ type: 'SEAL', by: 'supervisor' })
    actor.send({ type: 'SHIP', by: 'logistics' })
    expect(actor.getSnapshot().value).toBe('shipped')
    actor.send({ type: 'RETURN', by: 'logistics' })
    expect(actor.getSnapshot().value).toBe('returned')
    actor.stop()
  })

  it('any state → rejected (terminal)', () => {
    const actor = startActor()
    actor.send({ type: 'REJECT', by: 'quality' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('rejected')
    expect(snap.status).toBe('done')
    actor.stop()
  })
})

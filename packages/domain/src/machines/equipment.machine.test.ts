import { describe, it, expect } from 'vitest'
import { createActor } from 'xstate'
import { equipmentMachine } from './equipment.machine.js'

function startActor(equipmentId = 'EQ-001', by = 'admin') {
  const actor = createActor(equipmentMachine, { input: { equipmentId, by } })
  actor.start()
  return actor
}

describe('equipmentMachine', () => {
  it('starts in offline state', () => {
    const actor = startActor()
    expect(actor.getSnapshot().value).toBe('offline')
    actor.stop()
  })

  it('offline → available via ACTIVATE', () => {
    const actor = startActor()
    actor.send({ type: 'ACTIVATE', by: 'admin' })
    expect(actor.getSnapshot().value).toBe('available')
    actor.stop()
  })

  it('available → reserved via RESERVE', () => {
    const actor = startActor()
    actor.send({ type: 'ACTIVATE', by: 'admin' })
    actor.send({ type: 'RESERVE', workOrderId: 'WO-001', by: 'planner' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('reserved')
    expect(snap.context.reservedByWorkOrderId).toBe('WO-001')
    actor.stop()
  })

  it('reserved → in_use via START_USE (correct WO)', () => {
    const actor = startActor()
    actor.send({ type: 'ACTIVATE', by: 'admin' })
    actor.send({ type: 'RESERVE', workOrderId: 'WO-001', by: 'planner' })
    actor.send({ type: 'START_USE', workOrderId: 'WO-001', by: 'operator' })
    expect(actor.getSnapshot().value).toBe('in_use')
    actor.stop()
  })

  it('START_USE is blocked for wrong work order ID', () => {
    const actor = startActor()
    actor.send({ type: 'ACTIVATE', by: 'admin' })
    actor.send({ type: 'RESERVE', workOrderId: 'WO-001', by: 'planner' })
    actor.send({ type: 'START_USE', workOrderId: 'WO-WRONG', by: 'operator' })
    expect(actor.getSnapshot().value).toBe('reserved') // guard prevents transition
    actor.stop()
  })

  it('in_use → available via FINISH_USE', () => {
    const actor = startActor()
    actor.send({ type: 'ACTIVATE', by: 'admin' })
    actor.send({ type: 'RESERVE', workOrderId: 'WO-001', by: 'planner' })
    actor.send({ type: 'START_USE', workOrderId: 'WO-001', by: 'operator' })
    actor.send({ type: 'FINISH_USE', by: 'operator' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('available')
    expect(snap.context.currentWorkOrderId).toBeNull()
    actor.stop()
  })

  it('available → cleaning → available', () => {
    const actor = startActor()
    actor.send({ type: 'ACTIVATE', by: 'admin' })
    actor.send({ type: 'START_CLEANING', by: 'operator' })
    expect(actor.getSnapshot().value).toBe('cleaning')
    actor.send({ type: 'FINISH_CLEANING', by: 'operator' })
    expect(actor.getSnapshot().value).toBe('available')
    actor.stop()
  })

  it('available → maintenance → available', () => {
    const actor = startActor()
    actor.send({ type: 'ACTIVATE', by: 'admin' })
    actor.send({ type: 'START_MAINTENANCE', maintenanceOrderId: 'MNT-001', by: 'tech' })
    expect(actor.getSnapshot().value).toBe('maintenance')
    actor.send({ type: 'FINISH_MAINTENANCE', by: 'tech' })
    expect(actor.getSnapshot().value).toBe('available')
    actor.stop()
  })

  it('in_use → broken via REPORT_BREAKDOWN', () => {
    const actor = startActor()
    actor.send({ type: 'ACTIVATE', by: 'admin' })
    actor.send({ type: 'RESERVE', workOrderId: 'WO-001', by: 'planner' })
    actor.send({ type: 'START_USE', workOrderId: 'WO-001', by: 'operator' })
    actor.send({ type: 'REPORT_BREAKDOWN', by: 'operator' })
    expect(actor.getSnapshot().value).toBe('broken')
    actor.stop()
  })

  it('broken → maintenance → available', () => {
    const actor = startActor()
    actor.send({ type: 'ACTIVATE', by: 'admin' })
    actor.send({ type: 'RESERVE', workOrderId: 'WO-001', by: 'planner' })
    actor.send({ type: 'START_USE', workOrderId: 'WO-001', by: 'operator' })
    actor.send({ type: 'REPORT_BREAKDOWN', by: 'operator' })
    actor.send({ type: 'START_MAINTENANCE', maintenanceOrderId: 'MNT-002', by: 'tech' })
    actor.send({ type: 'FINISH_MAINTENANCE', by: 'tech' })
    expect(actor.getSnapshot().value).toBe('available')
    actor.stop()
  })

  it('any state → decommissioned is terminal', () => {
    const actor = startActor()
    actor.send({ type: 'ACTIVATE', by: 'admin' })
    actor.send({ type: 'DECOMMISSION', by: 'admin' })
    const snap = actor.getSnapshot()
    expect(snap.value).toBe('decommissioned')
    expect(snap.status).toBe('done')
    actor.stop()
  })

  it('available → offline via TAKE_OFFLINE', () => {
    const actor = startActor()
    actor.send({ type: 'ACTIVATE', by: 'admin' })
    actor.send({ type: 'TAKE_OFFLINE', by: 'admin' })
    expect(actor.getSnapshot().value).toBe('offline')
    actor.stop()
  })
})

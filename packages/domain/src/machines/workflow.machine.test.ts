import { describe, it, expect } from 'vitest'
import { createActor } from 'xstate'
import { workflowVersionMachine } from './workflow.machine'

function startActor(by = 'engineer') {
  const actor = createActor(workflowVersionMachine, {
    input: { versionId: 'VER-001', workflowId: 'WF-001', by },
  })
  actor.start()
  return actor
}

describe('workflowVersionMachine', () => {
  it('starts in draft', () => {
    const actor = startActor()
    expect(actor.getSnapshot().value).toBe('draft')
    actor.stop()
  })

  it('initializes context correctly', () => {
    const actor = startActor('admin')
    const ctx = actor.getSnapshot().context
    expect(ctx.versionId).toBe('VER-001')
    expect(ctx.workflowId).toBe('WF-001')
    expect(ctx.lastTransitionBy).toBe('admin')
    expect(ctx.approvedBy).toBeNull()
    expect(ctx.approvedAt).toBeNull()
    actor.stop()
  })

  it('draft → approved (valid transition)', () => {
    const actor = startActor()
    actor.send({ type: 'APPROVE', by: 'quality-manager' })
    expect(actor.getSnapshot().value).toBe('approved')
    actor.stop()
  })

  it('APPROVE sets approvedBy and approvedAt in context', () => {
    const actor = startActor()
    actor.send({ type: 'APPROVE', by: 'quality-manager' })
    const ctx = actor.getSnapshot().context
    expect(ctx.approvedBy).toBe('quality-manager')
    expect(ctx.approvedAt).not.toBeNull()
    expect(ctx.lastTransitionBy).toBe('quality-manager')
    actor.stop()
  })

  it('draft → deprecated (direct deprecation, valid)', () => {
    const actor = startActor()
    actor.send({ type: 'DEPRECATE', by: 'engineer' })
    expect(actor.getSnapshot().value).toBe('deprecated')
    actor.stop()
  })

  it('approved → deprecated (valid)', () => {
    const actor = startActor()
    actor.send({ type: 'APPROVE', by: 'qm' })
    actor.send({ type: 'DEPRECATE', by: 'admin' })
    expect(actor.getSnapshot().value).toBe('deprecated')
    actor.stop()
  })

  it('DEPRECATE from approved records lastTransitionBy', () => {
    const actor = startActor()
    actor.send({ type: 'APPROVE', by: 'qm' })
    actor.send({ type: 'DEPRECATE', by: 'admin' })
    expect(actor.getSnapshot().context.lastTransitionBy).toBe('admin')
    actor.stop()
  })

  it('deprecated is a final (terminal) state', () => {
    const actor = startActor()
    actor.send({ type: 'DEPRECATE', by: 'engineer' })
    const snap = actor.getSnapshot()
    expect(snap.status).toBe('done')
    actor.stop()
  })

  it('EDIT in draft keeps state as draft (self-loop)', () => {
    const actor = startActor()
    actor.send({ type: 'EDIT', by: 'engineer' })
    expect(actor.getSnapshot().value).toBe('draft')
    actor.stop()
  })

  it('EDIT in draft updates lastTransitionBy', () => {
    const actor = startActor('original')
    actor.send({ type: 'EDIT', by: 'editor' })
    expect(actor.getSnapshot().context.lastTransitionBy).toBe('editor')
    actor.stop()
  })

  it('approved → draft is rejected (state stays approved)', () => {
    const actor = startActor()
    actor.send({ type: 'APPROVE', by: 'qm' })
    // EDIT event does not exist in approved state — ignored
    actor.send({ type: 'EDIT', by: 'engineer' })
    expect(actor.getSnapshot().value).toBe('approved')
    actor.stop()
  })

  it('approved → approved is rejected (APPROVE ignored in approved state)', () => {
    const actor = startActor()
    actor.send({ type: 'APPROVE', by: 'qm' })
    actor.send({ type: 'APPROVE', by: 'qm2' })
    expect(actor.getSnapshot().value).toBe('approved')
    // approvedBy did not change to qm2
    expect(actor.getSnapshot().context.approvedBy).toBe('qm')
    actor.stop()
  })

  it('deprecated → draft is rejected (deprecated is final)', () => {
    const actor = startActor()
    actor.send({ type: 'DEPRECATE', by: 'engineer' })
    actor.send({ type: 'EDIT', by: 'engineer' })
    expect(actor.getSnapshot().value).toBe('deprecated')
    actor.stop()
  })

  it('deprecated → approved is rejected (deprecated is final)', () => {
    const actor = startActor()
    actor.send({ type: 'DEPRECATE', by: 'engineer' })
    actor.send({ type: 'APPROVE', by: 'qm' })
    expect(actor.getSnapshot().value).toBe('deprecated')
    actor.stop()
  })
})

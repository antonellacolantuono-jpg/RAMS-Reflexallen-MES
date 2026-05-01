import { describe, it, expect, vi } from 'vitest'
import { WorkOrderEventsGateway } from './work-order-events.gateway'

interface FakeServer {
  emit: ReturnType<typeof vi.fn>
  to: ReturnType<typeof vi.fn>
}

function makeGateway() {
  const roomEmit = vi.fn()
  const to = vi.fn().mockReturnValue({ emit: roomEmit })
  const emit = vi.fn()
  const server: FakeServer = { emit, to }
  const gateway = new WorkOrderEventsGateway()
  // The @WebSocketServer() decorator normally injects the server. For unit
  // tests we set the private field directly.
  ;(gateway as unknown as { server: FakeServer }).server = server
  return { gateway, emit, to, roomEmit }
}

describe('WorkOrderEventsGateway', () => {
  it('emitWoReleased broadcasts on the wo:released channel (no room)', () => {
    const { gateway, emit, to } = makeGateway()
    const payload = {
      workOrderId: 'wo-1',
      code: 'WO-20260501-001',
      releasedAt: '2026-05-01T10:00:00.000Z',
      releasedBy: 'op-mgr',
    }
    gateway.emitWoReleased(payload)
    expect(to).not.toHaveBeenCalled()
    expect(emit).toHaveBeenCalledOnce()
    expect(emit).toHaveBeenCalledWith('wo:released', payload)
  })

  it('emitWoAssigned routes to op:{operatorId} room', () => {
    const { gateway, to, roomEmit, emit } = makeGateway()
    const payload = {
      workOrderId: 'wo-1',
      code: 'WO-20260501-001',
      operatorId: 'op-2',
      assignedAt: '2026-05-01T10:00:00.000Z',
    }
    gateway.emitWoAssigned(payload)
    expect(to).toHaveBeenCalledWith('op:op-2')
    expect(roomEmit).toHaveBeenCalledWith('wo:assigned', payload)
    expect(emit).not.toHaveBeenCalled()
  })

  it('emitStepTransition routes to wo:{workOrderId} room (regression D3)', () => {
    const { gateway, to, roomEmit } = makeGateway()
    const payload = {
      workOrderId: 'wo-1',
      stepExecutionId: 'se-1',
      stepId: 'step-1',
      fromStatus: 'pending',
      toStatus: 'running',
      event: 'START',
      changedBy: 'op-1',
      changedAt: '2026-05-01T10:00:00.000Z',
    }
    gateway.emitStepTransition(payload)
    expect(to).toHaveBeenCalledWith('wo:wo-1')
    expect(roomEmit).toHaveBeenCalledWith('step:transition', payload)
  })

  it('emit functions are no-ops when server is undefined', () => {
    const gateway = new WorkOrderEventsGateway()
    expect(() =>
      gateway.emitWoReleased({
        workOrderId: 'wo-1',
        code: 'WO-x',
        releasedAt: 't',
        releasedBy: 'u',
      }),
    ).not.toThrow()
    expect(() =>
      gateway.emitWoAssigned({
        workOrderId: 'wo-1',
        code: 'WO-x',
        operatorId: 'o',
        assignedAt: 't',
      }),
    ).not.toThrow()
  })
})

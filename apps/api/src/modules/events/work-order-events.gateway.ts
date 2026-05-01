import { Injectable } from '@nestjs/common'
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import type { Server, Socket } from 'socket.io'

export interface StepTransitionPayload {
  workOrderId: string
  stepExecutionId: string
  stepId: string
  fromStatus: string
  toStatus: string
  event: string
  changedBy: string
  changedAt: string
}

export interface ParallelSyncPayload {
  workOrderId: string
  groupId: string
  triggeredByStepExecutionId: string
  triggeredAt: string
}

export interface WoReleasedPayload {
  workOrderId: string
  code: string
  releasedAt: string
  releasedBy: string
}

export interface WoAssignedPayload {
  workOrderId: string
  code: string
  operatorId: string
  assignedAt: string
}

@Injectable()
@WebSocketGateway({
  cors: { origin: ['http://localhost:3001', 'http://localhost:3002'] },
  path: '/socket.io',
})
export class WorkOrderEventsGateway {
  @WebSocketServer()
  private server!: Server

  emitStepTransition(payload: StepTransitionPayload): void {
    if (!this.server) return
    this.server.to(`wo:${payload.workOrderId}`).emit('step:transition', payload)
  }

  emitParallelSync(payload: ParallelSyncPayload): void {
    if (!this.server) return
    this.server.to(`wo:${payload.workOrderId}`).emit('step:parallel-sync', payload)
  }

  /**
   * Broadcasts that a Work Order has been released. D6 of PROMPT_5_FULL —
   * delivered as an unrouted broadcast so any subscribed manager dashboard
   * can pick it up without per-WO room membership.
   */
  emitWoReleased(payload: WoReleasedPayload): void {
    if (!this.server) return
    this.server.emit('wo:released', payload)
  }

  /**
   * Notifies the assigned operator that a new Work Order is on their
   * dashboard. Routed to `op:${operatorId}` so each HMI session subscribes
   * to its own room (set up at HMI socket connect time).
   */
  emitWoAssigned(payload: WoAssignedPayload): void {
    if (!this.server) return
    this.server.to(`op:${payload.operatorId}`).emit('wo:assigned', payload)
  }

  /**
   * Client room subscription for per-WO step:transition events. Clients on
   * the WO detail page subscribe via `socket.emit('subscribe:wo', { workOrderId })`.
   *
   * NOTE on auth: in DEV MODE we do not gate room joins by JWT or plant
   * scope. A malicious client could subscribe to any room. Production
   * hardening (validate JWT cookie, ensure operator owns the WO) is
   * tracked in TODO-017 (refresh-token rotation + per-namespace auth).
   */
  @SubscribeMessage('subscribe:wo')
  handleSubscribeWo(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: unknown,
  ): { ok: true; room: string } | { ok: false; error: string } {
    const workOrderId = extractId(body, 'workOrderId')
    if (!workOrderId) return { ok: false, error: 'workOrderId required' }
    void socket.join(`wo:${workOrderId}`)
    return { ok: true, room: `wo:${workOrderId}` }
  }

  @SubscribeMessage('unsubscribe:wo')
  handleUnsubscribeWo(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: unknown,
  ): { ok: true; room: string } | { ok: false; error: string } {
    const workOrderId = extractId(body, 'workOrderId')
    if (!workOrderId) return { ok: false, error: 'workOrderId required' }
    void socket.leave(`wo:${workOrderId}`)
    return { ok: true, room: `wo:${workOrderId}` }
  }

  /**
   * Operator subscription for per-operator wo:assigned events. The HMI
   * dashboard subscribes once on mount with the current operator's id.
   */
  @SubscribeMessage('subscribe:op')
  handleSubscribeOp(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: unknown,
  ): { ok: true; room: string } | { ok: false; error: string } {
    const operatorId = extractId(body, 'operatorId')
    if (!operatorId) return { ok: false, error: 'operatorId required' }
    void socket.join(`op:${operatorId}`)
    return { ok: true, room: `op:${operatorId}` }
  }

  @SubscribeMessage('unsubscribe:op')
  handleUnsubscribeOp(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: unknown,
  ): { ok: true; room: string } | { ok: false; error: string } {
    const operatorId = extractId(body, 'operatorId')
    if (!operatorId) return { ok: false, error: 'operatorId required' }
    void socket.leave(`op:${operatorId}`)
    return { ok: true, room: `op:${operatorId}` }
  }
}

function extractId(body: unknown, key: string): string | null {
  if (!body || typeof body !== 'object') return null
  const value = (body as Record<string, unknown>)[key]
  return typeof value === 'string' && value.length > 0 ? value : null
}

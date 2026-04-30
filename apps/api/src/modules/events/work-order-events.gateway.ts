import { Injectable } from '@nestjs/common'
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import type { Server } from 'socket.io'

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
}

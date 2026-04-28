import { Injectable } from '@nestjs/common'
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import type { Server } from 'socket.io'

export type RegistryAction = 'created' | 'updated' | 'deleted' | 'restored'

export interface RegistryUpdatedPayload {
  module: string
  id: string
  action: RegistryAction
}

@Injectable()
@WebSocketGateway({
  cors: { origin: ['http://localhost:3001', 'http://localhost:3002'] },
  path: '/socket.io',
})
export class RegistryGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server

  handleConnection(client: { id: string }) {
    console.log(`[WS] client connected: ${client.id}`)
  }

  handleDisconnect(client: { id: string }) {
    console.log(`[WS] client disconnected: ${client.id}`)
  }

  emit(payload: RegistryUpdatedPayload): void {
    this.server.emit('registry:updated', payload)
  }
}

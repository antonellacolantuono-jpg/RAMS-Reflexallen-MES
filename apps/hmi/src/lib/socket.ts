import { io, type Socket } from 'socket.io-client'

const API_BASE_URL =
  process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000'

let singleton: Socket | null = null

/**
 * Returns a process-wide Socket.IO client connected to the API gateway.
 *
 * Configuration:
 *   - `withCredentials: true` so the JWT cookie set by /api/auth/login
 *     accompanies the WebSocket handshake. CORS on the API allows credentials
 *     from `http://localhost:3002` (HMI) by default.
 *   - `path: '/socket.io'` matches the gateway in
 *     apps/api/src/modules/events/work-order-events.gateway.ts.
 *   - Auto-connect on first call, persistent across hook re-mounts.
 *
 * The HMI subscribes to two room types via `subscribe:wo` / `subscribe:op`
 * messages — see useStepTransitionSubscription / useWoAssignedSubscription
 * in `queries.ts`.
 *
 * On the server side, the @SubscribeMessage handlers in the gateway accept
 * `{ workOrderId }` or `{ operatorId }` and call `socket.join(...)`.
 */
export function getSocket(): Socket {
  if (typeof window === 'undefined') {
    throw new Error('getSocket() must only be called in the browser')
  }
  if (!singleton) {
    singleton = io(API_BASE_URL, {
      withCredentials: true,
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
    })
  }
  return singleton
}

/**
 * Closes the singleton — primarily for tests and explicit logout flows.
 */
export function disconnectSocket(): void {
  if (singleton) {
    singleton.disconnect()
    singleton = null
  }
}

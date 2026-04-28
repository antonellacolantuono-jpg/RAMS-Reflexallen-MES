'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'

interface RegistryEvent {
  module: string
  id: string
  action: 'created' | 'updated' | 'deleted' | 'restored'
}

let socket: ReturnType<typeof io> | null = null

function getSocket() {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000', {
      path: '/socket.io',
      transports: ['websocket'],
    })
  }
  return socket
}

export function useRegistrySync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const s = getSocket()

    function onRegistryUpdated(event: RegistryEvent) {
      queryClient.invalidateQueries({ queryKey: [event.module] })
      queryClient.invalidateQueries({ queryKey: [event.module, event.id] })
    }

    s.on('registry:updated', onRegistryUpdated)
    return () => { s.off('registry:updated', onRegistryUpdated) }
  }, [queryClient])
}

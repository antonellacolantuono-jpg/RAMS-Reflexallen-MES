import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDeviceCycle } from './use-device-cycle'

type Handler = (payload: unknown) => void

interface FakeSocket {
  on: (event: string, handler: Handler) => void
  off: (event: string, handler: Handler) => void
  emit: (event: string, payload?: unknown) => void
  __handlers: Record<string, Handler[]>
}

function createFakeSocket(): FakeSocket {
  const handlers: Record<string, Handler[]> = {}
  return {
    on(event, handler) {
      handlers[event] ??= []
      handlers[event]!.push(handler)
    },
    off(event, handler) {
      handlers[event] = (handlers[event] ?? []).filter((h) => h !== handler)
    },
    emit() {
      // server-bound — irrelevant for these tests
    },
    __handlers: handlers,
  }
}

vi.mock('./socket', () => {
  const fake = createFakeSocket()
  return {
    getSocket: () => fake,
    disconnectSocket: () => {},
    __fakeSocket: fake,
  }
})

import * as socketModule from './socket'

describe('useDeviceCycle', () => {
  let fake: FakeSocket

  beforeEach(() => {
    fake = (socketModule as unknown as { __fakeSocket: FakeSocket }).__fakeSocket
    for (const key of Object.keys(fake.__handlers)) delete fake.__handlers[key]
  })

  afterEach(() => {
    for (const key of Object.keys(fake.__handlers)) delete fake.__handlers[key]
  })

  it('subscribes on mount and unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useDeviceCycle('DEV-LEAK-001'))
    expect(fake.__handlers['device:cycle:started']?.length).toBe(1)
    expect(fake.__handlers['device:cycle:progress']?.length).toBe(1)
    expect(fake.__handlers['device:cycle:complete']?.length).toBe(1)
    unmount()
    expect(fake.__handlers['device:cycle:started']?.length).toBe(0)
    expect(fake.__handlers['device:cycle:progress']?.length).toBe(0)
    expect(fake.__handlers['device:cycle:complete']?.length).toBe(0)
  })

  it('updates state when cycle:started + progress events for the matching device arrive', () => {
    const { result } = renderHook(() => useDeviceCycle('DEV-LEAK-001'))

    act(() => {
      fake.__handlers['device:cycle:started']?.[0]?.({
        deviceSerialNumber: 'DEV-LEAK-001',
        stepExecutionId: 'se-1',
        expectedDurationSec: 45,
        startedAt: '2026-05-03T08:00:00Z',
      })
    })
    expect(result.current.status).toBe('running')
    expect(result.current.expectedDurationSec).toBe(45)

    act(() => {
      fake.__handlers['device:cycle:progress']?.[0]?.({
        deviceSerialNumber: 'DEV-LEAK-001',
        stepExecutionId: 'se-1',
        elapsedSec: 12,
        telemetry: { phase: 'hold', pressureBar: 6.04, leakRateMbarMin: 0.18 },
      })
    })
    expect(result.current.elapsedSec).toBe(12)
    expect(result.current.pressureBar).toBeCloseTo(6.04)
    expect(result.current.phase).toBe('hold')
    expect(result.current.pressureHistory.length).toBe(1)
  })

  it('ignores events from other devices', () => {
    const { result } = renderHook(() => useDeviceCycle('DEV-LEAK-001'))
    act(() => {
      fake.__handlers['device:cycle:started']?.[0]?.({
        deviceSerialNumber: 'DEV-CAMERA-001',
        stepExecutionId: 'se-2',
        expectedDurationSec: 8,
        startedAt: '2026-05-03T08:00:00Z',
      })
    })
    expect(result.current.status).toBe('idle')
  })
})

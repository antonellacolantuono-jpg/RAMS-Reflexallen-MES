import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ConflictException } from '@nestjs/common'
import { DemoControllerService } from './demo-controller.service'
import {
  LEAK_DEVICE_SERIAL,
  MockLeakTesterService,
} from './mock-leak-tester.service'
import type { WorkOrderEventsGateway } from '../events/work-order-events.gateway'

interface SpyGateway {
  emitDeviceCycleStarted: ReturnType<typeof vi.fn>
  emitDeviceCycleProgress: ReturnType<typeof vi.fn>
  emitDeviceCycleComplete: ReturnType<typeof vi.fn>
}

function makeGateway(): SpyGateway {
  return {
    emitDeviceCycleStarted: vi.fn(),
    emitDeviceCycleProgress: vi.fn(),
    emitDeviceCycleComplete: vi.fn(),
  }
}

function makeSvc(opts: { random?: () => number } = {}) {
  const demo = new DemoControllerService()
  const gateway = makeGateway()
  const svc = new MockLeakTesterService(
    demo,
    gateway as unknown as WorkOrderEventsGateway,
    opts.random ?? (() => 0.5),
  )
  return { svc, demo, gateway }
}

describe('MockLeakTesterService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('PASS default cycle emits started + progress + complete with leakRate in PASS band', async () => {
    const { svc, gateway } = makeSvc()
    svc.start('se-leak-1')

    expect(gateway.emitDeviceCycleStarted).toHaveBeenCalledOnce()
    expect(gateway.emitDeviceCycleStarted.mock.calls[0]?.[0]).toMatchObject({
      deviceSerialNumber: LEAK_DEVICE_SERIAL,
      stepExecutionId: 'se-leak-1',
      expectedDurationSec: 45,
    })

    await vi.advanceTimersByTimeAsync(45_000)

    // 90 progress emits at 500ms intervals across 45 seconds.
    expect(gateway.emitDeviceCycleProgress).toHaveBeenCalledTimes(90)
    expect(gateway.emitDeviceCycleComplete).toHaveBeenCalledOnce()

    const completePayload = gateway.emitDeviceCycleComplete.mock.calls[0]?.[0]
    expect(completePayload).toMatchObject({
      deviceSerialNumber: LEAK_DEVICE_SERIAL,
      stepExecutionId: 'se-leak-1',
      outcome: 'PASS',
      durationSec: 45,
    })
    const leakRate = (completePayload.result as { leakRateMbarMin: number }).leakRateMbarMin
    expect(leakRate).toBeGreaterThanOrEqual(0.1)
    expect(leakRate).toBeLessThanOrEqual(0.45)
    expect(svc.getStatus().state).toBe('idle')
  })

  it('FAIL override produces leak rate above the FAIL threshold and is consumed', async () => {
    const { svc, demo, gateway } = makeSvc()
    demo.setNextOutcome(LEAK_DEVICE_SERIAL, 'FAIL')

    svc.start('se-leak-2')
    await vi.advanceTimersByTimeAsync(45_000)

    const completePayload = gateway.emitDeviceCycleComplete.mock.calls[0]?.[0]
    expect(completePayload.outcome).toBe('FAIL')
    const leakRate = (completePayload.result as { leakRateMbarMin: number }).leakRateMbarMin
    expect(leakRate).toBeGreaterThan(1.0)
    expect(leakRate).toBeLessThanOrEqual(2.5)

    // Override consumed at start; next status read shows no override.
    expect(demo.peekNextOutcome(LEAK_DEVICE_SERIAL)).toBeNull()
  })

  it('MARGINAL override produces leak rate within the MARGINAL band', async () => {
    const { svc, demo, gateway } = makeSvc()
    demo.setNextOutcome(LEAK_DEVICE_SERIAL, 'MARGINAL')

    svc.start('se-leak-3')
    await vi.advanceTimersByTimeAsync(45_000)

    const completePayload = gateway.emitDeviceCycleComplete.mock.calls[0]?.[0]
    expect(completePayload.outcome).toBe('MARGINAL')
    const leakRate = (completePayload.result as { leakRateMbarMin: number }).leakRateMbarMin
    expect(leakRate).toBeGreaterThanOrEqual(0.55)
    expect(leakRate).toBeLessThanOrEqual(0.95)
  })

  it('rejects start while a cycle is already running', () => {
    const { svc } = makeSvc()
    svc.start('se-leak-4')
    expect(() => svc.start('se-leak-5')).toThrow(ConflictException)
  })

  it('stop clears timers and returns to idle without emitting complete', async () => {
    const { svc, gateway } = makeSvc()
    svc.start('se-leak-6')
    await vi.advanceTimersByTimeAsync(2_000) // 4 progress events
    expect(gateway.emitDeviceCycleProgress).toHaveBeenCalledTimes(4)

    svc.stop()
    expect(svc.getStatus().state).toBe('idle')

    await vi.advanceTimersByTimeAsync(45_000) // ensure no more events fire
    expect(gateway.emitDeviceCycleProgress).toHaveBeenCalledTimes(4)
    expect(gateway.emitDeviceCycleComplete).not.toHaveBeenCalled()
  })

  it('exposes lastOutcome after a cycle completes; clears it when a new cycle starts (D3)', async () => {
    const { svc, demo } = makeSvc()
    expect(svc.getStatus().lastOutcome).toBeNull()

    demo.setNextOutcome(LEAK_DEVICE_SERIAL, 'FAIL')
    svc.start('se-leak-7')
    await vi.advanceTimersByTimeAsync(45_000)
    expect(svc.getStatus().lastOutcome).toBe('FAIL')

    // Starting a new cycle clears the previous lastOutcome until that cycle
    // completes (so the UI doesn't show a stale outcome alongside in-progress
    // telemetry).
    svc.start('se-leak-8')
    expect(svc.getStatus().lastOutcome).toBeNull()
    svc.stop()
  })
})

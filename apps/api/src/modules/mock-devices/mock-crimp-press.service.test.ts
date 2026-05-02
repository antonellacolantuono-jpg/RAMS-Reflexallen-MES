import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DemoControllerService } from './demo-controller.service'
import {
  CRIMP_DEVICE_SERIAL,
  MockCrimpPressService,
} from './mock-crimp-press.service'
import type { WorkOrderEventsGateway } from '../events/work-order-events.gateway'

function makeSvc(opts: { random?: () => number } = {}) {
  const demo = new DemoControllerService()
  const gateway = {
    emitDeviceCycleStarted: vi.fn(),
    emitDeviceCycleProgress: vi.fn(),
    emitDeviceCycleComplete: vi.fn(),
  } as unknown as WorkOrderEventsGateway
  const svc = new MockCrimpPressService(
    demo,
    gateway,
    opts.random ?? (() => 0.5),
  )
  return {
    svc,
    demo,
    gateway: gateway as unknown as {
      emitDeviceCycleStarted: ReturnType<typeof vi.fn>
      emitDeviceCycleProgress: ReturnType<typeof vi.fn>
      emitDeviceCycleComplete: ReturnType<typeof vi.fn>
    },
  }
}

describe('MockCrimpPressService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('PASS default cycle: peak force in tolerance band 24..26 kN', async () => {
    const { svc, gateway } = makeSvc()
    svc.start('se-crimp-1')
    await vi.advanceTimersByTimeAsync(8_000)

    expect(gateway.emitDeviceCycleComplete).toHaveBeenCalledOnce()
    const completePayload = gateway.emitDeviceCycleComplete.mock.calls[0]?.[0]
    expect(completePayload.outcome).toBe('PASS')
    const result = completePayload.result as { peakForceKn: number; inTolerance: boolean }
    expect(result.peakForceKn).toBeGreaterThanOrEqual(24)
    expect(result.peakForceKn).toBeLessThanOrEqual(26)
    expect(result.inTolerance).toBe(true)
  })

  it('FAIL override: peak force outside tolerance and inTolerance=false', async () => {
    const { svc, demo, gateway } = makeSvc()
    demo.setNextOutcome(CRIMP_DEVICE_SERIAL, 'FAIL')
    svc.start('se-crimp-2')
    await vi.advanceTimersByTimeAsync(8_000)

    const completePayload = gateway.emitDeviceCycleComplete.mock.calls[0]?.[0]
    expect(completePayload.outcome).toBe('FAIL')
    const result = completePayload.result as { peakForceKn: number; inTolerance: boolean }
    expect(Math.abs(result.peakForceKn - 25)).toBeGreaterThan(1)
    expect(result.inTolerance).toBe(false)
  })

  it('emits 80 progress events at 100ms intervals across 8 seconds', async () => {
    const { svc, gateway } = makeSvc()
    svc.start('se-crimp-3')
    await vi.advanceTimersByTimeAsync(8_000)
    expect(gateway.emitDeviceCycleProgress).toHaveBeenCalledTimes(80)
  })
})

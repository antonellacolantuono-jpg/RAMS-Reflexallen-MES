import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DemoControllerService } from './demo-controller.service'
import {
  CAMERA_DEVICE_SERIAL,
  CAMERA_ROI_NAMES,
  MockCameraTesterService,
} from './mock-camera-tester.service'
import type { WorkOrderEventsGateway } from '../events/work-order-events.gateway'

function makeSvc(opts: { random?: () => number } = {}) {
  const demo = new DemoControllerService()
  const gateway = {
    emitDeviceCycleStarted: vi.fn(),
    emitDeviceCycleProgress: vi.fn(),
    emitDeviceCycleComplete: vi.fn(),
  } as unknown as WorkOrderEventsGateway
  const svc = new MockCameraTesterService(
    demo,
    gateway,
    opts.random ?? (() => 0.5),
  )
  return { svc, demo, gateway: gateway as unknown as { emitDeviceCycleProgress: ReturnType<typeof vi.fn>; emitDeviceCycleComplete: ReturnType<typeof vi.fn>; emitDeviceCycleStarted: ReturnType<typeof vi.fn> } }
}

describe('MockCameraTesterService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('PASS default cycle: all 4 ROIs end >= 95%', async () => {
    const { svc, gateway } = makeSvc()
    svc.start('se-cam-1')
    await vi.advanceTimersByTimeAsync(8_000)

    expect(gateway.emitDeviceCycleComplete).toHaveBeenCalledOnce()
    const completePayload = gateway.emitDeviceCycleComplete.mock.calls[0]?.[0]
    expect(completePayload.outcome).toBe('PASS')
    const rois = (completePayload.result as { rois: Array<{ roiId: string; similarityPct: number }> }).rois
    expect(rois).toHaveLength(4)
    expect(rois.map((r) => r.roiId)).toEqual([...CAMERA_ROI_NAMES])
    for (const roi of rois) {
      expect(roi.similarityPct).toBeGreaterThanOrEqual(95)
    }
  })

  it('FAIL override: at least one ROI below the 95% threshold', async () => {
    const { svc, demo, gateway } = makeSvc()
    demo.setNextOutcome(CAMERA_DEVICE_SERIAL, 'FAIL')
    svc.start('se-cam-2')
    await vi.advanceTimersByTimeAsync(8_000)

    const completePayload = gateway.emitDeviceCycleComplete.mock.calls[0]?.[0]
    expect(completePayload.outcome).toBe('FAIL')
    const rois = (completePayload.result as { rois: Array<{ similarityPct: number }> }).rois
    const failingRois = rois.filter((r) => r.similarityPct < 95)
    expect(failingRois.length).toBeGreaterThanOrEqual(1)
  })

  it('emits 32 progress events at 250ms intervals across 8 seconds', async () => {
    const { svc, gateway } = makeSvc()
    svc.start('se-cam-3')
    await vi.advanceTimersByTimeAsync(8_000)
    expect(gateway.emitDeviceCycleProgress).toHaveBeenCalledTimes(32)
  })
})

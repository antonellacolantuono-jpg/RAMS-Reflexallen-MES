import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { DemoControllerService } from './demo-controller.service'
import { MockDevicesController } from './mock-devices.controller'
import {
  LEAK_DEVICE_SERIAL,
  MockLeakTesterService,
} from './mock-leak-tester.service'
import type { WorkOrderEventsGateway } from '../events/work-order-events.gateway'

function makeController() {
  const demo = new DemoControllerService()
  const gateway = {
    emitDeviceCycleStarted: vi.fn(),
    emitDeviceCycleProgress: vi.fn(),
    emitDeviceCycleComplete: vi.fn(),
  } as unknown as WorkOrderEventsGateway
  const leak = new MockLeakTesterService(demo, gateway, () => 0.5)
  const ctrl = new MockDevicesController(demo, leak)
  return { ctrl, demo, leak }
}

describe('MockDevicesController', () => {
  const originalDemoMode = process.env['DEMO_MODE']

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    if (originalDemoMode === undefined) delete process.env['DEMO_MODE']
    else process.env['DEMO_MODE'] = originalDemoMode
  })

  it('list returns 404 (NotFoundException) when DEMO_MODE != "true"', () => {
    delete process.env['DEMO_MODE']
    const { ctrl } = makeController()
    expect(() => ctrl.list()).toThrow(NotFoundException)
  })

  it('list returns devices when DEMO_MODE = "true"', () => {
    process.env['DEMO_MODE'] = 'true'
    const { ctrl } = makeController()
    const result = ctrl.list()
    expect(result.devices).toHaveLength(1)
    expect(result.devices[0]).toMatchObject({
      deviceSerialNumber: LEAK_DEVICE_SERIAL,
      state: 'idle',
      defaultOutcome: 'PASS',
    })
  })

  it('setNextOutcome stores the override on the demo controller', () => {
    process.env['DEMO_MODE'] = 'true'
    const { ctrl, demo } = makeController()
    const result = ctrl.setNextOutcome(LEAK_DEVICE_SERIAL, { outcome: 'FAIL' })
    expect(result).toEqual({ deviceSerialNumber: LEAK_DEVICE_SERIAL, nextOutcome: 'FAIL' })
    expect(demo.peekNextOutcome(LEAK_DEVICE_SERIAL)).toBe('FAIL')
  })

  it('setNextOutcome rejects unknown outcomes with BadRequest', () => {
    process.env['DEMO_MODE'] = 'true'
    const { ctrl } = makeController()
    expect(() => ctrl.setNextOutcome(LEAK_DEVICE_SERIAL, { outcome: 'INVALID' })).toThrow(
      BadRequestException,
    )
  })

  it('startTest accepts and starts the simulator cycle', () => {
    process.env['DEMO_MODE'] = 'true'
    const { ctrl, leak } = makeController()
    const result = ctrl.startTest(LEAK_DEVICE_SERIAL, { stepExecutionId: 'se-1' })
    expect(result).toEqual({
      deviceSerialNumber: LEAK_DEVICE_SERIAL,
      stepExecutionId: 'se-1',
      accepted: true,
    })
    expect(leak.getStatus().state).toBe('running')
    leak.stop()
  })

  it('resolveDevice rejects unknown device codes with NotFound', () => {
    process.env['DEMO_MODE'] = 'true'
    const { ctrl } = makeController()
    expect(() => ctrl.status('DEV-NONEXISTENT-999')).toThrow(NotFoundException)
  })
})

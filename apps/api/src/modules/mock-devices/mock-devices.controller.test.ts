import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { DemoControllerService } from './demo-controller.service'
import { MockDevicesController } from './mock-devices.controller'
import {
  LEAK_DEVICE_SERIAL,
  MockLeakTesterService,
} from './mock-leak-tester.service'
import {
  CAMERA_DEVICE_SERIAL,
  MockCameraTesterService,
} from './mock-camera-tester.service'
import {
  CRIMP_DEVICE_SERIAL,
  MockCrimpPressService,
} from './mock-crimp-press.service'
import type { WorkOrderEventsGateway } from '../events/work-order-events.gateway'

function makeController() {
  const demo = new DemoControllerService()
  const gateway = {
    emitDeviceCycleStarted: vi.fn(),
    emitDeviceCycleProgress: vi.fn(),
    emitDeviceCycleComplete: vi.fn(),
  } as unknown as WorkOrderEventsGateway
  const leak = new MockLeakTesterService(demo, gateway, () => 0.5)
  const camera = new MockCameraTesterService(demo, gateway, () => 0.5)
  const crimp = new MockCrimpPressService(demo, gateway, () => 0.5)
  const ctrl = new MockDevicesController(demo, leak, camera, crimp)
  return { ctrl, demo, leak, camera, crimp }
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

  it('list returns all 3 simulators when DEMO_MODE = "true"', () => {
    process.env['DEMO_MODE'] = 'true'
    const { ctrl } = makeController()
    const result = ctrl.list()
    expect(result.devices).toHaveLength(3)
    const serials = result.devices.map((d) => d.deviceSerialNumber)
    expect(serials).toEqual([LEAK_DEVICE_SERIAL, CAMERA_DEVICE_SERIAL, CRIMP_DEVICE_SERIAL])
  })

  it('overrideNext stores the override on the demo controller (leak)', () => {
    process.env['DEMO_MODE'] = 'true'
    const { ctrl, demo } = makeController()
    const result = ctrl.overrideNext(LEAK_DEVICE_SERIAL, { outcome: 'FAIL' })
    expect(result).toEqual({ deviceSerialNumber: LEAK_DEVICE_SERIAL, nextOutcome: 'FAIL' })
    expect(demo.peekNextOutcome(LEAK_DEVICE_SERIAL)).toBe('FAIL')
  })

  it('overrideNext rejects MARGINAL on camera (PASS/FAIL only)', () => {
    process.env['DEMO_MODE'] = 'true'
    const { ctrl } = makeController()
    expect(() => ctrl.overrideNext(CAMERA_DEVICE_SERIAL, { outcome: 'MARGINAL' })).toThrow(
      BadRequestException,
    )
  })

  it('overrideNext rejects unknown outcomes with BadRequest', () => {
    process.env['DEMO_MODE'] = 'true'
    const { ctrl } = makeController()
    expect(() => ctrl.overrideNext(LEAK_DEVICE_SERIAL, { outcome: 'INVALID' })).toThrow(
      BadRequestException,
    )
  })

  it('startCycle accepts and starts the simulator (leak)', () => {
    process.env['DEMO_MODE'] = 'true'
    const { ctrl, leak } = makeController()
    const result = ctrl.startCycle(LEAK_DEVICE_SERIAL, { stepExecutionId: 'se-1' })
    expect(result).toEqual({
      deviceSerialNumber: LEAK_DEVICE_SERIAL,
      stepExecutionId: 'se-1',
      accepted: true,
    })
    expect(leak.getStatus().state).toBe('running')
    leak.stop()
  })

  it('startCycle accepts and starts the camera simulator', () => {
    process.env['DEMO_MODE'] = 'true'
    const { ctrl, camera } = makeController()
    ctrl.startCycle(CAMERA_DEVICE_SERIAL, { stepExecutionId: 'se-2' })
    expect(camera.getStatus().state).toBe('running')
    camera.stop()
  })

  it('startCycle accepts and starts the crimp simulator', () => {
    process.env['DEMO_MODE'] = 'true'
    const { ctrl, crimp } = makeController()
    ctrl.startCycle(CRIMP_DEVICE_SERIAL, { stepExecutionId: 'se-3' })
    expect(crimp.getStatus().state).toBe('running')
    crimp.stop()
  })

  it('resolveDevice rejects unknown device codes with NotFound', () => {
    process.env['DEMO_MODE'] = 'true'
    const { ctrl } = makeController()
    expect(() => ctrl.status('DEV-NONEXISTENT-999')).toThrow(NotFoundException)
  })
})

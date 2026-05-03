import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  MockDeviceDispatcherService,
  type DispatchOutcomeContext,
} from './mock-device-dispatcher.service'
import type { CycleCompletionListener, MockDevice } from './types'

function makeFakeSimulator(serial: string): MockDevice & { __started: ReturnType<typeof vi.fn> } {
  const started = vi.fn(
    (
      _stepExecutionId: string,
      _params?: Record<string, unknown>,
      _onComplete?: CycleCompletionListener,
    ) => {},
  )
  return {
    deviceSerialNumber: serial,
    defaultOutcome: 'PASS',
    supportedOutcomes: ['PASS', 'FAIL'],
    expectedDurationSec: 1,
    start: started,
    stop: vi.fn(),
    getStatus: vi.fn(),
    __started: started,
  } as unknown as MockDevice & { __started: ReturnType<typeof vi.fn> }
}

describe('MockDeviceDispatcherService', () => {
  const originalDemo = process.env['DEMO_MODE']

  beforeEach(() => {
    process.env['DEMO_MODE'] = 'true'
  })
  afterEach(() => {
    if (originalDemo === undefined) delete process.env['DEMO_MODE']
    else process.env['DEMO_MODE'] = originalDemo
  })

  it('dispatches to the matching simulator and fires registered outcome listeners', async () => {
    const leak = makeFakeSimulator('DEV-LEAK-001')
    const camera = makeFakeSimulator('DEV-CAMERA-001')
    const crimp = makeFakeSimulator('DEV-CRIMP-001')
    // Cast through unknown to avoid heavy NestJS class typings.
    const dispatcher = new MockDeviceDispatcherService(
      leak as never,
      camera as never,
      crimp as never,
    )

    const seen: DispatchOutcomeContext[] = []
    dispatcher.onOutcome((ctx) => {
      seen.push(ctx)
    })

    const dispatched = dispatcher.dispatch({
      stepExecutionId: 'se-1',
      workOrderId: 'wo-1',
      deviceSerialNumber: 'DEV-LEAK-001',
      changedBy: 'op-1',
      plantId: 'plant-1',
    })
    expect(dispatched).toBe(true)
    expect(leak.__started).toHaveBeenCalledTimes(1)
    expect(camera.__started).not.toHaveBeenCalled()
    expect(crimp.__started).not.toHaveBeenCalled()

    // Pull the captured onComplete and fire it as the simulator would.
    const call = leak.__started.mock.calls[0]!
    const onComplete = call[2] as CycleCompletionListener
    expect(typeof onComplete).toBe('function')
    onComplete('PASS')

    // Listener invocation is deferred via Promise.resolve().then(...) so
    // give the microtask queue one tick.
    await Promise.resolve()
    await Promise.resolve()

    expect(seen).toHaveLength(1)
    expect(seen[0]).toMatchObject({
      stepExecutionId: 'se-1',
      workOrderId: 'wo-1',
      deviceSerialNumber: 'DEV-LEAK-001',
      outcome: 'PASS',
      changedBy: 'op-1',
      plantId: 'plant-1',
    })
  })

  it('skips dispatch when DEMO_MODE is unset', () => {
    process.env['DEMO_MODE'] = 'false'
    const leak = makeFakeSimulator('DEV-LEAK-001')
    const dispatcher = new MockDeviceDispatcherService(leak as never)
    expect(dispatcher.canDispatch('DEV-LEAK-001')).toBe(false)
    const dispatched = dispatcher.dispatch({
      stepExecutionId: 'se-1',
      workOrderId: 'wo-1',
      deviceSerialNumber: 'DEV-LEAK-001',
      changedBy: 'op-1',
      plantId: 'plant-1',
    })
    expect(dispatched).toBe(false)
    expect(leak.__started).not.toHaveBeenCalled()
  })

  it('skips dispatch for unknown device serials (real-device pass-through)', () => {
    const leak = makeFakeSimulator('DEV-LEAK-001')
    const dispatcher = new MockDeviceDispatcherService(leak as never)
    expect(dispatcher.canDispatch('DEV-AUTOCLAVE-001')).toBe(false)
    const dispatched = dispatcher.dispatch({
      stepExecutionId: 'se-1',
      workOrderId: 'wo-1',
      deviceSerialNumber: 'DEV-AUTOCLAVE-001',
      changedBy: 'op-1',
      plantId: 'plant-1',
    })
    expect(dispatched).toBe(false)
    expect(leak.__started).not.toHaveBeenCalled()
  })
})

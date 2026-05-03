// PNE_4_FOCUSED D2 — Mock device dispatcher (closes TODO-043).
//
// Bridges step-execution to the mock simulator services from PNE_3:
//   StepExecutionService.applyTransition (START on a `device_run` /
//     `device_main` step under DEMO_MODE)
//     → MockDeviceDispatcherService.dispatch(...)
//     → MockLeakTesterService / MockCameraTesterService / MockCrimpPressService
//        .start(stepExecutionId, recipeParams, onComplete)
//     → simulator runs (45s leak / 8s camera / 8s crimp)
//     → simulator.complete() invokes onComplete(outcome)
//     → onComplete dispatches the matching state-machine transition
//        (COMPLETE_OK on PASS/MARGINAL, COMPLETE_NOK on FAIL).
//
// Identity capture (Lesson 56): the START transition has a `changedBy` /
// `plantId` from the operator's JWT. We capture them at dispatch time and
// reuse them when the simulator fires its completion callback later. When
// auth context is missing (DEMO_MODE without login), env vars
// DEMO_USER_ID / DEMO_PLANT_ID are the fallback — same pattern as
// FastForwardController.
//
// Real-device backwards-compat: when DEMO_MODE is unset OR the device serial
// is not one of the 3 mock simulators, dispatch is a silent no-op. The real
// device path will be implemented in F2 (PROMPT_8 / PROMPT_9 Equipment XState).

import { Injectable, Logger, Optional } from '@nestjs/common'
import { MockLeakTesterService, LEAK_DEVICE_SERIAL } from './mock-leak-tester.service'
import { MockCameraTesterService, CAMERA_DEVICE_SERIAL } from './mock-camera-tester.service'
import { MockCrimpPressService, CRIMP_DEVICE_SERIAL } from './mock-crimp-press.service'
import type { DeviceOutcome, MockDevice } from './types'

export interface DispatchRequest {
  /** Step execution UUID (matches StepExecution.id). */
  stepExecutionId: string
  /** Work order UUID; needed for the follow-up transition. */
  workOrderId: string
  /** Device serial from `Step.device.serialNumber` (DEV-LEAK-001 / etc). */
  deviceSerialNumber: string
  /** Optional recipe params (forwarded as-is to the simulator). */
  recipeParams?: Record<string, unknown> | undefined
  /** Captured identity for the auto-fired follow-up transition (Lesson 56). */
  changedBy: string
  plantId: string
}

export interface DispatchOutcomeContext {
  stepExecutionId: string
  workOrderId: string
  deviceSerialNumber: string
  outcome: DeviceOutcome
  changedBy: string
  plantId: string
}

export type DispatchOutcomeListener = (
  ctx: DispatchOutcomeContext,
) => void | Promise<void>

@Injectable()
export class MockDeviceDispatcherService {
  private readonly logger = new Logger(MockDeviceDispatcherService.name)
  private readonly simulatorByDevice: Map<string, MockDevice>

  /**
   * Listeners registered by the consumer (StepExecutionService). Invoked
   * inside the simulator's onComplete callback. Decoupled from constructor
   * injection to avoid the StepExecutionService ↔ MockDeviceDispatcher
   * circular dependency.
   */
  private outcomeListeners: DispatchOutcomeListener[] = []

  constructor(
    @Optional() leak?: MockLeakTesterService,
    @Optional() camera?: MockCameraTesterService,
    @Optional() crimp?: MockCrimpPressService,
  ) {
    this.simulatorByDevice = new Map()
    if (leak) this.simulatorByDevice.set(LEAK_DEVICE_SERIAL, leak)
    if (camera) this.simulatorByDevice.set(CAMERA_DEVICE_SERIAL, camera)
    if (crimp) this.simulatorByDevice.set(CRIMP_DEVICE_SERIAL, crimp)
  }

  /**
   * Register a callback fired whenever a dispatched simulator cycle completes.
   * Multiple listeners are supported (for testing). In normal operation there
   * is one listener: the StepExecutionService transition emitter.
   */
  onOutcome(listener: DispatchOutcomeListener): void {
    this.outcomeListeners.push(listener)
  }

  /**
   * Returns true when DEMO_MODE is enabled AND the given serial maps to one
   * of the 3 mock simulators. The caller (StepExecutionService) uses this to
   * skip dispatch for real devices entirely (no boot-time crash, no log
   * spam).
   */
  canDispatch(deviceSerialNumber: string | null | undefined): boolean {
    if (process.env['DEMO_MODE'] !== 'true') return false
    if (!deviceSerialNumber) return false
    return this.simulatorByDevice.has(deviceSerialNumber)
  }

  /**
   * Starts the matching simulator cycle and registers the completion
   * callback that fires the registered outcome listeners. Returns true when
   * dispatch happened, false when skipped (no DEMO_MODE / unknown serial /
   * simulator unavailable).
   */
  dispatch(req: DispatchRequest): boolean {
    if (!this.canDispatch(req.deviceSerialNumber)) return false
    const simulator = this.simulatorByDevice.get(req.deviceSerialNumber)
    if (!simulator) return false

    try {
      simulator.start(req.stepExecutionId, req.recipeParams ?? {}, (outcome) => {
        const ctx: DispatchOutcomeContext = {
          stepExecutionId: req.stepExecutionId,
          workOrderId: req.workOrderId,
          deviceSerialNumber: req.deviceSerialNumber,
          outcome,
          changedBy: req.changedBy,
          plantId: req.plantId,
        }
        for (const listener of this.outcomeListeners) {
          // Fire-and-forget so a slow listener doesn't block the simulator.
          Promise.resolve()
            .then(() => listener(ctx))
            .catch((err) => {
              this.logger.error(
                `dispatch outcome listener failed for step ${req.stepExecutionId}: ${err}`,
              )
            })
        }
      })
      return true
    } catch (err) {
      // Simulator already running for the same device — log + skip.
      this.logger.warn(
        `dispatch skipped for ${req.deviceSerialNumber} (step ${req.stepExecutionId}): ${
          err instanceof Error ? err.message : String(err)
        }`,
      )
      return false
    }
  }
}

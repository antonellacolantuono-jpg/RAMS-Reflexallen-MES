// PROMPT_PNE_3 D2 — Camera Tester simulator (DEV-CAMERA-001).
//
// Recipe contract (RCP-CAMERA-PNE-001 v1 from PROMPT_PNE_2 seed):
//   cycle_time_sec: 8
//   rois: [raccordo_a, raccordo_b, label_position, tape_position] each ≥0.95
//
// Outcome semantics (per PROMPT § 3.1.2):
//   PASS: all 4 ROIs >= 95 (each 95..99 random)
//   FAIL: one randomly-chosen ROI in 70..90, others in 95..99
//   No MARGINAL — camera is binary.

import { ConflictException, Injectable, OnModuleDestroy } from '@nestjs/common'
import { WorkOrderEventsGateway } from '../events/work-order-events.gateway'
import { DemoControllerService } from './demo-controller.service'
import {
  PASS_FAIL_OUTCOMES,
  type DeviceOutcome,
  type MockDevice,
  type MockDeviceLifecycleState,
  type MockDeviceStatus,
} from './types'

export const CAMERA_DEVICE_SERIAL = 'DEV-CAMERA-001'
export const CAMERA_DEFAULT_OUTCOME: DeviceOutcome = 'PASS'
export const CAMERA_EXPECTED_DURATION_SEC = 8
export const CAMERA_ROI_NAMES = [
  'raccordo_a',
  'raccordo_b',
  'label_position',
  'tape_position',
] as const
export type CameraRoiName = (typeof CAMERA_ROI_NAMES)[number]

const PROGRESS_INTERVAL_MS = 250
const CYCLE_DURATION_MS = 8_000
const PASS_THRESHOLD_PCT = 95

type CameraPhase = 'capture' | 'analyze' | 'decide'

interface RoiState {
  roiId: CameraRoiName
  similarityPct: number
  finalSimilarityPct: number
}

interface ActiveCameraCycle {
  stepExecutionId: string
  outcome: DeviceOutcome
  startedAtIso: string
  elapsedMs: number
  phase: CameraPhase
  rois: RoiState[]
}

@Injectable()
export class MockCameraTesterService implements MockDevice, OnModuleDestroy {
  readonly deviceSerialNumber = CAMERA_DEVICE_SERIAL
  readonly defaultOutcome = CAMERA_DEFAULT_OUTCOME
  readonly supportedOutcomes = PASS_FAIL_OUTCOMES
  readonly expectedDurationSec = CAMERA_EXPECTED_DURATION_SEC

  private state: MockDeviceLifecycleState = 'idle'
  private currentCycle: ActiveCameraCycle | null = null
  private interval: ReturnType<typeof setInterval> | null = null
  private completion: ReturnType<typeof setTimeout> | null = null
  private lastOutcome: DeviceOutcome | null = null

  constructor(
    private readonly demo: DemoControllerService,
    private readonly events: WorkOrderEventsGateway,
    private readonly random: () => number = Math.random,
  ) {}

  start(stepExecutionId: string, recipeParams: Record<string, unknown> = {}): void {
    if (this.state === 'running') {
      throw new ConflictException(`${this.deviceSerialNumber} cycle already running`)
    }

    const overridden = this.demo.consumeNextOutcome(this.deviceSerialNumber)
    const outcome = overridden ?? this.defaultOutcome
    const finals = this.computeFinalSimilarities(outcome)

    this.state = 'running'
    this.lastOutcome = null
    this.currentCycle = {
      stepExecutionId,
      outcome,
      startedAtIso: new Date().toISOString(),
      elapsedMs: 0,
      phase: 'capture',
      rois: CAMERA_ROI_NAMES.map((roiId, i) => ({
        roiId,
        similarityPct: 0,
        finalSimilarityPct: finals[i] ?? 0,
      })),
    }

    this.events.emitDeviceCycleStarted({
      deviceSerialNumber: this.deviceSerialNumber,
      stepExecutionId,
      expectedDurationSec: this.expectedDurationSec,
      startedAt: this.currentCycle.startedAtIso,
      recipe: {
        cycleTimeSec: this.expectedDurationSec,
        rois: CAMERA_ROI_NAMES,
        passThresholdPct: PASS_THRESHOLD_PCT,
        ...recipeParams,
      },
    })

    this.interval = setInterval(() => this.emitProgress(), PROGRESS_INTERVAL_MS)
    this.completion = setTimeout(() => this.complete(), CYCLE_DURATION_MS)
  }

  stop(): void {
    if (this.state !== 'running') return
    this.clearTimers()
    this.currentCycle = null
    this.state = 'idle'
  }

  getStatus(): MockDeviceStatus {
    const cycle = this.currentCycle
    return {
      deviceSerialNumber: this.deviceSerialNumber,
      state: this.state,
      stepExecutionId: cycle?.stepExecutionId ?? null,
      startedAt: cycle?.startedAtIso ?? null,
      elapsedSec: cycle ? Math.min(cycle.elapsedMs / 1000, this.expectedDurationSec) : 0,
      expectedDurationSec: this.expectedDurationSec,
      defaultOutcome: this.defaultOutcome,
      supportedOutcomes: this.supportedOutcomes,
      nextOutcome: this.demo.peekNextOutcome(this.deviceSerialNumber),
      lastOutcome: this.lastOutcome,
      telemetry: {
        phase: cycle?.phase ?? null,
        rois: cycle?.rois.map((r) => ({ roiId: r.roiId, similarityPct: r.similarityPct })) ?? [],
      },
    }
  }

  onModuleDestroy(): void {
    this.clearTimers()
  }

  private emitProgress(): void {
    const cycle = this.currentCycle
    if (!cycle || this.state !== 'running') return
    cycle.elapsedMs = Math.min(cycle.elapsedMs + PROGRESS_INTERVAL_MS, CYCLE_DURATION_MS)
    const elapsedSec = cycle.elapsedMs / 1000
    cycle.phase = this.computePhase(elapsedSec)
    for (const roi of cycle.rois) {
      roi.similarityPct = this.computeRoiProgress(elapsedSec, cycle.phase, roi.finalSimilarityPct)
    }

    this.events.emitDeviceCycleProgress({
      deviceSerialNumber: this.deviceSerialNumber,
      stepExecutionId: cycle.stepExecutionId,
      elapsedSec,
      telemetry: {
        phase: cycle.phase,
        rois: cycle.rois.map((r) => ({ roiId: r.roiId, similarityPct: r.similarityPct })),
      },
    })
  }

  private complete(): void {
    const cycle = this.currentCycle
    if (!cycle) return
    this.clearTimers()

    this.events.emitDeviceCycleComplete({
      deviceSerialNumber: this.deviceSerialNumber,
      stepExecutionId: cycle.stepExecutionId,
      outcome: cycle.outcome,
      durationSec: this.expectedDurationSec,
      result: {
        passThresholdPct: PASS_THRESHOLD_PCT,
        rois: cycle.rois.map((r) => ({
          roiId: r.roiId,
          similarityPct: r.finalSimilarityPct,
        })),
      },
    })

    this.lastOutcome = cycle.outcome
    this.currentCycle = null
    this.state = 'idle'
  }

  private clearTimers(): void {
    if (this.interval !== null) {
      clearInterval(this.interval)
      this.interval = null
    }
    if (this.completion !== null) {
      clearTimeout(this.completion)
      this.completion = null
    }
  }

  private computePhase(elapsedSec: number): CameraPhase {
    if (elapsedSec < 2) return 'capture'
    if (elapsedSec < 7) return 'analyze'
    return 'decide'
  }

  /** Linear ramp from 0 to final during analyze phase. */
  private computeRoiProgress(elapsedSec: number, phase: CameraPhase, final: number): number {
    if (phase === 'capture') return 0
    if (phase === 'decide') return roundTo(final, 2)
    // analyze: ramp 2s..7s
    const t = (elapsedSec - 2) / 5
    return roundTo(final * Math.max(0, Math.min(1, t)), 2)
  }

  /** Returns final similarity per ROI: PASS = all 95..99, FAIL = one 70..90 + others 95..99. */
  private computeFinalSimilarities(outcome: DeviceOutcome): number[] {
    const passing = (): number => roundTo(95 + this.random() * 4, 2)
    if (outcome === 'PASS') {
      return CAMERA_ROI_NAMES.map(() => passing())
    }
    // FAIL
    const failingIndex = Math.min(
      CAMERA_ROI_NAMES.length - 1,
      Math.floor(this.random() * CAMERA_ROI_NAMES.length),
    )
    const failing = roundTo(70 + this.random() * 20, 2)
    return CAMERA_ROI_NAMES.map((_, i) => (i === failingIndex ? failing : passing()))
  }
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

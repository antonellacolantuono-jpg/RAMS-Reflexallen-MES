// PROMPT_PNE_3 D2 — Crimp Press simulator (DEV-CRIMP-001).
//
// Recipe contract (RCP-CRIMP-12-001 v1 from PROMPT_PNE_2 seed):
//   crimp_force_kn: 25.0
//   tolerance_kn:   1.0
//   cycle_time_sec: 8
//   hold_time_sec:  2
//
// Outcome semantics (per PROMPT § 3.1.3):
//   PASS: peak force in 24..26 kN (each 24.5..25.5 random by default)
//   FAIL: peak force out of tolerance (e.g. 22..23.5 or 26.5..28)
//   No MARGINAL — crimp is binary tolerance check.

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

export const CRIMP_DEVICE_SERIAL = 'DEV-CRIMP-001'
export const CRIMP_DEFAULT_OUTCOME: DeviceOutcome = 'PASS'
export const CRIMP_EXPECTED_DURATION_SEC = 8
const PROGRESS_INTERVAL_MS = 100
const CYCLE_DURATION_MS = 8_000
const NOMINAL_FORCE_KN = 25.0
const TOLERANCE_KN = 1.0

type CrimpPhase = 'approach' | 'compress' | 'hold' | 'release'

interface ActiveCrimpCycle {
  stepExecutionId: string
  outcome: DeviceOutcome
  startedAtIso: string
  elapsedMs: number
  phase: CrimpPhase
  forceKn: number
  peakForceKn: number
  finalPeakForceKn: number
}

@Injectable()
export class MockCrimpPressService implements MockDevice, OnModuleDestroy {
  readonly deviceSerialNumber = CRIMP_DEVICE_SERIAL
  readonly defaultOutcome = CRIMP_DEFAULT_OUTCOME
  readonly supportedOutcomes = PASS_FAIL_OUTCOMES
  readonly expectedDurationSec = CRIMP_EXPECTED_DURATION_SEC

  private state: MockDeviceLifecycleState = 'idle'
  private currentCycle: ActiveCrimpCycle | null = null
  private interval: ReturnType<typeof setInterval> | null = null
  private completion: ReturnType<typeof setTimeout> | null = null

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
    const finalPeak = this.computeFinalPeakForce(outcome)

    this.state = 'running'
    this.currentCycle = {
      stepExecutionId,
      outcome,
      startedAtIso: new Date().toISOString(),
      elapsedMs: 0,
      phase: 'approach',
      forceKn: 0,
      peakForceKn: 0,
      finalPeakForceKn: finalPeak,
    }

    this.events.emitDeviceCycleStarted({
      deviceSerialNumber: this.deviceSerialNumber,
      stepExecutionId,
      expectedDurationSec: this.expectedDurationSec,
      startedAt: this.currentCycle.startedAtIso,
      recipe: {
        nominalForceKn: NOMINAL_FORCE_KN,
        toleranceKn: TOLERANCE_KN,
        cycleTimeSec: this.expectedDurationSec,
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
      telemetry: {
        phase: cycle?.phase ?? null,
        forceKn: cycle?.forceKn ?? 0,
        peakForceKn: cycle?.peakForceKn ?? 0,
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
    cycle.forceKn = this.computeForce(elapsedSec, cycle.phase, cycle.finalPeakForceKn)
    if (cycle.forceKn > cycle.peakForceKn) {
      cycle.peakForceKn = cycle.forceKn
    }

    this.events.emitDeviceCycleProgress({
      deviceSerialNumber: this.deviceSerialNumber,
      stepExecutionId: cycle.stepExecutionId,
      elapsedSec,
      telemetry: {
        phase: cycle.phase,
        forceKn: cycle.forceKn,
        peakForceKn: cycle.peakForceKn,
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
        peakForceKn: cycle.finalPeakForceKn,
        nominalForceKn: NOMINAL_FORCE_KN,
        toleranceKn: TOLERANCE_KN,
        inTolerance: this.isInTolerance(cycle.finalPeakForceKn),
      },
    })

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

  private computePhase(elapsedSec: number): CrimpPhase {
    if (elapsedSec < 1) return 'approach'
    if (elapsedSec < 6) return 'compress'
    if (elapsedSec < 7) return 'hold'
    return 'release'
  }

  /**
   * Force trace: 0 in approach, 0→peak ramp during compress (1..6s),
   * peak ± 0.5 jitter in hold, peak→0 ramp in release (7..8s).
   */
  private computeForce(elapsedSec: number, phase: CrimpPhase, peak: number): number {
    if (phase === 'approach') return 0
    if (phase === 'compress') {
      const t = (elapsedSec - 1) / 5
      return roundTo(peak * Math.max(0, Math.min(1, t)), 3)
    }
    if (phase === 'hold') {
      const jitter = (this.random() - 0.5) * 1.0
      return roundTo(peak + jitter, 3)
    }
    // release: ramp peak → 0 over 7..8s
    const t = (8 - elapsedSec) / 1
    return roundTo(peak * Math.max(0, Math.min(1, t)), 3)
  }

  private computeFinalPeakForce(outcome: DeviceOutcome): number {
    if (outcome === 'PASS') {
      // PASS: 24.5..25.5 — well within tolerance band
      return roundTo(NOMINAL_FORCE_KN - 0.5 + this.random() * 1.0, 3)
    }
    // FAIL: split below or above tolerance band
    const above = this.random() >= 0.5
    if (above) {
      // 26.5..28
      return roundTo(NOMINAL_FORCE_KN + TOLERANCE_KN + 0.5 + this.random() * 1.5, 3)
    }
    // 22..23.5
    return roundTo(NOMINAL_FORCE_KN - TOLERANCE_KN - 0.5 - this.random() * 1.5, 3)
  }

  private isInTolerance(peakForce: number): boolean {
    return Math.abs(peakForce - NOMINAL_FORCE_KN) <= TOLERANCE_KN
  }
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

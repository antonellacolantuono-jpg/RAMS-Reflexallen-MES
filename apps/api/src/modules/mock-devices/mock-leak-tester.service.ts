// PROMPT_PNE_3 D1 — Leak Tester simulator (DEV-LEAK-001).
//
// Recipe contract (RCP-LEAK-PNE-12-001 v2 from PROMPT_PNE_2 seed):
//   test_pressure_bar:        6.0
//   cycle_time_sec:           45
//   pass_threshold_mbar_min:  0.5
//   marginal_threshold_mbar_min: 1.0
//   fail_above_mbar_min:      1.0
//   phases: pressurize 5s | stabilize 5s | hold 30s | depressurize 5s
//
// Outcome leak rate bands (per PROMPT § 3.1):
//   PASS:     0.10..0.45 mbar/min
//   MARGINAL: 0.55..0.95 mbar/min
//   FAIL:     1.10..2.50 mbar/min
//
// Default outcome: PASS (override via DemoController consumes the next cycle).

import { ConflictException, Injectable, Optional, OnModuleDestroy } from '@nestjs/common'
import { WorkOrderEventsGateway } from '../events/work-order-events.gateway'
import { DemoControllerService } from './demo-controller.service'
import { ALL_OUTCOMES, type CycleCompletionListener, type DeviceOutcome, type MockDevice, type MockDeviceLifecycleState, type MockDeviceStatus } from './types'

export const LEAK_DEVICE_SERIAL = 'DEV-LEAK-001'
export const LEAK_DEFAULT_OUTCOME: DeviceOutcome = 'PASS'
export const LEAK_EXPECTED_DURATION_SEC = 45
const PROGRESS_INTERVAL_MS = 500
const CYCLE_DURATION_MS = 45_000
const TEST_PRESSURE_BAR = 6.0

type LeakPhase = 'pressurize' | 'stabilize' | 'hold' | 'depressurize'

interface ActiveLeakCycle {
  stepExecutionId: string
  outcome: DeviceOutcome
  finalLeakRateMbarMin: number
  startedAtIso: string
  elapsedMs: number
  pressureBar: number
  leakRateMbarMin: number
  phase: LeakPhase
  onComplete?: CycleCompletionListener | undefined
}

@Injectable()
export class MockLeakTesterService implements MockDevice, OnModuleDestroy {
  readonly deviceSerialNumber = LEAK_DEVICE_SERIAL
  readonly defaultOutcome = LEAK_DEFAULT_OUTCOME
  readonly supportedOutcomes = ALL_OUTCOMES
  readonly expectedDurationSec = LEAK_EXPECTED_DURATION_SEC

  private state: MockDeviceLifecycleState = 'idle'
  private currentCycle: ActiveLeakCycle | null = null
  private interval: ReturnType<typeof setInterval> | null = null
  private completion: ReturnType<typeof setTimeout> | null = null
  private lastOutcome: DeviceOutcome | null = null

  constructor(
    private readonly demo: DemoControllerService,
    private readonly events: WorkOrderEventsGateway,
    @Optional() private readonly random: () => number = Math.random,
  ) {}

  start(
    stepExecutionId: string,
    recipeParams: Record<string, unknown> = {},
    onComplete?: CycleCompletionListener,
  ): void {
    if (this.state === 'running') {
      throw new ConflictException(`${this.deviceSerialNumber} cycle already running`)
    }

    const overridden = this.demo.consumeNextOutcome(this.deviceSerialNumber)
    const outcome = overridden ?? this.defaultOutcome
    const finalLeak = this.computeFinalLeakRate(outcome)

    this.state = 'running'
    this.lastOutcome = null
    this.currentCycle = {
      stepExecutionId,
      outcome,
      finalLeakRateMbarMin: finalLeak,
      startedAtIso: new Date().toISOString(),
      elapsedMs: 0,
      pressureBar: 0,
      leakRateMbarMin: 0,
      phase: 'pressurize',
      onComplete,
    }

    this.events.emitDeviceCycleStarted({
      deviceSerialNumber: this.deviceSerialNumber,
      stepExecutionId,
      expectedDurationSec: this.expectedDurationSec,
      startedAt: this.currentCycle.startedAtIso,
      recipe: {
        testPressureBar: TEST_PRESSURE_BAR,
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
      lastOutcome: this.lastOutcome,
      telemetry: {
        phase: cycle?.phase ?? null,
        pressureBar: cycle?.pressureBar ?? 0,
        leakRateMbarMin: cycle?.leakRateMbarMin ?? 0,
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
    cycle.pressureBar = this.computePressure(elapsedSec, cycle.phase)
    cycle.leakRateMbarMin = this.computeLeakProgress(elapsedSec, cycle.phase, cycle.finalLeakRateMbarMin)

    this.events.emitDeviceCycleProgress({
      deviceSerialNumber: this.deviceSerialNumber,
      stepExecutionId: cycle.stepExecutionId,
      elapsedSec,
      telemetry: {
        phase: cycle.phase,
        pressureBar: cycle.pressureBar,
        leakRateMbarMin: cycle.leakRateMbarMin,
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
        leakRateMbarMin: cycle.finalLeakRateMbarMin,
        pressureBar: 0,
        passThresholdMbarMin: 0.5,
        marginalThresholdMbarMin: 1.0,
      },
    })

    this.lastOutcome = cycle.outcome
    this.currentCycle = null
    this.state = 'idle'

    // PNE_4_FOCUSED D2 — fire the dispatcher's completion callback (if any)
    // last, so the WS broadcast and internal state update are observable
    // before any state-machine transition the callback may trigger.
    cycle.onComplete?.(cycle.outcome)
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

  private computePhase(elapsedSec: number): LeakPhase {
    if (elapsedSec < 5) return 'pressurize'
    if (elapsedSec < 10) return 'stabilize'
    if (elapsedSec < 40) return 'hold'
    return 'depressurize'
  }

  /**
   * Pressure ramp during pressurize, slight oscillation around 6.0 in
   * stabilize/hold (±0.1 bar random walk), ramp down during depressurize.
   */
  private computePressure(elapsedSec: number, phase: LeakPhase): number {
    if (phase === 'pressurize') {
      return roundTo(TEST_PRESSURE_BAR * (elapsedSec / 5), 3)
    }
    if (phase === 'depressurize') {
      const ratio = (45 - elapsedSec) / 5
      return roundTo(TEST_PRESSURE_BAR * Math.max(ratio, 0), 3)
    }
    // stabilize + hold: oscillate around 6.0 ± 0.1
    const jitter = (this.random() - 0.5) * 0.2
    return roundTo(TEST_PRESSURE_BAR + jitter, 3)
  }

  /**
   * Leak rate climbs linearly during the hold phase from 0 to the final
   * value; before hold it's 0, after hold it equals the final value.
   */
  private computeLeakProgress(elapsedSec: number, phase: LeakPhase, final: number): number {
    if (phase === 'pressurize' || phase === 'stabilize') return 0
    if (phase === 'depressurize') return roundTo(final, 3)
    // hold: linear ramp from 10s..40s
    const t = (elapsedSec - 10) / 30
    return roundTo(final * Math.max(0, Math.min(1, t)), 3)
  }

  private computeFinalLeakRate(outcome: DeviceOutcome): number {
    const r = this.random()
    if (outcome === 'PASS') return roundTo(0.1 + r * 0.35, 3) // 0.10..0.45
    if (outcome === 'MARGINAL') return roundTo(0.55 + r * 0.4, 3) // 0.55..0.95
    return roundTo(1.1 + r * 1.4, 3) // FAIL: 1.10..2.50
  }
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

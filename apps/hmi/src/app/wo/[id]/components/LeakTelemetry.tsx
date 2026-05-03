'use client'
import * as React from 'react'
import { PressureChart } from '../../../../components/leak-test/PressureChart'
import type { DeviceCycleState } from '../../../../lib/use-device-cycle'

export interface LeakTelemetryProps {
  cycle: DeviceCycleState
  /** Threshold in mbar/min above which the leak rate fails (default 0.5 from RCP-LEAK-PNE-12-001 v2). */
  passThresholdMbarMin?: number
  /** Target nominal pressure (default 6.0 bar). */
  targetPressureBar?: number
  /** Pressure tolerance band (default ±0.1 bar). */
  pressureToleranceBar?: number
}

export function LeakTelemetry({
  cycle,
  passThresholdMbarMin = 0.5,
  targetPressureBar = 6.0,
  pressureToleranceBar = 0.1,
}: LeakTelemetryProps) {
  const pressureWithinBand =
    Math.abs(cycle.pressureBar - targetPressureBar) <= pressureToleranceBar
  const leakBelowThreshold = cycle.leakRateMbarMin <= passThresholdMbarMin

  return (
    <div
      className="flex flex-col gap-4"
      data-testid="leak-telemetry"
      data-leak-pass={leakBelowThreshold ? 'true' : 'false'}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2 border border-line bg-paper p-3">
          <span className="text-[10px] uppercase tracking-wider text-ink-3 font-semibold">
            Pressione
          </span>
          <div
            className={`font-mono tabular-nums text-2xl ${
              cycle.status === 'idle'
                ? 'text-ink'
                : pressureWithinBand
                  ? 'text-ok-ink'
                  : 'text-warn-ink'
            }`}
            data-testid="leak-pressure"
          >
            {cycle.pressureBar.toFixed(2)} <span className="text-ink-3 text-sm">bar</span>
          </div>
          <span className="text-[11px] text-ink-3">
            target {targetPressureBar.toFixed(1)} ± {pressureToleranceBar.toFixed(1)}
          </span>
        </div>
        <div className="rounded-2 border border-line bg-paper p-3">
          <span className="text-[10px] uppercase tracking-wider text-ink-3 font-semibold">
            Leak rate
          </span>
          <div
            className={`font-mono tabular-nums text-2xl ${
              cycle.status === 'idle'
                ? 'text-ink'
                : leakBelowThreshold
                  ? 'text-ok-ink'
                  : 'text-bad-ink'
            }`}
            data-testid="leak-rate"
          >
            {cycle.leakRateMbarMin.toFixed(2)} <span className="text-ink-3 text-sm">mbar/min</span>
          </div>
          <span
            className={`text-[11px] ${
              leakBelowThreshold ? 'text-ok-ink' : 'text-bad-ink'
            }`}
            data-testid="leak-threshold-line"
          >
            soglia ≤ {passThresholdMbarMin.toFixed(2)} mbar/min
          </span>
        </div>
      </div>
      <div className="text-info-ink">
        <PressureChart
          history={cycle.pressureHistory}
          targetBar={targetPressureBar}
          toleranceBar={pressureToleranceBar}
          width={420}
          height={80}
        />
      </div>
    </div>
  )
}

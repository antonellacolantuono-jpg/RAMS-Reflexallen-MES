'use client'
import * as React from 'react'

export interface CrimpTelemetryProps {
  /** Live force in kN from progress events. */
  forceKn: number
  /** Peak force seen so far in this cycle. */
  peakForceKn: number
  /** Nominal force target (default 25 kN from RCP-CRIMP-12-001). */
  nominalForceKn?: number
  /** Tolerance band ± kN around the nominal (default 1 kN). */
  toleranceKn?: number
  /** Cycle status from useDeviceCycle. */
  status: 'idle' | 'running' | 'complete'
}

export function CrimpTelemetry({
  forceKn,
  peakForceKn,
  nominalForceKn = 25,
  toleranceKn = 1,
  status,
}: CrimpTelemetryProps) {
  const peakWithinBand = Math.abs(peakForceKn - nominalForceKn) <= toleranceKn
  const max = nominalForceKn + toleranceKn * 4
  const pct = Math.min(100, Math.max(0, (forceKn / max) * 100))
  const lowPct = ((nominalForceKn - toleranceKn) / max) * 100
  const highPct = ((nominalForceKn + toleranceKn) / max) * 100

  return (
    <div className="flex flex-col gap-3" data-testid="crimp-telemetry">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2 border border-line bg-paper p-3">
          <span className="text-[10px] uppercase tracking-wider text-ink-3 font-semibold">
            Forza istantanea
          </span>
          <div
            className="font-mono tabular-nums text-2xl text-ink"
            data-testid="crimp-force"
          >
            {forceKn.toFixed(2)} <span className="text-ink-3 text-sm">kN</span>
          </div>
        </div>
        <div className="rounded-2 border border-line bg-paper p-3">
          <span className="text-[10px] uppercase tracking-wider text-ink-3 font-semibold">
            Picco
          </span>
          <div
            className={`font-mono tabular-nums text-2xl ${
              status === 'idle'
                ? 'text-ink'
                : peakWithinBand
                  ? 'text-ok-ink'
                  : 'text-bad-ink'
            }`}
            data-testid="crimp-peak"
          >
            {peakForceKn.toFixed(2)} <span className="text-ink-3 text-sm">kN</span>
          </div>
          <span className="text-[11px] text-ink-3">
            target {nominalForceKn.toFixed(1)} ± {toleranceKn.toFixed(1)} kN
          </span>
        </div>
      </div>
      <div className="relative h-3 w-full rounded-pill bg-paper-3 overflow-hidden">
        <div
          className="absolute inset-y-0 bg-ok-soft"
          style={{ left: `${lowPct}%`, width: `${highPct - lowPct}%` }}
        />
        <div
          className={`absolute inset-y-0 left-0 ${
            peakWithinBand ? 'bg-ok' : 'bg-bad'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

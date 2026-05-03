'use client'
import * as React from 'react'
import { KpiHero, Progress, StatusBadge } from '@mes/ui'
import type { DeviceCycleState } from '../../lib/use-device-cycle'
import { PressureChart } from './PressureChart'

export interface DevicePaneProps {
  deviceSerialNumber: string
  recipeCode: string
  recipeVersion: number | string
  cycleTimeSec: number
  targetPressureBar: number
  pressureToleranceBar: number
  cycle: DeviceCycleState
  className?: string
}

const PHASE_LABELS_IT: Record<string, string> = {
  pressurize: 'Pressurizzazione',
  stabilize: 'Stabilizzazione',
  hold: 'Mantenimento e misura',
  depressurize: 'Depressurizzazione',
}

function formatPhase(phase: string | null): string {
  if (!phase) return '—'
  return PHASE_LABELS_IT[phase] ?? phase
}

function formatStatus(status: DeviceCycleState['status']): {
  tone: 'ok' | 'info' | 'neutral'
  label: string
} {
  switch (status) {
    case 'running':
      return { tone: 'info', label: 'IN ESECUZIONE' }
    case 'complete':
      return { tone: 'ok', label: 'COMPLETATO' }
    case 'idle':
    default:
      return { tone: 'neutral', label: 'IN ATTESA' }
  }
}

export function DevicePane({
  deviceSerialNumber,
  recipeCode,
  recipeVersion,
  cycleTimeSec,
  targetPressureBar,
  pressureToleranceBar,
  cycle,
  className,
}: DevicePaneProps) {
  const remaining = Math.max(0, cycleTimeSec - cycle.elapsedSec)
  const progressPct = Math.min(
    100,
    Math.round((cycle.elapsedSec / cycleTimeSec) * 100),
  )
  const status = formatStatus(cycle.status)
  const pressureWithinBand =
    Math.abs(cycle.pressureBar - targetPressureBar) <= pressureToleranceBar
  const pressureTone: 'ok' | 'warn' | 'neutral' =
    cycle.status === 'idle'
      ? 'neutral'
      : pressureWithinBand
        ? 'ok'
        : 'warn'

  return (
    <section
      className={`rounded-3 border border-line bg-paper p-6 flex flex-col gap-5 ${className ?? ''}`}
      data-testid="leak-device-pane"
    >
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-ink-3 font-semibold">
            Dispositivo
          </span>
          <h2 className="text-xl font-semibold text-ink leading-tight">
            {deviceSerialNumber}
          </h2>
          <span className="text-sm text-ink-2 mt-1">
            Ricetta:{' '}
            <span className="font-mono">
              {recipeCode} v{recipeVersion}
            </span>
          </span>
        </div>
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </header>

      <div className="flex flex-col gap-3" data-testid="leak-countdown">
        <KpiHero
          label="Conto alla rovescia"
          value={remaining}
          unit="sec"
          tone={cycle.status === 'complete' ? 'ok' : 'accent'}
          big
        />
        <Progress
          value={progressPct}
          max={100}
          tone={cycle.status === 'complete' ? 'ok' : 'accent'}
          showLabel
          aria-label="Progresso ciclo"
        />
      </div>

      <div className="flex flex-col gap-2 text-ink-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-wider text-ink-3 font-semibold">
            Pressione
          </span>
          <span
            className={`font-mono tabular-nums text-2xl ${
              pressureTone === 'ok'
                ? 'text-ok-ink'
                : pressureTone === 'warn'
                  ? 'text-warn-ink'
                  : 'text-ink'
            }`}
            data-testid="leak-pressure-bar"
          >
            {cycle.pressureBar.toFixed(2)} bar
          </span>
        </div>
        <span className="text-xs text-ink-3">
          target {targetPressureBar.toFixed(1)} bar ± {pressureToleranceBar.toFixed(1)} bar
        </span>
        <div className="text-info-ink">
          <PressureChart
            history={cycle.pressureHistory}
            targetBar={targetPressureBar}
            toleranceBar={pressureToleranceBar}
            width={420}
            height={88}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-3">
          Fase:{' '}
          <span className="text-ink font-medium" data-testid="leak-phase">
            {formatPhase(cycle.phase)}
          </span>
        </span>
        {cycle.leakRateMbarMin > 0 && (
          <span className="text-ink-2 font-mono tabular-nums">
            Leak: {cycle.leakRateMbarMin.toFixed(2)} mbar/min
          </span>
        )}
      </div>
    </section>
  )
}

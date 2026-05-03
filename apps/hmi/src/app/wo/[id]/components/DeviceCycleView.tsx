'use client'
import * as React from 'react'
import { Button, KpiHero, Progress, StatusBadge } from '@mes/ui'
import { useDeviceCycle, type DeviceOutcome } from '../../../../lib/use-device-cycle'
import { useMockDeviceStatus } from '../../../../lib/use-mock-device-status'
import type { WorkOrderStep } from '../../../../lib/queries'
import { LeakTelemetry } from './LeakTelemetry'
import { CameraROIGrid } from './CameraROIGrid'
import { CrimpTelemetry } from './CrimpTelemetry'

const RECIPE_BY_DEVICE: Record<
  string,
  { code: string; version: number; cycleTimeSec: number }
> = {
  'DEV-LEAK-001': { code: 'RCP-LEAK-PNE-12-001', version: 2, cycleTimeSec: 45 },
  'DEV-CAMERA-001': { code: 'RCP-CAMERA-PNE-001', version: 1, cycleTimeSec: 8 },
  'DEV-CRIMP-001': { code: 'RCP-CRIMP-12-001', version: 1, cycleTimeSec: 8 },
}

const OUTCOME_TONE: Record<DeviceOutcome, 'ok' | 'warn' | 'bad'> = {
  PASS: 'ok',
  MARGINAL: 'warn',
  FAIL: 'bad',
}

const OUTCOME_LABEL: Record<DeviceOutcome, string> = {
  PASS: 'OK',
  MARGINAL: 'MARGINALE',
  FAIL: 'NOK',
}

export interface DeviceCycleViewProps {
  step: WorkOrderStep
  /** Continue button — fires COMPLETE_OK as a manual override / acknowledgement. */
  onContinue?: (() => void) | undefined
  /** Force-fail / NOK button — fires COMPLETE_NOK and routes to recovery (D4). */
  onFail?: (() => void) | undefined
  isPending?: boolean | undefined
}

export function DeviceCycleView({
  step,
  onContinue,
  onFail,
  isPending,
}: DeviceCycleViewProps) {
  const serial = step.deviceSerialNumber ?? ''
  const recipe = RECIPE_BY_DEVICE[serial] ?? {
    code: 'RCP-UNKNOWN',
    version: 1,
    cycleTimeSec: 30,
  }
  const cycle = useDeviceCycle(serial)
  // PNE_4_FOCUSED D2 — periodic polling on the REST endpoint as a safety net
  // alongside the WS-driven hook. Currently used to detect the cycle outcome
  // even when WS reconnects mid-cycle. Result is exposed through `cycle.outcome`
  // when the WS event lands; polled status mirrors `lastOutcome` so we can
  // stitch a complete view if WS missed `device:cycle:complete`.
  const polledStatus = useMockDeviceStatus(serial)
  const fallbackOutcome = polledStatus?.lastOutcome ?? null
  const effectiveOutcome: DeviceOutcome | null =
    cycle.outcome ?? (fallbackOutcome as DeviceOutcome | null)
  const isComplete =
    cycle.status === 'complete' || (polledStatus?.state === 'idle' && !!fallbackOutcome)

  const remainingSec = Math.max(0, recipe.cycleTimeSec - cycle.elapsedSec)
  const progressPct = Math.min(
    100,
    Math.round((cycle.elapsedSec / recipe.cycleTimeSec) * 100),
  )

  const stateLabel = isComplete
    ? 'COMPLETATO'
    : cycle.status === 'running'
      ? 'IN ESECUZIONE'
      : 'IN ATTESA'
  const stateTone: 'ok' | 'info' | 'neutral' = isComplete
    ? 'ok'
    : cycle.status === 'running'
      ? 'info'
      : 'neutral'

  return (
    <section
      className="rounded-3 border border-line bg-paper p-6 flex flex-col gap-5"
      data-testid="device-cycle-view"
      data-device-serial={serial}
    >
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-ink-3 font-semibold">
            Dispositivo
          </span>
          <h2 className="text-xl font-semibold text-ink leading-tight">
            {serial || '—'}
          </h2>
          <span className="text-sm text-ink-2 mt-1">
            Ricetta:{' '}
            <span className="font-mono">
              {recipe.code} v{recipe.version}
            </span>
          </span>
        </div>
        <StatusBadge tone={stateTone}>{stateLabel}</StatusBadge>
      </header>

      <div className="flex flex-col gap-3" data-testid="device-cycle-countdown">
        <KpiHero
          label="Conto alla rovescia"
          value={remainingSec}
          unit="sec"
          tone={isComplete ? 'ok' : 'accent'}
          big
        />
        <Progress
          value={progressPct}
          max={100}
          tone={isComplete ? 'ok' : 'accent'}
          showLabel
          aria-label="Progresso ciclo"
        />
      </div>

      {serial === 'DEV-LEAK-001' && <LeakTelemetry cycle={cycle} />}
      {serial === 'DEV-CAMERA-001' && (
        <CameraROIGrid rois={(cycle.rois as never) ?? []} />
      )}
      {serial === 'DEV-CRIMP-001' && (
        <CrimpTelemetry
          forceKn={
            typeof (cycle as unknown as { forceKn?: number }).forceKn === 'number'
              ? ((cycle as unknown as { forceKn: number }).forceKn)
              : 0
          }
          peakForceKn={
            typeof (cycle as unknown as { peakForceKn?: number }).peakForceKn ===
            'number'
              ? ((cycle as unknown as { peakForceKn: number }).peakForceKn)
              : 0
          }
          status={cycle.status}
        />
      )}

      {effectiveOutcome && (
        <div
          className={`rounded-2 border p-4 flex items-center justify-between gap-3 ${
            effectiveOutcome === 'PASS'
              ? 'border-ok bg-ok-soft'
              : effectiveOutcome === 'MARGINAL'
                ? 'border-warn bg-warn-soft'
                : 'border-bad bg-bad-soft'
          }`}
          data-testid="device-cycle-outcome"
          data-outcome={effectiveOutcome}
        >
          <div className="flex items-center gap-3">
            <span
              className={`text-3xl font-mono font-semibold ${
                OUTCOME_TONE[effectiveOutcome] === 'ok'
                  ? 'text-ok-ink'
                  : OUTCOME_TONE[effectiveOutcome] === 'warn'
                    ? 'text-warn-ink'
                    : 'text-bad-ink'
              }`}
            >
              {OUTCOME_LABEL[effectiveOutcome]}
            </span>
            <span className="text-sm text-ink-2">
              {effectiveOutcome === 'PASS' && 'Esito positivo, prosegui col pezzo successivo.'}
              {effectiveOutcome === 'MARGINAL' && 'Esito marginale: ripeti o approva con QC.'}
              {effectiveOutcome === 'FAIL' && 'Esito negativo: avvia recovery.'}
            </span>
          </div>
          {effectiveOutcome === 'FAIL' && onFail ? (
            <Button size="hmi" variant="danger" onClick={onFail} disabled={isPending}>
              Avvia recovery
            </Button>
          ) : (
            onContinue && (
              <Button
                size="hmi"
                variant="primary"
                onClick={onContinue}
                disabled={isPending}
              >
                Continua
              </Button>
            )
          )}
        </div>
      )}
    </section>
  )
}

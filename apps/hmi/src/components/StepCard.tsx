'use client'
import * as React from 'react'
import { Badge, Button } from '@mes/ui'
import type {
  StepExecutionStatus,
  WorkOrderStep,
} from '../lib/queries'

type StepCategoryKey =
  | 'production'
  | 'identification'
  | 'quality_control'
  | 'logistics'

const CATEGORY_LABEL: Record<string, string> = {
  production: 'Produzione',
  identification: 'Scansione',
  quality_control: 'Controllo Qualità',
  logistics: 'Logistica',
  decision: 'Decisione',
  information: 'Informazione',
  setup: 'Setup',
  teardown: 'Smontaggio',
  recovery: 'Recupero',
}

const CATEGORY_TONE: Record<
  string,
  'accent' | 'info' | 'warn' | 'neutral'
> = {
  production: 'accent',
  identification: 'info',
  quality_control: 'warn',
  logistics: 'neutral',
}

const STATUS_LABEL: Record<StepExecutionStatus, string> = {
  pending: 'In attesa',
  running: 'In corso',
  paused: 'In pausa',
  blocked: 'Bloccato',
  qc_hold: 'In controllo QC',
  scrapped: 'Scartato',
  done: 'Completato',
  skipped: 'Saltato',
  cancelled: 'Annullato',
  recovered: 'Recuperato',
  error: 'Errore',
}

const STATUS_TONE: Record<
  StepExecutionStatus,
  'neutral' | 'accent' | 'ok' | 'bad' | 'warn' | 'info'
> = {
  pending: 'neutral',
  running: 'accent',
  paused: 'warn',
  blocked: 'bad',
  qc_hold: 'info',
  scrapped: 'bad',
  done: 'ok',
  skipped: 'neutral',
  cancelled: 'neutral',
  recovered: 'ok',
  error: 'bad',
}

const RING_BY_STATUS: Partial<Record<StepExecutionStatus, string>> = {
  running: 'ring-2 ring-accent shadow-lg',
  paused: 'ring-2 ring-warn',
  qc_hold: 'ring-2 ring-info',
  recovered: 'ring-2 ring-ok',
  error: 'ring-2 ring-bad',
}

const TERMINAL_STATUSES: StepExecutionStatus[] = [
  'done',
  'skipped',
  'cancelled',
]

const PAST_STATUSES: StepExecutionStatus[] = [
  ...TERMINAL_STATUSES,
  'blocked',
  'scrapped',
]

function formatTime(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '—'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function statusGlyph(status: StepExecutionStatus, indexLabel: string): string {
  switch (status) {
    case 'done':
      return '✓'
    case 'recovered':
      return '↻'
    case 'blocked':
    case 'scrapped':
    case 'error':
      return '✗'
    case 'paused':
      return '‖'
    case 'qc_hold':
      return '?'
    case 'skipped':
      return '–'
    case 'cancelled':
      return '⊘'
    default:
      return indexLabel
  }
}

function statusBgClass(status: StepExecutionStatus): string {
  switch (status) {
    case 'running':
      return 'bg-accent text-white'
    case 'done':
    case 'recovered':
      return 'bg-ok text-white'
    case 'blocked':
    case 'scrapped':
    case 'error':
      return 'bg-bad text-white'
    case 'paused':
      return 'bg-warn text-warn-ink'
    case 'qc_hold':
      return 'bg-info text-white'
    default:
      return 'bg-paper-3 text-ink-2'
  }
}

export interface StepCardProps {
  step: WorkOrderStep
  index: number
  totalSteps: number
  onComplete?: () => void
  onMarkBlocked?: () => void
  onPause?: () => void
  onResume?: () => void
  blockedNote?: string | undefined
  isPending?: boolean
}

export function StepCard({
  step,
  index,
  totalSteps,
  onComplete,
  onMarkBlocked,
  onPause,
  onResume,
  blockedNote,
  isPending,
}: StepCardProps) {
  const status = step.status
  const isActive = status === 'running'
  const isPaused = status === 'paused'
  const isPast = PAST_STATUSES.includes(status)
  const isFuture = status === 'pending'
  const isScrapped = status === 'scrapped'
  const ringClass = RING_BY_STATUS[status] ?? ''

  return (
    <div
      className={[
        'glass rounded-3 transition-all',
        isActive || isPaused || status === 'qc_hold' || status === 'recovered' || status === 'error'
          ? 'p-6'
          : 'p-4',
        ringClass,
        isPast ? 'opacity-75' : '',
        isFuture ? 'opacity-50' : '',
        isScrapped ? 'line-through' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid={`step-card-${step.stepOrder}`}
      data-status={status}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={[
              'shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold tabular-nums',
              statusBgClass(status),
            ].join(' ')}
            aria-label={`Step ${index + 1} di ${totalSteps}`}
          >
            {statusGlyph(status, String(index + 1))}
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone={CATEGORY_TONE[step.stepCategory] ?? 'neutral'}>
                {CATEGORY_LABEL[step.stepCategory] ?? step.stepCategory}
              </Badge>
              <Badge tone={STATUS_TONE[status]} dot>
                {STATUS_LABEL[status]}
              </Badge>
            </div>
            <h3
              className={[
                'font-semibold text-ink leading-tight',
                isActive ? 'text-xl' : 'text-base',
              ].join(' ')}
            >
              {step.stepName}
            </h3>
          </div>
        </div>
      </div>

      {(isActive || isPaused) && (
        <div className="mt-5 flex flex-col gap-4">
          {step.instructions && (
            <p className="text-base text-ink-2 leading-relaxed">
              {step.instructions}
            </p>
          )}

          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div className="flex flex-col">
              <dt className="text-ink-3 uppercase text-xs tracking-wide">
                Durata corrente
              </dt>
              <dd className="text-ink font-medium tabular-nums">
                {formatTime(step.durationSec)}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-ink-3 uppercase text-xs tracking-wide">
                Azione
              </dt>
              <dd className="text-ink font-medium">{step.actionType}</dd>
            </div>
          </dl>

          {isActive && (
            <div className="grid grid-cols-3 gap-3 mt-2">
              <Button
                size="hmi"
                variant="danger"
                onClick={onMarkBlocked}
                disabled={isPending}
                className="col-span-1"
              >
                NOK
              </Button>
              <Button
                size="hmi"
                variant="primary"
                onClick={onComplete}
                disabled={isPending}
                className="col-span-2 text-2xl"
              >
                OK
              </Button>
              {onPause && (
                <Button
                  size="md"
                  variant="ghost"
                  onClick={onPause}
                  disabled={isPending}
                  className="col-span-3"
                >
                  Pausa
                </Button>
              )}
            </div>
          )}

          {isPaused && onResume && (
            <div className="mt-2">
              <Button
                size="hmi"
                variant="primary"
                onClick={onResume}
                disabled={isPending}
                className="w-full text-2xl"
              >
                Riprendi
              </Button>
            </div>
          )}
        </div>
      )}

      {(status === 'blocked' || status === 'scrapped') && blockedNote && (
        <div className="mt-3 rounded-2 bg-bad-soft px-3 py-2 text-sm text-bad-ink">
          <span className="font-semibold">Note: </span>
          {blockedNote}
        </div>
      )}

      {status === 'qc_hold' && (
        <div className="mt-3 rounded-2 bg-info-soft px-3 py-2 text-sm text-info-ink">
          In attesa di conferma da supervisore qualità.
        </div>
      )}

      {status === 'recovered' && (
        <div className="mt-3 rounded-2 bg-ok-soft px-3 py-2 text-sm text-ok-ink">
          Step recuperato — pronto per riprendere o concludere.
        </div>
      )}

      {status === 'error' && (
        <div className="mt-3 rounded-2 bg-bad-soft px-3 py-2 text-sm text-bad-ink">
          Errore di esecuzione. È necessario un reset da supervisore.
        </div>
      )}
    </div>
  )
}

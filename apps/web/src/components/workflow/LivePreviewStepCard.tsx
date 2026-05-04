'use client'

// PROMPT_3c — operator's-eye renderer for the workflow editor sidebar.
//
// This is a deliberate copy of the HMI StepCard's visual logic
// (apps/hmi/src/components/StepCard.tsx) — same status maps, glyphs, tones,
// callouts. We mirror rather than cross-app-import because:
//   - HMI's StepCard consumes WorkOrderStep (execution-runtime data); the
//     editor only has workflow AST data.
//   - tsconfig paths don't bridge apps; coupling here would force HMI types
//     into the editor and complicate future HMI refactors.
// When the visual contract drifts, both files need updating — covered by the
// mirror tests in LivePreviewStepCard.test.tsx.

import * as React from 'react'
import { Badge, ImageDisplay } from '@mes/ui'
import type { PreviewState, HmiStatus } from './livePreview/states'
import { PREVIEW_TO_HMI_STATUS } from './livePreview/states'
import type {
  PreviewRuntimeFields,
  PreviewStepData,
} from './livePreview/mockData'

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

const STATUS_LABEL: Record<HmiStatus, string> = {
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
  HmiStatus,
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

const RING_BY_STATUS: Partial<Record<HmiStatus, string>> = {
  running: 'ring-2 ring-accent shadow-lg',
  paused: 'ring-2 ring-warn',
  qc_hold: 'ring-2 ring-info',
  recovered: 'ring-2 ring-ok',
  error: 'ring-2 ring-bad',
}

function formatTime(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '—'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function statusGlyph(status: HmiStatus, indexLabel: string): string {
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

function statusBgClass(status: HmiStatus): string {
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

export interface LivePreviewStepCardProps {
  step: PreviewStepData
  state: PreviewState
  runtime: PreviewRuntimeFields
}

export function LivePreviewStepCard({
  step,
  state,
  runtime,
}: LivePreviewStepCardProps) {
  const status = PREVIEW_TO_HMI_STATUS[state]
  const isActive = status === 'running'
  const isPaused = status === 'paused'
  const isPast =
    status === 'done' ||
    status === 'skipped' ||
    status === 'cancelled' ||
    status === 'blocked' ||
    status === 'scrapped'
  const isFuture = status === 'pending'
  const isScrapped = status === 'scrapped'
  const ringClass = RING_BY_STATUS[status] ?? ''

  return (
    <div
      className={[
        'glass rounded-3 transition-all duration-300',
        isActive ||
        isPaused ||
        status === 'qc_hold' ||
        status === 'recovered' ||
        status === 'error'
          ? 'p-6'
          : 'p-4',
        ringClass,
        isPast ? 'opacity-75' : '',
        isFuture ? 'opacity-50' : '',
        isScrapped ? 'line-through' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="live-preview-step-card"
      data-state={state}
      data-status={status}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={[
              'shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold tabular-nums',
              statusBgClass(status),
            ].join(' ')}
            aria-label={`Anteprima step in stato ${state}`}
          >
            {statusGlyph(status, '1')}
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone={CATEGORY_TONE[step.category] ?? 'neutral'}>
                {CATEGORY_LABEL[step.category] ?? step.category}
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
              {step.name}
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

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex flex-col">
              <dt className="text-ink-3 uppercase text-xs tracking-wide">
                Durata corrente
              </dt>
              <dd className="text-ink font-medium tabular-nums">
                {formatTime(runtime.durationSec)}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-ink-3 uppercase text-xs tracking-wide">
                Azione
              </dt>
              <dd className="text-ink font-medium">{step.actionType}</dd>
            </div>
          </dl>

          {step.photoUrl && (
            <figure
              className="flex flex-col gap-1"
              data-testid="live-preview-photo"
            >
              <ImageDisplay
                src={step.photoUrl}
                alt="Foto di riferimento"
                size="reference"
                fallback="none"
              />
              <figcaption className="text-[10px] text-ink-3">
                Foto di riferimento
              </figcaption>
            </figure>
          )}
        </div>
      )}

      {(status === 'blocked' || status === 'scrapped') && runtime.blockedNote && (
        <div className="mt-3 rounded-2 bg-bad-soft px-3 py-2 text-sm text-bad-ink">
          <span className="font-semibold">Note: </span>
          {runtime.blockedNote}
        </div>
      )}

      {status === 'qc_hold' && (
        <div className="mt-3 rounded-2 bg-info-soft px-3 py-2 text-sm text-info-ink">
          {runtime.blockedNote ??
            'In attesa di conferma da supervisore qualità.'}
        </div>
      )}

      {status === 'recovered' && (
        <div className="mt-3 rounded-2 bg-ok-soft px-3 py-2 text-sm text-ok-ink">
          Step recuperato — pronto per riprendere o concludere.
        </div>
      )}

      {status === 'error' && (
        <div className="mt-3 rounded-2 bg-bad-soft px-3 py-2 text-sm text-bad-ink">
          {runtime.blockedNote ??
            'Errore di esecuzione. È necessario un reset da supervisore.'}
        </div>
      )}

      {status === 'cancelled' && runtime.blockedNote && (
        <div className="mt-3 rounded-2 bg-neutral-soft px-3 py-2 text-sm text-ink-2">
          {runtime.blockedNote}
        </div>
      )}
    </div>
  )
}

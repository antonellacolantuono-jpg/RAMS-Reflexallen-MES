'use client'
import * as React from 'react'
import { Button } from '@mes/ui'
import type { WorkOrderStep } from '../../../../lib/queries'

const PART_REFERENCE_LABEL_IT: Record<string, string> = {
  previous: 'pezzo precedente',
  current: 'pezzo corrente',
  next: 'pezzo successivo',
}

function statusToVisual(status: WorkOrderStep['status']):
  | { tone: 'idle' | 'running' | 'done' | 'skipped'; label: string }
{
  if (status === 'running') return { tone: 'running', label: 'In esecuzione' }
  if (status === 'done' || status === 'recovered')
    return { tone: 'done', label: 'Completato' }
  if (status === 'skipped' || status === 'scrapped' || status === 'cancelled')
    return { tone: 'skipped', label: 'Saltato' }
  return { tone: 'idle', label: 'In attesa' }
}

export interface ParallelSlotProps {
  step: WorkOrderStep
  /** Parallel slots are interactive only while the device is running. */
  deviceRunning: boolean
  onStart?: (() => void) | undefined
  onComplete?: (() => void) | undefined
  /** Skip the slot — fires COMPLETE_NOK with causeCode='operator_choice'. */
  onSkip?: (() => void) | undefined
  isPending?: boolean | undefined
}

export function ParallelSlot({
  step,
  deviceRunning,
  onStart,
  onComplete,
  onSkip,
  isPending,
}: ParallelSlotProps) {
  const visual = statusToVisual(step.status)
  const partRef = (() => {
    const m = /partReference: (previous|current|next)/.exec(
      step.instructions ?? '',
    )
    return m?.[1] ?? null
  })()
  const isTerminal = visual.tone === 'done' || visual.tone === 'skipped'
  const interactive = deviceRunning && !isTerminal

  return (
    <article
      className={`rounded-2 border bg-paper p-4 flex flex-col gap-2 ${
        visual.tone === 'running'
          ? 'border-accent ring-1 ring-accent shadow-sm'
          : visual.tone === 'done'
            ? 'border-ok'
            : visual.tone === 'skipped'
              ? 'border-line opacity-60'
              : 'border-line'
      } ${!deviceRunning && !isTerminal ? 'opacity-50' : ''}`}
      data-testid={`parallel-slot-${step.stepOrder}`}
      data-status={step.status}
      data-interactive={interactive ? 'true' : 'false'}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-ink-3 font-semibold">
            {step.actionType}
            {partRef && (
              <>
                {' · '}
                <span className="text-ink-2">{PART_REFERENCE_LABEL_IT[partRef]}</span>
              </>
            )}
          </span>
          <h4 className="text-sm font-semibold text-ink leading-tight">
            {step.stepName}
          </h4>
        </div>
        <span
          className={`shrink-0 rounded-pill px-2 py-0.5 text-[10px] font-semibold ${
            visual.tone === 'running'
              ? 'bg-accent-soft text-accent'
              : visual.tone === 'done'
                ? 'bg-ok-soft text-ok-ink'
                : visual.tone === 'skipped'
                  ? 'bg-paper-2 text-ink-3'
                  : 'bg-paper-2 text-ink-3'
          }`}
        >
          {visual.label}
        </span>
      </header>

      {!isTerminal && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {step.status === 'pending' && (
            <Button
              size="md"
              variant="primary"
              onClick={onStart}
              disabled={!interactive || isPending}
              className="col-span-1"
              data-testid={`parallel-slot-${step.stepOrder}-start`}
            >
              Esegui
            </Button>
          )}
          {step.status === 'running' && (
            <Button
              size="md"
              variant="primary"
              onClick={onComplete}
              disabled={!interactive || isPending}
              className="col-span-1"
              data-testid={`parallel-slot-${step.stepOrder}-complete`}
            >
              Completa
            </Button>
          )}
          <Button
            size="md"
            variant="ghost"
            onClick={onSkip}
            disabled={!interactive || isPending}
            className="col-span-1"
            data-testid={`parallel-slot-${step.stepOrder}-skip`}
          >
            Salta
          </Button>
        </div>
      )}

      {!deviceRunning && !isTerminal && (
        <p className="text-[10px] text-ink-3 italic">
          Disponibile durante il ciclo dispositivo.
        </p>
      )}
    </article>
  )
}

'use client'
import * as React from 'react'
import { Badge, Button } from '@mes/ui'
import type { MockStep, StepCategory, StepStatus } from '../lib/mock-data'

const CATEGORY_LABEL: Record<StepCategory, string> = {
  production: 'Produzione',
  identification: 'Scansione',
  quality_control: 'Controllo Qualità',
  logistics: 'Logistica',
}

const CATEGORY_TONE: Record<
  StepCategory,
  'accent' | 'info' | 'warn' | 'neutral'
> = {
  production: 'accent',
  identification: 'info',
  quality_control: 'warn',
  logistics: 'neutral',
}

const STATUS_LABEL: Record<StepStatus, string> = {
  pending: 'In attesa',
  running: 'In corso',
  done: 'Completato',
  blocked: 'Bloccato',
}

const STATUS_TONE: Record<StepStatus, 'neutral' | 'accent' | 'ok' | 'bad'> = {
  pending: 'neutral',
  running: 'accent',
  done: 'ok',
  blocked: 'bad',
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

interface StepCardProps {
  step: MockStep
  index: number
  totalSteps: number
  onComplete: () => void
  onMarkBlocked: () => void
  blockedNote?: string | undefined
}

export function StepCard({
  step,
  index,
  totalSteps,
  onComplete,
  onMarkBlocked,
  blockedNote,
}: StepCardProps) {
  const isActive = step.status === 'running'
  const isPast = step.status === 'done' || step.status === 'blocked'
  const isFuture = step.status === 'pending'

  return (
    <div
      className={[
        'glass rounded-3 transition-all',
        isActive ? 'p-6 ring-2 ring-accent shadow-lg' : 'p-4',
        isPast ? 'opacity-75' : '',
        isFuture ? 'opacity-50' : '',
      ].join(' ')}
      data-testid={`step-card-${step.order}`}
      data-status={step.status}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={[
              'shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold tabular-nums',
              isActive
                ? 'bg-accent text-white'
                : step.status === 'done'
                  ? 'bg-ok text-white'
                  : step.status === 'blocked'
                    ? 'bg-bad text-white'
                    : 'bg-paper-3 text-ink-2',
            ].join(' ')}
            aria-label={`Step ${index + 1} di ${totalSteps}`}
          >
            {step.status === 'done' ? '✓' : step.status === 'blocked' ? '✗' : index + 1}
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone={CATEGORY_TONE[step.category]}>
                {CATEGORY_LABEL[step.category]}
              </Badge>
              <Badge tone={STATUS_TONE[step.status]} dot>
                {STATUS_LABEL[step.status]}
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

      {isActive && (
        <div className="mt-5 flex flex-col gap-4">
          <p className="text-base text-ink-2 leading-relaxed">
            {step.instructions}
          </p>

          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div className="flex flex-col">
              <dt className="text-ink-3 uppercase text-xs tracking-wide">
                Tempo standard
              </dt>
              <dd className="text-ink font-medium tabular-nums">
                {formatTime(step.standardTimeSec)}
              </dd>
            </div>
            {step.skillCode && (
              <div className="flex flex-col">
                <dt className="text-ink-3 uppercase text-xs tracking-wide">
                  Skill richiesta
                </dt>
                <dd className="text-ink font-medium">{step.skillCode}</dd>
              </div>
            )}
            {step.deviceCode && (
              <div className="flex flex-col">
                <dt className="text-ink-3 uppercase text-xs tracking-wide">
                  Macchina
                </dt>
                <dd className="text-ink font-medium">{step.deviceCode}</dd>
              </div>
            )}
          </dl>

          <div className="grid grid-cols-3 gap-3 mt-2">
            <Button
              size="hmi"
              variant="danger"
              onClick={onMarkBlocked}
              className="col-span-1"
            >
              NOK
            </Button>
            <Button
              size="hmi"
              variant="primary"
              onClick={onComplete}
              className="col-span-2 text-2xl"
            >
              OK
            </Button>
          </div>
        </div>
      )}

      {step.status === 'blocked' && blockedNote && (
        <div className="mt-3 rounded-2 bg-bad-soft px-3 py-2 text-sm text-bad-ink">
          <span className="font-semibold">Note: </span>
          {blockedNote}
        </div>
      )}
    </div>
  )
}

'use client'
import * as React from 'react'
import { Badge, Button } from '@mes/ui'
import type { WorkOrderStep } from '../../../lib/queries'
import { DeviceCycleView } from './components/DeviceCycleView'
import { DeviceCycleWithParallels } from './components/DeviceCycleWithParallels'

const CATEGORY_LABEL_IT: Record<string, string> = {
  production: 'Produzione',
  identification: 'Identificazione',
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
  decision: 'info',
  information: 'neutral',
  setup: 'neutral',
  teardown: 'neutral',
  recovery: 'warn',
}

export interface StepGenericProps {
  step: WorkOrderStep
  /**
   * Full WO step list — used by DeviceCycleWithParallels to resolve the
   * `parallel` siblings of a `device_main` step. When omitted, parallel
   * detection is skipped and the device cycle renders alone.
   */
  allSteps?: WorkOrderStep[]
  /**
   * Photo (base64 data URL) attached to the step config from D1's
   * PhotoUploadField. Read-only display in the HMI. Resolved by the parent
   * page from the workflow snapshot's node.data.photoBase64.
   */
  photoBase64?: string | null
  /** Description (autofilled in D1) — falls back to step.instructions when missing. */
  description?: string | null
  /** Resource chips to render under the description (code + label). */
  resources?: ReadonlyArray<{ kind: string; code: string; label: string }>
  /** Action: start the step (operator pre-condition). */
  onStart?: () => void
  /** Action: complete with OK (manual completion / device cycle override). */
  onComplete?: () => void
  /** Action: mark NOK / open recovery. */
  onFail?: () => void
  /** PNE_4_FOCUSED D3 — parallel slot handlers (forwarded to ParallelSlotsContainer). */
  onStartParallelSlot?: (slot: WorkOrderStep) => void
  onCompleteParallelSlot?: (slot: WorkOrderStep) => void
  onSkipParallelSlot?: (slot: WorkOrderStep) => void
  isPending?: boolean
}

/**
 * PNE_4_FOCUSED D2 — Universal step view for the HMI WO execution screen.
 *
 * Renders title, description, resources, attached photo (if any), and an
 * action button. When the step is a `device_run` against one of the 3 mock
 * devices (DEV-LEAK-001 / DEV-CAMERA-001 / DEV-CRIMP-001) AND status is
 * `running`/`done`, delegates to <DeviceCycleView /> for live telemetry.
 */
export function StepGeneric({
  step,
  allSteps,
  photoBase64,
  description,
  resources,
  onStart,
  onComplete,
  onFail,
  onStartParallelSlot,
  onCompleteParallelSlot,
  onSkipParallelSlot,
  isPending,
}: StepGenericProps) {
  const isDeviceMain =
    step.actionType === 'device_run' && !!step.deviceSerialNumber
  const showCycle =
    isDeviceMain && (step.status === 'running' || step.status === 'done')
  const body = description?.trim() || step.instructions || null

  return (
    <article
      className="flex flex-col gap-5"
      data-testid="step-generic"
      data-step-category={step.stepCategory}
      data-action-type={step.actionType}
    >
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={CATEGORY_TONE[step.stepCategory] ?? 'neutral'}>
            {CATEGORY_LABEL_IT[step.stepCategory] ?? step.stepCategory}
          </Badge>
          <Badge tone="neutral">{step.actionType}</Badge>
        </div>
        <h2
          className="text-2xl font-semibold text-ink leading-tight"
          data-testid="step-generic-title"
        >
          {step.stepName}
        </h2>
      </header>

      {body && (
        <p
          className="text-base text-ink-2 leading-relaxed whitespace-pre-line"
          data-testid="step-generic-description"
        >
          {body}
        </p>
      )}

      {resources && resources.length > 0 && (
        <div
          className="flex flex-wrap gap-2"
          data-testid="step-generic-resources"
        >
          {resources.map((r) => (
            <span
              key={`${r.kind}:${r.code}`}
              className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-paper-2 px-2 py-1 text-xs text-ink-2"
            >
              <span className="font-mono">{r.code}</span>
              <span className="text-ink-3">·</span>
              <span>{r.label}</span>
            </span>
          ))}
        </div>
      )}

      {photoBase64 && (
        <figure
          className="flex flex-col gap-1"
          data-testid="step-generic-photo"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoBase64}
            alt="Foto allegata"
            className="rounded-2 border border-line max-w-xs object-cover"
            style={{ maxHeight: 240 }}
          />
          <figcaption className="text-[10px] text-ink-3">
            Allegato di configurazione
          </figcaption>
        </figure>
      )}

      {showCycle &&
        (allSteps && allSteps.length > 0 ? (
          <DeviceCycleWithParallels
            step={step}
            allSteps={allSteps}
            onContinue={onComplete}
            onFail={onFail}
            onStartSlot={onStartParallelSlot}
            onCompleteSlot={onCompleteParallelSlot}
            onSkipSlot={onSkipParallelSlot}
            isPending={isPending}
          />
        ) : (
          <DeviceCycleView
            step={step}
            onContinue={onComplete}
            onFail={onFail}
            isPending={isPending}
          />
        ))}

      {!isDeviceMain && step.status === 'pending' && onStart && (
        <Button
          size="hmi"
          variant="primary"
          onClick={onStart}
          disabled={isPending}
          className="w-full text-2xl"
        >
          Avvia
        </Button>
      )}

      {!isDeviceMain && step.status === 'running' && (
        <div className="grid grid-cols-3 gap-3">
          {onFail && (
            <Button
              size="hmi"
              variant="danger"
              onClick={onFail}
              disabled={isPending}
              className="col-span-1"
            >
              NOK
            </Button>
          )}
          {onComplete && (
            <Button
              size="hmi"
              variant="primary"
              onClick={onComplete}
              disabled={isPending}
              className="col-span-2 text-2xl"
            >
              Completa
            </Button>
          )}
        </div>
      )}
    </article>
  )
}

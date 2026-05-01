'use client'
import * as React from 'react'
import { Badge, Button } from '@mes/ui'
import {
  isMaxAttemptsReached,
  MAX_RECOVERY_ATTEMPTS,
  type RecoveryStage,
} from '@mes/domain'
import type { WorkOrderStep } from '../lib/queries'

const STAGE_LABEL: Record<RecoveryStage, string> = {
  diagnosis: 'Diagnosi iniziale',
  attempt_1: 'Tentativo 1 di 2',
  attempt_2: 'Tentativo 2 di 2',
  scrap: 'Scartato',
  recovered: 'Recuperato',
}

const STAGE_INSTRUCTIONS: Record<RecoveryStage, string> = {
  diagnosis:
    'Identifica la causa del problema. Poi avvia il primo tentativo di recupero o scarta direttamente se il pezzo non è recuperabile.',
  attempt_1:
    'Esegui un secondo passaggio dopo aver corretto la causa. Se non riesce, sarà disponibile un ultimo tentativo.',
  attempt_2:
    'Ultimo tentativo disponibile. Se anche questo fallisce, il pezzo verrà scartato automaticamente.',
  scrap: 'Lo step è stato scartato e non può più essere recuperato.',
  recovered: 'Lo step è stato recuperato. Riprendi il pezzo o conferma la chiusura.',
}

export interface RecoveryFlowProps {
  step: WorkOrderStep
  isPending?: boolean
  onRecover: () => void
  onScrap: () => void
  onResumeAfterRecovery?: () => void
  onCompleteAfterRecovery?: () => void
}

export function RecoveryFlow({
  step,
  isPending,
  onRecover,
  onScrap,
  onResumeAfterRecovery,
  onCompleteAfterRecovery,
}: RecoveryFlowProps) {
  const stage: RecoveryStage =
    step.recoveryStage ??
    (step.status === 'recovered' ? 'recovered' : 'diagnosis')
  const isRecovered = step.status === 'recovered'
  const maxReached = isMaxAttemptsReached(step.attemptCount)
  const showRecoverButton =
    step.status === 'blocked' && !maxReached
  const recoverLabel =
    stage === 'diagnosis'
      ? 'Avvia tentativo di recupero'
      : `Tentativo ${step.attemptCount + 1} di ${MAX_RECOVERY_ATTEMPTS}`

  return (
    <section
      className="mt-3 rounded-3 border border-bad/30 bg-bad-soft/40 p-4 flex flex-col gap-3"
      data-testid="recovery-flow"
      data-stage={stage}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge tone={isRecovered ? 'ok' : 'bad'}>
            Recupero · {STAGE_LABEL[stage]}
          </Badge>
          <span className="text-xs text-ink-3 tabular-nums">
            Tentativi: {step.attemptCount} / {MAX_RECOVERY_ATTEMPTS}
          </span>
        </div>
      </div>
      <p className="text-sm text-ink-2 leading-relaxed">
        {STAGE_INSTRUCTIONS[stage]}
      </p>

      <RecoveryStepper currentStage={stage} attemptCount={step.attemptCount} />

      {step.status === 'blocked' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {showRecoverButton ? (
            <Button
              size="hmi"
              variant="primary"
              onClick={onRecover}
              disabled={isPending}
              className="text-lg"
            >
              {recoverLabel}
            </Button>
          ) : (
            <div className="text-sm text-bad-ink p-3 rounded-2 bg-bad-soft border border-bad/30">
              Tentativi esauriti. Lo step verrà scartato automaticamente al
              prossimo NOK.
            </div>
          )}
          <Button
            size="hmi"
            variant="danger"
            onClick={onScrap}
            disabled={isPending}
          >
            Scarta pezzo
          </Button>
        </div>
      )}

      {isRecovered && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {onResumeAfterRecovery && (
            <Button
              size="hmi"
              variant="primary"
              onClick={onResumeAfterRecovery}
              disabled={isPending}
            >
              Riprendi step
            </Button>
          )}
          {onCompleteAfterRecovery && (
            <Button
              size="hmi"
              variant="secondary"
              onClick={onCompleteAfterRecovery}
              disabled={isPending}
            >
              Conferma chiusura
            </Button>
          )}
        </div>
      )}
    </section>
  )
}

interface StepperProps {
  currentStage: RecoveryStage
  attemptCount: number
}

const STEPPER_STAGES: RecoveryStage[] = [
  'diagnosis',
  'attempt_1',
  'attempt_2',
  'scrap',
]

function RecoveryStepper({ currentStage, attemptCount }: StepperProps) {
  const currentIndex = STEPPER_STAGES.indexOf(currentStage)
  return (
    <ol className="flex items-center gap-2 overflow-x-auto" aria-label="Recovery steps">
      {STEPPER_STAGES.map((s, i) => {
        const isActive = s === currentStage
        const isPast = currentIndex >= 0 && i < currentIndex
        const tone = isActive ? 'bg-bad text-white' : isPast ? 'bg-ink-2 text-white' : 'bg-paper-3 text-ink-3'
        const isScrapped = currentStage === 'scrap'
        const dimScrap = s === 'scrap' && !isScrapped
        return (
          <li
            key={s}
            className={[
              'flex-1 min-w-[120px] text-center px-2 py-1 rounded-2 text-xs font-medium tabular-nums',
              tone,
              dimScrap ? 'opacity-50' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-current={isActive ? 'step' : undefined}
          >
            {s === 'diagnosis' && 'Diagnosi'}
            {s === 'attempt_1' && `Tentativo 1${attemptCount >= 1 ? ' ✓' : ''}`}
            {s === 'attempt_2' && `Tentativo 2${attemptCount >= 2 ? ' ✓' : ''}`}
            {s === 'scrap' && 'Scarto'}
          </li>
        )
      })}
    </ol>
  )
}

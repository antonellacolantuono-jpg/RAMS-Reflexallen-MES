'use client'
import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useMachine } from '@xstate/react'
import {
  stepExecutionMachine,
  type StepExecutionEvent,
} from '@mes/domain'
import { Button, Modal, Progress } from '@mes/ui'
import { useOperatorStore } from '../../../lib/operator-store'
import {
  useMyWorkOrders,
  useTransitionStep,
  useWorkOrderSteps,
  type StepExecutionStatus,
  type WorkOrderStep,
} from '../../../lib/queries'
import { StepCard } from '../../../components/StepCard'
import { ParallelStepLane } from '../../../components/ParallelStepLane'

interface StepGroup {
  groupId: string
  groupName: string
  groupSupportsParallel: boolean
  steps: WorkOrderStep[]
}

function groupSteps(steps: WorkOrderStep[]): StepGroup[] {
  const groups: StepGroup[] = []
  for (const step of steps) {
    const last = groups[groups.length - 1]
    if (last && last.groupId === step.groupId) {
      last.steps.push(step)
    } else {
      groups.push({
        groupId: step.groupId,
        groupName: step.groupName,
        groupSupportsParallel: step.groupSupportsParallel,
        steps: [step],
      })
    }
  }
  return groups
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

function pickActiveStep(
  steps: WorkOrderStep[] | undefined,
): WorkOrderStep | undefined {
  if (!steps || steps.length === 0) return undefined
  return (
    steps.find(
      (s) => s.status === 'running' || s.status === 'paused' || s.status === 'qc_hold' || s.status === 'recovered',
    ) ?? steps.find((s) => s.status === 'pending')
  )
}

export default function WorkOrderExecutionPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const woId = params.id
  const operator = useOperatorStore((s) => s.operator)
  const [hydrated, setHydrated] = React.useState(false)
  const startedAtRef = React.useRef<number>(Date.now())
  const [nokOpen, setNokOpen] = React.useState(false)
  const [nokTargetId, setNokTargetId] = React.useState<string | null>(null)
  const [nokDraft, setNokDraft] = React.useState('')

  React.useEffect(() => {
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (hydrated && !operator) {
      router.replace('/')
    }
  }, [hydrated, operator, router])

  const stepsQuery = useWorkOrderSteps(woId, {
    enabled: !!operator,
  })
  const myWorkOrdersQuery = useMyWorkOrders({ enabled: !!operator })
  const transition = useTransitionStep(woId)

  const wo = React.useMemo(
    () => myWorkOrdersQuery.data?.find((w) => w.id === woId),
    [myWorkOrdersQuery.data, woId],
  )

  const steps = React.useMemo(
    () => stepsQuery.data ?? [],
    [stepsQuery.data],
  )
  const activeStep = pickActiveStep(steps)

  const allTerminal = React.useMemo(
    () =>
      steps.length > 0 && steps.every((s) => PAST_STATUSES.includes(s.status)),
    [steps],
  )

  React.useEffect(() => {
    if (allTerminal && hydrated) {
      const okCount = steps.filter((s) => s.status === 'done').length
      const nokCount = steps.filter(
        (s) => s.status === 'blocked' || s.status === 'scrapped',
      ).length
      const elapsedSec = Math.max(
        1,
        Math.floor((Date.now() - startedAtRef.current) / 1000),
      )
      router.replace(
        `/wo/${woId}/done?ok=${okCount}&nok=${nokCount}&time=${elapsedSec}`,
      )
    }
  }, [allTerminal, steps, router, woId, hydrated])

  const machineInput = React.useMemo(
    () => ({
      stepExecutionId: activeStep?.stepExecutionId ?? 'pending',
      workOrderId: woId,
      stepId: activeStep?.stepId ?? 'pending',
      stepCategory: activeStep?.stepCategory ?? 'production',
      operatorId: operator?.id ?? null,
      by: operator?.id ?? 'anonymous',
    }),
    [activeStep, operator?.id, woId],
  )

  const [, sendMachine] = useMachine(stepExecutionMachine, {
    input: machineInput,
  })

  const sendEvent = React.useCallback(
    (stepExecutionId: string, event: StepExecutionEvent) => {
      sendMachine(event)
      transition.mutate({
        stepExecutionId,
        event: event as unknown as { type: string; [k: string]: unknown },
      })
    },
    [transition, sendMachine],
  )

  const handleStart = React.useCallback(
    (step: WorkOrderStep) => {
      sendEvent(step.stepExecutionId, {
        type: 'START',
        by: operator?.id ?? 'anonymous',
      })
    },
    [sendEvent, operator?.id],
  )

  const handleComplete = React.useCallback(
    (step: WorkOrderStep) => {
      sendEvent(step.stepExecutionId, {
        type: 'COMPLETE_OK',
        by: operator?.id ?? 'anonymous',
      })
    },
    [sendEvent, operator?.id],
  )

  const openNok = React.useCallback((stepExecutionId: string) => {
    setNokOpen(true)
    setNokTargetId(stepExecutionId)
    setNokDraft('')
  }, [])

  const closeNok = React.useCallback(() => {
    setNokOpen(false)
    setNokTargetId(null)
    setNokDraft('')
  }, [])

  const confirmNok = React.useCallback(() => {
    if (!nokTargetId) return
    const trimmed = nokDraft.trim()
    sendEvent(nokTargetId, {
      type: 'COMPLETE_NOK',
      by: operator?.id ?? 'anonymous',
      causeCode: 'manual_nok',
      ...(trimmed ? { notes: trimmed } : {}),
    })
    closeNok()
  }, [nokTargetId, nokDraft, sendEvent, closeNok, operator?.id])

  const handlePause = React.useCallback(
    (step: WorkOrderStep) =>
      sendEvent(step.stepExecutionId, {
        type: 'PAUSE',
        by: operator?.id ?? 'anonymous',
      }),
    [sendEvent, operator?.id],
  )
  const handleResume = React.useCallback(
    (step: WorkOrderStep) =>
      sendEvent(step.stepExecutionId, {
        type: 'RESUME',
        by: operator?.id ?? 'anonymous',
      }),
    [sendEvent, operator?.id],
  )

  React.useEffect(() => {
    if (!activeStep) return
    if (activeStep.status === 'pending' && !transition.isPending) {
      handleStart(activeStep)
    }
  }, [activeStep, handleStart, transition.isPending])

  const autoStartedRef = React.useRef<Set<string>>(new Set())

  React.useEffect(() => {
    if (!steps.length) return
    if (transition.isPending) return
    const groups = groupSteps(steps)
    for (const group of groups) {
      if (!group.groupSupportsParallel) continue
      const preDone = group.steps
        .filter((s) => s.deviceCategory === 'pre')
        .every((s) => PAST_STATUSES.includes(s.status))
      if (!preDone) continue
      const mainOrParallel = group.steps.filter(
        (s) =>
          s.deviceCategory === 'device_main' ||
          s.deviceCategory === 'parallel',
      )
      const anyActive = mainOrParallel.some(
        (s) => s.status === 'running' || s.status === 'paused',
      )
      if (!anyActive) continue
      for (const s of mainOrParallel) {
        if (s.status !== 'pending') continue
        if (autoStartedRef.current.has(s.stepExecutionId)) continue
        autoStartedRef.current.add(s.stepExecutionId)
        handleStart(s)
      }
    }
  }, [steps, transition.isPending, handleStart])

  if (!hydrated || !operator) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p className="text-ink-3">Caricamento…</p>
      </div>
    )
  }

  if (stepsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p className="text-ink-3">Caricamento step…</p>
      </div>
    )
  }

  if (stepsQuery.error || !wo) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-lg text-ink">Ordine di lavoro non trovato</p>
        <Button size="hmi" onClick={() => router.replace('/dashboard')}>
          Torna al dashboard
        </Button>
      </div>
    )
  }

  const total = steps.length
  const doneCount = steps.filter((s) => s.status === 'done').length
  const blockedCount = steps.filter(
    (s) => s.status === 'blocked' || s.status === 'scrapped',
  ).length
  const completedSteps = doneCount + blockedCount

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-10 bg-paper/95 backdrop-blur border-b border-line">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col min-w-0">
              <span className="text-xs uppercase tracking-wide text-ink-3">
                {wo.code}
              </span>
              <h1 className="text-lg font-semibold text-ink truncate">
                {wo.itemName}
              </h1>
            </div>
            <Button
              size="hmi"
              variant="secondary"
              onClick={() => router.replace('/dashboard')}
            >
              Esci
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Progress
              value={completedSteps}
              max={Math.max(1, total)}
              tone="accent"
              className="flex-1"
            />
            <span className="text-sm tabular-nums text-ink font-medium shrink-0">
              {completedSteps} / {total} step
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-4">
        {groupSteps(steps).map((group) => {
          if (group.groupSupportsParallel) {
            return (
              <ParallelStepLane
                key={group.groupId}
                groupId={group.groupId}
                groupName={group.groupName}
                steps={group.steps}
                isPending={transition.isPending}
                onComplete={(step) => handleComplete(step)}
                onMarkBlocked={(step) => openNok(step.stepExecutionId)}
                onPause={(step) => handlePause(step)}
                onResume={(step) => handleResume(step)}
              />
            )
          }
          return (
            <div key={group.groupId} className="flex flex-col gap-3">
              {group.steps.map((step, i) => (
                <StepCard
                  key={step.stepExecutionId}
                  step={step}
                  index={i}
                  totalSteps={total}
                  isPending={transition.isPending}
                  onComplete={() => handleComplete(step)}
                  onMarkBlocked={() => openNok(step.stepExecutionId)}
                  onPause={() => handlePause(step)}
                  onResume={() => handleResume(step)}
                />
              ))}
            </div>
          )
        })}
        {steps.length === 0 && (
          <p className="text-ink-3 text-center py-8">
            Nessuno step disponibile per questo ordine.
          </p>
        )}
      </main>

      <Modal
        open={nokOpen}
        onClose={closeNok}
        title="Cosa è andato storto?"
        description={activeStep ? `Step: ${activeStep.stepName}` : undefined}
        width={520}
        footer={
          <>
            <Button size="md" variant="ghost" onClick={closeNok}>
              Annulla
            </Button>
            <Button
              size="md"
              variant="danger"
              onClick={confirmNok}
              disabled={transition.isPending}
            >
              Conferma NOK
            </Button>
          </>
        }
      >
        <textarea
          autoFocus
          value={nokDraft}
          onChange={(e) => setNokDraft(e.target.value)}
          placeholder="Descrivi brevemente il problema riscontrato…"
          className="w-full min-h-[140px] rounded-2 border border-line px-3 py-2 text-base text-ink focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </Modal>
    </div>
  )
}

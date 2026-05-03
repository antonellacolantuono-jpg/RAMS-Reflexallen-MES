'use client'
import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useMachine } from '@xstate/react'
import {
  pickNokEvent,
  stepExecutionMachine,
  type StepExecutionEvent,
} from '@mes/domain'
import { Button, Modal, Progress } from '@mes/ui'
import { useOperatorStore } from '../../../lib/operator-store'
import {
  useMyWorkOrders,
  useStepTransitionSubscription,
  useTransitionStep,
  useWorkOrderSteps,
  type StepExecutionStatus,
  type WorkOrderStep,
} from '../../../lib/queries'
import { StepCard } from '../../../components/StepCard'
import { ParallelStepLane } from '../../../components/ParallelStepLane'
import { RecoveryFlow } from '../../../components/RecoveryFlow'
import {
  HMIScrapForm,
  derivePhaseFromStep,
} from '../../../components/HMIScrapForm'
import { DeviceCycleWithParallels } from './components/DeviceCycleWithParallels'

// PNE_4_FOCUSED D4.0 hotfix — known mock device serials. When the active step
// is a `device_run` step against one of these, the rendering switches from
// the generic StepCard list to <DeviceCycleWithParallels /> so the operator
// sees the timer + telemetry + parallel slots split layout.
const DEVICE_CYCLE_SERIALS = new Set([
  'DEV-LEAK-001',
  'DEV-CAMERA-001',
  'DEV-CRIMP-001',
])

function isDeviceCycleStep(step: WorkOrderStep | undefined): boolean {
  if (!step) return false
  if (step.actionType !== 'device_run') return false
  if (step.deviceCategory !== 'device_main') return false
  return !!step.deviceSerialNumber && DEVICE_CYCLE_SERIALS.has(step.deviceSerialNumber)
}

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
// `blocked` is intentionally NOT terminal in D5: recovery can move it back
// to `running` via blocked → recovered → resume_after_recovery.
const PAST_STATUSES: StepExecutionStatus[] = [
  ...TERMINAL_STATUSES,
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
  // PNE_4_FOCUSED D4.2 — scrap modal state (cause code + photo + notes)
  const [scrapOpen, setScrapOpen] = React.useState(false)
  const [scrapTargetId, setScrapTargetId] = React.useState<string | null>(null)

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

  // D6: subscribe to live step:transition events for this WO. Mounts only
  // when an operator is logged in; the hook short-circuits on undefined id.
  useStepTransitionSubscription(operator ? woId : undefined)

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
    const target = steps.find((s) => s.stepExecutionId === nokTargetId)
    const trimmed = nokDraft.trim()
    const eventType = target ? pickNokEvent(target.stepCategory) : 'COMPLETE_NOK'
    if (eventType === 'REQUEST_QC') {
      sendEvent(nokTargetId, {
        type: 'REQUEST_QC',
        by: operator?.id ?? 'anonymous',
      })
    } else {
      sendEvent(nokTargetId, {
        type: 'COMPLETE_NOK',
        by: operator?.id ?? 'anonymous',
        causeCode: 'manual_nok',
        ...(trimmed ? { notes: trimmed } : {}),
      })
    }
    closeNok()
  }, [nokTargetId, nokDraft, sendEvent, closeNok, operator?.id, steps])

  const handleRecover = React.useCallback(
    (step: WorkOrderStep) =>
      sendEvent(step.stepExecutionId, {
        type: 'RECOVER',
        by: operator?.id ?? 'anonymous',
      }),
    [sendEvent, operator?.id],
  )

  // PNE_4_FOCUSED D4.2 — Scarta now opens HMIScrapForm modal (cause code +
  // photo + notes) instead of firing MARK_SCRAPPED directly. Confirmation
  // happens via confirmScrap below.
  const handleScrap = React.useCallback((step: WorkOrderStep) => {
    setScrapTargetId(step.stepExecutionId)
    setScrapOpen(true)
  }, [])

  const closeScrap = React.useCallback(() => {
    setScrapOpen(false)
    setScrapTargetId(null)
  }, [])

  const confirmScrap = React.useCallback(
    (payload: {
      causeCodeId: string
      causeCode: string
      photoBase64: string | null
      notes: string | null
    }) => {
      if (!scrapTargetId) return
      sendEvent(scrapTargetId, {
        type: 'MARK_SCRAPPED',
        by: operator?.id ?? 'anonymous',
        // The state machine accepts a free-form `reason`; we pack the cause
        // code there. Photo + notes ride in additional fields the audit log
        // captures as `payload`. Schema migration in F2 will introduce
        // first-class causeCodeId / photoUrl / notes columns.
        reason: payload.causeCode,
      })
      closeScrap()
    },
    [scrapTargetId, sendEvent, operator?.id, closeScrap],
  )

  const scrapTargetStep = React.useMemo(
    () => steps.find((s) => s.stepExecutionId === scrapTargetId) ?? null,
    [steps, scrapTargetId],
  )

  const handleResumeAfterRecovery = React.useCallback(
    (step: WorkOrderStep) =>
      sendEvent(step.stepExecutionId, {
        type: 'RESUME_AFTER_RECOVERY',
        by: operator?.id ?? 'anonymous',
      }),
    [sendEvent, operator?.id],
  )

  const handleCompleteAfterRecovery = React.useCallback(
    (step: WorkOrderStep) =>
      sendEvent(step.stepExecutionId, {
        type: 'COMPLETE_AFTER_RECOVERY',
        by: operator?.id ?? 'anonymous',
      }),
    [sendEvent, operator?.id],
  )

  // PNE_4_FOCUSED D4 — operator skips a parallel slot. Logged with
  // causeCode='operator_choice' so the audit trail distinguishes it from a
  // failure-driven NOK.
  const handleSkipParallel = React.useCallback(
    (step: WorkOrderStep) =>
      sendEvent(step.stepExecutionId, {
        type: 'COMPLETE_NOK',
        by: operator?.id ?? 'anonymous',
        causeCode: 'operator_choice',
      }),
    [sendEvent, operator?.id],
  )

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
          // PNE_4_FOCUSED D4.0 — when this group contains the active
          // device_run device_main step against a known mock simulator,
          // render the immersive DeviceCycleWithParallels view (timer +
          // telemetry + parallel slots split layout). Falls back to the
          // legacy ParallelStepLane/StepCard rendering for non-device groups
          // and for non-active phases (pre/post operator work).
          const activeDeviceStep = group.steps.find(
            (s) =>
              isDeviceCycleStep(s) &&
              (s.status === 'running' || s.status === 'pending'),
          )
          if (activeDeviceStep) {
            return (
              <DeviceCycleWithParallels
                key={group.groupId}
                step={activeDeviceStep}
                allSteps={steps}
                onContinue={() => handleComplete(activeDeviceStep)}
                onFail={() => openNok(activeDeviceStep.stepExecutionId)}
                onStartSlot={(slot) => handleStart(slot)}
                onCompleteSlot={(slot) => handleComplete(slot)}
                onSkipSlot={(slot) => handleSkipParallel(slot)}
                isPending={transition.isPending}
              />
            )
          }
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
                <div key={step.stepExecutionId} className="flex flex-col gap-2">
                  <StepCard
                    step={step}
                    index={i}
                    totalSteps={total}
                    isPending={transition.isPending}
                    onComplete={() => handleComplete(step)}
                    onMarkBlocked={() => openNok(step.stepExecutionId)}
                    onPause={() => handlePause(step)}
                    onResume={() => handleResume(step)}
                  />
                  {(step.status === 'blocked' || step.status === 'recovered') && (
                    <RecoveryFlow
                      step={step}
                      isPending={transition.isPending}
                      onRecover={() => handleRecover(step)}
                      onScrap={() => handleScrap(step)}
                      onResumeAfterRecovery={() => handleResumeAfterRecovery(step)}
                      onCompleteAfterRecovery={() => handleCompleteAfterRecovery(step)}
                    />
                  )}
                </div>
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

      <HMIScrapForm
        open={scrapOpen}
        step={scrapTargetStep}
        phase={derivePhaseFromStep(scrapTargetStep)}
        onClose={closeScrap}
        onConfirm={confirmScrap}
        isPending={transition.isPending}
      />
    </div>
  )
}

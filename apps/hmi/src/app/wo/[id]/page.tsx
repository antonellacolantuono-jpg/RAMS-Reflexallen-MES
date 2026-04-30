'use client'
import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button, Modal, Progress } from '@mes/ui'
import { useOperatorStore } from '../../../lib/operator-store'
import {
  getMockSteps,
  getWorkOrder,
  type MockStep,
} from '../../../lib/mock-data'
import { StepCard } from '../../../components/StepCard'

interface ExecState {
  steps: MockStep[]
  notes: Record<string, string>
  nokOpen: boolean
  nokTargetId: string | null
  nokDraft: string
}

type ExecAction =
  | { type: 'COMPLETE_OK' }
  | { type: 'OPEN_NOK'; stepId: string }
  | { type: 'CANCEL_NOK' }
  | { type: 'UPDATE_NOK_DRAFT'; draft: string }
  | { type: 'CONFIRM_NOK' }

function advanceAfter(steps: MockStep[]): MockStep[] {
  // After completing/blocking the running step, promote the next pending one.
  const nextPendingIdx = steps.findIndex((s) => s.status === 'pending')
  if (nextPendingIdx === -1) return steps
  const next = [...steps]
  const target = next[nextPendingIdx]
  if (!target) return next
  next[nextPendingIdx] = { ...target, status: 'running' }
  return next
}

function execReducer(state: ExecState, action: ExecAction): ExecState {
  switch (action.type) {
    case 'COMPLETE_OK': {
      const runningIdx = state.steps.findIndex((s) => s.status === 'running')
      if (runningIdx === -1) return state
      const running = state.steps[runningIdx]
      if (!running) return state
      const updated = [...state.steps]
      updated[runningIdx] = { ...running, status: 'done' }
      return { ...state, steps: advanceAfter(updated) }
    }
    case 'OPEN_NOK':
      return { ...state, nokOpen: true, nokTargetId: action.stepId, nokDraft: '' }
    case 'CANCEL_NOK':
      return { ...state, nokOpen: false, nokTargetId: null, nokDraft: '' }
    case 'UPDATE_NOK_DRAFT':
      return { ...state, nokDraft: action.draft }
    case 'CONFIRM_NOK': {
      if (!state.nokTargetId) return state
      const targetIdx = state.steps.findIndex(
        (s) => s.id === state.nokTargetId,
      )
      if (targetIdx === -1) return state
      const target = state.steps[targetIdx]
      if (!target) return state
      const updated = [...state.steps]
      updated[targetIdx] = { ...target, status: 'blocked' }
      return {
        ...state,
        steps: advanceAfter(updated),
        notes: { ...state.notes, [state.nokTargetId]: state.nokDraft.trim() },
        nokOpen: false,
        nokTargetId: null,
        nokDraft: '',
      }
    }
    default:
      return state
  }
}

function initState(woId: string): ExecState {
  return {
    steps: getMockSteps(woId),
    notes: {},
    nokOpen: false,
    nokTargetId: null,
    nokDraft: '',
  }
}

export default function WorkOrderExecutionPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const woId = params.id
  const operator = useOperatorStore((s) => s.operator)
  const [hydrated, setHydrated] = React.useState(false)
  const startedAtRef = React.useRef<number>(Date.now())
  const [state, dispatch] = React.useReducer(
    execReducer,
    woId,
    initState,
  )

  React.useEffect(() => {
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (hydrated && !operator) {
      router.replace('/')
    }
  }, [hydrated, operator, router])

  const wo = getWorkOrder(woId)

  // Auto-redirect to done screen when no steps remain pending or running.
  const allTerminal = React.useMemo(
    () =>
      state.steps.length > 0 &&
      state.steps.every((s) => s.status === 'done' || s.status === 'blocked'),
    [state.steps],
  )

  React.useEffect(() => {
    if (allTerminal) {
      const okCount = state.steps.filter((s) => s.status === 'done').length
      const nokCount = state.steps.filter((s) => s.status === 'blocked').length
      const elapsedSec = Math.max(
        1,
        Math.floor((Date.now() - startedAtRef.current) / 1000),
      )
      router.replace(
        `/wo/${woId}/done?ok=${okCount}&nok=${nokCount}&time=${elapsedSec}`,
      )
    }
  }, [allTerminal, state.steps, router, woId])

  if (!hydrated || !operator) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p className="text-ink-3">Caricamento…</p>
      </div>
    )
  }

  if (!wo) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-lg text-ink">Ordine di lavoro non trovato</p>
        <Button size="hmi" onClick={() => router.replace('/dashboard')}>
          Torna al dashboard
        </Button>
      </div>
    )
  }

  const doneCount = state.steps.filter((s) => s.status === 'done').length
  const blockedCount = state.steps.filter((s) => s.status === 'blocked').length
  const total = state.steps.length
  const completedSteps = doneCount + blockedCount

  const runningStep = state.steps.find((s) => s.status === 'running')

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
              max={total}
              tone="accent"
              className="flex-1"
            />
            <span className="text-sm tabular-nums text-ink font-medium shrink-0">
              {completedSteps} / {total} step
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-3">
        {state.steps.map((step, i) => (
          <StepCard
            key={step.id}
            step={step}
            index={i}
            totalSteps={total}
            blockedNote={state.notes[step.id]}
            onComplete={() => dispatch({ type: 'COMPLETE_OK' })}
            onMarkBlocked={() =>
              dispatch({ type: 'OPEN_NOK', stepId: step.id })
            }
          />
        ))}
      </main>

      <Modal
        open={state.nokOpen}
        onClose={() => dispatch({ type: 'CANCEL_NOK' })}
        title="Cosa è andato storto?"
        description={
          runningStep ? `Step: ${runningStep.name}` : undefined
        }
        width={520}
        footer={
          <>
            <Button
              size="md"
              variant="ghost"
              onClick={() => dispatch({ type: 'CANCEL_NOK' })}
            >
              Annulla
            </Button>
            <Button
              size="md"
              variant="danger"
              onClick={() => dispatch({ type: 'CONFIRM_NOK' })}
            >
              Conferma NOK
            </Button>
          </>
        }
      >
        <textarea
          autoFocus
          value={state.nokDraft}
          onChange={(e) =>
            dispatch({ type: 'UPDATE_NOK_DRAFT', draft: e.target.value })
          }
          placeholder="Descrivi brevemente il problema riscontrato…"
          className="w-full min-h-[140px] rounded-2 border border-line px-3 py-2 text-base text-ink focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </Modal>
    </div>
  )
}

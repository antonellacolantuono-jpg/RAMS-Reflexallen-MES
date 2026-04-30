'use client'
import * as React from 'react'
import { splitGroupIntoLanes, type Lane } from '@mes/domain'
import type { WorkOrderStep } from '../lib/queries'
import { StepCard } from './StepCard'

const LANE_LABEL: Record<string, string> = {
  pre: 'Preparazione',
  main: 'Step principale',
  parallel: 'Operazione parallela',
  post: 'Chiusura',
  sequential: 'Sequenza',
}

function laneTone(kind: Lane['kind']): string {
  switch (kind) {
    case 'main':
      return 'border-accent/40 bg-accent/5'
    case 'parallel':
      return 'border-info/40 bg-info/5'
    case 'pre':
      return 'border-line bg-paper-2'
    case 'post':
      return 'border-line bg-paper-2'
    default:
      return 'border-line bg-paper'
  }
}

function pickStartedAt(steps: WorkOrderStep[]): number | null {
  const started = steps
    .map((s) => (s.startedAt ? Date.parse(s.startedAt) : null))
    .filter((t): t is number => t !== null && !Number.isNaN(t))
  if (started.length === 0) return null
  return Math.min(...started)
}

function formatElapsed(seconds: number): string {
  if (seconds <= 0) return '0s'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`
}

function useSharedTimer(startedAtMs: number | null, isActive: boolean): number {
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    if (!isActive || startedAtMs === null) return
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [isActive, startedAtMs])
  if (startedAtMs === null) return 0
  return Math.max(0, Math.floor((now - startedAtMs) / 1000))
}

export interface ParallelStepLaneProps {
  groupId: string
  groupName: string
  steps: WorkOrderStep[]
  isPending: boolean
  onComplete: (step: WorkOrderStep) => void
  onMarkBlocked: (step: WorkOrderStep) => void
  onPause?: (step: WorkOrderStep) => void
  onResume?: (step: WorkOrderStep) => void
}

export function ParallelStepLane({
  groupId,
  groupName,
  steps,
  isPending,
  onComplete,
  onMarkBlocked,
  onPause,
  onResume,
}: ParallelStepLaneProps) {
  const layout = React.useMemo(
    () =>
      splitGroupIntoLanes({
        id: groupId,
        supportsParallel: true,
        steps: steps.map((s) => ({
          id: s.stepExecutionId,
          order: s.stepOrder,
          deviceCategory: (s.deviceCategory ?? null) as
            | 'pre'
            | 'device_main'
            | 'parallel'
            | 'post'
            | null,
        })),
      }),
    [groupId, steps],
  )

  const stepById = React.useMemo(() => {
    const map = new Map<string, WorkOrderStep>()
    for (const s of steps) map.set(s.stepExecutionId, s)
    return map
  }, [steps])

  const sharedStartedAt = pickStartedAt(steps)
  const isAnyRunning = steps.some(
    (s) => s.status === 'running' || s.status === 'paused',
  )
  const elapsed = useSharedTimer(sharedStartedAt, isAnyRunning)

  const preLanes = layout.lanes.filter((l) => l.kind === 'pre')
  const mainLane = layout.lanes.find((l) => l.kind === 'main')
  const parallelLanes = layout.lanes.filter((l) => l.kind === 'parallel')
  const postLanes = layout.lanes.filter((l) => l.kind === 'post')

  return (
    <section
      className="glass rounded-3 p-5 flex flex-col gap-4"
      data-testid={`parallel-group-${groupId}`}
      data-group-id={groupId}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wide text-ink-3">
            Esecuzione parallela
          </span>
          <h2 className="text-lg font-semibold text-ink">{groupName}</h2>
        </div>
        <div
          className="flex flex-col items-end"
          aria-live="polite"
          data-testid="parallel-shared-timer"
        >
          <span className="text-xs uppercase tracking-wide text-ink-3">
            Timer condiviso
          </span>
          <span className="text-2xl font-semibold tabular-nums text-ink">
            {formatElapsed(elapsed)}
          </span>
        </div>
      </header>

      {preLanes.length > 0 && (
        <LaneBlock
          label="Pre — preparazione"
          lanes={preLanes}
          stepById={stepById}
          isPending={isPending}
          onComplete={onComplete}
          onMarkBlocked={onMarkBlocked}
          {...(onPause ? { onPause } : {})}
          {...(onResume ? { onResume } : {})}
        />
      )}

      {(mainLane || parallelLanes.length > 0) && (
        <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
          {mainLane && (
            <div
              className={`rounded-3 border ${laneTone('main')} p-3`}
              data-testid="parallel-lane-main"
            >
              <p className="text-xs uppercase tracking-wide text-ink-3 mb-2">
                {LANE_LABEL.main}
              </p>
              <div className="flex flex-col gap-2">
                {mainLane.steps.map((laneStep) => {
                  const step = stepById.get(laneStep.id)
                  if (!step) return null
                  return (
                    <StepCard
                      key={step.stepExecutionId}
                      step={step}
                      index={step.stepOrder}
                      totalSteps={steps.length}
                      isPending={isPending}
                      onComplete={() => onComplete(step)}
                      onMarkBlocked={() => onMarkBlocked(step)}
                      {...(onPause ? { onPause: () => onPause(step) } : {})}
                      {...(onResume ? { onResume: () => onResume(step) } : {})}
                    />
                  )
                })}
              </div>
            </div>
          )}
          {parallelLanes.length > 0 && (
            <div className="flex flex-col gap-2" data-testid="parallel-lanes-side">
              {parallelLanes.map((lane) => (
                <div
                  key={`p-${lane.index}`}
                  className={`rounded-3 border ${laneTone('parallel')} p-3`}
                  data-testid={`parallel-lane-${lane.index}`}
                >
                  <p className="text-xs uppercase tracking-wide text-ink-3 mb-2">
                    {LANE_LABEL.parallel} {parallelLanes.length > 1 ? `#${lane.index + 1}` : ''}
                  </p>
                  {lane.steps.map((laneStep) => {
                    const step = stepById.get(laneStep.id)
                    if (!step) return null
                    return (
                      <StepCard
                        key={step.stepExecutionId}
                        step={step}
                        index={step.stepOrder}
                        totalSteps={steps.length}
                        isPending={isPending}
                        onComplete={() => onComplete(step)}
                        onMarkBlocked={() => onMarkBlocked(step)}
                        {...(onPause ? { onPause: () => onPause(step) } : {})}
                        {...(onResume ? { onResume: () => onResume(step) } : {})}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {postLanes.length > 0 && (
        <LaneBlock
          label="Post — chiusura"
          lanes={postLanes}
          stepById={stepById}
          isPending={isPending}
          onComplete={onComplete}
          onMarkBlocked={onMarkBlocked}
          {...(onPause ? { onPause } : {})}
          {...(onResume ? { onResume } : {})}
        />
      )}
    </section>
  )
}

interface LaneBlockProps {
  label: string
  lanes: Lane<{
    id: string
    order: number
    deviceCategory: 'pre' | 'device_main' | 'parallel' | 'post' | null
  }>[]
  stepById: Map<string, WorkOrderStep>
  isPending: boolean
  onComplete: (step: WorkOrderStep) => void
  onMarkBlocked: (step: WorkOrderStep) => void
  onPause?: ((step: WorkOrderStep) => void) | undefined
  onResume?: ((step: WorkOrderStep) => void) | undefined
}

function LaneBlock({
  label,
  lanes,
  stepById,
  isPending,
  onComplete,
  onMarkBlocked,
  onPause,
  onResume,
}: LaneBlockProps) {
  return (
    <div className="rounded-3 border border-line bg-paper-2 p-3">
      <p className="text-xs uppercase tracking-wide text-ink-3 mb-2">{label}</p>
      <div className="flex flex-col gap-2">
        {lanes.flatMap((lane) =>
          lane.steps.map((laneStep) => {
            const step = stepById.get(laneStep.id)
            if (!step) return null
            return (
              <StepCard
                key={step.stepExecutionId}
                step={step}
                index={step.stepOrder}
                totalSteps={lanes.length}
                isPending={isPending}
                onComplete={() => onComplete(step)}
                onMarkBlocked={() => onMarkBlocked(step)}
                {...(onPause ? { onPause: () => onPause(step) } : {})}
                {...(onResume ? { onResume: () => onResume(step) } : {})}
              />
            )
          }),
        )}
      </div>
    </div>
  )
}

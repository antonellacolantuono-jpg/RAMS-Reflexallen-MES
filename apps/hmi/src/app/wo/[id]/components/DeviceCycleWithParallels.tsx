'use client'
import * as React from 'react'
import type { WorkOrderStep } from '../../../../lib/queries'
import { DeviceCycleView } from './DeviceCycleView'
import { ParallelSlotsContainer } from './ParallelSlotsContainer'
import { resolveParallelSiblings } from './parallel-resolution'

export interface DeviceCycleWithParallelsProps {
  /** The active device_main step. */
  step: WorkOrderStep
  /** Full WO step list — used to resolve parallel siblings within the same group. */
  allSteps: WorkOrderStep[]
  onContinue?: (() => void) | undefined
  onFail?: (() => void) | undefined
  onStartSlot?: ((slot: WorkOrderStep) => void) | undefined
  onCompleteSlot?: ((slot: WorkOrderStep) => void) | undefined
  onSkipSlot?: ((slot: WorkOrderStep) => void) | undefined
  isPending?: boolean | undefined
}

/**
 * PNE_4_FOCUSED D3 — Split layout (TOP 50% device cycle / BOTTOM 50%
 * parallel slots) for `device_main` steps that have `parallel` siblings in
 * the same group. When no parallel siblings exist, falls back to plain
 * <DeviceCycleView />.
 *
 * Slots are interactive only while the device cycle is running (per spec —
 * parallel work only happens during the device's "wait window"). The counter
 * "X/Y completati" updates live as slots transition.
 */
export function DeviceCycleWithParallels({
  step,
  allSteps,
  onContinue,
  onFail,
  onStartSlot,
  onCompleteSlot,
  onSkipSlot,
  isPending,
}: DeviceCycleWithParallelsProps) {
  const slots = React.useMemo(
    () => resolveParallelSiblings(allSteps, step),
    [allSteps, step],
  )

  if (slots.length === 0) {
    return (
      <DeviceCycleView
        step={step}
        onContinue={onContinue}
        onFail={onFail}
        isPending={isPending}
      />
    )
  }

  // The device cycle's `running` status comes from StepExecution.status, not
  // the simulator state — when the operator hits START server-side, the step
  // is `running` and the simulator is dispatched. The slots open up as soon
  // as the parent step is `running`.
  const deviceRunning =
    step.status === 'running' || step.status === 'paused'

  return (
    <div
      className="flex flex-col gap-4"
      data-testid="device-cycle-with-parallels"
      data-parallel-count={slots.length}
    >
      <DeviceCycleView
        step={step}
        onContinue={onContinue}
        onFail={onFail}
        isPending={isPending}
      />
      <ParallelSlotsContainer
        slots={slots}
        deviceRunning={deviceRunning}
        onStartSlot={onStartSlot}
        onCompleteSlot={onCompleteSlot}
        onSkipSlot={onSkipSlot}
        isPending={isPending}
      />
    </div>
  )
}

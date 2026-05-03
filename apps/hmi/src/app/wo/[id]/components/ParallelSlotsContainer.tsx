'use client'
import * as React from 'react'
import type { WorkOrderStep } from '../../../../lib/queries'
import { ParallelSlot } from './ParallelSlot'
import { countCompletedParallels } from './parallel-resolution'

export interface ParallelSlotsContainerProps {
  slots: WorkOrderStep[]
  /** Whether the parent device cycle is currently running. */
  deviceRunning: boolean
  onStartSlot?: ((slot: WorkOrderStep) => void) | undefined
  onCompleteSlot?: ((slot: WorkOrderStep) => void) | undefined
  /** Called when the operator skips a slot — caller is responsible for
   * dispatching COMPLETE_NOK with causeCode='operator_choice'. */
  onSkipSlot?: ((slot: WorkOrderStep) => void) | undefined
  isPending?: boolean | undefined
}

export function ParallelSlotsContainer({
  slots,
  deviceRunning,
  onStartSlot,
  onCompleteSlot,
  onSkipSlot,
  isPending,
}: ParallelSlotsContainerProps) {
  const completed = countCompletedParallels(slots)
  const total = slots.length

  return (
    <section
      className="rounded-3 border border-line bg-paper p-6 flex flex-col gap-4"
      data-testid="parallel-slots-container"
      data-completed={completed}
      data-total={total}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-ink-3 font-semibold">
            Step paralleli
          </span>
          <p className="text-sm text-ink-2">
            Esegui durante il ciclo del dispositivo
          </p>
        </div>
        <span
          className={`rounded-pill px-3 py-1 text-sm font-semibold tabular-nums ${
            completed === total && total > 0
              ? 'bg-ok-soft text-ok-ink'
              : 'bg-accent-soft text-accent'
          }`}
          data-testid="parallel-slots-counter"
        >
          {completed}/{total} completati
        </span>
      </header>

      {slots.length === 0 ? (
        <p className="text-sm text-ink-3 italic">
          Nessuno step parallelo configurato.
        </p>
      ) : (
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${Math.min(slots.length, 3)}, minmax(0, 1fr))`,
          }}
        >
          {slots.map((slot) => (
            <ParallelSlot
              key={slot.stepExecutionId}
              step={slot}
              deviceRunning={deviceRunning}
              isPending={isPending}
              onStart={onStartSlot ? () => onStartSlot(slot) : undefined}
              onComplete={
                onCompleteSlot ? () => onCompleteSlot(slot) : undefined
              }
              onSkip={onSkipSlot ? () => onSkipSlot(slot) : undefined}
            />
          ))}
        </div>
      )}
    </section>
  )
}

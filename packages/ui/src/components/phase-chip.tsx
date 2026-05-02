'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '../utils/cn'

export type PhaseId = 'inbound' | 'setup' | 'production' | 'qc' | 'outbound' | 'teardown'

const PHASE_BG: Record<PhaseId, string> = {
  inbound: 'bg-c-inbound',
  setup: 'bg-c-setup',
  production: 'bg-c-production',
  qc: 'bg-c-qc',
  outbound: 'bg-c-outbound',
  teardown: 'bg-c-teardown',
}

const PHASE_TEXT: Record<PhaseId, string> = {
  inbound: 'text-c-inbound',
  setup: 'text-c-setup',
  production: 'text-c-production',
  qc: 'text-c-qc',
  outbound: 'text-c-outbound',
  teardown: 'text-c-teardown',
}

export interface PhaseChipProps {
  label: string
  phase: PhaseId
  active?: boolean
  done?: boolean
  className?: string
}

export function PhaseChip({ label, phase, active, done, className }: PhaseChipProps) {
  const state: 'pending' | 'active' | 'done' = done ? 'done' : active ? 'active' : 'pending'

  return (
    <span
      data-phase={phase}
      data-state={state}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-pill text-[11px] font-medium border',
        state === 'active' && [
          'border-current',
          PHASE_TEXT[phase],
          'bg-paper',
        ],
        state === 'done' && 'border-line bg-paper-2 text-ink-3 opacity-70',
        state === 'pending' && 'border-line bg-paper text-ink-2',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn('h-1.5 w-1.5 rounded-full', PHASE_BG[phase])}
      />
      {label}
      {done && <Check size={10} aria-hidden />}
    </span>
  )
}

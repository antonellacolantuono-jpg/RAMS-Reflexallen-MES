import * as React from 'react'
import { cn } from '../utils/cn'

export type PhaseCategory =
  | 'inbound'
  | 'setup'
  | 'production'
  | 'quality_control'
  | 'outbound'
  | 'teardown'

const PHASE_LABELS: Record<PhaseCategory, string> = {
  inbound: 'Inbound',
  setup: 'Setup',
  production: 'Production',
  quality_control: 'Quality Control',
  outbound: 'Outbound',
  teardown: 'Teardown',
}

const PHASE_CLASSES: Record<PhaseCategory, string> = {
  inbound: 'bg-c-inbound/20 text-c-inbound',
  setup: 'bg-c-setup/20 text-c-setup',
  production: 'bg-c-production/20 text-c-production',
  quality_control: 'bg-c-qc/20 text-c-qc',
  outbound: 'bg-c-outbound/20 text-c-outbound',
  teardown: 'bg-c-teardown/20 text-c-teardown',
}

export interface PhaseBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  phase: PhaseCategory
  label?: string
}

export function PhaseBadge({ phase, label, className, ...props }: PhaseBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill px-2 py-0.5 text-sm font-medium',
        PHASE_CLASSES[phase],
        className,
      )}
      {...props}
    >
      {label ?? PHASE_LABELS[phase]}
    </span>
  )
}

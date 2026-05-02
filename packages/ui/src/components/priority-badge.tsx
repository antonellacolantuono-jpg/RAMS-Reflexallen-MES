import * as React from 'react'
import { StatusBadge, type StatusTone } from './StatusBadge'

export type Priority = 'low' | 'normal' | 'high' | 'urgent'

const PRIORITY_TO_TONE: Record<Priority, StatusTone> = {
  low: 'neutral',
  normal: 'info',
  high: 'warn',
  urgent: 'bad',
}

const PRIORITY_LABEL_IT: Record<Priority, string> = {
  low: 'Bassa',
  normal: 'Normale',
  high: 'Alta',
  urgent: 'Urgente',
}

export interface PriorityBadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  priority: Priority
}

export function PriorityBadge({ priority, ...props }: PriorityBadgeProps) {
  return (
    <StatusBadge tone={PRIORITY_TO_TONE[priority]} {...props}>
      {PRIORITY_LABEL_IT[priority]}
    </StatusBadge>
  )
}

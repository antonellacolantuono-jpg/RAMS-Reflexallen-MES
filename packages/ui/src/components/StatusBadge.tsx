import * as React from 'react'
import { cn } from '../utils/cn'

export type StatusTone = 'ok' | 'warn' | 'bad' | 'info'

const STATUS_LABELS: Record<StatusTone, string> = {
  ok: 'OK',
  warn: 'Warn',
  bad: 'Error',
  info: 'Info',
}

const STATUS_CLASSES: Record<StatusTone, { bg: string; dot: string; text: string }> = {
  ok: { bg: 'bg-ok-soft', dot: 'bg-ok', text: 'text-ok-ink' },
  warn: { bg: 'bg-warn-soft', dot: 'bg-warn', text: 'text-warn-ink' },
  bad: { bg: 'bg-bad-soft', dot: 'bg-bad', text: 'text-bad-ink' },
  info: { bg: 'bg-info-soft', dot: 'bg-info', text: 'text-info-ink' },
}

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusTone
  label?: string
}

export function StatusBadge({ status, label, className, ...props }: StatusBadgeProps) {
  const c = STATUS_CLASSES[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-sm font-medium',
        c.bg,
        c.text,
        className,
      )}
      {...props}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />
      {label ?? STATUS_LABELS[status]}
    </span>
  )
}

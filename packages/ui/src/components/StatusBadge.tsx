import * as React from 'react'
import { cn } from '../utils/cn'

export type StatusTone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral'

const STATUS_CLASSES: Record<StatusTone, { bg: string; dot: string; text: string }> = {
  ok: { bg: 'bg-ok-soft', dot: 'bg-ok', text: 'text-ok-ink' },
  warn: { bg: 'bg-warn-soft', dot: 'bg-warn', text: 'text-warn-ink' },
  bad: { bg: 'bg-bad-soft', dot: 'bg-bad', text: 'text-bad-ink' },
  info: { bg: 'bg-info-soft', dot: 'bg-info', text: 'text-info-ink' },
  neutral: { bg: 'bg-neutral-100', dot: 'bg-neutral-400', text: 'text-neutral-600' },
}

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: StatusTone | undefined
  tone?: StatusTone | undefined
  label?: string | undefined
}

export function StatusBadge({ status, tone, label, className, children, ...props }: StatusBadgeProps) {
  const resolvedTone: StatusTone = tone ?? status ?? 'neutral'
  const c = STATUS_CLASSES[resolvedTone]
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
      {children ?? label}
    </span>
  )
}

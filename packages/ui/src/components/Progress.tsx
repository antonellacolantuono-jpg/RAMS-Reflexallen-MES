import * as React from 'react'
import { cn } from '../utils/cn'

export type ProgressTone = 'accent' | 'ok' | 'warn' | 'bad'

const BAR_COLORS: Record<ProgressTone, string> = {
  accent: 'bg-accent',
  ok: 'bg-ok',
  warn: 'bg-warn',
  bad: 'bg-bad',
}

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  tone?: ProgressTone
  showLabel?: boolean
}

export function Progress({
  value,
  max = 100,
  tone = 'accent',
  showLabel = false,
  className,
  ...props
}: ProgressProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100)
  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      <div className="h-2 flex-1 rounded-pill bg-paper-3 overflow-hidden">
        <div
          className={cn('h-full rounded-pill transition-all', BAR_COLORS[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm text-ink-3 tabular-nums w-10 text-right">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  )
}

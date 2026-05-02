'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export type WCStatus = 'ok' | 'warn' | 'bad' | 'idle' | 'neutral'

const STATUS_DOT: Record<WCStatus, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  bad: 'bg-bad',
  idle: 'bg-neutral',
  neutral: 'bg-neutral',
}

const STATUS_BAR: Record<WCStatus, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  bad: 'bg-bad',
  idle: 'bg-paper-3',
  neutral: 'bg-paper-3',
}

const STATUS_BORDER: Record<WCStatus, string> = {
  ok: 'border-line',
  warn: 'border-line',
  bad: 'border-bad',
  idle: 'border-line',
  neutral: 'border-line',
}

export interface WCCardProps {
  code: string
  name: string
  wo?: string
  q?: { current: number; target: number }
  pct?: number
  oee?: number
  status?: WCStatus
  op?: string
  onClick?: () => void
  className?: string
}

export function WCCard({
  code,
  name,
  wo,
  q,
  pct = 0,
  oee,
  status = 'neutral',
  op,
  onClick,
  className,
}: WCCardProps) {
  const clampedPct = Math.max(0, Math.min(100, pct))
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
      className={cn(
        'rounded-3 bg-paper p-4 border',
        STATUS_BORDER[status],
        status === 'bad' && 'border-[1.5px]',
        onClick && 'cursor-pointer hover:shadow-sm motion-safe:transition-shadow',
        className,
      )}
      data-status={status}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0">
          <div className="font-mono text-[11px] text-ink-3">{code}</div>
          <div className="text-base font-semibold leading-tight mt-0.5 text-ink truncate">
            {name}
          </div>
        </div>
        <span
          aria-hidden
          className={cn('h-2.5 w-2.5 rounded-full mt-1 flex-shrink-0', STATUS_DOT[status])}
        />
      </div>
      {wo && <div className="font-mono text-xs text-ink-2 tabular-nums">{wo}</div>}
      {q && (
        <div className="font-mono text-2xl font-semibold mt-1 tabular-nums text-ink">
          {q.current} / {q.target}
        </div>
      )}
      <div
        className="mt-2 h-1 bg-paper-3 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={clampedPct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={cn('h-full', STATUS_BAR[status])} style={{ width: `${clampedPct}%` }} />
      </div>
      <div className="flex items-center justify-between mt-2.5 text-[11px]">
        {op && <span className="text-ink-3 truncate">{op}</span>}
        {oee != null && oee > 0 && (
          <span className="font-mono tabular-nums text-ink-2">OEE {oee}%</span>
        )}
      </div>
    </div>
  )
}

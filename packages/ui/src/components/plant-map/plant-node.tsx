'use client'

import * as React from 'react'
import { cn } from '../../utils/cn'

export type PlantNodeStatus = 'ok' | 'warn' | 'bad' | 'idle'

const STATUS_DOT: Record<PlantNodeStatus, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  bad: 'bg-bad',
  idle: 'bg-neutral',
}

const STATUS_BORDER: Record<PlantNodeStatus, string> = {
  ok: 'border-line',
  warn: 'border-warn',
  bad: 'border-bad',
  idle: 'border-line',
}

export interface PlantNodeProps {
  x: number
  y: number
  code: string
  name: string
  status?: PlantNodeStatus
  kpi?: string
  selected?: boolean
  onClick?: () => void
  className?: string
}

export function PlantNode({
  x,
  y,
  code,
  name,
  status = 'idle',
  kpi,
  selected,
  onClick,
  className,
}: PlantNodeProps) {
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
      data-status={status}
      data-selected={selected ? 'true' : undefined}
      className={cn(
        'absolute w-[130px] rounded-2 bg-paper p-2 border',
        STATUS_BORDER[status],
        status === 'bad' && 'border-[1.5px]',
        selected && 'ring-2 ring-accent',
        onClick && 'cursor-pointer hover:shadow-sm motion-safe:transition-shadow',
        className,
      )}
      style={{ left: x, top: y }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-ink-3">{code}</span>
        <span
          aria-hidden
          className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[status])}
        />
      </div>
      <div className="text-xs font-semibold leading-tight mt-0.5 text-ink truncate">{name}</div>
      {kpi && (
        <div
          className={cn(
            'font-mono text-[11px] mt-1.5 tabular-nums',
            status === 'bad' ? 'text-bad-ink' : 'text-ink-2',
          )}
        >
          {kpi}
        </div>
      )}
    </div>
  )
}

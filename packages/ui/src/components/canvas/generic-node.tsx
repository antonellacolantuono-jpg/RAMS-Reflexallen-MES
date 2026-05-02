'use client'

import * as React from 'react'
import { Workflow } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../utils/cn'

export type GenericNodeStatus = 'ok' | 'warn' | 'bad' | 'neutral'

const STATUS_DOT: Record<GenericNodeStatus, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  bad: 'bg-bad',
  neutral: 'bg-neutral',
}

export type GenericNodePort = 'in' | 'out'

export interface GenericNodeProps {
  x: number
  y: number
  width?: number
  icon?: LucideIcon
  kicker?: string
  title: string
  sub?: string
  status?: GenericNodeStatus
  selected?: boolean
  invalid?: boolean
  ports?: GenericNodePort[]
  onClick?: () => void
  className?: string
}

export function GenericNode({
  x,
  y,
  width = 180,
  icon: Icon = Workflow,
  kicker,
  title,
  sub,
  status = 'neutral',
  selected,
  invalid,
  ports = ['in', 'out'],
  onClick,
  className,
}: GenericNodeProps) {
  return (
    <div
      data-status={status}
      data-selected={selected ? 'true' : undefined}
      data-invalid={invalid ? 'true' : undefined}
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
        'absolute rounded-2 bg-paper border text-xs',
        invalid ? 'border-bad border-[1.5px]' : selected ? 'border-accent border-[1.5px]' : 'border-line',
        selected && !invalid && 'ring-4 ring-accent/15',
        onClick && 'cursor-pointer',
        className,
      )}
      style={{ left: x, top: y, width }}
    >
      {ports.includes('in') && (
        <span
          aria-hidden
          className="absolute left-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-paper border-[1.5px] border-ink-2"
        />
      )}
      {ports.includes('out') && (
        <span
          aria-hidden
          className="absolute right-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-paper border-[1.5px] border-ink-2"
        />
      )}
      <div className="flex items-center gap-2 px-2.5 py-2 border-b border-line">
        <Icon size={13} className="text-accent" aria-hidden />
        {kicker && (
          <span className="flex-1 text-[10px] uppercase tracking-wider font-semibold text-ink-3 truncate">
            {kicker}
          </span>
        )}
        <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[status])} />
      </div>
      <div className="px-2.5 py-2">
        <div className="font-semibold text-[12.5px] text-ink">{title}</div>
        {sub && <div className="text-ink-3 text-[11px] mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

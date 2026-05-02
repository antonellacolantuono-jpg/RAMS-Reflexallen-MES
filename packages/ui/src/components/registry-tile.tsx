'use client'

import * as React from 'react'
import { StatusBadge, type StatusTone } from './StatusBadge'
import { cn } from '../utils/cn'

export interface RegistryTileProps {
  code: string
  title: string
  sub?: string
  status?: StatusTone
  statusLabel?: string
  kpi?: string | number
  kpiLabel?: string
  photo?: string
  onClick?: () => void
  className?: string
}

export function RegistryTile({
  code,
  title,
  sub,
  status,
  statusLabel,
  kpi,
  kpiLabel,
  photo,
  onClick,
  className,
}: RegistryTileProps) {
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
        'rounded-2 border border-line bg-paper overflow-hidden motion-safe:transition-colors',
        onClick && 'cursor-pointer hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        className,
      )}
    >
      <div className="h-24 bg-paper-2 relative flex items-center justify-center">
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
          {photo ?? code}
        </span>
        {status && (
          <span className="absolute top-2 right-2">
            <StatusBadge tone={status}>{statusLabel ?? status}</StatusBadge>
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="font-mono text-[10.5px] text-ink-3">{code}</div>
        <div className="text-sm font-semibold leading-tight mt-0.5 line-clamp-2 text-ink">
          {title}
        </div>
        {sub && <div className="text-xs text-ink-3 mt-1 line-clamp-1">{sub}</div>}
        {kpi != null && (
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-base font-semibold text-ink tabular-nums">{kpi}</span>
            {kpiLabel && <span className="text-[10px] text-ink-3 uppercase">{kpiLabel}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

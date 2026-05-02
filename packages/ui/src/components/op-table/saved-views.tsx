'use client'

import * as React from 'react'
import { cn } from '../../utils/cn'

export type SavedViewDot = 'ok' | 'warn' | 'bad' | 'info' | 'accent'

export interface SavedView {
  id: string
  label: string
  count?: number
  dot?: SavedViewDot
}

const DOT_BG: Record<SavedViewDot, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  bad: 'bg-bad',
  info: 'bg-info',
  accent: 'bg-accent',
}

export interface SavedViewsProps {
  views: SavedView[]
  value: string
  onChange: (id: string) => void
  onSaveView?: () => void
  className?: string
}

export function SavedViews({ views, value, onChange, onSaveView, className }: SavedViewsProps) {
  return (
    <div className={cn('border-b border-line bg-paper flex items-center px-3', className)} role="tablist">
      {views.map((v) => {
        const active = value === v.id
        return (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(v.id)}
            className={cn(
              'h-9 px-3 text-sm flex items-center gap-1.5 -mb-px border-b-2 motion-safe:transition-colors',
              active
                ? 'border-accent text-ink font-semibold'
                : 'border-transparent text-ink-3 hover:text-ink',
            )}
          >
            {v.dot && <span className={cn('h-1.5 w-1.5 rounded-full', DOT_BG[v.dot])} />}
            {v.label}
            {v.count != null && (
              <span className="font-mono text-[10.5px] text-ink-3 tabular-nums">{v.count}</span>
            )}
          </button>
        )
      })}
      <div className="flex-1" />
      {onSaveView && (
        <button
          type="button"
          onClick={onSaveView}
          className="h-9 px-2 text-xs text-ink-3 hover:text-accent-ink"
        >
          + Salva vista…
        </button>
      )}
    </div>
  )
}

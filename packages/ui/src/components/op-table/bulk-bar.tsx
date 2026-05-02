'use client'

import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { Check } from './check'
import { cn } from '../../utils/cn'

export type BulkActionTone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral'

export interface BulkAction {
  id: string
  label: string
  icon?: LucideIcon
  tone?: BulkActionTone
  onClick: () => void
}

const TONE_CLASS: Record<BulkActionTone, string> = {
  ok: 'text-ok-ink',
  warn: 'text-warn-ink',
  bad: 'text-bad-ink',
  info: 'text-info-ink',
  neutral: 'text-ink',
}

export interface BulkBarProps {
  count: number
  totalAvailable?: number
  onSelectAll?: () => void
  onClear: () => void
  actions: BulkAction[]
  className?: string
}

export function BulkBar({ count, totalAvailable, onSelectAll, onClear, actions, className }: BulkBarProps) {
  return (
    <div
      className={cn(
        'border-b border-line bg-accent-soft px-3 py-2 flex items-center gap-2 text-sm',
        className,
      )}
      role="region"
      aria-label="Azioni multiple"
    >
      <Check state="mixed" />
      <span className="font-semibold text-accent-ink">
        <span className="font-mono tabular-nums">{count}</span> selezionati
      </span>
      {totalAvailable && totalAvailable > count && onSelectAll && (
        <>
          <span className="text-accent-ink/60">·</span>
          <button
            type="button"
            onClick={onSelectAll}
            className="text-xs text-accent-ink hover:underline"
          >
            Seleziona tutti i {totalAvailable} risultati
          </button>
        </>
      )}
      <div className="flex-1" />
      {actions.map((a) => {
        const Icon = a.icon
        return (
          <button
            key={a.id}
            type="button"
            onClick={a.onClick}
            className={cn(
              'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-1 border border-line bg-paper hover:bg-paper-2 text-xs font-medium',
              a.tone ? TONE_CLASS[a.tone] : 'text-ink',
            )}
          >
            {Icon && <Icon size={12} />}
            {a.label}
          </button>
        )
      })}
      <span className="border-r border-line h-5 mx-1" aria-hidden />
      <button
        type="button"
        onClick={onClear}
        className="text-xs text-accent-ink hover:underline"
      >
        Annulla selezione
      </button>
    </div>
  )
}

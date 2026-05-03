'use client'

import * as React from 'react'
import { BarChart3, Calendar, GitBranch, LayoutGrid, List } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../utils/cn'

export type ViewMode = 'list' | 'card' | 'flow' | 'gantt' | 'calendar'

const VIEW_META: Record<ViewMode, { label: string; Icon: LucideIcon }> = {
  list: { label: 'Lista', Icon: List },
  card: { label: 'Schede', Icon: LayoutGrid },
  flow: { label: 'Flusso', Icon: GitBranch },
  gantt: { label: 'Gantt', Icon: BarChart3 },
  calendar: { label: 'Calendario', Icon: Calendar },
}

export interface ViewSwitcherProps {
  value: ViewMode
  onChange: (next: ViewMode) => void
  views: ViewMode[]
  /**
   * Optional per-mode label override. Useful when a registry uses a view in a
   * non-default way — e.g. Workflows uses the `list` mode to render a
   * hierarchical tree and labels it "Tabella" instead of the default "Lista".
   * Modes not present here fall back to {@link VIEW_META}'s default labels.
   */
  labels?: Partial<Record<ViewMode, string>>
  className?: string
}

export function ViewSwitcher({ value, onChange, views, labels, className }: ViewSwitcherProps) {
  return (
    <div role="group" aria-label="Cambia vista" className={cn('inline-flex rounded-1 border border-line bg-paper overflow-hidden', className)}>
      {views.map((v, i) => {
        const meta = VIEW_META[v]
        const label = labels?.[v] ?? meta.label
        const isActive = value === v
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            title={label}
            aria-pressed={isActive}
            aria-label={label}
            className={cn(
              'h-8 w-9 flex items-center justify-center transition-colors',
              i > 0 && 'border-l border-line',
              isActive ? 'bg-ink text-paper' : 'text-ink-3 hover:text-ink hover:bg-paper-2',
            )}
          >
            <meta.Icon size={14} />
          </button>
        )
      })}
    </div>
  )
}

import * as React from 'react'
import { cn } from '../utils/cn'

export type TabDot = 'ok' | 'warn' | 'bad' | 'info'

export interface Tab {
  id: string
  label: string
  disabled?: boolean
  /** Optional small count badge rendered next to the label (mono). PROMPT_DS_LIFT D5. */
  count?: number
  /** Optional status dot rendered before the label. PROMPT_DS_LIFT D5. */
  dot?: TabDot
  /** Optional keyboard hint rendered to the right of the label (mono). PROMPT_DS_LIFT D5. */
  kbd?: string
}

const DOT_BG: Record<TabDot, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  bad: 'bg-bad',
  info: 'bg-info',
}

export interface TabsProps {
  tabs: Tab[]
  value: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, value, onChange, className }: TabsProps) {
  return (
    <div
      className={cn('flex border-b border-line gap-0', className)}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={tab.id === value}
          disabled={tab.disabled}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors inline-flex items-center gap-1.5',
            tab.id === value
              ? 'border-accent text-accent'
              : 'border-transparent text-ink-3 hover:text-ink hover:border-line',
            tab.disabled && 'opacity-40 pointer-events-none',
          )}
        >
          {tab.dot && (
            <span
              aria-hidden
              className={cn('h-1.5 w-1.5 rounded-full', DOT_BG[tab.dot])}
            />
          )}
          <span>{tab.label}</span>
          {tab.count != null && (
            <span className="font-mono text-[10.5px] text-ink-3 tabular-nums">{tab.count}</span>
          )}
          {tab.kbd && (
            <span className="font-mono text-[10px] text-ink-3 ml-1">{tab.kbd}</span>
          )}
        </button>
      ))}
    </div>
  )
}

import * as React from 'react'
import { cn } from '../utils/cn'

export interface Tab {
  id: string
  label: string
  disabled?: boolean
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
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            tab.id === value
              ? 'border-accent text-accent'
              : 'border-transparent text-ink-3 hover:text-ink hover:border-line',
            tab.disabled && 'opacity-40 pointer-events-none',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

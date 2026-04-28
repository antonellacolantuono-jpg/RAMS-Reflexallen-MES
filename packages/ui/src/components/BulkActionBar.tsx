'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface BulkAction {
  key: string
  label: string
  icon?: React.ReactNode | undefined
  variant?: 'default' | 'danger' | undefined
  onClick: () => void
}

export interface BulkActionBarProps {
  selectedCount: number
  actions: BulkAction[]
  onClear: () => void
  className?: string | undefined
}

export function BulkActionBar({ selectedCount, actions, onClear, className }: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-lg',
        className,
      )}
    >
      <span className="text-sm font-medium text-neutral-700">
        {selectedCount} {selectedCount === 1 ? 'elemento selezionato' : 'elementi selezionati'}
      </span>
      <div className="h-4 w-px bg-neutral-200" />
      <div className="flex items-center gap-2">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={action.onClick}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              action.variant === 'danger'
                ? 'bg-error-50 text-error-700 hover:bg-error-100 border border-error-200'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200',
            )}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onClear}
        className="ml-1 rounded-md p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
        aria-label="Deseleziona tutto"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

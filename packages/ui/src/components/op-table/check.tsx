'use client'

import * as React from 'react'
import { cn } from '../../utils/cn'

export type CheckState = 'off' | 'on' | 'mixed'

export interface CheckProps {
  state?: CheckState
  onClick?: () => void
  ariaLabel?: string
  className?: string
}

export function Check({ state = 'off', onClick, ariaLabel = 'Seleziona', className }: CheckProps) {
  const isOn = state !== 'off'
  return (
    <button
      type="button"
      onClick={onClick}
      role="checkbox"
      aria-checked={state === 'mixed' ? 'mixed' : state === 'on'}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center justify-center w-3.5 h-3.5 border rounded-sm motion-safe:transition-colors',
        isOn ? 'bg-accent border-accent' : 'bg-paper border-line-2 hover:border-ink-3',
        className,
      )}
    >
      {state === 'on' && (
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round">
          <polyline points="2.5 6.5 5 9 9.5 3.5" />
        </svg>
      )}
      {state === 'mixed' && <span className="block bg-white" style={{ width: 7, height: 1.5, borderRadius: 1 }} />}
    </button>
  )
}

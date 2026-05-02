'use client'

import * as React from 'react'

export type SortDir = 'asc' | 'desc'

export interface SortIconProps {
  dir?: SortDir | null
  idx?: number | null
  className?: string
}

export function SortIcon({ dir, idx, className }: SortIconProps) {
  return (
    <span className={`inline-flex items-center gap-0.5 ml-1 ${className ?? ''}`} aria-hidden>
      <svg width="9" height="11" viewBox="0 0 9 11" fill="none">
        <path
          d="M4.5 1L8 4.5H1z"
          fill={dir === 'asc' ? 'var(--accent)' : 'var(--ink-3)'}
          opacity={dir === 'asc' ? 1 : 0.35}
        />
        <path
          d="M4.5 10L1 6.5H8z"
          fill={dir === 'desc' ? 'var(--accent)' : 'var(--ink-3)'}
          opacity={dir === 'desc' ? 1 : 0.35}
        />
      </svg>
      {idx != null && idx > 0 && (
        <span className="font-mono text-[9px] text-accent-ink">{idx}</span>
      )}
    </span>
  )
}

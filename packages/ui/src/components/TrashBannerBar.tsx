'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface TrashBannerBarProps {
  count: number
  onView?: (() => void) | undefined
  onRestoreAll?: (() => void) | undefined
  className?: string | undefined
}

export function TrashBannerBar({ count, onView, onRestoreAll, className }: TrashBannerBarProps) {
  if (count === 0) return null

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border border-warning-200 bg-warning-50 px-4 py-2.5',
        className,
      )}
    >
      <div className="flex items-center gap-2 text-sm text-warning-800">
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>
          <strong>{count}</strong> {count === 1 ? 'elemento eliminato' : 'elementi eliminati'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {onView && (
          <button
            type="button"
            onClick={onView}
            className="text-sm font-medium text-warning-700 hover:text-warning-900 underline"
          >
            Visualizza
          </button>
        )}
        {onRestoreAll && (
          <button
            type="button"
            onClick={onRestoreAll}
            className="inline-flex items-center gap-1 rounded-md border border-warning-300 bg-white px-2.5 py-1 text-sm font-medium text-warning-700 hover:bg-warning-100"
          >
            Ripristina tutto
          </button>
        )}
      </div>
    </div>
  )
}

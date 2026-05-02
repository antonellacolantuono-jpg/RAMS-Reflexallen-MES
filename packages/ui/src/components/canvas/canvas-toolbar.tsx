'use client'

import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface CanvasTool {
  id: string
  icon: LucideIcon
  label: string
  active?: boolean
  onClick?: () => void
}

export interface CanvasToolbarProps {
  tools: CanvasTool[]
  className?: string
}

export function CanvasToolbar({ tools, className }: CanvasToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Strumenti canvas"
      className={cn(
        'absolute top-3 left-3 inline-flex rounded-1 border border-line bg-paper overflow-hidden',
        className,
      )}
    >
      {tools.map((t, i) => (
        <button
          key={t.id}
          type="button"
          onClick={t.onClick}
          title={t.label}
          aria-label={t.label}
          aria-pressed={Boolean(t.active)}
          className={cn(
            'w-8 h-8 inline-flex items-center justify-center hover:bg-paper-2',
            i > 0 && 'border-l border-line',
            t.active && 'bg-paper-2 text-accent-ink',
          )}
        >
          <t.icon size={13} />
        </button>
      ))}
    </div>
  )
}

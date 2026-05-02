'use client'

import * as React from 'react'
import { cn } from '../../utils/cn'

export interface CanvasGridProps {
  height?: number | string
  /** Grid step in px (dotted background). Default 16. */
  step?: number
  children?: React.ReactNode
  className?: string
}

export function CanvasGrid({ height = 320, step = 16, children, className }: CanvasGridProps) {
  return (
    <div
      data-testid="canvas-grid"
      className={cn('relative overflow-hidden bg-paper-2', className)}
      style={{
        height,
        backgroundImage: 'radial-gradient(circle, var(--ink-3) 0.6px, transparent 0.6px)',
        backgroundSize: `${step}px ${step}px`,
        backgroundPosition: '0 0',
      }}
    >
      {children}
    </div>
  )
}

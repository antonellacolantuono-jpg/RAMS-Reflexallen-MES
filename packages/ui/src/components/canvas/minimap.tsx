'use client'

import * as React from 'react'
import { cn } from '../../utils/cn'

export interface MinimapNode {
  x: number
  y: number
  width?: number
  height?: number
  highlighted?: boolean
}

export interface MinimapViewport {
  x: number
  y: number
  width: number
  height: number
}

export interface MinimapProps {
  width?: number
  height?: number
  /** Miniature node markers (already in minimap-coordinate space). */
  nodes?: MinimapNode[]
  /** Viewport indicator (already in minimap-coordinate space). */
  viewport?: MinimapViewport
  className?: string
}

export function Minimap({
  width = 120,
  height = 80,
  nodes,
  viewport,
  className,
}: MinimapProps) {
  return (
    <div
      role="img"
      aria-label="Minimappa canvas"
      data-testid="minimap"
      className={cn(
        'absolute bottom-3 left-3 rounded-1 border border-line bg-paper p-1',
        className,
      )}
      style={{ width, height }}
    >
      <div className="relative w-full h-full bg-paper-2 rounded-sm overflow-hidden">
        {nodes?.map((n, i) => (
          <span
            key={i}
            className={cn(
              'absolute rounded-sm',
              n.highlighted ? 'bg-accent' : 'bg-ink-3',
            )}
            style={{
              left: n.x,
              top: n.y,
              width: n.width ?? 14,
              height: n.height ?? 8,
            }}
          />
        ))}
        {viewport && (
          <span
            aria-label="Viewport"
            className="absolute rounded-sm border-[1.5px] border-accent"
            style={{
              left: viewport.x,
              top: viewport.y,
              width: viewport.width,
              height: viewport.height,
              backgroundColor: 'color-mix(in oklch, var(--accent) 12%, transparent)',
            }}
          />
        )}
      </div>
    </div>
  )
}

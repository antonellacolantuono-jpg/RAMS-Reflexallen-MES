'use client'

import * as React from 'react'
import { Maximize2, Minus, Plus } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface ZoomControlsProps {
  zoomPercent?: number
  onZoomIn?: () => void
  onZoomOut?: () => void
  onFit?: () => void
  className?: string
}

export function ZoomControls({
  zoomPercent = 100,
  onZoomIn,
  onZoomOut,
  onFit,
  className,
}: ZoomControlsProps) {
  return (
    <div
      role="toolbar"
      aria-label="Controlli zoom"
      className={cn(
        'absolute bottom-3 right-3 inline-flex flex-col rounded-1 border border-line bg-paper overflow-hidden',
        className,
      )}
    >
      <button
        type="button"
        onClick={onZoomIn}
        className="w-8 h-8 inline-flex items-center justify-center hover:bg-paper-2"
        aria-label="Zoom in"
      >
        <Plus size={14} />
      </button>
      <button
        type="button"
        onClick={onZoomOut}
        className="w-8 h-8 inline-flex items-center justify-center hover:bg-paper-2 border-t border-line"
        aria-label="Zoom out"
      >
        <Minus size={14} />
      </button>
      <button
        type="button"
        onClick={onFit}
        className="w-8 h-8 inline-flex items-center justify-center hover:bg-paper-2 border-t border-line"
        aria-label="Adatta"
        title="Adatta alla pagina"
      >
        <Maximize2 size={13} />
      </button>
      <div className="border-t border-line h-7 px-1 flex items-center justify-center font-mono text-[10px] tabular-nums text-ink-3">
        {zoomPercent}%
      </div>
    </div>
  )
}

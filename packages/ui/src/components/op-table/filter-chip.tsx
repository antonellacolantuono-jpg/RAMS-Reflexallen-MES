'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface FilterChipProps {
  field: string
  op: string
  value: string
  onRemove?: () => void
  className?: string
}

export function FilterChip({ field, op, value, onRemove, className }: FilterChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 h-7 pl-2 pr-1 rounded-pill bg-paper border border-line text-xs',
        className,
      )}
    >
      <span className="text-ink-3">{field}</span>
      <span className="font-mono text-[10.5px] text-ink-3">{op}</span>
      <span className="font-semibold text-ink">{value}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="w-4 h-4 inline-flex items-center justify-center text-ink-3 hover:text-ink hover:bg-paper-2 rounded-sm"
          aria-label={`Rimuovi filtro ${field}`}
        >
          <X size={10} />
        </button>
      )}
    </span>
  )
}

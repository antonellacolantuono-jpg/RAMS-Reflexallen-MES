'use client'

import * as React from 'react'
import { Search, X } from 'lucide-react'
import { FilterChip } from './filter-chip'
import { cn } from '../../utils/cn'

export interface OpTableFilter {
  field: string
  op: string
  value: string
}

export interface FilterBarProps {
  search: string
  onSearchChange: (v: string) => void
  searchPlaceholder?: string
  filters?: OpTableFilter[]
  onFilterRemove?: (index: number) => void
  onClearFilters?: () => void
  onAddFilter?: () => void
  resultsLabel?: string
  className?: string
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Cerca…',
  filters = [],
  onFilterRemove,
  onClearFilters,
  onAddFilter,
  resultsLabel,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        'border-b border-line bg-paper-2 px-3 py-2 flex items-center gap-2 flex-wrap',
        className,
      )}
    >
      <div className="border border-line rounded-1 bg-paper px-2 h-7 flex items-center gap-1.5 text-xs min-w-[200px]">
        <Search size={12} className="text-ink-3" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="flex-1 outline-none bg-transparent text-xs"
          aria-label="Cerca"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="text-ink-3 hover:text-ink"
            aria-label="Pulisci ricerca"
          >
            <X size={11} />
          </button>
        )}
      </div>

      {filters.length > 0 && <span className="border-r border-line h-5" aria-hidden />}

      {filters.map((f, i) => (
        <FilterChip
          key={`${f.field}-${i}`}
          field={f.field}
          op={f.op}
          value={f.value}
          {...(onFilterRemove ? { onRemove: () => onFilterRemove(i) } : {})}
        />
      ))}

      {onAddFilter && (
        <button
          type="button"
          onClick={onAddFilter}
          className="rounded-pill inline-flex items-center gap-1 h-7 px-2 text-xs text-ink-3 hover:text-accent-ink bg-paper border border-dashed border-line"
        >
          + Filtro
        </button>
      )}

      {filters.length > 0 && onClearFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="text-xs text-ink-3 hover:text-bad-ink ml-1"
        >
          Reset filtri
        </button>
      )}

      <div className="flex-1" />

      {resultsLabel && (
        <span className="font-mono text-xs text-ink-3 tabular-nums">{resultsLabel}</span>
      )}
    </div>
  )
}

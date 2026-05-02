'use client'

import * as React from 'react'
import { cn } from '../../utils/cn'
import { Check } from './check'
import { SortIcon, type SortDir } from './sort-icon'
import { SavedViews, type SavedView } from './saved-views'
import { FilterBar, type OpTableFilter } from './filter-bar'
import { BulkBar, type BulkAction } from './bulk-bar'
import { RowMenu, type RowMenuItem } from './row-menu'

export interface OpTableColumn<T> {
  id: string
  label: string
  width?: string | number
  num?: boolean
  sortable?: boolean
  render?: (row: T) => React.ReactNode
}

export interface OpTablePagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface OperationalTableProps<T extends { id: string }> {
  rows: T[]
  columns: OpTableColumn<T>[]

  views?: SavedView[]
  activeView?: string
  onViewChange?: (id: string) => void

  search?: string
  onSearchChange?: (s: string) => void
  searchPlaceholder?: string

  filters?: OpTableFilter[]
  onFilterRemove?: (index: number) => void
  onClearFilters?: () => void

  selection?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void

  sortBy?: string
  sortDir?: SortDir
  onSort?: (col: string, dir: SortDir) => void

  bulkActions?: BulkAction[]
  rowActions?: (row: T) => RowMenuItem[]

  pagination?: OpTablePagination
  onPageChange?: (page: number) => void

  isLoading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T) => void

  lastRefreshLabel?: string
  className?: string
}

export function OperationalTable<T extends { id: string }>({
  rows,
  columns,
  views,
  activeView,
  onViewChange,
  search = '',
  onSearchChange,
  searchPlaceholder,
  filters,
  onFilterRemove,
  onClearFilters,
  selection,
  onSelectionChange,
  sortBy,
  sortDir,
  onSort,
  bulkActions,
  rowActions,
  pagination,
  onPageChange,
  isLoading,
  emptyMessage = 'Nessun elemento trovato',
  onRowClick,
  lastRefreshLabel,
  className,
}: OperationalTableProps<T>) {
  const selectionMode = Boolean(onSelectionChange)
  const selectedSet = selection ?? new Set<string>()

  const allOnPage = rows.length > 0 && rows.every((r) => selectedSet.has(r.id))
  const someOnPage = rows.some((r) => selectedSet.has(r.id))
  const headerState = allOnPage ? 'on' : someOnPage ? 'mixed' : 'off'

  const toggleAllPage = () => {
    if (!onSelectionChange) return
    const next = new Set(selectedSet)
    if (allOnPage) {
      rows.forEach((r) => next.delete(r.id))
    } else {
      rows.forEach((r) => next.add(r.id))
    }
    onSelectionChange(next)
  }

  const toggleRow = (id: string) => {
    if (!onSelectionChange) return
    const next = new Set(selectedSet)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectionChange(next)
  }

  const handleHeaderClick = (col: OpTableColumn<T>) => {
    if (!col.sortable || !onSort) return
    const nextDir: SortDir =
      sortBy === col.id && sortDir === 'asc' ? 'desc' : 'asc'
    onSort(col.id, nextDir)
  }

  const sortIdxFor = (colId: string): number | null => (sortBy === colId ? 1 : null)

  const resultsLabel =
    pagination && rows.length > 0
      ? `${pagination.total} totali · pagina ${pagination.page}/${pagination.totalPages}`
      : undefined

  const sortSummary = sortBy ? `Ordinamento: ${sortBy} ${sortDir ?? 'asc'}` : undefined

  return (
    <div className={cn('border border-line rounded-2 overflow-hidden bg-paper', className)}>
      {views && views.length > 0 && activeView != null && onViewChange && (
        <SavedViews views={views} value={activeView} onChange={onViewChange} />
      )}

      {onSearchChange && (
        <FilterBar
          search={search}
          onSearchChange={onSearchChange}
          {...(searchPlaceholder ? { searchPlaceholder } : {})}
          {...(filters ? { filters } : {})}
          {...(onFilterRemove ? { onFilterRemove } : {})}
          {...(onClearFilters ? { onClearFilters } : {})}
          {...(resultsLabel ? { resultsLabel } : {})}
        />
      )}

      {selectionMode && selectedSet.size > 0 && bulkActions && bulkActions.length > 0 && (
        <BulkBar
          count={selectedSet.size}
          {...(pagination ? { totalAvailable: pagination.total } : {})}
          onClear={() => onSelectionChange?.(new Set())}
          actions={bulkActions}
        />
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums" style={{ borderCollapse: 'collapse' }}>
          <colgroup>
            {selectionMode && <col style={{ width: 36 }} />}
            {columns.map((c) => (
              <col
                key={c.id}
                style={c.width ? { width: typeof c.width === 'number' ? c.width : c.width } : undefined}
              />
            ))}
            {rowActions && <col style={{ width: 36 }} />}
          </colgroup>
          <thead>
            <tr className="bg-paper-2 border-b border-line">
              {selectionMode && (
                <th className="px-2 py-2">
                  <Check
                    state={headerState}
                    onClick={toggleAllPage}
                    ariaLabel={allOnPage ? 'Deseleziona tutti' : 'Seleziona tutti'}
                  />
                </th>
              )}
              {columns.map((c) => {
                const isSorted = sortBy === c.id
                return (
                  <th
                    key={c.id}
                    onClick={() => handleHeaderClick(c)}
                    className={cn(
                      'px-3 py-2 text-xs uppercase font-semibold tracking-wide text-ink-3 select-none',
                      c.sortable && 'cursor-pointer hover:text-ink',
                      c.num && 'text-right',
                    )}
                    aria-sort={
                      isSorted ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined
                    }
                  >
                    <span className={cn('inline-flex items-center', c.num && 'flex-row-reverse')}>
                      {c.label}
                      {c.sortable && (
                        <SortIcon
                          dir={isSorted && sortDir ? sortDir : null}
                          idx={sortIdxFor(c.id)}
                        />
                      )}
                    </span>
                  </th>
                )
              })}
              {rowActions && <th aria-label="Azioni" />}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={
                    columns.length + (selectionMode ? 1 : 0) + (rowActions ? 1 : 0)
                  }
                  className="px-3 py-8 text-center text-ink-3"
                >
                  Caricamento…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    columns.length + (selectionMode ? 1 : 0) + (rowActions ? 1 : 0)
                  }
                  className="px-3 py-8 text-center text-ink-3"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isSel = selectedSet.has(row.id)
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      'border-b border-line group',
                      isSel ? 'bg-accent-soft/40' : 'hover:bg-paper-2',
                      onRowClick && 'cursor-pointer',
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectionMode && (
                      <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                        <Check
                          state={isSel ? 'on' : 'off'}
                          onClick={() => toggleRow(row.id)}
                          ariaLabel="Seleziona riga"
                        />
                      </td>
                    )}
                    {columns.map((c) => {
                      const value = c.render
                        ? c.render(row)
                        : ((row as unknown as Record<string, unknown>)[c.id] ?? '')
                      return (
                        <td
                          key={c.id}
                          className={cn(
                            'px-3 py-2 text-ink',
                            c.num && 'text-right font-mono',
                          )}
                        >
                          {value as React.ReactNode}
                        </td>
                      )
                    })}
                    {rowActions && (
                      <td className="px-1 py-1" onClick={(e) => e.stopPropagation()}>
                        <RowMenu items={rowActions(row)} />
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-line px-3 py-1.5 bg-paper flex items-center text-xs text-ink-3 font-mono tabular-nums gap-2">
        {pagination && (
          <span>
            Pagina {pagination.page} di {pagination.totalPages} · {rows.length} di {pagination.total}
          </span>
        )}
        <div className="flex-1" />
        {sortSummary && <span>{sortSummary}</span>}
        {lastRefreshLabel && (
          <>
            {sortSummary && <span>·</span>}
            <span>{lastRefreshLabel}</span>
          </>
        )}
        {pagination && pagination.totalPages > 1 && onPageChange && (
          <div className="flex items-center gap-1 ml-2">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page <= 1}
              className="h-6 px-2 rounded-sm border border-line bg-paper hover:bg-paper-2 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Pagina precedente"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="h-6 px-2 rounded-sm border border-line bg-paper hover:bg-paper-2 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Pagina successiva"
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

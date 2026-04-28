'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean | undefined
  width?: string | undefined
  render?: ((row: T) => React.ReactNode) | undefined
}

export interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface DataTableProps<T extends { id: string }> {
  data: T[]
  columns: Column<T>[]
  pagination?: PaginationState | undefined
  sortBy?: string | undefined
  sortDir?: 'asc' | 'desc' | undefined
  selectedIds?: Set<string> | undefined
  isLoading?: boolean | undefined
  emptyMessage?: string | undefined
  onSort?: ((key: string, dir: 'asc' | 'desc') => void) | undefined
  onPageChange?: ((page: number) => void) | undefined
  onSelectionChange?: ((ids: Set<string>) => void) | undefined
  onRowClick?: ((row: T) => void) | undefined
  className?: string | undefined
}

type SortDir = 'asc' | 'desc'

export function DataTable<T extends { id: string }>({
  data,
  columns,
  pagination,
  sortBy,
  sortDir = 'asc',
  selectedIds,
  isLoading,
  emptyMessage = 'Nessun elemento trovato',
  onSort,
  onPageChange,
  onSelectionChange,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && data.every((row) => selectedIds?.has(row.id))
  const someSelected = data.some((row) => selectedIds?.has(row.id))

  function toggleAll() {
    if (!onSelectionChange) return
    if (allSelected) {
      const next = new Set(selectedIds)
      data.forEach((row) => next.delete(row.id))
      onSelectionChange(next)
    } else {
      const next = new Set(selectedIds)
      data.forEach((row) => next.add(row.id))
      onSelectionChange(next)
    }
  }

  function toggleRow(id: string) {
    if (!onSelectionChange) return
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectionChange(next)
  }

  function handleSort(key: string) {
    if (!onSort) return
    const nextDir: SortDir = sortBy === key && sortDir === 'asc' ? 'desc' : 'asc'
    onSort(key, nextDir)
  }

  return (
    <div className={cn('flex flex-col gap-0', className)}>
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-[12.5px] leading-tight border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              {onSelectionChange && (
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
                    onChange={toggleAll}
                    className="h-3.5 w-3.5 rounded border-neutral-300 accent-primary-600"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    'px-3 py-2.5 text-left font-semibold text-neutral-600 whitespace-nowrap',
                    col.sortable && 'cursor-pointer select-none hover:text-neutral-900',
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <span className="text-neutral-300">
                        {sortBy === col.key ? (
                          sortDir === 'asc' ? '↑' : '↓'
                        ) : (
                          '↕'
                        )}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-neutral-100">
                  {onSelectionChange && <td className="px-3 py-2.5" />}
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-2.5">
                      <div className="h-3.5 w-3/4 animate-pulse rounded bg-neutral-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onSelectionChange ? 1 : 0)}
                  className="px-3 py-10 text-center text-sm text-neutral-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const isSelected = selectedIds?.has(row.id) ?? false
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      'border-b border-neutral-100 transition-colors',
                      isSelected ? 'bg-primary-50' : 'hover:bg-neutral-50',
                      onRowClick && 'cursor-pointer',
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {onSelectionChange && (
                      <td
                        className="px-3 py-2.5"
                        onClick={(e) => { e.stopPropagation(); toggleRow(row.id) }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(row.id)}
                          className="h-3.5 w-3.5 rounded border-neutral-300 accent-primary-600"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className="px-3 py-2.5 text-neutral-800">
                        {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-neutral-100 px-1 pt-3">
          <span className="text-xs text-neutral-500">
            {pagination.total} elementi · pagina {pagination.page} di {pagination.totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange?.(pagination.page - 1)}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:pointer-events-none"
            >
              ← Prec
            </button>
            {Array.from({ length: Math.min(pagination.totalPages, 7) }).map((_, i) => {
              const page = i + 1
              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => onPageChange?.(page)}
                  className={cn(
                    'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                    page === pagination.page
                      ? 'bg-primary-600 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100',
                  )}
                >
                  {page}
                </button>
              )
            })}
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange?.(pagination.page + 1)}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:pointer-events-none"
            >
              Succ →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

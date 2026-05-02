'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { EmptyState } from '@mes/ui'

export type SelectionMode = 'multi' | 'single'

export interface ResourceListProps<T> {
  items: T[]
  selectedIds: string[]
  onToggle: (id: string) => void
  onClear: () => void
  /** Pulls the unique id from each row (typically `r => r.id`). */
  getId: (item: T) => string
  /** Returns the searchable text — concatenated code + name, etc. */
  getSearchHaystack: (item: T) => string
  /** Renders the row body (everything except the leading checkbox/radio). */
  renderRow: (item: T, isSelected: boolean) => ReactNode
  searchPlaceholder?: string
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  emptyTitle?: string
  emptyBody?: string
  selectionMode?: SelectionMode
  /** data-resource-tab attribute hook for testability. */
  testId?: string
}

export function ResourceList<T>({
  items,
  selectedIds,
  onToggle,
  onClear,
  getId,
  getSearchHaystack,
  renderRow,
  searchPlaceholder = 'Cerca…',
  isLoading,
  error,
  onRetry,
  emptyTitle = 'Nessun elemento',
  emptyBody,
  selectionMode = 'multi',
  testId,
}: ResourceListProps<T>) {
  const [query, setQuery] = useState('')

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((it) => getSearchHaystack(it).toLowerCase().includes(q))
  }, [items, query, getSearchHaystack])

  return (
    <div
      data-resource-list={testId ?? 'list'}
      className="flex h-full flex-col gap-2"
    >
      {/* Header: search input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="w-full rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm placeholder:text-neutral-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          data-resource-search="input"
        />
      </div>

      {/* Body: scrollable list */}
      <div
        className="min-h-0 flex-1 overflow-y-auto rounded-md border border-neutral-200 bg-white"
        data-resource-body="scroll"
      >
        {isLoading ? (
          <SkeletonRows />
        ) : error ? (
          <div className="p-4">
            <EmptyState
              kind="error"
              title="Errore caricamento"
              body={error.message}
              compact
              {...(onRetry ? { cta: { label: 'Riprova', onClick: onRetry } } : {})}
            />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-4">
            <EmptyState
              kind={query ? 'no-results' : 'no-data'}
              title={query ? 'Nessun risultato' : emptyTitle}
              {...(emptyBody && !query ? { body: emptyBody } : {})}
              compact
            />
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {filteredItems.map((item) => {
              const id = getId(item)
              const isSelected = selectedSet.has(id)
              return (
                <li
                  key={id}
                  data-resource-id={id}
                  data-resource-selected={isSelected ? 'true' : 'false'}
                >
                  <button
                    type="button"
                    onClick={() => onToggle(id)}
                    className="flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none"
                    aria-pressed={isSelected}
                  >
                    <span className="mt-0.5 flex-shrink-0">
                      {selectionMode === 'multi' ? (
                        <Checkbox checked={isSelected} />
                      ) : (
                        <Radio checked={isSelected} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">{renderRow(item, isSelected)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Footer: counter + Pulisci */}
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span data-resource-counter>
          {selectedIds.length === 0
            ? '0 selezionati'
            : `${selectedIds.length} selezionat${selectedIds.length === 1 ? 'o' : 'i'}`}
        </span>
        <button
          type="button"
          onClick={onClear}
          disabled={selectedIds.length === 0}
          className="rounded px-2 py-0.5 text-accent hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          data-resource-clear="button"
        >
          Pulisci
        </button>
      </div>
    </div>
  )
}

function SkeletonRows() {
  return (
    <ul className="divide-y divide-neutral-100" data-resource-skeleton="rows">
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex items-center gap-3 px-3 py-2.5">
          <span className="h-4 w-4 flex-shrink-0 rounded border border-neutral-200 bg-neutral-100" />
          <span className="flex flex-1 flex-col gap-1">
            <span className="h-3 w-1/3 rounded bg-neutral-200" />
            <span className="h-2.5 w-2/3 rounded bg-neutral-100" />
          </span>
        </li>
      ))}
    </ul>
  )
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={
        'flex h-4 w-4 items-center justify-center rounded border ' +
        (checked
          ? 'border-accent bg-accent text-white'
          : 'border-neutral-300 bg-white')
      }
      aria-hidden
    >
      {checked && (
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 5l2 2 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  )
}

function Radio({ checked }: { checked: boolean }) {
  return (
    <span
      className={
        'flex h-4 w-4 items-center justify-center rounded-full border ' +
        (checked ? 'border-accent' : 'border-neutral-300 bg-white')
      }
      aria-hidden
    >
      {checked && <span className="h-2 w-2 rounded-full bg-accent" />}
    </span>
  )
}

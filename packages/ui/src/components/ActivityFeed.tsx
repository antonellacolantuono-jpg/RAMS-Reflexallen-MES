'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface AuditEntry {
  id: string
  action: 'create' | 'update' | 'delete' | 'restore' | string
  changedBy: string
  createdAt: string | Date
  before?: Record<string, unknown> | null | undefined
  after?: Record<string, unknown> | null | undefined
}

export interface ActivityFeedProps {
  entries: AuditEntry[]
  isLoading?: boolean | undefined
  hasMore?: boolean | undefined
  onLoadMore?: (() => void) | undefined
  className?: string | undefined
}

const ACTION_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  create: { icon: '+', color: 'bg-ok-100 text-ok-700', label: 'Creato' },
  update: { icon: '✎', color: 'bg-info-100 text-info-700', label: 'Modificato' },
  delete: { icon: '🗑', color: 'bg-error-100 text-error-700', label: 'Eliminato' },
  restore: { icon: '↩', color: 'bg-warning-100 text-warning-700', label: 'Ripristinato' },
}

function getDiff(
  before?: Record<string, unknown> | null,
  after?: Record<string, unknown> | null,
): Array<{ key: string; from: unknown; to: unknown }> {
  if (!before || !after) return []
  return Object.keys(after)
    .filter(
      (k) =>
        k !== 'updatedAt' &&
        k !== 'updatedBy' &&
        JSON.stringify(before[k]) !== JSON.stringify(after[k]),
    )
    .slice(0, 5)
    .map((key) => ({ key, from: before[key], to: after[key] }))
}

function formatDate(value: string | Date) {
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ActivityFeed({ entries, isLoading, hasMore, onLoadMore, className }: ActivityFeedProps) {
  return (
    <div className={cn('flex flex-col gap-0', className)}>
      {isLoading && entries.length === 0 ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3 py-3 border-b border-neutral-100 last:border-0">
            <div className="h-6 w-6 rounded-full bg-neutral-100 animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-1/3 bg-neutral-100 rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-neutral-100 rounded animate-pulse" />
            </div>
          </div>
        ))
      ) : entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-400">Nessuna attività registrata</p>
      ) : (
        entries.map((entry) => {
          const meta = ACTION_ICONS[entry.action] ?? {
            icon: '•',
            color: 'bg-neutral-100 text-neutral-600',
            label: entry.action,
          }
          const diff = getDiff(
            entry.before as Record<string, unknown> | null,
            entry.after as Record<string, unknown> | null,
          )

          return (
            <div key={entry.id} className="flex gap-3 py-3 border-b border-neutral-100 last:border-0">
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5',
                  meta.color,
                )}
              >
                {meta.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-medium text-neutral-800">{meta.label}</span>
                  <span className="text-xs text-neutral-500">da {entry.changedBy}</span>
                  <span className="text-xs text-neutral-400">{formatDate(entry.createdAt)}</span>
                </div>
                {diff.length > 0 && (
                  <div className="mt-1.5 space-y-0.5">
                    {diff.map(({ key, from, to }) => (
                      <div key={key} className="text-xs text-neutral-600">
                        <span className="font-mono text-neutral-500">{key}:</span>{' '}
                        <span className="line-through text-neutral-400">{String(from ?? '—')}</span>
                        {' → '}
                        <span className="text-neutral-800">{String(to ?? '—')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })
      )}

      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoading}
          className="mt-2 w-full rounded-md border border-neutral-200 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
        >
          {isLoading ? 'Caricamento…' : 'Carica altro'}
        </button>
      )}
    </div>
  )
}

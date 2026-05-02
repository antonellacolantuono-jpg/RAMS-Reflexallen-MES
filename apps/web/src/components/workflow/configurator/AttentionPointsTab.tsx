'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { sdk } from '../../../lib/sdk'
import { ResourceList } from './ResourceList'

export interface AttentionPointsTabProps {
  selectedIds: string[]
  onToggle: (id: string) => void
  onClear: () => void
}

const SEVERITY_RANK: Record<string, number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-bad',
  warning: 'bg-warn',
  info: 'bg-info',
}

const SEVERITY_LABEL: Record<string, string> = {
  critical: 'Critico',
  warning: 'Avviso',
  info: 'Info',
}

export function AttentionPointsTab({
  selectedIds,
  onToggle,
  onClear,
}: AttentionPointsTabProps) {
  const query = useQuery({
    queryKey: ['attention-points', 'all'],
    queryFn: () => sdk.attentionPoints.list({ limit: 200 }),
  })

  // Sort by severity descending (critical first), then by createdAt descending.
  const items = useMemo(() => {
    const list = [...(query.data?.data ?? [])]
    list.sort((a, b) => {
      const rankA = SEVERITY_RANK[a.severity] ?? 99
      const rankB = SEVERITY_RANK[b.severity] ?? 99
      if (rankA !== rankB) return rankA - rankB
      return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
    })
    return list
  }, [query.data])

  return (
    <ResourceList
      testId="attention-points"
      items={items}
      selectedIds={selectedIds}
      onToggle={onToggle}
      onClear={onClear}
      getId={(it) => it.id}
      getSearchHaystack={(it) =>
        `${it.message} ${it.entityType} ${it.severity}`
      }
      isLoading={query.isLoading}
      error={query.error as Error | null | undefined ?? null}
      onRetry={() => query.refetch()}
      searchPlaceholder="Cerca per messaggio, entità o severità…"
      emptyTitle="Nessun attention point"
      emptyBody="Verifica i dati nel registro Attention Points."
      renderRow={(it) => (
        <span className="flex flex-col">
          <span className="flex items-center gap-2">
            <span
              aria-hidden
              data-severity={it.severity}
              className={
                'h-1.5 w-1.5 flex-shrink-0 rounded-full ' +
                (SEVERITY_DOT[it.severity] ?? 'bg-neutral-400')
              }
            />
            <span className="text-sm text-ink truncate">{it.message}</span>
          </span>
          <span className="flex items-center gap-2 text-[10.5px] text-ink-3">
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 uppercase tracking-wide">
              {it.entityType}
            </span>
            <span className="font-medium">
              {SEVERITY_LABEL[it.severity] ?? it.severity}
            </span>
          </span>
        </span>
      )}
    />
  )
}

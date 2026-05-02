'use client'

import { useQuery } from '@tanstack/react-query'
import { sdk } from '../../../lib/sdk'
import { ResourceList } from './ResourceList'

export interface MaterialsTabProps {
  selectedIds: string[]
  onToggle: (id: string) => void
  onClear: () => void
}

export function MaterialsTab({
  selectedIds,
  onToggle,
  onClear,
}: MaterialsTabProps) {
  const query = useQuery({
    queryKey: ['materials', 'all'],
    queryFn: () => sdk.items.list({ limit: 200 }),
  })

  const items = query.data?.data ?? []

  return (
    <ResourceList
      testId="materials"
      items={items}
      selectedIds={selectedIds}
      onToggle={onToggle}
      onClear={onClear}
      getId={(it) => it.id}
      getSearchHaystack={(it) => `${it.code} ${it.name} ${it.itemType}`}
      isLoading={query.isLoading}
      error={query.error as Error | null | undefined ?? null}
      onRetry={() => query.refetch()}
      searchPlaceholder="Cerca per codice, nome o tipo…"
      emptyTitle="Nessun materiale"
      emptyBody="Verifica i dati nel registro Articoli."
      renderRow={(it) => (
        <span className="flex flex-col">
          <span className="flex items-center gap-2">
            <span className="font-mono text-xs text-ink-2">{it.code}</span>
            <span className="text-sm text-ink">{it.name}</span>
          </span>
          <span className="flex items-center gap-2 text-[10.5px] text-ink-3">
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 uppercase tracking-wide">
              {it.itemType}
            </span>
            <span>UM: {it.uom}</span>
          </span>
        </span>
      )}
    />
  )
}

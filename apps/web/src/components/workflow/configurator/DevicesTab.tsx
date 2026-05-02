'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { sdk } from '../../../lib/sdk'
import { ResourceList } from './ResourceList'

export interface DevicesTabProps {
  selectedIds: string[]
  onToggle: (id: string) => void
  onClear: () => void
}

const STATUS_TONE: Record<string, string> = {
  available: 'bg-ok/10 text-ok',
  reserved: 'bg-info/10 text-info',
  in_use: 'bg-info/10 text-info',
  cleaning: 'bg-warn/10 text-warn',
  maintenance: 'bg-warn/10 text-warn',
  broken: 'bg-bad/10 text-bad',
  retired: 'bg-neutral-200 text-neutral-600',
}

export function DevicesTab({
  selectedIds,
  onToggle,
  onClear,
}: DevicesTabProps) {
  const query = useQuery({
    queryKey: ['equipment', 'all'],
    queryFn: () => sdk.equipment.list({ limit: 200 }),
  })

  // Equipment is a hierarchy (plant → area → workcenter → device → tool slot).
  // Devices tab shows ONLY level === 'device' rows. Backend filter is not yet
  // wired; mirror ProductionStepForm's pattern of fetching all + filtering
  // client-side.
  const items = useMemo(
    () => (query.data?.data ?? []).filter((eq) => eq.level === 'device'),
    [query.data],
  )

  return (
    <ResourceList
      testId="devices"
      items={items}
      selectedIds={selectedIds}
      onToggle={onToggle}
      onClear={onClear}
      getId={(it) => it.id}
      getSearchHaystack={(it) => `${it.code} ${it.name} ${it.class}`}
      isLoading={query.isLoading}
      error={query.error as Error | null | undefined ?? null}
      onRetry={() => query.refetch()}
      searchPlaceholder="Cerca per codice, nome o classe…"
      emptyTitle="Nessun dispositivo"
      emptyBody="Verifica i dati nel registro Equipment."
      renderRow={(it) => (
        <span className="flex flex-col">
          <span className="flex items-center gap-2">
            <span className="font-mono text-xs text-ink-2">{it.code}</span>
            <span className="text-sm text-ink">{it.name}</span>
          </span>
          <span className="flex items-center gap-2 text-[10.5px] text-ink-3">
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 uppercase tracking-wide">
              {it.class}
            </span>
            <span
              className={
                'rounded px-1.5 py-0.5 uppercase tracking-wide ' +
                (STATUS_TONE[it.status] ?? 'bg-neutral-100 text-neutral-600')
              }
            >
              {it.status}
            </span>
          </span>
        </span>
      )}
    />
  )
}

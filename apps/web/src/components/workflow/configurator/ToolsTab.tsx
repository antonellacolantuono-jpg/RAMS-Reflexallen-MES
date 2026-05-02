'use client'

import { useQuery } from '@tanstack/react-query'
import { sdk } from '../../../lib/sdk'
import { ResourceList } from './ResourceList'

export interface ToolsTabProps {
  selectedIds: string[]
  onToggle: (id: string) => void
  onClear: () => void
}

const WEAR_TONE: Record<string, string> = {
  ok: 'bg-ok/10 text-ok',
  warning: 'bg-warn/10 text-warn',
  critical: 'bg-bad/10 text-bad',
  retired: 'bg-neutral-200 text-neutral-600',
}

export function ToolsTab({ selectedIds, onToggle, onClear }: ToolsTabProps) {
  const query = useQuery({
    queryKey: ['tools', 'all'],
    queryFn: () => sdk.tools.list({ limit: 200 }),
  })

  const items = query.data?.data ?? []

  return (
    <ResourceList
      testId="tools"
      items={items}
      selectedIds={selectedIds}
      onToggle={onToggle}
      onClear={onClear}
      getId={(it) => it.id}
      getSearchHaystack={(it) => `${it.code} ${it.name}`}
      isLoading={query.isLoading}
      error={query.error as Error | null | undefined ?? null}
      onRetry={() => query.refetch()}
      searchPlaceholder="Cerca per codice o nome…"
      emptyTitle="Nessun attrezzo"
      emptyBody="Verifica i dati nel registro Attrezzi."
      renderRow={(it) => (
        <span className="flex flex-col">
          <span className="flex items-center gap-2">
            <span className="font-mono text-xs text-ink-2">{it.code}</span>
            <span className="text-sm text-ink">{it.name}</span>
          </span>
          <span className="flex items-center gap-2 text-[10.5px] text-ink-3">
            <span
              className={
                'rounded px-1.5 py-0.5 uppercase tracking-wide ' +
                (WEAR_TONE[it.wearStatus] ?? 'bg-neutral-100 text-neutral-600')
              }
            >
              {it.wearStatus}
            </span>
            <span>
              Cicli {it.currentCyclesCount}
              {it.maxCycles ? `/${it.maxCycles}` : ''}
            </span>
          </span>
        </span>
      )}
    />
  )
}

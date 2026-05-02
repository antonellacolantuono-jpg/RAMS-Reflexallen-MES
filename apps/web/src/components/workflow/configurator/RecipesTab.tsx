'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Cpu } from 'lucide-react'
import { EmptyState } from '@mes/ui'
import { sdk } from '../../../lib/sdk'
import { ResourceList } from './ResourceList'

export interface RecipesTabProps {
  selectedDeviceIds: string[]
  selectedRecipeId: string | null
  onSelect: (id: string | null) => void
}

const RECIPE_STATUS_TONE: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-600',
  approved: 'bg-ok/10 text-ok',
  deprecated: 'bg-bad/10 text-bad',
}

const RECIPE_STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  approved: 'Approvata',
  deprecated: 'Deprecata',
}

export function RecipesTab({
  selectedDeviceIds,
  selectedRecipeId,
  onSelect,
}: RecipesTabProps) {
  const recipesQuery = useQuery({
    queryKey: ['recipes', 'all'],
    queryFn: () => sdk.recipes.list({ limit: 200 }),
    enabled: selectedDeviceIds.length > 0,
  })

  // Equipment lookup → map device.id → device.code so we can render a
  // device-compat chip on each recipe row. Cached separately to share with
  // DevicesTab.
  const equipmentQuery = useQuery({
    queryKey: ['equipment', 'all'],
    queryFn: () => sdk.equipment.list({ limit: 200 }),
    enabled: selectedDeviceIds.length > 0,
  })

  const deviceCodeById = useMemo(() => {
    const map = new Map<string, string>()
    for (const eq of equipmentQuery.data?.data ?? []) {
      map.set(eq.id, eq.code)
    }
    return map
  }, [equipmentQuery.data])

  // Recipe.deviceId is a single FK (no compatibleDevices M:N — see PROMPT_PNE_1
  // § 7 surprise resolution). Filter client-side: keep recipes whose deviceId
  // is included in the operator's device selection.
  const filteredRecipes = useMemo(() => {
    if (selectedDeviceIds.length === 0) return []
    return (recipesQuery.data?.data ?? []).filter(
      (r) => r.deviceId && selectedDeviceIds.includes(r.deviceId),
    )
  }, [recipesQuery.data, selectedDeviceIds])

  // No device selected — Recipes tab is gated.
  if (selectedDeviceIds.length === 0) {
    return (
      <div
        className="flex h-full items-center justify-center rounded-md border border-dashed border-neutral-200 bg-neutral-50/50 p-6"
        data-resource-recipes-state="no-device"
      >
        <EmptyState
          kind="select"
          title="Seleziona prima un dispositivo"
          body="Le ricette sono filtrate per dispositivo."
          compact
        />
      </div>
    )
  }

  return (
    <ResourceList
      testId="recipes"
      items={filteredRecipes}
      selectedIds={selectedRecipeId ? [selectedRecipeId] : []}
      // Single-select semantics: clicking the active row deselects, clicking
      // any other row replaces selection.
      onToggle={(id) => onSelect(selectedRecipeId === id ? null : id)}
      onClear={() => onSelect(null)}
      selectionMode="single"
      getId={(it) => it.id}
      getSearchHaystack={(it) => `${it.code} ${it.name}`}
      isLoading={recipesQuery.isLoading || equipmentQuery.isLoading}
      error={
        (recipesQuery.error as Error | null | undefined) ??
        (equipmentQuery.error as Error | null | undefined) ??
        null
      }
      onRetry={() => {
        recipesQuery.refetch()
        equipmentQuery.refetch()
      }}
      searchPlaceholder="Cerca ricetta per codice o nome…"
      emptyTitle="Nessuna ricetta compatibile"
      emptyBody="I dispositivi selezionati non hanno ricette associate."
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
                (RECIPE_STATUS_TONE[it.status] ?? 'bg-neutral-100 text-neutral-600')
              }
            >
              {RECIPE_STATUS_LABEL[it.status] ?? it.status}
            </span>
            {it.deviceId && (
              <span
                className="inline-flex items-center gap-1 rounded bg-info/10 px-1.5 py-0.5 text-info"
                data-recipe-device-chip
              >
                <Cpu size={10} aria-hidden />
                <span className="font-mono">
                  {deviceCodeById.get(it.deviceId) ?? '—'}
                </span>
              </span>
            )}
          </span>
        </span>
      )}
    />
  )
}

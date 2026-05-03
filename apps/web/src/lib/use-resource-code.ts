'use client'
import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface CodedRecord {
  id?: string
  code?: string
}

interface PaginatedCache {
  data?: CodedRecord[] | undefined
}

function findCode(
  cache: PaginatedCache | undefined,
  id: string | null | undefined,
): string | null {
  if (!id) return null
  const list = cache?.data
  if (!Array.isArray(list)) return null
  const found = list.find((r) => r.id === id)
  return found?.code ?? null
}

export interface SelectedResources {
  deviceIds: string[]
  recipeId: string | null
  toolIds: string[]
  materialIds: string[]
}

/**
 * Returns the first selected resource code in priority order
 * (device > recipe > tool > material). Reads from the TanStack Query cache
 * (populated by ResourceTabs queries: 'equipment'/'recipes'/'tools'/'materials')
 * with no extra fetch. Returns null when no resource is selected or its cache
 * entry is unavailable.
 */
export function useFirstSelectedResourceCode(
  selected: SelectedResources,
): string | null {
  const qc = useQueryClient()
  return useMemo(() => {
    const equipment = qc.getQueryData<PaginatedCache>(['equipment', 'all'])
    const recipes = qc.getQueryData<PaginatedCache>(['recipes', 'all'])
    const tools = qc.getQueryData<PaginatedCache>(['tools', 'all'])
    const materials = qc.getQueryData<PaginatedCache>(['materials', 'all'])
    return (
      findCode(equipment, selected.deviceIds[0] ?? null) ??
      findCode(recipes, selected.recipeId) ??
      findCode(tools, selected.toolIds[0] ?? null) ??
      findCode(materials, selected.materialIds[0] ?? null) ??
      null
    )
  }, [qc, selected.deviceIds, selected.recipeId, selected.toolIds, selected.materialIds])
}

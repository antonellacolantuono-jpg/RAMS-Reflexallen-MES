'use client'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from './api-client'

export interface CauseCodeOption {
  id: string
  code: string
  description: string | null
  category: string
  phase: string | null
}

interface CauseCodesResponse {
  data: Array<{
    id: string
    code: string
    description?: string | null
    category: string
    phase?: string | null
  }>
}

export const causeCodesQueryKey = (category: string) =>
  ['cause-codes', category] as const

/**
 * PNE_4_FOCUSED D4.2 — fetches cause codes filtered by `category`. Phase
 * filtering (LK-* / CM-*) is applied client-side via the code prefix because
 * the schema's CauseCode rows for fault codes encode the phase in BOTH the
 * code prefix AND a `phase` column (PNE_2 S1 workaround). Returns the empty
 * array on error so the dropdown stays usable in degraded states.
 */
export function useCauseCodes(
  category: string,
  options: { phase?: 'leak' | 'camera' | null; enabled?: boolean } = {},
): { options: CauseCodeOption[]; isLoading: boolean } {
  const { phase, enabled = true } = options
  const query = useQuery({
    queryKey: causeCodesQueryKey(category),
    queryFn: async () => {
      const res = await apiGet<CauseCodesResponse>(
        `/api/cause-codes?category=${encodeURIComponent(category)}&limit=100`,
      )
      return res.data ?? []
    },
    enabled,
    staleTime: 60_000,
  })

  const items = query.data ?? []
  const filtered = phase
    ? items.filter((c) => {
        const prefix = phase === 'leak' ? 'LK-' : 'CM-'
        return c.code.startsWith(prefix)
      })
    : items

  return {
    options: filtered.map((c) => ({
      id: c.id,
      code: c.code,
      description: c.description ?? null,
      category: c.category,
      phase: c.phase ?? null,
    })),
    isLoading: query.isLoading,
  }
}

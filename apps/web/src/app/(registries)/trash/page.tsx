'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader, DataTable } from '@mes/ui'
import type { Column } from '@mes/ui'
import { sdk } from '../../../lib/sdk'

const MODULES = [
  { key: 'items', label: 'Articoli', client: () => sdk.items },
  { key: 'bom', label: 'BOM', client: () => sdk.bom },
  { key: 'equipment', label: 'Attrezzature', client: () => sdk.equipment },
  { key: 'recipes', label: 'Ricette', client: () => sdk.recipes },
  { key: 'skills', label: 'Competenze', client: () => sdk.skills },
  { key: 'operators', label: 'Operatori', client: () => sdk.operators },
  { key: 'cause-codes', label: 'Codici Causa', client: () => sdk.causeCodes },
  { key: 'tools', label: 'Attrezzature', client: () => sdk.tools },
  { key: 'box-types', label: 'Tipi Collo', client: () => sdk.boxTypes },
  { key: 'boxes', label: 'Colli', client: () => sdk.boxes },
]

type TrashRow = { id: string; module: string; moduleLabel: string; deletedAt: string }

const COLUMNS: Column<TrashRow>[] = [
  { key: 'moduleLabel', header: 'Modulo', width: '140px' },
  { key: 'id', header: 'ID', width: '200px' },
  { key: 'deletedAt', header: 'Eliminato il', render: (r) => new Date(r.deletedAt).toLocaleString('it-IT') },
]

export default function TrashPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const queryClient = useQueryClient()

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['trash', 'all'],
    queryFn: async () => {
      const results = await Promise.allSettled(
        MODULES.map(async (m) => {
          const res = await m.client().trash()
          return (res.data ?? []).map((item: { id: string; deletedAt?: string | undefined }) => ({
            id: item.id,
            module: m.key,
            moduleLabel: m.label,
            deletedAt: item.deletedAt ?? new Date().toISOString(),
          }))
        }),
      )
      return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    },
  })

  const restoreMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id) => {
          const row = rows.find((r) => r.id === id)
          const mod = MODULES.find((m) => m.key === row?.module)
          return mod ? mod.client().restore(id) : Promise.resolve()
        }),
      )
    },
    onSuccess: () => {
      setSelected(new Set())
      queryClient.invalidateQueries({ queryKey: ['trash'] })
      MODULES.forEach((m) => queryClient.invalidateQueries({ queryKey: [m.key] }))
    },
  })

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto">
      <PageHeader
        title="Cestino"
        subtitle={`${rows.length} elementi eliminati in tutti i moduli`}
        actions={
          selected.size > 0 ? (
            <button
              onClick={() => restoreMutation.mutate([...selected])}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
            >
              Ripristina selezionati ({selected.size})
            </button>
          ) : rows.length > 0 ? (
            <button
              onClick={() => restoreMutation.mutate(rows.map((r) => r.id))}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Ripristina tutti
            </button>
          ) : undefined
        }
      />

      <DataTable
        data={rows}
        columns={COLUMNS}
        isLoading={isLoading}
        selectedIds={selected}
        onSelectionChange={setSelected}
        emptyMessage="Nessun elemento nel cestino"
      />
    </div>
  )
}

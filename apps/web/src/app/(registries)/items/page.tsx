'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PageHeader,
  SearchBar,
  DataTable,
  BulkActionBar,
  TrashBannerBar,
  StatusBadge,
  ConfirmModal,
} from '@mes/ui'
import type { Column, BulkAction } from '@mes/ui'
import { sdk } from '../../../lib/sdk'
import type { ItemModel } from '@mes/sdk'
import Link from 'next/link'

const ITEM_TYPE_LABELS: Record<string, string> = {
  finished_good: 'Prodotto Finito',
  semi_finished: 'Semilavorato',
  raw_material: 'Materia Prima',
  component: 'Componente',
  consumable: 'Consumabile',
}

const ITEM_TYPE_TABS = [
  { key: '', label: 'Tutti' },
  { key: 'finished_good', label: 'PF' },
  { key: 'semi_finished', label: 'Semi.' },
  { key: 'raw_material', label: 'MP' },
  { key: 'component', label: 'Comp.' },
  { key: 'consumable', label: 'Cons.' },
]

const COLUMNS: Column<ItemModel>[] = [
  { key: 'code', header: 'Codice', sortable: true, width: '120px' },
  { key: 'name', header: 'Nome', sortable: true },
  {
    key: 'itemType',
    header: 'Tipo',
    width: '140px',
    render: (row) => ITEM_TYPE_LABELS[row.itemType] ?? row.itemType,
  },
  { key: 'uom', header: 'UdM', width: '60px' },
  { key: 'trackingMode', header: 'Tracking', width: '80px' },
  {
    key: 'isActive',
    header: 'Stato',
    width: '80px',
    render: (row) => (
      <StatusBadge tone={row.isActive ? 'ok' : 'neutral'}>{row.isActive ? 'Attivo' : 'Inattivo'}</StatusBadge>
    ),
  },
]

export default function ItemsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [itemType, setItemType] = useState('')
  const [selected, setSelected] = useState(new Set<string>())
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['items', page, search, sortBy, sortDir, itemType],
    queryFn: () =>
      sdk.items.list({ page, limit: 25, search, sortBy, sortDir, itemType: itemType || undefined }),
  })

  const { data: trashData } = useQuery({
    queryKey: ['items-trash-count'],
    queryFn: () => sdk.items.trash({ page: 1, limit: 1 }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sdk.items.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['items'] })
      void qc.invalidateQueries({ queryKey: ['items-trash-count'] })
      setDeleteTarget(null)
      setSelected(new Set())
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) await sdk.items.delete(id)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['items'] })
      void qc.invalidateQueries({ queryKey: ['items-trash-count'] })
      setSelected(new Set())
    },
  })

  function handleSort(key: string, dir: 'asc' | 'desc') {
    setSortBy(key)
    setSortDir(dir)
    setPage(1)
  }

  function handleSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  const bulkActions: BulkAction[] = [
    {
      key: 'delete',
      label: 'Elimina',
      variant: 'danger',
      onClick: () => bulkDeleteMutation.mutate(Array.from(selected)),
    },
  ]

  const pagination = data
    ? { page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages }
    : undefined

  return (
    <div className="flex flex-col gap-4 p-6 h-full overflow-y-auto">
      <PageHeader
        title="Articoli"
        subtitle="Anagrafica articoli (materie prime, componenti, prodotti finiti)"
        actions={
          <Link
            href="/items/new"
            className="rounded-md bg-primary-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            + Nuovo articolo
          </Link>
        }
      />

      <TrashBannerBar
        count={trashData?.total ?? 0}
        onView={() => window.location.assign('/items/trash')}
      />

      {/* Type tabs */}
      <div className="flex gap-0 border-b border-neutral-200">
        {ITEM_TYPE_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => { setItemType(tab.key); setPage(1) }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              itemType === tab.key
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <SearchBar
        value={search}
        onChange={handleSearch}
        placeholder="Cerca per codice o nome…"
      />

      <DataTable
        data={data?.data ?? []}
        columns={COLUMNS}
        pagination={pagination}
        sortBy={sortBy}
        sortDir={sortDir}
        selectedIds={selected}
        isLoading={isLoading}
        emptyMessage="Nessun articolo trovato"
        onSort={handleSort}
        onPageChange={setPage}
        onSelectionChange={setSelected}
        onRowClick={(row) => window.location.assign(`/items/${row.id}`)}
      />

      <BulkActionBar
        selectedCount={selected.size}
        actions={bulkActions}
        onClear={() => setSelected(new Set())}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        title="Elimina articolo"
        description="L'articolo verrà spostato nel cestino. Potrai ripristinarlo in seguito."
        confirmLabel="Elimina"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

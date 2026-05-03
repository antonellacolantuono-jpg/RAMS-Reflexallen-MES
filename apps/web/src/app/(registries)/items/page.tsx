'use client'

import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PageHeader,
  TrashBannerBar,
  StatusBadge,
  ConfirmModal,
  OperationalTable,
  useRegistryView,
} from '@mes/ui'
import type {
  OpTableColumn,
  OpTableBulkAction,
  SavedView,
} from '@mes/ui'
import { Trash2 } from 'lucide-react'
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

const TYPE_VIEWS: { id: string; label: string; itemType: string }[] = [
  { id: 'all', label: 'Tutti', itemType: '' },
  { id: 'fg', label: 'PF', itemType: 'finished_good' },
  { id: 'semi', label: 'Semi.', itemType: 'semi_finished' },
  { id: 'raw', label: 'MP', itemType: 'raw_material' },
  { id: 'component', label: 'Comp.', itemType: 'component' },
  { id: 'consumable', label: 'Cons.', itemType: 'consumable' },
]

const COLUMNS: OpTableColumn<ItemModel>[] = [
  { id: 'code', label: 'Codice', sortable: true, width: 120 },
  { id: 'name', label: 'Nome', sortable: true },
  {
    id: 'itemType',
    label: 'Tipo',
    width: 140,
    render: (row) => ITEM_TYPE_LABELS[row.itemType] ?? row.itemType,
  },
  { id: 'uom', label: 'UdM', width: 60 },
  { id: 'trackingMode', label: 'Tracking', width: 80 },
  {
    id: 'isActive',
    label: 'Stato',
    width: 80,
    render: (row) => (
      <StatusBadge tone={row.isActive ? 'ok' : 'neutral'}>
        {row.isActive ? 'Attivo' : 'Inattivo'}
      </StatusBadge>
    ),
  },
]

export default function ItemsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [activeView, setActiveView] = useState('all')
  const [selected, setSelected] = useState(new Set<string>())
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const { switcher: viewSwitcher } = useRegistryView({
    registryId: 'items',
    availableViews: ['list'],
  })

  const itemType = TYPE_VIEWS.find((v) => v.id === activeView)?.itemType ?? ''

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

  function handleSort(col: string, dir: 'asc' | 'desc') {
    setSortBy(col)
    setSortDir(dir)
    setPage(1)
  }

  function handleSearchChange(v: string) {
    setSearch(v)
    setPage(1)
  }

  function handleViewChange(id: string) {
    setActiveView(id)
    setPage(1)
    setSelected(new Set())
  }

  const views: SavedView[] = useMemo(
    () => TYPE_VIEWS.map((v) => ({ id: v.id, label: v.label })),
    [],
  )

  const bulkActions: OpTableBulkAction[] = useMemo(
    () => [
      {
        id: 'delete',
        label: 'Elimina',
        icon: Trash2,
        tone: 'bad',
        onClick: () => bulkDeleteMutation.mutate(Array.from(selected)),
      },
    ],
    [bulkDeleteMutation, selected],
  )

  const pagination = data
    ? { page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages }
    : undefined

  return (
    <div className="flex flex-col gap-4 p-6 h-full overflow-y-auto">
      <PageHeader
        title="Articoli"
        subtitle="Anagrafica articoli (materie prime, componenti, prodotti finiti)"
        actions={
          <div className="flex items-center gap-2">
            {viewSwitcher}
            <Link
              href="/items/new"
              className="inline-flex items-center justify-center gap-1.5 rounded-2 bg-accent px-3.5 py-2 text-sm font-medium text-white hover:bg-accent-2"
            >
              + Nuovo articolo
            </Link>
          </div>
        }
      />

      <TrashBannerBar
        count={trashData?.total ?? 0}
        onView={() => window.location.assign('/items/trash')}
      />

      <OperationalTable<ItemModel>
        rows={data?.data ?? []}
        columns={COLUMNS}
        views={views}
        activeView={activeView}
        onViewChange={handleViewChange}
        search={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Cerca per codice o nome…"
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        selection={selected}
        onSelectionChange={setSelected}
        bulkActions={bulkActions}
        {...(pagination ? { pagination } : {})}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="Nessun articolo trovato"
        onRowClick={(row) => window.location.assign(`/items/${row.id}`)}
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

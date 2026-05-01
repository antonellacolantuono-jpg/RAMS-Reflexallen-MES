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
import type { WorkflowModel } from '@mes/sdk'
import Link from 'next/link'

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'neutral' | 'bad'> = {
  draft: 'neutral',
  approved: 'ok',
  deprecated: 'warn',
}

const COLUMNS: Column<WorkflowModel>[] = [
  { key: 'code', header: 'Codice', sortable: true, width: '140px' },
  { key: 'name', header: 'Nome', sortable: true },
  {
    key: 'currentVersionId',
    header: 'Versione',
    width: '90px',
    render: (row) => row.currentVersion ? `v${row.currentVersion.version}` : '—',
  },
  {
    key: 'currentVersion',
    header: 'Stato versione',
    width: '130px',
    render: (row) => {
      const status = row.currentVersion?.status
      if (!status) return <span className="text-neutral-400">—</span>
      return (
        <StatusBadge tone={STATUS_TONE[status] ?? 'neutral'}>
          {status}
        </StatusBadge>
      )
    },
  },
  {
    key: 'updatedAt',
    header: 'Aggiornato',
    width: '160px',
    render: (row) => new Date(row.updatedAt).toLocaleDateString('it-IT'),
  },
]

export default function WorkflowsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selected, setSelected] = useState(new Set<string>())
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['workflows', page, search, sortBy, sortDir],
    queryFn: () => sdk.workflows.list({ page, limit: 25, search, sortBy, sortDir }),
  })

  const { data: trashData } = useQuery({
    queryKey: ['workflows-trash-count'],
    queryFn: () => sdk.workflows.trash({ page: 1, limit: 1 }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sdk.workflows.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['workflows'] })
      void qc.invalidateQueries({ queryKey: ['workflows-trash-count'] })
      setDeleteTarget(null)
      setSelected(new Set())
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) await sdk.workflows.delete(id)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['workflows'] })
      void qc.invalidateQueries({ queryKey: ['workflows-trash-count'] })
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
        title="Flussi di lavoro"
        subtitle="Progettazione e gestione dei workflow di produzione"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/workflows/from-template"
              className="rounded-md border border-primary-300 bg-white px-3.5 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
            >
              Nuovo da template
            </Link>
            <Link
              href="/workflows/new"
              className="rounded-md bg-primary-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              + Nuovo flusso
            </Link>
          </div>
        }
      />

      <TrashBannerBar
        count={trashData?.total ?? 0}
        onView={() => window.location.assign('/workflows/trash')}
      />

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
        emptyMessage="Nessun flusso di lavoro trovato"
        onSort={handleSort}
        onPageChange={setPage}
        onSelectionChange={setSelected}
        onRowClick={(row) => window.location.assign(`/workflows/${row.id}`)}
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
        title="Elimina flusso di lavoro"
        description="Il flusso verrà spostato nel cestino. Potrai ripristinarlo in seguito."
        confirmLabel="Elimina"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

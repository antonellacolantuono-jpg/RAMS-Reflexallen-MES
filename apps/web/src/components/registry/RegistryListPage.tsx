'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PageHeader,
  SearchBar,
  DataTable,
  BulkActionBar,
  TrashBannerBar,
  ConfirmModal,
} from '@mes/ui'
import type { Column, BulkAction } from '@mes/ui'
import Link from 'next/link'

interface RegistryClient<T> {
  list(filters?: Record<string, unknown>): Promise<{ data: T[]; page: number; limit: number; total: number; totalPages: number }>
  trash(params?: { page: number; limit: number }): Promise<{ total: number; data: T[]; page: number; limit: number; totalPages: number }>
  delete(id: string): Promise<void>
}

export interface RegistryListPageProps<T extends { id: string }> {
  title: string
  subtitle?: string | undefined
  moduleKey: string
  client: RegistryClient<T>
  columns: Column<T>[]
  newHref?: string | undefined
  newLabel?: string | undefined
  extraFilters?: Record<string, string | undefined> | undefined
}

export function RegistryListPage<T extends { id: string }>({
  title,
  subtitle,
  moduleKey,
  client,
  columns,
  newHref,
  newLabel = '+ Nuovo',
  extraFilters,
}: RegistryListPageProps<T>) {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selected, setSelected] = useState(new Set<string>())
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const filters = { page, limit: 25, search, sortBy: sortBy || undefined, sortDir, ...extraFilters }

  const { data, isLoading } = useQuery({
    queryKey: [moduleKey, filters],
    queryFn: () => client.list(filters as Record<string, unknown>),
  })

  const { data: trashData } = useQuery({
    queryKey: [moduleKey + '-trash-count'],
    queryFn: () => client.trash({ page: 1, limit: 1 }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => client.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [moduleKey] })
      void qc.invalidateQueries({ queryKey: [moduleKey + '-trash-count'] })
      setDeleteTarget(null)
      setSelected(new Set())
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) await client.delete(id)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [moduleKey] })
      void qc.invalidateQueries({ queryKey: [moduleKey + '-trash-count'] })
      setSelected(new Set())
    },
  })

  function handleSort(key: string, dir: 'asc' | 'desc') {
    setSortBy(key)
    setSortDir(dir)
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
        title={title}
        subtitle={subtitle}
        actions={
          newHref ? (
            <Link
              href={newHref}
              className="rounded-md bg-primary-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              {newLabel}
            </Link>
          ) : undefined
        }
      />

      <TrashBannerBar count={trashData?.total ?? 0} />

      <SearchBar
        value={search}
        onChange={(v) => { setSearch(v); setPage(1) }}
      />

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        pagination={pagination}
        sortBy={sortBy}
        sortDir={sortDir}
        selectedIds={selected}
        isLoading={isLoading}
        onSort={handleSort}
        onPageChange={setPage}
        onSelectionChange={setSelected}
        onRowClick={(row) => window.location.assign(`/${moduleKey.replace('_', '-')}/${row.id}`)}
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
        title={`Elimina ${title.toLowerCase()}`}
        description="L'elemento verrà spostato nel cestino. Potrai ripristinarlo in seguito."
        confirmLabel="Elimina"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

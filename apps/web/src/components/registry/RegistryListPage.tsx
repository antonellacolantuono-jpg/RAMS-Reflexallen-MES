'use client'

import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PageHeader,
  SearchBar,
  DataTable,
  BulkActionBar,
  TrashBannerBar,
  ConfirmModal,
  OperationalTable,
  useRegistryView,
} from '@mes/ui'
import type {
  Column,
  BulkAction,
  OpTableColumn,
  SavedView,
  OpTableBulkAction,
  ViewMode,
} from '@mes/ui'
import { Trash2 } from 'lucide-react'
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
  /**
   * Opt-in to the new OperationalTable surface (PROMPT_DS_LIFT D3).
   * Default `false` keeps the legacy DataTable + SearchBar + BulkActionBar stack
   * intact for the 10 existing callsites.
   */
  useOperationalTable?: boolean | undefined
  /** When `useOperationalTable` is true, optional saved-view tabs at the top of the table. */
  views?: SavedView[] | undefined
  /** Active view id; pairs with `onViewChange` and `views`. */
  activeView?: string | undefined
  /** Called when the user picks a different saved view tab. */
  onViewChange?: ((id: string) => void) | undefined
  /**
   * Optional override for the per-registry view modes the user may pick
   * (List / Card / Flow / etc.). Defaults to `['list']` — i.e. the
   * ViewSwitcher renders nothing because there's only one view available.
   * Bump to `['list', 'card']` (or more) once the corresponding renderers
   * are built.
   */
  availableViews?: ViewMode[] | undefined
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
  useOperationalTable = false,
  views,
  activeView,
  onViewChange,
  availableViews = ['list'],
}: RegistryListPageProps<T>) {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selected, setSelected] = useState(new Set<string>())
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  // PROMPT_DESIGN_ALIGNMENT D3 batch 5 — per-registry view persistence wiring.
  // For 1-view registries `switcher` is null (nothing rendered); the wiring
  // is in place so future Card/Flow renderers only need to bump availableViews.
  const { switcher: viewSwitcher } = useRegistryView({
    registryId: moduleKey,
    availableViews,
  })

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

  // Legacy stack (default): unchanged callsite contract for the 10 pages that use it.
  if (!useOperationalTable) {
    return (
      <div className="flex flex-col gap-4 p-6 h-full overflow-y-auto">
        <PageHeader
          title={title}
          subtitle={subtitle}
          actions={
            (viewSwitcher || newHref) ? (
              <div className="flex items-center gap-2">
                {viewSwitcher}
                {newHref ? (
                  <Link
                    href={newHref}
                    className="inline-flex items-center justify-center gap-1.5 rounded-2 bg-accent px-3.5 py-2 text-sm font-medium text-white hover:bg-accent-2"
                  >
                    {newLabel}
                  </Link>
                ) : null}
              </div>
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

  // Opt-in OperationalTable surface (PROMPT_DS_LIFT D3).
  return (
    <RegistryListPageOpTable
      title={title}
      subtitle={subtitle}
      newHref={newHref}
      newLabel={newLabel}
      moduleKey={moduleKey}
      trashCount={trashData?.total ?? 0}
      legacyColumns={columns}
      rows={data?.data ?? []}
      pagination={pagination}
      isLoading={isLoading}
      search={search}
      onSearchChange={(v) => { setSearch(v); setPage(1) }}
      sortBy={sortBy}
      sortDir={sortDir}
      onSort={handleSort}
      onPageChange={setPage}
      selection={selected}
      onSelectionChange={setSelected}
      bulkDeleteHandler={() => bulkDeleteMutation.mutate(Array.from(selected))}
      viewSwitcher={viewSwitcher}
      {...(views ? { views } : {})}
      {...(activeView != null ? { activeView } : {})}
      {...(onViewChange ? { onViewChange } : {})}
    />
  )
}

interface OpTableShellProps<T extends { id: string }> {
  title: string
  subtitle?: string | undefined
  newHref?: string | undefined
  newLabel: string
  moduleKey: string
  trashCount: number
  legacyColumns: Column<T>[]
  rows: T[]
  pagination?: { page: number; limit: number; total: number; totalPages: number } | undefined
  isLoading?: boolean | undefined
  search: string
  onSearchChange: (v: string) => void
  sortBy: string
  sortDir: 'asc' | 'desc'
  onSort: (col: string, dir: 'asc' | 'desc') => void
  onPageChange: (page: number) => void
  selection: Set<string>
  onSelectionChange: (next: Set<string>) => void
  bulkDeleteHandler: () => void
  views?: SavedView[]
  activeView?: string
  onViewChange?: (id: string) => void
  viewSwitcher?: React.ReactElement | null
}

function RegistryListPageOpTable<T extends { id: string }>({
  title,
  subtitle,
  newHref,
  newLabel,
  moduleKey,
  trashCount,
  legacyColumns,
  rows,
  pagination,
  isLoading,
  search,
  onSearchChange,
  sortBy,
  sortDir,
  onSort,
  onPageChange,
  selection,
  onSelectionChange,
  bulkDeleteHandler,
  views,
  activeView,
  onViewChange,
  viewSwitcher,
}: OpTableShellProps<T>) {
  // Adapt legacy Column<T> shape to OpTableColumn<T> (additive properties only).
  const opColumns: OpTableColumn<T>[] = useMemo(
    () =>
      legacyColumns.map((c) => ({
        id: c.key,
        label: c.header,
        sortable: c.sortable ?? false,
        ...(c.width != null ? { width: c.width } : {}),
        ...(c.render ? { render: c.render } : {}),
      })),
    [legacyColumns],
  )

  const bulkActions: OpTableBulkAction[] = useMemo(
    () => [
      {
        id: 'delete',
        label: 'Elimina',
        icon: Trash2,
        tone: 'bad',
        onClick: bulkDeleteHandler,
      },
    ],
    [bulkDeleteHandler],
  )

  return (
    <div className="flex flex-col gap-4 p-6 h-full overflow-y-auto">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          (viewSwitcher || newHref) ? (
            <div className="flex items-center gap-2">
              {viewSwitcher}
              {newHref ? (
                <Link
                  href={newHref}
                  className="inline-flex items-center justify-center gap-1.5 rounded-2 bg-accent px-3.5 py-2 text-sm font-medium text-white hover:bg-accent-2"
                >
                  {newLabel}
                </Link>
              ) : null}
            </div>
          ) : undefined
        }
      />

      <TrashBannerBar count={trashCount} />

      <OperationalTable<T>
        rows={rows}
        columns={opColumns}
        {...(views ? { views } : {})}
        {...(activeView != null ? { activeView } : {})}
        {...(onViewChange ? { onViewChange } : {})}
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder="Cerca…"
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={onSort}
        selection={selection}
        onSelectionChange={onSelectionChange}
        bulkActions={bulkActions}
        {...(pagination ? { pagination } : {})}
        onPageChange={onPageChange}
        {...(isLoading != null ? { isLoading } : {})}
        emptyMessage="Nessun elemento trovato"
        onRowClick={(row) =>
          window.location.assign(`/${moduleKey.replace('_', '-')}/${row.id}`)
        }
      />
    </div>
  )
}

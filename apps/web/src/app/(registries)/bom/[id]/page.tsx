'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EntityDetail, StatusBadge, ActivityFeed, ConfirmModal, DataTable } from '@mes/ui'
import type { AuditEntry, Column } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const BOM_STATUS_TONES: Record<string, 'ok' | 'warn' | 'neutral'> = {
  approved: 'ok',
  draft: 'warn',
  deprecated: 'neutral',
}

const BOM_STATUS_LABELS: Record<string, string> = {
  draft: 'Bozza',
  approved: 'Approvata',
  deprecated: 'Deprecata',
}

type BomLineRow = {
  id: string
  bomId: string
  componentId: string
  qty: number
  uom: string
  position: number
  isOptional: boolean
  notes: string | null
}

const LINE_COLUMNS: Column<BomLineRow>[] = [
  { key: 'position', header: 'L', width: '60px', render: (r) => `L${r.position || 1}` },
  { key: 'componentId', header: 'Componente ID' },
  { key: 'qty', header: 'Qty', width: '80px', render: (r) => String(r.qty) },
  { key: 'uom', header: 'UoM', width: '80px' },
  { key: 'isOptional', header: 'Opzionale', width: '100px', render: (r) => (r.isOptional ? 'Sì' : 'No') },
  { key: 'notes', header: 'Note', render: (r) => r.notes ?? '—' },
]

export default function BomDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = params
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: bom, isLoading } = useQuery({
    queryKey: ['bom', id],
    queryFn: () => sdk.bom.get(id),
  })

  const { data: lines, isLoading: isLoadingLines } = useQuery({
    queryKey: ['bom', id, 'tree'],
    // SDK types tree() as BomModel but controller returns BOMLine[]; cast at call site (TODO-049 will refactor).
    queryFn: () => sdk.bom.tree(id) as unknown as Promise<BomLineRow[]>,
  })

  const [auditPage, setAuditPage] = useState(1)
  const { data: auditData, isFetching: isFetchingAudit } = useQuery({
    queryKey: ['bom', id, 'audit', auditPage],
    queryFn: () => sdk.bom.audit(id, { page: auditPage, limit: 20 }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => sdk.bom.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['bom'] })
      router.push('/bom')
    },
  })

  if (!bom && !isLoading) {
    return <div className="p-6 text-sm text-neutral-500">Distinta base non trovata.</div>
  }

  const auditEntries: AuditEntry[] = (auditData?.data ?? []) as unknown as AuditEntry[]
  const hasMoreAudit = auditData ? auditPage < auditData.totalPages : false
  const linesData: BomLineRow[] = Array.isArray(lines) ? lines : []

  const tabs = [
    {
      key: 'details',
      label: 'Dettagli',
      content: bom ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {[
            ['Articolo ID', bom.itemId],
            ['Versione', `v${bom.version}`],
            ['Stato', BOM_STATUS_LABELS[bom.status] ?? bom.status],
            ['Note', bom.notes ?? '—'],
            ['Creato il', new Date(bom.createdAt).toLocaleString('it-IT')],
            ['Aggiornato il', new Date(bom.updatedAt).toLocaleString('it-IT')],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-neutral-500 font-medium">{label}</dt>
              <dd className="text-neutral-800 mt-0.5">{value ?? '—'}</dd>
            </div>
          ))}
        </dl>
      ) : null,
    },
    {
      key: 'lines',
      label: 'Linee',
      content: (
        <div className="space-y-3">
          <DataTable<BomLineRow>
            data={linesData}
            columns={LINE_COLUMNS}
            isLoading={isLoadingLines}
            emptyMessage="Nessuna linea distinta base (gestione linee in arrivo post-demo)"
          />
          {linesData.length === 0 && !isLoadingLines && (
            <p className="text-xs text-neutral-500">
              La persistenza delle linee BOM è in backlog (TODO-049).
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'activity',
      label: 'Attività',
      content: (
        <ActivityFeed
          entries={auditEntries}
          isLoading={isFetchingAudit}
          hasMore={hasMoreAudit}
          onLoadMore={() => setAuditPage((p) => p + 1)}
        />
      ),
    },
  ]

  return (
    <div className="p-6 h-full overflow-y-auto">
      <EntityDetail
        isLoading={isLoading}
        breadcrumbs={[{ label: 'Distinte Base', href: '/bom' }, { label: bom ? `BOM v${bom.version}` : '' }]}
        title={bom ? `BOM · v${bom.version}` : ''}
        subtitle={bom ? `Articolo ${bom.itemId}` : ''}
        badge={bom ? (
          <StatusBadge tone={BOM_STATUS_TONES[bom.status] ?? 'neutral'}>
            {BOM_STATUS_LABELS[bom.status] ?? bom.status}
          </StatusBadge>
        ) : undefined}
        actions={
          bom ? (
            <>
              <Link
                href={`/bom/${id}/edit`}
                className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Modifica
              </Link>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="rounded-md border border-error-200 px-3 py-1.5 text-sm font-medium text-error-700 hover:bg-error-50"
              >
                Elimina
              </button>
            </>
          ) : undefined
        }
        tabs={tabs}
        onNavigate={(href) => router.push(href)}
      />

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Elimina distinta base"
        description={`Vuoi eliminare la BOM v${bom?.version}? Verrà spostata nel cestino.`}
        confirmLabel="Elimina"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

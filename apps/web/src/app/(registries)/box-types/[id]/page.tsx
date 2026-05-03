'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EntityDetail, StatusBadge, ActivityFeed, ConfirmModal } from '@mes/ui'
import type { AuditEntry } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BoxTypeDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = params
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: bt, isLoading } = useQuery({
    queryKey: ['box-types', id],
    queryFn: () => sdk.boxTypes.get(id),
  })

  const [auditPage, setAuditPage] = useState(1)
  const { data: auditData, isFetching: isFetchingAudit } = useQuery({
    queryKey: ['box-types', id, 'audit', auditPage],
    queryFn: () => sdk.boxTypes.audit(id, { page: auditPage, limit: 20 }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => sdk.boxTypes.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['box-types'] })
      router.push('/box-types')
    },
  })

  if (!bt && !isLoading) {
    return <div className="p-6 text-sm text-neutral-500">Tipo collo non trovato.</div>
  }

  const auditEntries: AuditEntry[] = (auditData?.data ?? []) as unknown as AuditEntry[]
  const hasMoreAudit = auditData ? auditPage < auditData.totalPages : false

  const tabs = [
    {
      key: 'details',
      label: 'Dettagli',
      content: bt ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {[
            ['Codice', bt.code],
            ['Nome', bt.name],
            ['Reso (returnable)', bt.isReturnable ? 'Sì' : 'No'],
            ['Capacità (pezzi)', bt.maxUnitsCount?.toString() ?? '— (illimitata)'],
            ['Peso massimo (g)', bt.maxWeightG?.toString() ?? '— (illimitato)'],
            ['Volume massimo (L)', bt.maxVolumeL?.toString() ?? '— (illimitato)'],
            ['Plant ID', bt.plantId],
            ['Creato il', new Date(bt.createdAt).toLocaleString('it-IT')],
            ['Aggiornato il', new Date(bt.updatedAt).toLocaleString('it-IT')],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-neutral-500 font-medium">{label}</dt>
              <dd className="text-neutral-800 mt-0.5">{value ?? '—'}</dd>
            </div>
          ))}
          {bt.description && (
            <div className="col-span-2">
              <dt className="text-neutral-500 font-medium">Descrizione</dt>
              <dd className="text-neutral-800 mt-0.5">{bt.description}</dd>
            </div>
          )}
        </dl>
      ) : null,
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
        breadcrumbs={[{ label: 'Tipi Collo', href: '/box-types' }, { label: bt?.code ?? '' }]}
        title={bt?.name ?? ''}
        subtitle={bt ? `${bt.code} · ${bt.isReturnable ? 'Reso' : 'Monouso'}` : ''}
        badge={bt ? (
          <StatusBadge tone={bt.isReturnable ? 'ok' : 'neutral'}>
            {bt.isReturnable ? 'Returnable' : 'Monouso'}
          </StatusBadge>
        ) : undefined}
        actions={
          bt ? (
            <>
              <Link
                href={`/box-types/${id}/edit`}
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
        title="Elimina tipo collo"
        description={`Vuoi eliminare "${bt?.name}"? Verrà spostato nel cestino.`}
        confirmLabel="Elimina"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

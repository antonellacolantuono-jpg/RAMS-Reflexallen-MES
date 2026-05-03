'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EntityDetail, StatusBadge, ActivityFeed, ConfirmModal } from '@mes/ui'
import type { AuditEntry } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORY_LABELS: Record<string, string> = {
  defect: 'Difetto',
  downtime: 'Fermo macchina',
  scrap: 'Scarto',
  rework: 'Rilavorazione',
}

const CATEGORY_TONES: Record<string, 'bad' | 'warn' | 'info' | 'neutral'> = {
  defect: 'bad',
  downtime: 'warn',
  scrap: 'bad',
  rework: 'info',
}

export default function CauseCodeDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = params
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: cc, isLoading } = useQuery({
    queryKey: ['cause-codes', id],
    queryFn: () => sdk.causeCodes.get(id),
  })

  const [auditPage, setAuditPage] = useState(1)
  const { data: auditData, isFetching: isFetchingAudit } = useQuery({
    queryKey: ['cause-codes', id, 'audit', auditPage],
    queryFn: () => sdk.causeCodes.audit(id, { page: auditPage, limit: 20 }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => sdk.causeCodes.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cause-codes'] })
      router.push('/cause-codes')
    },
  })

  if (!cc && !isLoading) {
    return <div className="p-6 text-sm text-neutral-500">Codice causa non trovato.</div>
  }

  const auditEntries: AuditEntry[] = (auditData?.data ?? []) as unknown as AuditEntry[]
  const hasMoreAudit = auditData ? auditPage < auditData.totalPages : false

  const tabs = [
    {
      key: 'details',
      label: 'Dettagli',
      content: cc ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {[
            ['Codice', cc.code],
            ['Nome', cc.name],
            ['Categoria', CATEGORY_LABELS[cc.category] ?? cc.category],
            ['Fase', cc.phase ?? '— (qualsiasi)'],
            ['Plant ID', cc.plantId],
            ['Creato il', new Date(cc.createdAt).toLocaleString('it-IT')],
            ['Aggiornato il', new Date(cc.updatedAt).toLocaleString('it-IT')],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-neutral-500 font-medium">{label}</dt>
              <dd className="text-neutral-800 mt-0.5">{value ?? '—'}</dd>
            </div>
          ))}
          {cc.description && (
            <div className="col-span-2">
              <dt className="text-neutral-500 font-medium">Descrizione</dt>
              <dd className="text-neutral-800 mt-0.5">{cc.description}</dd>
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
        breadcrumbs={[{ label: 'Codici Causa', href: '/cause-codes' }, { label: cc?.code ?? '' }]}
        title={cc?.name ?? ''}
        subtitle={cc ? `${cc.code} · ${CATEGORY_LABELS[cc.category] ?? cc.category}` : ''}
        badge={cc ? (
          <StatusBadge tone={CATEGORY_TONES[cc.category] ?? 'neutral'}>
            {CATEGORY_LABELS[cc.category] ?? cc.category}
          </StatusBadge>
        ) : undefined}
        actions={
          cc ? (
            <>
              <Link
                href={`/cause-codes/${id}/edit`}
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
        title="Elimina codice causa"
        description={`Vuoi eliminare "${cc?.name}"? Verrà spostato nel cestino.`}
        confirmLabel="Elimina"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

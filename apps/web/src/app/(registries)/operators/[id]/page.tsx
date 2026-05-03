'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EntityDetail, StatusBadge, ActivityFeed, ConfirmModal } from '@mes/ui'
import type { AuditEntry } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const OPERATOR_STATUS_TONES: Record<string, 'ok' | 'warn' | 'neutral'> = {
  active: 'ok',
  suspended: 'warn',
  inactive: 'neutral',
}

const OPERATOR_STATUS_LABELS: Record<string, string> = {
  active: 'Attivo',
  inactive: 'Inattivo',
  suspended: 'Sospeso',
}

export default function OperatorDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = params
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: op, isLoading } = useQuery({
    queryKey: ['operators', id],
    queryFn: () => sdk.operators.get(id),
  })

  const [auditPage, setAuditPage] = useState(1)
  const { data: auditData, isFetching: isFetchingAudit } = useQuery({
    queryKey: ['operators', id, 'audit', auditPage],
    queryFn: () => sdk.operators.audit(id, { page: auditPage, limit: 20 }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => sdk.operators.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['operators'] })
      router.push('/operators')
    },
  })

  if (!op && !isLoading) {
    return <div className="p-6 text-sm text-neutral-500">Operatore non trovato.</div>
  }

  const auditEntries: AuditEntry[] = (auditData?.data ?? []) as unknown as AuditEntry[]
  const hasMoreAudit = auditData ? auditPage < auditData.totalPages : false

  const tabs = [
    {
      key: 'details',
      label: 'Dettagli',
      content: op ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {[
            ['Badge', op.badge],
            ['Nome', op.firstName],
            ['Cognome', op.lastName],
            ['Stato', OPERATOR_STATUS_LABELS[op.status] ?? op.status],
            ['Plant ID', op.plantId],
            ['Foto', op.photoUrl ?? '—'],
            ['Creato il', new Date(op.createdAt).toLocaleString('it-IT')],
            ['Aggiornato il', new Date(op.updatedAt).toLocaleString('it-IT')],
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
      key: 'skills',
      label: 'Competenze',
      content: (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            La gestione delle competenze assegnate sarà disponibile in un batch successivo.
          </p>
          <p className="mt-1 text-xs text-amber-800">
            Editor di assegnazione skill (livello, data certificazione, scadenza) in arrivo post-demo (TODO-054).
          </p>
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
        breadcrumbs={[{ label: 'Operatori', href: '/operators' }, { label: op?.badge ?? '' }]}
        title={op ? `${op.firstName} ${op.lastName}` : ''}
        subtitle={op ? `Badge ${op.badge}` : ''}
        badge={op ? (
          <StatusBadge tone={OPERATOR_STATUS_TONES[op.status] ?? 'neutral'}>
            {OPERATOR_STATUS_LABELS[op.status] ?? op.status}
          </StatusBadge>
        ) : undefined}
        actions={
          op ? (
            <>
              <Link
                href={`/operators/${id}/edit`}
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
        title="Elimina operatore"
        description={`Vuoi eliminare "${op?.firstName} ${op?.lastName}"? Verrà spostato nel cestino.`}
        confirmLabel="Elimina"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

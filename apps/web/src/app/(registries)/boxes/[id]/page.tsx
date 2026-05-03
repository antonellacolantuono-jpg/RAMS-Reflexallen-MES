'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EntityDetail, StatusBadge, ActivityFeed, ConfirmModal } from '@mes/ui'
import type { AuditEntry } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_LABELS: Record<string, string> = {
  empty: 'Vuoto',
  filling: 'In riempimento',
  full: 'Pieno',
  sealed: 'Sigillato',
  shipped: 'Spedito',
  returned: 'Restituito',
  rejected: 'Respinto',
}

const STATUS_TONES: Record<string, 'ok' | 'warn' | 'bad' | 'info' | 'neutral'> = {
  empty: 'neutral',
  filling: 'info',
  full: 'info',
  sealed: 'ok',
  shipped: 'warn',
  returned: 'warn',
  rejected: 'bad',
}

export default function BoxDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = params
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: box, isLoading } = useQuery({
    queryKey: ['boxes', id],
    queryFn: () => sdk.boxes.get(id),
  })

  const [auditPage, setAuditPage] = useState(1)
  const { data: auditData, isFetching: isFetchingAudit } = useQuery({
    queryKey: ['boxes', id, 'audit', auditPage],
    queryFn: () => sdk.boxes.audit(id, { page: auditPage, limit: 20 }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => sdk.boxes.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['boxes'] })
      router.push('/boxes')
    },
  })

  if (!box && !isLoading) {
    return <div className="p-6 text-sm text-neutral-500">Collo non trovato.</div>
  }

  const auditEntries: AuditEntry[] = (auditData?.data ?? []) as unknown as AuditEntry[]
  const hasMoreAudit = auditData ? auditPage < auditData.totalPages : false

  const tabs = [
    {
      key: 'details',
      label: 'Dettagli',
      content: box ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {[
            ['Codice', box.code],
            ['Tipo collo (ID)', box.boxTypeId],
            ['Plant ID', box.plantId],
            ['Creato il', new Date(box.createdAt).toLocaleString('it-IT')],
            ['Aggiornato il', new Date(box.updatedAt).toLocaleString('it-IT')],
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
      key: 'state',
      label: 'Stato',
      content: box ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-md border border-neutral-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">Stato</p>
                <p className="mt-1">
                  <StatusBadge tone={STATUS_TONES[box.status] ?? 'neutral'}>
                    {STATUS_LABELS[box.status] ?? box.status}
                  </StatusBadge>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-neutral-500">Cicli</p>
                <p className="mt-1 font-mono text-base text-neutral-800">{box.cyclesCount}</p>
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              ['Pezzi correnti', box.currentUnitsCount.toString()],
              ['Peso corrente (g)', box.currentWeightG.toString()],
              ['Volume corrente (L)', box.currentVolumeL.toString()],
              ['Lotto associato', box.lotId ?? '— (nessuno)'],
              ['Sigillato il', box.sealedAt ? new Date(box.sealedAt).toLocaleString('it-IT') : '— (non sigillato)'],
              ['Sigillato da', box.sealedBy ?? '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-neutral-500 font-medium">{label}</dt>
                <dd className="text-neutral-800 mt-0.5">{value ?? '—'}</dd>
              </div>
            ))}
          </dl>

          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            Stato, contatori e date di sigillatura sono normalmente gestiti dal flusso pack-out HMI. La modifica manuale tramite la pagina di edit è disponibile per override admin.
          </div>
        </div>
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
        breadcrumbs={[{ label: 'Colli', href: '/boxes' }, { label: box?.code ?? '' }]}
        title={box?.code ?? ''}
        subtitle={box ? `${STATUS_LABELS[box.status] ?? box.status} · ${box.currentUnitsCount} pz · ${box.cyclesCount} cicli` : ''}
        badge={box ? (
          <StatusBadge tone={STATUS_TONES[box.status] ?? 'neutral'}>
            {STATUS_LABELS[box.status] ?? box.status}
          </StatusBadge>
        ) : undefined}
        actions={
          box ? (
            <>
              <Link
                href={`/boxes/${id}/edit`}
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
        title="Elimina collo"
        description={`Vuoi eliminare il collo "${box?.code}"? Verrà spostato nel cestino.`}
        confirmLabel="Elimina"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

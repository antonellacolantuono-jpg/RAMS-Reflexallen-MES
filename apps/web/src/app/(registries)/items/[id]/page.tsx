'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EntityDetail, StatusBadge, ActivityFeed, ConfirmModal, ImageDisplay } from '@mes/ui'
import type { AuditEntry } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ITEM_TYPE_LABELS: Record<string, string> = {
  finished_good: 'Prodotto Finito',
  semi_finished: 'Semilavorato',
  raw_material: 'Materia Prima',
  component: 'Componente',
  consumable: 'Consumabile',
}

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = params
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: item, isLoading } = useQuery({
    queryKey: ['items', id],
    queryFn: () => sdk.items.get(id),
  })

  const [auditPage, setAuditPage] = useState(1)
  const { data: auditData, isFetching: isFetchingAudit } = useQuery({
    queryKey: ['items', id, 'audit', auditPage],
    queryFn: () => sdk.items.audit(id, { page: auditPage, limit: 20 }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => sdk.items.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['items'] })
      router.push('/items')
    },
  })

  if (!item && !isLoading) {
    return <div className="p-6 text-sm text-neutral-500">Articolo non trovato.</div>
  }

  const auditEntries: AuditEntry[] = (auditData?.data ?? []) as unknown as AuditEntry[]
  const hasMoreAudit = auditData ? auditPage < auditData.totalPages : false

  const tabs = [
    {
      key: 'details',
      label: 'Dettagli',
      content: item ? (
        <div className="flex gap-6">
          <ImageDisplay
            src={item.imageUrl ?? null}
            alt={item.name}
            size="large"
            iconCategory="item"
            entityName={item.name}
            testId="item-detail-image"
          />
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm flex-1">
          {[
            ['Codice', item.code],
            ['Nome', item.name],
            ['Tipo', ITEM_TYPE_LABELS[item.itemType] ?? item.itemType],
            ['Unità di misura', item.uom],
            ['Modalità tracking', item.trackingMode],
            ['Plant ID', item.plantId],
            ['Creato il', new Date(item.createdAt).toLocaleString('it-IT')],
            ['Aggiornato il', new Date(item.updatedAt).toLocaleString('it-IT')],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-neutral-500 font-medium">{label}</dt>
              <dd className="text-neutral-800 mt-0.5">{value ?? '—'}</dd>
            </div>
          ))}
          {item.description && (
            <div className="col-span-2">
              <dt className="text-neutral-500 font-medium">Descrizione</dt>
              <dd className="text-neutral-800 mt-0.5">{item.description}</dd>
            </div>
          )}
          </dl>
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
        breadcrumbs={[{ label: 'Articoli', href: '/items' }, { label: item?.code ?? '' }]}
        title={item?.name ?? ''}
        subtitle={item ? `${item.code} · ${ITEM_TYPE_LABELS[item.itemType] ?? item.itemType}` : ''}
        badge={item ? (
          <StatusBadge tone={item.isActive ? 'ok' : 'neutral'}>
            {item.isActive ? 'Attivo' : 'Inattivo'}
          </StatusBadge>
        ) : undefined}
        actions={
          item ? (
            <>
              <Link
                href={`/items/${id}/edit`}
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
        title="Elimina articolo"
        description={`Vuoi eliminare "${item?.name}"? Verrà spostato nel cestino.`}
        confirmLabel="Elimina"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

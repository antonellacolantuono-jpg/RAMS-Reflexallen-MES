'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EntityDetail, StatusBadge, ActivityFeed, ConfirmModal } from '@mes/ui'
import type { AuditEntry } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const EQUIPMENT_LEVEL_LABELS: Record<string, string> = {
  enterprise: 'Impresa',
  site: 'Sito',
  area: 'Area',
  work_center: 'Centro di lavoro',
  work_unit: 'Unità di lavoro',
  equipment_module: 'Modulo equipaggiamento',
}

const EQUIPMENT_CLASS_LABELS: Record<string, string> = {
  production: 'Produzione',
  storage: 'Stoccaggio',
  transport: 'Trasporto',
  test: 'Test',
  maintenance: 'Manutenzione',
  administrative: 'Amministrativo',
}

const EQUIPMENT_STATUS_TONES: Record<string, 'ok' | 'warn' | 'bad' | 'info' | 'neutral'> = {
  available: 'ok',
  reserved: 'info',
  in_use: 'warn',
  cleaning: 'warn',
  maintenance: 'warn',
  broken: 'bad',
  offline: 'neutral',
  decommissioned: 'neutral',
}

const EQUIPMENT_STATUS_LABELS: Record<string, string> = {
  available: 'Disponibile',
  reserved: 'Riservato',
  in_use: 'In uso',
  cleaning: 'In pulizia',
  maintenance: 'In manutenzione',
  broken: 'Guasto',
  offline: 'Offline',
  decommissioned: 'Dismesso',
}

export default function EquipmentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = params
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: eq, isLoading } = useQuery({
    queryKey: ['equipment', id],
    queryFn: () => sdk.equipment.get(id),
  })

  const [auditPage, setAuditPage] = useState(1)
  const { data: auditData, isFetching: isFetchingAudit } = useQuery({
    queryKey: ['equipment', id, 'audit', auditPage],
    queryFn: () => sdk.equipment.audit(id, { page: auditPage, limit: 20 }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => sdk.equipment.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['equipment'] })
      router.push('/equipment')
    },
  })

  if (!eq && !isLoading) {
    return <div className="p-6 text-sm text-neutral-500">Equipaggiamento non trovato.</div>
  }

  const auditEntries: AuditEntry[] = (auditData?.data ?? []) as unknown as AuditEntry[]
  const hasMoreAudit = auditData ? auditPage < auditData.totalPages : false

  const tabs = [
    {
      key: 'details',
      label: 'Dettagli',
      content: eq ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {[
            ['Codice', eq.code],
            ['Nome', eq.name],
            ['Livello ISA-95', EQUIPMENT_LEVEL_LABELS[eq.level] ?? eq.level],
            ['Classe', EQUIPMENT_CLASS_LABELS[eq.class] ?? eq.class],
            ['Plant ID', eq.plantId],
            ['Parent ID', eq.parentId ?? '— (nodo radice)'],
            ['Creato il', new Date(eq.createdAt).toLocaleString('it-IT')],
            ['Aggiornato il', new Date(eq.updatedAt).toLocaleString('it-IT')],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-neutral-500 font-medium">{label}</dt>
              <dd className="text-neutral-800 mt-0.5">{value ?? '—'}</dd>
            </div>
          ))}
          {eq.description && (
            <div className="col-span-2">
              <dt className="text-neutral-500 font-medium">Descrizione</dt>
              <dd className="text-neutral-800 mt-0.5">{eq.description}</dd>
            </div>
          )}
        </dl>
      ) : null,
    },
    {
      key: 'hierarchy',
      label: 'Gerarchia',
      content: (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            La visualizzazione completa della gerarchia ISA-95 sarà disponibile in un batch successivo.
          </p>
          <p className="mt-1 text-xs text-amber-800">
            Vista albero a 5 livelli (impresa → sito → area → centro di lavoro → unità) in arrivo post-demo (TODO-052).
          </p>
          {eq?.parentId && (
            <p className="mt-3 text-xs text-neutral-700">
              Parent ID corrente: <span className="font-mono">{eq.parentId}</span>
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
        breadcrumbs={[{ label: 'Equipaggiamenti', href: '/equipment' }, { label: eq?.code ?? '' }]}
        title={eq?.name ?? ''}
        subtitle={eq ? `${eq.code} · ${EQUIPMENT_LEVEL_LABELS[eq.level] ?? eq.level}` : ''}
        badge={eq ? (
          <StatusBadge tone={EQUIPMENT_STATUS_TONES[eq.status] ?? 'neutral'}>
            {EQUIPMENT_STATUS_LABELS[eq.status] ?? eq.status}
          </StatusBadge>
        ) : undefined}
        actions={
          eq ? (
            <>
              <Link
                href={`/equipment/${id}/edit`}
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
        title="Elimina equipaggiamento"
        description={`Vuoi eliminare "${eq?.name}"? Verrà spostato nel cestino.`}
        confirmLabel="Elimina"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

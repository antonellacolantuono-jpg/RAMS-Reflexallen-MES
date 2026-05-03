'use client'

import { useQuery } from '@tanstack/react-query'
import { EntityDetail, StatusBadge, PriorityBadge, ActivityFeed } from '@mes/ui'
import type { AuditEntry } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'bad' | 'neutral' | 'info'> = {
  scheduled: 'info',
  in_progress: 'warn',
  completed: 'ok',
  cancelled: 'neutral',
  overdue: 'bad',
  deferred: 'neutral',
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Pianificata',
  in_progress: 'In corso',
  completed: 'Completata',
  cancelled: 'Annullata',
  overdue: 'Scaduta',
  deferred: 'Differita',
}

const TYPE_LABEL: Record<string, string> = {
  preventive: 'Preventiva',
  corrective: 'Correttiva',
  calibration: 'Calibrazione',
  inspection: 'Ispezione',
}

function fmt(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })
}

export default function MaintenanceOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params

  const { data: mnt, isLoading } = useQuery({
    queryKey: ['maintenance-orders', id],
    queryFn: () => sdk.maintenanceOrders.get(id),
  })

  const [auditPage, setAuditPage] = useState(1)
  const { data: auditData, isFetching: isFetchingAudit } = useQuery({
    queryKey: ['maintenance-orders', id, 'audit', auditPage],
    queryFn: () => sdk.maintenanceOrders.audit(id, { page: auditPage, limit: 20 }),
  })

  if (!mnt && !isLoading) {
    return <div className="p-6 text-sm text-neutral-500">Ordine di manutenzione non trovato.</div>
  }

  const auditEntries: AuditEntry[] = (auditData?.data ?? []) as unknown as AuditEntry[]
  const hasMoreAudit = auditData ? auditPage < auditData.totalPages : false

  const tabs = [
    {
      key: 'details',
      label: 'Dettagli',
      content: mnt ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {[
            ['Codice', mnt.code],
            ['Tipo', TYPE_LABEL[mnt.type] ?? mnt.type],
            ['Priorità', mnt.priority],
            ['Descrizione', mnt.description],
            ['Impianto', mnt.equipmentNode ? `${mnt.equipmentNode.code} · ${mnt.equipmentNode.name}` : (mnt.equipmentNodeId ?? '—')],
            ['Assegnato a', mnt.assignedToId ?? '—'],
            ['Creato il', fmt(mnt.createdAt)],
            ['Aggiornato il', fmt(mnt.updatedAt)],
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
      key: 'schedule',
      label: 'Pianificazione',
      content: mnt ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-md border border-neutral-200 bg-white p-4">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 mb-3">Pianificato</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <dt className="text-neutral-500 font-medium">Inizio</dt>
                <dd className="text-neutral-800 mt-0.5 font-mono">{fmt(mnt.plannedStart)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500 font-medium">Fine</dt>
                <dd className="text-neutral-800 mt-0.5 font-mono">{fmt(mnt.plannedEnd)}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-md border border-neutral-200 bg-white p-4">
            <h3 className="text-xs uppercase tracking-wide text-neutral-500 mb-3">Effettivo</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <dt className="text-neutral-500 font-medium">Inizio</dt>
                <dd className="text-neutral-800 mt-0.5 font-mono">{fmt(mnt.actualStart)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500 font-medium">Fine</dt>
                <dd className="text-neutral-800 mt-0.5 font-mono">{fmt(mnt.actualEnd)}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            Le azioni Avvia / Completa / Annulla saranno disponibili in una iterazione successiva (TODO-062).
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
        breadcrumbs={[{ label: 'Manutenzioni', href: '/maintenance-orders' }, { label: mnt?.code ?? '' }]}
        title={mnt?.description ?? ''}
        subtitle={mnt ? `${mnt.code} · ${TYPE_LABEL[mnt.type] ?? mnt.type}` : ''}
        badge={mnt ? (
          <div className="flex gap-2 items-center">
            <StatusBadge tone={STATUS_TONE[mnt.status] ?? 'neutral'}>
              {STATUS_LABEL[mnt.status] ?? mnt.status}
            </StatusBadge>
            <PriorityBadge priority={mnt.priority as never} />
          </div>
        ) : undefined}
        actions={
          mnt ? (
            <Link
              href="/maintenance-orders"
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              ← Indietro
            </Link>
          ) : undefined
        }
        tabs={tabs}
        onNavigate={(href) => router.push(href)}
      />
    </div>
  )
}

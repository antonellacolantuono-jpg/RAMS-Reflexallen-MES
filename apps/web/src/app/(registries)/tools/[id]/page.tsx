'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EntityDetail, StatusBadge, ActivityFeed, ConfirmModal } from '@mes/ui'
import type { AuditEntry } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const WEAR_TONES: Record<string, 'ok' | 'warn' | 'bad' | 'neutral'> = {
  new: 'ok',
  good: 'ok',
  worn: 'warn',
  at_limit: 'bad',
  replaced: 'neutral',
}

const WEAR_LABELS: Record<string, string> = {
  new: 'Nuovo',
  good: 'Buono',
  worn: 'Usurato',
  at_limit: 'Al limite',
  replaced: 'Sostituito',
}

export default function ToolDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = params
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: tool, isLoading } = useQuery({
    queryKey: ['tools', id],
    queryFn: () => sdk.tools.get(id),
  })

  const [auditPage, setAuditPage] = useState(1)
  const { data: auditData, isFetching: isFetchingAudit } = useQuery({
    queryKey: ['tools', id, 'audit', auditPage],
    queryFn: () => sdk.tools.audit(id, { page: auditPage, limit: 20 }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => sdk.tools.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tools'] })
      router.push('/tools')
    },
  })

  if (!tool && !isLoading) {
    return <div className="p-6 text-sm text-neutral-500">Attrezzatura non trovata.</div>
  }

  const auditEntries: AuditEntry[] = (auditData?.data ?? []) as unknown as AuditEntry[]
  const hasMoreAudit = auditData ? auditPage < auditData.totalPages : false

  const cyclesPct = tool?.maxCycles
    ? Math.min(100, Math.round((tool.currentCyclesCount / tool.maxCycles) * 100))
    : null

  const tabs = [
    {
      key: 'details',
      label: 'Dettagli',
      content: tool ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {[
            ['Codice', tool.code],
            ['Nome', tool.name],
            ['Equipaggiamento associato', tool.equipmentNodeId ?? '—'],
            ['Cicli max', tool.maxCycles?.toString() ?? '— (illimitati)'],
            ['Creato il', new Date(tool.createdAt).toLocaleString('it-IT')],
            ['Aggiornato il', new Date(tool.updatedAt).toLocaleString('it-IT')],
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
      key: 'wear',
      label: 'Usura',
      content: tool ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-md border border-neutral-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">Stato usura</p>
                <p className="mt-1">
                  <StatusBadge tone={WEAR_TONES[tool.wearStatus] ?? 'neutral'}>
                    {WEAR_LABELS[tool.wearStatus] ?? tool.wearStatus}
                  </StatusBadge>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-neutral-500">Cicli</p>
                <p className="mt-1 font-mono text-base text-neutral-800">
                  {tool.currentCyclesCount}
                  {tool.maxCycles ? <span className="text-neutral-400"> / {tool.maxCycles}</span> : null}
                </p>
              </div>
            </div>
            {cyclesPct !== null && (
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={
                    cyclesPct >= 90
                      ? 'h-full bg-error-500'
                      : cyclesPct >= 70
                        ? 'h-full bg-amber-500'
                        : 'h-full bg-primary-500'
                  }
                  style={{ width: `${cyclesPct}%` }}
                />
              </div>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              ['Ultimo utilizzo', tool.lastUsedAt ? new Date(tool.lastUsedAt).toLocaleString('it-IT') : '— (mai utilizzato)'],
              ['Ultima sostituzione', tool.replacedAt ? new Date(tool.replacedAt).toLocaleString('it-IT') : '— (mai sostituito)'],
              ['Numero sostituzioni', tool.replacementCount.toString()],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-neutral-500 font-medium">{label}</dt>
                <dd className="text-neutral-800 mt-0.5">{value ?? '—'}</dd>
              </div>
            ))}
          </dl>

          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            I dati di usura sono gestiti dal sistema tramite ToolWearHistory ad ogni ciclo. Non sono modificabili manualmente.
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
        breadcrumbs={[{ label: 'Attrezzature', href: '/tools' }, { label: tool?.code ?? '' }]}
        title={tool?.name ?? ''}
        subtitle={tool ? `${tool.code} · ${tool.currentCyclesCount}${tool.maxCycles ? ` / ${tool.maxCycles}` : ''} cicli` : ''}
        badge={tool ? (
          <StatusBadge tone={WEAR_TONES[tool.wearStatus] ?? 'neutral'}>
            {WEAR_LABELS[tool.wearStatus] ?? tool.wearStatus}
          </StatusBadge>
        ) : undefined}
        actions={
          tool ? (
            <>
              <Link
                href={`/tools/${id}/edit`}
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
        title="Elimina attrezzatura"
        description={`Vuoi eliminare "${tool?.name}"? Verrà spostata nel cestino.`}
        confirmLabel="Elimina"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

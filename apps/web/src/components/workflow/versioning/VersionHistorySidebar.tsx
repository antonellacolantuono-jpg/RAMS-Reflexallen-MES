'use client'

import { useQuery } from '@tanstack/react-query'
import { StatusBadge } from '@mes/ui'
import { sdk } from '../../../lib/sdk'

export interface VersionHistorySidebarProps {
  workflowId: string
  currentVersionId?: string | null | undefined
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('it-IT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function VersionHistorySidebar({
  workflowId,
  currentVersionId,
}: VersionHistorySidebarProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['workflows', workflowId, 'versions'],
    queryFn: () => sdk.workflows.versions(workflowId),
  })

  const versions = data ?? []

  return (
    <div className="h-full flex flex-col bg-[var(--paper-2)] overflow-hidden">
      <div className="px-3 py-2 hairline-b flex-shrink-0">
        <span className="uppercase-label">Storico versioni</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading && (
          <p className="text-xs text-neutral-500">Caricamento storico…</p>
        )}
        {!isLoading && versions.length === 0 && (
          <p className="text-xs text-neutral-500">Nessuna versione registrata.</p>
        )}
        {versions.map((v) => {
          const isCurrent = v.id === currentVersionId
          return (
            <div
              key={v.id}
              className={`rounded-md border p-3 text-xs ${
                isCurrent
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-neutral-900">v{v.version}</span>
                <StatusBadge
                  tone={
                    v.status === 'approved'
                      ? 'ok'
                      : v.status === 'deprecated'
                        ? 'warn'
                        : 'neutral'
                  }
                >
                  {v.status}
                </StatusBadge>
              </div>
              <dl className="space-y-0.5 text-neutral-600">
                <div className="flex justify-between">
                  <dt>Creata</dt>
                  <dd>{formatDate(v.createdAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Da</dt>
                  <dd className="font-mono">{v.createdBy}</dd>
                </div>
                {v.approvedAt && (
                  <>
                    <div className="flex justify-between">
                      <dt>Approvata</dt>
                      <dd>{formatDate(v.approvedAt)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Da</dt>
                      <dd className="font-mono">{v.approvedBy ?? '—'}</dd>
                    </div>
                  </>
                )}
              </dl>
            </div>
          )
        })}
      </div>
    </div>
  )
}

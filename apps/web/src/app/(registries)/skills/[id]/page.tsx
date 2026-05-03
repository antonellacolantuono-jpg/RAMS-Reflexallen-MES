'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EntityDetail, ActivityFeed, ConfirmModal } from '@mes/ui'
import type { AuditEntry } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SkillDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = params
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: skill, isLoading } = useQuery({
    queryKey: ['skills', id],
    queryFn: () => sdk.skills.get(id),
  })

  const [auditPage, setAuditPage] = useState(1)
  const { data: auditData, isFetching: isFetchingAudit } = useQuery({
    queryKey: ['skills', id, 'audit', auditPage],
    queryFn: () => sdk.skills.audit(id, { page: auditPage, limit: 20 }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => sdk.skills.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['skills'] })
      router.push('/skills')
    },
  })

  if (!skill && !isLoading) {
    return <div className="p-6 text-sm text-neutral-500">Competenza non trovata.</div>
  }

  const auditEntries: AuditEntry[] = (auditData?.data ?? []) as unknown as AuditEntry[]
  const hasMoreAudit = auditData ? auditPage < auditData.totalPages : false

  const tabs = [
    {
      key: 'details',
      label: 'Dettagli',
      content: skill ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {[
            ['Codice', skill.code],
            ['Nome', skill.name],
            ['Categoria', skill.category],
            ['Plant ID', skill.plantId],
            ['Creato il', new Date(skill.createdAt).toLocaleString('it-IT')],
            ['Aggiornato il', new Date(skill.updatedAt).toLocaleString('it-IT')],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-neutral-500 font-medium">{label}</dt>
              <dd className="text-neutral-800 mt-0.5">{value ?? '—'}</dd>
            </div>
          ))}
          {skill.description && (
            <div className="col-span-2">
              <dt className="text-neutral-500 font-medium">Descrizione</dt>
              <dd className="text-neutral-800 mt-0.5">{skill.description}</dd>
            </div>
          )}
        </dl>
      ) : null,
    },
    {
      key: 'matrix',
      label: 'Matrice operatori',
      content: (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            La matrice operatori × competenze sarà disponibile in un batch successivo.
          </p>
          <p className="mt-1 text-xs text-amber-800">
            Vista celle certified / training / expired / none in arrivo post-demo (TODO-053).
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
        breadcrumbs={[{ label: 'Competenze', href: '/skills' }, { label: skill?.code ?? '' }]}
        title={skill?.name ?? ''}
        subtitle={skill ? `${skill.code} · ${skill.category}` : ''}
        actions={
          skill ? (
            <>
              <Link
                href={`/skills/${id}/edit`}
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
        title="Elimina competenza"
        description={`Vuoi eliminare "${skill?.name}"? Verrà spostata nel cestino.`}
        confirmLabel="Elimina"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

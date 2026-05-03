'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EntityDetail, StatusBadge, ActivityFeed, ConfirmModal } from '@mes/ui'
import type { AuditEntry } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const RECIPE_STATUS_TONES: Record<string, 'ok' | 'warn' | 'neutral'> = {
  approved: 'ok',
  draft: 'warn',
  deprecated: 'neutral',
}

const RECIPE_STATUS_LABELS: Record<string, string> = {
  draft: 'Bozza',
  approved: 'Approvata',
  deprecated: 'Deprecata',
}

export default function RecipeDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = params
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['recipes', id],
    queryFn: () => sdk.recipes.get(id),
  })

  const [auditPage, setAuditPage] = useState(1)
  const { data: auditData, isFetching: isFetchingAudit } = useQuery({
    queryKey: ['recipes', id, 'audit', auditPage],
    queryFn: () => sdk.recipes.audit(id, { page: auditPage, limit: 20 }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => sdk.recipes.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['recipes'] })
      router.push('/recipes')
    },
  })

  if (!recipe && !isLoading) {
    return <div className="p-6 text-sm text-neutral-500">Ricetta non trovata.</div>
  }

  const auditEntries: AuditEntry[] = (auditData?.data ?? []) as unknown as AuditEntry[]
  const hasMoreAudit = auditData ? auditPage < auditData.totalPages : false

  const tabs = [
    {
      key: 'details',
      label: 'Dettagli',
      content: recipe ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {[
            ['Codice', recipe.code],
            ['Nome', recipe.name],
            ['Stato', RECIPE_STATUS_LABELS[recipe.status] ?? recipe.status],
            ['Plant ID', recipe.plantId],
            ['Dispositivo ID', recipe.deviceId ?? '—'],
            ['Articolo ID', recipe.itemId ?? '—'],
            ['Creato il', new Date(recipe.createdAt).toLocaleString('it-IT')],
            ['Aggiornato il', new Date(recipe.updatedAt).toLocaleString('it-IT')],
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
      key: 'versions',
      label: 'Versioni',
      content: (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-6 text-center">
          <p className="text-sm text-neutral-600">
            Nessuna versione disponibile (gestione versioni in arrivo post-demo).
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            La persistenza dei parametri di ricetta è in backlog (TODO-050).
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
        breadcrumbs={[{ label: 'Ricette', href: '/recipes' }, { label: recipe?.code ?? '' }]}
        title={recipe?.name ?? ''}
        subtitle={recipe ? `${recipe.code} · v${recipe.version}` : ''}
        badge={recipe ? (
          <StatusBadge tone={RECIPE_STATUS_TONES[recipe.status] ?? 'neutral'}>
            {RECIPE_STATUS_LABELS[recipe.status] ?? recipe.status}
          </StatusBadge>
        ) : undefined}
        actions={
          recipe ? (
            <>
              <Link
                href={`/recipes/${id}/edit`}
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
        title="Elimina ricetta"
        description={`Vuoi eliminare "${recipe?.name}"? Verrà spostata nel cestino.`}
        confirmLabel="Elimina"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

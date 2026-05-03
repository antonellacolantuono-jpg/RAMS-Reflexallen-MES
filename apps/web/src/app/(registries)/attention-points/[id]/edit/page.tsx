'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { PageHeader, EntityForm, Field, Input, StatusBadge, Skeleton } from '@mes/ui'
import { sdk } from '../../../../../lib/sdk'
import { useState } from 'react'

const SEVERITY_TONE: Record<string, 'bad' | 'warn' | 'info' | 'neutral'> = {
  critical: 'bad',
  warning: 'warn',
  info: 'info',
}

const SEVERITY_LABELS: Record<string, string> = {
  critical: 'Critico',
  warning: 'Avviso',
  info: 'Informativo',
}

export default function ResolveAttentionPointPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = params
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ resolvedBy: '', resolveNote: '' })
  const [isDirty, setIsDirty] = useState(false)

  const { data: ap, isLoading } = useQuery({
    queryKey: ['attention-points', id],
    queryFn: () => sdk.attentionPoints.get(id),
  })

  const mutation = useMutation({
    mutationFn: () =>
      sdk.attentionPoints.resolve(id, {
        resolvedBy: form.resolvedBy,
        resolveNote: form.resolveNote || undefined,
      } as Record<string, unknown>),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['attention-points', id] })
      void qc.invalidateQueries({ queryKey: ['attention-points'] })
      router.push(`/attention-points/${id}`)
    },
    onError: (err: unknown) => {
      if (err && typeof err === 'object' && 'issues' in err) {
        const issues = (err as { issues: Array<{ path: string[]; message: string }> }).issues
        const fieldErrors: Record<string, string> = {}
        issues.forEach((issue) => {
          if (issue.path[0]) fieldErrors[issue.path[0]] = issue.message
        })
        setErrors(fieldErrors)
      }
    },
  })

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
    setIsDirty(true)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    mutation.mutate()
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (!ap) {
    return <div className="p-6 text-sm text-neutral-500">Punto di attenzione non trovato.</div>
  }

  if (ap.resolvedAt) {
    return (
      <div className="p-6 max-w-2xl">
        <PageHeader title="Già risolto" subtitle="Questo punto di attenzione è già stato chiuso." />
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          Risolto il {new Date(ap.resolvedAt).toLocaleString('it-IT')} da{' '}
          <span className="font-mono">{ap.resolvedBy}</span>.
          {ap.resolveNote && (
            <p className="mt-2 whitespace-pre-wrap text-xs text-green-800">{ap.resolveNote}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => router.push(`/attention-points/${id}`)}
          className="mt-4 rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Torna al dettaglio
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <PageHeader
        title="Risolvi punto di attenzione"
        subtitle="Conferma chi ha risolto e aggiungi una nota opzionale di chiusura."
      />

      <div className="mb-4 rounded-md border border-neutral-200 bg-paper-2 p-4 flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2">
          <StatusBadge tone={SEVERITY_TONE[ap.severity] ?? 'neutral'}>
            {SEVERITY_LABELS[ap.severity] ?? ap.severity}
          </StatusBadge>
          <span className="text-xs text-neutral-500">
            {ap.entityType} · <span className="font-mono">{ap.entityId}</span>
          </span>
        </div>
        <p className="text-neutral-800">{ap.message}</p>
      </div>

      <EntityForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={mutation.isPending}
        isDirty={isDirty}
        submitLabel="Conferma risoluzione"
      >
        <Field label="Risolto da" required error={errors['resolvedBy']}>
          <Input
            value={form.resolvedBy}
            onChange={(e) => set('resolvedBy', e.target.value)}
            placeholder="es. mario.rossi (badge o ID operatore)"
          />
        </Field>

        <Field label="Nota di risoluzione" error={errors['resolveNote']}>
          <textarea
            value={form.resolveNote}
            onChange={(e) => set('resolveNote', e.target.value)}
            rows={4}
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Cosa è stato fatto per risolvere il problema (opzionale)"
          />
        </Field>
      </EntityForm>
    </div>
  )
}

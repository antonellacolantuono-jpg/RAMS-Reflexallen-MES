'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader, EntityForm, Field, Input } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import { useState } from 'react'

export default function NewBomPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    itemId: '',
    notes: '',
  })

  const mutation = useMutation({
    mutationFn: () =>
      sdk.bom.create({
        itemId: form.itemId,
        notes: form.notes || undefined,
        // Note: lines are required by the schema but persistence is a backend gap (TODO-049).
        // We pass an empty array so the Zod parse passes when the gap is closed; the repo currently ignores it.
        lines: [],
      } as unknown as Record<string, unknown>),
    onSuccess: (bom) => {
      void qc.invalidateQueries({ queryKey: ['bom'] })
      router.push(`/bom/${bom.id}`)
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
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="p-6 max-w-2xl">
      <PageHeader title="Nuova distinta base" subtitle="BOM scalare — gestione linee in arrivo post-demo" />

      <EntityForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={mutation.isPending}
        isDirty={form.itemId.length > 0 || form.notes.length > 0}
      >
        <Field label="Articolo ID" required error={errors['itemId']}>
          <Input
            value={form.itemId}
            onChange={(e) => set('itemId', e.target.value)}
            placeholder="cuid dell'articolo prodotto finito o semilavorato"
          />
        </Field>

        <Field label="Note" error={errors['notes']}>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Note opzionali"
          />
        </Field>

        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          La gestione delle linee BOM (componenti) sarà disponibile in un batch successivo (TODO-049).
        </div>
      </EntityForm>
    </div>
  )
}

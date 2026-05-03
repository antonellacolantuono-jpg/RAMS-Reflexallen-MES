'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader, EntityForm, Field, Input } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import { useState } from 'react'

export default function NewBoxPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    code: '',
    boxTypeId: '',
    plantId: '',
  })

  const mutation = useMutation({
    mutationFn: () =>
      sdk.boxes.create({
        code: form.code,
        boxTypeId: form.boxTypeId,
        plantId: form.plantId,
      } as unknown as Record<string, unknown>),
    onSuccess: (box) => {
      void qc.invalidateQueries({ queryKey: ['boxes'] })
      router.push(`/boxes/${box.id}`)
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
      <PageHeader title="Nuovo collo" subtitle="Istanza di collo (pallet, cartone, fusto)" />

      <EntityForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={mutation.isPending}
        isDirty={form.code.length > 0 || form.boxTypeId.length > 0}
      >
        <Field label="Codice" required error={errors['code']}>
          <Input
            value={form.code}
            onChange={(e) => set('code', e.target.value.toUpperCase())}
            placeholder="es. BOX-2026-001"
          />
        </Field>

        <Field label="Tipo collo (ID)" required error={errors['boxTypeId']}>
          <Input
            value={form.boxTypeId}
            onChange={(e) => set('boxTypeId', e.target.value)}
            placeholder="cuid del tipo collo"
          />
        </Field>

        <Field label="Plant ID" required error={errors['plantId']}>
          <Input
            value={form.plantId}
            onChange={(e) => set('plantId', e.target.value)}
            placeholder="cuid dello stabilimento"
          />
        </Field>

        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Stato (default: vuoto), contatori correnti, lotto associato e cicli vengono inizializzati dal sistema. Sono modificabili tramite la pagina di edit per override admin.
        </div>
      </EntityForm>
    </div>
  )
}

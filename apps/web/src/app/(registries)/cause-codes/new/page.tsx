'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader, EntityForm, Field, Input, Select } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import { useState } from 'react'

const CATEGORY_OPTIONS = [
  { value: 'defect', label: 'Difetto' },
  { value: 'downtime', label: 'Fermo macchina' },
  { value: 'scrap', label: 'Scarto' },
  { value: 'rework', label: 'Rilavorazione' },
]

export default function NewCauseCodePage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    code: '',
    name: '',
    category: 'defect',
    phase: '',
    description: '',
    plantId: '',
  })

  const mutation = useMutation({
    mutationFn: () =>
      sdk.causeCodes.create({
        code: form.code,
        name: form.name,
        category: form.category,
        phase: form.phase || undefined,
        description: form.description || undefined,
        plantId: form.plantId,
      } as unknown as Record<string, unknown>),
    onSuccess: (cc) => {
      void qc.invalidateQueries({ queryKey: ['cause-codes'] })
      router.push(`/cause-codes/${cc.id}`)
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
      <PageHeader title="Nuovo codice causa" subtitle="Categoria difetto, fermo macchina, scarto o rilavorazione" />

      <EntityForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={mutation.isPending}
        isDirty={form.code.length > 0 || form.name.length > 0}
      >
        <Field label="Codice" required error={errors['code']}>
          <Input
            value={form.code}
            onChange={(e) => set('code', e.target.value.toUpperCase())}
            placeholder="es. CC-LEAK-FAIL"
          />
        </Field>

        <Field label="Nome" required error={errors['name']}>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="es. Fallita prova di tenuta"
          />
        </Field>

        <Field label="Categoria" required error={errors['category']}>
          <Select
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            options={CATEGORY_OPTIONS}
          />
        </Field>

        <Field label="Fase" error={errors['phase']}>
          <Input
            value={form.phase}
            onChange={(e) => set('phase', e.target.value)}
            placeholder="es. test (lasciare vuoto se applicabile a tutte)"
          />
        </Field>

        <Field label="Plant ID" required error={errors['plantId']}>
          <Input
            value={form.plantId}
            onChange={(e) => set('plantId', e.target.value)}
            placeholder="cuid dello stabilimento"
          />
        </Field>

        <Field label="Descrizione" error={errors['description']}>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Spiegazione dettagliata del codice causa"
          />
        </Field>
      </EntityForm>
    </div>
  )
}

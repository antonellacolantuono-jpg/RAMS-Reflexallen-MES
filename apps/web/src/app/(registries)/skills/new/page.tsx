'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader, EntityForm, Field, Input } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import { useState } from 'react'

export default function NewSkillPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    code: '',
    name: '',
    category: '',
    description: '',
    plantId: '',
  })

  const mutation = useMutation({
    mutationFn: () =>
      sdk.skills.create({
        code: form.code,
        name: form.name,
        category: form.category,
        description: form.description || undefined,
        plantId: form.plantId,
      } as unknown as Record<string, unknown>),
    onSuccess: (skill) => {
      void qc.invalidateQueries({ queryKey: ['skills'] })
      router.push(`/skills/${skill.id}`)
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
      <PageHeader title="Nuova competenza" subtitle="Crea una skill o certificazione operatore" />

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
            placeholder="es. SKL-LEAK-OP1"
          />
        </Field>

        <Field label="Nome" required error={errors['name']}>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="es. Operatore prova di tenuta"
          />
        </Field>

        <Field label="Categoria" required error={errors['category']}>
          <Input
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            placeholder="es. test, assembly, quality"
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
            placeholder="Requisiti / contenuto della certificazione"
          />
        </Field>
      </EntityForm>
    </div>
  )
}

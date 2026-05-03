'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader, EntityForm, Field, Input } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import { useState } from 'react'

export default function NewRecipePage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    code: '',
    name: '',
    deviceId: '',
    itemId: '',
    plantId: '',
  })

  const mutation = useMutation({
    mutationFn: () =>
      sdk.recipes.create({
        code: form.code,
        name: form.name,
        deviceId: form.deviceId || undefined,
        itemId: form.itemId || undefined,
        plantId: form.plantId,
      }),
    onSuccess: (recipe) => {
      void qc.invalidateQueries({ queryKey: ['recipes'] })
      router.push(`/recipes/${recipe.id}`)
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
      <PageHeader title="Nuova ricetta" subtitle="Parametri di processo per un dispositivo" />

      <EntityForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={mutation.isPending}
        isDirty={form.code.length > 0 || form.name.length > 0}
      >
        <Field label="Codice ricetta" required error={errors['code']}>
          <Input
            value={form.code}
            onChange={(e) => set('code', e.target.value.toUpperCase())}
            placeholder="es. RCP-LEAK-001"
          />
        </Field>

        <Field label="Nome" required error={errors['name']}>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Nome descrittivo"
          />
        </Field>

        <Field label="Plant ID" required error={errors['plantId']}>
          <Input
            value={form.plantId}
            onChange={(e) => set('plantId', e.target.value)}
            placeholder="cuid dello stabilimento"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Dispositivo ID" error={errors['deviceId']}>
            <Input
              value={form.deviceId}
              onChange={(e) => set('deviceId', e.target.value)}
              placeholder="cuid (opzionale)"
            />
          </Field>
          <Field label="Articolo ID" error={errors['itemId']}>
            <Input
              value={form.itemId}
              onChange={(e) => set('itemId', e.target.value)}
              placeholder="cuid (opzionale)"
            />
          </Field>
        </div>
      </EntityForm>
    </div>
  )
}

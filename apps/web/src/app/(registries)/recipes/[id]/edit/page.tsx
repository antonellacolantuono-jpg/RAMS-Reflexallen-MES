'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { PageHeader, EntityForm, Field, Input, Select, Skeleton } from '@mes/ui'
import { sdk } from '../../../../../lib/sdk'
import { useState, useEffect } from 'react'

const RECIPE_STATUS_OPTIONS = [
  { value: 'draft', label: 'Bozza' },
  { value: 'approved', label: 'Approvata' },
  { value: 'deprecated', label: 'Deprecata' },
]

export default function EditRecipePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = params
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ name: '', deviceId: '', itemId: '', status: '' })
  const [isDirty, setIsDirty] = useState(false)

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['recipes', id],
    queryFn: () => sdk.recipes.get(id),
  })

  useEffect(() => {
    if (recipe) {
      setForm({
        name: recipe.name,
        deviceId: recipe.deviceId ?? '',
        itemId: recipe.itemId ?? '',
        status: recipe.status,
      })
    }
  }, [recipe])

  const mutation = useMutation({
    mutationFn: () =>
      sdk.recipes.update(id, {
        name: form.name,
        deviceId: form.deviceId || undefined,
        itemId: form.itemId || undefined,
        status: form.status,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['recipes', id] })
      void qc.invalidateQueries({ queryKey: ['recipes'] })
      router.push(`/recipes/${id}`)
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
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <PageHeader title={`Modifica: ${recipe?.code ?? ''}`} subtitle={recipe?.name} />

      <EntityForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={mutation.isPending}
        isDirty={isDirty}
      >
        <Field label="Nome" required error={errors['name']}>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
        </Field>

        <Field label="Stato" required error={errors['status']}>
          <Select
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
            options={RECIPE_STATUS_OPTIONS}
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

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { PageHeader, EntityForm, Field, Input, Select, Skeleton } from '@mes/ui'
import { sdk } from '../../../../../lib/sdk'
import { useState, useEffect } from 'react'

const CATEGORY_OPTIONS = [
  { value: 'defect', label: 'Difetto' },
  { value: 'downtime', label: 'Fermo macchina' },
  { value: 'scrap', label: 'Scarto' },
  { value: 'rework', label: 'Rilavorazione' },
]

export default function EditCauseCodePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = params
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ name: '', category: '', phase: '', description: '' })
  const [isDirty, setIsDirty] = useState(false)

  const { data: cc, isLoading } = useQuery({
    queryKey: ['cause-codes', id],
    queryFn: () => sdk.causeCodes.get(id),
  })

  useEffect(() => {
    if (cc) {
      setForm({
        name: cc.name,
        category: cc.category,
        phase: cc.phase ?? '',
        description: cc.description ?? '',
      })
    }
  }, [cc])

  const mutation = useMutation({
    mutationFn: () =>
      sdk.causeCodes.update(id, {
        name: form.name,
        category: form.category,
        phase: form.phase || undefined,
        description: form.description || undefined,
      } as unknown as Record<string, unknown>),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cause-codes', id] })
      void qc.invalidateQueries({ queryKey: ['cause-codes'] })
      router.push(`/cause-codes/${id}`)
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

  return (
    <div className="p-6 max-w-2xl">
      <PageHeader title={`Modifica: ${cc?.code ?? ''}`} subtitle={cc?.name} />

      <EntityForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={mutation.isPending}
        isDirty={isDirty}
      >
        <Field label="Nome" required error={errors['name']}>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
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

        <Field label="Descrizione" error={errors['description']}>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </Field>
      </EntityForm>
    </div>
  )
}

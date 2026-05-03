'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { PageHeader, EntityForm, Field, Input, Skeleton } from '@mes/ui'
import { sdk } from '../../../../../lib/sdk'
import { useState, useEffect } from 'react'

export default function EditSkillPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = params
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ name: '', category: '', description: '' })
  const [isDirty, setIsDirty] = useState(false)

  const { data: skill, isLoading } = useQuery({
    queryKey: ['skills', id],
    queryFn: () => sdk.skills.get(id),
  })

  useEffect(() => {
    if (skill) {
      setForm({
        name: skill.name,
        category: skill.category,
        description: skill.description ?? '',
      })
    }
  }, [skill])

  const mutation = useMutation({
    mutationFn: () =>
      sdk.skills.update(id, {
        name: form.name,
        category: form.category,
        description: form.description || undefined,
      } as unknown as Record<string, unknown>),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['skills', id] })
      void qc.invalidateQueries({ queryKey: ['skills'] })
      router.push(`/skills/${id}`)
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
      <PageHeader title={`Modifica: ${skill?.code ?? ''}`} subtitle={skill?.name} />

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
          <Input value={form.category} onChange={(e) => set('category', e.target.value)} />
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

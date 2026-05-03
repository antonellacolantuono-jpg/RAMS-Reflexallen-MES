'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { PageHeader, EntityForm, Field, Select, Skeleton } from '@mes/ui'
import { sdk } from '../../../../../lib/sdk'
import { useState, useEffect } from 'react'

const BOM_STATUS_OPTIONS = [
  { value: 'draft', label: 'Bozza' },
  { value: 'approved', label: 'Approvata' },
  { value: 'deprecated', label: 'Deprecata' },
]

export default function EditBomPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = params
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ status: '', notes: '' })
  const [isDirty, setIsDirty] = useState(false)

  const { data: bom, isLoading } = useQuery({
    queryKey: ['bom', id],
    queryFn: () => sdk.bom.get(id),
  })

  useEffect(() => {
    if (bom) {
      setForm({
        status: bom.status,
        notes: bom.notes ?? '',
      })
    }
  }, [bom])

  const mutation = useMutation({
    mutationFn: () =>
      sdk.bom.update(id, {
        status: form.status,
        notes: form.notes || undefined,
      } as unknown as Record<string, unknown>),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['bom', id] })
      void qc.invalidateQueries({ queryKey: ['bom'] })
      router.push(`/bom/${id}`)
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
      <PageHeader
        title={bom ? `Modifica BOM v${bom.version}` : 'Modifica distinta base'}
        subtitle={bom ? `Articolo ${bom.itemId}` : undefined}
      />

      <EntityForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={mutation.isPending}
        isDirty={isDirty}
      >
        <Field label="Stato" required error={errors['status']}>
          <Select
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
            options={BOM_STATUS_OPTIONS}
          />
        </Field>

        <Field label="Note" error={errors['notes']}>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </Field>

        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          La modifica delle linee BOM (componenti) sarà disponibile in un batch successivo (TODO-049).
        </div>
      </EntityForm>
    </div>
  )
}

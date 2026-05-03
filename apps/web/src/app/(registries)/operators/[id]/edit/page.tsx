'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { PageHeader, EntityForm, Field, Input, Select, Skeleton } from '@mes/ui'
import { sdk } from '../../../../../lib/sdk'
import { useState, useEffect } from 'react'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Attivo' },
  { value: 'inactive', label: 'Inattivo' },
  { value: 'suspended', label: 'Sospeso' },
]

export default function EditOperatorPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = params
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ firstName: '', lastName: '', status: '', pin: '' })
  const [isDirty, setIsDirty] = useState(false)

  const { data: op, isLoading } = useQuery({
    queryKey: ['operators', id],
    queryFn: () => sdk.operators.get(id),
  })

  useEffect(() => {
    if (op) {
      setForm({
        firstName: op.firstName,
        lastName: op.lastName,
        status: op.status,
        pin: '',
      })
    }
  }, [op])

  const mutation = useMutation({
    mutationFn: () =>
      sdk.operators.update(id, {
        firstName: form.firstName,
        lastName: form.lastName,
        status: form.status,
        ...(form.pin ? { pin: form.pin } : {}),
      } as unknown as Record<string, unknown>),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['operators', id] })
      void qc.invalidateQueries({ queryKey: ['operators'] })
      router.push(`/operators/${id}`)
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
      <PageHeader title={`Modifica: ${op?.badge ?? ''}`} subtitle={op ? `${op.firstName} ${op.lastName}` : undefined} />

      <EntityForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={mutation.isPending}
        isDirty={isDirty}
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome" required error={errors['firstName']}>
            <Input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
          </Field>
          <Field label="Cognome" required error={errors['lastName']}>
            <Input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
          </Field>
        </div>

        <Field label="Stato" required error={errors['status']}>
          <Select value={form.status} onChange={(e) => set('status', e.target.value)} options={STATUS_OPTIONS} />
        </Field>

        <Field label="Nuovo PIN (4-6 cifre)" error={errors['pin']}>
          <Input
            type="password"
            value={form.pin}
            onChange={(e) => set('pin', e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Lasciare vuoto per mantenere il PIN attuale"
            inputMode="numeric"
            autoComplete="new-password"
          />
        </Field>

        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700">
          Il badge non è modificabile. Per cambiare badge eliminare l&apos;operatore e crearne uno nuovo.
        </div>
      </EntityForm>
    </div>
  )
}

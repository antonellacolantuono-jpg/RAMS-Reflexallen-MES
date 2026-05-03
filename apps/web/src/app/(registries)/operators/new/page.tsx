'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader, EntityForm, Field, Input, Select } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import { useState } from 'react'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Attivo' },
  { value: 'inactive', label: 'Inattivo' },
  { value: 'suspended', label: 'Sospeso' },
]

export default function NewOperatorPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    badge: '',
    firstName: '',
    lastName: '',
    status: 'active',
    pin: '',
    plantId: '',
  })

  const mutation = useMutation({
    mutationFn: () =>
      sdk.operators.create({
        badge: form.badge,
        firstName: form.firstName,
        lastName: form.lastName,
        status: form.status,
        pin: form.pin || undefined,
        plantId: form.plantId,
      } as unknown as Record<string, unknown>),
    onSuccess: (op) => {
      void qc.invalidateQueries({ queryKey: ['operators'] })
      router.push(`/operators/${op.id}`)
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
      <PageHeader title="Nuovo operatore" subtitle="Crea un operatore con badge e PIN per accesso HMI" />

      <EntityForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={mutation.isPending}
        isDirty={form.badge.length > 0 || form.firstName.length > 0 || form.lastName.length > 0}
      >
        <Field label="Badge" required error={errors['badge']}>
          <Input
            value={form.badge}
            onChange={(e) => set('badge', e.target.value)}
            placeholder="es. 1234 o OP-0142"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome" required error={errors['firstName']}>
            <Input
              value={form.firstName}
              onChange={(e) => set('firstName', e.target.value)}
              placeholder="es. Mario"
            />
          </Field>
          <Field label="Cognome" required error={errors['lastName']}>
            <Input
              value={form.lastName}
              onChange={(e) => set('lastName', e.target.value)}
              placeholder="es. Rossi"
            />
          </Field>
        </div>

        <Field label="Stato" required error={errors['status']}>
          <Select
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
            options={STATUS_OPTIONS}
          />
        </Field>

        <Field label="PIN (4-6 cifre)" error={errors['pin']}>
          <Input
            type="password"
            value={form.pin}
            onChange={(e) => set('pin', e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Lasciare vuoto se l'accesso HMI verrà configurato in seguito"
            inputMode="numeric"
            autoComplete="new-password"
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
          La gestione delle skill assegnate (certificazioni, livelli, scadenze) sarà disponibile in un batch successivo (TODO-054).
        </div>
      </EntityForm>
    </div>
  )
}

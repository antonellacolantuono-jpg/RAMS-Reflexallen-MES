'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader, EntityForm, Field, Input, Select } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import { useState } from 'react'

const SEVERITY_OPTIONS = [
  { value: 'info', label: 'Informativo' },
  { value: 'warning', label: 'Avviso' },
  { value: 'critical', label: 'Critico' },
]

export default function NewAttentionPointPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    entityType: '',
    entityId: '',
    severity: 'warning',
    message: '',
    plantId: '',
  })

  const mutation = useMutation({
    mutationFn: () =>
      sdk.attentionPoints.create({
        entityType: form.entityType,
        entityId: form.entityId,
        severity: form.severity,
        message: form.message,
        plantId: form.plantId,
      } as unknown as Record<string, unknown>),
    onSuccess: (ap) => {
      void qc.invalidateQueries({ queryKey: ['attention-points'] })
      router.push(`/attention-points/${ap.id}`)
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
      <PageHeader
        title="Nuovo punto di attenzione"
        subtitle="Apri un avviso di sicurezza, qualità o normativo collegato a un'entità del sistema."
      />

      <EntityForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={mutation.isPending}
        isDirty={form.message.length > 0 || form.entityType.length > 0}
      >
        <Field label="Tipo entità" required error={errors['entityType']}>
          <Input
            value={form.entityType}
            onChange={(e) => set('entityType', e.target.value)}
            placeholder="es. WorkOrder, Lot, Equipment, Tool"
          />
        </Field>

        <Field label="ID entità" required error={errors['entityId']}>
          <Input
            value={form.entityId}
            onChange={(e) => set('entityId', e.target.value)}
            placeholder="cuid dell'entità di riferimento"
          />
        </Field>

        <Field label="Gravità" required error={errors['severity']}>
          <Select
            value={form.severity}
            onChange={(e) => set('severity', e.target.value)}
            options={SEVERITY_OPTIONS}
          />
        </Field>

        <Field label="Messaggio" required error={errors['message']}>
          <textarea
            value={form.message}
            onChange={(e) => set('message', e.target.value)}
            rows={4}
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Descrivi chiaramente il problema o l'avviso da segnalare"
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
          Il punto di attenzione viene creato in stato aperto. Potrà essere chiuso in seguito tramite la pagina di risoluzione.
        </div>
      </EntityForm>
    </div>
  )
}

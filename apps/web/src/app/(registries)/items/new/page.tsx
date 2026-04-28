'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader, EntityForm, Field, Input, Select } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import { useState } from 'react'

const ITEM_TYPE_OPTIONS = [
  { value: 'finished_good', label: 'Prodotto Finito' },
  { value: 'semi_finished', label: 'Semilavorato' },
  { value: 'raw_material', label: 'Materia Prima' },
  { value: 'component', label: 'Componente' },
  { value: 'consumable', label: 'Consumabile' },
]

const TRACKING_OPTIONS = [
  { value: 'lot', label: 'Lotto' },
  { value: 'serial', label: 'Seriale' },
  { value: 'none', label: 'Nessuno' },
]

const UOM_OPTIONS = [
  { value: 'pc', label: 'pz' },
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'm', label: 'm' },
  { value: 'mm', label: 'mm' },
  { value: 'l', label: 'l' },
  { value: 'ml', label: 'ml' },
]

export default function NewItemPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    code: '',
    name: '',
    itemType: 'component',
    trackingMode: 'lot',
    uom: 'pc',
    description: '',
    plantId: '',
  })

  const mutation = useMutation({
    mutationFn: () =>
      sdk.items.create({
        code: form.code,
        name: form.name,
        itemType: form.itemType,
        trackingMode: form.trackingMode,
        uom: form.uom,
        description: form.description || undefined,
        plantId: form.plantId,
      }),
    onSuccess: (item) => {
      void qc.invalidateQueries({ queryKey: ['items'] })
      router.push(`/items/${item.id}`)
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
      <PageHeader title="Nuovo articolo" subtitle="Crea un nuovo articolo nell'anagrafica" />

      <EntityForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={mutation.isPending}
        isDirty={form.code.length > 0 || form.name.length > 0}
      >
        <Field label="Codice articolo" required error={errors['code']}>
          <Input
            value={form.code}
            onChange={(e) => set('code', e.target.value.toUpperCase())}
            placeholder="es. COMP-001"
          />
        </Field>

        <Field label="Nome" required error={errors['name']}>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Nome descrittivo"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Tipo articolo" required error={errors['itemType']}>
            <Select
              value={form.itemType}
              onChange={(e) => set('itemType', e.target.value)}
              options={ITEM_TYPE_OPTIONS}
            />
          </Field>

          <Field label="Unità di misura" required error={errors['uom']}>
            <Select
              value={form.uom}
              onChange={(e) => set('uom', e.target.value)}
              options={UOM_OPTIONS}
            />
          </Field>
        </div>

        <Field label="Modalità tracking" error={errors['trackingMode']}>
          <Select
            value={form.trackingMode}
            onChange={(e) => set('trackingMode', e.target.value)}
            options={TRACKING_OPTIONS}
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
            placeholder="Descrizione opzionale"
          />
        </Field>
      </EntityForm>
    </div>
  )
}

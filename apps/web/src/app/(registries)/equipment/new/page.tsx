'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader, EntityForm, Field, Input, Select } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import { useState } from 'react'

const LEVEL_OPTIONS = [
  { value: 'enterprise', label: 'Impresa' },
  { value: 'site', label: 'Sito' },
  { value: 'area', label: 'Area' },
  { value: 'work_center', label: 'Centro di lavoro' },
  { value: 'work_unit', label: 'Unità di lavoro' },
  { value: 'equipment_module', label: 'Modulo equipaggiamento' },
]

const CLASS_OPTIONS = [
  { value: 'production', label: 'Produzione' },
  { value: 'storage', label: 'Stoccaggio' },
  { value: 'transport', label: 'Trasporto' },
  { value: 'test', label: 'Test' },
  { value: 'maintenance', label: 'Manutenzione' },
  { value: 'administrative', label: 'Amministrativo' },
]

const STATUS_OPTIONS = [
  { value: 'available', label: 'Disponibile' },
  { value: 'reserved', label: 'Riservato' },
  { value: 'in_use', label: 'In uso' },
  { value: 'cleaning', label: 'In pulizia' },
  { value: 'maintenance', label: 'In manutenzione' },
  { value: 'broken', label: 'Guasto' },
  { value: 'offline', label: 'Offline' },
  { value: 'decommissioned', label: 'Dismesso' },
]

export default function NewEquipmentPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    code: '',
    name: '',
    level: 'work_center',
    class: 'production',
    status: 'available',
    parentId: '',
    plantId: '',
    description: '',
  })

  const mutation = useMutation({
    mutationFn: () =>
      sdk.equipment.create({
        code: form.code,
        name: form.name,
        level: form.level,
        class: form.class,
        status: form.status,
        parentId: form.parentId || undefined,
        plantId: form.plantId,
        description: form.description || undefined,
      } as unknown as Record<string, unknown>),
    onSuccess: (eq) => {
      void qc.invalidateQueries({ queryKey: ['equipment'] })
      router.push(`/equipment/${eq.id}`)
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
      <PageHeader title="Nuovo equipaggiamento" subtitle="Crea un nodo nella gerarchia ISA-95" />

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
            placeholder="es. WC-EXTRUDER-01"
          />
        </Field>

        <Field label="Nome" required error={errors['name']}>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Nome descrittivo"
          />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Livello ISA-95" required error={errors['level']}>
            <Select value={form.level} onChange={(e) => set('level', e.target.value)} options={LEVEL_OPTIONS} />
          </Field>
          <Field label="Classe" required error={errors['class']}>
            <Select value={form.class} onChange={(e) => set('class', e.target.value)} options={CLASS_OPTIONS} />
          </Field>
          <Field label="Stato" required error={errors['status']}>
            <Select value={form.status} onChange={(e) => set('status', e.target.value)} options={STATUS_OPTIONS} />
          </Field>
        </div>

        <Field label="Parent ID" error={errors['parentId']}>
          <Input
            value={form.parentId}
            onChange={(e) => set('parentId', e.target.value)}
            placeholder="cuid del nodo padre (lasciare vuoto per nodo radice)"
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

        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          La visualizzazione ad albero della gerarchia ISA-95 sarà disponibile in un batch successivo (TODO-052).
        </div>
      </EntityForm>
    </div>
  )
}

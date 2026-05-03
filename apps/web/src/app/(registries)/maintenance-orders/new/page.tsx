'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader, EntityForm, Field, Input } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import { useState } from 'react'

const TYPE_OPTIONS = [
  { value: 'preventive', label: 'Preventiva' },
  { value: 'corrective', label: 'Correttiva' },
  { value: 'calibration', label: 'Calibrazione' },
  { value: 'inspection', label: 'Ispezione' },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Bassa' },
  { value: 'normal', label: 'Normale' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

export default function NewMaintenanceOrderPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: equipmentList } = useQuery({
    queryKey: ['equipment', 'all-for-mnt'],
    queryFn: () => sdk.equipment.list({ limit: '500' } as never),
  })

  const [form, setForm] = useState({
    equipmentNodeId: '',
    type: 'preventive',
    priority: 'normal',
    description: '',
    plannedStart: '',
    plannedEnd: '',
    assignedToId: '',
    plantId: '',
  })

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        equipmentNodeId: form.equipmentNodeId,
        type: form.type,
        priority: form.priority,
        description: form.description,
        plannedStart: new Date(form.plannedStart).toISOString(),
        plannedEnd: new Date(form.plannedEnd).toISOString(),
        plantId: form.plantId,
      }
      if (form.assignedToId.trim()) payload['assignedToId'] = form.assignedToId.trim()
      return sdk.maintenanceOrders.create(payload)
    },
    onSuccess: (mnt) => {
      void qc.invalidateQueries({ queryKey: ['maintenance-orders'] })
      router.push(`/maintenance-orders/${mnt.id}`)
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

  const isDirty = Object.values(form).some((v) => v.length > 0)

  return (
    <div className="p-6 max-w-2xl">
      <PageHeader title="Nuovo ordine di manutenzione" subtitle="Pianifica un intervento preventivo, correttivo, di calibrazione o ispezione" />

      <EntityForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={mutation.isPending}
        isDirty={isDirty}
      >
        <Field label="Impianto" required error={errors['equipmentNodeId']}>
          <select
            value={form.equipmentNodeId}
            onChange={(e) => set('equipmentNodeId', e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
            data-testid="mnt-equipment-select"
          >
            <option value="">— Seleziona —</option>
            {(equipmentList?.data ?? []).map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.code} · {eq.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tipo" required error={errors['type']}>
          <select
            value={form.type}
            onChange={(e) => set('type', e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Priorità" error={errors['priority']}>
          <select
            value={form.priority}
            onChange={(e) => set('priority', e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          >
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Descrizione" required error={errors['description']}>
          <Input
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Es: Pulizia testa estrusione + lubrificazione"
          />
        </Field>

        <Field label="Inizio pianificato" required error={errors['plannedStart']}>
          <Input
            type="datetime-local"
            value={form.plannedStart}
            onChange={(e) => set('plannedStart', e.target.value)}
          />
        </Field>

        <Field label="Fine pianificata" required error={errors['plannedEnd']}>
          <Input
            type="datetime-local"
            value={form.plannedEnd}
            onChange={(e) => set('plannedEnd', e.target.value)}
          />
        </Field>

        <Field label="Assegnato a (opzionale)" error={errors['assignedToId']}>
          <Input
            value={form.assignedToId}
            onChange={(e) => set('assignedToId', e.target.value)}
            placeholder="ID operatore (lasciare vuoto per non assegnare)"
          />
        </Field>

        <Field label="Plant ID" required error={errors['plantId']}>
          <Input
            value={form.plantId}
            onChange={(e) => set('plantId', e.target.value)}
            placeholder="cuid dello stabilimento"
          />
        </Field>

        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
          Il codice MNT-AAAA-NNNN viene generato automaticamente alla creazione.
          Le azioni Avvia / Completa / Annulla saranno disponibili in una iterazione successiva (TODO-062).
        </div>
      </EntityForm>
    </div>
  )
}

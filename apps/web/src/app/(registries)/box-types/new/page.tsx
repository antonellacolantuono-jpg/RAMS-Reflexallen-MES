'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader, EntityForm, Field, Input } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import { useState } from 'react'

export default function NewBoxTypePage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    code: '',
    name: '',
    maxWeightG: '',
    maxVolumeL: '',
    maxUnitsCount: '',
    isReturnable: false,
    description: '',
    plantId: '',
  })

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        code: form.code,
        name: form.name,
        isReturnable: form.isReturnable,
        plantId: form.plantId,
      }
      if (form.maxWeightG) payload['maxWeightG'] = parseFloat(form.maxWeightG)
      if (form.maxVolumeL) payload['maxVolumeL'] = parseFloat(form.maxVolumeL)
      if (form.maxUnitsCount) payload['maxUnitsCount'] = parseInt(form.maxUnitsCount, 10)
      if (form.description) payload['description'] = form.description
      return sdk.boxTypes.create(payload)
    },
    onSuccess: (bt) => {
      void qc.invalidateQueries({ queryKey: ['box-types'] })
      router.push(`/box-types/${bt.id}`)
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

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key as string]: '' }))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="p-6 max-w-2xl">
      <PageHeader title="Nuovo tipo collo" subtitle="Configurazione pallet, cartoni, fusti" />

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
            placeholder="es. BTYPE-CBX-014"
          />
        </Field>

        <Field label="Nome" required error={errors['name']}>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="es. Cartone 60×40×30"
          />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Capacità (pezzi)" error={errors['maxUnitsCount']}>
            <Input
              type="number"
              value={form.maxUnitsCount}
              onChange={(e) => set('maxUnitsCount', e.target.value)}
              placeholder="vuoto = illimitato"
            />
          </Field>
          <Field label="Peso max (g)" error={errors['maxWeightG']}>
            <Input
              type="number"
              value={form.maxWeightG}
              onChange={(e) => set('maxWeightG', e.target.value)}
              placeholder="vuoto = illimitato"
            />
          </Field>
          <Field label="Volume max (L)" error={errors['maxVolumeL']}>
            <Input
              type="number"
              value={form.maxVolumeL}
              onChange={(e) => set('maxVolumeL', e.target.value)}
              placeholder="vuoto = illimitato"
            />
          </Field>
        </div>

        <Field label="Reso (returnable)" error={errors['isReturnable']}>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={form.isReturnable}
              onChange={(e) => set('isReturnable', e.target.checked)}
              className="rounded border-neutral-300"
            />
            Il collo è restituibile (multi-ciclo)
          </label>
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

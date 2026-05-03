'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader, EntityForm, Field, Input } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import { useState } from 'react'

export default function NewToolPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    code: '',
    name: '',
    equipmentNodeId: '',
    maxCycles: '',
    plantId: '',
  })

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        code: form.code,
        name: form.name,
        plantId: form.plantId,
      }
      if (form.equipmentNodeId) payload['equipmentNodeId'] = form.equipmentNodeId
      if (form.maxCycles) {
        const n = parseInt(form.maxCycles, 10)
        if (Number.isFinite(n) && n > 0) payload['maxCycles'] = n
      }
      return sdk.tools.create(payload)
    },
    onSuccess: (tool) => {
      void qc.invalidateQueries({ queryKey: ['tools'] })
      router.push(`/tools/${tool.id}`)
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
      <PageHeader title="Nuova attrezzatura" subtitle="Mola, filiera, crimp die o altro utensile soggetto a usura" />

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
            placeholder="es. TOOL-CRIMP-DIE-01"
          />
        </Field>

        <Field label="Nome" required error={errors['name']}>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Nome descrittivo dell'attrezzatura"
          />
        </Field>

        <Field label="Equipaggiamento associato" error={errors['equipmentNodeId']}>
          <Input
            value={form.equipmentNodeId}
            onChange={(e) => set('equipmentNodeId', e.target.value)}
            placeholder="cuid del nodo equipaggiamento (lasciare vuoto se non assegnato)"
          />
        </Field>

        <Field label="Cicli massimi" error={errors['maxCycles']}>
          <Input
            type="number"
            value={form.maxCycles}
            onChange={(e) => set('maxCycles', e.target.value)}
            placeholder="Soglia di sostituzione (lasciare vuoto se non applicabile)"
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
          Stato di usura, conteggio cicli e date di utilizzo/sostituzione vengono aggiornati automaticamente dal sistema (ToolWearHistory) ad ogni ciclo eseguito.
        </div>
      </EntityForm>
    </div>
  )
}

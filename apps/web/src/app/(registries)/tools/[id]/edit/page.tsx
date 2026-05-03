'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { PageHeader, EntityForm, Field, Input, Skeleton } from '@mes/ui'
import { sdk } from '../../../../../lib/sdk'
import { useState, useEffect } from 'react'

export default function EditToolPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = params
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ name: '', equipmentNodeId: '', maxCycles: '' })
  const [isDirty, setIsDirty] = useState(false)

  const { data: tool, isLoading } = useQuery({
    queryKey: ['tools', id],
    queryFn: () => sdk.tools.get(id),
  })

  useEffect(() => {
    if (tool) {
      setForm({
        name: tool.name,
        equipmentNodeId: tool.equipmentNodeId ?? '',
        maxCycles: tool.maxCycles?.toString() ?? '',
      })
    }
  }, [tool])

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = { name: form.name }
      payload['equipmentNodeId'] = form.equipmentNodeId || undefined
      if (form.maxCycles) {
        const n = parseInt(form.maxCycles, 10)
        if (Number.isFinite(n) && n > 0) payload['maxCycles'] = n
      } else {
        payload['maxCycles'] = undefined
      }
      return sdk.tools.update(id, payload)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tools', id] })
      void qc.invalidateQueries({ queryKey: ['tools'] })
      router.push(`/tools/${id}`)
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
      <PageHeader title={`Modifica: ${tool?.code ?? ''}`} subtitle={tool?.name} />

      <EntityForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={mutation.isPending}
        isDirty={isDirty}
      >
        <Field label="Nome" required error={errors['name']}>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
        </Field>

        <Field label="Equipaggiamento associato" error={errors['equipmentNodeId']}>
          <Input
            value={form.equipmentNodeId}
            onChange={(e) => set('equipmentNodeId', e.target.value)}
            placeholder="cuid del nodo equipaggiamento (lasciare vuoto per scollegare)"
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

        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Lo stato di usura, il conteggio cicli, le date di ultimo utilizzo e di sostituzione sono gestiti automaticamente dal sistema e non sono modificabili da questa pagina.
        </div>
      </EntityForm>
    </div>
  )
}

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { PageHeader, EntityForm, Field, Input, Skeleton } from '@mes/ui'
import { sdk } from '../../../../../lib/sdk'
import { useState, useEffect } from 'react'

export default function EditBoxTypePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = params
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    name: '',
    maxWeightG: '',
    maxVolumeL: '',
    maxUnitsCount: '',
    isReturnable: false,
    description: '',
  })
  const [isDirty, setIsDirty] = useState(false)

  const { data: bt, isLoading } = useQuery({
    queryKey: ['box-types', id],
    queryFn: () => sdk.boxTypes.get(id),
  })

  useEffect(() => {
    if (bt) {
      setForm({
        name: bt.name,
        maxWeightG: bt.maxWeightG?.toString() ?? '',
        maxVolumeL: bt.maxVolumeL?.toString() ?? '',
        maxUnitsCount: bt.maxUnitsCount?.toString() ?? '',
        isReturnable: bt.isReturnable,
        description: bt.description ?? '',
      })
    }
  }, [bt])

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        name: form.name,
        isReturnable: form.isReturnable,
        description: form.description || null,
      }
      payload['maxWeightG'] = form.maxWeightG ? parseFloat(form.maxWeightG) : null
      payload['maxVolumeL'] = form.maxVolumeL ? parseFloat(form.maxVolumeL) : null
      payload['maxUnitsCount'] = form.maxUnitsCount ? parseInt(form.maxUnitsCount, 10) : null
      return sdk.boxTypes.update(id, payload)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['box-types', id] })
      void qc.invalidateQueries({ queryKey: ['box-types'] })
      router.push(`/box-types/${id}`)
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
      <PageHeader title={`Modifica: ${bt?.code ?? ''}`} subtitle={bt?.name} />

      <EntityForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={mutation.isPending}
        isDirty={isDirty}
      >
        <Field label="Nome" required error={errors['name']}>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
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
          Il codice non è modificabile dopo la creazione. Per cambiare codice occorre creare un nuovo tipo collo.
        </div>
      </EntityForm>
    </div>
  )
}

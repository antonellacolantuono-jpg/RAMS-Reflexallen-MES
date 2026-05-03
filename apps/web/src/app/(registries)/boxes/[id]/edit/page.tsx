'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { PageHeader, EntityForm, Field, Input, Select, Skeleton } from '@mes/ui'
import { sdk } from '../../../../../lib/sdk'
import { useState, useEffect } from 'react'

const STATUS_OPTIONS = [
  { value: 'empty', label: 'Vuoto' },
  { value: 'filling', label: 'In riempimento' },
  { value: 'full', label: 'Pieno' },
  { value: 'sealed', label: 'Sigillato' },
  { value: 'shipped', label: 'Spedito' },
  { value: 'returned', label: 'Restituito' },
  { value: 'rejected', label: 'Respinto' },
]

export default function EditBoxPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = params
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    status: 'empty',
    currentWeightG: '',
    currentVolumeL: '',
    currentUnitsCount: '',
    lotId: '',
  })
  const [isDirty, setIsDirty] = useState(false)

  const { data: box, isLoading } = useQuery({
    queryKey: ['boxes', id],
    queryFn: () => sdk.boxes.get(id),
  })

  useEffect(() => {
    if (box) {
      setForm({
        status: box.status,
        currentWeightG: box.currentWeightG.toString(),
        currentVolumeL: box.currentVolumeL.toString(),
        currentUnitsCount: box.currentUnitsCount.toString(),
        lotId: box.lotId ?? '',
      })
    }
  }, [box])

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        status: form.status,
        currentWeightG: form.currentWeightG ? parseFloat(form.currentWeightG) : 0,
        currentVolumeL: form.currentVolumeL ? parseFloat(form.currentVolumeL) : 0,
        currentUnitsCount: form.currentUnitsCount ? parseInt(form.currentUnitsCount, 10) : 0,
        lotId: form.lotId || null,
      }
      return sdk.boxes.update(id, payload)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['boxes', id] })
      void qc.invalidateQueries({ queryKey: ['boxes'] })
      router.push(`/boxes/${id}`)
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
      <PageHeader title={`Modifica collo: ${box?.code ?? ''}`} subtitle="Override admin dei campi operativi" />

      <EntityForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={mutation.isPending}
        isDirty={isDirty}
      >
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Normalmente gestito dal flusso pack-out HMI; modifica manuale per override admin.
        </div>

        <Field label="Stato" required error={errors['status']}>
          <Select
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
            options={STATUS_OPTIONS}
          />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Pezzi correnti" error={errors['currentUnitsCount']}>
            <Input
              type="number"
              value={form.currentUnitsCount}
              onChange={(e) => set('currentUnitsCount', e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Peso corrente (g)" error={errors['currentWeightG']}>
            <Input
              type="number"
              value={form.currentWeightG}
              onChange={(e) => set('currentWeightG', e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Volume corrente (L)" error={errors['currentVolumeL']}>
            <Input
              type="number"
              value={form.currentVolumeL}
              onChange={(e) => set('currentVolumeL', e.target.value)}
              placeholder="0"
            />
          </Field>
        </div>

        <Field label="Lotto associato" error={errors['lotId']}>
          <Input
            value={form.lotId}
            onChange={(e) => set('lotId', e.target.value)}
            placeholder="cuid del lotto (lasciare vuoto per scollegare)"
          />
        </Field>

        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600">
          Codice, tipo collo, plant ID, conteggio cicli e date di sigillatura non sono modificabili da questa pagina.
        </div>
      </EntityForm>
    </div>
  )
}

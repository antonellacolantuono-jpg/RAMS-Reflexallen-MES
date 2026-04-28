'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { PageHeader, EntityForm, Field, Input, Select, Skeleton } from '@mes/ui'
import { sdk } from '../../../../../lib/sdk'
import { useState, useEffect } from 'react'

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

export default function EditItemPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = params
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ name: '', itemType: '', trackingMode: '', uom: '', description: '' })
  const [isDirty, setIsDirty] = useState(false)

  const { data: item, isLoading } = useQuery({
    queryKey: ['items', id],
    queryFn: () => sdk.items.get(id),
  })

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name,
        itemType: item.itemType,
        trackingMode: item.trackingMode,
        uom: item.uom,
        description: item.description ?? '',
      })
    }
  }, [item])

  const mutation = useMutation({
    mutationFn: () =>
      sdk.items.update(id, {
        name: form.name,
        itemType: form.itemType,
        trackingMode: form.trackingMode,
        uom: form.uom,
        description: form.description || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['items', id] })
      void qc.invalidateQueries({ queryKey: ['items'] })
      router.push(`/items/${id}`)
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
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <PageHeader
        title={`Modifica: ${item?.code ?? ''}`}
        subtitle={item?.name}
      />

      <EntityForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={mutation.isPending}
        isDirty={isDirty}
      >
        <Field label="Nome" required error={errors['name']}>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Tipo articolo" required error={errors['itemType']}>
            <Select value={form.itemType} onChange={(e) => set('itemType', e.target.value)} options={ITEM_TYPE_OPTIONS} />
          </Field>
          <Field label="Unità di misura" required error={errors['uom']}>
            <Select value={form.uom} onChange={(e) => set('uom', e.target.value)} options={UOM_OPTIONS} />
          </Field>
        </div>

        <Field label="Modalità tracking" error={errors['trackingMode']}>
          <Select value={form.trackingMode} onChange={(e) => set('trackingMode', e.target.value)} options={TRACKING_OPTIONS} />
        </Field>

        <Field label="Descrizione" error={errors['description']}>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </Field>
      </EntityForm>
    </div>
  )
}

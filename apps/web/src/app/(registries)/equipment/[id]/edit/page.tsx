'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { PageHeader, EntityForm, Field, Input, Select, Skeleton } from '@mes/ui'
import { sdk } from '../../../../../lib/sdk'
import { useState, useEffect } from 'react'

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

export default function EditEquipmentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = params
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    name: '',
    level: '',
    class: '',
    status: '',
    parentId: '',
    description: '',
  })
  const [isDirty, setIsDirty] = useState(false)

  const { data: eq, isLoading } = useQuery({
    queryKey: ['equipment', id],
    queryFn: () => sdk.equipment.get(id),
  })

  useEffect(() => {
    if (eq) {
      setForm({
        name: eq.name,
        level: eq.level,
        class: eq.class,
        status: eq.status,
        parentId: eq.parentId ?? '',
        description: eq.description ?? '',
      })
    }
  }, [eq])

  const mutation = useMutation({
    mutationFn: () =>
      sdk.equipment.update(id, {
        name: form.name,
        level: form.level,
        class: form.class,
        status: form.status,
        parentId: form.parentId || undefined,
        description: form.description || undefined,
      } as unknown as Record<string, unknown>),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['equipment', id] })
      void qc.invalidateQueries({ queryKey: ['equipment'] })
      router.push(`/equipment/${id}`)
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
      <PageHeader title={`Modifica: ${eq?.code ?? ''}`} subtitle={eq?.name} />

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

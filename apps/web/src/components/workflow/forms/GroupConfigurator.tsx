'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Field, Input, Select } from '@mes/ui'
import { useWorkflowStore } from '../store'

const GROUP_CATEGORIES = [
  'assembly',
  'device_execution',
  'device_setup',
  'qc',
  'bom_check',
  'skills_check',
  'tooling_check',
  'logistics',
  'packaging',
] as const
const GROUP_CATEGORY_LABELS: Record<(typeof GROUP_CATEGORIES)[number], string> = {
  assembly: 'Assemblaggio',
  device_execution: 'Esecuzione Dispositivo',
  device_setup: 'Setup Dispositivo',
  qc: 'Controllo Qualità',
  bom_check: 'Verifica BOM',
  skills_check: 'Verifica Skill',
  tooling_check: 'Verifica Attrezzatura',
  logistics: 'Logistica',
  packaging: 'Imballaggio',
}

const GroupFormSchema = z.object({
  name: z.string().min(1, 'Nome richiesto').max(200, 'Massimo 200 caratteri'),
  category: z.enum(GROUP_CATEGORIES, {
    errorMap: () => ({ message: 'Categoria gruppo richiesta' }),
  }),
  supportsParallel: z.boolean(),
  supportsRecovery: z.boolean(),
})

type GroupFormValues = z.infer<typeof GroupFormSchema>

function isGroupCategory(v: unknown): v is (typeof GROUP_CATEGORIES)[number] {
  return typeof v === 'string' && (GROUP_CATEGORIES as readonly string[]).includes(v)
}

export function GroupConfigurator({
  nodeId,
  data,
}: {
  nodeId: string
  data: Record<string, unknown>
}) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData)

  const initialCategory = isGroupCategory(data['category'])
    ? (data['category'] as (typeof GROUP_CATEGORIES)[number])
    : 'assembly'

  const defaults: GroupFormValues = {
    name: (data['label'] as string | undefined) ?? '',
    category: initialCategory,
    supportsParallel:
      typeof data['supportsParallel'] === 'boolean'
        ? (data['supportsParallel'] as boolean)
        : false,
    supportsRecovery:
      typeof data['supportsRecovery'] === 'boolean'
        ? (data['supportsRecovery'] as boolean)
        : false,
  }

  const {
    register,
    reset,
    formState: { errors },
  } = useForm<GroupFormValues>({
    resolver: zodResolver(GroupFormSchema),
    defaultValues: defaults,
    mode: 'onBlur',
  })

  useEffect(() => {
    reset(defaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId])

  function commit(partial: Record<string, unknown>) {
    updateNodeData(nodeId, partial)
  }

  return (
    <form className="flex flex-col gap-3 p-3" onSubmit={(e) => e.preventDefault()}>
      <Field label="Nome" required error={errors.name?.message}>
        <Input
          {...register('name', {
            onBlur: (e) => commit({ label: e.target.value }),
          })}
          placeholder="Es. Caricamento granuli"
        />
      </Field>

      <Field label="Categoria" required error={errors.category?.message}>
        <Select
          {...register('category', {
            onChange: (e) => commit({ category: e.target.value }),
          })}
          options={GROUP_CATEGORIES.map((c) => ({
            value: c,
            label: GROUP_CATEGORY_LABELS[c],
          }))}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-ink-2">
        <input
          type="checkbox"
          {...register('supportsParallel', {
            onChange: (e) => commit({ supportsParallel: e.target.checked }),
          })}
          className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
        />
        Supporta esecuzione parallela
      </label>

      <label className="flex items-center gap-2 text-sm text-ink-2">
        <input
          type="checkbox"
          {...register('supportsRecovery', {
            onChange: (e) => commit({ supportsRecovery: e.target.checked }),
          })}
          className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
        />
        Supporta recupero
      </label>
    </form>
  )
}

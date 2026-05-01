'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { Field, Input, Select } from '@mes/ui'
import type { SelectProps } from '@mes/ui'
import { sdk } from '../../../lib/sdk'
import { useWorkflowStore } from '../store'

// deviceCategory feeds the parallel-ops swimlane in HMI (PROMPT_5 D4).
// Persisted in node.data only this session — backend write-through is gated under
// TODO-016 (no Step.config column / WorkflowStepInputSchema does not yet accept it).
const DEVICE_CATEGORIES = ['pre', 'device_main', 'parallel', 'post'] as const
const DEVICE_CATEGORY_LABELS: Record<(typeof DEVICE_CATEGORIES)[number], string> = {
  pre: 'Pre-dispositivo',
  device_main: 'Dispositivo principale',
  parallel: 'Parallelo',
  post: 'Post-dispositivo',
}

const ProductionFormSchema = z.object({
  name: z.string().min(1, 'Nome richiesto').max(200, 'Massimo 200 caratteri'),
  instructions: z.string().max(2000).optional().or(z.literal('')),
  skillId: z.string().optional().or(z.literal('')),
  deviceId: z.string().optional().or(z.literal('')),
  standardTimeSec: z
    .union([z.string().length(0), z.coerce.number().int().positive('Deve essere > 0')])
    .optional(),
  isRequired: z.boolean(),
  deviceCategory: z.enum(DEVICE_CATEGORIES, {
    errorMap: () => ({ message: 'Categoria dispositivo richiesta' }),
  }),
})

type ProductionFormValues = z.infer<typeof ProductionFormSchema>

function isDeviceCategory(v: unknown): v is (typeof DEVICE_CATEGORIES)[number] {
  return typeof v === 'string' && (DEVICE_CATEGORIES as readonly string[]).includes(v)
}

export function ProductionStepForm({
  nodeId,
  data,
}: {
  nodeId: string
  data: Record<string, unknown>
}) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData)

  const defaults: ProductionFormValues = {
    name: (data['label'] as string | undefined) ?? '',
    instructions: (data['instructions'] as string | undefined) ?? '',
    skillId: (data['skillId'] as string | undefined) ?? '',
    deviceId: (data['deviceId'] as string | undefined) ?? '',
    standardTimeSec:
      typeof data['standardTimeSec'] === 'number'
        ? (data['standardTimeSec'] as number)
        : undefined,
    isRequired:
      typeof data['isRequired'] === 'boolean' ? (data['isRequired'] as boolean) : true,
    deviceCategory: isDeviceCategory(data['deviceCategory'])
      ? (data['deviceCategory'] as (typeof DEVICE_CATEGORIES)[number])
      : 'device_main',
  }

  const {
    register,
    control,
    reset,
    formState: { errors },
  } = useForm<ProductionFormValues>({
    resolver: zodResolver(ProductionFormSchema),
    defaultValues: defaults,
    mode: 'onBlur',
  })

  // Reset form when the selected node changes (parent remounts on nodeId via key prop in StepConfigurator
  // would be even simpler, but we keep this for robustness when the same node's underlying data is replaced).
  useEffect(() => {
    reset(defaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId])

  const { data: skillsResp } = useQuery({
    queryKey: ['skills', 'all'],
    queryFn: () => sdk.skills.list({ limit: 200 }),
  })
  const { data: equipmentResp } = useQuery({
    queryKey: ['equipment', 'all'],
    queryFn: () => sdk.equipment.list({ limit: 200 }),
  })

  const skillOptions: SelectProps['options'] = (skillsResp?.data ?? []).map((s) => ({
    value: s.id,
    label: `${s.code} — ${s.name}`,
  }))
  const deviceOptions: SelectProps['options'] = (equipmentResp?.data ?? []).map((d) => ({
    value: d.id,
    label: `${d.code} — ${d.name}`,
  }))

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
          placeholder="Es. Assemblaggio raccordo"
        />
      </Field>

      <Field label="Istruzioni" error={errors.instructions?.message}>
        <textarea
          {...register('instructions', {
            onBlur: (e) => commit({ instructions: e.target.value }),
          })}
          placeholder="Istruzioni operative…"
          rows={4}
          className="w-full rounded-2 border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </Field>

      <Field label="Skill richiesta" error={errors.skillId?.message}>
        <Controller
          name="skillId"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value ?? ''}
              onChange={(e) => {
                field.onChange(e.target.value)
                commit({ skillId: e.target.value || '' })
              }}
              placeholder="— Nessuna —"
              options={skillOptions}
            />
          )}
        />
      </Field>

      <Field label="Dispositivo" error={errors.deviceId?.message}>
        <Controller
          name="deviceId"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value ?? ''}
              onChange={(e) => {
                field.onChange(e.target.value)
                commit({ deviceId: e.target.value || '' })
              }}
              placeholder="— Nessuno —"
              options={deviceOptions}
            />
          )}
        />
      </Field>

      <Field label="Tempo standard (sec)" error={errors.standardTimeSec?.message}>
        <Input
          type="number"
          min={1}
          {...register('standardTimeSec', {
            onBlur: (e) => {
              const v = e.target.value
              commit({ standardTimeSec: v === '' ? null : Number(v) })
            },
          })}
          placeholder="Es. 45"
        />
      </Field>

      <Field
        label="Categoria dispositivo"
        required
        hint="Per Device Execution Group — sessione corrente, vedi TODO-016"
        error={errors.deviceCategory?.message}
      >
        <Select
          {...register('deviceCategory', {
            onChange: (e) => {
              const v = e.target.value as (typeof DEVICE_CATEGORIES)[number]
              commit({ deviceCategory: v })
            },
          })}
          options={DEVICE_CATEGORIES.map((c) => ({
            value: c,
            label: DEVICE_CATEGORY_LABELS[c],
          }))}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-ink-2">
        <input
          type="checkbox"
          {...register('isRequired', {
            onChange: (e) => commit({ isRequired: e.target.checked }),
          })}
          className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
        />
        Step obbligatorio
      </label>
    </form>
  )
}

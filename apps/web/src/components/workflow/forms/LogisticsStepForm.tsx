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

// Form-internal logistics type. Persists to node.data.logisticsType.
// All five collapse onto StepActionType.MOVE for actionType (see TODO-016).
const LOGISTICS_TYPES = ['pick', 'place', 'transfer', 'receive', 'ship'] as const
const LOGISTICS_LABELS: Record<(typeof LOGISTICS_TYPES)[number], string> = {
  pick: 'Prelievo',
  place: 'Posizionamento',
  transfer: 'Trasferimento',
  receive: 'Ricezione',
  ship: 'Spedizione',
}

const LogisticsFormSchema = z.object({
  name: z.string().min(1, 'Nome richiesto').max(200, 'Massimo 200 caratteri'),
  instructions: z.string().max(2000).optional().or(z.literal('')),
  logisticsType: z.enum(LOGISTICS_TYPES, {
    errorMap: () => ({ message: 'Tipo logistica richiesto' }),
  }),
  boxTypeId: z.string().optional().or(z.literal('')),
  targetLocation: z.string().max(200).optional().or(z.literal('')),
})

type LogisticsFormValues = z.infer<typeof LogisticsFormSchema>

function isLogisticsType(v: unknown): v is (typeof LOGISTICS_TYPES)[number] {
  return typeof v === 'string' && (LOGISTICS_TYPES as readonly string[]).includes(v)
}

export function LogisticsStepForm({
  nodeId,
  data,
}: {
  nodeId: string
  data: Record<string, unknown>
}) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData)

  const initialLogisticsType = isLogisticsType(data['logisticsType'])
    ? (data['logisticsType'] as (typeof LOGISTICS_TYPES)[number])
    : 'pick'

  const defaults: LogisticsFormValues = {
    name: (data['label'] as string | undefined) ?? '',
    instructions: (data['instructions'] as string | undefined) ?? '',
    logisticsType: initialLogisticsType,
    boxTypeId: (data['boxTypeId'] as string | undefined) ?? '',
    targetLocation: (data['targetLocation'] as string | undefined) ?? '',
  }

  const {
    register,
    control,
    reset,
    formState: { errors },
  } = useForm<LogisticsFormValues>({
    resolver: zodResolver(LogisticsFormSchema),
    defaultValues: defaults,
    mode: 'onBlur',
  })

  useEffect(() => {
    reset(defaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId])

  const { data: boxTypesResp } = useQuery({
    queryKey: ['box-types', 'all'],
    queryFn: () => sdk.boxTypes.list({ limit: 200 }),
  })

  const boxTypeOptions: SelectProps['options'] = (boxTypesResp?.data ?? []).map((b) => ({
    value: b.id,
    label: `${b.code} — ${b.name}`,
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
          placeholder="Es. Prelievo materiale"
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

      <Field
        label="Tipo logistica"
        required
        hint="Sessione corrente — actionType collassato a 'move' (vedi TODO-016)"
        error={errors.logisticsType?.message}
      >
        <Select
          {...register('logisticsType', {
            onChange: (e) => commit({ logisticsType: e.target.value, actionType: 'move' }),
          })}
          options={LOGISTICS_TYPES.map((t) => ({ value: t, label: LOGISTICS_LABELS[t] }))}
        />
      </Field>

      <Field
        label="Tipo contenitore"
        hint="Sessione corrente — non persistito (vedi TODO-016)"
        error={errors.boxTypeId?.message}
      >
        <Controller
          name="boxTypeId"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value ?? ''}
              onChange={(e) => {
                field.onChange(e.target.value)
                commit({ boxTypeId: e.target.value || '' })
              }}
              placeholder="— Nessuno —"
              options={boxTypeOptions}
            />
          )}
        />
      </Field>

      <Field
        label="Destinazione"
        hint="Sessione corrente — non persistito (vedi TODO-016)"
        error={errors.targetLocation?.message}
      >
        <Input
          {...register('targetLocation', {
            onBlur: (e) => commit({ targetLocation: e.target.value }),
          })}
          placeholder="Es. WIP-A12"
        />
      </Field>
    </form>
  )
}

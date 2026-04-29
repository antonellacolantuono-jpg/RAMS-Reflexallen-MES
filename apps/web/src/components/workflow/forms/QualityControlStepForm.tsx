'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Field, Input, Select } from '@mes/ui'
import { useWorkflowStore } from '../store'

const QC_ACTION_TYPES = ['visual_check', 'dimensional_check', 'functional_test'] as const
const QC_ACTION_LABELS: Record<(typeof QC_ACTION_TYPES)[number], string> = {
  visual_check: 'Controllo visivo',
  dimensional_check: 'Controllo dimensionale',
  functional_test: 'Test funzionale',
}

const QualityControlFormSchema = z.object({
  name: z.string().min(1, 'Nome richiesto').max(200, 'Massimo 200 caratteri'),
  instructions: z.string().max(2000).optional().or(z.literal('')),
  actionType: z.enum(QC_ACTION_TYPES, {
    errorMap: () => ({ message: 'Tipo controllo richiesto' }),
  }),
  thresholds: z.string().max(4000).optional().or(z.literal('')),
})

type QualityControlFormValues = z.infer<typeof QualityControlFormSchema>

function isQcActionType(v: unknown): v is (typeof QC_ACTION_TYPES)[number] {
  return typeof v === 'string' && (QC_ACTION_TYPES as readonly string[]).includes(v)
}

export function QualityControlStepForm({
  nodeId,
  data,
}: {
  nodeId: string
  data: Record<string, unknown>
}) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData)

  const initialActionType = isQcActionType(data['actionType'])
    ? (data['actionType'] as (typeof QC_ACTION_TYPES)[number])
    : 'visual_check'

  const defaults: QualityControlFormValues = {
    name: (data['label'] as string | undefined) ?? '',
    instructions: (data['instructions'] as string | undefined) ?? '',
    actionType: initialActionType,
    thresholds: (data['thresholds'] as string | undefined) ?? '',
  }

  const {
    register,
    reset,
    formState: { errors },
  } = useForm<QualityControlFormValues>({
    resolver: zodResolver(QualityControlFormSchema),
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
          placeholder="Es. Verifica saldatura"
        />
      </Field>

      <Field label="Istruzioni" error={errors.instructions?.message}>
        <textarea
          {...register('instructions', {
            onBlur: (e) => commit({ instructions: e.target.value }),
          })}
          placeholder="Istruzioni di controllo…"
          rows={4}
          className="w-full rounded-2 border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </Field>

      <Field label="Tipo controllo" required error={errors.actionType?.message}>
        <Select
          {...register('actionType', {
            onChange: (e) => commit({ actionType: e.target.value }),
          })}
          options={QC_ACTION_TYPES.map((t) => ({ value: t, label: QC_ACTION_LABELS[t] }))}
        />
      </Field>

      <Field
        label="Soglie (placeholder JSON)"
        hint="Sessione corrente — non persistito (vedi TODO-007)"
        error={errors.thresholds?.message}
      >
        <textarea
          {...register('thresholds', {
            onBlur: (e) => commit({ thresholds: e.target.value }),
          })}
          placeholder='{"min":0,"max":100}'
          rows={3}
          className="w-full rounded-2 border border-line bg-paper px-3 py-2 font-mono text-xs text-ink placeholder:text-ink-4 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </Field>
    </form>
  )
}

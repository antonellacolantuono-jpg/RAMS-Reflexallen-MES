'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Field, Input, Select } from '@mes/ui'
import { useWorkflowStore } from '../store'

// PhaseCategory list mirrors the WorkflowPalette PHASE_ITEMS — keep in sync.
const PHASE_CATEGORIES = [
  'inbound',
  'setup',
  'production',
  'quality_control',
  'outbound',
  'teardown',
] as const
const PHASE_CATEGORY_LABELS: Record<(typeof PHASE_CATEGORIES)[number], string> = {
  inbound: 'Inbound',
  setup: 'Setup',
  production: 'Produzione',
  quality_control: 'Controllo Qualità',
  outbound: 'Spedizione',
  teardown: 'Smontaggio',
}

const PhaseFormSchema = z.object({
  name: z.string().min(1, 'Nome richiesto').max(200, 'Massimo 200 caratteri'),
  category: z.enum(PHASE_CATEGORIES, {
    errorMap: () => ({ message: 'Categoria fase richiesta' }),
  }),
  isCycleBased: z.boolean(),
})

type PhaseFormValues = z.infer<typeof PhaseFormSchema>

function isPhaseCategory(v: unknown): v is (typeof PHASE_CATEGORIES)[number] {
  return typeof v === 'string' && (PHASE_CATEGORIES as readonly string[]).includes(v)
}

export function PhaseConfigurator({
  nodeId,
  data,
}: {
  nodeId: string
  data: Record<string, unknown>
}) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData)

  const initialCategory = isPhaseCategory(data['category'])
    ? (data['category'] as (typeof PHASE_CATEGORIES)[number])
    : 'production'

  const defaults: PhaseFormValues = {
    name: (data['label'] as string | undefined) ?? '',
    category: initialCategory,
    isCycleBased:
      typeof data['isCycleBased'] === 'boolean' ? (data['isCycleBased'] as boolean) : false,
  }

  const {
    register,
    reset,
    formState: { errors },
  } = useForm<PhaseFormValues>({
    resolver: zodResolver(PhaseFormSchema),
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
          placeholder="Es. Estrusione tubo"
        />
      </Field>

      <Field label="Categoria" required error={errors.category?.message}>
        <Select
          {...register('category', {
            onChange: (e) => commit({ category: e.target.value }),
          })}
          options={PHASE_CATEGORIES.map((c) => ({
            value: c,
            label: PHASE_CATEGORY_LABELS[c],
          }))}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-ink-2">
        <input
          type="checkbox"
          {...register('isCycleBased', {
            onChange: (e) => commit({ isCycleBased: e.target.checked }),
          })}
          className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
        />
        Fase ciclica (per produzione continua)
      </label>
    </form>
  )
}

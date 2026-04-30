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

// Form-internal setup type. Persists to node.data.setupType.
// bom_check & tool_check → actionType: 'verify_material'
// calibration & recipe_load → actionType: 'load_recipe'
// (see TODO-016 for future fine-grained enum specialization)
const SETUP_TYPES = ['bom_check', 'tool_check', 'calibration', 'recipe_load'] as const
const SETUP_LABELS: Record<(typeof SETUP_TYPES)[number], string> = {
  bom_check: 'Verifica BOM',
  tool_check: 'Verifica attrezzatura',
  calibration: 'Calibrazione',
  recipe_load: 'Caricamento ricetta',
}
const SETUP_TO_ACTION: Record<(typeof SETUP_TYPES)[number], string> = {
  bom_check: 'verify_material',
  tool_check: 'verify_material',
  calibration: 'load_recipe',
  recipe_load: 'load_recipe',
}

const SetupFormSchema = z.object({
  name: z.string().min(1, 'Nome richiesto').max(200, 'Massimo 200 caratteri'),
  instructions: z.string().max(2000).optional().or(z.literal('')),
  setupType: z.enum(SETUP_TYPES, {
    errorMap: () => ({ message: 'Tipo setup richiesto' }),
  }),
  recipeId: z.string().optional().or(z.literal('')),
  toolId: z.string().optional().or(z.literal('')),
})

type SetupFormValues = z.infer<typeof SetupFormSchema>

function isSetupType(v: unknown): v is (typeof SETUP_TYPES)[number] {
  return typeof v === 'string' && (SETUP_TYPES as readonly string[]).includes(v)
}

export function SetupStepForm({
  nodeId,
  data,
}: {
  nodeId: string
  data: Record<string, unknown>
}) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData)

  const initialSetupType = isSetupType(data['setupType'])
    ? (data['setupType'] as (typeof SETUP_TYPES)[number])
    : 'bom_check'

  const defaults: SetupFormValues = {
    name: (data['label'] as string | undefined) ?? '',
    instructions: (data['instructions'] as string | undefined) ?? '',
    setupType: initialSetupType,
    recipeId: (data['recipeId'] as string | undefined) ?? '',
    toolId: (data['toolId'] as string | undefined) ?? '',
  }

  const {
    register,
    control,
    reset,
    formState: { errors },
  } = useForm<SetupFormValues>({
    resolver: zodResolver(SetupFormSchema),
    defaultValues: defaults,
    mode: 'onBlur',
  })

  useEffect(() => {
    reset(defaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId])

  const { data: recipesResp } = useQuery({
    queryKey: ['recipes', 'all'],
    queryFn: () => sdk.recipes.list({ limit: 200 }),
  })
  const { data: toolsResp } = useQuery({
    queryKey: ['tools', 'all'],
    queryFn: () => sdk.tools.list({ limit: 200 }),
  })

  const recipeOptions: SelectProps['options'] = (recipesResp?.data ?? []).map((r) => ({
    value: r.id,
    label: `${r.code} — ${r.name}`,
  }))
  const toolOptions: SelectProps['options'] = (toolsResp?.data ?? []).map((t) => ({
    value: t.id,
    label: `${t.code} — ${t.name}`,
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
          placeholder="Es. Verifica BOM produzione"
        />
      </Field>

      <Field label="Istruzioni" error={errors.instructions?.message}>
        <textarea
          {...register('instructions', {
            onBlur: (e) => commit({ instructions: e.target.value }),
          })}
          placeholder="Istruzioni di setup…"
          rows={4}
          className="w-full rounded-2 border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </Field>

      <Field
        label="Tipo setup"
        required
        hint="setupType salvato in node.data; actionType collassato (vedi TODO-016)"
        error={errors.setupType?.message}
      >
        <Select
          {...register('setupType', {
            onChange: (e) => {
              const v = e.target.value as (typeof SETUP_TYPES)[number]
              commit({ setupType: v, actionType: SETUP_TO_ACTION[v] ?? 'verify_material' })
            },
          })}
          options={SETUP_TYPES.map((t) => ({ value: t, label: SETUP_LABELS[t] }))}
        />
      </Field>

      <Field label="Ricetta" error={errors.recipeId?.message}>
        <Controller
          name="recipeId"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value ?? ''}
              onChange={(e) => {
                field.onChange(e.target.value)
                commit({ recipeId: e.target.value || '' })
              }}
              placeholder="— Nessuna —"
              options={recipeOptions}
            />
          )}
        />
      </Field>

      <Field label="Attrezzatura" error={errors.toolId?.message}>
        <Controller
          name="toolId"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value ?? ''}
              onChange={(e) => {
                field.onChange(e.target.value)
                commit({ toolId: e.target.value || '' })
              }}
              placeholder="— Nessuna —"
              options={toolOptions}
            />
          )}
        />
      </Field>
    </form>
  )
}

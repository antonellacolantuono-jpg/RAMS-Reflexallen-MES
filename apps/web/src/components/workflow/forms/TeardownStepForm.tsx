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

// Form-internal teardown type. Persists to node.data.teardownType.
// Maps 1:1 to StepActionType (cleanup / unload_recipe / last_piece).
// teardownType + toolId selection are session-only (consolidated under TODO-016).
const TEARDOWN_TYPES = ['cleanup', 'unload_recipe', 'last_piece'] as const
const TEARDOWN_LABELS: Record<(typeof TEARDOWN_TYPES)[number], string> = {
  cleanup: 'Pulizia',
  unload_recipe: 'Scarico ricetta',
  last_piece: 'Ultimo pezzo',
}
const TEARDOWN_TO_ACTION: Record<(typeof TEARDOWN_TYPES)[number], string> = {
  cleanup: 'cleanup',
  unload_recipe: 'unload_recipe',
  last_piece: 'last_piece',
}

const TeardownFormSchema = z.object({
  name: z.string().min(1, 'Nome richiesto').max(200, 'Massimo 200 caratteri'),
  instructions: z.string().max(2000).optional().or(z.literal('')),
  teardownType: z.enum(TEARDOWN_TYPES, {
    errorMap: () => ({ message: 'Tipo smontaggio richiesto' }),
  }),
  toolId: z.string().optional().or(z.literal('')),
})

type TeardownFormValues = z.infer<typeof TeardownFormSchema>

function isTeardownType(v: unknown): v is (typeof TEARDOWN_TYPES)[number] {
  return typeof v === 'string' && (TEARDOWN_TYPES as readonly string[]).includes(v)
}

export function TeardownStepForm({
  nodeId,
  data,
}: {
  nodeId: string
  data: Record<string, unknown>
}) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData)

  const initialTeardownType = isTeardownType(data['teardownType'])
    ? (data['teardownType'] as (typeof TEARDOWN_TYPES)[number])
    : 'cleanup'

  const defaults: TeardownFormValues = {
    name: (data['label'] as string | undefined) ?? '',
    instructions: (data['instructions'] as string | undefined) ?? '',
    teardownType: initialTeardownType,
    toolId: (data['toolId'] as string | undefined) ?? '',
  }

  const {
    register,
    control,
    reset,
    formState: { errors },
  } = useForm<TeardownFormValues>({
    resolver: zodResolver(TeardownFormSchema),
    defaultValues: defaults,
    mode: 'onBlur',
  })

  useEffect(() => {
    reset(defaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId])

  const { data: toolsResp } = useQuery({
    queryKey: ['tools', 'all'],
    queryFn: () => sdk.tools.list({ limit: 200 }),
  })

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
          placeholder="Es. Pulizia stazione"
        />
      </Field>

      <Field label="Istruzioni" error={errors.instructions?.message}>
        <textarea
          {...register('instructions', {
            onBlur: (e) => commit({ instructions: e.target.value }),
          })}
          placeholder="Istruzioni di smontaggio…"
          rows={4}
          className="w-full rounded-2 border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </Field>

      <Field
        label="Tipo smontaggio"
        required
        hint="teardownType salvato in node.data; actionType mappato 1:1"
        error={errors.teardownType?.message}
      >
        <Select
          {...register('teardownType', {
            onChange: (e) => {
              const v = e.target.value as (typeof TEARDOWN_TYPES)[number]
              commit({ teardownType: v, actionType: TEARDOWN_TO_ACTION[v] ?? 'cleanup' })
            },
          })}
          options={TEARDOWN_TYPES.map((t) => ({ value: t, label: TEARDOWN_LABELS[t] }))}
        />
      </Field>

      <Field label="Attrezzatura (opzionale)" error={errors.toolId?.message}>
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

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

// Form-internal decision type. Persists to node.data.decisionType.
// Maps 1:1 to StepActionType (auto_branch / manual_choice / condition_check).
// causeCodeId is session-only (consolidated under TODO-016 — no Step.config column).
const DECISION_TYPES = ['auto_branch', 'manual_choice', 'condition_check'] as const
const DECISION_LABELS: Record<(typeof DECISION_TYPES)[number], string> = {
  auto_branch: 'Ramificazione automatica',
  manual_choice: 'Scelta manuale',
  condition_check: 'Controllo condizione',
}
const DECISION_TO_ACTION: Record<(typeof DECISION_TYPES)[number], string> = {
  auto_branch: 'auto_branch',
  manual_choice: 'manual_choice',
  condition_check: 'condition_check',
}

const DecisionFormSchema = z.object({
  name: z.string().min(1, 'Nome richiesto').max(200, 'Massimo 200 caratteri'),
  instructions: z.string().max(2000).optional().or(z.literal('')),
  decisionType: z.enum(DECISION_TYPES, {
    errorMap: () => ({ message: 'Tipo decisione richiesto' }),
  }),
  causeCodeId: z.string().optional().or(z.literal('')),
})

type DecisionFormValues = z.infer<typeof DecisionFormSchema>

function isDecisionType(v: unknown): v is (typeof DECISION_TYPES)[number] {
  return typeof v === 'string' && (DECISION_TYPES as readonly string[]).includes(v)
}

export function DecisionStepForm({
  nodeId,
  data,
}: {
  nodeId: string
  data: Record<string, unknown>
}) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData)

  const initialDecisionType = isDecisionType(data['decisionType'])
    ? (data['decisionType'] as (typeof DECISION_TYPES)[number])
    : 'manual_choice'

  const defaults: DecisionFormValues = {
    name: (data['label'] as string | undefined) ?? '',
    instructions: (data['instructions'] as string | undefined) ?? '',
    decisionType: initialDecisionType,
    causeCodeId: (data['causeCodeId'] as string | undefined) ?? '',
  }

  const {
    register,
    control,
    reset,
    formState: { errors },
  } = useForm<DecisionFormValues>({
    resolver: zodResolver(DecisionFormSchema),
    defaultValues: defaults,
    mode: 'onBlur',
  })

  useEffect(() => {
    reset(defaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId])

  const { data: causeCodesResp } = useQuery({
    queryKey: ['cause-codes', 'all'],
    queryFn: () => sdk.causeCodes.list({ limit: 200 }),
  })

  const causeCodeOptions: SelectProps['options'] = (causeCodesResp?.data ?? []).map((c) => ({
    value: c.id,
    label: `${c.code} — ${c.name}`,
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
          placeholder="Es. Verifica conformità"
        />
      </Field>

      <Field label="Istruzioni" error={errors.instructions?.message}>
        <textarea
          {...register('instructions', {
            onBlur: (e) => commit({ instructions: e.target.value }),
          })}
          placeholder="Istruzioni decisionali…"
          rows={4}
          className="w-full rounded-2 border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </Field>

      <Field
        label="Tipo decisione"
        required
        hint="decisionType salvato in node.data; actionType mappato 1:1"
        error={errors.decisionType?.message}
      >
        <Select
          {...register('decisionType', {
            onChange: (e) => {
              const v = e.target.value as (typeof DECISION_TYPES)[number]
              commit({ decisionType: v, actionType: DECISION_TO_ACTION[v] ?? 'manual_choice' })
            },
          })}
          options={DECISION_TYPES.map((t) => ({ value: t, label: DECISION_LABELS[t] }))}
        />
      </Field>

      <Field
        label="Causale (opzionale)"
        hint="Sessione corrente — non persistito (vedi TODO-016)"
        error={errors.causeCodeId?.message}
      >
        <Controller
          name="causeCodeId"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value ?? ''}
              onChange={(e) => {
                field.onChange(e.target.value)
                commit({ causeCodeId: e.target.value || '' })
              }}
              placeholder="— Nessuna —"
              options={causeCodeOptions}
            />
          )}
        />
      </Field>
    </form>
  )
}

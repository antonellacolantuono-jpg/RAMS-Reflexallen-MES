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

// Form-internal recovery stage. Persists to node.data.recoveryStage.
// All four collapse onto StepActionType.REWORK for actionType (see TODO-016).
// The full 4-stage recovery state machine (auto-generated diagnosis/retry/scrap
// chain) is deferred to PROMPT_3b_FULL (TODO-015).
const RECOVERY_STAGES = ['diagnosis', 'attempt_1', 'attempt_2', 'scrap'] as const
const RECOVERY_LABELS: Record<(typeof RECOVERY_STAGES)[number], string> = {
  diagnosis: 'Diagnosi',
  attempt_1: 'Tentativo 1',
  attempt_2: 'Tentativo 2',
  scrap: 'Scarto',
}

const RecoveryFormSchema = z.object({
  name: z.string().min(1, 'Nome richiesto').max(200, 'Massimo 200 caratteri'),
  instructions: z.string().max(2000).optional().or(z.literal('')),
  recoveryStage: z.enum(RECOVERY_STAGES, {
    errorMap: () => ({ message: 'Stadio recupero richiesto' }),
  }),
  causeCodeId: z.string().optional().or(z.literal('')),
})

type RecoveryFormValues = z.infer<typeof RecoveryFormSchema>

function isRecoveryStage(v: unknown): v is (typeof RECOVERY_STAGES)[number] {
  return typeof v === 'string' && (RECOVERY_STAGES as readonly string[]).includes(v)
}

export function RecoveryStepForm({
  nodeId,
  data,
}: {
  nodeId: string
  data: Record<string, unknown>
}) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData)

  const initialStage = isRecoveryStage(data['recoveryStage'])
    ? (data['recoveryStage'] as (typeof RECOVERY_STAGES)[number])
    : 'diagnosis'

  const defaults: RecoveryFormValues = {
    name: (data['label'] as string | undefined) ?? '',
    instructions: (data['instructions'] as string | undefined) ?? '',
    recoveryStage: initialStage,
    causeCodeId: (data['causeCodeId'] as string | undefined) ?? '',
  }

  const {
    register,
    control,
    reset,
    formState: { errors },
  } = useForm<RecoveryFormValues>({
    resolver: zodResolver(RecoveryFormSchema),
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
          placeholder="Es. Diagnosi difetto saldatura"
        />
      </Field>

      <Field label="Istruzioni" error={errors.instructions?.message}>
        <textarea
          {...register('instructions', {
            onBlur: (e) => commit({ instructions: e.target.value }),
          })}
          placeholder="Istruzioni di recupero…"
          rows={4}
          className="w-full rounded-2 border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </Field>

      <Field
        label="Stadio recupero"
        required
        hint="Sessione corrente — actionType collassato a 'rework' (vedi TODO-016)"
        error={errors.recoveryStage?.message}
      >
        <Select
          {...register('recoveryStage', {
            onChange: (e) =>
              commit({ recoveryStage: e.target.value, actionType: 'rework' }),
          })}
          options={RECOVERY_STAGES.map((s) => ({ value: s, label: RECOVERY_LABELS[s] }))}
        />
      </Field>

      <Field
        label="Causale"
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

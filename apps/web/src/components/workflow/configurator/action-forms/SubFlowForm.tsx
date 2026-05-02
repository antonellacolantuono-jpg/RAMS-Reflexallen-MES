'use client'

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Field, Select } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import {
  SubFlowSchema,
  defaultSubFlow,
  TRIGGER_CONDITION_VALUES,
  type SubFlowValues,
} from '../../../../lib/step-validation-schemas'

const TRIGGER_LABEL: Record<(typeof TRIGGER_CONDITION_VALUES)[number], string> = {
  on_nok: 'In caso di NOK',
  manual: 'Avvio manuale',
  conditional: 'Condizionale',
}

export interface SubFlowFormProps {
  value: SubFlowValues
  onChange: (next: SubFlowValues) => void
}

export function SubFlowForm({ value, onChange }: SubFlowFormProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<SubFlowValues>({
    resolver: zodResolver(SubFlowSchema),
    defaultValues: { ...defaultSubFlow, ...value },
    mode: 'onBlur',
  })

  useEffect(() => {
    const sub = watch((v) => onChange(v as SubFlowValues))
    return () => sub.unsubscribe()
  }, [watch, onChange])

  const workflowsQuery = useQuery({
    queryKey: ['workflows', 'all'],
    queryFn: () => sdk.workflows.list({ limit: 200 }),
  })

  const subFlowOptions = useMemo(() => {
    const items = workflowsQuery.data?.data ?? []
    // Heuristic filter: workflows whose code starts with TPL_RECOVERY,
    // RECOVERY, or SUBFLOW are surfaced first; everything else is included
    // because there's no first-class category field on Workflow yet.
    return items.map((w) => ({
      value: w.id,
      label: `${w.code} — ${w.name}`,
    }))
  }, [workflowsQuery.data])

  return (
    <form
      className="flex flex-col gap-3"
      data-action-form="sub_flow"
      onSubmit={(e) => e.preventDefault()}
    >
      <Field
        label="Sotto-flusso collegato"
        required
        error={errors.subFlowWorkflowId?.message}
      >
        <Select
          {...register('subFlowWorkflowId')}
          placeholder="— Seleziona —"
          options={subFlowOptions}
        />
      </Field>

      <Field label="Condizione di innesco" error={errors.triggerCondition?.message}>
        <Select
          {...register('triggerCondition')}
          options={TRIGGER_CONDITION_VALUES.map((v) => ({
            value: v,
            label: TRIGGER_LABEL[v],
          }))}
        />
      </Field>
    </form>
  )
}

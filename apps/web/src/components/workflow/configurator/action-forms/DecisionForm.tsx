'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Field, Input, Select } from '@mes/ui'
import {
  DecisionSchema,
  defaultDecision,
  type DecisionValues,
} from '../../../../lib/step-validation-schemas'

export interface DecisionTargetCandidate {
  id: string
  label: string
}

export interface DecisionFormProps {
  value: DecisionValues
  onChange: (next: DecisionValues) => void
  targetCandidates: DecisionTargetCandidate[]
  onValidate?: (isValid: boolean) => void
}

export function DecisionForm({
  value,
  onChange,
  targetCandidates,
  onValidate,
}: DecisionFormProps) {
  const {
    register,
    watch,
    trigger,
    formState: { errors },
  } = useForm<DecisionValues>({
    resolver: zodResolver(DecisionSchema),
    defaultValues: { ...defaultDecision, ...value },
    mode: 'onChange',
  })

  useEffect(() => {
    const sub = watch((v) => onChange(v as DecisionValues))
    return () => sub.unsubscribe()
  }, [watch, onChange])

  // Surface validity to parent so the test harness + Save handler can react.
  useEffect(() => {
    if (onValidate) {
      trigger().then((ok) => onValidate(ok))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors.branchLabel?.message])

  const targetOptions = targetCandidates.map((c) => ({
    value: c.id,
    label: c.label,
  }))

  return (
    <form
      className="flex flex-col gap-3"
      data-action-form="decision"
      onSubmit={(e) => e.preventDefault()}
    >
      <Field
        label="Etichetta ramo"
        required
        error={errors.branchLabel?.message}
        hint='Es. "PASS / FAIL / MARGINAL"'
      >
        <Input
          {...register('branchLabel')}
          placeholder="PASS / FAIL"
          data-decision-branch-label
        />
      </Field>

      <Field
        label="Su OK → step di destinazione"
        error={errors.onOkTargetId?.message}
      >
        <Select
          {...register('onOkTargetId')}
          placeholder="— Step successivo —"
          options={targetOptions}
        />
      </Field>

      <Field
        label="Su NOK → step di destinazione"
        error={errors.onNokTargetId?.message}
      >
        <Select
          {...register('onNokTargetId')}
          placeholder="— Step precedente —"
          options={targetOptions}
        />
      </Field>

      <Field
        label="Su MARGINAL → step di destinazione (opzionale)"
        error={errors.onMarginalTargetId?.message}
      >
        <Select
          {...register('onMarginalTargetId')}
          placeholder="— Nessuno —"
          options={targetOptions}
        />
      </Field>
    </form>
  )
}

'use client'

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Field, Input, Select } from '@mes/ui'
import {
  ParallelSchema,
  defaultParallel,
  PART_REFERENCE_VALUES,
  type ParallelValues,
  validateParallelDuration,
} from '../../../../lib/step-validation-schemas'

const PART_LABEL: Record<(typeof PART_REFERENCE_VALUES)[number], string> = {
  previous: 'Pezzo precedente',
  current: 'Pezzo corrente',
  next: 'Pezzo successivo',
}

export interface ParallelStepCandidate {
  id: string
  label: string
  cycleTimeSec?: number | null
  parallelStepsBufferSec?: number | null
}

export interface ParallelFormProps {
  value: ParallelValues
  onChange: (next: ParallelValues) => void
  parentCandidates: ParallelStepCandidate[]
}

export function ParallelForm({
  value,
  onChange,
  parentCandidates,
}: ParallelFormProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<ParallelValues>({
    resolver: zodResolver(ParallelSchema),
    defaultValues: { ...defaultParallel, ...value },
    mode: 'onBlur',
  })

  useEffect(() => {
    const sub = watch((v) => onChange(v as ParallelValues))
    return () => sub.unsubscribe()
  }, [watch, onChange])

  const parentStepId = watch('parentStepId')
  const durationDuringDeviceCycleSec = watch('durationDuringDeviceCycleSec')

  const parent = useMemo(
    () => parentCandidates.find((c) => c.id === parentStepId) ?? null,
    [parentCandidates, parentStepId],
  )

  const durationNumber =
    typeof durationDuringDeviceCycleSec === 'number'
      ? durationDuringDeviceCycleSec
      : durationDuringDeviceCycleSec === ''
        ? null
        : Number(durationDuringDeviceCycleSec)

  const durationConstraintError = validateParallelDuration(
    Number.isFinite(durationNumber) ? (durationNumber as number) : null,
    parent,
  )

  return (
    <form
      className="flex flex-col gap-3"
      data-action-form="parallel"
      onSubmit={(e) => e.preventDefault()}
    >
      <Field
        label="Step padre"
        hint="Solo step che supportano il parallelismo"
        error={errors.parentStepId?.message}
      >
        <Select
          {...register('parentStepId')}
          placeholder="— Seleziona —"
          options={parentCandidates.map((c) => ({
            value: c.id,
            label: c.label,
          }))}
        />
      </Field>

      <Field label="Riferimento pezzo" error={errors.partReference?.message}>
        <Select
          {...register('partReference')}
          options={PART_REFERENCE_VALUES.map((v) => ({
            value: v,
            label: PART_LABEL[v],
          }))}
        />
      </Field>

      <Field
        label="Durata durante ciclo dispositivo (sec)"
        hint={
          parent
            ? `Max ${(parent.cycleTimeSec ?? 0) - (parent.parallelStepsBufferSec ?? 0)}s (ciclo padre ${parent.cycleTimeSec ?? '?'}s − buffer ${parent.parallelStepsBufferSec ?? 0}s)`
            : undefined
        }
        error={
          errors.durationDuringDeviceCycleSec?.message ??
          durationConstraintError ??
          undefined
        }
      >
        <Input
          type="number"
          min={1}
          {...register('durationDuringDeviceCycleSec')}
          placeholder="es. 30"
          data-parallel-duration-input
          aria-invalid={Boolean(durationConstraintError) || undefined}
        />
      </Field>

      <Field
        label="Descrizione"
        required
        error={errors.description?.message}
      >
        <textarea
          {...register('description')}
          rows={3}
          placeholder="Descrizione step parallelo"
          className="w-full rounded-2 border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </Field>
    </form>
  )
}

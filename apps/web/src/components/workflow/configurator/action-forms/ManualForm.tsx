'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Field, Input } from '@mes/ui'
import {
  ManualSchema,
  defaultManual,
  type ManualValues,
} from '../../../../lib/step-validation-schemas'

export interface ManualFormProps {
  value: ManualValues
  onChange: (next: ManualValues) => void
}

export function ManualForm({ value, onChange }: ManualFormProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<ManualValues>({
    resolver: zodResolver(ManualSchema),
    defaultValues: { ...defaultManual, ...value },
    mode: 'onBlur',
  })

  useEffect(() => {
    const sub = watch((v) => onChange(v as ManualValues))
    return () => sub.unsubscribe()
  }, [watch, onChange])

  return (
    <form
      className="flex flex-col gap-3"
      data-action-form="manual"
      onSubmit={(e) => e.preventDefault()}
    >
      <Field
        label="Istruzioni operatore"
        required
        error={errors.instructions?.message}
      >
        <textarea
          {...register('instructions')}
          rows={4}
          placeholder="Indicare istruzioni passo-passo"
          className="w-full rounded-2 border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </Field>

      <Field label="Durata standard (sec)" error={errors.durationStr?.message}>
        <Input
          type="number"
          min={0}
          {...register('durationStr')}
          placeholder="es. 45"
        />
      </Field>

      <Field label="Durata massima (sec)" error={errors.maxDurationStr?.message}>
        <Input
          type="number"
          min={0}
          {...register('maxDurationStr')}
          placeholder="es. 90"
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Etichetta IT" error={errors.labelIt?.message}>
          <Input
            {...register('labelIt')}
            placeholder="(default: Nome)"
          />
        </Field>
        <Field label="Etichetta EN" error={errors.labelEn?.message}>
          <Input
            {...register('labelEn')}
            placeholder="(opzionale)"
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-2">
        <input
          type="checkbox"
          {...register('isRequired')}
          className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
        />
        Step obbligatorio
      </label>
    </form>
  )
}

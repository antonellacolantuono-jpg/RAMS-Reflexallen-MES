'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Field, Input } from '@mes/ui'
import {
  GuidedSchema,
  defaultGuided,
  type GuidedValues,
} from '../../../../lib/step-validation-schemas'

export interface GuidedFormProps {
  value: GuidedValues
  onChange: (next: GuidedValues) => void
  selectedToolIds: string[]
}

export function GuidedForm({
  value,
  onChange,
  selectedToolIds,
}: GuidedFormProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<GuidedValues>({
    resolver: zodResolver(GuidedSchema),
    defaultValues: { ...defaultGuided, ...value },
    mode: 'onBlur',
  })

  useEffect(() => {
    const sub = watch((v) => onChange(v as GuidedValues))
    return () => sub.unsubscribe()
  }, [watch, onChange])

  const noToolSelected = selectedToolIds.length === 0

  return (
    <form
      className="flex flex-col gap-3"
      data-action-form="guided"
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

      <Field
        label="Attrezzo"
        hint={
          noToolSelected
            ? 'Seleziona un attrezzo nella tab Risorse'
            : `${selectedToolIds.length} selezionat${selectedToolIds.length === 1 ? 'o' : 'i'}`
        }
      >
        <Input
          readOnly
          disabled={noToolSelected}
          value={
            noToolSelected
              ? ''
              : selectedToolIds.length === 1
                ? selectedToolIds[0]!
                : `${selectedToolIds.length} attrezzi`
          }
          data-guided-tool-readonly
          placeholder="—"
        />
      </Field>

      <Field
        label="Checklist di verifica"
        hint="Una voce per riga — diventa una checkbox a runtime"
        error={errors.verificationChecklist?.message}
      >
        <textarea
          {...register('verificationChecklist')}
          rows={3}
          placeholder="es. Torque verificato\nVisivo OK"
          className="w-full rounded-2 border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </Field>

      <Field label="Durata standard (sec)" error={errors.durationStr?.message}>
        <Input
          type="number"
          min={0}
          {...register('durationStr')}
          placeholder="es. 60"
        />
      </Field>
    </form>
  )
}

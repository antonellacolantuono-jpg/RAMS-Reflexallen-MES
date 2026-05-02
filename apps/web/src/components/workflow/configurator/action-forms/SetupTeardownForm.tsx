'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Field, Input } from '@mes/ui'
import {
  SetupTeardownSchema,
  defaultSetupTeardown,
  type SetupTeardownValues,
} from '../../../../lib/step-validation-schemas'

export interface SetupTeardownFormProps {
  value: SetupTeardownValues
  onChange: (next: SetupTeardownValues) => void
  /** Resolved DB step category — drives the auto-generated badge text. */
  category: 'setup' | 'teardown' | string
}

export function SetupTeardownForm({
  value,
  onChange,
  category,
}: SetupTeardownFormProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<SetupTeardownValues>({
    resolver: zodResolver(SetupTeardownSchema),
    defaultValues: { ...defaultSetupTeardown, ...value },
    mode: 'onBlur',
  })

  useEffect(() => {
    const sub = watch((v) => onChange(v as SetupTeardownValues))
    return () => sub.unsubscribe()
  }, [watch, onChange])

  const isSetup = category === 'setup'

  return (
    <form
      className="flex flex-col gap-3"
      data-action-form="setupTeardown"
      onSubmit={(e) => e.preventDefault()}
    >
      <div
        className="inline-flex w-fit items-center gap-2 rounded bg-info/10 px-2 py-1 text-xs text-info"
        data-setup-teardown-badge
      >
        <span className="font-semibold">Auto-generato:</span>
        <span>
          {isSetup
            ? 'Setup (preparazione gruppo dispositivi)'
            : 'Teardown (chiusura gruppo dispositivi)'}
        </span>
      </div>

      <Field label="Durata standard (sec)" error={errors.durationStr?.message}>
        <Input
          type="number"
          min={0}
          {...register('durationStr')}
          placeholder="es. 30"
        />
      </Field>
    </form>
  )
}

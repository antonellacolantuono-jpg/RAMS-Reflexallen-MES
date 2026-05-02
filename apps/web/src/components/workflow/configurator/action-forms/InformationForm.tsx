'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Field, Input, Select } from '@mes/ui'
import {
  InformationSchema,
  defaultInformation,
  CONTENT_TYPE_VALUES,
  type InformationValues,
} from '../../../../lib/step-validation-schemas'

const CONTENT_TYPE_LABEL: Record<(typeof CONTENT_TYPE_VALUES)[number], string> = {
  sop: 'SOP',
  video: 'Video',
  drawing: 'Disegno tecnico',
  safety_briefing: 'Briefing sicurezza',
}

export interface InformationFormProps {
  value: InformationValues
  onChange: (next: InformationValues) => void
}

export function InformationForm({ value, onChange }: InformationFormProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<InformationValues>({
    resolver: zodResolver(InformationSchema),
    defaultValues: { ...defaultInformation, ...value },
    mode: 'onBlur',
  })

  useEffect(() => {
    const sub = watch((v) => onChange(v as InformationValues))
    return () => sub.unsubscribe()
  }, [watch, onChange])

  return (
    <form
      className="flex flex-col gap-3"
      data-action-form="information"
      onSubmit={(e) => e.preventDefault()}
    >
      <Field label="Tipo contenuto" error={errors.contentType?.message}>
        <Select
          {...register('contentType')}
          options={CONTENT_TYPE_VALUES.map((v) => ({
            value: v,
            label: CONTENT_TYPE_LABEL[v],
          }))}
        />
      </Field>

      <Field
        label="URL contenuto"
        hint="Per MVP è un URL semplice (file picker in F2)"
        error={errors.contentUrl?.message}
      >
        <Input
          type="url"
          {...register('contentUrl')}
          placeholder="https://…"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-ink-2">
        <input
          type="checkbox"
          {...register('ackRequired')}
          className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
        />
        Conferma di lettura obbligatoria
      </label>
    </form>
  )
}

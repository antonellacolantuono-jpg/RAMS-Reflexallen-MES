'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Field, Input, Select } from '@mes/ui'
import { useWorkflowStore } from '../store'

// Form-internal information type. Persists to node.data.informationType.
// Maps 1:1 to StepActionType (read_sop / safety_briefing / view_video / view_drawing).
// attachmentUrl is session-only (consolidated under TODO-016 — no Step.config column).
const INFORMATION_TYPES = ['read_sop', 'safety_briefing', 'view_video', 'view_drawing'] as const
const INFORMATION_LABELS: Record<(typeof INFORMATION_TYPES)[number], string> = {
  read_sop: 'Lettura SOP',
  safety_briefing: 'Briefing sicurezza',
  view_video: 'Video',
  view_drawing: 'Disegno',
}
const INFORMATION_TO_ACTION: Record<(typeof INFORMATION_TYPES)[number], string> = {
  read_sop: 'read_sop',
  safety_briefing: 'safety_briefing',
  view_video: 'view_video',
  view_drawing: 'view_drawing',
}

const InformationFormSchema = z.object({
  name: z.string().min(1, 'Nome richiesto').max(200, 'Massimo 200 caratteri'),
  instructions: z.string().max(2000).optional().or(z.literal('')),
  informationType: z.enum(INFORMATION_TYPES, {
    errorMap: () => ({ message: 'Tipo informazione richiesto' }),
  }),
  attachmentUrl: z.string().max(500).optional().or(z.literal('')),
})

type InformationFormValues = z.infer<typeof InformationFormSchema>

function isInformationType(v: unknown): v is (typeof INFORMATION_TYPES)[number] {
  return typeof v === 'string' && (INFORMATION_TYPES as readonly string[]).includes(v)
}

export function InformationStepForm({
  nodeId,
  data,
}: {
  nodeId: string
  data: Record<string, unknown>
}) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData)

  const initialInformationType = isInformationType(data['informationType'])
    ? (data['informationType'] as (typeof INFORMATION_TYPES)[number])
    : 'read_sop'

  const defaults: InformationFormValues = {
    name: (data['label'] as string | undefined) ?? '',
    instructions: (data['instructions'] as string | undefined) ?? '',
    informationType: initialInformationType,
    attachmentUrl: (data['attachmentUrl'] as string | undefined) ?? '',
  }

  const {
    register,
    reset,
    formState: { errors },
  } = useForm<InformationFormValues>({
    resolver: zodResolver(InformationFormSchema),
    defaultValues: defaults,
    mode: 'onBlur',
  })

  useEffect(() => {
    reset(defaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId])

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
          placeholder="Es. Lettura procedura sicurezza"
        />
      </Field>

      <Field label="Istruzioni" error={errors.instructions?.message}>
        <textarea
          {...register('instructions', {
            onBlur: (e) => commit({ instructions: e.target.value }),
          })}
          placeholder="Contenuto informativo…"
          rows={4}
          className="w-full rounded-2 border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </Field>

      <Field
        label="Tipo informazione"
        required
        hint="informationType salvato in node.data; actionType mappato 1:1"
        error={errors.informationType?.message}
      >
        <Select
          {...register('informationType', {
            onChange: (e) => {
              const v = e.target.value as (typeof INFORMATION_TYPES)[number]
              commit({
                informationType: v,
                actionType: INFORMATION_TO_ACTION[v] ?? 'read_sop',
              })
            },
          })}
          options={INFORMATION_TYPES.map((t) => ({ value: t, label: INFORMATION_LABELS[t] }))}
        />
      </Field>

      <Field
        label="URL allegato (opzionale)"
        hint="Sessione corrente — non persistito (vedi TODO-016)"
        error={errors.attachmentUrl?.message}
      >
        <Input
          type="url"
          {...register('attachmentUrl', {
            onBlur: (e) => commit({ attachmentUrl: e.target.value }),
          })}
          placeholder="https://intranet/sop-001.pdf"
        />
      </Field>
    </form>
  )
}

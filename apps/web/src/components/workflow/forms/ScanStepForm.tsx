'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Field, Input, Select } from '@mes/ui'
import { useWorkflowStore } from '../store'

// Per D6 spec: scanType dropdown qr/serial/id. We map the user-facing labels
// onto existing StepActionType values so the choice persists via actionType.
const SCAN_ACTION_TYPES = ['scan_qr', 'manual_id_entry', 'verify_id'] as const
const SCAN_ACTION_LABELS: Record<(typeof SCAN_ACTION_TYPES)[number], string> = {
  scan_qr: 'QR code',
  manual_id_entry: 'Numero di serie',
  verify_id: 'ID generico',
}

const ScanFormSchema = z.object({
  name: z.string().min(1, 'Nome richiesto').max(200, 'Massimo 200 caratteri'),
  instructions: z.string().max(2000).optional().or(z.literal('')),
  actionType: z.enum(SCAN_ACTION_TYPES, {
    errorMap: () => ({ message: 'Tipo scansione richiesto' }),
  }),
  expectedPattern: z.string().max(500).optional().or(z.literal('')),
})

type ScanFormValues = z.infer<typeof ScanFormSchema>

function isScanActionType(v: unknown): v is (typeof SCAN_ACTION_TYPES)[number] {
  return typeof v === 'string' && (SCAN_ACTION_TYPES as readonly string[]).includes(v)
}

export function ScanStepForm({
  nodeId,
  data,
}: {
  nodeId: string
  data: Record<string, unknown>
}) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData)

  const initialActionType = isScanActionType(data['actionType'])
    ? (data['actionType'] as (typeof SCAN_ACTION_TYPES)[number])
    : 'scan_qr'

  const defaults: ScanFormValues = {
    name: (data['label'] as string | undefined) ?? '',
    instructions: (data['instructions'] as string | undefined) ?? '',
    actionType: initialActionType,
    expectedPattern: (data['expectedPattern'] as string | undefined) ?? '',
  }

  const {
    register,
    reset,
    formState: { errors },
  } = useForm<ScanFormValues>({
    resolver: zodResolver(ScanFormSchema),
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
          placeholder="Es. Scansiona codice lotto"
        />
      </Field>

      <Field label="Istruzioni" error={errors.instructions?.message}>
        <textarea
          {...register('instructions', {
            onBlur: (e) => commit({ instructions: e.target.value }),
          })}
          placeholder="Istruzioni per l'operatore…"
          rows={4}
          className="w-full rounded-2 border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </Field>

      <Field label="Tipo scansione" required error={errors.actionType?.message}>
        <Select
          {...register('actionType', {
            onChange: (e) => commit({ actionType: e.target.value }),
          })}
          options={SCAN_ACTION_TYPES.map((t) => ({ value: t, label: SCAN_ACTION_LABELS[t] }))}
        />
      </Field>

      <Field
        label="Pattern atteso (regex)"
        hint="Sessione corrente — non persistito (vedi TODO-007)"
        error={errors.expectedPattern?.message}
      >
        <Input
          {...register('expectedPattern', {
            onBlur: (e) => commit({ expectedPattern: e.target.value }),
          })}
          placeholder="^LOT-[0-9]{6}$"
        />
      </Field>
    </form>
  )
}

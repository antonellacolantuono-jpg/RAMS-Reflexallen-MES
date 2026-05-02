'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Drawer, Field, Input, Select, useToast } from '@mes/ui'
import { useWorkflowStore } from './store'

const PHASE_CATEGORIES = [
  'inbound',
  'setup',
  'production',
  'quality_control',
  'outbound',
  'teardown',
] as const

const PHASE_CATEGORY_LABELS: Record<(typeof PHASE_CATEGORIES)[number], string> = {
  inbound: 'Inbound',
  setup: 'Setup',
  production: 'Produzione',
  quality_control: 'Controllo Qualità',
  outbound: 'Spedizione',
  teardown: 'Smontaggio',
}

const FormSchema = z.object({
  name: z.string().min(1, 'Nome richiesto').max(200, 'Massimo 200 caratteri'),
  category: z.enum(PHASE_CATEGORIES, {
    errorMap: () => ({ message: 'Categoria fase richiesta' }),
  }),
  isCycleBased: z.boolean(),
  tags: z.string().optional(),
})

type FormValues = z.infer<typeof FormSchema>

export interface AddPhaseDrawerProps {
  open: boolean
  onClose: () => void
}

export function AddPhaseDrawer({ open, onClose }: AddPhaseDrawerProps) {
  const addPhaseNode = useWorkflowStore((s) => s.addPhaseNode)
  const toast = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: '', category: 'production', isCycleBased: false, tags: '' },
  })

  useEffect(() => {
    if (open) {
      reset({ name: '', category: 'production', isCycleBased: false, tags: '' })
    }
  }, [open, reset])

  const onSubmit = (values: FormValues) => {
    const tags = (values.tags ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
    addPhaseNode({
      label: values.name,
      category: values.category,
      isCycleBased: values.isCycleBased,
      tags,
    })
    toast.show(`Fase "${values.name}" aggiunta`, 'ok')
    onClose()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Nuova Fase"
      width={480}
      actions={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-white hover:bg-accent-2 disabled:opacity-50"
          >
            Aggiungi Fase
          </button>
        </>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
        data-add-phase-drawer="form"
      >
        <Field label="Nome" required error={errors.name?.message}>
          <Input
            {...register('name')}
            placeholder="es. Final Assembly"
            autoComplete="off"
          />
        </Field>
        <Field label="Categoria" required error={errors.category?.message}>
          <Select {...register('category')}>
            {PHASE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {PHASE_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Cycle-based"
          hint="La fase si ripete per ogni pezzo"
        >
          <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" {...register('isCycleBased')} className="h-4 w-4" />
            Attiva
          </label>
        </Field>
        <Field
          label="Tag"
          hint="Etichette separate da virgola (opzionale)"
        >
          <Input
            {...register('tags')}
            placeholder="es. critical, automotive"
            autoComplete="off"
          />
        </Field>
      </form>
    </Drawer>
  )
}

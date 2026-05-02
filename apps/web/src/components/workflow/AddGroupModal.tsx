'use client'

import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal, Field, Input, Select, useToast } from '@mes/ui'
import { useWorkflowStore } from './store'

const GROUP_CATEGORIES = [
  'assembly',
  'device_execution',
  'device_setup',
  'qc',
  'bom_check',
  'skills_check',
  'tooling_check',
  'logistics',
  'packaging',
] as const

type GroupCategory = (typeof GROUP_CATEGORIES)[number]

const GROUP_CATEGORY_LABELS: Record<GroupCategory, string> = {
  assembly: 'Assemblaggio',
  device_execution: 'Esecuzione Dispositivo',
  device_setup: 'Setup Dispositivo',
  qc: 'Controllo Qualità',
  bom_check: 'Verifica BOM',
  skills_check: 'Verifica Skill',
  tooling_check: 'Verifica Attrezzatura',
  logistics: 'Logistica',
  packaging: 'Imballaggio',
}

// MVP subset of the Phase × Group compatibility matrix from
// MASTER_SPECIFICATION.md §7.5. teardown lets all groups through (spec note
// "in MVP, generic groups").
const PHASE_TO_ALLOWED_GROUPS: Record<string, readonly GroupCategory[]> = {
  inbound: ['logistics'],
  setup: ['skills_check', 'bom_check', 'tooling_check', 'device_setup'],
  production: ['device_execution', 'assembly', 'qc'],
  quality_control: ['qc'],
  outbound: ['logistics', 'packaging'],
  teardown: GROUP_CATEGORIES,
}

const FormSchema = z.object({
  name: z.string().min(1, 'Nome richiesto').max(200, 'Massimo 200 caratteri'),
  category: z.enum(GROUP_CATEGORIES, {
    errorMap: () => ({ message: 'Categoria gruppo richiesta' }),
  }),
  supportsParallel: z.boolean(),
  supportsRecovery: z.boolean(),
})

type FormValues = z.infer<typeof FormSchema>

export interface AddGroupModalProps {
  open: boolean
  onClose: () => void
  phaseId: string | null
}

export function AddGroupModal({ open, onClose, phaseId }: AddGroupModalProps) {
  const addGroupNodeToPhase = useWorkflowStore((s) => s.addGroupNodeToPhase)
  const nodes = useWorkflowStore((s) => s.nodes)
  const toast = useToast()

  const phaseCategory =
    phaseId
      ? ((nodes.find((n) => n.id === phaseId && n.type === 'phaseNode')?.data[
          'category'
        ] as string | undefined) ?? '')
      : ''

  const allowedGroupCategories = useMemo<readonly GroupCategory[]>(() => {
    return PHASE_TO_ALLOWED_GROUPS[phaseCategory] ?? GROUP_CATEGORIES
  }, [phaseCategory])

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      category: allowedGroupCategories[0] ?? 'assembly',
      supportsParallel: false,
      supportsRecovery: false,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: '',
        category: allowedGroupCategories[0] ?? 'assembly',
        supportsParallel: false,
        supportsRecovery: false,
      })
    }
  }, [open, reset, allowedGroupCategories])

  const watchedCategory = useWatch({ control, name: 'category' })
  const parallelEnabled = watchedCategory === 'device_execution'
  const recoveryEnabled =
    watchedCategory === 'device_execution' || watchedCategory === 'qc'

  const onSubmit = (values: FormValues) => {
    if (!phaseId) return
    addGroupNodeToPhase(phaseId, {
      label: values.name,
      category: values.category,
      supportsParallel: parallelEnabled ? values.supportsParallel : false,
      supportsRecovery: recoveryEnabled ? values.supportsRecovery : false,
    })
    toast.show(`Gruppo "${values.name}" aggiunto`, 'ok')
    onClose()
  }

  if (!phaseId) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuovo Gruppo"
      width={520}
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
            Aggiungi Gruppo
          </button>
        </>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
        data-add-group-modal="form"
      >
        <Field label="Nome" required error={errors.name?.message}>
          <Input
            {...register('name')}
            placeholder="es. Assemblaggio motore"
            autoComplete="off"
          />
        </Field>
        <Field
          label="Categoria"
          required
          error={errors.category?.message}
          hint={`Categorie ammesse per fase "${phaseCategory || '—'}"`}
        >
          <Select {...register('category')}>
            {allowedGroupCategories.map((cat) => (
              <option key={cat} value={cat}>
                {GROUP_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Supporta parallelo"
          hint={
            parallelEnabled
              ? 'Disponibile solo per categorie device_execution'
              : 'Categoria attuale: non supportata'
          }
        >
          <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              {...register('supportsParallel')}
              disabled={!parallelEnabled}
              className="h-4 w-4 disabled:opacity-50"
            />
            Attiva
          </label>
        </Field>
        <Field
          label="Supporta recovery"
          hint={
            recoveryEnabled
              ? 'Disponibile per device_execution e qc'
              : 'Categoria attuale: non supportata'
          }
        >
          <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              {...register('supportsRecovery')}
              disabled={!recoveryEnabled}
              className="h-4 w-4 disabled:opacity-50"
            />
            Attiva
          </label>
        </Field>
      </form>
    </Modal>
  )
}

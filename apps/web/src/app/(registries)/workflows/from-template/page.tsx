'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader, Field, Input } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import { TemplatePicker } from '../../../../components/workflow/templates/TemplatePicker'
import type { WorkflowModel } from '@mes/sdk'

type Step = 'pick' | 'configure' | 'confirm'

export default function FromTemplatePage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [step, setStep] = useState<Step>('pick')
  const [template, setTemplate] = useState<WorkflowModel | null>(null)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const cloneMutation = useMutation({
    mutationFn: () => {
      if (!template) throw new Error('Nessun template selezionato')
      return sdk.workflows.clone(template.id, {
        code,
        name,
        ...(description ? { description } : {}),
      })
    },
    onSuccess: (newWorkflow) => {
      void qc.invalidateQueries({ queryKey: ['workflows'] })
      router.push(`/workflows/${newWorkflow.id}`)
    },
    onError: (err: Error) => {
      setSubmitError(err.message || 'Errore durante la clonazione')
    },
  })

  function handlePick(tpl: WorkflowModel) {
    setTemplate(tpl)
    setName(tpl.name.replace(/^Template — /, ''))
    setCode('')
    setStep('configure')
  }

  function handleConfigureNext() {
    if (code.trim().length === 0 || name.trim().length === 0) return
    setStep('confirm')
  }

  function handleConfirm() {
    setSubmitError(null)
    cloneMutation.mutate()
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <PageHeader
        title="Nuovo flusso da template"
        subtitle="Clona un template predefinito e personalizzalo"
      />

      <ol className="flex items-center gap-2 text-xs">
        {(['pick', 'configure', 'confirm'] as Step[]).map((s, i) => (
          <li
            key={s}
            className={`flex items-center gap-2 ${
              step === s ? 'text-primary-700 font-medium' : 'text-neutral-500'
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                step === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-200 text-neutral-700'
              }`}
            >
              {i + 1}
            </span>
            <span>
              {s === 'pick' ? 'Scegli template' : s === 'configure' ? 'Configura' : 'Conferma'}
            </span>
            {i < 2 && <span className="mx-2 text-neutral-300">→</span>}
          </li>
        ))}
      </ol>

      {step === 'pick' && (
        <div className="space-y-4">
          <TemplatePicker
            selectedId={template?.id ?? null}
            onSelect={handlePick}
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push('/workflows')}
              className="rounded-md border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {step === 'configure' && template && (
        <div className="space-y-4">
          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700">
            Template selezionato:{' '}
            <span className="font-medium">{template.name}</span> ({template.code})
          </div>

          <Field label="Codice" required>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="es. WF-PNEU-CUST-001"
            />
          </Field>

          <Field label="Nome" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome descrittivo del flusso"
            />
          </Field>

          <Field label="Descrizione">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Descrizione opzionale"
            />
          </Field>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep('pick')}
              className="rounded-md border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              ← Indietro
            </button>
            <button
              type="button"
              onClick={handleConfigureNext}
              disabled={code.trim().length === 0 || name.trim().length === 0}
              className="rounded-md bg-primary-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              Continua →
            </button>
          </div>
        </div>
      )}

      {step === 'confirm' && template && (
        <div className="space-y-4">
          <div className="rounded-md border border-neutral-200 bg-white p-4 text-sm text-neutral-800">
            <h3 className="font-medium mb-2">Riepilogo</h3>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between border-b border-neutral-100 py-1">
                <dt className="text-neutral-500">Template di origine</dt>
                <dd className="font-mono">{template.code}</dd>
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-1">
                <dt className="text-neutral-500">Nuovo codice</dt>
                <dd className="font-mono">{code}</dd>
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-1">
                <dt className="text-neutral-500">Nuovo nome</dt>
                <dd>{name}</dd>
              </div>
              {description && (
                <div className="flex justify-between py-1">
                  <dt className="text-neutral-500">Descrizione</dt>
                  <dd className="text-right max-w-md">{description}</dd>
                </div>
              )}
            </dl>
            <p className="mt-3 text-xs text-neutral-500">
              Il nuovo flusso verrà creato come <strong>draft</strong> con la stessa struttura
              di fasi/gruppi/step del template. Potrai modificarlo subito dopo la creazione.
            </p>
          </div>

          {submitError && (
            <div className="rounded-md border border-error-200 bg-error-50 p-3 text-sm text-error-800">
              {submitError}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep('configure')}
              className="rounded-md border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              ← Indietro
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={cloneMutation.isPending}
              className="rounded-md bg-primary-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {cloneMutation.isPending ? 'Clonazione…' : 'Crea flusso'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

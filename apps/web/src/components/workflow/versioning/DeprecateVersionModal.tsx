'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@mes/ui'
import { sdk } from '../../../lib/sdk'

export interface DeprecateVersionModalProps {
  open: boolean
  onClose: () => void
  workflowId: string
  versionId: string
  versionNumber: number
}

export function DeprecateVersionModal({
  open,
  onClose,
  workflowId,
  versionId,
  versionNumber,
}: DeprecateVersionModalProps) {
  const [reason, setReason] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const reasonError =
    reason.length > 0 && reason.trim().length < 10
      ? 'La motivazione deve contenere almeno 10 caratteri.'
      : null

  const mutation = useMutation({
    mutationFn: () => sdk.workflows.deprecateVersion(workflowId, versionId, reason.trim()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workflows', workflowId] })
      await queryClient.invalidateQueries({ queryKey: ['workflows', workflowId, 'versions'] })
      setReason('')
      onClose()
    },
    onError: (err: Error) => {
      setSubmitError(err.message || 'Errore durante la deprecazione')
    },
  })

  const canSubmit = reason.trim().length >= 10 && !mutation.isPending

  return (
    <Modal
      open={open}
      onClose={() => {
        setReason('')
        setSubmitError(null)
        onClose()
      }}
      title={`Deprecata versione v${versionNumber}`}
      description="Una versione deprecata viene mantenuta per tracciabilità ma non può essere riutilizzata."
      width={520}
      footer={
        <>
          <button
            type="button"
            onClick={() => {
              setReason('')
              setSubmitError(null)
              onClose()
            }}
            className="rounded-md border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={() => {
              setSubmitError(null)
              mutation.mutate()
            }}
            disabled={!canSubmit}
            className="rounded-md bg-error-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-error-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Deprecazione…' : 'Deprecata'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="block text-sm font-medium text-neutral-800">
          Motivazione <span className="text-error-600">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={5}
          placeholder="Es. Modifica del ciclo produttivo richiesta da Qualità (2026-05)…"
          className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <p className="text-xs text-neutral-500">
          La motivazione viene registrata nei log di audit (richiesto da IATF 16949).
        </p>
        {reasonError && <p className="text-xs text-error-700">{reasonError}</p>}
        {submitError && (
          <div className="rounded-md border border-error-200 bg-error-50 p-3 text-sm text-error-800">
            {submitError}
          </div>
        )}
      </div>
    </Modal>
  )
}

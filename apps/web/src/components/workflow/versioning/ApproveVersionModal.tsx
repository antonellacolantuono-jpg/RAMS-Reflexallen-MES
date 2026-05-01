'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@mes/ui'
import { sdk } from '../../../lib/sdk'
import { useValidationContext } from '../validation-context'

export interface ApproveVersionModalProps {
  open: boolean
  onClose: () => void
  workflowId: string
  versionId: string
  versionNumber: number
}

export function ApproveVersionModal({
  open,
  onClose,
  workflowId,
  versionId,
  versionNumber,
}: ApproveVersionModalProps) {
  const validation = useValidationContext()
  const queryClient = useQueryClient()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => sdk.workflows.approveVersion(workflowId, versionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workflows', workflowId] })
      await queryClient.invalidateQueries({ queryKey: ['workflows', workflowId, 'versions'] })
      onClose()
    },
    onError: (err: Error) => {
      setSubmitError(err.message || 'Errore durante l\'approvazione')
    },
  })

  const errors = validation && !validation.result.ok ? validation.result.errors : []
  const hasBlockingErrors = errors.some(
    (e) =>
      !e.field.includes('skillId') &&
      !e.field.includes('deviceId') &&
      !e.field.includes('recipeId') &&
      !e.field.includes('toolId'),
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Approva versione v${versionNumber}`}
      description="Una versione approvata diventa immutabile e disponibile per il rilascio dei work order."
      width={520}
      footer={
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
            onClick={() => {
              setSubmitError(null)
              mutation.mutate()
            }}
            disabled={hasBlockingErrors || mutation.isPending}
            className="rounded-md bg-primary-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Approvazione…' : 'Approva'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {hasBlockingErrors ? (
          <div className="rounded-md border border-error-200 bg-error-50 p-3 text-sm text-error-800">
            <p className="font-medium mb-2">
              Impossibile approvare: il workflow contiene errori strutturali.
            </p>
            <ul className="list-disc list-inside space-y-1">
              {errors
                .filter(
                  (e) =>
                    !e.field.includes('skillId') &&
                    !e.field.includes('deviceId') &&
                    !e.field.includes('recipeId') &&
                    !e.field.includes('toolId'),
                )
                .slice(0, 8)
                .map((e, i) => (
                  <li key={i}>{e.message}</li>
                ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-neutral-700">
            La struttura del workflow è valida. Confermando, la versione passerà
            allo stato <strong>approved</strong> e non potrà più essere modificata.
          </p>
        )}

        {submitError && (
          <div className="rounded-md border border-error-200 bg-error-50 p-3 text-sm text-error-800">
            {submitError}
          </div>
        )}
      </div>
    </Modal>
  )
}

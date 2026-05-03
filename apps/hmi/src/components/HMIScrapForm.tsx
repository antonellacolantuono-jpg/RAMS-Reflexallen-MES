'use client'
import * as React from 'react'
import { Button, Field, Modal, Select } from '@mes/ui'
import type { WorkOrderStep } from '../lib/queries'
import { useCauseCodes } from '../lib/use-cause-codes'
import { PhotoUploadHmi } from './PhotoUploadHmi'

export interface HMIScrapFormProps {
  open: boolean
  step: WorkOrderStep | null
  /** Phase derived from the step (leak / camera) — drives cause code filter. */
  phase: 'leak' | 'camera' | null
  onClose: () => void
  /** Caller fires MARK_SCRAPPED with the assembled payload. */
  onConfirm: (payload: {
    causeCodeId: string
    causeCode: string
    photoBase64: string | null
    notes: string | null
  }) => void
  isPending?: boolean
}

/**
 * PNE_4_FOCUSED D4.2 — Scrap confirmation modal.
 *
 * Operator selects a cause code (filtered by phase via the LK-* / CM-*
 * prefix), optionally uploads a photo and adds notes, then confirms. The
 * caller is responsible for dispatching the MARK_SCRAPPED transition with
 * the assembled payload — keeping this component side-effect free makes it
 * easy to plug into any host page (and easy to test).
 *
 * Photo upload is mock per TODO-040 (base64 in-memory, no real upload until
 * F2 storage integration).
 */
export function HMIScrapForm({
  open,
  step,
  phase,
  onClose,
  onConfirm,
  isPending,
}: HMIScrapFormProps) {
  const { options: causeCodes, isLoading } = useCauseCodes('recovery_fault', {
    phase,
    enabled: open,
  })

  const [causeCodeId, setCauseCodeId] = React.useState<string>('')
  const [photoBase64, setPhotoBase64] = React.useState<string | null>(null)
  const [notes, setNotes] = React.useState<string>('')

  // Reset on open / step change.
  React.useEffect(() => {
    if (open) {
      setCauseCodeId('')
      setPhotoBase64(null)
      setNotes('')
    }
  }, [open, step?.stepExecutionId])

  const selectedCode = React.useMemo(
    () => causeCodes.find((c) => c.id === causeCodeId)?.code ?? '',
    [causeCodes, causeCodeId],
  )

  const canConfirm =
    causeCodeId.length > 0 && photoBase64 !== null && !isPending

  const handleConfirm = () => {
    if (!canConfirm) return
    onConfirm({
      causeCodeId,
      causeCode: selectedCode,
      photoBase64,
      notes: notes.trim() || null,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={620}
      title="Conferma scarto pezzo"
      description={
        step
          ? `Step: ${step.stepName} — ciclo ${phase ?? 'dispositivo'}`
          : undefined
      }
      footer={
        <>
          <Button size="md" variant="ghost" onClick={onClose}>
            Annulla
          </Button>
          <Button
            size="md"
            variant="danger"
            onClick={handleConfirm}
            disabled={!canConfirm}
            data-testid="hmi-scrap-confirm"
          >
            Conferma scarto
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4" data-testid="hmi-scrap-form">
        <Field
          label="Codice causa scarto"
          required
          hint={isLoading ? 'Caricamento codici…' : undefined}
        >
          <Select
            value={causeCodeId}
            onChange={(e) => setCauseCodeId(e.target.value)}
            placeholder="— Seleziona codice causa —"
            options={causeCodes.map((c) => ({
              value: c.id,
              label: `${c.code}${c.description ? ' — ' + c.description.split('. ')[0] : ''}`,
            }))}
            data-testid="hmi-scrap-cause-code"
          />
        </Field>

        <PhotoUploadHmi value={photoBase64} onChange={setPhotoBase64} />

        <Field label="Note (opzionali)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Descrivi il difetto o il contesto operativo…"
            className="w-full rounded-2 border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            data-testid="hmi-scrap-notes"
          />
        </Field>

        {!canConfirm && (
          <p className="text-[11px] text-ink-3 italic">
            Seleziona un codice causa e carica una foto per confermare.
          </p>
        )}
      </div>
    </Modal>
  )
}

/**
 * Helper — derive the cause-code filter phase from a step's device serial.
 */
export function derivePhaseFromStep(
  step: WorkOrderStep | null | undefined,
): 'leak' | 'camera' | null {
  if (!step?.deviceSerialNumber) return null
  if (step.deviceSerialNumber === 'DEV-LEAK-001') return 'leak'
  if (step.deviceSerialNumber === 'DEV-CAMERA-001') return 'camera'
  return null
}

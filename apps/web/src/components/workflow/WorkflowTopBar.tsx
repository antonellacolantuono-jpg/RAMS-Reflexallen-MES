'use client'

import { useToast } from '@mes/ui'
import { useWorkflowStore } from './store'

export interface WorkflowTopBarProps {
  versionNumber?: number | null
  versionStatus?: string | null
  onPublishClick?: (() => void) | undefined
}

/**
 * Editor command bar per PROMPT_3d §3.10.
 *
 *   + Aggiungi Fase | Diff vs V{n} | Valida | Simula | Esporta | Pubblica V{n+1}
 *
 * - `+ Aggiungi Fase` opens the AddPhaseDrawer (D5).
 * - `Valida` opens the ValidateDrawer (D5).
 * - `Pubblica` triggers the existing approve-version flow (PROMPT_3b_FULL B).
 * - `Diff` / `Simula` / `Esporta` are placeholders that toast "in sviluppo".
 */
export function WorkflowTopBar({
  versionNumber,
  versionStatus,
  onPublishClick,
}: WorkflowTopBarProps) {
  const openAddPhaseDrawer = useWorkflowStore((s) => s.openAddPhaseDrawer)
  const openValidateDrawer = useWorkflowStore((s) => s.openValidateDrawer)
  const toast = useToast()

  const todoToast = () => toast.show('In sviluppo — disponibile in F2', 'info')

  const diffLabel =
    versionNumber != null && versionNumber > 1
      ? `Diff vs V${versionNumber - 1}`
      : 'Diff'

  const publishLabel =
    versionNumber != null ? `Pubblica V${versionNumber + 1}` : 'Pubblica'

  const canPublish = versionStatus === 'draft'

  return (
    <div
      className="inline-flex items-center gap-1.5"
      role="toolbar"
      aria-label="Comandi editor workflow"
      data-workflow-topbar
    >
      <button
        type="button"
        onClick={() => openAddPhaseDrawer()}
        className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-2"
      >
        + Aggiungi Fase
      </button>
      <button
        type="button"
        onClick={todoToast}
        className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        data-workflow-topbar-action="diff"
      >
        {diffLabel}
      </button>
      <button
        type="button"
        onClick={() => openValidateDrawer()}
        className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
      >
        Valida
      </button>
      <button
        type="button"
        onClick={todoToast}
        className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        data-workflow-topbar-action="simulate"
      >
        Simula
      </button>
      <button
        type="button"
        onClick={todoToast}
        className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        data-workflow-topbar-action="export"
      >
        Esporta
      </button>
      <button
        type="button"
        onClick={canPublish ? onPublishClick : undefined}
        disabled={!canPublish || !onPublishClick}
        className="rounded-md bg-ok px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        title={canPublish ? undefined : 'Pubblica disponibile solo per versioni in draft'}
      >
        {publishLabel}
      </button>
    </div>
  )
}

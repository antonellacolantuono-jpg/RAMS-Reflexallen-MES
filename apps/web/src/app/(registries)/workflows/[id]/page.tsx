'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels'
import { PageHeader, StatusBadge } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import { WorkflowCanvas } from '../../../../components/workflow/WorkflowCanvas'
import { WorkflowPalette } from '../../../../components/workflow/WorkflowPalette'
import { WorkflowInspector } from '../../../../components/workflow/WorkflowInspector'
import { ValidationPanel } from '../../../../components/workflow/ValidationPanel'
import { WorkflowValidationProvider } from '../../../../components/workflow/validation-context'
import { ApproveVersionModal } from '../../../../components/workflow/versioning/ApproveVersionModal'
import { DeprecateVersionModal } from '../../../../components/workflow/versioning/DeprecateVersionModal'
import { VersionHistorySidebar } from '../../../../components/workflow/versioning/VersionHistorySidebar'
import { AddStepDialog } from '../../../../components/workflow/AddStepDialog'
import { AddPhaseDrawer } from '../../../../components/workflow/AddPhaseDrawer'
import { AddGroupModal } from '../../../../components/workflow/AddGroupModal'
import { ValidateDrawer } from '../../../../components/workflow/ValidateDrawer'
import { WorkflowTopBar } from '../../../../components/workflow/WorkflowTopBar'
import { useWorkflowStore } from '../../../../components/workflow/store'

export default function WorkflowEditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [approveOpen, setApproveOpen] = useState(false)
  const [deprecateOpen, setDeprecateOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const addPhaseDrawer = useWorkflowStore((s) => s.addPhaseDrawer)
  const closeAddPhaseDrawer = useWorkflowStore((s) => s.closeAddPhaseDrawer)
  const addGroupModal = useWorkflowStore((s) => s.addGroupModal)
  const closeAddGroupModal = useWorkflowStore((s) => s.closeAddGroupModal)
  const validateDrawer = useWorkflowStore((s) => s.validateDrawer)
  const closeValidateDrawer = useWorkflowStore((s) => s.closeValidateDrawer)

  const { data: workflow, isLoading } = useQuery({
    queryKey: ['workflows', id],
    queryFn: () => sdk.workflows.get(id),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-400 text-sm">
        Caricamento…
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-400 text-sm">
        Flusso non trovato.{' '}
        <button
          type="button"
          className="ml-2 underline text-primary-600"
          onClick={() => router.push('/workflows')}
        >
          Torna alla lista
        </button>
      </div>
    )
  }

  const versionStatus = workflow.currentVersion?.status

  return (
    <WorkflowValidationProvider>
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-4 py-3 hairline-b flex items-center justify-between">
        <PageHeader
          title={`${workflow.code} — ${workflow.name}`}
          subtitle={
            workflow.currentVersion
              ? `v${workflow.currentVersion.version}`
              : 'Nessuna versione'
          }
        />
        <div className="flex items-center gap-2">
          {versionStatus && (
            <StatusBadge
              tone={
                versionStatus === 'approved'
                  ? 'ok'
                  : versionStatus === 'deprecated'
                    ? 'warn'
                    : 'neutral'
              }
            >
              {versionStatus}
            </StatusBadge>
          )}
          <WorkflowTopBar
            versionNumber={workflow.currentVersion?.version ?? null}
            versionStatus={versionStatus ?? null}
            onPublishClick={() => setApproveOpen(true)}
          />
          {(versionStatus === 'draft' || versionStatus === 'approved') && (
            <button
              type="button"
              onClick={() => setDeprecateOpen(true)}
              className="rounded-md border border-error-300 bg-white px-3 py-1.5 text-sm font-medium text-error-700 hover:bg-error-50"
            >
              Deprecata
            </button>
          )}
          {versionStatus === 'approved' && (
            <button
              type="button"
              onClick={() => router.push(`/workflows/${id}/release`)}
              className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
            >
              Rilascia WO
            </button>
          )}
          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {historyOpen ? 'Nascondi storico' : 'Storico'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
          <PanelGroup orientation="horizontal" className="h-full">
          {/* Wizard / Validation pane — 20% */}
          <Panel defaultSize={20} minSize={15}>
            <div className="h-full flex flex-col bg-[var(--paper-2)] hairline-r overflow-hidden">
              <div className="px-3 py-2 hairline-b flex-shrink-0">
                <span className="uppercase-label">Validazione</span>
              </div>
              <ValidationPanel />
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-neutral-200 hover:bg-primary-400 transition-colors cursor-col-resize" />

          {/* Palette pane — 20% */}
          <Panel defaultSize={20} minSize={15}>
            <div className="h-full flex flex-col bg-[var(--paper-1)] hairline-r overflow-hidden">
              <div className="px-3 py-2 hairline-b flex-shrink-0">
                <span className="uppercase-label">Palette</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <WorkflowPalette />
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-neutral-200 hover:bg-primary-400 transition-colors cursor-col-resize" />

          {/* Canvas pane — 35% */}
          <Panel defaultSize={35} minSize={25}>
            <div className="h-full flex flex-col bg-neutral-50 hairline-r overflow-hidden">
              <div className="px-3 py-2 hairline-b flex-shrink-0">
                <span className="uppercase-label">Canvas</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <WorkflowCanvas workflow={workflow} />
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-neutral-200 hover:bg-primary-400 transition-colors cursor-col-resize" />

          {/* Inspector pane — 25% */}
          <Panel defaultSize={25} minSize={20}>
            <div className="h-full flex flex-col bg-[var(--paper-2)] overflow-hidden">
              <div className="px-3 py-2 hairline-b shrink-0">
                <span className="uppercase-label">Inspector</span>
              </div>
              <div className="flex-1 flex flex-col overflow-hidden">
                <WorkflowInspector />
              </div>
            </div>
          </Panel>

          {historyOpen && (
            <>
              <PanelResizeHandle className="w-1 bg-neutral-200 hover:bg-primary-400 transition-colors cursor-col-resize" />
              <Panel defaultSize={20} minSize={15}>
                <VersionHistorySidebar
                  workflowId={id}
                  currentVersionId={workflow.currentVersionId}
                />
              </Panel>
            </>
          )}
          </PanelGroup>
      </div>

      {workflow.currentVersion && (
        <>
          <ApproveVersionModal
            open={approveOpen}
            onClose={() => setApproveOpen(false)}
            workflowId={id}
            versionId={workflow.currentVersion.id}
            versionNumber={workflow.currentVersion.version}
          />
          <DeprecateVersionModal
            open={deprecateOpen}
            onClose={() => setDeprecateOpen(false)}
            workflowId={id}
            versionId={workflow.currentVersion.id}
            versionNumber={workflow.currentVersion.version}
          />
        </>
      )}
      <AddStepDialog />
      <AddPhaseDrawer
        open={addPhaseDrawer.open}
        onClose={closeAddPhaseDrawer}
      />
      <AddGroupModal
        open={addGroupModal.open}
        onClose={closeAddGroupModal}
        phaseId={addGroupModal.phaseId}
      />
      <ValidateDrawer
        open={validateDrawer.open}
        onClose={closeValidateDrawer}
      />
    </div>
    </WorkflowValidationProvider>
  )
}

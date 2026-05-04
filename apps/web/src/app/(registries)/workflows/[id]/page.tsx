'use client'

import { useCallback, useState } from 'react'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels'
import type { ViewMode } from '@mes/ui'
import { PageHeader, StatusBadge, useRegistryView } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import { WorkflowCanvas } from '../../../../components/workflow/WorkflowCanvas'
import { WorkflowHierarchyTable } from '../../../../components/workflow/WorkflowHierarchyTable'
import { WorkflowCardView } from '../../../../components/workflow/WorkflowCardView'
import { WorkflowPalette } from '../../../../components/workflow/WorkflowPalette'
import { WorkflowInspector } from '../../../../components/workflow/WorkflowInspector'
import { ValidationPanel } from '../../../../components/workflow/ValidationPanel'
import { StepLivePreview } from '../../../../components/workflow/StepLivePreview'
import { WorkflowValidationProvider } from '../../../../components/workflow/validation-context'
import { ApproveVersionModal } from '../../../../components/workflow/versioning/ApproveVersionModal'
import { DeprecateVersionModal } from '../../../../components/workflow/versioning/DeprecateVersionModal'
import { VersionHistorySidebar } from '../../../../components/workflow/versioning/VersionHistorySidebar'
// PROMPT_15 B.3 — AddStepDialog replaced by StepConfiguratorPane (FourPaneConfigurator).
// AddStepDialog kept in tree as deprecated until TODO-071 removes it.
import { StepConfiguratorPane } from '../../../../components/workflow/configurator/StepConfiguratorPane'
import { AddPhaseDrawer } from '../../../../components/workflow/AddPhaseDrawer'
import { AddGroupModal } from '../../../../components/workflow/AddGroupModal'
import { ValidateDrawer } from '../../../../components/workflow/ValidateDrawer'
import { DeleteNodeDialog } from '../../../../components/workflow/DeleteNodeDialog'
import { WorkflowTopBar } from '../../../../components/workflow/WorkflowTopBar'
import { useWorkflowStore } from '../../../../components/workflow/store'

export default function WorkflowEditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [approveOpen, setApproveOpen] = useState(false)
  const [deprecateOpen, setDeprecateOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  // PROMPT_3c — Live Preview sidebar (operator's-eye view of selected step).
  // Defaults ON so engineers discover the feature; same toggle pattern as
  // the existing "Storico" Version History pane.
  const [previewOpen, setPreviewOpen] = useState(true)
  const addPhaseDrawer = useWorkflowStore((s) => s.addPhaseDrawer)
  const openAddPhaseDrawer = useWorkflowStore((s) => s.openAddPhaseDrawer)
  const closeAddPhaseDrawer = useWorkflowStore((s) => s.closeAddPhaseDrawer)
  const addGroupModal = useWorkflowStore((s) => s.addGroupModal)
  const closeAddGroupModal = useWorkflowStore((s) => s.closeAddGroupModal)
  const validateDrawer = useWorkflowStore((s) => s.validateDrawer)
  const closeValidateDrawer = useWorkflowStore((s) => s.closeValidateDrawer)

  // FIX-1 ESTESO — bidirectional URL sync (?view=list|card|flow). The hook is
  // framework-agnostic; we wire Next.js router here. `flow` is the default and
  // is represented by the absence of `?view=` to keep links short.
  const readViewFromUrl = useCallback((): ViewMode | null => {
    const raw = searchParams?.get('view') ?? null
    if (raw === 'list' || raw === 'card' || raw === 'flow') return raw
    return null
  }, [searchParams])
  const writeViewToUrl = useCallback(
    (next: ViewMode) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '')
      if (next === 'flow') params.delete('view')
      else params.set('view', next)
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  // PROMPT_VIEWSWITCHER_WORKFLOWS — 3-mode toggle (Flusso default + Tabella + Card).
  // The canvas stays mounted even when not active so its useEffect keeps the
  // store's nodes[] seeded — Inspector + Live Preview lookups continue to work
  // when the engineer clicks rows in Tabella or cards in Card view.
  const { view: workflowView, switcher: workflowSwitcher } = useRegistryView({
    registryId: 'workflows',
    availableViews: ['flow', 'list', 'card'],
    defaultView: 'flow',
    labels: { list: 'Tabella' },
    urlSync: { read: readViewFromUrl, write: writeViewToUrl },
  })

  // FIX-1 ESTESO — non-Flusso modes drop Validation + Palette to give the
  // table/cards full-width center. In Flusso, the Palette is the entry point
  // for adding nodes (drag-drop); in Tabella/Card, expose an explicit "+ Nuova
  // Fase" header button that opens the existing AddPhaseDrawer.
  const isFlow = workflowView === 'flow'

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
          {!isFlow && (
            <button
              type="button"
              onClick={openAddPhaseDrawer}
              className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
              data-testid="header-add-phase"
            >
              + Nuova Fase
            </button>
          )}
          {workflowSwitcher}
          <button
            type="button"
            onClick={() => setPreviewOpen((v) => !v)}
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            data-testid="toggle-live-preview"
          >
            {previewOpen ? 'Nascondi anteprima' : 'Anteprima'}
          </button>
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
          {isFlow && (
            <>
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
            </>
          )}

          {/* Canvas / Tabella / Card pane — 35% in Flusso, ~50% in Tabella/Card. */}
          <Panel defaultSize={isFlow ? 35 : 53} minSize={25}>
            <div className="h-full flex flex-col bg-neutral-50 hairline-r overflow-hidden">
              <div className="px-3 py-2 hairline-b flex-shrink-0">
                <span className="uppercase-label">
                  {workflowView === 'flow'
                    ? 'Canvas'
                    : workflowView === 'list'
                      ? 'Tabella'
                      : 'Schede'}
                </span>
              </div>
              <div className="flex-1 overflow-hidden relative">
                {/* Canvas always mounted so the workflow store's nodes[] stays
                    seeded for Inspector + Live Preview, regardless of which
                    view is active. Hidden via `display:none` when not in
                    flow mode — preserves auto-save, history, keyboard wiring. */}
                <div className={isFlow ? 'h-full' : 'hidden'}>
                  <WorkflowCanvas workflow={workflow} />
                </div>
                {workflowView === 'list' && (
                  <WorkflowHierarchyTable workflow={workflow} />
                )}
                {workflowView === 'card' && (
                  <WorkflowCardView workflow={workflow} />
                )}
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

          {previewOpen && (
            <>
              <PanelResizeHandle className="w-1 bg-neutral-200 hover:bg-primary-400 transition-colors cursor-col-resize" />
              <Panel defaultSize={22} minSize={18}>
                <StepLivePreview />
              </Panel>
            </>
          )}

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
      <StepConfiguratorPane />
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
      <DeleteNodeDialog />
    </div>
    </WorkflowValidationProvider>
  )
}

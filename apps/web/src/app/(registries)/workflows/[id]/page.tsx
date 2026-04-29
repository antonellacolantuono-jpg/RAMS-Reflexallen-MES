'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels'
import { PageHeader, StatusBadge } from '@mes/ui'
import { sdk } from '../../../../lib/sdk'
import { WorkflowCanvas } from '../../../../components/workflow/WorkflowCanvas'
import { WorkflowPalette } from '../../../../components/workflow/WorkflowPalette'
import { StepConfigurator } from '../../../../components/workflow/forms/StepConfigurator'

export default function WorkflowEditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

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
      </div>

      <div className="flex-1 overflow-hidden">
        <PanelGroup orientation="horizontal" className="h-full">
          {/* Wizard pane — 20% */}
          <Panel defaultSize={20} minSize={15}>
            <div className="h-full flex flex-col bg-[var(--paper-2)] hairline-r overflow-y-auto">
              <div className="px-3 py-2 hairline-b">
                <span className="uppercase-label">Fasi</span>
              </div>
              <div className="flex-1 flex items-center justify-center text-neutral-400 text-xs p-4 text-center">
                Wizard fasi<br />(disponibile in D5)
              </div>
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

          {/* Configurator pane — 25% */}
          <Panel defaultSize={25} minSize={20}>
            <div className="h-full flex flex-col bg-[var(--paper-2)] overflow-y-auto">
              <div className="px-3 py-2 hairline-b">
                <span className="uppercase-label">Configuratore</span>
              </div>
              <div className="flex-1 flex flex-col">
                <StepConfigurator />
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}

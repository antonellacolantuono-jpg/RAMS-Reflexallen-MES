'use client'

import { AuditTimeline, EmptyState } from '@mes/ui'
import type { AuditTimelineEntry } from '@mes/ui'
import { useWorkflowStore } from '../store'
import { loadAuditTimeline } from '../../../lib/audit-adapter'

export function AuditTab() {
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId)
  const selectedNodeType = useWorkflowStore((s) => s.selectedNodeType)

  if (!selectedNodeId) {
    return (
      <div className="p-3" data-tab-content="audit">
        <EmptyState
          kind="no-data"
          title="Nessuna attività registrata"
          body="Seleziona un nodo per vederne lo storico."
          compact
        />
      </div>
    )
  }

  const entityType: 'Phase' | 'Group' | 'Step' =
    selectedNodeType === 'phaseNode'
      ? 'Phase'
      : selectedNodeType === 'groupNode'
        ? 'Group'
        : 'Step'

  const entries: AuditTimelineEntry[] = loadAuditTimeline({
    entityType,
    entityId: selectedNodeId,
  })

  if (entries.length === 0) {
    return (
      <div className="p-3" data-tab-content="audit">
        <EmptyState kind="no-data" title="Nessuna attività registrata" compact />
      </div>
    )
  }

  return (
    <div className="p-3" data-tab-content="audit">
      <AuditTimeline entries={entries} />
    </div>
  )
}

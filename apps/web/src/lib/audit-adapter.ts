import type { AuditTimelineEntry } from '@mes/ui'

/**
 * STUB — returns an empty timeline. Tracked by TODO-033 (full adapter from
 * audit-log API rows to AuditTimelineEntry, owned by F2 / PROMPT_7 / PROMPT_9).
 *
 * The shape mirrors the eventual API: caller passes entityType + entityId
 * (e.g., 'Step' + 'step-uuid') and gets back the timeline entries. Today the
 * stub returns [] regardless so the AuditTab can render its EmptyState.
 */
export function loadAuditTimeline(_params: {
  entityType: 'Workflow' | 'Phase' | 'Group' | 'Step'
  entityId: string
}): AuditTimelineEntry[] {
  return []
}

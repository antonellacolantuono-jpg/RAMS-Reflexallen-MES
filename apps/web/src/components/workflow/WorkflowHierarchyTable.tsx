'use client'

// PROMPT_VIEWSWITCHER_WORKFLOWS — hierarchical Tabella view of a workflow.
// Renders the immutable Phase > Group > Step tree as a flat indented HTML
// table. Click on any row drives `useWorkflowStore.selectNode(id, kind)` so
// the existing Inspector + Live Preview stay in sync regardless of view
// mode. In `readOnly` mode (used by the WO Detail snapshot tab) row clicks
// are no-ops.

import { Fragment, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { WorkflowModel } from '@mes/sdk'
import { Badge } from '@mes/ui'
import { useWorkflowStore } from './store'
import { phaseColor } from '../../lib/phase-color'

type SelectableKind = 'phaseNode' | 'groupNode' | 'stepNode'

interface RowProps {
  id: string
  kind: SelectableKind
  level: number
  hasChildren: boolean
  expanded: boolean
  toggleExpanded: () => void
  selected: boolean
  onSelect: () => void
  borderColor?: string
  name: string
  type: string
  durationSec: number
  autoBadge?: boolean
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return '—'
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const rem = seconds % 60
  if (minutes < 60) return rem === 0 ? `${minutes}m` : `${minutes}m ${rem}s`
  const hours = Math.floor(minutes / 60)
  const mRem = minutes % 60
  return mRem === 0 ? `${hours}h` : `${hours}h ${mRem}m`
}

function HierarchyRow({
  id,
  kind,
  level,
  hasChildren,
  expanded,
  toggleExpanded,
  selected,
  onSelect,
  borderColor,
  name,
  type,
  durationSec,
  autoBadge,
}: RowProps) {
  const indentPx = 8 + level * 16
  const Chevron = hasChildren ? (expanded ? ChevronDown : ChevronRight) : null
  return (
    <tr
      data-testid={`row-${kind}-${id}`}
      data-selected={selected ? 'true' : 'false'}
      onClick={onSelect}
      className={[
        'cursor-pointer transition-colors',
        selected
          ? 'bg-accent-soft text-accent-ink'
          : 'hover:bg-paper-2',
      ].join(' ')}
      style={borderColor ? { boxShadow: `inset 3px 0 0 0 ${borderColor}` } : undefined}
    >
      <td className="py-1.5 pr-3 align-middle">
        <div className="flex items-center gap-1.5" style={{ paddingLeft: indentPx }}>
          {Chevron ? (
            <button
              type="button"
              aria-label={expanded ? 'Comprimi' : 'Espandi'}
              data-testid={`chevron-${id}`}
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded()
              }}
              className="p-0.5 rounded hover:bg-paper-3 text-ink-3"
            >
              <Chevron size={14} />
            </button>
          ) : (
            <span className="w-[22px]" aria-hidden />
          )}
          <span className={kind === 'phaseNode' ? 'font-semibold text-sm' : 'text-sm'}>
            {name}
          </span>
        </div>
      </td>
      <td className="py-1.5 px-3 align-middle text-xs text-ink-3 font-mono whitespace-nowrap">
        {type}
      </td>
      <td className="py-1.5 px-3 align-middle text-xs text-ink-2 tabular whitespace-nowrap">
        {formatDuration(durationSec)}
      </td>
      <td className="py-1.5 px-3 align-middle whitespace-nowrap">
        {autoBadge && (
          <Badge tone="accent" className="!text-[10px]">
            AUTO
          </Badge>
        )}
      </td>
    </tr>
  )
}

export interface WorkflowHierarchyTableProps {
  workflow: WorkflowModel
  /** When true, row clicks are inert (used by WO Detail snapshot tab). */
  readOnly?: boolean
}

export function WorkflowHierarchyTable({ workflow, readOnly = false }: WorkflowHierarchyTableProps) {
  const phases = useMemo(
    () => workflow.currentVersion?.phases ?? [],
    [workflow.currentVersion],
  )
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId)
  const selectNode = useWorkflowStore((s) => s.selectNode)

  // Default: all phases + groups expanded.
  const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(new Set())
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const togglePhase = (id: string) => {
    setCollapsedPhases((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleGroup = (id: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const totals = useMemo(() => {
    const phaseTotals = new Map<string, number>()
    const groupTotals = new Map<string, number>()
    for (const phase of phases) {
      let pSum = 0
      for (const group of phase.groups) {
        const gSum = group.steps.reduce(
          (acc, s) => acc + (s.standardTimeSec ?? 0),
          0,
        )
        groupTotals.set(group.id, gSum)
        pSum += gSum
      }
      phaseTotals.set(phase.id, pSum)
    }
    return { phaseTotals, groupTotals }
  }, [phases])

  const handleSelect = (id: string, kind: SelectableKind) => {
    if (readOnly) return
    selectNode(id, kind)
  }

  if (phases.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-full text-sm text-ink-3 px-6 text-center"
        data-testid="empty-state"
      >
        Nessuna fase nel workflow. Aggiungi una fase dalla palette per iniziare.
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-sm" data-testid="workflow-hierarchy-table">
        <thead className="sticky top-0 bg-paper z-10 border-b border-line">
          <tr className="text-left text-[11px] uppercase tracking-wide text-ink-3">
            <th className="py-2 pl-3 pr-3 font-medium">Nome</th>
            <th className="py-2 px-3 font-medium">Tipo</th>
            <th className="py-2 px-3 font-medium">Durata</th>
            <th className="py-2 px-3 font-medium">Stato</th>
          </tr>
        </thead>
        <tbody>
          {phases.map((phase) => {
            const phaseExpanded = !collapsedPhases.has(phase.id)
            const phaseBorder = phaseColor(phase.category)
            return (
              <Fragment key={`phase-${phase.id}`}>
                <HierarchyRow
                  id={phase.id}
                  kind="phaseNode"
                  level={0}
                  hasChildren={phase.groups.length > 0}
                  expanded={phaseExpanded}
                  toggleExpanded={() => togglePhase(phase.id)}
                  selected={selectedNodeId === phase.id}
                  onSelect={() => handleSelect(phase.id, 'phaseNode')}
                  borderColor={phaseBorder}
                  name={phase.name}
                  type="Phase"
                  durationSec={totals.phaseTotals.get(phase.id) ?? 0}
                  autoBadge={phase.isAutoGenerated}
                />
                {phaseExpanded &&
                  phase.groups.map((group) => {
                    const groupExpanded = !collapsedGroups.has(group.id)
                    return (
                      <Fragment key={`group-${group.id}`}>
                        <HierarchyRow
                          id={group.id}
                          kind="groupNode"
                          level={1}
                          hasChildren={group.steps.length > 0}
                          expanded={groupExpanded}
                          toggleExpanded={() => toggleGroup(group.id)}
                          selected={selectedNodeId === group.id}
                          onSelect={() => handleSelect(group.id, 'groupNode')}
                          name={group.name}
                          type="Group"
                          durationSec={totals.groupTotals.get(group.id) ?? 0}
                          autoBadge={group.isAutoGenerated}
                        />
                        {groupExpanded &&
                          group.steps.map((step) => (
                            <HierarchyRow
                              key={`step-${step.id}`}
                              id={step.id}
                              kind="stepNode"
                              level={2}
                              hasChildren={false}
                              expanded={false}
                              toggleExpanded={() => undefined}
                              selected={selectedNodeId === step.id}
                              onSelect={() => handleSelect(step.id, 'stepNode')}
                              name={step.name}
                              type={step.actionType ?? step.category}
                              durationSec={step.standardTimeSec ?? 0}
                            />
                          ))}
                      </Fragment>
                    )
                  })}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

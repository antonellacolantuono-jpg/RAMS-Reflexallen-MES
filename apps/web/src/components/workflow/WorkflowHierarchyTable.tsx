'use client'

// PROMPT_VIEWSWITCHER_WORKFLOWS — hierarchical Tabella view of a workflow.
// Renders the immutable Phase > Group > Step tree as a flat indented HTML
// table. Click on any row drives `useWorkflowStore.selectNode(id, kind)` so
// the existing Inspector + Live Preview stay in sync regardless of view
// mode. In `readOnly` mode (used by the WO Detail snapshot tab) row clicks
// are no-ops.

import { Fragment, useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { WorkflowModel, EquipmentNodeModel } from '@mes/sdk'
import { Badge, ImageDisplay, type ImageDisplayCategory } from '@mes/ui'
import { sdk } from '../../lib/sdk'
import { useWorkflowStore } from './store'
import { phaseColor } from '../../lib/phase-color'
import { parseStepData } from './save-payload'

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
  actionsNode?: ReactNode
  imageUrl?: string | null
  imageCategory?: ImageDisplayCategory
  workUnitLabel?: string | null
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
  actionsNode,
  imageUrl,
  imageCategory,
  workUnitLabel,
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
          {imageCategory && (
            <ImageDisplay
              src={imageUrl ?? null}
              alt={name}
              size="thumbnail"
              iconCategory={imageCategory}
              entityName={name}
            />
          )}
          <span className={kind === 'phaseNode' ? 'font-semibold text-sm' : 'text-sm'}>
            {name}
          </span>
        </div>
      </td>
      <td className="py-1.5 px-3 align-middle text-xs text-ink-3 font-mono whitespace-nowrap">
        {type}
      </td>
      <td className="py-1.5 px-3 align-middle text-xs text-ink-2 whitespace-nowrap" data-testid={`row-postazione-${id}`}>
        {workUnitLabel ? (
          <span className="rounded bg-primary-50 px-1.5 py-0.5 text-[11px] font-medium text-primary-700">
            📍 {workUnitLabel}
          </span>
        ) : (
          <span className="text-ink-4">—</span>
        )}
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
      <td className="py-1.5 px-3 align-middle whitespace-nowrap text-right">
        {actionsNode ? (
          <div className="inline-flex items-center gap-1 justify-end">{actionsNode}</div>
        ) : null}
      </td>
    </tr>
  )
}

interface ActionButtonProps {
  label: string
  testId: string
  onClick: () => void
  Icon: typeof Pencil
  tone?: 'default' | 'danger'
}

function RowActionButton({ label, testId, onClick, Icon, tone = 'default' }: ActionButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      data-testid={testId}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={
        tone === 'danger'
          ? 'p-1 rounded text-error-600 hover:text-error-700 hover:bg-error-50'
          : 'p-1 rounded text-ink-3 hover:text-ink hover:bg-paper-3'
      }
    >
      <Icon size={14} />
    </button>
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
  // PROMPT_15 C.5 — Hydrate workUnit code+name for the Postazione column from
  // the plant equipment tree. Single shared query (cached via TanStack key).
  const { data: equipmentTree } = useQuery({
    queryKey: ['equipment', 'tree'],
    queryFn: () => sdk.equipment.tree(),
  })
  const workUnitById = useMemo(() => {
    const out = new Map<string, { code: string; name: string }>()
    function walk(nodes: EquipmentNodeModel[]) {
      for (const n of nodes) {
        if (n.level === 'work_unit') out.set(n.id, { code: n.code, name: n.name })
        if (n.children) walk(n.children)
      }
    }
    if (equipmentTree) walk(equipmentTree)
    return out
  }, [equipmentTree])
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId)
  const selectNode = useWorkflowStore((s) => s.selectNode)
  const openAddGroupModal = useWorkflowStore((s) => s.openAddGroupModal)
  const openAddStepDialog = useWorkflowStore((s) => s.openAddStepDialog)
  const openDeleteConfirm = useWorkflowStore((s) => s.openDeleteConfirm)

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
            <th className="py-2 px-3 font-medium">Postazione</th>
            <th className="py-2 px-3 font-medium">Durata</th>
            <th className="py-2 px-3 font-medium">Stato</th>
            <th className="py-2 px-3 font-medium text-right" style={{ width: 110 }}>
              {readOnly ? '' : 'Azioni'}
            </th>
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
                  imageUrl={phase.imageUrl ?? null}
                  imageCategory="phase"
                  actionsNode={
                    readOnly ? null : (
                      <>
                        <RowActionButton
                          label="Aggiungi gruppo"
                          testId={`row-add-group-${phase.id}`}
                          onClick={() => openAddGroupModal(phase.id)}
                          Icon={Plus}
                        />
                        <RowActionButton
                          label="Modifica"
                          testId={`row-edit-${phase.id}`}
                          onClick={() => selectNode(phase.id, 'phaseNode')}
                          Icon={Pencil}
                        />
                        <RowActionButton
                          label="Elimina"
                          testId={`row-delete-${phase.id}`}
                          onClick={() => openDeleteConfirm(phase.id, 'phaseNode')}
                          Icon={Trash2}
                          tone="danger"
                        />
                      </>
                    )
                  }
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
                          actionsNode={
                            readOnly ? null : (
                              <>
                                <RowActionButton
                                  label="Aggiungi step"
                                  testId={`row-add-step-${group.id}`}
                                  onClick={() => openAddStepDialog({ groupId: group.id })}
                                  Icon={Plus}
                                />
                                <RowActionButton
                                  label="Modifica"
                                  testId={`row-edit-${group.id}`}
                                  onClick={() => selectNode(group.id, 'groupNode')}
                                  Icon={Pencil}
                                />
                                <RowActionButton
                                  label="Elimina"
                                  testId={`row-delete-${group.id}`}
                                  onClick={() => openDeleteConfirm(group.id, 'groupNode')}
                                  Icon={Trash2}
                                  tone="danger"
                                />
                              </>
                            )
                          }
                        />
                        {groupExpanded &&
                          group.steps.map((step) => {
                            const stepData = parseStepData(step.data ?? null)
                            const wu = step.workUnitId ? workUnitById.get(step.workUnitId) : null
                            return (
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
                              imageUrl={stepData?.photoUrl ?? null}
                              imageCategory="step"
                              workUnitLabel={wu ? wu.code : null}
                              actionsNode={
                                readOnly ? null : (
                                  <>
                                    <RowActionButton
                                      label="Modifica"
                                      testId={`row-edit-${step.id}`}
                                      onClick={() => selectNode(step.id, 'stepNode')}
                                      Icon={Pencil}
                                    />
                                    <RowActionButton
                                      label="Elimina"
                                      testId={`row-delete-${step.id}`}
                                      onClick={() => openDeleteConfirm(step.id, 'stepNode')}
                                      Icon={Trash2}
                                      tone="danger"
                                    />
                                  </>
                                )
                              }
                            />
                            )
                          })}
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

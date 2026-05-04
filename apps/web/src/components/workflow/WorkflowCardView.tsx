'use client'

// PROMPT_VIEWSWITCHER_WORKFLOWS — vertical card view of a workflow.
// Cards are grouped by phase: each phase gets a header card with accent color
// + counts, followed by one card per step (group name shown inline).
// Click on a step card drives `useWorkflowStore.selectNode(id, 'stepNode')`
// so Inspector + Live Preview stay in sync regardless of view mode.

import type { ReactNode } from 'react'
import { Pencil, Plus, Trash2, type LucideIcon } from 'lucide-react'
import type { WorkflowModel, WorkflowStepModel } from '@mes/sdk'
import { Badge } from '@mes/ui'
import { useWorkflowStore } from './store'
import { phaseColor } from '../../lib/phase-color'

interface CardActionButtonProps {
  label: string
  testId: string
  onClick: () => void
  Icon: LucideIcon
  tone?: 'default' | 'danger'
}

function CardActionButton({ label, testId, onClick, Icon, tone = 'default' }: CardActionButtonProps) {
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

interface StepCardProps {
  step: WorkflowStepModel
  groupName: string
  selected: boolean
  onSelect: () => void
  actionsNode?: ReactNode
}

function StepCard({ step, groupName, selected, onSelect, actionsNode }: StepCardProps) {
  return (
    <div
      onClick={onSelect}
      data-testid={`card-step-${step.id}`}
      data-selected={selected ? 'true' : 'false'}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      className={[
        'block w-full text-left rounded-md border p-3 transition-colors cursor-pointer',
        selected
          ? 'border-accent bg-accent-soft text-accent-ink ring-1 ring-accent'
          : 'border-line bg-paper hover:bg-paper-2',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{step.name}</div>
          <div className="text-[11px] text-ink-3 mt-0.5 truncate">{groupName}</div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Badge tone="neutral" className="!text-[10px]">
            {step.actionType ?? step.category}
          </Badge>
          {actionsNode}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[11px] text-ink-3 tabular">
        <span>Durata: {formatDuration(step.standardTimeSec)}</span>
      </div>
    </div>
  )
}

export interface WorkflowCardViewProps {
  workflow: WorkflowModel
}

export function WorkflowCardView({ workflow }: WorkflowCardViewProps) {
  const phases = workflow.currentVersion?.phases ?? []
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId)
  const selectNode = useWorkflowStore((s) => s.selectNode)
  const openAddGroupModal = useWorkflowStore((s) => s.openAddGroupModal)
  const openAddStepDialog = useWorkflowStore((s) => s.openAddStepDialog)
  const openDeleteConfirm = useWorkflowStore((s) => s.openDeleteConfirm)

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
    <div className="h-full overflow-auto p-3 space-y-4" data-testid="workflow-card-view">
      {phases.map((phase) => {
        const totalSteps = phase.groups.reduce((acc, g) => acc + g.steps.length, 0)
        const totalDuration = phase.groups.reduce(
          (acc, g) => acc + g.steps.reduce((s, st) => s + (st.standardTimeSec ?? 0), 0),
          0,
        )
        const accent = phaseColor(phase.category)
        return (
          <section key={`phase-${phase.id}`} data-testid={`phase-section-${phase.id}`}>
            <div
              className="rounded-md border border-line bg-paper px-3 py-2 mb-2"
              style={{ borderLeft: `3px solid ${accent}` }}
              data-testid={`phase-header-${phase.id}`}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{phase.name}</span>
                {phase.isAutoGenerated && (
                  <Badge tone="accent" className="!text-[10px]">
                    AUTO
                  </Badge>
                )}
                <span className="ml-auto font-mono text-[11px] text-ink-3">
                  {totalSteps} step · {formatDuration(totalDuration)}
                </span>
                <div className="flex items-center gap-1">
                  <CardActionButton
                    label="Aggiungi gruppo"
                    testId={`card-add-group-${phase.id}`}
                    onClick={() => openAddGroupModal(phase.id)}
                    Icon={Plus}
                  />
                  <CardActionButton
                    label="Modifica"
                    testId={`card-edit-${phase.id}`}
                    onClick={() => selectNode(phase.id, 'phaseNode')}
                    Icon={Pencil}
                  />
                  <CardActionButton
                    label="Elimina"
                    testId={`card-delete-${phase.id}`}
                    onClick={() => openDeleteConfirm(phase.id, 'phaseNode')}
                    Icon={Trash2}
                    tone="danger"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pl-3">
              {phase.groups.length === 0 && (
                <div className="text-[11px] text-ink-3 italic px-2 py-1.5">
                  Nessun gruppo in questa fase.
                </div>
              )}
              {phase.groups.map((group) => (
                <div
                  key={`group-${group.id}`}
                  data-testid={`card-group-section-${group.id}`}
                  className="space-y-2"
                >
                  <div
                    className="flex items-center gap-2 px-2 py-1 text-[11px] uppercase tracking-wide text-ink-3"
                    data-testid={`card-group-header-${group.id}`}
                  >
                    <span className="font-semibold">{group.name}</span>
                    <span className="font-mono">· {group.steps.length} step</span>
                    <div className="ml-auto flex items-center gap-1">
                      <CardActionButton
                        label="Aggiungi step"
                        testId={`card-add-step-${group.id}`}
                        onClick={() => openAddStepDialog({ groupId: group.id })}
                        Icon={Plus}
                      />
                      <CardActionButton
                        label="Modifica"
                        testId={`card-edit-${group.id}`}
                        onClick={() => selectNode(group.id, 'groupNode')}
                        Icon={Pencil}
                      />
                      <CardActionButton
                        label="Elimina"
                        testId={`card-delete-${group.id}`}
                        onClick={() => openDeleteConfirm(group.id, 'groupNode')}
                        Icon={Trash2}
                        tone="danger"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {group.steps.length === 0 && (
                      <div className="text-[11px] text-ink-3 italic px-2 py-1">
                        Nessuno step in questo gruppo.
                      </div>
                    )}
                    {group.steps.map((step) => (
                      <StepCard
                        key={`step-${step.id}`}
                        step={step}
                        groupName={group.name}
                        selected={selectedNodeId === step.id}
                        onSelect={() => selectNode(step.id, 'stepNode')}
                        actionsNode={
                          <>
                            <CardActionButton
                              label="Modifica"
                              testId={`card-edit-${step.id}`}
                              onClick={() => selectNode(step.id, 'stepNode')}
                              Icon={Pencil}
                            />
                            <CardActionButton
                              label="Elimina"
                              testId={`card-delete-${step.id}`}
                              onClick={() => openDeleteConfirm(step.id, 'stepNode')}
                              Icon={Trash2}
                              tone="danger"
                            />
                          </>
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

import { Handle, Position } from '@xyflow/react'
import type { NodeProps, Node } from '@xyflow/react'
import {
  isStepCategoryAllowedInGroup,
  mapPaletteCategoryToStepCategory,
  type StepCategoryId,
} from '@mes/domain'
import { useWorkflowStore } from '../store'
import { NodeErrorBadge } from './NodeErrorBadge'

export type GroupNodeData = {
  label: string
  category: string
  order: number
  parentId?: string
  supportsParallel?: boolean
  supportsRecovery?: boolean
}

export type GroupNodeType = Node<GroupNodeData, 'groupNode'>

export function GroupNode({ id, data }: NodeProps<GroupNodeType>) {
  const dragSource = useWorkflowStore((s) => s.dragSource)

  let dropState: 'idle' | 'eligible' | 'ineligible' = 'idle'
  if (dragSource) {
    if (dragSource.source === 'category') {
      const schemaCategory = mapPaletteCategoryToStepCategory(
        dragSource.id as StepCategoryId,
      )
      dropState =
        schemaCategory && isStepCategoryAllowedInGroup(data.category, schemaCategory)
          ? 'eligible'
          : 'ineligible'
    } else {
      // Step kinds are orthogonal to step category — eligible by default.
      dropState = 'eligible'
    }
  }

  const stateClass =
    dropState === 'eligible'
      ? 'border-primary-500 ring-2 ring-primary-300 ring-offset-1'
      : dropState === 'ineligible'
        ? 'border-neutral-200 opacity-40'
        : 'border-neutral-300'

  const supportsParallel = data.supportsParallel === true
  const supportsRecovery = data.supportsRecovery === true
  const groupCode = `GR-${String(data.order).padStart(2, '0')}`

  return (
    <div
      className={`rounded-md border bg-white shadow-sm transition-all ${stateClass}`}
      style={{ width: 272 }}
      data-drop-state={dropState}
      data-node-kind="group"
    >
      <Handle type="target" position={Position.Top} />
      <div className="px-2.5 py-1.5">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wide text-neutral-500">
            {groupCode}
          </span>
          <span className="flex items-center gap-1">
            {supportsParallel && (
              <span
                className="rounded bg-info-50 border border-info-200 px-1 py-0.5 text-[9px] uppercase tracking-wide text-info-700"
                title="Supporta operazioni parallele"
              >
                P
              </span>
            )}
            {supportsRecovery && (
              <span
                className="rounded bg-warn-50 border border-warn-200 px-1 py-0.5 text-[9px] uppercase tracking-wide text-warn-700"
                title="Supporta recovery"
              >
                R
              </span>
            )}
            <NodeErrorBadge nodeId={id} />
          </span>
        </div>
        <div className="mt-0.5 text-sm font-medium text-neutral-800 truncate">
          {data.label}
        </div>
        <div className="text-[10px] text-neutral-500 truncate">
          {data.category.replace(/_/g, ' ')}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

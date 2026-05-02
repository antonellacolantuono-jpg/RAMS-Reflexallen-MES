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

  return (
    <div
      className={`rounded-md border bg-white px-3 py-2 min-w-[140px] shadow-sm transition-all ${stateClass}`}
      data-drop-state={dropState}
    >
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
          Gruppo {data.order}
        </span>
        <NodeErrorBadge nodeId={id} />
      </div>
      <div className="text-sm font-medium text-neutral-700">{data.label}</div>
      <div className="text-[10px] text-neutral-400 mt-0.5">
        {data.category.replace(/_/g, ' ')}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

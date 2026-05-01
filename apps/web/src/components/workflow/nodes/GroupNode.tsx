import { Handle, Position } from '@xyflow/react'
import type { NodeProps, Node } from '@xyflow/react'
import { NodeErrorBadge } from './NodeErrorBadge'

export type GroupNodeData = {
  label: string
  category: string
  order: number
  parentId?: string
}

export type GroupNodeType = Node<GroupNodeData, 'groupNode'>

export function GroupNode({ id, data }: NodeProps<GroupNodeType>) {
  return (
    <div className="rounded-md border border-neutral-300 bg-white px-3 py-2 min-w-[140px] shadow-sm">
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

import { Handle, Position } from '@xyflow/react'
import type { NodeProps, Node } from '@xyflow/react'
import { NodeErrorBadge } from './NodeErrorBadge'

export type PhaseNodeData = {
  label: string
  category: string
  order: number
}

export type PhaseNodeType = Node<PhaseNodeData, 'phaseNode'>

const PHASE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  inbound:         { bg: 'bg-blue-50',   border: 'border-blue-400',   text: 'text-blue-800' },
  setup:           { bg: 'bg-amber-50',  border: 'border-amber-400',  text: 'text-amber-800' },
  production:      { bg: 'bg-green-50',  border: 'border-green-500',  text: 'text-green-800' },
  quality_control: { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-800' },
  outbound:        { bg: 'bg-cyan-50',   border: 'border-cyan-400',   text: 'text-cyan-800' },
  teardown:        { bg: 'bg-gray-100',  border: 'border-gray-400',   text: 'text-gray-700' },
}

export function PhaseNode({ id, data }: NodeProps<PhaseNodeType>) {
  const colors = PHASE_COLORS[data.category] ?? {
    bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700',
  }

  return (
    <div className={`rounded-lg border-2 px-4 py-2 min-w-[160px] ${colors.bg} ${colors.border}`}>
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          Fase {data.order}
        </span>
        <NodeErrorBadge nodeId={id} />
      </div>
      <div className={`text-sm font-semibold ${colors.text}`}>{data.label}</div>
      <div className="text-[10px] text-gray-400 mt-0.5">
        {data.category.replace(/_/g, ' ')}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

import { Handle, Position } from '@xyflow/react'
import type { NodeProps, Node } from '@xyflow/react'
import { NodeErrorBadge } from './NodeErrorBadge'

export type PhaseNodeData = {
  label: string
  category: string
  order: number
  isCycleBased?: boolean
}

export type PhaseNodeType = Node<PhaseNodeData, 'phaseNode'>

const PHASE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  inbound: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-800' },
  setup: { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-800' },
  production: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-800' },
  quality_control: { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-800' },
  outbound: { bg: 'bg-cyan-50', border: 'border-cyan-400', text: 'text-cyan-800' },
  teardown: { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700' },
}

const PHASE_ICONS: Record<string, string> = {
  inbound: '📥',
  setup: '🔧',
  production: '⚙️',
  quality_control: '🎯',
  outbound: '📤',
  teardown: '✅',
}

export function PhaseNode({ id, data }: NodeProps<PhaseNodeType>) {
  const colors =
    PHASE_COLORS[data.category] ?? {
      bg: 'bg-gray-50',
      border: 'border-gray-300',
      text: 'text-gray-700',
    }
  const icon = PHASE_ICONS[data.category] ?? '◼'
  const phaseCode = `PH-${String(data.order).padStart(2, '0')}`

  return (
    <div
      className={`rounded-lg border-2 ${colors.bg} ${colors.border} shadow-sm`}
      style={{ width: 296, minHeight: 64 }}
      data-node-kind="phase"
    >
      <Handle type="target" position={Position.Top} />
      <div className="px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono font-semibold text-neutral-500 tracking-wide">
            {phaseCode}
          </span>
          <span className="flex items-center gap-1">
            {data.isCycleBased && (
              <span
                className="rounded bg-white/60 border border-current/20 px-1 py-0.5 text-[9px] uppercase tracking-wide text-neutral-600"
                title="La fase si ripete per ogni pezzo"
              >
                Ciclo
              </span>
            )}
            <NodeErrorBadge nodeId={id} />
          </span>
        </div>
        <div className="mt-1 flex items-start gap-2">
          <span className="text-lg leading-none" aria-hidden>
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <div className={`text-sm font-semibold leading-tight ${colors.text} truncate`}>
              {data.label}
            </div>
            <div className="text-[10px] text-neutral-500 truncate">
              {data.category.replace(/_/g, ' ')}
            </div>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

import { BaseEdge, getBezierPath } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'

/**
 * Sequential edge — visually aligned with @mes/ui CanvasEdge (bezier curve,
 * neutral ink stroke, subtle 1.25px width). React Flow integration constraints
 * mean we keep this as a React Flow custom edge component rather than using
 * the standalone @mes/ui Edge component directly.
 */
export function SequentialEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{ stroke: 'var(--ink-3)', strokeWidth: 1.25 }}
    />
  )
}

import type { Node } from '@xyflow/react'
import {
  layoutPhaseColumns,
  type LayoutNode,
  type LayoutNodeKind,
} from '@mes/domain'

/**
 * Adapter: convert React Flow nodes into the abstract LayoutNode shape used by
 * the @mes/domain layout algorithm, run the layout, and merge positions back.
 */
export function applyPhaseColumnsLayout(nodes: Node[]): Node[] {
  const layoutNodes: LayoutNode[] = nodes.map((n) => {
    const kind: LayoutNodeKind =
      n.type === 'phaseNode' ? 'phase' : n.type === 'groupNode' ? 'group' : 'step'
    return {
      id: n.id,
      kind,
      order: (n.data['order'] as number | undefined) ?? 0,
      parentId: (n.data['parentId'] as string | undefined) ?? undefined,
    }
  })
  const positions = layoutPhaseColumns(layoutNodes)
  return nodes.map((n) => ({
    ...n,
    position: positions[n.id] ?? { x: 0, y: 0 },
  }))
}

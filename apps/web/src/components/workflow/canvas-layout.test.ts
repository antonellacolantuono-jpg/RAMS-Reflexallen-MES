import { describe, it, expect } from 'vitest'
import type { Node } from '@xyflow/react'
import { applyPhaseColumnsLayout } from './canvas-layout'

describe('applyPhaseColumnsLayout (canvas adapter)', () => {
  it('positions a 2-phase / 2-group / 2-step graph as horizontal phase columns', () => {
    const input: Node[] = [
      {
        id: 'p1',
        type: 'phaseNode',
        position: { x: 0, y: 0 },
        data: { order: 1, label: 'Inbound', category: 'inbound' },
      },
      {
        id: 'p2',
        type: 'phaseNode',
        position: { x: 0, y: 0 },
        data: { order: 2, label: 'Production', category: 'production' },
      },
      {
        id: 'g1',
        type: 'groupNode',
        position: { x: 0, y: 0 },
        data: { order: 1, parentId: 'p1', label: 'BOM Check', category: 'bom_check' },
      },
      {
        id: 's1',
        type: 'stepNode',
        position: { x: 0, y: 0 },
        data: {
          order: 1,
          parentId: 'g1',
          label: 'Scan parts',
          category: 'identification',
        },
      },
      {
        id: 'g2',
        type: 'groupNode',
        position: { x: 0, y: 0 },
        data: { order: 1, parentId: 'p2', label: 'Assembly', category: 'assembly' },
      },
      {
        id: 's2',
        type: 'stepNode',
        position: { x: 0, y: 0 },
        data: { order: 1, parentId: 'g2', label: 'Assemble', category: 'production' },
      },
    ]

    const out = applyPhaseColumnsLayout(input)
    const byId = Object.fromEntries(out.map((n) => [n.id, n]))

    // Phase columns laid out left-to-right.
    expect(byId.p1!.position.x).toBe(0)
    expect(byId.p1!.position.y).toBe(0)
    expect(byId.p2!.position.x).toBeGreaterThan(0)
    expect(byId.p2!.position.y).toBe(0)

    // Group nested under phase 1's column (indented from phase x, but well
    // before phase 2's x).
    expect(byId.g1!.position.x).toBeGreaterThanOrEqual(byId.p1!.position.x)
    expect(byId.g1!.position.x).toBeLessThan(byId.p2!.position.x)
    expect(byId.g1!.position.y).toBeGreaterThan(0)

    // Step under its group, indented + below.
    expect(byId.s1!.position.x).toBeGreaterThan(byId.g1!.position.x)
    expect(byId.s1!.position.y).toBeGreaterThan(byId.g1!.position.y)

    // Cross-phase: g2 is in column 2, not column 1.
    expect(byId.g2!.position.x).toBeGreaterThan(byId.g1!.position.x)
    expect(byId.g2!.position.x).toBeGreaterThanOrEqual(byId.p2!.position.x)
  })
})

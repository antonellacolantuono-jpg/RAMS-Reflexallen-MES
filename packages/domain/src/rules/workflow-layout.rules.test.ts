import { describe, it, expect } from 'vitest'
import {
  layoutPhaseColumns,
  type LayoutNode,
} from './workflow-layout.rules'

describe('layoutPhaseColumns', () => {
  it('places three phases left-to-right at expected x and y=0', () => {
    const nodes: LayoutNode[] = [
      { id: 'p1', kind: 'phase', order: 1 },
      { id: 'p2', kind: 'phase', order: 2 },
      { id: 'p3', kind: 'phase', order: 3 },
    ]
    const positions = layoutPhaseColumns(nodes)
    expect(positions['p1']).toEqual({ x: 0, y: 0 })
    expect(positions['p2']?.x).toBeGreaterThan(positions['p1']!.x)
    expect(positions['p3']?.x).toBeGreaterThan(positions['p2']!.x)
    expect(positions['p1']?.y).toBe(0)
    expect(positions['p2']?.y).toBe(0)
    expect(positions['p3']?.y).toBe(0)
  })

  it('orders phases by their `order` field, not array order', () => {
    const nodes: LayoutNode[] = [
      { id: 'p2', kind: 'phase', order: 2 },
      { id: 'p1', kind: 'phase', order: 1 },
    ]
    const positions = layoutPhaseColumns(nodes)
    expect(positions['p1']?.x).toBeLessThan(positions['p2']!.x)
  })

  it('stacks groups vertically inside their parent phase column at the same x', () => {
    const nodes: LayoutNode[] = [
      { id: 'p1', kind: 'phase', order: 1 },
      { id: 'g1', kind: 'group', order: 1, parentId: 'p1' },
      { id: 'g2', kind: 'group', order: 2, parentId: 'p1' },
    ]
    const positions = layoutPhaseColumns(nodes)
    expect(positions['g1']?.x).toBe(positions['g2']?.x)
    expect(positions['g2']!.y).toBeGreaterThan(positions['g1']!.y)
    expect(positions['g1']!.y).toBeGreaterThan(positions['p1']!.y)
  })

  it('places steps under their parent group, slightly indented to the right and stacked', () => {
    const nodes: LayoutNode[] = [
      { id: 'p1', kind: 'phase', order: 1 },
      { id: 'g1', kind: 'group', order: 1, parentId: 'p1' },
      { id: 's1', kind: 'step', order: 1, parentId: 'g1' },
      { id: 's2', kind: 'step', order: 2, parentId: 'g1' },
      { id: 's3', kind: 'step', order: 3, parentId: 'g1' },
    ]
    const positions = layoutPhaseColumns(nodes)
    expect(positions['s1']!.x).toBeGreaterThan(positions['g1']!.x)
    expect(positions['s1']!.x).toBe(positions['s2']!.x)
    expect(positions['s2']!.y).toBeGreaterThan(positions['s1']!.y)
    expect(positions['s3']!.y).toBeGreaterThan(positions['s2']!.y)
  })

  it('does not overlap groups when group 1 has many steps and group 2 is empty', () => {
    const nodes: LayoutNode[] = [
      { id: 'p1', kind: 'phase', order: 1 },
      { id: 'g1', kind: 'group', order: 1, parentId: 'p1' },
      { id: 's1', kind: 'step', order: 1, parentId: 'g1' },
      { id: 's2', kind: 'step', order: 2, parentId: 'g1' },
      { id: 's3', kind: 'step', order: 3, parentId: 'g1' },
      { id: 'g2', kind: 'group', order: 2, parentId: 'p1' },
    ]
    const positions = layoutPhaseColumns(nodes)
    const lastStepBottom = positions['s3']!.y
    expect(positions['g2']!.y).toBeGreaterThan(lastStepBottom)
  })

  it('is deterministic — same input twice produces identical positions', () => {
    const nodes: LayoutNode[] = [
      { id: 'p1', kind: 'phase', order: 1 },
      { id: 'p2', kind: 'phase', order: 2 },
      { id: 'g1', kind: 'group', order: 1, parentId: 'p1' },
      { id: 's1', kind: 'step', order: 1, parentId: 'g1' },
      { id: 'g2', kind: 'group', order: 1, parentId: 'p2' },
      { id: 's2', kind: 'step', order: 1, parentId: 'g2' },
    ]
    const a = layoutPhaseColumns(nodes)
    const b = layoutPhaseColumns(nodes)
    expect(a).toEqual(b)
    // Empty input also stable.
    expect(layoutPhaseColumns([])).toEqual({})
  })
})

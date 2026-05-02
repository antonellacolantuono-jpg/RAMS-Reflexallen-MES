/**
 * Deterministic phase-columns layout for the workflow editor canvas.
 *
 * Each Phase is rendered as a vertical column. Groups stack inside their phase
 * column; steps stack under their parent group, slightly indented.
 *
 * The algorithm is pure: given the same input it returns the same positions.
 * It does NOT mutate the input array. The result is keyed by node id so the
 * caller can merge positions back into its node array.
 */

export type LayoutNodeKind = 'phase' | 'group' | 'step'

export interface LayoutNode {
  id: string
  kind: LayoutNodeKind
  order: number
  parentId?: string | null | undefined
}

export interface LayoutPosition {
  x: number
  y: number
}

export interface LayoutOptions {
  /** Horizontal width allocated to each phase column. Default 320. */
  phaseColumnWidth?: number
  /** Horizontal gap between phase columns. Default 24. */
  phaseGap?: number
  /** Height reserved for the phase column header. Default 80. */
  phaseHeaderHeight?: number
  /** Height reserved for each group header. Default 60. */
  groupHeaderHeight?: number
  /** Height of each step row inside a group. Default 40. */
  stepHeight?: number
  /** Vertical gap between groups in a column. Default 16. */
  groupGap?: number
  /** Horizontal indent of group nodes from the phase column edge. Default 12. */
  groupIndent?: number
  /** Horizontal indent of step nodes from the group node edge. Default 24. */
  stepIndent?: number
}

const DEFAULTS: Required<LayoutOptions> = {
  phaseColumnWidth: 320,
  phaseGap: 24,
  phaseHeaderHeight: 80,
  groupHeaderHeight: 60,
  stepHeight: 40,
  groupGap: 16,
  groupIndent: 12,
  stepIndent: 24,
}

function byOrder(a: LayoutNode, b: LayoutNode): number {
  return a.order - b.order
}

/**
 * Compute (x, y) positions for a flat list of LayoutNode entries arranged as
 * horizontal phase columns.
 */
export function layoutPhaseColumns(
  nodes: readonly LayoutNode[],
  options: LayoutOptions = {},
): Record<string, LayoutPosition> {
  const opts: Required<LayoutOptions> = { ...DEFAULTS, ...options }
  const out: Record<string, LayoutPosition> = {}

  const phases = nodes.filter((n) => n.kind === 'phase').slice().sort(byOrder)
  const groups = nodes.filter((n) => n.kind === 'group')
  const steps = nodes.filter((n) => n.kind === 'step')

  phases.forEach((phase, phaseIdx) => {
    const phaseX = phaseIdx * (opts.phaseColumnWidth + opts.phaseGap)
    out[phase.id] = { x: phaseX, y: 0 }

    const phaseGroups = groups
      .filter((g) => g.parentId === phase.id)
      .slice()
      .sort(byOrder)

    let runningY = opts.phaseHeaderHeight

    phaseGroups.forEach((group) => {
      const groupX = phaseX + opts.groupIndent
      const groupY = runningY
      out[group.id] = { x: groupX, y: groupY }

      const groupSteps = steps
        .filter((s) => s.parentId === group.id)
        .slice()
        .sort(byOrder)

      groupSteps.forEach((step, stepIdx) => {
        out[step.id] = {
          x: groupX + opts.stepIndent,
          y: groupY + opts.groupHeaderHeight + stepIdx * opts.stepHeight,
        }
      })

      const groupContentHeight =
        opts.groupHeaderHeight + groupSteps.length * opts.stepHeight
      runningY += groupContentHeight + opts.groupGap
    })
  })

  return out
}

/**
 * Parallel-operations rules for Device Execution Groups.
 *
 * A Group with `supportsParallel: true` (typically `category: 'device_execution'`)
 * splits its steps into 4 lanes that drive a swimlane HMI:
 *
 *   pre   → preparation (e.g., setup) — runs before device_main
 *   main  → the long-running device step (autoclave, leak test, extruder)
 *   parallel → concurrent operator steps that run while main is running
 *   post  → cleanup / teardown — runs after device_main and all parallels finish
 *
 * Sync semantics:
 *   - All `pre` steps must reach a terminal status before `main` starts.
 *   - `main` and all `parallel` steps run concurrently (shared timer).
 *   - When the last `parallel` step (and `main`) reaches a terminal status,
 *     a sync point fires; `post` steps unblock.
 *
 * For groups with `supportsParallel: false` this rule is a no-op (all steps
 * fall in a single sequential lane).
 *
 * Backward compat: if `step.deviceCategory` is null, the lowest-order step
 * in a parallel group becomes `main`, the rest become `parallel` lanes.
 */

export type LaneKind = 'pre' | 'main' | 'parallel' | 'post' | 'sequential'

export type DeviceCategory = 'pre' | 'device_main' | 'parallel' | 'post' | null | undefined

export interface ParallelStep {
  id: string
  order: number
  deviceCategory: DeviceCategory
}

export interface ParallelGroup {
  id: string
  supportsParallel: boolean
  steps: ParallelStep[]
}

export interface Lane<S extends ParallelStep = ParallelStep> {
  kind: LaneKind
  /** Lane index for parallel lanes (0-based); 0 for the singleton lanes. */
  index: number
  steps: S[]
}

export interface SyncPoint {
  /** Lanes that must all be terminal before the gated lane unblocks. */
  gatedBy: LaneKind[]
  /** The lane whose steps depend on the gate. */
  gates: LaneKind
}

export interface ParallelLayout<S extends ParallelStep = ParallelStep> {
  groupId: string
  isParallel: boolean
  lanes: Lane<S>[]
  syncPoints: SyncPoint[]
}

function pickLane(deviceCategory: DeviceCategory): LaneKind | null {
  switch (deviceCategory) {
    case 'pre':
      return 'pre'
    case 'device_main':
      return 'main'
    case 'parallel':
      return 'parallel'
    case 'post':
      return 'post'
    default:
      return null
  }
}

/**
 * Splits a Group into ordered lanes for a swimlane HMI rendering.
 *
 * If the group is non-parallel, all steps go into a single 'sequential' lane
 * preserving order. If parallel, steps are bucketed by deviceCategory; null
 * deviceCategory falls back to "lowest-order = main, rest = parallel".
 */
export function splitGroupIntoLanes<S extends ParallelStep>(
  group: { id: string; supportsParallel: boolean; steps: S[] },
): ParallelLayout<S> {
  const sortedSteps = [...group.steps].sort((a, b) => a.order - b.order)

  if (!group.supportsParallel) {
    return {
      groupId: group.id,
      isParallel: false,
      lanes: sortedSteps.length > 0
        ? [{ kind: 'sequential', index: 0, steps: sortedSteps }]
        : [],
      syncPoints: [],
    }
  }

  const buckets = {
    pre: [] as S[],
    main: [] as S[],
    parallel: [] as S[],
    post: [] as S[],
  }

  const fallbackSteps: S[] = []

  for (const step of sortedSteps) {
    const lane = pickLane(step.deviceCategory)
    if (lane === 'pre') buckets.pre.push(step)
    else if (lane === 'main') buckets.main.push(step)
    else if (lane === 'parallel') buckets.parallel.push(step)
    else if (lane === 'post') buckets.post.push(step)
    else fallbackSteps.push(step)
  }

  // Backward compat: null deviceCategory → lowest order is main, rest parallel.
  if (fallbackSteps.length > 0) {
    if (buckets.main.length === 0) {
      buckets.main.push(fallbackSteps[0]!)
      buckets.parallel.push(...fallbackSteps.slice(1))
    } else {
      buckets.parallel.push(...fallbackSteps)
    }
  }

  const lanes: Lane<S>[] = []
  if (buckets.pre.length > 0) {
    lanes.push({ kind: 'pre', index: 0, steps: buckets.pre })
  }
  if (buckets.main.length > 0) {
    lanes.push({ kind: 'main', index: 0, steps: buckets.main })
  }
  buckets.parallel.forEach((step, i) => {
    lanes.push({ kind: 'parallel', index: i, steps: [step] })
  })
  if (buckets.post.length > 0) {
    lanes.push({ kind: 'post', index: 0, steps: buckets.post })
  }

  const syncPoints: SyncPoint[] = []
  if (buckets.pre.length > 0 && (buckets.main.length > 0 || buckets.parallel.length > 0)) {
    const gates: LaneKind[] = []
    if (buckets.main.length > 0) gates.push('main')
    if (buckets.parallel.length > 0) gates.push('parallel')
    for (const gate of gates) {
      syncPoints.push({ gatedBy: ['pre'], gates: gate })
    }
  }
  if (buckets.post.length > 0) {
    const gatedBy: LaneKind[] = []
    if (buckets.main.length > 0) gatedBy.push('main')
    if (buckets.parallel.length > 0) gatedBy.push('parallel')
    if (gatedBy.length > 0) {
      syncPoints.push({ gatedBy, gates: 'post' })
    }
  }

  return {
    groupId: group.id,
    isParallel: true,
    lanes,
    syncPoints,
  }
}

/**
 * Returns true when every parallel-lane step in the group has reached a
 * terminal status (done | skipped | cancelled). Used by the API to fire the
 * "all parallels done" sync gate that unblocks `post` steps and signals the
 * main lane that operators have finished their concurrent ops.
 */
export type TerminalStatus = 'done' | 'skipped' | 'cancelled' | 'blocked' | 'scrapped'

const TERMINAL: ReadonlySet<string> = new Set([
  'done',
  'skipped',
  'cancelled',
  'blocked',
  'scrapped',
])

export interface ParallelStepWithStatus extends ParallelStep {
  status: string
}

export function areAllParallelLanesTerminal(
  steps: ParallelStepWithStatus[],
): boolean {
  const parallels = steps.filter((s) => s.deviceCategory === 'parallel')
  if (parallels.length === 0) return false
  return parallels.every((s) => TERMINAL.has(s.status))
}

/**
 * Returns true when the supplied step belongs to a Device Execution Group's
 * parallel lane, AND completing it makes the lane terminal. Used by the API
 * to decide whether to emit a sync event after a transition.
 */
export function isParallelSyncTrigger(
  transitioned: ParallelStepWithStatus,
  groupSteps: ParallelStepWithStatus[],
): boolean {
  if (transitioned.deviceCategory !== 'parallel') return false
  if (!TERMINAL.has(transitioned.status)) return false
  return areAllParallelLanesTerminal(groupSteps)
}

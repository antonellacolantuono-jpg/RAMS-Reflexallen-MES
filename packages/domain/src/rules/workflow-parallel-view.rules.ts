/**
 * Selectors for the workflow editor's "Parallel" toggle view (read-only).
 *
 * The Parallel view renders Device Execution groups whose `supportsParallel`
 * flag is true. Each such group splits its steps into a main step (the
 * long-running device action) and any parallel steps that run alongside.
 *
 * For the runtime swimlane semantics (sync points, terminal-state gating,
 * post lanes) see `parallel-ops.rules.ts` — this module is editor-side
 * presentation only.
 */

import type { DeviceCategory } from './parallel-ops.rules'

export interface ParallelViewStep {
  id: string
  name: string
  order: number
  deviceCategory: DeviceCategory
}

export interface ParallelViewGroup {
  id: string
  name: string
  category: string
  supportsParallel: boolean
  steps: ParallelViewStep[]
}

export interface ParallelViewPhase {
  id: string
  name: string
  groups: ParallelViewGroup[]
}

export interface ParallelViewSplit {
  preSteps: ParallelViewStep[]
  mainStep: ParallelViewStep | null
  parallelSteps: ParallelViewStep[]
  postSteps: ParallelViewStep[]
}

const DEVICE_EXECUTION_CATEGORY = 'device_execution'

/**
 * Returns every group across all phases that the Parallel view should render
 * — i.e. `device_execution` groups with `supportsParallel === true`.
 */
export function selectParallelGroups(
  phases: readonly ParallelViewPhase[],
): ParallelViewGroup[] {
  const out: ParallelViewGroup[] = []
  for (const phase of phases) {
    for (const group of phase.groups) {
      if (group.category === DEVICE_EXECUTION_CATEGORY && group.supportsParallel) {
        out.push(group)
      }
    }
  }
  return out
}

/**
 * Split a parallel-capable group's steps into pre / main / parallel / post
 * buckets based on each step's `deviceCategory`. When no step is tagged
 * `device_main`, falls back to the lowest-order step (matches the
 * splitGroupIntoLanes back-compat behaviour in parallel-ops.rules).
 */
export function groupParallelChildren(group: ParallelViewGroup): ParallelViewSplit {
  const sorted = [...group.steps].sort((a, b) => a.order - b.order)

  const preSteps = sorted.filter((s) => s.deviceCategory === 'pre')
  const tagged = sorted.filter((s) => s.deviceCategory === 'device_main')
  const parallelSteps = sorted.filter((s) => s.deviceCategory === 'parallel')
  const postSteps = sorted.filter((s) => s.deviceCategory === 'post')

  let mainStep: ParallelViewStep | null = null
  if (tagged.length > 0) {
    mainStep = tagged[0] ?? null
  } else {
    // Back-compat: no device_main tag → lowest-order step that isn't pre/parallel/post.
    const untagged = sorted.find(
      (s) =>
        s.deviceCategory !== 'pre' &&
        s.deviceCategory !== 'parallel' &&
        s.deviceCategory !== 'post',
    )
    mainStep = untagged ?? null
  }

  return { preSteps, mainStep, parallelSteps, postSteps }
}

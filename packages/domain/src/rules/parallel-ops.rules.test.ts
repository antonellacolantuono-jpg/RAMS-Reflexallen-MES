import { describe, expect, it } from 'vitest'
import {
  areAllParallelLanesTerminal,
  isParallelSyncTrigger,
  splitGroupIntoLanes,
  type ParallelStep,
  type ParallelStepWithStatus,
} from './parallel-ops.rules'

const step = (
  id: string,
  order: number,
  deviceCategory: ParallelStep['deviceCategory'] = null,
): ParallelStep => ({ id, order, deviceCategory })

describe('splitGroupIntoLanes — non-parallel groups', () => {
  it('returns a single sequential lane preserving order', () => {
    const layout = splitGroupIntoLanes({
      id: 'g1',
      supportsParallel: false,
      steps: [step('s2', 2), step('s1', 1), step('s3', 3)],
    })
    expect(layout.isParallel).toBe(false)
    expect(layout.lanes).toHaveLength(1)
    expect(layout.lanes[0]!.kind).toBe('sequential')
    expect(layout.lanes[0]!.steps.map((s) => s.id)).toEqual(['s1', 's2', 's3'])
    expect(layout.syncPoints).toEqual([])
  })

  it('emits an empty layout for a non-parallel group with no steps', () => {
    const layout = splitGroupIntoLanes({
      id: 'g-empty',
      supportsParallel: false,
      steps: [],
    })
    expect(layout.lanes).toEqual([])
    expect(layout.syncPoints).toEqual([])
  })
})

describe('splitGroupIntoLanes — parallel groups', () => {
  it('buckets steps into pre/main/parallel/post lanes', () => {
    const layout = splitGroupIntoLanes({
      id: 'dx',
      supportsParallel: true,
      steps: [
        step('pre1', 1, 'pre'),
        step('main', 2, 'device_main'),
        step('par1', 3, 'parallel'),
        step('par2', 4, 'parallel'),
        step('post1', 5, 'post'),
      ],
    })
    expect(layout.isParallel).toBe(true)
    expect(layout.lanes.map((l) => l.kind)).toEqual([
      'pre',
      'main',
      'parallel',
      'parallel',
      'post',
    ])
    const parallelLanes = layout.lanes.filter((l) => l.kind === 'parallel')
    expect(parallelLanes.map((l) => l.steps[0]!.id)).toEqual(['par1', 'par2'])
    expect(parallelLanes.map((l) => l.index)).toEqual([0, 1])
  })

  it('falls back to "lowest order = main, rest = parallel" when deviceCategory is null', () => {
    const layout = splitGroupIntoLanes({
      id: 'g',
      supportsParallel: true,
      steps: [step('a', 3), step('b', 1), step('c', 2)],
    })
    const main = layout.lanes.find((l) => l.kind === 'main')
    const parallels = layout.lanes.filter((l) => l.kind === 'parallel')
    expect(main?.steps.map((s) => s.id)).toEqual(['b'])
    expect(parallels.map((l) => l.steps[0]!.id)).toEqual(['c', 'a'])
  })

  it('keeps explicit main when some steps have null deviceCategory', () => {
    const layout = splitGroupIntoLanes({
      id: 'g',
      supportsParallel: true,
      steps: [
        step('m', 1, 'device_main'),
        step('x', 2),
        step('y', 3),
      ],
    })
    const main = layout.lanes.find((l) => l.kind === 'main')
    const parallels = layout.lanes.filter((l) => l.kind === 'parallel')
    expect(main?.steps.map((s) => s.id)).toEqual(['m'])
    expect(parallels.map((l) => l.steps[0]!.id)).toEqual(['x', 'y'])
  })

  it('omits empty lanes (no pre, no post) and emits no related sync points', () => {
    const layout = splitGroupIntoLanes({
      id: 'g',
      supportsParallel: true,
      steps: [
        step('m', 1, 'device_main'),
        step('p', 2, 'parallel'),
      ],
    })
    expect(layout.lanes.map((l) => l.kind)).toEqual(['main', 'parallel'])
    expect(layout.syncPoints).toEqual([])
  })

  it('emits a pre→main+parallel sync point when pre is present', () => {
    const layout = splitGroupIntoLanes({
      id: 'g',
      supportsParallel: true,
      steps: [
        step('pre', 1, 'pre'),
        step('m', 2, 'device_main'),
        step('p', 3, 'parallel'),
      ],
    })
    expect(layout.syncPoints).toEqual([
      { gatedBy: ['pre'], gates: 'main' },
      { gatedBy: ['pre'], gates: 'parallel' },
    ])
  })

  it('emits a main+parallel→post sync point when post is present', () => {
    const layout = splitGroupIntoLanes({
      id: 'g',
      supportsParallel: true,
      steps: [
        step('m', 1, 'device_main'),
        step('p1', 2, 'parallel'),
        step('p2', 3, 'parallel'),
        step('post', 4, 'post'),
      ],
    })
    expect(layout.syncPoints).toEqual([
      { gatedBy: ['main', 'parallel'], gates: 'post' },
    ])
  })

  it('emits both gates when pre, main, parallel, and post coexist', () => {
    const layout = splitGroupIntoLanes({
      id: 'g',
      supportsParallel: true,
      steps: [
        step('pre', 1, 'pre'),
        step('m', 2, 'device_main'),
        step('p', 3, 'parallel'),
        step('post', 4, 'post'),
      ],
    })
    expect(layout.syncPoints).toEqual([
      { gatedBy: ['pre'], gates: 'main' },
      { gatedBy: ['pre'], gates: 'parallel' },
      { gatedBy: ['main', 'parallel'], gates: 'post' },
    ])
  })

  it('places multiple pre and post steps into single lanes preserving order', () => {
    const layout = splitGroupIntoLanes({
      id: 'g',
      supportsParallel: true,
      steps: [
        step('pre2', 2, 'pre'),
        step('pre1', 1, 'pre'),
        step('m', 3, 'device_main'),
        step('post1', 5, 'post'),
        step('post2', 6, 'post'),
      ],
    })
    const pre = layout.lanes.find((l) => l.kind === 'pre')
    const post = layout.lanes.find((l) => l.kind === 'post')
    expect(pre?.steps.map((s) => s.id)).toEqual(['pre1', 'pre2'])
    expect(post?.steps.map((s) => s.id)).toEqual(['post1', 'post2'])
  })
})

describe('areAllParallelLanesTerminal', () => {
  const make = (
    id: string,
    deviceCategory: ParallelStep['deviceCategory'],
    status: string,
  ): ParallelStepWithStatus => ({
    id,
    order: 1,
    deviceCategory,
    status,
  })

  it('returns false when no parallel steps exist', () => {
    expect(
      areAllParallelLanesTerminal([
        make('m', 'device_main', 'running'),
      ]),
    ).toBe(false)
  })

  it('returns false while at least one parallel is still running', () => {
    expect(
      areAllParallelLanesTerminal([
        make('p1', 'parallel', 'done'),
        make('p2', 'parallel', 'running'),
      ]),
    ).toBe(false)
  })

  it('returns true when all parallels reached a terminal status', () => {
    expect(
      areAllParallelLanesTerminal([
        make('p1', 'parallel', 'done'),
        make('p2', 'parallel', 'skipped'),
        make('m', 'device_main', 'running'),
      ]),
    ).toBe(true)
  })

  it('counts blocked and scrapped as terminal too', () => {
    expect(
      areAllParallelLanesTerminal([
        make('p1', 'parallel', 'blocked'),
        make('p2', 'parallel', 'scrapped'),
      ]),
    ).toBe(true)
  })
})

describe('isParallelSyncTrigger', () => {
  const make = (
    id: string,
    deviceCategory: ParallelStep['deviceCategory'],
    status: string,
  ): ParallelStepWithStatus => ({ id, order: 1, deviceCategory, status })

  it('returns false when transitioned step is not parallel', () => {
    const transitioned = make('m', 'device_main', 'done')
    expect(
      isParallelSyncTrigger(transitioned, [
        transitioned,
        make('p1', 'parallel', 'done'),
      ]),
    ).toBe(false)
  })

  it('returns false when transitioned step has not reached a terminal status', () => {
    const transitioned = make('p1', 'parallel', 'paused')
    expect(
      isParallelSyncTrigger(transitioned, [
        transitioned,
        make('p2', 'parallel', 'done'),
      ]),
    ).toBe(false)
  })

  it('returns false when other parallel siblings are still in progress', () => {
    const transitioned = make('p1', 'parallel', 'done')
    expect(
      isParallelSyncTrigger(transitioned, [
        transitioned,
        make('p2', 'parallel', 'running'),
      ]),
    ).toBe(false)
  })

  it('returns true when this transition makes the parallel lanes terminal', () => {
    const transitioned = make('p2', 'parallel', 'done')
    expect(
      isParallelSyncTrigger(transitioned, [
        make('p1', 'parallel', 'done'),
        transitioned,
        make('m', 'device_main', 'running'),
      ]),
    ).toBe(true)
  })
})

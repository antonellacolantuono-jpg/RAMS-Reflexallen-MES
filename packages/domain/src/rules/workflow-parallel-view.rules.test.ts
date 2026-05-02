import { describe, it, expect } from 'vitest'
import {
  selectParallelGroups,
  groupParallelChildren,
  type ParallelViewPhase,
  type ParallelViewGroup,
} from './workflow-parallel-view.rules'

describe('selectParallelGroups', () => {
  it('returns empty when no group is device_execution OR no group has supportsParallel=true', () => {
    const phases: ParallelViewPhase[] = [
      {
        id: 'p1',
        name: 'Setup',
        groups: [
          { id: 'g-skill', name: 'Skills', category: 'skills_check', supportsParallel: true, steps: [] },
          { id: 'g-bom', name: 'BOM', category: 'bom_check', supportsParallel: false, steps: [] },
        ],
      },
      {
        id: 'p2',
        name: 'Production',
        groups: [
          // device_execution but parallel disabled — excluded.
          { id: 'g-exec', name: 'Run', category: 'device_execution', supportsParallel: false, steps: [] },
        ],
      },
    ]
    expect(selectParallelGroups(phases)).toEqual([])
  })

  it('returns only device_execution groups with supportsParallel=true, preserving order', () => {
    const phases: ParallelViewPhase[] = [
      {
        id: 'p1',
        name: 'Setup',
        groups: [
          { id: 'g-skill', name: 'Skills', category: 'skills_check', supportsParallel: true, steps: [] },
        ],
      },
      {
        id: 'p2',
        name: 'Production',
        groups: [
          { id: 'g-exec-1', name: 'Run A', category: 'device_execution', supportsParallel: true, steps: [] },
          { id: 'g-exec-2', name: 'Run B', category: 'device_execution', supportsParallel: false, steps: [] },
          { id: 'g-asm', name: 'Assemble', category: 'assembly', supportsParallel: true, steps: [] },
        ],
      },
      {
        id: 'p3',
        name: 'QC',
        groups: [
          { id: 'g-exec-3', name: 'Leak', category: 'device_execution', supportsParallel: true, steps: [] },
        ],
      },
    ]
    expect(selectParallelGroups(phases).map((g) => g.id)).toEqual([
      'g-exec-1',
      'g-exec-3',
    ])
  })
})

describe('groupParallelChildren', () => {
  it('splits steps by deviceCategory (pre / device_main / parallel / post) and respects step order', () => {
    const group: ParallelViewGroup = {
      id: 'g-leak',
      name: 'Leak Test',
      category: 'device_execution',
      supportsParallel: true,
      steps: [
        { id: 'pre-1', name: 'Verify hose', order: 1, deviceCategory: 'pre' },
        { id: 'main', name: 'Run leak test', order: 2, deviceCategory: 'device_main' },
        { id: 'par-2', name: 'Stage tube #2', order: 4, deviceCategory: 'parallel' },
        { id: 'par-1', name: 'Stage tube #1', order: 3, deviceCategory: 'parallel' },
        { id: 'post-1', name: 'Cleanup', order: 5, deviceCategory: 'post' },
      ],
    }
    const split = groupParallelChildren(group)
    expect(split.mainStep?.id).toBe('main')
    expect(split.preSteps.map((s) => s.id)).toEqual(['pre-1'])
    expect(split.parallelSteps.map((s) => s.id)).toEqual(['par-1', 'par-2'])
    expect(split.postSteps.map((s) => s.id)).toEqual(['post-1'])
  })

  it('falls back to the lowest-order untagged step when no step has deviceCategory=device_main', () => {
    const group: ParallelViewGroup = {
      id: 'g',
      name: 'Legacy group',
      category: 'device_execution',
      supportsParallel: true,
      steps: [
        { id: 's3', name: 'Third', order: 3, deviceCategory: null },
        { id: 's1', name: 'First', order: 1, deviceCategory: null },
        { id: 's2', name: 'Second', order: 2, deviceCategory: null },
      ],
    }
    const split = groupParallelChildren(group)
    expect(split.mainStep?.id).toBe('s1')
    expect(split.parallelSteps).toEqual([])
    // Back-compat fallback only promotes a single main; the others sit
    // outside any bucket on this view (they re-appear in the default
    // Visual editor view unchanged).
  })
})

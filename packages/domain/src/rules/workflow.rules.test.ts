import { describe, it, expect } from 'vitest'
import {
  validateWorkflowStructure,
  canEdit,
  canTransition,
  extractErrorNodeIds,
  groupErrorsByNodeId,
  issueToNodeId,
} from './workflow.rules'
import type {
  WorkflowStructure,
  AvailableRefs,
  ValidationResult,
} from './workflow.rules'

const emptyRefs: AvailableRefs = {
  skillIds: new Set(),
  deviceIds: new Set(),
  recipeIds: new Set(),
  toolIds: new Set(),
}

function makeRefs(
  skillIds: string[] = [],
  deviceIds: string[] = [],
  recipeIds: string[] = [],
  toolIds: string[] = [],
): AvailableRefs {
  return {
    skillIds: new Set(skillIds),
    deviceIds: new Set(deviceIds),
    recipeIds: new Set(recipeIds),
    toolIds: new Set(toolIds),
  }
}

function validWorkflow(): WorkflowStructure {
  return {
    phases: [
      {
        id: 'phase-1',
        groups: [
          {
            id: 'group-1',
            phaseId: 'phase-1',
            steps: [{ id: 'step-1', groupId: 'group-1' }],
          },
        ],
      },
    ],
  }
}

describe('validateWorkflowStructure', () => {
  it('accepts a minimal valid structure (1 phase, 1 group, 1 step)', () => {
    const result = validateWorkflowStructure(validWorkflow(), emptyRefs)
    expect(result.ok).toBe(true)
  })

  it('rejects empty phases array', () => {
    const result = validateWorkflowStructure({ phases: [] }, emptyRefs)
    if (result.ok) throw new Error('expected validation to fail')
    expect(result.errors[0]?.field).toBe('phases')
  })

  it('rejects a phase with no groups', () => {
    const workflow: WorkflowStructure = {
      phases: [{ id: 'phase-1', groups: [] }],
    }
    const result = validateWorkflowStructure(workflow, emptyRefs)
    if (result.ok) throw new Error('expected validation to fail')
    expect(result.errors[0]?.field).toContain('phase-1')
  })

  it('rejects a group with no steps', () => {
    const workflow: WorkflowStructure = {
      phases: [
        {
          id: 'phase-1',
          groups: [{ id: 'group-1', phaseId: 'phase-1', steps: [] }],
        },
      ],
    }
    const result = validateWorkflowStructure(workflow, emptyRefs)
    if (result.ok) throw new Error('expected validation to fail')
    expect(result.errors[0]?.field).toContain('group-1')
  })

  it('rejects an orphan group whose phaseId does not match its parent phase', () => {
    const workflow: WorkflowStructure = {
      phases: [
        {
          id: 'phase-1',
          groups: [
            {
              id: 'group-orphan',
              phaseId: 'phase-WRONG',
              steps: [{ id: 'step-1', groupId: 'group-orphan' }],
            },
          ],
        },
      ],
    }
    const result = validateWorkflowStructure(workflow, emptyRefs)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.field.includes('phaseId'))).toBe(true)
    }
  })

  it('rejects a step with an invalid skillId', () => {
    const workflow: WorkflowStructure = {
      phases: [
        {
          id: 'phase-1',
          groups: [
            {
              id: 'group-1',
              phaseId: 'phase-1',
              steps: [{ id: 'step-1', groupId: 'group-1', skillId: 'skill-MISSING' }],
            },
          ],
        },
      ],
    }
    const result = validateWorkflowStructure(workflow, emptyRefs)
    if (result.ok) throw new Error('expected validation to fail')
    expect(result.errors[0]?.field).toContain('skillId')
  })

  it('rejects a step with an invalid deviceId', () => {
    const workflow: WorkflowStructure = {
      phases: [
        {
          id: 'phase-1',
          groups: [
            {
              id: 'group-1',
              phaseId: 'phase-1',
              steps: [{ id: 'step-1', groupId: 'group-1', deviceId: 'device-MISSING' }],
            },
          ],
        },
      ],
    }
    const result = validateWorkflowStructure(workflow, emptyRefs)
    if (result.ok) throw new Error('expected validation to fail')
    expect(result.errors[0]?.field).toContain('deviceId')
  })

  it('rejects a step with an invalid recipeId', () => {
    const workflow: WorkflowStructure = {
      phases: [
        {
          id: 'phase-1',
          groups: [
            {
              id: 'group-1',
              phaseId: 'phase-1',
              steps: [{ id: 'step-1', groupId: 'group-1', recipeId: 'recipe-MISSING' }],
            },
          ],
        },
      ],
    }
    const result = validateWorkflowStructure(workflow, makeRefs())
    expect(result.ok).toBe(false)
  })

  it('rejects a step with an invalid toolId', () => {
    const workflow: WorkflowStructure = {
      phases: [
        {
          id: 'phase-1',
          groups: [
            {
              id: 'group-1',
              phaseId: 'phase-1',
              steps: [{ id: 'step-1', groupId: 'group-1', toolId: 'tool-MISSING' }],
            },
          ],
        },
      ],
    }
    const result = validateWorkflowStructure(workflow, makeRefs())
    expect(result.ok).toBe(false)
  })

  it('accepts a step with null refs (optional fields not set)', () => {
    const workflow: WorkflowStructure = {
      phases: [
        {
          id: 'phase-1',
          groups: [
            {
              id: 'group-1',
              phaseId: 'phase-1',
              steps: [
                {
                  id: 'step-1',
                  groupId: 'group-1',
                  skillId: null,
                  deviceId: null,
                  recipeId: null,
                  toolId: null,
                },
              ],
            },
          ],
        },
      ],
    }
    const result = validateWorkflowStructure(workflow, emptyRefs)
    expect(result.ok).toBe(true)
  })

  it('accepts a step whose skillId exists in refs', () => {
    const workflow: WorkflowStructure = {
      phases: [
        {
          id: 'phase-1',
          groups: [
            {
              id: 'group-1',
              phaseId: 'phase-1',
              steps: [{ id: 'step-1', groupId: 'group-1', skillId: 'skill-EXT' }],
            },
          ],
        },
      ],
    }
    const result = validateWorkflowStructure(workflow, makeRefs(['skill-EXT']))
    expect(result.ok).toBe(true)
  })

  it('accumulates multiple errors across phases and groups', () => {
    const workflow: WorkflowStructure = {
      phases: [
        { id: 'phase-1', groups: [] },
        { id: 'phase-2', groups: [] },
      ],
    }
    const result = validateWorkflowStructure(workflow, emptyRefs)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('canEdit', () => {
  it('returns true for draft status', () => {
    expect(canEdit('draft')).toBe(true)
  })

  it('returns false for approved status', () => {
    expect(canEdit('approved')).toBe(false)
  })

  it('returns false for deprecated status', () => {
    expect(canEdit('deprecated')).toBe(false)
  })

  it('returns false for unknown status', () => {
    expect(canEdit('published')).toBe(false)
  })
})

describe('extractErrorNodeIds', () => {
  it('returns three empty Sets for a successful validation', () => {
    const result: ValidationResult = { ok: true }
    const ids = extractErrorNodeIds(result)
    expect(ids.phaseIds.size).toBe(0)
    expect(ids.groupIds.size).toBe(0)
    expect(ids.stepIds.size).toBe(0)
  })

  it('classifies phase / group / step errors into the right buckets', () => {
    const result: ValidationResult = {
      ok: false,
      errors: [
        { field: 'phase.phase-A.groups', message: 'Phase A has no group' },
        { field: 'group.group-X.steps', message: 'Group X has no step' },
        { field: 'step.step-1.skillId', message: 'invalid skill' },
        { field: 'step.step-2.deviceId', message: 'invalid device' },
      ],
    }
    const ids = extractErrorNodeIds(result)
    expect(ids.phaseIds.has('phase-A')).toBe(true)
    expect(ids.groupIds.has('group-X')).toBe(true)
    expect(ids.stepIds.has('step-1')).toBe(true)
    expect(ids.stepIds.has('step-2')).toBe(true)
  })

  it('deduplicates ids when multiple errors target the same node', () => {
    const result: ValidationResult = {
      ok: false,
      errors: [
        { field: 'step.step-1.skillId', message: 'invalid skill' },
        { field: 'step.step-1.deviceId', message: 'invalid device' },
        { field: 'step.step-1.recipeId', message: 'invalid recipe' },
      ],
    }
    const ids = extractErrorNodeIds(result)
    expect(ids.stepIds.size).toBe(1)
    expect(ids.stepIds.has('step-1')).toBe(true)
  })

  it('ignores top-level "phases" field (no node id to highlight)', () => {
    const result: ValidationResult = {
      ok: false,
      errors: [{ field: 'phases', message: 'must have ≥1 phase' }],
    }
    const ids = extractErrorNodeIds(result)
    expect(ids.phaseIds.size).toBe(0)
    expect(ids.groupIds.size).toBe(0)
    expect(ids.stepIds.size).toBe(0)
  })

  it('ignores malformed field paths gracefully', () => {
    const result: ValidationResult = {
      ok: false,
      errors: [
        { field: '', message: 'empty' },
        { field: 'unknownKind.foo', message: 'unknown kind' },
        { field: 'phase.', message: 'no id' },
      ],
    }
    const ids = extractErrorNodeIds(result)
    expect(ids.phaseIds.size).toBe(0)
    expect(ids.groupIds.size).toBe(0)
    expect(ids.stepIds.size).toBe(0)
  })
})

describe('groupErrorsByNodeId', () => {
  it('returns an empty map for a successful validation', () => {
    const map = groupErrorsByNodeId({ ok: true })
    expect(map.size).toBe(0)
  })

  it('aggregates multiple messages per node id', () => {
    const result: ValidationResult = {
      ok: false,
      errors: [
        { field: 'step.step-1.skillId', message: 'invalid skill' },
        { field: 'step.step-1.deviceId', message: 'invalid device' },
        { field: 'group.group-X.steps', message: 'no step' },
      ],
    }
    const map = groupErrorsByNodeId(result)
    expect(map.get('step-1')?.length).toBe(2)
    expect(map.get('step-1')?.[0]).toBe('invalid skill')
    expect(map.get('step-1')?.[1]).toBe('invalid device')
    expect(map.get('group-X')?.[0]).toBe('no step')
  })

  it('returns no entry for malformed paths', () => {
    const result: ValidationResult = {
      ok: false,
      errors: [{ field: 'phases', message: 'must have ≥1 phase' }],
    }
    const map = groupErrorsByNodeId(result)
    expect(map.size).toBe(0)
  })

  it('preserves message order across multiple node ids', () => {
    const result: ValidationResult = {
      ok: false,
      errors: [
        { field: 'phase.phase-A.groups', message: 'A: no group' },
        { field: 'phase.phase-B.groups', message: 'B: no group' },
        { field: 'phase.phase-A.groups', message: 'A: extra issue' },
      ],
    }
    const map = groupErrorsByNodeId(result)
    expect(map.get('phase-A')).toEqual(['A: no group', 'A: extra issue'])
    expect(map.get('phase-B')).toEqual(['B: no group'])
  })

  it('does not include the message when the field has no node id', () => {
    const result: ValidationResult = {
      ok: false,
      errors: [
        { field: 'phases', message: 'top-level error' },
        { field: 'step.step-1.skillId', message: 'real error' },
      ],
    }
    const map = groupErrorsByNodeId(result)
    expect(map.size).toBe(1)
    expect(map.get('step-1')?.[0]).toBe('real error')
  })
})

describe('validateWorkflowStructure — coverage for newly-supported step categories', () => {
  // Smoke tests confirming validateWorkflowStructure remains agnostic to
  // step.category (introduced by Session A: decision, information, teardown).
  // Validation logic only inspects refs (skillId/deviceId/recipeId/toolId),
  // not category — but explicit tests prevent regressions if category
  // checks are added later.
  function makeStructureWithStepCategory(): WorkflowStructure {
    return {
      phases: [
        {
          id: 'phase-1',
          groups: [
            {
              id: 'group-1',
              phaseId: 'phase-1',
              steps: [
                { id: 'step-decision', groupId: 'group-1' },
                { id: 'step-information', groupId: 'group-1' },
                { id: 'step-teardown', groupId: 'group-1' },
              ],
            },
          ],
        },
      ],
    }
  }

  it('accepts decision/information/teardown steps the same as production', () => {
    const result = validateWorkflowStructure(makeStructureWithStepCategory(), emptyRefs)
    expect(result.ok).toBe(true)
  })

  it('still rejects ref errors regardless of category', () => {
    const wf: WorkflowStructure = {
      phases: [
        {
          id: 'phase-1',
          groups: [
            {
              id: 'group-1',
              phaseId: 'phase-1',
              steps: [
                {
                  id: 'step-teardown',
                  groupId: 'group-1',
                  toolId: 'tool-MISSING',
                },
              ],
            },
          ],
        },
      ],
    }
    const result = validateWorkflowStructure(wf, emptyRefs)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors[0]?.field).toContain('step-teardown')
      expect(result.errors[0]?.field).toContain('toolId')
    }
  })
})

describe('canTransition', () => {
  it('draft → approved is valid', () => {
    expect(canTransition('draft', 'approved')).toBe(true)
  })

  it('draft → deprecated is valid', () => {
    expect(canTransition('draft', 'deprecated')).toBe(true)
  })

  it('approved → deprecated is valid', () => {
    expect(canTransition('approved', 'deprecated')).toBe(true)
  })

  it('approved → draft is invalid', () => {
    expect(canTransition('approved', 'draft')).toBe(false)
  })

  it('deprecated → draft is invalid', () => {
    expect(canTransition('deprecated', 'draft')).toBe(false)
  })

  it('deprecated → approved is invalid', () => {
    expect(canTransition('deprecated', 'approved')).toBe(false)
  })

  it('draft → draft same-state transition is invalid', () => {
    expect(canTransition('draft', 'draft')).toBe(false)
  })

  it('unknown → approved is invalid', () => {
    expect(canTransition('unknown', 'approved')).toBe(false)
  })
})

describe('issueToNodeId', () => {
  it('extracts the node id for phase / group / step scoped errors', () => {
    expect(
      issueToNodeId({ field: 'phase.p-123.groups', message: 'no groups' }),
    ).toBe('p-123')
    expect(
      issueToNodeId({ field: 'group.g-abc.steps', message: 'no steps' }),
    ).toBe('g-abc')
    expect(
      issueToNodeId({ field: 'step.s-42.skillId', message: 'unknown skill' }),
    ).toBe('s-42')
  })

  it('returns null for workflow-level or unparsable error fields', () => {
    expect(
      issueToNodeId({ field: 'phases', message: 'workflow must have a phase' }),
    ).toBeNull()
    expect(issueToNodeId({ field: '', message: '' })).toBeNull()
    expect(issueToNodeId({ field: 'foo.bar.baz', message: 'unknown' })).toBeNull()
  })
})

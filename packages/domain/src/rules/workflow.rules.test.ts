import { describe, it, expect } from 'vitest'
import {
  validateWorkflowStructure,
  canEdit,
  canTransition,
} from './workflow.rules.js'
import type { WorkflowStructure, AvailableRefs } from './workflow.rules.js'

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
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors[0].field).toBe('phases')
    }
  })

  it('rejects a phase with no groups', () => {
    const workflow: WorkflowStructure = {
      phases: [{ id: 'phase-1', groups: [] }],
    }
    const result = validateWorkflowStructure(workflow, emptyRefs)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors[0].field).toContain('phase-1')
    }
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
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors[0].field).toContain('group-1')
    }
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
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors[0].field).toContain('skillId')
    }
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
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors[0].field).toContain('deviceId')
    }
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

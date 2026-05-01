import type { WorkflowVersionStatus } from '../machines/workflow.machine'

export interface ValidationError {
  field: string
  message: string
}

export type ValidationResult = { ok: true } | { ok: false; errors: ValidationError[] }

export interface WorkflowStep {
  id: string
  groupId: string
  skillId?: string | null
  deviceId?: string | null
  recipeId?: string | null
  toolId?: string | null
}

export interface WorkflowGroup {
  id: string
  phaseId: string
  steps: WorkflowStep[]
}

export interface WorkflowPhase {
  id: string
  groups: WorkflowGroup[]
}

export interface WorkflowStructure {
  phases: WorkflowPhase[]
}

export interface AvailableRefs {
  skillIds: Set<string>
  deviceIds: Set<string>
  recipeIds: Set<string>
  toolIds: Set<string>
}

/**
 * Validates the structural integrity of a workflow.
 * Checks: at least 1 phase, every phase has ≥1 group, every group has ≥1 step,
 * no orphan groups (group.phaseId must match its parent phase), and all
 * polymorphic refs (skill/device/recipe/tool) exist in the provided collections.
 */
export function validateWorkflowStructure(
  workflow: WorkflowStructure,
  refs: AvailableRefs,
): ValidationResult {
  const errors: ValidationError[] = []

  if (workflow.phases.length === 0) {
    errors.push({ field: 'phases', message: 'Workflow must have at least one phase' })
    return { ok: false, errors }
  }

  for (const phase of workflow.phases) {
    if (phase.groups.length === 0) {
      errors.push({
        field: `phase.${phase.id}.groups`,
        message: `Phase ${phase.id} must have at least one group`,
      })
      continue
    }

    for (const group of phase.groups) {
      if (group.phaseId !== phase.id) {
        errors.push({
          field: `group.${group.id}.phaseId`,
          message: `Group ${group.id} references phase ${group.phaseId} but is nested under phase ${phase.id}`,
        })
      }

      if (group.steps.length === 0) {
        errors.push({
          field: `group.${group.id}.steps`,
          message: `Group ${group.id} must have at least one step`,
        })
        continue
      }

      for (const step of group.steps) {
        if (step.skillId != null && !refs.skillIds.has(step.skillId)) {
          errors.push({
            field: `step.${step.id}.skillId`,
            message: `Skill ${step.skillId} not found in available skills`,
          })
        }
        if (step.deviceId != null && !refs.deviceIds.has(step.deviceId)) {
          errors.push({
            field: `step.${step.id}.deviceId`,
            message: `Device ${step.deviceId} not found in available devices`,
          })
        }
        if (step.recipeId != null && !refs.recipeIds.has(step.recipeId)) {
          errors.push({
            field: `step.${step.id}.recipeId`,
            message: `Recipe ${step.recipeId} not found in available recipes`,
          })
        }
        if (step.toolId != null && !refs.toolIds.has(step.toolId)) {
          errors.push({
            field: `step.${step.id}.toolId`,
            message: `Tool ${step.toolId} not found in available tools`,
          })
        }
      }
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}

/**
 * Field paths emitted by validateWorkflowStructure are of the form
 * "phase.<id>.<...>", "group.<id>.<...>", "step.<id>.<...>" or "phases".
 * This helper distils the affected node ids so callers can light up
 * inline badges on canvas nodes without re-implementing the parse.
 *
 * Returns three Sets — one per node kind — so a node component can answer
 * "do I have an error?" in O(1) without filtering the full error list.
 */
export interface ErrorNodeIds {
  phaseIds: Set<string>
  groupIds: Set<string>
  stepIds: Set<string>
}

export function extractErrorNodeIds(result: ValidationResult): ErrorNodeIds {
  const phaseIds = new Set<string>()
  const groupIds = new Set<string>()
  const stepIds = new Set<string>()
  if (result.ok) return { phaseIds, groupIds, stepIds }

  for (const err of result.errors) {
    const match = /^(phase|group|step)\.([^.]+)/.exec(err.field)
    if (!match) continue
    const kind = match[1]
    const id = match[2]
    if (!id) continue
    if (kind === 'phase') phaseIds.add(id)
    else if (kind === 'group') groupIds.add(id)
    else if (kind === 'step') stepIds.add(id)
  }

  return { phaseIds, groupIds, stepIds }
}

/**
 * Returns the per-error messages indexed by the node id they refer to.
 * Used by inline badges/tooltips on canvas nodes.
 */
export function groupErrorsByNodeId(result: ValidationResult): Map<string, string[]> {
  const out = new Map<string, string[]>()
  if (result.ok) return out

  for (const err of result.errors) {
    const match = /^(phase|group|step)\.([^.]+)/.exec(err.field)
    if (!match) continue
    const id = match[2]
    if (!id) continue
    const list = out.get(id) ?? []
    list.push(err.message)
    out.set(id, list)
  }

  return out
}

/**
 * Returns true only if a workflow version is editable (status is draft).
 */
export function canEdit(versionStatus: WorkflowVersionStatus | string): boolean {
  return versionStatus === 'draft'
}

/**
 * Returns true if a direct status transition is valid per the workflow version lifecycle.
 * Valid: draft→approved, draft→deprecated, approved→deprecated.
 * All other transitions (including same-state) are rejected.
 */
export function canTransition(
  from: WorkflowVersionStatus | string,
  to: WorkflowVersionStatus | string,
): boolean {
  const valid: Record<string, string[]> = {
    draft: ['approved', 'deprecated'],
    approved: ['deprecated'],
    deprecated: [],
  }
  return valid[from]?.includes(to) ?? false
}

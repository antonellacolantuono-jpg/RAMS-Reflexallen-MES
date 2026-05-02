/**
 * Group Category × Step Category compatibility matrix.
 *
 * Source of truth: MASTER_SPECIFICATION.md §7.6.
 * Used by the workflow editor to gate drag-drop drop targets and to
 * surface validation errors when an incompatible step is added to a group.
 */

import type { StepCategoryId } from './workflow-palette.rules'

export type SchemaStepCategory =
  | 'production'
  | 'logistics'
  | 'identification'
  | 'quality_control'
  | 'decision'
  | 'information'
  | 'setup'
  | 'teardown'
  | 'recovery'

export type GroupCategory =
  | 'skills_check'
  | 'bom_check'
  | 'tooling_check'
  | 'device_setup'
  | 'device_execution'
  | 'assembly'
  | 'qc'
  | 'logistics'
  | 'packaging'

const COMPATIBILITY: Readonly<Record<GroupCategory, readonly SchemaStepCategory[]>> = {
  skills_check: ['identification', 'information', 'setup'],
  bom_check: ['identification', 'setup'],
  tooling_check: ['identification', 'setup'],
  device_setup: ['identification', 'information', 'setup'],
  device_execution: ['production', 'identification', 'information'],
  assembly: ['production', 'information', 'identification'],
  qc: ['quality_control', 'identification', 'information'],
  logistics: ['logistics', 'identification'],
  packaging: ['logistics', 'identification', 'information'],
}

/**
 * Map a palette mockup category id (7 ids in {@link STEP_CATEGORIES}) to the
 * schema StepCategory used by the persisted Step model. Returns undefined when
 * the mockup id has no clean schema mapping ('safety' has no dedicated schema
 * category — callers should let the user pick the actual schema category).
 */
const PALETTE_TO_SCHEMA: Readonly<Record<StepCategoryId, SchemaStepCategory | undefined>> = {
  identification: 'identification',
  production: 'production',
  quality_control: 'quality_control',
  logistics: 'logistics',
  service: 'setup',
  safety: undefined,
  documentation: 'information',
}

export function mapPaletteCategoryToStepCategory(
  paletteCategoryId: StepCategoryId,
): SchemaStepCategory | undefined {
  return PALETTE_TO_SCHEMA[paletteCategoryId]
}

export function isStepCategoryAllowedInGroup(
  groupCategory: string,
  stepCategory: string,
): boolean {
  const allowed = COMPATIBILITY[groupCategory as GroupCategory]
  if (!allowed) return false
  return allowed.includes(stepCategory as SchemaStepCategory)
}

export function listAllowedStepCategories(
  groupCategory: string,
): readonly SchemaStepCategory[] {
  return COMPATIBILITY[groupCategory as GroupCategory] ?? []
}

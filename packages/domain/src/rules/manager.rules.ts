/**
 * Manager (Plant Manager) authorization rules — D6 of PROMPT_5_FULL.
 *
 * The release of a Work Order from an approved Workflow is gated on the
 * caller holding the `MANAGER` skill (per CLAUDE.md). Skill-based RBAC
 * mirrors the QC pattern from D5: skills are sourced from OperatorSkill
 * → Skill joins, scoped to the operator's plant.
 *
 * The actual permission check happens in the API release service via a
 * single Prisma query that loads the operator's skill codes; this module
 * only exposes the constant + the pure predicate to keep test surface
 * isolated and to align with `quality-hold.rules`.
 */

export const MANAGER_SKILL_CODE = 'MANAGER'

/**
 * True when an operator with the supplied skill codes can release a Work
 * Order from an approved Workflow. Skill codes match Skill.code values
 * from the registry (e.g. ['MANAGER', 'EXT']).
 */
export function canReleaseWorkOrder(skillCodes: readonly string[]): boolean {
  return skillCodes.includes(MANAGER_SKILL_CODE)
}

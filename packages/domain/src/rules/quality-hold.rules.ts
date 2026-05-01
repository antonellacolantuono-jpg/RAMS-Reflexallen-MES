/**
 * Quality-hold rules (D5 of PROMPT_5_FULL).
 *
 * A step transitions to `qc_hold` (rather than `done` or `blocked`) when:
 *   - the step belongs to category `quality_control`, AND
 *   - the operator has signalled a need for QC supervisor review
 *
 * Approval/rejection requires the reviewing operator to hold the `QC` skill.
 *
 * The actual state transitions are owned by the step-execution machine
 * (REQUEST_QC / QC_APPROVE / QC_REJECT). These rules expose pure predicates
 * for the API service and the HMI components to share consistent behaviour.
 */

export const QC_CATEGORY = 'quality_control'
export const QC_SKILL_CODE = 'QC'

export type StepCategory = string

/**
 * True when a step is eligible to transition to `qc_hold`. Today only
 * `quality_control` category. Encapsulated as a function so future extension
 * (e.g. a step-level `requiresQc` flag) is a one-line change here.
 */
export function requiresQcApproval(stepCategory: StepCategory): boolean {
  return stepCategory === QC_CATEGORY
}

/**
 * True when an operator with the supplied skill codes can approve or reject
 * a `qc_hold` step. Skill codes match Skill.code values from the registry
 * (e.g. ['EXT', 'QC']).
 */
export function canApproveQcHold(skillCodes: readonly string[]): boolean {
  return skillCodes.includes(QC_SKILL_CODE)
}

/**
 * Whether a NOK on a quality_control step should trigger qc_hold
 * (to wait for supervisor review) instead of `blocked` (recovery flow).
 *
 * Rule today: NOK on a QC step → qc_hold (supervisor decides). All other
 * NOKs → blocked (recovery flow). Captured here so the HMI can show
 * the correct primary action button on the NOK modal.
 */
export function triggersQualityHold(
  stepCategory: StepCategory,
  outcome: 'ok' | 'nok',
): boolean {
  if (outcome !== 'nok') return false
  return requiresQcApproval(stepCategory)
}

/**
 * Returns the event name the HMI should fire on operator NOK based on the
 * step category. Centralizes the mapping between business outcome and
 * machine event name.
 */
export function pickNokEvent(
  stepCategory: StepCategory,
): 'REQUEST_QC' | 'COMPLETE_NOK' {
  return triggersQualityHold(stepCategory, 'nok')
    ? 'REQUEST_QC'
    : 'COMPLETE_NOK'
}

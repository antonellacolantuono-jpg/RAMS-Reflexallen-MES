import { z } from 'zod'

// PROMPT_PNE_1 D3 — kind/category-specific schemas for the AddStepDialog
// Action Configuration column. Each schema covers ONE form variant; the parent
// dialog picks the active variant via deriveFormKey(kindId, category).
//
// Persistence note (TODO-040): the parent persists single-FK fields via the
// existing autosave pipeline; everything else here lives in node.data only
// (session-only) until a Step.config column lands in F2 / PROMPT_7.

// ── Manual ───────────────────────────────────────────────────────────────────

export const ManualSchema = z.object({
  instructions: z
    .string()
    .min(1, 'Istruzioni obbligatorie')
    .max(2000, 'Massimo 2000 caratteri'),
  durationStr: z.string().optional().default(''),
  maxDurationStr: z.string().optional().default(''),
  labelIt: z.string().max(200).optional().default(''),
  labelEn: z.string().max(200).optional().default(''),
  isRequired: z.boolean().default(true),
})
export type ManualValues = z.infer<typeof ManualSchema>
export const defaultManual: ManualValues = {
  instructions: '',
  durationStr: '',
  maxDurationStr: '',
  labelIt: '',
  labelEn: '',
  isRequired: true,
}

// ── Automatic ────────────────────────────────────────────────────────────────

export const ON_NOK_VALUES = ['stop', 'recovery', 'block', 'continue'] as const
export type OnNokValue = (typeof ON_NOK_VALUES)[number]

// PNE_4_FOCUSED D4.1 — recovery configuration carried alongside Automatic.
// Persisted on node.data.recoveryConfig (session-only until F2 schema
// migration adds Step.recoveryConfig — TODO-040 extended).
export const RecoveryConfigSchema = z.object({
  enabled: z.boolean().default(false),
  maxAttempts: z.coerce.number().int().min(0).max(5).default(2),
  /** Step IDs (refs) executed before each retry — Option A from FOCUSED brief. */
  preRetryStepIds: z.array(z.string()).default([]),
})
export type RecoveryConfigValues = z.infer<typeof RecoveryConfigSchema>
export const defaultRecoveryConfig: RecoveryConfigValues = {
  enabled: false,
  maxAttempts: 2,
  preRetryStepIds: [],
}

export const AutomaticSchema = z.object({
  cycleTimeSec: z
    .union([
      z.literal(''),
      z.coerce.number().int().positive('Deve essere > 0'),
    ])
    .optional()
    .default(''),
  parallelStepsBufferSec: z.coerce
    .number()
    .int()
    .min(0, 'Deve essere ≥ 0')
    .default(5),
  allowsParallel: z.boolean().default(false),
  onNok: z.enum(ON_NOK_VALUES).default('stop'),
  onNokWorkflowId: z.string().optional().default(''),
  // Pass threshold is dynamic per device.type — we accept a free-form string
  // for MVP and let the operator type the spec verbatim (e.g.
  // "leak_rate_max_mbar_min: 0.5"). Full structured rendering is F2 work.
  passThresholdNote: z.string().max(500).optional().default(''),
  // PNE_4_FOCUSED D4.1 — recovery section (collapsed when enabled=false).
  recoveryConfig: RecoveryConfigSchema.optional().default({
    enabled: false,
    maxAttempts: 2,
    preRetryStepIds: [],
  }),
})
export type AutomaticValues = z.infer<typeof AutomaticSchema>
export const defaultAutomatic: AutomaticValues = {
  cycleTimeSec: '',
  parallelStepsBufferSec: 5,
  allowsParallel: false,
  onNok: 'stop',
  onNokWorkflowId: '',
  passThresholdNote: '',
  recoveryConfig: defaultRecoveryConfig,
}

// ── Guided ───────────────────────────────────────────────────────────────────

export const GuidedSchema = z.object({
  instructions: z
    .string()
    .min(1, 'Istruzioni obbligatorie')
    .max(2000, 'Massimo 2000 caratteri'),
  verificationChecklist: z.string().max(2000).optional().default(''),
  durationStr: z.string().optional().default(''),
})
export type GuidedValues = z.infer<typeof GuidedSchema>
export const defaultGuided: GuidedValues = {
  instructions: '',
  verificationChecklist: '',
  durationStr: '',
}

// ── Parallel ─────────────────────────────────────────────────────────────────

export const PART_REFERENCE_VALUES = ['previous', 'current', 'next'] as const
export type PartReferenceValue = (typeof PART_REFERENCE_VALUES)[number]

export const ParallelSchema = z.object({
  parentStepId: z.string().optional().default(''),
  partReference: z.enum(PART_REFERENCE_VALUES).default('current'),
  durationDuringDeviceCycleSec: z
    .union([
      z.literal(''),
      z.coerce.number().int().positive('Deve essere > 0'),
    ])
    .optional()
    .default(''),
  description: z
    .string()
    .min(1, 'Descrizione obbligatoria')
    .max(2000, 'Massimo 2000 caratteri'),
})
export type ParallelValues = z.infer<typeof ParallelSchema>
export const defaultParallel: ParallelValues = {
  parentStepId: '',
  partReference: 'current',
  durationDuringDeviceCycleSec: '',
  description: '',
}

/**
 * Validation for Parallel.durationDuringDeviceCycleSec given the parent step's
 * cycleTime and parallelStepsBufferSec. Returns null if valid, otherwise an
 * error message. Pure helper so the form can compute live + tests can assert.
 */
export function validateParallelDuration(
  durationSec: number | null | undefined,
  parent: { cycleTimeSec?: number | null; parallelStepsBufferSec?: number | null } | null,
): string | null {
  if (durationSec == null) return null
  if (!parent) return null
  const cycle = parent.cycleTimeSec
  const buffer = parent.parallelStepsBufferSec ?? 0
  if (cycle == null) return null
  const max = cycle - buffer
  if (durationSec > max) {
    return `Durata massima ${max}s (ciclo padre ${cycle}s − buffer ${buffer}s)`
  }
  return null
}

// ── Sub-flow ─────────────────────────────────────────────────────────────────

export const TRIGGER_CONDITION_VALUES = [
  'on_nok',
  'manual',
  'conditional',
] as const
export type TriggerConditionValue = (typeof TRIGGER_CONDITION_VALUES)[number]

export const SubFlowSchema = z.object({
  subFlowWorkflowId: z
    .string()
    .min(1, 'Sotto-flusso obbligatorio'),
  triggerCondition: z.enum(TRIGGER_CONDITION_VALUES).default('on_nok'),
})
export type SubFlowValues = z.infer<typeof SubFlowSchema>
export const defaultSubFlow: SubFlowValues = {
  subFlowWorkflowId: '',
  triggerCondition: 'on_nok',
}

// ── Decision ─────────────────────────────────────────────────────────────────

export const DecisionSchema = z.object({
  branchLabel: z
    .string()
    .min(1, 'Etichetta ramo obbligatoria')
    .max(200, 'Massimo 200 caratteri'),
  onOkTargetId: z.string().optional().default(''),
  onNokTargetId: z.string().optional().default(''),
  onMarginalTargetId: z.string().optional().default(''),
})
export type DecisionValues = z.infer<typeof DecisionSchema>
export const defaultDecision: DecisionValues = {
  branchLabel: '',
  onOkTargetId: '',
  onNokTargetId: '',
  onMarginalTargetId: '',
}

// ── Information ──────────────────────────────────────────────────────────────

export const CONTENT_TYPE_VALUES = [
  'sop',
  'video',
  'drawing',
  'safety_briefing',
] as const
export type ContentTypeValue = (typeof CONTENT_TYPE_VALUES)[number]

export const InformationSchema = z.object({
  contentType: z.enum(CONTENT_TYPE_VALUES).default('sop'),
  contentUrl: z.string().max(2000).optional().default(''),
  ackRequired: z.boolean().default(false),
})
export type InformationValues = z.infer<typeof InformationSchema>
export const defaultInformation: InformationValues = {
  contentType: 'sop',
  contentUrl: '',
  ackRequired: false,
}

// ── Setup / Teardown ─────────────────────────────────────────────────────────

export const SetupTeardownSchema = z.object({
  durationStr: z.string().optional().default(''),
})
export type SetupTeardownValues = z.infer<typeof SetupTeardownSchema>
export const defaultSetupTeardown: SetupTeardownValues = {
  durationStr: '',
}

// ── Form-key derivation (combines kindId + category) ────────────────────────

export type FormKey =
  | 'manual'
  | 'automatic'
  | 'guided'
  | 'parallel'
  | 'sub_flow'
  | 'decision'
  | 'information'
  | 'setupTeardown'

/**
 * Resolves which Action Config form to render given the selected step kind and
 * the resolved DB-level step category. Category-driven forms (decision /
 * information / setup-teardown) take precedence; otherwise we fall through to
 * the kind-driven form.
 */
export function deriveFormKey(kindId: string, category: string): FormKey {
  if (category === 'decision') return 'decision'
  if (category === 'information') return 'information'
  if (category === 'setup' || category === 'teardown') return 'setupTeardown'
  if (
    kindId === 'manual' ||
    kindId === 'automatic' ||
    kindId === 'guided' ||
    kindId === 'parallel' ||
    kindId === 'sub_flow'
  ) {
    return kindId
  }
  return 'manual'
}

/**
 * Form keys whose UI surfaces session-only fields (not yet persisted by
 * existing WorkflowStepInputSchema). Drives the InlineHint banner above the
 * Action Config column. Tracked by TODO-040.
 */
export const SESSION_ONLY_FORM_KEYS: ReadonlySet<FormKey> = new Set([
  'manual', // maxDuration / IT-EN labels
  'automatic', // parallelStepsBufferSec / onNok / passThresholdNote
  'guided', // verificationChecklist
  'parallel', // partReference / durationDuringDeviceCycle
  'sub_flow', // triggerCondition
  'decision', // branchLabel / on*TargetId
  'information', // contentType / ackRequired
  'setupTeardown', // autoGenerated badge — future
])

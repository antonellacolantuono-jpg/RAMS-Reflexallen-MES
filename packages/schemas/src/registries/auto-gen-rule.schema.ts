import { z } from 'zod'

/**
 * The 7 trigger event names actually emitted by the
 * AutoGenRulesService catalog (PROMPT_2). Replaces the earlier draft
 * trigger list (work_order_released, lot_received, ...) which was never
 * adopted by the service. Aligned with the seed in
 * apps/api/src/modules/auto-gen-rules/auto-gen-rules.service.ts.
 */
export const AUTO_GEN_TRIGGERS = [
  'lot_created',
  'work_order_created',
  'box_created',
  'maintenance_created',
  'recipe_version_created',
  'sample_created',
  'downtime_created',
] as const

export const AUTO_GEN_SCOPES = [
  'lot',
  'work_order',
  'box',
  'maintenance',
  'recipe',
  'sample',
  'downtime',
] as const

export const AutoGenRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  trigger: z.enum(AUTO_GEN_TRIGGERS),
  scope: z.enum(AUTO_GEN_SCOPES),
})

export type AutoGenRule = z.infer<typeof AutoGenRuleSchema>

// ============================================================================
// Dry-run preview (PROMPT_4)
// ============================================================================

/**
 * Per-rule context schemas for the dry-run preview endpoint
 * `POST /api/auto-gen-rules/:id/dry-run`. The controller picks the
 * schema by ruleId and parses the request body against it.
 */
export const LotCodeContextSchema = z.object({
  plantId: z.string().min(1),
  itemId: z.string().min(1),
  year: z.number().int().min(1970).max(9999),
})

export const WoCodeContextSchema = z.object({
  plantId: z.string().min(1),
  releasedAt: z.coerce.date(),
})

export const BoxCodeContextSchema = z.object({
  plantId: z.string().min(1),
  boxTypeId: z.string().min(1),
})

export const MaintenanceCodeContextSchema = z.object({
  plantId: z.string().min(1),
  equipmentNodeId: z.string().min(1),
})

export const RecipeVersionContextSchema = z.object({
  recipeId: z.string().min(1),
})

export const SampleIdContextSchema = z.object({
  workOrderId: z.string().min(1),
  stepId: z.string().min(1).nullish(),
})

export const DowntimeEventContextSchema = z.object({
  plantId: z.string().min(1),
  equipmentNodeId: z.string().min(1),
  occurredAt: z.coerce.date(),
})

export const DRY_RUN_SCHEMAS = {
  '1': LotCodeContextSchema,
  '2': WoCodeContextSchema,
  '3': BoxCodeContextSchema,
  '4': MaintenanceCodeContextSchema,
  '5': RecipeVersionContextSchema,
  '6': SampleIdContextSchema,
  '7': DowntimeEventContextSchema,
} as const

export type DryRunRuleId = keyof typeof DRY_RUN_SCHEMAS

export const DryRunResponseSchema = z.object({
  ruleId: z.string(),
  code: z.string(),
  contextEcho: z.record(z.unknown()),
})

export type DryRunResponse = z.infer<typeof DryRunResponseSchema>

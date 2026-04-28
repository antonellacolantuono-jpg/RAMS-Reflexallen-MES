import { z } from 'zod'

export const AUTO_GEN_TRIGGERS = [
  'work_order_released',
  'lot_received',
  'phase_completed',
  'step_completed',
  'quality_hold',
  'maintenance_due',
] as const

export const AUTO_GEN_SCOPES = ['plant', 'item', 'equipment', 'operator'] as const

export const AutoGenRuleSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string(),
  trigger: z.enum(AUTO_GEN_TRIGGERS),
  scope: z.enum(AUTO_GEN_SCOPES),
  isActive: z.boolean(),
})

export type AutoGenRule = z.infer<typeof AutoGenRuleSchema>

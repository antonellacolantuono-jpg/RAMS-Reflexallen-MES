import { z } from 'zod'

export const TOOL_WEAR_STATUSES = ['new', 'good', 'worn', 'at_limit', 'replaced'] as const

export const CreateToolSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  equipmentNodeId: z.string().cuid().optional(),
  maxCycles: z.number().int().positive().optional(),
  plantId: z.string().cuid(),
})

export const UpdateToolSchema = CreateToolSchema
  .omit({ plantId: true, code: true })
  .partial()

export const ToolFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  wearStatus: z.enum(TOOL_WEAR_STATUSES).optional(),
  equipmentNodeId: z.string().cuid().optional(),
  plantId: z.string().cuid().optional(),
  isActive: z.coerce.boolean().default(true),
})

export type CreateToolDto = z.infer<typeof CreateToolSchema>
export type UpdateToolDto = z.infer<typeof UpdateToolSchema>
export type ToolFilters = z.infer<typeof ToolFiltersSchema>

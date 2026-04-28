import { z } from 'zod'

export const CAUSE_CODE_CATEGORIES = ['defect', 'downtime', 'scrap', 'rework'] as const

export const CreateCauseCodeSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  category: z.enum(CAUSE_CODE_CATEGORIES),
  phase: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  plantId: z.string().cuid(),
})

export const UpdateCauseCodeSchema = CreateCauseCodeSchema
  .omit({ plantId: true, code: true })
  .partial()

export const CauseCodeFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  category: z.enum(CAUSE_CODE_CATEGORIES).optional(),
  plantId: z.string().cuid().optional(),
  isActive: z.coerce.boolean().default(true),
})

export type CreateCauseCodeDto = z.infer<typeof CreateCauseCodeSchema>
export type UpdateCauseCodeDto = z.infer<typeof UpdateCauseCodeSchema>
export type CauseCodeFilters = z.infer<typeof CauseCodeFiltersSchema>

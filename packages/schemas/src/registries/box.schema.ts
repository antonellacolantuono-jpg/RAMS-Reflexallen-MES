import { z } from 'zod'

export const BOX_STATUSES = ['empty', 'loading', 'loaded', 'sealed', 'labeled', 'in_transit', 'delivered', 'returned', 'inspecting', 'retired'] as const

export const CreateBoxSchema = z.object({
  code: z.string().min(1).max(50),
  boxTypeId: z.string().cuid(),
  plantId: z.string().cuid(),
})

export const UpdateBoxSchema = z.object({
  status: z.enum(BOX_STATUSES).optional(),
  currentWeightG: z.number().min(0).optional(),
  currentVolumeL: z.number().min(0).optional(),
  currentUnitsCount: z.number().int().min(0).optional(),
  lotId: z.string().cuid().optional().nullable(),
})

export const BoxFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  status: z.enum(BOX_STATUSES).optional(),
  boxTypeId: z.string().cuid().optional(),
  plantId: z.string().cuid().optional(),
  isActive: z.coerce.boolean().default(true),
})

export type CreateBoxDto = z.infer<typeof CreateBoxSchema>
export type UpdateBoxDto = z.infer<typeof UpdateBoxSchema>
export type BoxFilters = z.infer<typeof BoxFiltersSchema>

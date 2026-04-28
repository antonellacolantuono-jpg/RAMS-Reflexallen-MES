import { z } from 'zod'

export const BOX_CATEGORIES = ['pallet', 'carton', 'tote', 'drum', 'bag', 'tube', 'bulk', 'custom'] as const

export const CreateBoxTypeSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  category: z.enum(BOX_CATEGORIES).default('carton'),
  maxWeightG: z.number().positive().optional(),
  maxVolumeL: z.number().positive().optional(),
  maxUnitsCount: z.number().int().positive().optional(),
  isReturnable: z.boolean().default(false),
  description: z.string().max(2000).optional(),
  plantId: z.string().cuid(),
})

export const UpdateBoxTypeSchema = CreateBoxTypeSchema
  .omit({ plantId: true, code: true })
  .partial()

export const BoxTypeFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  category: z.enum(BOX_CATEGORIES).optional(),
  isReturnable: z.coerce.boolean().optional(),
  plantId: z.string().cuid().optional(),
  isActive: z.coerce.boolean().default(true),
})

export type CreateBoxTypeDto = z.infer<typeof CreateBoxTypeSchema>
export type UpdateBoxTypeDto = z.infer<typeof UpdateBoxTypeSchema>
export type BoxTypeFilters = z.infer<typeof BoxTypeFiltersSchema>

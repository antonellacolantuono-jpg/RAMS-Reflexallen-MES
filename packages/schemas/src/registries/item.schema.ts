import { z } from 'zod'

export const ITEM_TYPES = ['finished_good', 'semi_finished', 'raw_material', 'component', 'consumable'] as const
export const TRACKING_MODES = ['none', 'lot', 'serial'] as const
export const UNITS_OF_MEASURE = ['pc', 'g', 'kg', 't', 'mm', 'cm', 'm', 'ml', 'l', 'm3', 's', 'min', 'h', 'm2'] as const

export const CreateItemSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  itemType: z.enum(ITEM_TYPES),
  trackingMode: z.enum(TRACKING_MODES).default('lot'),
  uom: z.enum(UNITS_OF_MEASURE).default('pc'),
  description: z.string().max(2000).optional(),
  plantId: z.string().cuid(),
})

export const UpdateItemSchema = CreateItemSchema.omit({ plantId: true, code: true }).partial()

export const ItemFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  itemType: z.enum(ITEM_TYPES).optional(),
  isActive: z.coerce.boolean().default(true),
  plantId: z.string().cuid().optional(),
})

export type CreateItemDto = z.infer<typeof CreateItemSchema>
export type UpdateItemDto = z.infer<typeof UpdateItemSchema>
export type ItemFilters = z.infer<typeof ItemFiltersSchema>

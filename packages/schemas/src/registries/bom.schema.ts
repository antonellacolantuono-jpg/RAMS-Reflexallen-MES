import { z } from 'zod'
import { UNITS_OF_MEASURE } from './item.schema'

export const BOM_STATUSES = ['draft', 'approved', 'deprecated'] as const

export const CreateBomLineSchema = z.object({
  componentId: z.string().cuid(),
  qty: z.number().positive(),
  uom: z.enum(UNITS_OF_MEASURE).default('pc'),
  position: z.number().int().min(0).default(0),
  isOptional: z.boolean().default(false),
  notes: z.string().max(500).optional(),
})

export const CreateBomSchema = z.object({
  itemId: z.string().cuid(),
  notes: z.string().max(2000).optional(),
  lines: z.array(CreateBomLineSchema).min(1),
})

export const UpdateBomSchema = z.object({
  status: z.enum(BOM_STATUSES).optional(),
  notes: z.string().max(2000).optional(),
  lines: z.array(CreateBomLineSchema).optional(),
})

export const BomFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  itemId: z.string().cuid().optional(),
  status: z.enum(BOM_STATUSES).optional(),
  plantId: z.string().cuid().optional(),
})

export type CreateBomDto = z.infer<typeof CreateBomSchema>
export type UpdateBomDto = z.infer<typeof UpdateBomSchema>
export type BomFilters = z.infer<typeof BomFiltersSchema>

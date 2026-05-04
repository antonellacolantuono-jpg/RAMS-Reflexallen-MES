import { z } from 'zod'

export const EQUIPMENT_LEVELS = ['enterprise', 'site', 'area', 'work_center', 'work_unit', 'equipment_module'] as const
export const EQUIPMENT_CLASSES = ['production', 'storage', 'transport', 'test', 'maintenance', 'administrative'] as const
export const EQUIPMENT_STATUSES = ['available', 'reserved', 'in_use', 'cleaning', 'maintenance', 'broken', 'offline', 'decommissioned'] as const

export const CreateEquipmentNodeSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  level: z.enum(EQUIPMENT_LEVELS),
  class: z.enum(EQUIPMENT_CLASSES).default('production'),
  status: z.enum(EQUIPMENT_STATUSES).default('available'),
  parentId: z.string().cuid().optional(),
  plantId: z.string().cuid(),
  description: z.string().max(2000).optional(),
  // Base64 data URL or S3 URL. See TODO-066 for S3 migration.
  imageUrl: z.string().max(700_000).nullish(),
})

export const UpdateEquipmentNodeSchema = CreateEquipmentNodeSchema
  .omit({ plantId: true, code: true })
  .partial()

export const EquipmentFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  level: z.enum(EQUIPMENT_LEVELS).optional(),
  status: z.enum(EQUIPMENT_STATUSES).optional(),
  parentId: z.string().cuid().optional(),
  plantId: z.string().cuid().optional(),
  isActive: z.coerce.boolean().default(true),
})

export type CreateEquipmentNodeDto = z.infer<typeof CreateEquipmentNodeSchema>
export type UpdateEquipmentNodeDto = z.infer<typeof UpdateEquipmentNodeSchema>
export type EquipmentFilters = z.infer<typeof EquipmentFiltersSchema>

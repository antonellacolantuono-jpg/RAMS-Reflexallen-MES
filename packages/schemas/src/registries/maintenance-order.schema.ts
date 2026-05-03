import { z } from 'zod'

export const MAINTENANCE_TYPES = [
  'preventive',
  'corrective',
  'calibration',
  'inspection',
] as const

export const MAINTENANCE_STATUSES = [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'overdue',
  'deferred',
] as const

export const MAINTENANCE_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const

const isoDateString = z
  .string()
  .min(1)
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid date' })

export const CreateMaintenanceOrderSchema = z.object({
  equipmentNodeId: z.string().min(1),
  type: z.enum(MAINTENANCE_TYPES),
  priority: z.enum(MAINTENANCE_PRIORITIES).default('normal'),
  description: z.string().min(1).max(500),
  plannedStart: isoDateString,
  plannedEnd: isoDateString,
  assignedToId: z.string().min(1).optional(),
  plantId: z.string().min(1),
})

export const UpdateMaintenanceOrderSchema = CreateMaintenanceOrderSchema
  .omit({ plantId: true })
  .partial()

export const MaintenanceOrderFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  status: z.enum(MAINTENANCE_STATUSES).optional(),
  type: z.enum(MAINTENANCE_TYPES).optional(),
  priority: z.enum(MAINTENANCE_PRIORITIES).optional(),
  equipmentNodeId: z.string().optional(),
  plantId: z.string().optional(),
  isActive: z.coerce.boolean().default(true),
})

export type CreateMaintenanceOrderDto = z.infer<typeof CreateMaintenanceOrderSchema>
export type UpdateMaintenanceOrderDto = z.infer<typeof UpdateMaintenanceOrderSchema>
export type MaintenanceOrderFilters = z.infer<typeof MaintenanceOrderFiltersSchema>
export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number]
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number]
export type MaintenancePriority = (typeof MAINTENANCE_PRIORITIES)[number]

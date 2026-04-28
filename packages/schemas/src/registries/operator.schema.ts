import { z } from 'zod'

export const OPERATOR_STATUSES = ['active', 'inactive', 'suspended'] as const

export const CreateOperatorSchema = z.object({
  badge: z.string().min(1).max(50),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  status: z.enum(OPERATOR_STATUSES).default('active'),
  pin: z.string().min(4).max(6).regex(/^\d+$/, 'PIN must be digits only').optional(),
  plantId: z.string().cuid(),
})

export const UpdateOperatorSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  status: z.enum(OPERATOR_STATUSES).optional(),
  pin: z.string().min(4).max(6).regex(/^\d+$/, 'PIN must be digits only').optional(),
})

export const AssignSkillSchema = z.object({
  skillId: z.string().cuid(),
  certifiedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  level: z.enum(['certified', 'advanced', 'instructor']).default('certified'),
  certifiedBy: z.string().min(1),
})

export const OperatorFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  status: z.enum(OPERATOR_STATUSES).optional(),
  plantId: z.string().cuid().optional(),
  isActive: z.coerce.boolean().default(true),
})

export type CreateOperatorDto = z.infer<typeof CreateOperatorSchema>
export type UpdateOperatorDto = z.infer<typeof UpdateOperatorSchema>
export type AssignSkillDto = z.infer<typeof AssignSkillSchema>
export type OperatorFilters = z.infer<typeof OperatorFiltersSchema>

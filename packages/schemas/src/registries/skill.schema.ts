import { z } from 'zod'

export const CreateSkillSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  plantId: z.string().cuid(),
})

export const UpdateSkillSchema = CreateSkillSchema.omit({ plantId: true, code: true }).partial()

export const SkillFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  category: z.string().optional(),
  plantId: z.string().cuid().optional(),
  isActive: z.coerce.boolean().default(true),
})

export type CreateSkillDto = z.infer<typeof CreateSkillSchema>
export type UpdateSkillDto = z.infer<typeof UpdateSkillSchema>
export type SkillFilters = z.infer<typeof SkillFiltersSchema>

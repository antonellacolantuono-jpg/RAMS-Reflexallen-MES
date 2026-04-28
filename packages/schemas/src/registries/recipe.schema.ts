import { z } from 'zod'

export const RECIPE_STATUSES = ['draft', 'approved', 'deprecated'] as const
export const RECIPE_PARAM_TYPES = ['numeric', 'string', 'enum', 'boolean'] as const

export const RecipeParameterSchema = z.object({
  key: z.string().min(1).max(100),
  label: z.string().min(1).max(200),
  type: z.enum(RECIPE_PARAM_TYPES),
  value: z.union([z.string(), z.number(), z.boolean()]),
  unit: z.string().max(20).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  options: z.array(z.string()).optional(),
})

export const CreateRecipeSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  deviceId: z.string().cuid().optional(),
  itemId: z.string().cuid().optional(),
  plantId: z.string().cuid(),
  parameters: z.array(RecipeParameterSchema).default([]),
  notes: z.string().max(2000).optional(),
})

export const UpdateRecipeSchema = CreateRecipeSchema
  .omit({ plantId: true, code: true })
  .partial()

export const ApproveRecipeSchema = z.object({
  approvedBy: z.string().min(1),
  notes: z.string().max(2000).optional(),
})

export const RecipeFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  status: z.enum(RECIPE_STATUSES).optional(),
  deviceId: z.string().cuid().optional(),
  itemId: z.string().cuid().optional(),
  plantId: z.string().cuid().optional(),
  isActive: z.coerce.boolean().default(true),
})

export type CreateRecipeDto = z.infer<typeof CreateRecipeSchema>
export type UpdateRecipeDto = z.infer<typeof UpdateRecipeSchema>
export type ApproveRecipeDto = z.infer<typeof ApproveRecipeSchema>
export type RecipeFilters = z.infer<typeof RecipeFiltersSchema>
export type RecipeParameter = z.infer<typeof RecipeParameterSchema>

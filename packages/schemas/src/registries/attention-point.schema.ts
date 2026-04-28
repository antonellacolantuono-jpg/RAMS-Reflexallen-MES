import { z } from 'zod'

export const ATTENTION_SEVERITIES = ['info', 'warning', 'critical'] as const

export const CreateAttentionPointSchema = z.object({
  entityType: z.string().min(1).max(100),
  entityId: z.string().cuid(),
  severity: z.enum(ATTENTION_SEVERITIES).default('warning'),
  message: z.string().min(1).max(2000),
  plantId: z.string().cuid(),
})

export const UpdateAttentionPointSchema = z.object({
  severity: z.enum(ATTENTION_SEVERITIES).optional(),
  message: z.string().min(1).max(2000).optional(),
})

export const ResolveAttentionPointSchema = z.object({
  resolvedBy: z.string().min(1),
  resolveNote: z.string().max(2000).optional(),
})

export const AttentionPointFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().cuid().optional(),
  severity: z.enum(ATTENTION_SEVERITIES).optional(),
  resolved: z.coerce.boolean().optional(),
  plantId: z.string().cuid().optional(),
})

export type CreateAttentionPointDto = z.infer<typeof CreateAttentionPointSchema>
export type UpdateAttentionPointDto = z.infer<typeof UpdateAttentionPointSchema>
export type ResolveAttentionPointDto = z.infer<typeof ResolveAttentionPointSchema>
export type AttentionPointFilters = z.infer<typeof AttentionPointFiltersSchema>

import { z } from 'zod'

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  isActive: z.coerce.boolean().default(true),
  plantId: z.string().cuid().optional(),
})

export type PaginationInput = z.infer<typeof PaginationSchema>

import { z } from 'zod'

export const CreatePlantSchema = z.object({
  code: z.string().min(1).max(20).toUpperCase(),
  name: z.string().min(1).max(100),
  timezone: z.string().default('Europe/Rome'),
  locale: z.string().default('it-IT'),
})

export const UpdatePlantSchema = CreatePlantSchema.partial()

export type CreatePlantInput = z.infer<typeof CreatePlantSchema>
export type UpdatePlantInput = z.infer<typeof UpdatePlantSchema>

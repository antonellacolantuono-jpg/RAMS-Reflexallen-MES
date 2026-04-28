import { z } from 'zod'
import { ItemType, TrackingMode, UnitOfMeasure } from '@mes/types'

export const CreateItemSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  name: z.string().min(1).max(200),
  itemType: z.nativeEnum(ItemType),
  trackingMode: z.nativeEnum(TrackingMode).default(TrackingMode.LOT),
  uom: z.nativeEnum(UnitOfMeasure).default(UnitOfMeasure.PC),
  description: z.string().optional(),
  plantId: z.string().cuid(),
})

export const UpdateItemSchema = CreateItemSchema.omit({ plantId: true }).partial()

export type CreateItemInput = z.infer<typeof CreateItemSchema>
export type UpdateItemInput = z.infer<typeof UpdateItemSchema>

import { z } from 'zod'
import { EquipmentHierarchyLevel, EquipmentClass } from '@mes/types'

export const CreateEquipmentNodeSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  name: z.string().min(1).max(200),
  level: z.nativeEnum(EquipmentHierarchyLevel),
  class: z.nativeEnum(EquipmentClass),
  parentId: z.string().cuid().optional(),
  plantId: z.string().cuid(),
  description: z.string().optional(),
})

export type CreateEquipmentNodeInput = z.infer<typeof CreateEquipmentNodeSchema>

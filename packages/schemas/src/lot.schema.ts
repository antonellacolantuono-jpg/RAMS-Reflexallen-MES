import { z } from 'zod'
import { LotQualityStatus } from '@mes/types'

export const CreateLotSchema = z.object({
  itemId: z.string().cuid(),
  qty: z.number().positive(),
  qualityStatus: z.nativeEnum(LotQualityStatus).default(LotQualityStatus.QUARANTINE),
  supplierRef: z.string().optional(),
  expiresAt: z.coerce.date().optional(),
  plantId: z.string().cuid(),
})

export type CreateLotInput = z.infer<typeof CreateLotSchema>

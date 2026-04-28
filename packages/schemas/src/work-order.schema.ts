import { z } from 'zod'
import { WorkOrderPriority, WorkOrderType } from '@mes/types'

export const CreateWorkOrderSchema = z
  .object({
    itemId: z.string().cuid(),
    bomId: z.string().cuid().optional(),
    qtyTarget: z.number().int().positive(),
    priority: z.nativeEnum(WorkOrderPriority).default(WorkOrderPriority.NORMAL),
    type: z.nativeEnum(WorkOrderType).default(WorkOrderType.PRODUCTION),
    scheduledStart: z.coerce.date().optional(),
    scheduledEnd: z.coerce.date().optional(),
    plantId: z.string().cuid(),
  })
  .refine(
    (data) =>
      !data.scheduledStart || !data.scheduledEnd || data.scheduledEnd > data.scheduledStart,
    { message: 'scheduledEnd must be after scheduledStart', path: ['scheduledEnd'] },
  )

export type CreateWorkOrderInput = z.infer<typeof CreateWorkOrderSchema>

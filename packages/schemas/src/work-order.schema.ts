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

/**
 * Release a Work Order from an approved Workflow (D6 of PROMPT_5_FULL).
 *
 * The releasedBy operator must hold the MANAGER skill (enforced server-side).
 * The workflow must have a current version in `approved` status.
 */
export const ReleaseWorkOrderSchema = z.object({
  workflowId: z.string().cuid(),
  itemId: z.string().cuid(),
  quantity: z.number().int().positive(),
  assignedOperatorId: z.string().cuid(),
  assignedShiftId: z.string().cuid().optional(),
  priority: z
    .enum(['low', 'normal', 'high', 'urgent'])
    .default('normal'),
})

export type ReleaseWorkOrderInput = z.infer<typeof ReleaseWorkOrderSchema>

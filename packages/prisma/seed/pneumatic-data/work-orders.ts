// PROMPT_PNE_2 D2 + D3 — Work Order WO-2026-PNE-0042 for the Pneumatic Air demo.
//
// D2 (this commit): seed WO in status='draft' (schema default — workflow not
// yet attached, snapshot not created). WorkOrderAssignment for Mario Rossi
// in status='proposed'.
//
// D3 (next commit): transition status → 'released', create WorkflowSnapshot,
// transition WorkOrderAssignment → 'accepted'.
//
// PROMPT spec captures qtyTarget=100 + qtyBuffer=5 (105 total to produce).
// Schema has no qtyBuffer column → buffer documented in `notes` field.

import { SYSTEM, type PneumaticSeedContext, type Prisma } from '../helpers/upsert'
import { createSnapshot } from '../helpers/snapshot'

export const PNE_WORK_ORDER = {
  code: 'WO-2026-PNE-0042',
  itemCode: 'PNE-TUBE-12-680',
  qtyTarget: 100,
  qtyBuffer: 5,
  qtyTotal: 105, // qtyTarget + qtyBuffer (notes-only; no schema column)
  priority: 'high',
  type: 'production',
  notes: 'Demo Pneumatic Air M12 680mm. Target 100 + buffer 5 = 105 totale da produrre. Cliente: Iveco/Volvo. Workflow: wf-pneumatic-air-680-v1 (D3).',
  assignedOperatorBadge: '1234', // Mario Rossi
} as const

export async function seedWorkOrderDraft(prisma: Prisma, ctx: PneumaticSeedContext): Promise<{ workOrderId: string }> {
  const item = ctx.items[PNE_WORK_ORDER.itemCode]
  if (!item) {
    throw new Error(`WO ${PNE_WORK_ORDER.code} references unknown item ${PNE_WORK_ORDER.itemCode}`)
  }
  const operator = ctx.operators[PNE_WORK_ORDER.assignedOperatorBadge]
  if (!operator) {
    throw new Error(`WO ${PNE_WORK_ORDER.code} references unknown operator badge ${PNE_WORK_ORDER.assignedOperatorBadge}`)
  }

  const wo = await prisma.workOrder.upsert({
    where: { plantId_code: { plantId: ctx.plantId, code: PNE_WORK_ORDER.code } },
    update: {
      // Idempotent: keep the WO at whatever status it has reached. D3 may have
      // transitioned it to 'released' on a previous run — don't drag back to draft.
      // Mutable fields below are safe to refresh.
      qtyTarget: PNE_WORK_ORDER.qtyTarget,
      priority: PNE_WORK_ORDER.priority,
      type: PNE_WORK_ORDER.type,
      notes: PNE_WORK_ORDER.notes,
      updatedBy: SYSTEM,
    },
    create: {
      code: PNE_WORK_ORDER.code,
      itemId: item.id,
      qtyTarget: PNE_WORK_ORDER.qtyTarget,
      status: 'draft',
      priority: PNE_WORK_ORDER.priority,
      type: PNE_WORK_ORDER.type,
      notes: PNE_WORK_ORDER.notes,
      plantId: ctx.plantId,
      createdBy: SYSTEM,
      updatedBy: SYSTEM,
    },
  })

  // Assignment (proposed in D2 → accepted in D3)
  await prisma.workOrderAssignment.upsert({
    where: { workOrderId_operatorId: { workOrderId: wo.id, operatorId: operator.id } },
    update: { updatedBy: SYSTEM },
    create: {
      workOrderId: wo.id,
      operatorId: operator.id,
      status: 'proposed',
      assignedAt: new Date(),
      createdBy: SYSTEM,
      updatedBy: SYSTEM,
    },
  })

  console.log(`✓ Work order: ${wo.code} (status=${wo.status}, qtyTarget=${PNE_WORK_ORDER.qtyTarget}+buffer ${PNE_WORK_ORDER.qtyBuffer})`)
  return { workOrderId: wo.id }
}

/**
 * D3 — Release WO-2026-PNE-0042: transition status draft → released, create
 * WorkflowSnapshot, transition WorkOrderAssignment proposed → accepted, seed
 * StepExecution rows for every step in the snapshot (status=pending,
 * startedAt=releasedAt). Bypasses the API release service (which requires
 * request context).
 *
 * Idempotent: if WO already released and snapshot exists, skip; if
 * StepExecutions already exist, skip per-step.
 */
export async function releaseWorkOrder(
  prisma: Prisma,
  ctx: PneumaticSeedContext,
  workOrderId: string,
  workflowVersionId: string,
): Promise<{ snapshotId: string; stepExecutionCount: number }> {
  const wo = await prisma.workOrder.findUniqueOrThrow({ where: { id: workOrderId } })
  const operator = ctx.operators[PNE_WORK_ORDER.assignedOperatorBadge]
  if (!operator) throw new Error('Work order release requires Mario Rossi (badge 1234)')

  const releasedAt = wo.releasedAt ?? new Date()

  // 1. Transition WO → released (no-op if already released)
  if (wo.status !== 'released') {
    const today6am = new Date()
    today6am.setHours(6, 0, 0, 0)
    await prisma.workOrder.update({
      where: { id: wo.id },
      data: {
        status: 'released',
        releasedAt,
        releasedBy: SYSTEM,
        scheduledStart: today6am,
        actualStart: null,
        updatedBy: SYSTEM,
      },
    })
  }

  // 2. Transition assignment proposed → accepted
  await prisma.workOrderAssignment.update({
    where: { workOrderId_operatorId: { workOrderId: wo.id, operatorId: operator.id } },
    data: {
      status: 'accepted',
      acceptedAt: releasedAt,
      updatedBy: SYSTEM,
    },
  })

  // 3. Create snapshot (idempotent — skip if exists)
  const { snapshotId, stepIds } = await createSnapshot(prisma, workflowVersionId, wo.id, releasedAt)

  // 4. Create StepExecution rows (one per step, status=pending)
  let createdExec = 0
  for (const stepId of stepIds) {
    const existing = await prisma.stepExecution.findFirst({
      where: { workOrderId: wo.id, stepId },
    })
    if (!existing) {
      await prisma.stepExecution.create({
        data: {
          workOrderId: wo.id,
          stepId,
          status: 'pending',
          startedAt: releasedAt,
        },
      })
      createdExec++
    }
  }

  console.log(
    `✓ WO release: ${wo.code} → released, snapshot ${snapshotId.slice(0, 8)}…, ` +
      `${stepIds.length} step executions (${createdExec} new)`,
  )
  return { snapshotId, stepExecutionCount: stepIds.length }
}

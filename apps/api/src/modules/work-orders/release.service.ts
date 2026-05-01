import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'
import {
  canReleaseWorkOrder,
  cloneWorkflowTree,
  listClonedStepIds,
  MANAGER_SKILL_CODE,
  type SourceWorkflowVersion,
} from '@mes/domain'
import { PrismaService } from '../prisma/prisma.service'
import { AuditLogService } from '../audit-log/audit-log.service'
import { WorkOrderEventsGateway } from '../events/work-order-events.gateway'
import { AutoGenEngineService } from '../auto-gen-engine/auto-gen-engine.service'
import { RULE_IDS } from '../auto-gen-engine/types'

export interface ReleaseRequest {
  workflowId: string
  itemId: string
  quantity: number
  assignedOperatorId: string
  assignedShiftId?: string | null
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  releasedBy: string
  plantId: string
}

export interface ReleaseResult {
  workOrderId: string
  workOrderCode: string
  snapshotId: string
  stepExecutionCount: number
  releasedAt: string
}

const ALLOWED_PRIORITIES: ReadonlyArray<NonNullable<ReleaseRequest['priority']>> = [
  'low',
  'normal',
  'high',
  'urgent',
]

@Injectable()
export class ReleaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly events: WorkOrderEventsGateway,
    private readonly engine: AutoGenEngineService,
  ) {}

  /**
   * Releases a Work Order from an approved Workflow's current version.
   *
   * Steps:
   *   1. RBAC — caller must hold the MANAGER skill (plant-scoped)
   *   2. Validate Workflow + currentVersion (approved) + Item + Operator (+Shift)
   *   3. Deep-clone the Workflow tree → JSON snapshot
   *   4. Single $transaction creates: WorkOrder, WorkflowSnapshot,
   *      StepExecution[] (one per cloned step), WorkOrderAssignment
   *      (status='accepted'), and ShiftAssignment if shiftId provided.
   *   5. AuditLog (WorkOrder/state_change/release)
   *   6. Emit `wo:released` (broadcast) + `wo:assigned` (per-operator room)
   *
   * Per Q4: WorkOrder.actualStart is left null at release. The first
   * pending→running StepExecution transition is responsible for setting it
   * (via PROMPT_6 dashboard plumbing or a future patch).
   */
  async release(req: ReleaseRequest): Promise<ReleaseResult> {
    if (!Number.isInteger(req.quantity) || req.quantity < 1) {
      throw new BadRequestException('Quantity must be a positive integer')
    }
    if (req.priority && !ALLOWED_PRIORITIES.includes(req.priority)) {
      throw new BadRequestException(`Invalid priority: ${req.priority}`)
    }

    await this.assertManager(req.releasedBy, req.plantId)

    const workflow = await this.prisma.workflow.findFirst({
      where: { id: req.workflowId, plantId: req.plantId, deletedAt: null },
      include: {
        workflowVersions: {
          include: {
            phases: {
              include: {
                groups: { include: { steps: true } },
              },
            },
          },
        },
      },
    })
    if (!workflow) {
      throw new NotFoundException('Workflow not found')
    }
    if (!workflow.currentVersionId) {
      throw new UnprocessableEntityException('Workflow has no current version')
    }
    const currentVersion = workflow.workflowVersions.find(
      (v) => v.id === workflow.currentVersionId,
    )
    if (!currentVersion) {
      throw new NotFoundException('Workflow current version not found')
    }
    if (currentVersion.status !== 'approved') {
      throw new UnprocessableEntityException(
        `Workflow current version status is "${currentVersion.status}", expected "approved"`,
      )
    }

    const item = await this.prisma.item.findFirst({
      where: {
        id: req.itemId,
        plantId: req.plantId,
        deletedAt: null,
        isActive: true,
      },
      select: { id: true },
    })
    if (!item) {
      throw new NotFoundException('Item not found in plant')
    }

    const assignedOperator = await this.prisma.operator.findFirst({
      where: {
        id: req.assignedOperatorId,
        plantId: req.plantId,
        deletedAt: null,
        status: 'active',
      },
      select: { id: true, badge: true },
    })
    if (!assignedOperator) {
      throw new NotFoundException('Assigned operator not found in plant')
    }

    let shift: { id: string } | null = null
    if (req.assignedShiftId) {
      shift = await this.prisma.shift.findFirst({
        where: {
          id: req.assignedShiftId,
          plantId: req.plantId,
          deletedAt: null,
        },
        select: { id: true },
      })
      if (!shift) {
        throw new NotFoundException('Assigned shift not found in plant')
      }
    }

    const releasedAt = new Date()
    const sourceVersion: SourceWorkflowVersion = {
      id: currentVersion.id,
      workflowId: currentVersion.workflowId,
      version: currentVersion.version,
      status: currentVersion.status,
      notes: currentVersion.notes ?? null,
      phases: currentVersion.phases.map((p) => ({
        id: p.id,
        workflowVersionId: p.workflowVersionId,
        order: p.order,
        category: p.category,
        name: p.name,
        isCycleBased: p.isCycleBased,
        isAutoGenerated: p.isAutoGenerated,
        description: p.description ?? null,
        groups: p.groups.map((g) => ({
          id: g.id,
          phaseId: g.phaseId,
          order: g.order,
          category: g.category,
          name: g.name,
          supportsParallel: g.supportsParallel,
          supportsRecovery: g.supportsRecovery,
          isAutoGenerated: g.isAutoGenerated,
          description: g.description ?? null,
          steps: g.steps.map((s) => ({
            id: s.id,
            groupId: s.groupId,
            order: s.order,
            category: s.category,
            actionType: s.actionType,
            type: s.type,
            source: s.source,
            name: s.name,
            instructions: s.instructions ?? null,
            skillId: s.skillId ?? null,
            deviceId: s.deviceId ?? null,
            recipeId: s.recipeId ?? null,
            toolId: s.toolId ?? null,
            standardTimeSec: s.standardTimeSec ?? null,
            isRequired: s.isRequired,
            partReference: s.partReference ?? null,
            noTargetPolicy: s.noTargetPolicy ?? null,
            deviceCategory: s.deviceCategory ?? null,
          })),
        })),
      })),
    }
    const payload = cloneWorkflowTree(sourceVersion, releasedAt)
    const stepIds = listClonedStepIds(payload)

    const code = await this.engine.resolve(RULE_IDS.WORK_ORDER_NUMBER, {
      plantId: req.plantId,
      releasedAt,
    })

    const txResult = await this.prisma.$transaction(async (tx) => {
      const wo = await tx.workOrder.create({
        data: {
          code,
          itemId: req.itemId,
          plantId: req.plantId,
          status: 'released',
          priority: req.priority ?? 'normal',
          type: 'production',
          qtyTarget: req.quantity,
          qtyProduced: 0,
          qtyScrap: 0,
          qtyRework: 0,
          actualStart: null,
          releasedAt,
          releasedBy: req.releasedBy,
          createdBy: req.releasedBy,
          updatedBy: req.releasedBy,
        },
      })

      const snapshot = await tx.workflowSnapshot.create({
        data: {
          workflowVersionId: currentVersion.id,
          workOrderId: wo.id,
          snapshotData: JSON.stringify(payload),
          createdBy: req.releasedBy,
        },
      })

      if (stepIds.length > 0) {
        await tx.stepExecution.createMany({
          data: stepIds.map((stepId) => ({
            workOrderId: wo.id,
            stepId,
            status: 'pending',
            startedAt: releasedAt,
          })),
        })
      }

      await tx.workOrderAssignment.create({
        data: {
          workOrderId: wo.id,
          operatorId: req.assignedOperatorId,
          status: 'accepted',
          assignedAt: releasedAt,
          acceptedAt: releasedAt,
          createdBy: req.releasedBy,
          updatedBy: req.releasedBy,
        },
      })

      if (shift) {
        const today = startOfDay(releasedAt)
        await tx.shiftAssignment.upsert({
          where: {
            shiftId_operatorId_date: {
              shiftId: shift.id,
              operatorId: req.assignedOperatorId,
              date: today,
            },
          },
          update: { workOrderId: wo.id },
          create: {
            shiftId: shift.id,
            operatorId: req.assignedOperatorId,
            date: today,
            workOrderId: wo.id,
            createdBy: req.releasedBy,
          },
        })
      }

      return { wo, snapshot, stepExecutionCount: stepIds.length }
    })

    await this.auditLog.record({
      entityType: 'WorkOrder',
      entityId: txResult.wo.id,
      action: 'state_change',
      changedBy: req.releasedBy,
      plantId: req.plantId,
      after: {
        action: 'release',
        code: txResult.wo.code,
        itemId: req.itemId,
        quantity: req.quantity,
        assignedOperatorId: req.assignedOperatorId,
        assignedShiftId: req.assignedShiftId ?? null,
        workflowVersionId: currentVersion.id,
        workflowVersionNumber: currentVersion.version,
        snapshotId: txResult.snapshot.id,
        stepExecutionCount: txResult.stepExecutionCount,
        releasedAt: releasedAt.toISOString(),
      },
    })

    this.events.emitWoReleased({
      workOrderId: txResult.wo.id,
      code: txResult.wo.code,
      releasedAt: releasedAt.toISOString(),
      releasedBy: req.releasedBy,
    })
    this.events.emitWoAssigned({
      workOrderId: txResult.wo.id,
      code: txResult.wo.code,
      operatorId: req.assignedOperatorId,
      assignedAt: releasedAt.toISOString(),
    })

    return {
      workOrderId: txResult.wo.id,
      workOrderCode: txResult.wo.code,
      snapshotId: txResult.snapshot.id,
      stepExecutionCount: txResult.stepExecutionCount,
      releasedAt: releasedAt.toISOString(),
    }
  }

  private async assertManager(
    operatorId: string,
    plantId: string,
  ): Promise<void> {
    const operator = await this.prisma.operator.findFirst({
      where: {
        id: operatorId,
        plantId,
        deletedAt: null,
        status: 'active',
      },
      include: { operatorSkills: { include: { skill: true } } },
    })
    if (!operator) {
      throw new ForbiddenException('Operator not found in plant')
    }
    const codes = (operator.operatorSkills ?? []).map((s) => s.skill.code)
    if (!canReleaseWorkOrder(codes)) {
      throw new ForbiddenException(
        `Operator lacks ${MANAGER_SKILL_CODE} skill required to release work orders`,
      )
    }
  }

}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

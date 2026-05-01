import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { canApproveQcHold, QC_SKILL_CODE } from '@mes/domain'
import { PrismaService } from '../prisma/prisma.service'
import {
  StepExecutionService,
  type TransitionResult,
} from '../work-orders/step-execution.service'

export interface QcHoldDto {
  stepExecutionId: string
  workOrderId: string
  workOrderCode: string
  stepId: string
  stepName: string
  stepCategory: string
  startedAt: string | null
  durationSec: number | null
  operatorId: string | null
  operatorBadge: string | null
}

export interface QcReviewRequest {
  stepExecutionId: string
  approverId: string
  plantId: string
  reason?: string
}

@Injectable()
export class QcReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stepExecutions: StepExecutionService,
  ) {}

  /**
   * Returns true when the operator has the QC skill (per quality-hold rules).
   * Performed by a single OperatorSkill→Skill join scoped to the plant.
   */
  async hasQcSkill(operatorId: string, plantId: string): Promise<boolean> {
    const skills = await this.loadOperatorSkillCodes(operatorId, plantId)
    return canApproveQcHold(skills)
  }

  async listHolds(plantId: string): Promise<QcHoldDto[]> {
    const rows = await this.prisma.stepExecution.findMany({
      where: {
        status: 'qc_hold',
        workOrder: { plantId, deletedAt: null },
      },
      include: {
        step: { select: { name: true, category: true } },
        workOrder: { select: { code: true } },
      },
      orderBy: { startedAt: 'asc' },
    })
    const operatorIds = Array.from(
      new Set(rows.map((r) => r.operatorId).filter((id): id is string => !!id)),
    )
    const operators = operatorIds.length
      ? await this.prisma.operator.findMany({
          where: { id: { in: operatorIds } },
          select: { id: true, badge: true },
        })
      : []
    const badgeById = new Map(operators.map((o) => [o.id, o.badge]))
    return rows.map((r) => ({
      stepExecutionId: r.id,
      workOrderId: r.workOrderId,
      workOrderCode: r.workOrder.code,
      stepId: r.stepId,
      stepName: r.step.name,
      stepCategory: r.step.category,
      startedAt: r.startedAt?.toISOString() ?? null,
      durationSec: r.durationSec ?? null,
      operatorId: r.operatorId ?? null,
      operatorBadge: r.operatorId ? badgeById.get(r.operatorId) ?? null : null,
    }))
  }

  async approve(req: QcReviewRequest): Promise<TransitionResult> {
    await this.assertApprover(req.approverId, req.plantId)
    const row = await this.loadHoldRow(req.stepExecutionId, req.plantId)
    return this.stepExecutions.applyTransition({
      stepExecutionId: row.id,
      workOrderId: row.workOrderId,
      event: {
        type: 'QC_APPROVE',
        by: req.approverId,
        approverId: req.approverId,
      },
      changedBy: req.approverId,
      plantId: req.plantId,
    })
  }

  async reject(req: QcReviewRequest): Promise<TransitionResult> {
    if (!req.reason || req.reason.trim().length === 0) {
      throw new ForbiddenException('A rejection reason is required')
    }
    await this.assertApprover(req.approverId, req.plantId)
    const row = await this.loadHoldRow(req.stepExecutionId, req.plantId)
    return this.stepExecutions.applyTransition({
      stepExecutionId: row.id,
      workOrderId: row.workOrderId,
      event: {
        type: 'QC_REJECT',
        by: req.approverId,
        approverId: req.approverId,
        reason: req.reason,
      },
      changedBy: req.approverId,
      plantId: req.plantId,
    })
  }

  private async assertApprover(operatorId: string, plantId: string): Promise<void> {
    const ok = await this.hasQcSkill(operatorId, plantId)
    if (!ok) {
      throw new ForbiddenException(
        `Operator lacks ${QC_SKILL_CODE} skill required to review quality holds`,
      )
    }
  }

  private async loadOperatorSkillCodes(
    operatorId: string,
    plantId: string,
  ): Promise<string[]> {
    const operator = await this.prisma.operator.findFirst({
      where: { id: operatorId, plantId, deletedAt: null, status: 'active' },
      include: { operatorSkills: { include: { skill: true } } },
    })
    if (!operator) return []
    return (operator.operatorSkills ?? []).map((s) => s.skill.code)
  }

  private async loadHoldRow(stepExecutionId: string, plantId: string) {
    const row = await this.prisma.stepExecution.findUnique({
      where: { id: stepExecutionId },
      include: { workOrder: { select: { plantId: true, deletedAt: true } } },
    })
    if (!row) throw new NotFoundException('Step execution not found')
    if (row.workOrder.deletedAt !== null || row.workOrder.plantId !== plantId) {
      throw new NotFoundException('Step execution not found')
    }
    if (row.status !== 'qc_hold') {
      throw new NotFoundException('Step execution is not awaiting QC review')
    }
    return row
  }
}

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export type MineWorkOrderDto = {
  id: string
  code: string
  itemCode: string
  itemName: string
  quantity: number
  completed: number
  priority: 'low' | 'normal' | 'high'
  status: 'ready' | 'in_progress'
  startedAt: string | null
  shiftCode: string | null
}

// AssignmentStatus values from packages/types/src/enums/work-order.enum.ts
// Active = post-acceptance, before completion. Declined/completed/proposed are excluded.
const ACTIVE_ASSIGNMENT_STATUSES = ['accepted', 'active']
const HIDDEN_WO_STATUSES = ['draft', 'closed', 'cancelled']

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

function normalizePriority(p: string): MineWorkOrderDto['priority'] {
  return p === 'low' || p === 'high' ? p : 'normal'
}

function normalizeStatus(s: string): MineWorkOrderDto['status'] {
  return s === 'in_progress' ? 'in_progress' : 'ready'
}

@Injectable()
export class WorkOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(operatorId: string, now: Date = new Date()): Promise<MineWorkOrderDto[]> {
    const [assignments, todaysShift] = await Promise.all([
      this.prisma.workOrderAssignment.findMany({
        where: {
          operatorId,
          status: { in: ACTIVE_ASSIGNMENT_STATUSES },
        },
        include: {
          workOrder: { include: { item: true } },
        },
      }),
      this.prisma.shiftAssignment.findFirst({
        where: {
          operatorId,
          date: { gte: startOfDay(now), lte: endOfDay(now) },
        },
        include: { shift: true },
      }),
    ])

    const shiftCode = todaysShift?.shift.code ?? null

    return assignments
      .filter(
        (a) =>
          a.workOrder.deletedAt === null &&
          !HIDDEN_WO_STATUSES.includes(a.workOrder.status),
      )
      .map((a) => ({
        id: a.workOrder.id,
        code: a.workOrder.code,
        itemCode: a.workOrder.item.code,
        itemName: a.workOrder.item.name,
        quantity: a.workOrder.qtyTarget,
        completed: a.workOrder.qtyProduced,
        priority: normalizePriority(a.workOrder.priority),
        status: normalizeStatus(a.workOrder.status),
        startedAt: a.workOrder.actualStart?.toISOString() ?? null,
        shiftCode,
      }))
  }
}

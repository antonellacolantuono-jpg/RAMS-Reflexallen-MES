import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { buildPaginatedResult } from '../../common/types/paginated'
import type { PaginatedResult } from '../../common/types/paginated'
import type { BaseFilters } from '../../common/base-registry.service'

export type MaintenanceOrderModel = {
  id: string
  code: string
  equipmentNodeId: string
  type: string
  status: string
  priority: string
  description: string
  plannedStart: Date
  plannedEnd: Date
  actualStart: Date | null
  actualEnd: Date | null
  assignedToId: string | null
  startedBy: string | null
  completedBy: string | null
  cancelledBy: string | null
  cancelReason: string | null
  plantId: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  version: number
  createdBy: string
  updatedBy: string
  equipmentNode?: { id: string; code: string; name: string } | null
}

export type MaintenanceOrderFiltersExt = BaseFilters & {
  status?: string | undefined
  type?: string | undefined
  priority?: string | undefined
  equipmentNodeId?: string | undefined
}

@Injectable()
export class MaintenanceOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    filters: MaintenanceOrderFiltersExt,
  ): Promise<PaginatedResult<MaintenanceOrderModel>> {
    const where = {
      deletedAt: filters.isActive === false ? { not: null } : null,
      ...(filters.plantId ? { plantId: filters.plantId } : {}),
      ...(filters.search
        ? {
            OR: [
              { code: { contains: filters.search } },
              { description: { contains: filters.search } },
            ],
          }
        : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.priority ? { priority: filters.priority } : {}),
      ...(filters.equipmentNodeId ? { equipmentNodeId: filters.equipmentNodeId } : {}),
    } as Record<string, unknown>

    const orderBy: Record<string, 'asc' | 'desc'> = filters.sortBy
      ? { [filters.sortBy]: filters.sortDir ?? 'asc' }
      : { plannedStart: 'desc' }

    const skip = (filters.page - 1) * filters.limit

    const delegate = (this.prisma as unknown as { maintenanceOrder: { findMany: Function; count: Function } }).maintenanceOrder
    const [data, total] = await Promise.all([
      delegate.findMany({
        where,
        orderBy,
        skip,
        take: filters.limit,
        include: { equipmentNode: { select: { id: true, code: true, name: true } } },
      }),
      delegate.count({ where }),
    ])

    return buildPaginatedResult(data as MaintenanceOrderModel[], total as number, filters)
  }

  async findById(id: string): Promise<MaintenanceOrderModel | null> {
    const delegate = (this.prisma as unknown as { maintenanceOrder: { findFirst: Function } }).maintenanceOrder
    const row = await delegate.findFirst({
      where: { id, deletedAt: null },
      include: { equipmentNode: { select: { id: true, code: true, name: true } } },
    })
    return (row as MaintenanceOrderModel | null) ?? null
  }

  async create(data: {
    code: string
    equipmentNodeId: string
    type: string
    priority: string
    description: string
    plannedStart: Date
    plannedEnd: Date
    assignedToId?: string | null
    plantId: string
    createdBy: string
  }): Promise<MaintenanceOrderModel> {
    const delegate = (this.prisma as unknown as { maintenanceOrder: { create: Function } }).maintenanceOrder
    const row = await delegate.create({
      data: {
        code: data.code,
        equipmentNodeId: data.equipmentNodeId,
        type: data.type,
        status: 'scheduled',
        priority: data.priority,
        description: data.description,
        plannedStart: data.plannedStart,
        plannedEnd: data.plannedEnd,
        assignedToId: data.assignedToId ?? null,
        plantId: data.plantId,
        createdBy: data.createdBy,
        updatedBy: data.createdBy,
      },
      include: { equipmentNode: { select: { id: true, code: true, name: true } } },
    })
    return row as MaintenanceOrderModel
  }

  async update(
    id: string,
    data: Partial<{
      equipmentNodeId: string
      type: string
      priority: string
      description: string
      plannedStart: Date
      plannedEnd: Date
      assignedToId: string | null
    }> & { updatedBy: string },
  ): Promise<MaintenanceOrderModel> {
    const delegate = (this.prisma as unknown as { maintenanceOrder: { update: Function } }).maintenanceOrder
    const row = await delegate.update({
      where: { id },
      data: {
        ...(data.equipmentNodeId !== undefined ? { equipmentNodeId: data.equipmentNodeId } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.plannedStart !== undefined ? { plannedStart: data.plannedStart } : {}),
        ...(data.plannedEnd !== undefined ? { plannedEnd: data.plannedEnd } : {}),
        ...(data.assignedToId !== undefined ? { assignedToId: data.assignedToId } : {}),
        updatedBy: data.updatedBy,
        version: { increment: 1 },
      },
      include: { equipmentNode: { select: { id: true, code: true, name: true } } },
    })
    return row as MaintenanceOrderModel
  }

  async countByPlantAndYear(plantId: string, year: number): Promise<number> {
    const delegate = (this.prisma as unknown as { maintenanceOrder: { count: Function } }).maintenanceOrder
    return (await delegate.count({
      where: {
        plantId,
        code: { startsWith: `MNT-${year}-` },
      },
    })) as number
  }
}

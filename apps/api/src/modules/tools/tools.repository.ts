import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { buildPaginatedResult } from '../../common/types/paginated'
import type { PaginatedResult } from '../../common/types/paginated'
import type { BaseFilters } from '../../common/base-registry.service'

export type ToolModel = {
  id: string
  code: string
  name: string
  equipmentNodeId: string | null
  currentCyclesCount: number
  maxCycles: number | null
  wearStatus: string
  lastUsedAt: Date | null
  replacedAt: Date | null
  replacementCount: number
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  version: number
  createdBy: string
  updatedBy: string
}

type ToolFilters = BaseFilters & {
  wearStatus?: string | undefined
  equipmentNodeId?: string | undefined
}

@Injectable()
export class ToolsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: ToolFilters): Promise<PaginatedResult<ToolModel>> {
    const where = {
      deletedAt: null as Date | null,
      ...(filters.search
        ? {
            OR: [
              { code: { contains: filters.search } },
              { name: { contains: filters.search } },
            ],
          }
        : {}),
      ...(filters.wearStatus ? { wearStatus: filters.wearStatus } : {}),
      ...(filters.equipmentNodeId ? { equipmentNodeId: filters.equipmentNodeId } : {}),
    }

    const orderBy: Record<string, 'asc' | 'desc'> = filters.sortBy
      ? { [filters.sortBy]: filters.sortDir ?? 'asc' }
      : { createdAt: 'desc' }

    const skip = (filters.page - 1) * filters.limit

    const [data, total] = await Promise.all([
      this.prisma.tool.findMany({ where, orderBy, skip, take: filters.limit }),
      this.prisma.tool.count({ where }),
    ])

    return buildPaginatedResult(data as ToolModel[], total, filters)
  }

  async create(data: {
    code: string
    name: string
    equipmentNodeId?: string | undefined
    maxCycles?: number | undefined
    createdBy: string
  }): Promise<ToolModel> {
    return this.prisma.tool.create({
      data: {
        code: data.code,
        name: data.name,
        equipmentNodeId: data.equipmentNodeId ?? null,
        maxCycles: data.maxCycles ?? null,
        createdBy: data.createdBy,
        updatedBy: data.createdBy,
      },
    }) as Promise<ToolModel>
  }

  async update(
    id: string,
    data: {
      name?: string | undefined
      equipmentNodeId?: string | undefined
      maxCycles?: number | undefined
      updatedBy: string
    },
  ): Promise<ToolModel> {
    return this.prisma.tool.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.equipmentNodeId !== undefined ? { equipmentNodeId: data.equipmentNodeId } : {}),
        ...(data.maxCycles !== undefined ? { maxCycles: data.maxCycles } : {}),
        updatedBy: data.updatedBy,
        version: { increment: 1 },
      },
    }) as Promise<ToolModel>
  }
}

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { buildPaginatedResult } from '../../common/types/paginated'
import type { PaginatedResult } from '../../common/types/paginated'
import type { BaseFilters } from '../../common/base-registry.service'

export type EquipmentModel = {
  id: string
  code: string
  name: string
  level: string
  class: string
  status: string
  parentId: string | null
  plantId: string
  description: string | null
  imageUrl: string | null
  lastMaintenanceAt: Date | null
  nextMaintenanceDueAt: Date | null
  totalCyclesCount: number
  totalRunHoursMin: number
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  version: number
  createdBy: string
  updatedBy: string
}

type EquipmentFilters = BaseFilters & {
  level?: string | undefined
  status?: string | undefined
}

@Injectable()
export class EquipmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: EquipmentFilters): Promise<PaginatedResult<EquipmentModel>> {
    const where = {
      deletedAt: null as Date | null,
      ...(filters.plantId ? { plantId: filters.plantId } : {}),
      ...(filters.search
        ? {
            OR: [
              { code: { contains: filters.search } },
              { name: { contains: filters.search } },
            ],
          }
        : {}),
      ...(filters.level ? { level: filters.level } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    }

    const orderBy: Record<string, 'asc' | 'desc'> = filters.sortBy
      ? { [filters.sortBy]: filters.sortDir ?? 'asc' }
      : { createdAt: 'desc' }

    const skip = (filters.page - 1) * filters.limit

    const [data, total] = await Promise.all([
      this.prisma.equipmentNode.findMany({ where, orderBy, skip, take: filters.limit }),
      this.prisma.equipmentNode.count({ where }),
    ])

    return buildPaginatedResult(data as EquipmentModel[], total, filters)
  }

  async create(data: {
    code: string
    name: string
    level: string
    class: string
    status: string
    parentId?: string | undefined
    plantId: string
    description?: string | null | undefined
    imageUrl?: string | null | undefined
    createdBy: string
  }): Promise<EquipmentModel> {
    return this.prisma.equipmentNode.create({
      data: {
        code: data.code,
        name: data.name,
        level: data.level,
        class: data.class,
        status: data.status,
        parentId: data.parentId ?? null,
        plantId: data.plantId,
        description: data.description ?? null,
        imageUrl: data.imageUrl ?? null,
        createdBy: data.createdBy,
        updatedBy: data.createdBy,
      },
    }) as Promise<EquipmentModel>
  }

  async update(
    id: string,
    data: {
      name?: string | undefined
      level?: string | undefined
      class?: string | undefined
      status?: string | undefined
      parentId?: string | undefined
      description?: string | null | undefined
      imageUrl?: string | null | undefined
      updatedBy: string
    },
  ): Promise<EquipmentModel> {
    return this.prisma.equipmentNode.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.level !== undefined ? { level: data.level } : {}),
        ...(data.class !== undefined ? { class: data.class } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
        updatedBy: data.updatedBy,
        version: { increment: 1 },
      },
    }) as Promise<EquipmentModel>
  }
}

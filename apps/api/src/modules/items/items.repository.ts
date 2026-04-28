import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { buildPaginatedResult } from '../../common/types/paginated'
import type { PaginatedResult } from '../../common/types/paginated'
import type { BaseFilters } from '../../common/base-registry.service'

export type ItemModel = {
  id: string
  code: string
  name: string
  itemType: string
  trackingMode: string
  uom: string
  description: string | null
  plantId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  version: number
  createdBy: string
  updatedBy: string
}

type ItemFilters = BaseFilters & { itemType?: string | undefined }

@Injectable()
export class ItemsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: ItemFilters): Promise<PaginatedResult<ItemModel>> {
    const where = {
      deletedAt: filters.isActive !== false ? null : { not: null },
      ...(filters.plantId ? { plantId: filters.plantId } : {}),
      ...(filters.search
        ? { OR: [{ code: { contains: filters.search } }, { name: { contains: filters.search } }] }
        : {}),
      ...(filters.itemType ? { itemType: filters.itemType } : {}),
    }

    const orderBy: Record<string, 'asc' | 'desc'> = filters.sortBy
      ? { [filters.sortBy]: filters.sortDir ?? 'asc' }
      : { createdAt: 'desc' }

    const skip = (filters.page - 1) * filters.limit

    const [data, total] = await Promise.all([
      this.prisma.item.findMany({ where, orderBy, skip, take: filters.limit }),
      this.prisma.item.count({ where }),
    ])

    return buildPaginatedResult(data as ItemModel[], total, filters)
  }

  async create(data: {
    code: string
    name: string
    itemType: string
    trackingMode: string
    uom: string
    description?: string | null | undefined
    plantId: string
    createdBy: string
  }): Promise<ItemModel> {
    return this.prisma.item.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        itemType: data.itemType,
        trackingMode: data.trackingMode,
        uom: data.uom,
        description: data.description ?? null,
        plantId: data.plantId,
        createdBy: data.createdBy,
        updatedBy: data.createdBy,
      },
    }) as Promise<ItemModel>
  }

  async update(
    id: string,
    data: {
      name?: string | undefined
      itemType?: string | undefined
      trackingMode?: string | undefined
      uom?: string | undefined
      description?: string | null | undefined
      isActive?: boolean | undefined
      updatedBy: string
    },
  ): Promise<ItemModel> {
    return this.prisma.item.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.itemType !== undefined ? { itemType: data.itemType } : {}),
        ...(data.trackingMode !== undefined ? { trackingMode: data.trackingMode } : {}),
        ...(data.uom !== undefined ? { uom: data.uom } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        updatedBy: data.updatedBy,
        version: { increment: 1 },
      },
    }) as Promise<ItemModel>
  }
}

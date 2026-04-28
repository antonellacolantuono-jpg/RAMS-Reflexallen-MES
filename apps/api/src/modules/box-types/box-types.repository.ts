import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { buildPaginatedResult } from '../../common/types/paginated'
import type { PaginatedResult } from '../../common/types/paginated'
import type { BaseFilters } from '../../common/base-registry.service'

export type BoxTypeModel = {
  id: string
  code: string
  name: string
  maxWeightG: number | null
  maxVolumeL: number | null
  maxUnitsCount: number | null
  isReturnable: boolean
  description: string | null
  plantId: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  version: number
  createdBy: string
  updatedBy: string
}

type BoxTypeFilters = BaseFilters

@Injectable()
export class BoxTypesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: BoxTypeFilters): Promise<PaginatedResult<BoxTypeModel>> {
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
    }

    const orderBy: Record<string, 'asc' | 'desc'> = filters.sortBy
      ? { [filters.sortBy]: filters.sortDir ?? 'asc' }
      : { createdAt: 'desc' }

    const skip = (filters.page - 1) * filters.limit

    const [data, total] = await Promise.all([
      this.prisma.boxType.findMany({ where, orderBy, skip, take: filters.limit }),
      this.prisma.boxType.count({ where }),
    ])

    return buildPaginatedResult(data as BoxTypeModel[], total, filters)
  }

  async create(data: {
    code: string
    name: string
    maxWeightG?: number | null | undefined
    maxVolumeL?: number | null | undefined
    maxUnitsCount?: number | null | undefined
    isReturnable: boolean
    description?: string | null | undefined
    plantId: string
    createdBy: string
  }): Promise<BoxTypeModel> {
    return this.prisma.boxType.create({
      data: {
        code: data.code,
        name: data.name,
        maxWeightG: data.maxWeightG ?? null,
        maxVolumeL: data.maxVolumeL ?? null,
        maxUnitsCount: data.maxUnitsCount ?? null,
        isReturnable: data.isReturnable,
        description: data.description ?? null,
        plantId: data.plantId,
        createdBy: data.createdBy,
        updatedBy: data.createdBy,
      },
    }) as Promise<BoxTypeModel>
  }

  async update(
    id: string,
    data: {
      name?: string | undefined
      maxWeightG?: number | null | undefined
      maxVolumeL?: number | null | undefined
      maxUnitsCount?: number | null | undefined
      isReturnable?: boolean | undefined
      description?: string | null | undefined
      updatedBy: string
    },
  ): Promise<BoxTypeModel> {
    return this.prisma.boxType.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.maxWeightG !== undefined ? { maxWeightG: data.maxWeightG } : {}),
        ...(data.maxVolumeL !== undefined ? { maxVolumeL: data.maxVolumeL } : {}),
        ...(data.maxUnitsCount !== undefined ? { maxUnitsCount: data.maxUnitsCount } : {}),
        ...(data.isReturnable !== undefined ? { isReturnable: data.isReturnable } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        updatedBy: data.updatedBy,
        version: { increment: 1 },
      },
    }) as Promise<BoxTypeModel>
  }
}

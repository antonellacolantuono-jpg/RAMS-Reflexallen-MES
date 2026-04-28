import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { buildPaginatedResult } from '../../common/types/paginated'
import type { PaginatedResult } from '../../common/types/paginated'
import type { BaseFilters } from '../../common/base-registry.service'

export type BoxModel = {
  id: string
  code: string
  boxTypeId: string
  status: string
  currentWeightG: number
  currentVolumeL: number
  currentUnitsCount: number
  lotId: string | null
  sealedAt: Date | null
  sealedBy: string | null
  cyclesCount: number
  plantId: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  version: number
  createdBy: string
  updatedBy: string
}

type BoxFilters = BaseFilters & {
  status?: string | undefined
  boxTypeId?: string | undefined
}

@Injectable()
export class BoxesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: BoxFilters): Promise<PaginatedResult<BoxModel>> {
    const where = {
      deletedAt: null as Date | null,
      ...(filters.plantId ? { plantId: filters.plantId } : {}),
      ...(filters.search
        ? { OR: [{ code: { contains: filters.search } }] }
        : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.boxTypeId ? { boxTypeId: filters.boxTypeId } : {}),
    }

    const orderBy: Record<string, 'asc' | 'desc'> = filters.sortBy
      ? { [filters.sortBy]: filters.sortDir ?? 'asc' }
      : { createdAt: 'desc' }

    const skip = (filters.page - 1) * filters.limit

    const [data, total] = await Promise.all([
      this.prisma.box.findMany({ where, orderBy, skip, take: filters.limit }),
      this.prisma.box.count({ where }),
    ])

    return buildPaginatedResult(data as BoxModel[], total, filters)
  }

  async create(data: {
    code: string
    boxTypeId: string
    plantId: string
    createdBy: string
  }): Promise<BoxModel> {
    return this.prisma.box.create({
      data: {
        code: data.code,
        boxTypeId: data.boxTypeId,
        plantId: data.plantId,
        createdBy: data.createdBy,
        updatedBy: data.createdBy,
      },
    }) as Promise<BoxModel>
  }

  async update(
    id: string,
    data: {
      status?: string | undefined
      currentWeightG?: number | undefined
      currentVolumeL?: number | undefined
      currentUnitsCount?: number | undefined
      lotId?: string | null | undefined
      updatedBy: string
    },
  ): Promise<BoxModel> {
    return this.prisma.box.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.currentWeightG !== undefined ? { currentWeightG: data.currentWeightG } : {}),
        ...(data.currentVolumeL !== undefined ? { currentVolumeL: data.currentVolumeL } : {}),
        ...(data.currentUnitsCount !== undefined ? { currentUnitsCount: data.currentUnitsCount } : {}),
        ...(data.lotId !== undefined ? { lotId: data.lotId } : {}),
        updatedBy: data.updatedBy,
        version: { increment: 1 },
      },
    }) as Promise<BoxModel>
  }
}

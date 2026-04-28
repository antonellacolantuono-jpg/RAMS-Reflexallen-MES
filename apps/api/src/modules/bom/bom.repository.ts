import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { buildPaginatedResult } from '../../common/types/paginated'
import type { PaginatedResult } from '../../common/types/paginated'
import type { BaseFilters } from '../../common/base-registry.service'

export type BomModel = {
  id: string
  itemId: string
  version: number
  status: string
  effectiveFrom: Date | null
  effectiveTo: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  createdBy: string
  updatedBy: string
}

type BomFilters = BaseFilters & {
  status?: string | undefined
  itemId?: string | undefined
}

@Injectable()
export class BomRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: BomFilters): Promise<PaginatedResult<BomModel>> {
    const where = {
      deletedAt: null as Date | null,
      ...(filters.search ? { OR: [{ notes: { contains: filters.search } }] } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.itemId ? { itemId: filters.itemId } : {}),
    }

    const orderBy: Record<string, 'asc' | 'desc'> = filters.sortBy
      ? { [filters.sortBy]: filters.sortDir ?? 'asc' }
      : { createdAt: 'desc' }

    const skip = (filters.page - 1) * filters.limit

    const [data, total] = await Promise.all([
      this.prisma.bOM.findMany({ where, orderBy, skip, take: filters.limit }),
      this.prisma.bOM.count({ where }),
    ])

    return buildPaginatedResult(data as BomModel[], total, filters)
  }

  async create(data: {
    itemId: string
    notes?: string | null | undefined
    createdBy: string
  }): Promise<BomModel> {
    return this.prisma.bOM.create({
      data: {
        itemId: data.itemId,
        notes: data.notes ?? null,
        status: 'draft',
        createdBy: data.createdBy,
        updatedBy: data.createdBy,
      },
    }) as Promise<BomModel>
  }

  async update(
    id: string,
    data: {
      status?: string | undefined
      notes?: string | null | undefined
      updatedBy: string
    },
  ): Promise<BomModel> {
    return this.prisma.bOM.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        updatedBy: data.updatedBy,
        version: { increment: 1 },
      },
    }) as Promise<BomModel>
  }
}

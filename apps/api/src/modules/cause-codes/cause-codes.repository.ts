import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { buildPaginatedResult } from '../../common/types/paginated'
import type { PaginatedResult } from '../../common/types/paginated'
import type { BaseFilters } from '../../common/base-registry.service'

export type CauseCodeModel = {
  id: string
  code: string
  name: string
  category: string
  phase: string | null
  description: string | null
  plantId: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  version: number
  createdBy: string
  updatedBy: string
}

type CauseCodeFilters = BaseFilters & { category?: string | undefined }

@Injectable()
export class CauseCodesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: CauseCodeFilters): Promise<PaginatedResult<CauseCodeModel>> {
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
      ...(filters.category ? { category: filters.category } : {}),
    }

    const orderBy: Record<string, 'asc' | 'desc'> = filters.sortBy
      ? { [filters.sortBy]: filters.sortDir ?? 'asc' }
      : { createdAt: 'desc' }

    const skip = (filters.page - 1) * filters.limit

    const [data, total] = await Promise.all([
      this.prisma.causeCode.findMany({ where, orderBy, skip, take: filters.limit }),
      this.prisma.causeCode.count({ where }),
    ])

    return buildPaginatedResult(data as CauseCodeModel[], total, filters)
  }

  async create(data: {
    code: string
    name: string
    category: string
    phase?: string | null | undefined
    description?: string | null | undefined
    plantId: string
    createdBy: string
  }): Promise<CauseCodeModel> {
    return this.prisma.causeCode.create({
      data: {
        code: data.code,
        name: data.name,
        category: data.category,
        phase: data.phase ?? null,
        description: data.description ?? null,
        plantId: data.plantId,
        createdBy: data.createdBy,
        updatedBy: data.createdBy,
      },
    }) as Promise<CauseCodeModel>
  }

  async update(
    id: string,
    data: {
      name?: string | undefined
      category?: string | undefined
      phase?: string | null | undefined
      description?: string | null | undefined
      updatedBy: string
    },
  ): Promise<CauseCodeModel> {
    return this.prisma.causeCode.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.phase !== undefined ? { phase: data.phase } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        updatedBy: data.updatedBy,
        version: { increment: 1 },
      },
    }) as Promise<CauseCodeModel>
  }
}

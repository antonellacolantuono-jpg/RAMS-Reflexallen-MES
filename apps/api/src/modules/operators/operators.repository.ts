import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { buildPaginatedResult } from '../../common/types/paginated'
import type { PaginatedResult } from '../../common/types/paginated'
import type { BaseFilters } from '../../common/base-registry.service'

export type OperatorModel = {
  id: string
  badge: string
  userId: string | null
  status: string
  plantId: string
  firstName: string
  lastName: string
  photoUrl: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  version: number
  createdBy: string
  updatedBy: string
}

type OperatorFilters = BaseFilters & { status?: string | undefined }

@Injectable()
export class OperatorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: OperatorFilters): Promise<PaginatedResult<OperatorModel>> {
    const where = {
      deletedAt: null as Date | null,
      ...(filters.plantId ? { plantId: filters.plantId } : {}),
      ...(filters.search
        ? {
            OR: [
              { firstName: { contains: filters.search } },
              { lastName: { contains: filters.search } },
              { badge: { contains: filters.search } },
            ],
          }
        : {}),
      ...(filters.status ? { status: filters.status } : {}),
    }

    const orderBy: Record<string, 'asc' | 'desc'> = filters.sortBy
      ? { [filters.sortBy]: filters.sortDir ?? 'asc' }
      : { createdAt: 'desc' }

    const skip = (filters.page - 1) * filters.limit

    const [data, total] = await Promise.all([
      this.prisma.operator.findMany({ where, orderBy, skip, take: filters.limit }),
      this.prisma.operator.count({ where }),
    ])

    return buildPaginatedResult(data as OperatorModel[], total, filters)
  }

  async create(data: {
    badge: string
    firstName: string
    lastName: string
    status: string
    plantId: string
    createdBy: string
  }): Promise<OperatorModel> {
    return this.prisma.operator.create({
      data: {
        badge: data.badge,
        firstName: data.firstName,
        lastName: data.lastName,
        status: data.status,
        plantId: data.plantId,
        createdBy: data.createdBy,
        updatedBy: data.createdBy,
      },
    }) as Promise<OperatorModel>
  }

  async update(
    id: string,
    data: {
      firstName?: string | undefined
      lastName?: string | undefined
      status?: string | undefined
      updatedBy: string
    },
  ): Promise<OperatorModel> {
    return this.prisma.operator.update({
      where: { id },
      data: {
        ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        updatedBy: data.updatedBy,
        version: { increment: 1 },
      },
    }) as Promise<OperatorModel>
  }
}

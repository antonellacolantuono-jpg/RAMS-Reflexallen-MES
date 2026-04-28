import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { buildPaginatedResult } from '../../common/types/paginated'
import type { PaginatedResult } from '../../common/types/paginated'
import type { BaseFilters } from '../../common/base-registry.service'

export type RecipeModel = {
  id: string
  code: string
  name: string
  deviceId: string | null
  itemId: string | null
  status: string
  plantId: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  version: number
  createdBy: string
  updatedBy: string
}

type RecipeFilters = BaseFilters & {
  status?: string | undefined
  deviceId?: string | undefined
  itemId?: string | undefined
}

@Injectable()
export class RecipesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: RecipeFilters): Promise<PaginatedResult<RecipeModel>> {
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
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.deviceId ? { deviceId: filters.deviceId } : {}),
      ...(filters.itemId ? { itemId: filters.itemId } : {}),
    }

    const orderBy: Record<string, 'asc' | 'desc'> = filters.sortBy
      ? { [filters.sortBy]: filters.sortDir ?? 'asc' }
      : { createdAt: 'desc' }

    const skip = (filters.page - 1) * filters.limit

    const [data, total] = await Promise.all([
      this.prisma.recipe.findMany({ where, orderBy, skip, take: filters.limit }),
      this.prisma.recipe.count({ where }),
    ])

    return buildPaginatedResult(data as RecipeModel[], total, filters)
  }

  async create(data: {
    code: string
    name: string
    deviceId?: string | undefined
    itemId?: string | undefined
    plantId: string
    createdBy: string
  }): Promise<RecipeModel> {
    return this.prisma.recipe.create({
      data: {
        code: data.code,
        name: data.name,
        deviceId: data.deviceId ?? null,
        itemId: data.itemId ?? null,
        plantId: data.plantId,
        status: 'draft',
        createdBy: data.createdBy,
        updatedBy: data.createdBy,
      },
    }) as Promise<RecipeModel>
  }

  async update(
    id: string,
    data: {
      name?: string | undefined
      deviceId?: string | undefined
      itemId?: string | undefined
      status?: string | undefined
      updatedBy: string
    },
  ): Promise<RecipeModel> {
    return this.prisma.recipe.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.deviceId !== undefined ? { deviceId: data.deviceId } : {}),
        ...(data.itemId !== undefined ? { itemId: data.itemId } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        updatedBy: data.updatedBy,
        version: { increment: 1 },
      },
    }) as Promise<RecipeModel>
  }
}

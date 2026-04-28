import { Injectable } from '@nestjs/common'
import { BaseRegistryService, type BaseFilters } from '../../common/base-registry.service'
import { PrismaService } from '../prisma/prisma.service'
import { AuditLogService } from '../audit-log/audit-log.service'
import { RegistryGateway } from '../events/registry.gateway'
import { RecipesRepository, type RecipeModel } from './recipes.repository'
import type { PaginatedResult } from '../../common/types/paginated'
import type { CreateRecipeDto, UpdateRecipeDto } from '@mes/schemas'

export type RecipeFiltersExtended = BaseFilters & {
  status?: string | undefined
  deviceId?: string | undefined
  itemId?: string | undefined
}

@Injectable()
export class RecipesService extends BaseRegistryService<RecipeModel> {
  protected readonly entityType = 'Recipe'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected readonly delegate: any

  constructor(
    prisma: PrismaService,
    auditLog: AuditLogService,
    gateway: RegistryGateway,
    private readonly repo: RecipesRepository,
  ) {
    super(prisma, auditLog, gateway)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    this.delegate = (prisma as any).recipe
  }

  async findAll(filters: RecipeFiltersExtended): Promise<PaginatedResult<RecipeModel>> {
    return this.repo.findAll(filters)
  }

  async create(dto: CreateRecipeDto, actorId: string): Promise<RecipeModel> {
    const entity = await this.repo.create({ ...dto, createdBy: actorId })
    await this.recordCreate(entity, actorId)
    return entity
  }

  async update(id: string, dto: UpdateRecipeDto, actorId: string): Promise<RecipeModel> {
    const before = await this.findById(id)
    const after = await this.repo.update(id, { ...dto, updatedBy: actorId })
    await this.recordUpdate(before, after, actorId)
    return after
  }

  async approve(id: string, actorId: string): Promise<RecipeModel> {
    const before = await this.findById(id)
    const after = await this.prisma.recipe.update({
      where: { id },
      data: { status: 'approved', updatedBy: actorId, version: { increment: 1 } },
    }) as RecipeModel
    await this.recordUpdate(before, after, actorId)
    return after
  }
}

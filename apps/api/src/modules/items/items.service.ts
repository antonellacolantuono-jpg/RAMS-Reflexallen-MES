import { Injectable } from '@nestjs/common'
import { BaseRegistryService, type BaseFilters } from '../../common/base-registry.service'
import { PrismaService } from '../prisma/prisma.service'
import { AuditLogService } from '../audit-log/audit-log.service'
import { RegistryGateway } from '../events/registry.gateway'
import { ItemsRepository, type ItemModel } from './items.repository'
import type { PaginatedResult } from '../../common/types/paginated'
import type { CreateItemDto, UpdateItemDto } from '@mes/schemas'

export type ItemFiltersExtended = BaseFilters & { itemType?: string | undefined }

@Injectable()
export class ItemsService extends BaseRegistryService<ItemModel> {
  protected readonly entityType = 'Item'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected readonly delegate: any

  constructor(
    prisma: PrismaService,
    auditLog: AuditLogService,
    gateway: RegistryGateway,
    private readonly repo: ItemsRepository,
  ) {
    super(prisma, auditLog, gateway)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    this.delegate = (prisma as any).item
  }

  async findAll(filters: ItemFiltersExtended): Promise<PaginatedResult<ItemModel>> {
    return this.repo.findAll(filters)
  }

  async create(dto: CreateItemDto, actorId: string): Promise<ItemModel> {
    const item = await this.repo.create({ ...dto, createdBy: actorId })
    await this.recordCreate(item, actorId)
    return item
  }

  async update(id: string, dto: UpdateItemDto, actorId: string): Promise<ItemModel> {
    const before = await this.findById(id)
    const after = await this.repo.update(id, { ...dto, updatedBy: actorId })
    await this.recordUpdate(before, after, actorId)
    return after
  }
}

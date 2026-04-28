import { NotFoundException } from '@nestjs/common'
import type { PrismaService } from '../modules/prisma/prisma.service'
import type { AuditLogService } from '../modules/audit-log/audit-log.service'
import type { RegistryGateway } from '../modules/events/registry.gateway'
import type { PaginatedResult, PaginationParams } from './types/paginated'

export interface BaseFilters extends PaginationParams {
  search?: string | undefined
  isActive?: boolean | undefined
  plantId?: string | undefined
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaDelegate = any

export abstract class BaseRegistryService<TModel extends { id: string; plantId?: string }> {
  protected abstract readonly entityType: string
  protected abstract readonly delegate: PrismaDelegate

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly auditLog: AuditLogService,
    protected readonly gateway: RegistryGateway,
  ) {}

  abstract findAll(filters: BaseFilters): Promise<PaginatedResult<TModel>>

  async findById(id: string): Promise<TModel> {
    const entity = (await this.delegate.findFirst({
      where: { id, deletedAt: null },
    })) as TModel | null
    if (!entity) throw new NotFoundException(`${this.entityType} ${id} not found`)
    return entity
  }

  async findByIdIncludingDeleted(id: string): Promise<TModel> {
    const entity = (await this.delegate.findUnique({ where: { id } })) as TModel | null
    if (!entity) throw new NotFoundException(`${this.entityType} ${id} not found`)
    return entity
  }

  async softDelete(id: string, actorId: string): Promise<void> {
    const before = await this.findById(id)
    const plantId = (before as { plantId?: string }).plantId ?? 'system'
    const hasIsActive = Object.prototype.hasOwnProperty.call(before, 'isActive')
    const hasUpdatedBy = Object.prototype.hasOwnProperty.call(before, 'updatedBy')

    await this.delegate.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        ...(hasIsActive ? { isActive: false } : {}),
        ...(hasUpdatedBy ? { updatedBy: actorId } : {}),
      },
    })

    await this.auditLog.record({
      entityType: this.entityType,
      entityId: id,
      action: 'delete',
      changedBy: actorId,
      plantId,
      before,
    })

    this.gateway.emit({ module: this.entityType, id, action: 'deleted' })
  }

  async restore(id: string, actorId: string): Promise<TModel> {
    const before = await this.findByIdIncludingDeleted(id)
    const plantId = (before as { plantId?: string }).plantId ?? 'system'

    const hasIsActive = Object.prototype.hasOwnProperty.call(before, 'isActive')
    const hasUpdatedBy = Object.prototype.hasOwnProperty.call(before, 'updatedBy')

    const restored = (await this.delegate.update({
      where: { id },
      data: {
        deletedAt: null,
        ...(hasIsActive ? { isActive: true } : {}),
        ...(hasUpdatedBy ? { updatedBy: actorId } : {}),
      },
    })) as TModel

    await this.auditLog.record({
      entityType: this.entityType,
      entityId: id,
      action: 'restore',
      changedBy: actorId,
      plantId,
      before,
      after: restored,
    })

    this.gateway.emit({ module: this.entityType, id, action: 'restored' })
    return restored
  }

  protected async recordCreate(entity: TModel, actorId: string): Promise<void> {
    const plantId = (entity as { plantId?: string }).plantId ?? 'system'
    await this.auditLog.record({
      entityType: this.entityType,
      entityId: entity.id,
      action: 'create',
      changedBy: actorId,
      plantId,
      after: entity,
    })
    this.gateway.emit({ module: this.entityType, id: entity.id, action: 'created' })
  }

  protected async recordUpdate(before: TModel, after: TModel, actorId: string): Promise<void> {
    const plantId = (after as { plantId?: string }).plantId ?? 'system'
    await this.auditLog.record({
      entityType: this.entityType,
      entityId: after.id,
      action: 'update',
      changedBy: actorId,
      plantId,
      before,
      after,
    })
    this.gateway.emit({ module: this.entityType, id: after.id, action: 'updated' })
  }

  protected buildOrderBy(
    sortBy?: string,
    sortDir?: 'asc' | 'desc',
  ): Record<string, 'asc' | 'desc'> {
    if (!sortBy) return { createdAt: 'desc' }
    return { [sortBy]: sortDir ?? 'asc' }
  }
}

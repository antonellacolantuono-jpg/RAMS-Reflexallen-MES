import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AuditLogService } from '../audit-log/audit-log.service'
import { RegistryGateway } from '../events/registry.gateway'
import { buildPaginatedResult } from '../../common/types/paginated'
import type { PaginatedResult } from '../../common/types/paginated'
import type { CreateAttentionPointDto } from '@mes/schemas'

export type AttentionPointModel = {
  id: string
  entityType: string
  entityId: string
  severity: string
  message: string
  resolvedAt: Date | null
  resolvedBy: string | null
  resolveNote: string | null
  plantId: string
  createdAt: Date
  createdBy: string
}

export type AttentionPointFilters = {
  page: number
  limit: number
  sortBy?: string | undefined
  sortDir?: 'asc' | 'desc' | undefined
  search?: string | undefined
  plantId?: string | undefined
  entityType?: string | undefined
  severity?: string | undefined
  resolved?: boolean | undefined
}

@Injectable()
export class AttentionPointsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly gateway: RegistryGateway,
  ) {}

  async findAll(filters: AttentionPointFilters): Promise<PaginatedResult<AttentionPointModel>> {
    const where = {
      ...(filters.plantId ? { plantId: filters.plantId } : {}),
      ...(filters.entityType ? { entityType: filters.entityType } : {}),
      ...(filters.severity ? { severity: filters.severity } : {}),
      ...(filters.search ? { message: { contains: filters.search } } : {}),
      ...(filters.resolved === true ? { resolvedAt: { not: null } } : {}),
      ...(filters.resolved === false ? { resolvedAt: null } : {}),
    }

    const orderBy: Record<string, 'asc' | 'desc'> = filters.sortBy
      ? { [filters.sortBy]: filters.sortDir ?? 'asc' }
      : { createdAt: 'desc' }

    const skip = (filters.page - 1) * filters.limit

    const [data, total] = await Promise.all([
      this.prisma.attentionPoint.findMany({ where, orderBy, skip, take: filters.limit }),
      this.prisma.attentionPoint.count({ where }),
    ])

    return buildPaginatedResult(data as AttentionPointModel[], total, filters)
  }

  async findById(id: string): Promise<AttentionPointModel> {
    const entity = await this.prisma.attentionPoint.findUnique({ where: { id } })
    if (!entity) throw new NotFoundException(`AttentionPoint ${id} not found`)
    return entity as AttentionPointModel
  }

  async create(dto: CreateAttentionPointDto, actorId: string): Promise<AttentionPointModel> {
    const entity = await this.prisma.attentionPoint.create({
      data: {
        entityType: dto.entityType,
        entityId: dto.entityId,
        severity: dto.severity ?? 'warning',
        message: dto.message,
        plantId: dto.plantId,
        createdBy: actorId,
      },
    }) as AttentionPointModel

    await this.auditLog.record({
      entityType: 'AttentionPoint',
      entityId: entity.id,
      action: 'create',
      changedBy: actorId,
      plantId: entity.plantId,
      after: entity,
    })

    this.gateway.emit({ module: 'AttentionPoint', id: entity.id, action: 'created' })
    return entity
  }

  async resolve(id: string, resolveNote: string, actorId: string): Promise<AttentionPointModel> {
    const before = await this.findById(id)

    const after = await this.prisma.attentionPoint.update({
      where: { id },
      data: {
        resolvedAt: new Date(),
        resolvedBy: actorId,
        resolveNote: resolveNote,
      },
    }) as AttentionPointModel

    await this.auditLog.record({
      entityType: 'AttentionPoint',
      entityId: id,
      action: 'update',
      changedBy: actorId,
      plantId: before.plantId,
      before,
      after,
    })

    this.gateway.emit({ module: 'AttentionPoint', id, action: 'updated' })
    return after
  }
}

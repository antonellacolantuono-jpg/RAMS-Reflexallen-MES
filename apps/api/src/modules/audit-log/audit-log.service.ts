import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { PaginatedResult, PaginationParams } from '../../common/types/paginated'
import { buildPaginatedResult } from '../../common/types/paginated'

export interface RecordAuditParams {
  entityType: string
  entityId: string
  action: 'create' | 'update' | 'delete' | 'restore' | 'state_change'
  changedBy: string
  plantId: string
  before?: unknown
  after?: unknown
  ipAddress?: string
  userAgent?: string
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async record(params: RecordAuditParams): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        changedBy: params.changedBy,
        plantId: params.plantId,
        before: params.before !== undefined ? JSON.stringify(params.before) : null,
        after: params.after !== undefined ? JSON.stringify(params.after) : null,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    })
  }

  async findForEntity(
    entityType: string,
    entityId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<AuditLogEntry>> {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { entityType, entityId },
        orderBy: { changedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where: { entityType, entityId } }),
    ])

    const data: AuditLogEntry[] = rows.map((r) => ({
      id: r.id,
      entityType: r.entityType,
      entityId: r.entityId,
      action: r.action,
      changedBy: r.changedBy,
      changedAt: r.changedAt,
      before: r.before ? (JSON.parse(r.before) as unknown) : null,
      after: r.after ? (JSON.parse(r.after) as unknown) : null,
    }))

    return buildPaginatedResult(data, total, pagination)
  }
}

export interface AuditLogEntry {
  id: string
  entityType: string
  entityId: string
  action: string
  changedBy: string
  changedAt: Date
  before: unknown
  after: unknown
}

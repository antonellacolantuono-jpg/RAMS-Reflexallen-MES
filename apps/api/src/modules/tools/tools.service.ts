import { Injectable } from '@nestjs/common'
import { BaseRegistryService, type BaseFilters } from '../../common/base-registry.service'
import { PrismaService } from '../prisma/prisma.service'
import { AuditLogService } from '../audit-log/audit-log.service'
import { RegistryGateway } from '../events/registry.gateway'
import { ToolsRepository, type ToolModel } from './tools.repository'
import type { PaginatedResult } from '../../common/types/paginated'
import type { CreateToolDto, UpdateToolDto } from '@mes/schemas'

export type ToolFiltersExtended = BaseFilters & {
  wearStatus?: string | undefined
  equipmentNodeId?: string | undefined
}

@Injectable()
export class ToolsService extends BaseRegistryService<ToolModel> {
  protected readonly entityType = 'Tool'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected readonly delegate: any

  constructor(
    prisma: PrismaService,
    auditLog: AuditLogService,
    gateway: RegistryGateway,
    private readonly repo: ToolsRepository,
  ) {
    super(prisma, auditLog, gateway)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    this.delegate = (prisma as any).tool
  }

  async findAll(filters: ToolFiltersExtended): Promise<PaginatedResult<ToolModel>> {
    return this.repo.findAll(filters)
  }

  async create(dto: CreateToolDto, actorId: string): Promise<ToolModel> {
    // Strip any fields not on the Tool DB model by passing only known fields
    const entity = await this.repo.create({
      code: dto.code,
      name: dto.name,
      equipmentNodeId: dto.equipmentNodeId,
      maxCycles: dto.maxCycles,
      createdBy: actorId,
    })
    await this.recordCreate(entity, actorId)
    return entity
  }

  async update(id: string, dto: UpdateToolDto, actorId: string): Promise<ToolModel> {
    const before = await this.findById(id)
    const after = await this.repo.update(id, { ...dto, updatedBy: actorId })
    await this.recordUpdate(before, after, actorId)
    return after
  }
}

import { Injectable } from '@nestjs/common'
import { BaseRegistryService, type BaseFilters } from '../../common/base-registry.service'
import { PrismaService } from '../prisma/prisma.service'
import { AuditLogService } from '../audit-log/audit-log.service'
import { RegistryGateway } from '../events/registry.gateway'
import { BoxesRepository, type BoxModel } from './boxes.repository'
import type { PaginatedResult } from '../../common/types/paginated'
import type { CreateBoxDto, UpdateBoxDto } from '@mes/schemas'

export type BoxFiltersExtended = BaseFilters & {
  status?: string | undefined
  boxTypeId?: string | undefined
}

@Injectable()
export class BoxesService extends BaseRegistryService<BoxModel> {
  protected readonly entityType = 'Box'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected readonly delegate: any

  constructor(
    prisma: PrismaService,
    auditLog: AuditLogService,
    gateway: RegistryGateway,
    private readonly repo: BoxesRepository,
  ) {
    super(prisma, auditLog, gateway)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    this.delegate = (prisma as any).box
  }

  async findAll(filters: BoxFiltersExtended): Promise<PaginatedResult<BoxModel>> {
    return this.repo.findAll(filters)
  }

  async create(dto: CreateBoxDto, actorId: string): Promise<BoxModel> {
    const entity = await this.repo.create({ ...dto, createdBy: actorId })
    await this.recordCreate(entity, actorId)
    return entity
  }

  async update(id: string, dto: UpdateBoxDto, actorId: string): Promise<BoxModel> {
    const before = await this.findById(id)
    const after = await this.repo.update(id, { ...dto, updatedBy: actorId })
    await this.recordUpdate(before, after, actorId)
    return after
  }
}

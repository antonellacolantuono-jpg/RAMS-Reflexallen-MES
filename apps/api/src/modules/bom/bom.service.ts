import { Injectable } from '@nestjs/common'
import { BaseRegistryService, type BaseFilters } from '../../common/base-registry.service'
import { PrismaService } from '../prisma/prisma.service'
import { AuditLogService } from '../audit-log/audit-log.service'
import { RegistryGateway } from '../events/registry.gateway'
import { BomRepository, type BomModel } from './bom.repository'
import type { PaginatedResult } from '../../common/types/paginated'
import type { CreateBomDto, UpdateBomDto } from '@mes/schemas'

export type BomFiltersExtended = BaseFilters & {
  status?: string | undefined
  itemId?: string | undefined
}

@Injectable()
export class BomService extends BaseRegistryService<BomModel> {
  protected readonly entityType = 'Bom'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected readonly delegate: any

  constructor(
    prisma: PrismaService,
    auditLog: AuditLogService,
    gateway: RegistryGateway,
    private readonly repo: BomRepository,
  ) {
    super(prisma, auditLog, gateway)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    this.delegate = (prisma as any).bOM
  }

  async findAll(filters: BomFiltersExtended): Promise<PaginatedResult<BomModel>> {
    return this.repo.findAll(filters)
  }

  async create(dto: CreateBomDto, actorId: string): Promise<BomModel> {
    const entity = await this.repo.create({ ...dto, createdBy: actorId })
    await this.recordCreate(entity, actorId)
    return entity
  }

  async update(id: string, dto: UpdateBomDto, actorId: string): Promise<BomModel> {
    const before = await this.findById(id)
    const after = await this.repo.update(id, { ...dto, updatedBy: actorId })
    await this.recordUpdate(before, after, actorId)
    return after
  }
}

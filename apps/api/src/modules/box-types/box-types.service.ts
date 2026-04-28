import { Injectable } from '@nestjs/common'
import { BaseRegistryService, type BaseFilters } from '../../common/base-registry.service'
import { PrismaService } from '../prisma/prisma.service'
import { AuditLogService } from '../audit-log/audit-log.service'
import { RegistryGateway } from '../events/registry.gateway'
import { BoxTypesRepository, type BoxTypeModel } from './box-types.repository'
import type { PaginatedResult } from '../../common/types/paginated'
import type { CreateBoxTypeDto, UpdateBoxTypeDto } from '@mes/schemas'

@Injectable()
export class BoxTypesService extends BaseRegistryService<BoxTypeModel> {
  protected readonly entityType = 'BoxType'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected readonly delegate: any

  constructor(
    prisma: PrismaService,
    auditLog: AuditLogService,
    gateway: RegistryGateway,
    private readonly repo: BoxTypesRepository,
  ) {
    super(prisma, auditLog, gateway)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    this.delegate = (prisma as any).boxType
  }

  async findAll(filters: BaseFilters): Promise<PaginatedResult<BoxTypeModel>> {
    return this.repo.findAll(filters)
  }

  async create(dto: CreateBoxTypeDto, actorId: string): Promise<BoxTypeModel> {
    const entity = await this.repo.create({ ...dto, createdBy: actorId })
    await this.recordCreate(entity, actorId)
    return entity
  }

  async update(id: string, dto: UpdateBoxTypeDto, actorId: string): Promise<BoxTypeModel> {
    const before = await this.findById(id)
    const after = await this.repo.update(id, { ...dto, updatedBy: actorId })
    await this.recordUpdate(before, after, actorId)
    return after
  }
}

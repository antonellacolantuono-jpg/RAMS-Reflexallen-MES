import { Injectable } from '@nestjs/common'
import { BaseRegistryService, type BaseFilters } from '../../common/base-registry.service'
import { PrismaService } from '../prisma/prisma.service'
import { AuditLogService } from '../audit-log/audit-log.service'
import { RegistryGateway } from '../events/registry.gateway'
import { CauseCodesRepository, type CauseCodeModel } from './cause-codes.repository'
import type { PaginatedResult } from '../../common/types/paginated'
import type { CreateCauseCodeDto, UpdateCauseCodeDto } from '@mes/schemas'

export type CauseCodeFiltersExtended = BaseFilters & { category?: string | undefined }

@Injectable()
export class CauseCodesService extends BaseRegistryService<CauseCodeModel> {
  protected readonly entityType = 'CauseCode'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected readonly delegate: any

  constructor(
    prisma: PrismaService,
    auditLog: AuditLogService,
    gateway: RegistryGateway,
    private readonly repo: CauseCodesRepository,
  ) {
    super(prisma, auditLog, gateway)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    this.delegate = (prisma as any).causeCode
  }

  async findAll(filters: CauseCodeFiltersExtended): Promise<PaginatedResult<CauseCodeModel>> {
    return this.repo.findAll(filters)
  }

  async create(dto: CreateCauseCodeDto, actorId: string): Promise<CauseCodeModel> {
    const entity = await this.repo.create({ ...dto, createdBy: actorId })
    await this.recordCreate(entity, actorId)
    return entity
  }

  async update(id: string, dto: UpdateCauseCodeDto, actorId: string): Promise<CauseCodeModel> {
    const before = await this.findById(id)
    const after = await this.repo.update(id, { ...dto, updatedBy: actorId })
    await this.recordUpdate(before, after, actorId)
    return after
  }
}

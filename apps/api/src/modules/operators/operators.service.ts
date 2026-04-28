import { Injectable } from '@nestjs/common'
import { BaseRegistryService, type BaseFilters } from '../../common/base-registry.service'
import { PrismaService } from '../prisma/prisma.service'
import { AuditLogService } from '../audit-log/audit-log.service'
import { RegistryGateway } from '../events/registry.gateway'
import { OperatorsRepository, type OperatorModel } from './operators.repository'
import type { PaginatedResult } from '../../common/types/paginated'
import type { CreateOperatorDto, UpdateOperatorDto } from '@mes/schemas'

export type OperatorFiltersExtended = BaseFilters & { status?: string | undefined }

@Injectable()
export class OperatorsService extends BaseRegistryService<OperatorModel> {
  protected readonly entityType = 'Operator'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected readonly delegate: any

  constructor(
    prisma: PrismaService,
    auditLog: AuditLogService,
    gateway: RegistryGateway,
    private readonly repo: OperatorsRepository,
  ) {
    super(prisma, auditLog, gateway)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    this.delegate = (prisma as any).operator
  }

  async findAll(filters: OperatorFiltersExtended): Promise<PaginatedResult<OperatorModel>> {
    return this.repo.findAll(filters)
  }

  async create(dto: CreateOperatorDto, actorId: string): Promise<OperatorModel> {
    // Exclude `pin` — not stored in DB at this level
    const { pin: _pin, ...rest } = dto
    const entity = await this.repo.create({ ...rest, createdBy: actorId })
    await this.recordCreate(entity, actorId)
    return entity
  }

  async update(id: string, dto: UpdateOperatorDto, actorId: string): Promise<OperatorModel> {
    const { pin: _pin, ...rest } = dto
    const before = await this.findById(id)
    const after = await this.repo.update(id, { ...rest, updatedBy: actorId })
    await this.recordUpdate(before, after, actorId)
    return after
  }
}

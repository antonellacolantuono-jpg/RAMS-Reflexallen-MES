import { Injectable } from '@nestjs/common'
import { BaseRegistryService, type BaseFilters } from '../../common/base-registry.service'
import { PrismaService } from '../prisma/prisma.service'
import { AuditLogService } from '../audit-log/audit-log.service'
import { RegistryGateway } from '../events/registry.gateway'
import { OperatorsRepository, type OperatorModel } from './operators.repository'
import type { PaginatedResult } from '../../common/types/paginated'
import type { CreateOperatorDto, UpdateOperatorDto } from '@mes/schemas'
import { hashPin } from './pin-hash.util'

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

  override async findById(id: string): Promise<OperatorModel> {
    const entity = await super.findById(id)
    return stripPinHash(entity)
  }

  override async findByIdIncludingDeleted(id: string): Promise<OperatorModel> {
    const entity = await super.findByIdIncludingDeleted(id)
    return stripPinHash(entity)
  }

  override async restore(id: string, actorId: string): Promise<OperatorModel> {
    const restored = await super.restore(id, actorId)
    return stripPinHash(restored)
  }

  async create(dto: CreateOperatorDto, actorId: string): Promise<OperatorModel> {
    const { pin, ...rest } = dto
    const pinHash = pin ? await hashPin(pin) : undefined
    const entity = await this.repo.create({
      ...rest,
      ...(pinHash !== undefined ? { pinHash } : {}),
      createdBy: actorId,
    })
    await this.recordCreate(entity, actorId)
    return entity
  }

  async update(id: string, dto: UpdateOperatorDto, actorId: string): Promise<OperatorModel> {
    const { pin, ...rest } = dto
    const pinHash = pin ? await hashPin(pin) : undefined
    const before = await this.findById(id)
    const after = await this.repo.update(id, {
      ...rest,
      ...(pinHash !== undefined ? { pinHash } : {}),
      updatedBy: actorId,
    })
    await this.recordUpdate(before, after, actorId)
    return after
  }
}

function stripPinHash(record: OperatorModel): OperatorModel {
  const { pinHash: _pinHash, ...rest } = record as OperatorModel & { pinHash?: string | null }
  return rest as OperatorModel
}

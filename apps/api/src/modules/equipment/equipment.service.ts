import { Injectable } from '@nestjs/common'
import { BaseRegistryService, type BaseFilters } from '../../common/base-registry.service'
import { PrismaService } from '../prisma/prisma.service'
import { AuditLogService } from '../audit-log/audit-log.service'
import { RegistryGateway } from '../events/registry.gateway'
import { EquipmentRepository, type EquipmentModel } from './equipment.repository'
import type { PaginatedResult } from '../../common/types/paginated'
import type { CreateEquipmentNodeDto, UpdateEquipmentNodeDto } from '@mes/schemas'

export type EquipmentFiltersExtended = BaseFilters & {
  level?: string | undefined
  status?: string | undefined
}

@Injectable()
export class EquipmentService extends BaseRegistryService<EquipmentModel> {
  protected readonly entityType = 'Equipment'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected readonly delegate: any

  constructor(
    prisma: PrismaService,
    auditLog: AuditLogService,
    gateway: RegistryGateway,
    private readonly repo: EquipmentRepository,
  ) {
    super(prisma, auditLog, gateway)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    this.delegate = (prisma as any).equipmentNode
  }

  async findAll(filters: EquipmentFiltersExtended): Promise<PaginatedResult<EquipmentModel>> {
    return this.repo.findAll(filters)
  }

  async create(dto: CreateEquipmentNodeDto, actorId: string): Promise<EquipmentModel> {
    const entity = await this.repo.create({ ...dto, createdBy: actorId })
    await this.recordCreate(entity, actorId)
    return entity
  }

  async update(id: string, dto: UpdateEquipmentNodeDto, actorId: string): Promise<EquipmentModel> {
    const before = await this.findById(id)
    const after = await this.repo.update(id, { ...dto, updatedBy: actorId })
    await this.recordUpdate(before, after, actorId)
    return after
  }
}

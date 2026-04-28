import { Injectable } from '@nestjs/common'
import { BaseRegistryService, type BaseFilters } from '../../common/base-registry.service'
import { PrismaService } from '../prisma/prisma.service'
import { AuditLogService } from '../audit-log/audit-log.service'
import { RegistryGateway } from '../events/registry.gateway'
import { SkillsRepository, type SkillModel } from './skills.repository'
import type { PaginatedResult } from '../../common/types/paginated'
import type { CreateSkillDto, UpdateSkillDto } from '@mes/schemas'

export type SkillFiltersExtended = BaseFilters & { category?: string | undefined }

@Injectable()
export class SkillsService extends BaseRegistryService<SkillModel> {
  protected readonly entityType = 'Skill'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected readonly delegate: any

  constructor(
    prisma: PrismaService,
    auditLog: AuditLogService,
    gateway: RegistryGateway,
    private readonly repo: SkillsRepository,
  ) {
    super(prisma, auditLog, gateway)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    this.delegate = (prisma as any).skill
  }

  async findAll(filters: SkillFiltersExtended): Promise<PaginatedResult<SkillModel>> {
    return this.repo.findAll(filters)
  }

  async create(dto: CreateSkillDto, actorId: string): Promise<SkillModel> {
    const entity = await this.repo.create({ ...dto, createdBy: actorId })
    await this.recordCreate(entity, actorId)
    return entity
  }

  async update(id: string, dto: UpdateSkillDto, actorId: string): Promise<SkillModel> {
    const before = await this.findById(id)
    const after = await this.repo.update(id, { ...dto, updatedBy: actorId })
    await this.recordUpdate(before, after, actorId)
    return after
  }
}

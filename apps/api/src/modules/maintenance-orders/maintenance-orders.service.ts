import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { BaseRegistryService, type BaseFilters } from '../../common/base-registry.service'
import { PrismaService } from '../prisma/prisma.service'
import { AuditLogService } from '../audit-log/audit-log.service'
import { RegistryGateway } from '../events/registry.gateway'
import {
  MaintenanceOrdersRepository,
  type MaintenanceOrderModel,
} from './maintenance-orders.repository'
import type { PaginatedResult } from '../../common/types/paginated'
import type {
  CreateMaintenanceOrderDto,
  UpdateMaintenanceOrderDto,
} from '@mes/schemas'

export type MaintenanceOrderFiltersExtended = BaseFilters & {
  status?: string | undefined
  type?: string | undefined
  priority?: string | undefined
  equipmentNodeId?: string | undefined
}

@Injectable()
export class MaintenanceOrdersService extends BaseRegistryService<MaintenanceOrderModel> {
  protected readonly entityType = 'MaintenanceOrder'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected readonly delegate: any

  constructor(
    prisma: PrismaService,
    auditLog: AuditLogService,
    gateway: RegistryGateway,
    private readonly repo: MaintenanceOrdersRepository,
  ) {
    super(prisma, auditLog, gateway)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    this.delegate = (prisma as any).maintenanceOrder
  }

  async findAll(
    filters: MaintenanceOrderFiltersExtended,
  ): Promise<PaginatedResult<MaintenanceOrderModel>> {
    return this.repo.findAll(filters)
  }

  override async findById(id: string): Promise<MaintenanceOrderModel> {
    const entity = await this.repo.findById(id)
    if (!entity) throw new NotFoundException(`MaintenanceOrder ${id} not found`)
    return entity
  }

  async create(
    dto: CreateMaintenanceOrderDto,
    actorId: string,
  ): Promise<MaintenanceOrderModel> {
    const code = await this.generateCode(dto.plantId)
    const entity = await this.repo.create({
      code,
      equipmentNodeId: dto.equipmentNodeId,
      type: dto.type,
      priority: dto.priority,
      description: dto.description,
      plannedStart: new Date(dto.plannedStart),
      plannedEnd: new Date(dto.plannedEnd),
      ...(dto.assignedToId !== undefined ? { assignedToId: dto.assignedToId } : {}),
      plantId: dto.plantId,
      createdBy: actorId,
    })
    await this.recordCreate(entity, actorId)
    return entity
  }

  async update(
    id: string,
    dto: UpdateMaintenanceOrderDto,
    actorId: string,
  ): Promise<MaintenanceOrderModel> {
    const before = await this.findById(id)
    if (before.status !== 'scheduled') {
      throw new UnprocessableEntityException(
        `Cannot update MaintenanceOrder in status ${before.status}; only scheduled orders are editable`,
      )
    }
    const after = await this.repo.update(id, {
      ...(dto.equipmentNodeId !== undefined ? { equipmentNodeId: dto.equipmentNodeId } : {}),
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.plannedStart !== undefined ? { plannedStart: new Date(dto.plannedStart) } : {}),
      ...(dto.plannedEnd !== undefined ? { plannedEnd: new Date(dto.plannedEnd) } : {}),
      ...(dto.assignedToId !== undefined ? { assignedToId: dto.assignedToId } : {}),
      updatedBy: actorId,
    })
    await this.recordUpdate(before, after, actorId)
    return after
  }

  /**
   * MNT-{YYYY}-{NNNN} per EQUIPMENT_MANAGEMENT.md §2.2.
   * Sequence is per (plantId, year). Counts existing rows whose code starts
   * with `MNT-${year}-` and returns the next zero-padded slot.
   */
  private async generateCode(plantId: string): Promise<string> {
    const year = new Date().getFullYear()
    const count = await this.repo.countByPlantAndYear(plantId, year)
    const seq = String(count + 1).padStart(4, '0')
    return `MNT-${year}-${seq}`
  }
}

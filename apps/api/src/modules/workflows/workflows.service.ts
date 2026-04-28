import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { BaseRegistryService, type BaseFilters } from '../../common/base-registry.service'
import { PrismaService } from '../prisma/prisma.service'
import { AuditLogService } from '../audit-log/audit-log.service'
import { RegistryGateway } from '../events/registry.gateway'
import { WorkflowsRepository, type WorkflowModel, type WorkflowDetailModel, type WorkflowVersionModel, type WorkflowVersionDetailModel } from './workflows.repository'
import { validateWorkflowStructure, canEdit } from '@mes/domain'
import type { PaginatedResult } from '../../common/types/paginated'
import type { CreateWorkflowDto, UpdateWorkflowDto, UpdateWorkflowVersionDto } from '@mes/schemas'

@Injectable()
export class WorkflowsService extends BaseRegistryService<WorkflowModel> {
  protected readonly entityType = 'Workflow'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected readonly delegate: any

  constructor(
    prisma: PrismaService,
    auditLog: AuditLogService,
    gateway: RegistryGateway,
    private readonly repo: WorkflowsRepository,
  ) {
    super(prisma, auditLog, gateway)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    this.delegate = (prisma as any).workflow
  }

  async findAll(filters: BaseFilters): Promise<PaginatedResult<WorkflowModel>> {
    return this.repo.findAll(filters)
  }

  async findAllDeleted(filters: BaseFilters): Promise<PaginatedResult<WorkflowModel>> {
    return this.repo.findAllDeleted(filters)
  }

  async findDetailById(id: string): Promise<WorkflowDetailModel> {
    const workflow = await this.repo.findDetailById(id)
    if (!workflow) throw new NotFoundException(`Workflow ${id} not found`)
    return workflow
  }

  async create(dto: CreateWorkflowDto, actorId: string): Promise<WorkflowDetailModel> {
    const entity = await this.repo.create({ ...dto, createdBy: actorId })
    await this.recordCreate(entity, actorId)
    return entity
  }

  async update(id: string, dto: UpdateWorkflowDto, actorId: string): Promise<WorkflowModel> {
    const before = await this.findById(id)
    const after = await this.repo.update(id, { ...dto, updatedBy: actorId })
    await this.recordUpdate(before, after, actorId)
    return after
  }

  // ── Version endpoints ───────────────────────────────────────────────────────

  async listVersions(workflowId: string): Promise<WorkflowVersionModel[]> {
    await this.findById(workflowId) // ensures workflow exists and is not deleted
    return this.repo.listVersions(workflowId)
  }

  async findVersionById(workflowId: string, versionId: string): Promise<WorkflowVersionDetailModel> {
    await this.findById(workflowId)
    const version = await this.repo.findVersionById(versionId)
    if (!version || version.workflowId !== workflowId) {
      throw new NotFoundException(`WorkflowVersion ${versionId} not found`)
    }
    return version
  }

  async createVersion(workflowId: string, actorId: string): Promise<WorkflowVersionDetailModel> {
    await this.findById(workflowId) // ensures workflow exists
    const version = await this.repo.createVersion(workflowId, actorId)

    await this.auditLog.record({
      entityType: 'WorkflowVersion',
      entityId: version.id,
      action: 'create',
      changedBy: actorId,
      plantId: 'system',
      after: version,
    })

    this.gateway.emit({ module: 'WorkflowVersion', id: version.id, action: 'created' })
    return version
  }

  async updateVersion(
    workflowId: string,
    versionId: string,
    dto: UpdateWorkflowVersionDto,
    actorId: string,
  ): Promise<WorkflowVersionDetailModel> {
    await this.findById(workflowId)

    const existing = await this.repo.findVersionById(versionId)
    if (!existing || existing.workflowId !== workflowId) {
      throw new NotFoundException(`WorkflowVersion ${versionId} not found`)
    }

    if (!canEdit(existing.status)) {
      throw new ForbiddenException(
        `WorkflowVersion ${versionId} has status '${existing.status}' and cannot be edited`,
      )
    }

    // Validate structure before persisting (only when phases are provided)
    if (dto.phases && dto.phases.length > 0) {
      const structureResult = validateWorkflowStructure(
        {
          phases: dto.phases.map((p) => ({
            id: `phase-input-${p.order}`,
            groups: p.groups.map((g) => ({
              id: `group-input-${g.order}`,
              phaseId: `phase-input-${p.order}`,
              steps: g.steps.map((s) => ({
                id: `step-input-${s.order}`,
                groupId: `group-input-${g.order}`,
                skillId: s.skillId,
                deviceId: s.deviceId,
                recipeId: s.recipeId,
                toolId: s.toolId,
              })),
            })),
          })),
        },
        // refs: empty sets for now — full ref validation deferred to 3b
        { skillIds: new Set(), deviceIds: new Set(), recipeIds: new Set(), toolIds: new Set() },
      )

      // Only block on structural errors (ref validation is advisory in D2)
      const structuralErrors = structureResult.ok
        ? []
        : structureResult.errors.filter(
            (e) =>
              !e.field.includes('skillId') &&
              !e.field.includes('deviceId') &&
              !e.field.includes('recipeId') &&
              !e.field.includes('toolId'),
          )

      if (structuralErrors.length > 0) {
        throw new BadRequestException({
          message: 'Invalid workflow structure',
          errors: structuralErrors,
        })
      }
    }

    const before = existing

    let updated: WorkflowVersionDetailModel

    if (dto.phases !== undefined) {
      updated = await this.repo.replaceVersionTree(versionId, dto.phases, actorId)
    } else {
      // Only notes updated — fetch current tree and wrap
      const notesUpdated = await this.repo.updateVersionNotes(
        versionId,
        dto.notes ?? existing.notes ?? '',
        actorId,
      )
      updated = { ...notesUpdated, phases: existing.phases }
    }

    if (dto.notes !== undefined && dto.phases !== undefined) {
      await this.repo.updateVersionNotes(versionId, dto.notes, actorId)
    }

    await this.auditLog.record({
      entityType: 'WorkflowVersion',
      entityId: versionId,
      action: 'update',
      changedBy: actorId,
      plantId: 'system',
      before,
      after: updated,
    })

    this.gateway.emit({ module: 'WorkflowVersion', id: versionId, action: 'updated' })
    return updated
  }
}

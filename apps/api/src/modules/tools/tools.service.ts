import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { BaseRegistryService, type BaseFilters } from '../../common/base-registry.service'
import { PrismaService } from '../prisma/prisma.service'
import { AuditLogService } from '../audit-log/audit-log.service'
import { RegistryGateway } from '../events/registry.gateway'
import { ToolsRepository, type ToolModel } from './tools.repository'
import type { PaginatedResult } from '../../common/types/paginated'
import type { CreateToolDto, UpdateToolDto, ReplaceToolDto } from '@mes/schemas'

export type ToolFiltersExtended = BaseFilters & {
  wearStatus?: string | undefined
  equipmentNodeId?: string | undefined
}

/**
 * Wear thresholds (PROMPT_9): per EQUIPMENT_MANAGEMENT.md §4.4.
 *   pct < 70  → good
 *   70 ≤ pct < 90 → worn
 *   pct ≥ 90  → at_limit
 * "Exceeded" (pct ≥ 100) is a derived predicate, NOT a separate enum value —
 * the Tool stays at_limit and isExceeded() returns true. See block guard in
 * step-execution.service.applyTransition.
 */
export function deriveWearStatus(currentCycles: number, maxCycles: number | null): string {
  if (!maxCycles || maxCycles <= 0) return 'good'
  const pct = (currentCycles / maxCycles) * 100
  if (pct >= 90) return 'at_limit'
  if (pct >= 70) return 'worn'
  return 'good'
}

export function isToolExceeded(tool: { currentCyclesCount: number; maxCycles: number | null }): boolean {
  if (!tool.maxCycles || tool.maxCycles <= 0) return false
  return tool.currentCyclesCount >= tool.maxCycles
}

@Injectable()
export class ToolsService extends BaseRegistryService<ToolModel> {
  protected readonly entityType = 'Tool'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected readonly delegate: any

  constructor(
    prisma: PrismaService,
    auditLog: AuditLogService,
    gateway: RegistryGateway,
    private readonly repo: ToolsRepository,
  ) {
    super(prisma, auditLog, gateway)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    this.delegate = (prisma as any).tool
  }

  async findAll(filters: ToolFiltersExtended): Promise<PaginatedResult<ToolModel>> {
    return this.repo.findAll(filters)
  }

  async create(dto: CreateToolDto, actorId: string): Promise<ToolModel> {
    const entity = await this.repo.create({
      code: dto.code,
      name: dto.name,
      equipmentNodeId: dto.equipmentNodeId,
      maxCycles: dto.maxCycles,
      createdBy: actorId,
    })
    await this.recordCreate(entity, actorId)
    return entity
  }

  async update(id: string, dto: UpdateToolDto, actorId: string): Promise<ToolModel> {
    const before = await this.findById(id)
    const after = await this.repo.update(id, { ...dto, updatedBy: actorId })
    await this.recordUpdate(before, after, actorId)
    return after
  }

  /**
   * Auto-increment hook called by step-execution service when a tool-bearing
   * step lands in `done`. Bumps currentCyclesCount, refreshes wearStatus,
   * stamps lastUsedAt, and writes a `cycle_increment` audit entry. Idempotent
   * per call (one increment per invocation).
   */
  async recordCycle(toolId: string, actorId: string, plantId: string): Promise<ToolModel> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const delegate = (this.prisma as any).tool
    const before = (await delegate.findFirst({ where: { id: toolId, deletedAt: null } })) as ToolModel | null
    if (!before) throw new NotFoundException(`Tool ${toolId} not found`)
    const newCount = before.currentCyclesCount + 1
    const wearStatus = deriveWearStatus(newCount, before.maxCycles)
    const after = (await delegate.update({
      where: { id: toolId },
      data: {
        currentCyclesCount: newCount,
        wearStatus,
        lastUsedAt: new Date(),
        updatedBy: actorId,
        version: { increment: 1 },
      },
    })) as ToolModel
    await this.auditLog.record({
      entityType: 'Tool',
      entityId: toolId,
      action: 'state_change',
      changedBy: actorId,
      plantId,
      before: { currentCyclesCount: before.currentCyclesCount, wearStatus: before.wearStatus },
      after: { currentCyclesCount: after.currentCyclesCount, wearStatus: after.wearStatus, kind: 'cycle_increment' },
    })
    this.gateway.emit({ module: 'Tool', id: toolId, action: 'updated' })
    return after
  }

  /**
   * Tool replacement: resets counter, increments replacementCount, inserts a
   * ToolWearHistory entry, and stashes the optional photoBase64 in the audit
   * log payload (per Q2 decision — no schema migration this batch). Throws
   * UnprocessableEntityException if the tool is already soft-deleted.
   */
  async replace(toolId: string, dto: ReplaceToolDto, actorId: string, plantId: string): Promise<ToolModel> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const prismaAny = this.prisma as any
    const before = (await prismaAny.tool.findFirst({ where: { id: toolId, deletedAt: null } })) as ToolModel | null
    if (!before) throw new NotFoundException(`Tool ${toolId} not found`)
    if (!dto.reason || dto.reason.trim().length === 0) {
      throw new UnprocessableEntityException('Replacement reason is required')
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const after = await prismaAny.$transaction(async (tx: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await tx.toolWearHistory.create({
        data: {
          toolId,
          previousCyclesCount: before.currentCyclesCount,
          replacedBy: actorId,
          reason: dto.reason,
        },
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
      return await tx.tool.update({
        where: { id: toolId },
        data: {
          currentCyclesCount: 0,
          replacedAt: new Date(),
          replacementCount: { increment: 1 },
          wearStatus: 'replaced',
          updatedBy: actorId,
          version: { increment: 1 },
        },
      })
    })

    await this.auditLog.record({
      entityType: 'Tool',
      entityId: toolId,
      action: 'state_change',
      changedBy: actorId,
      plantId,
      before: {
        currentCyclesCount: before.currentCyclesCount,
        wearStatus: before.wearStatus,
        replacementCount: before.replacementCount,
      },
      after: {
        kind: 'replace',
        reason: dto.reason,
        // PROMPT_9 Q2 — photoBase64 stashed here in audit payload (no schema
        // migration). Post-DEPLOYMENT migrate to S3-backed storage with URL
        // refs (see TODO-062 photo storage note).
        photoBase64: dto.photoBase64 ?? null,
        replacementToolId: dto.replacementToolId ?? null,
        replacementCount: (after as ToolModel).replacementCount,
      },
    })
    this.gateway.emit({ module: 'Tool', id: toolId, action: 'updated' })
    return after as ToolModel
  }
}

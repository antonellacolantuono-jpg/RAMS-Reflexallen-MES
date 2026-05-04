import { Injectable, NotFoundException } from '@nestjs/common'
import { BaseRegistryService, type BaseFilters } from '../../common/base-registry.service'
import { PrismaService } from '../prisma/prisma.service'
import { AuditLogService } from '../audit-log/audit-log.service'
import { RegistryGateway } from '../events/registry.gateway'
import { ItemsRepository, type ItemModel } from './items.repository'
import type { PaginatedResult } from '../../common/types/paginated'
import type { CreateItemDto, UpdateItemDto } from '@mes/schemas'

export type ItemFiltersExtended = BaseFilters & { itemType?: string | undefined }

// PROMPT_15 — Item Detail 360° aggregate. Reports surface in apps/web on the
// new tabbed item page: BOM + tools-used + skills-required + workflows +
// equipment locations. KPI block is mocked (TODO-072).
export type Item360BomLine = {
  id: string; componentId: string; componentCode: string; componentName: string
  qty: number; uom: string; position: number; isOptional: boolean; notes: string | null
}
export type Item360ToolUsed = {
  id: string; code: string; name: string; wearStatus: string
  currentCyclesCount: number; maxCycles: number | null
  workflowNames: string[]
}
export type Item360SkillRequired = {
  id: string; code: string; name: string; category: string
  workflowNames: string[]
}
export type Item360WorkflowSummary = {
  id: string; code: string; name: string
  currentVersionNumber: number | null
  stepsCount: number
}
export type Item360WorkLocation = {
  workCenter: { id: string; code: string; name: string; status: string }
  workUnits: Array<{ id: string; code: string; name: string; status: string; activeDevicesCount: number }>
}
export type Item360ProductionStats = {
  woCompleted: number
  scrapRate: number
  avgCycleTimeSec: number
  isMock: true
}
export type Item360Response = {
  item: ItemModel
  bom: Item360BomLine[]
  toolsUsed: Item360ToolUsed[]
  skillsRequired: Item360SkillRequired[]
  workflows: Item360WorkflowSummary[]
  workCenters: Item360WorkLocation[]
  productionStats: Item360ProductionStats
}

@Injectable()
export class ItemsService extends BaseRegistryService<ItemModel> {
  protected readonly entityType = 'Item'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected readonly delegate: any

  constructor(
    prisma: PrismaService,
    auditLog: AuditLogService,
    gateway: RegistryGateway,
    private readonly repo: ItemsRepository,
  ) {
    super(prisma, auditLog, gateway)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    this.delegate = (prisma as any).item
  }

  async findAll(filters: ItemFiltersExtended): Promise<PaginatedResult<ItemModel>> {
    return this.repo.findAll(filters)
  }

  async create(dto: CreateItemDto, actorId: string): Promise<ItemModel> {
    const item = await this.repo.create({ ...dto, createdBy: actorId })
    await this.recordCreate(item, actorId)
    return item
  }

  async update(id: string, dto: UpdateItemDto, actorId: string): Promise<ItemModel> {
    const before = await this.findById(id)
    const after = await this.repo.update(id, { ...dto, updatedBy: actorId })
    await this.recordUpdate(before, after, actorId)
    return after
  }

  // PROMPT_15 — Aggregate query for the Item Detail 360° page (Risorse +
  // Workflows + Postazioni tabs). Uses a single batch of parallel queries plus
  // post-aggregation in JS. Production stats are stubbed pending a real KPI
  // engine (TODO-072).
  async get360(id: string): Promise<Item360Response> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const prisma = this.prisma as any
    const item = (await prisma.item.findFirst({
      where: { id, deletedAt: null },
    })) as ItemModel | null
    if (!item) throw new NotFoundException(`Item ${id} not found`)

    const [bomRaw, workflows, allWorkUnits] = await Promise.all([
      // BOM lines — most-recent BOM for this item (released > draft fallback)
      prisma.bOM.findFirst({
        where: { itemId: id, deletedAt: null },
        orderBy: [{ status: 'desc' }, { version: 'desc' }],
        include: { lines: { orderBy: { position: 'asc' } } },
      }) as Promise<{
        id: string
        lines: Array<{
          id: string; bomId: string; componentId: string; qty: number; uom: string
          position: number; isOptional: boolean; notes: string | null
        }>
      } | null>,
      // Workflows — strict itemId match (decision #2). Hydrate steps for tool/skill aggregation.
      prisma.workflow.findMany({
        where: { itemId: id, deletedAt: null, plantId: item.plantId },
        select: {
          id: true, code: true, name: true,
          currentVersionId: true,
          workflowVersions: {
            select: {
              id: true, version: true, status: true,
              phases: {
                select: {
                  groups: {
                    select: {
                      steps: {
                        select: { id: true, toolId: true, skillId: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      // All Work Units in the item's plant — flat list, grouped client-side
      // by parentId. (Decision #3 — show all plant WUs even though they're
      // not item-scoped.)
      prisma.equipmentNode.findMany({
        where: {
          plantId: item.plantId,
          deletedAt: null,
          level: { in: ['work_center', 'work_unit'] },
        },
        select: {
          id: true, code: true, name: true, level: true, status: true, parentId: true,
          devices: { select: { id: true, deletedAt: true } },
        },
      }) as Promise<Array<{
        id: string; code: string; name: string; level: string; status: string; parentId: string | null
        devices: Array<{ id: string; deletedAt: Date | null }>
      }>>,
    ])

    // Hydrate BOM line component names
    const componentIds = (bomRaw?.lines ?? []).map((l) => l.componentId)
    const components = componentIds.length === 0
      ? []
      : (await prisma.item.findMany({
          where: { id: { in: componentIds } },
          select: { id: true, code: true, name: true },
        })) as Array<{ id: string; code: string; name: string }>
    const componentById = new Map(components.map((c) => [c.id, c]))

    const bom: Item360BomLine[] = (bomRaw?.lines ?? []).map((l) => {
      const comp = componentById.get(l.componentId)
      return {
        id: l.id,
        componentId: l.componentId,
        componentCode: comp?.code ?? l.componentId,
        componentName: comp?.name ?? '(componente sconosciuto)',
        qty: l.qty,
        uom: l.uom,
        position: l.position,
        isOptional: l.isOptional,
        notes: l.notes,
      }
    })

    // Aggregate distinct toolIds + skillIds across this item's workflow steps,
    // tracking which workflow names referenced each. (Decision #1 — derive
    // tools from workflow steps, not from a Tool.compatibleItems M2M.)
    type IdToWorkflowNames = Map<string, Set<string>>
    const toolIdToWorkflows: IdToWorkflowNames = new Map()
    const skillIdToWorkflows: IdToWorkflowNames = new Map()

    type WorkflowRow = {
      id: string; code: string; name: string
      currentVersionId: string | null
      workflowVersions: Array<{
        id: string; version: number; status: string
        phases: Array<{ groups: Array<{ steps: Array<{ toolId: string | null; skillId: string | null }> }> }>
      }>
    }
    const wfRows = workflows as WorkflowRow[]
    const workflowSummaries: Item360WorkflowSummary[] = wfRows.map((w) => {
      const current = w.workflowVersions.find((v) => v.id === w.currentVersionId)
        ?? w.workflowVersions[0]
        ?? null
      let stepsCount = 0
      for (const ph of current?.phases ?? []) {
        for (const gr of ph.groups) {
          for (const st of gr.steps) {
            stepsCount++
            if (st.toolId) {
              const set = toolIdToWorkflows.get(st.toolId) ?? new Set<string>()
              set.add(w.name)
              toolIdToWorkflows.set(st.toolId, set)
            }
            if (st.skillId) {
              const set = skillIdToWorkflows.get(st.skillId) ?? new Set<string>()
              set.add(w.name)
              skillIdToWorkflows.set(st.skillId, set)
            }
          }
        }
      }
      return {
        id: w.id,
        code: w.code,
        name: w.name,
        currentVersionNumber: current?.version ?? null,
        stepsCount,
      }
    })

    const [tools, skills] = await Promise.all([
      toolIdToWorkflows.size === 0
        ? Promise.resolve([] as Array<{
            id: string; code: string; name: string; wearStatus: string
            currentCyclesCount: number; maxCycles: number | null
          }>)
        : (prisma.tool.findMany({
            where: { id: { in: Array.from(toolIdToWorkflows.keys()) }, deletedAt: null },
            select: {
              id: true, code: true, name: true, wearStatus: true,
              currentCyclesCount: true, maxCycles: true,
            },
          }) as Promise<Array<{
            id: string; code: string; name: string; wearStatus: string
            currentCyclesCount: number; maxCycles: number | null
          }>>),
      skillIdToWorkflows.size === 0
        ? Promise.resolve([] as Array<{ id: string; code: string; name: string; category: string }>)
        : (prisma.skill.findMany({
            where: { id: { in: Array.from(skillIdToWorkflows.keys()) }, deletedAt: null },
            select: { id: true, code: true, name: true, category: true },
          }) as Promise<Array<{ id: string; code: string; name: string; category: string }>>),
    ])

    const toolsUsed: Item360ToolUsed[] = tools.map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      wearStatus: t.wearStatus,
      currentCyclesCount: t.currentCyclesCount,
      maxCycles: t.maxCycles,
      workflowNames: Array.from(toolIdToWorkflows.get(t.id) ?? []).sort(),
    }))
    const skillsRequired: Item360SkillRequired[] = skills.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      category: s.category,
      workflowNames: Array.from(skillIdToWorkflows.get(s.id) ?? []).sort(),
    }))

    // Group equipment tree: WC at top, WUs as children (parentId match).
    const wcs = allWorkUnits.filter((n) => n.level === 'work_center')
    const wus = allWorkUnits.filter((n) => n.level === 'work_unit')
    const workCenters: Item360WorkLocation[] = wcs.map((wc) => ({
      workCenter: { id: wc.id, code: wc.code, name: wc.name, status: wc.status },
      workUnits: wus
        .filter((wu) => wu.parentId === wc.id)
        .map((wu) => ({
          id: wu.id,
          code: wu.code,
          name: wu.name,
          status: wu.status,
          activeDevicesCount: wu.devices.filter((d) => d.deletedAt === null).length,
        })),
    }))

    // TODO-072 — Mock production stats until KPI engine lands
    const productionStats: Item360ProductionStats = {
      woCompleted: 0,
      scrapRate: 0,
      avgCycleTimeSec: 0,
      isMock: true,
    }

    return {
      item,
      bom,
      toolsUsed,
      skillsRequired,
      workflows: workflowSummaries,
      workCenters,
      productionStats,
    }
  }
}

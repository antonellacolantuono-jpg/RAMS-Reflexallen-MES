import { describe, it, expect, vi } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { ItemsService } from './items.service'

// PROMPT_15 — Item Detail 360° aggregate endpoint test (A.1)
// Mocks Prisma at the per-table level. Verifies that get360 returns the
// aggregate shape, derives tools/skills from workflow steps (decision #1),
// strict-filters workflows by itemId (decision #2), and groups equipment
// nodes into WC -> WU tree (decision #3).

function makeServiceWithPrisma(prisma: Record<string, unknown>) {
  // BaseRegistryService dependencies
  const auditLog = { record: vi.fn() }
  const gateway = { emitRegistryEvent: vi.fn() }
  const repo = {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByCode: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    restore: vi.fn(),
    findTrashed: vi.fn(),
  }
  return new ItemsService(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    auditLog as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gateway as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    repo as any,
  )
}

describe('ItemsService.get360', () => {
  const baseItem = {
    id: 'item-1',
    code: 'FG-001',
    name: 'Pneumatic tube assy',
    itemType: 'finished_good',
    trackingMode: 'lot',
    uom: 'pc',
    description: null,
    imageUrl: null,
    plantId: 'plant-1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    version: 1,
    createdBy: 'system',
    updatedBy: 'system',
  }

  it('throws 404 when item not found', async () => {
    const prisma = {
      item: { findFirst: vi.fn().mockResolvedValue(null) },
    }
    const service = makeServiceWithPrisma(prisma)
    await expect(service.get360('nonexistent')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('returns aggregate with empty arrays when item has no relations', async () => {
    const prisma = {
      item: {
        findFirst: vi.fn().mockResolvedValue(baseItem),
        findMany: vi.fn().mockResolvedValue([]),
      },
      bOM: { findFirst: vi.fn().mockResolvedValue(null) },
      workflow: { findMany: vi.fn().mockResolvedValue([]) },
      equipmentNode: { findMany: vi.fn().mockResolvedValue([]) },
      tool: { findMany: vi.fn().mockResolvedValue([]) },
      skill: { findMany: vi.fn().mockResolvedValue([]) },
    }
    const service = makeServiceWithPrisma(prisma)
    const result = await service.get360('item-1')
    expect(result.item.id).toBe('item-1')
    expect(result.bom).toEqual([])
    expect(result.toolsUsed).toEqual([])
    expect(result.skillsRequired).toEqual([])
    expect(result.workflows).toEqual([])
    expect(result.workCenters).toEqual([])
    expect(result.productionStats.isMock).toBe(true)
  })

  it('hydrates BOM lines with component code+name', async () => {
    const prisma = {
      item: {
        findFirst: vi.fn().mockResolvedValue(baseItem),
        findMany: vi
          .fn()
          .mockResolvedValue([{ id: 'comp-1', code: 'RAW-001', name: 'PA12 pellet' }]),
      },
      bOM: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'bom-1',
          lines: [
            {
              id: 'l1',
              bomId: 'bom-1',
              componentId: 'comp-1',
              qty: 0.5,
              uom: 'kg',
              position: 1,
              isOptional: false,
              notes: null,
            },
          ],
        }),
      },
      workflow: { findMany: vi.fn().mockResolvedValue([]) },
      equipmentNode: { findMany: vi.fn().mockResolvedValue([]) },
      tool: { findMany: vi.fn().mockResolvedValue([]) },
      skill: { findMany: vi.fn().mockResolvedValue([]) },
    }
    const service = makeServiceWithPrisma(prisma)
    const result = await service.get360('item-1')
    expect(result.bom).toHaveLength(1)
    expect(result.bom[0]).toMatchObject({
      componentCode: 'RAW-001',
      componentName: 'PA12 pellet',
      qty: 0.5,
      uom: 'kg',
    })
  })

  it('derives tools and skills from workflow steps (decision #1)', async () => {
    const prisma = {
      item: {
        findFirst: vi.fn().mockResolvedValue(baseItem),
        findMany: vi.fn().mockResolvedValue([]),
      },
      bOM: { findFirst: vi.fn().mockResolvedValue(null) },
      workflow: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'wf-1',
            code: 'WF-PNE-001',
            name: 'Pneumatic Air',
            currentVersionId: 'wfv-1',
            workflowVersions: [
              {
                id: 'wfv-1',
                version: 2,
                status: 'approved',
                phases: [
                  {
                    groups: [
                      {
                        steps: [
                          { id: 's1', toolId: 'tool-1', skillId: 'skill-1' },
                          { id: 's2', toolId: null, skillId: 'skill-1' },
                          { id: 's3', toolId: 'tool-1', skillId: null },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ]),
      },
      equipmentNode: { findMany: vi.fn().mockResolvedValue([]) },
      tool: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'tool-1',
            code: 'TOOL-MOLD-001',
            name: 'Mold #1',
            wearStatus: 'ok',
            currentCyclesCount: 100,
            maxCycles: 1000,
          },
        ]),
      },
      skill: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'skill-1', code: 'EXT-OP', name: 'Operatore Estrusione', category: 'production' },
        ]),
      },
    }
    const service = makeServiceWithPrisma(prisma)
    const result = await service.get360('item-1')
    expect(result.toolsUsed).toHaveLength(1)
    expect(result.toolsUsed[0]?.code).toBe('TOOL-MOLD-001')
    expect(result.toolsUsed[0]?.workflowNames).toEqual(['Pneumatic Air'])
    expect(result.skillsRequired).toHaveLength(1)
    expect(result.skillsRequired[0]?.code).toBe('EXT-OP')
    expect(result.workflows[0]?.stepsCount).toBe(3)
  })

  it('groups equipment nodes into WC->WU tree (decision #3, all plant WUs)', async () => {
    const prisma = {
      item: {
        findFirst: vi.fn().mockResolvedValue(baseItem),
        findMany: vi.fn().mockResolvedValue([]),
      },
      bOM: { findFirst: vi.fn().mockResolvedValue(null) },
      workflow: { findMany: vi.fn().mockResolvedValue([]) },
      equipmentNode: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'wc-1',
            code: 'WC-LEAK',
            name: 'Leak Test',
            level: 'work_center',
            status: 'available',
            parentId: null,
            devices: [],
          },
          {
            id: 'wu-1',
            code: 'WS-LEAK-01',
            name: 'Postazione Leak 1',
            level: 'work_unit',
            status: 'available',
            parentId: 'wc-1',
            devices: [{ id: 'd1', deletedAt: null }],
          },
          {
            id: 'wu-orphan',
            code: 'WS-ORPH',
            name: 'Orphan',
            level: 'work_unit',
            status: 'available',
            parentId: 'wc-other', // not in result set
            devices: [],
          },
        ]),
      },
      tool: { findMany: vi.fn().mockResolvedValue([]) },
      skill: { findMany: vi.fn().mockResolvedValue([]) },
    }
    const service = makeServiceWithPrisma(prisma)
    const result = await service.get360('item-1')
    expect(result.workCenters).toHaveLength(1)
    expect(result.workCenters[0]?.workCenter.code).toBe('WC-LEAK')
    expect(result.workCenters[0]?.workUnits).toHaveLength(1)
    expect(result.workCenters[0]?.workUnits[0]?.code).toBe('WS-LEAK-01')
    expect(result.workCenters[0]?.workUnits[0]?.activeDevicesCount).toBe(1)
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { WorkflowsService } from './workflows.service'
import type { WorkflowDetailModel, WorkflowVersionDetailModel, WorkflowVersionModel } from './workflows.repository'

// ── Minimal mock factories ────────────────────────────────────────────────────

function makeWorkflow(overrides: Partial<WorkflowDetailModel> = {}): WorkflowDetailModel {
  return {
    id: 'wf-001',
    code: 'WF-TEST',
    name: 'Test Workflow',
    description: null,
    itemId: null,
    currentVersionId: 'ver-001',
    plantId: 'plant-001',
    createdAt: new Date('2026-04-01'),
    updatedAt: new Date('2026-04-01'),
    deletedAt: null,
    version: 1,
    createdBy: 'system',
    updatedBy: 'system',
    currentVersion: makeVersionDetail(),
    ...overrides,
  }
}

function makeVersionDetail(overrides: Partial<WorkflowVersionDetailModel> = {}): WorkflowVersionDetailModel {
  return {
    id: 'ver-001',
    workflowId: 'wf-001',
    version: 1,
    status: 'draft',
    approvedBy: null,
    approvedAt: null,
    notes: null,
    createdAt: new Date('2026-04-01'),
    createdBy: 'system',
    updatedAt: new Date('2026-04-01'),
    updatedBy: 'system',
    phases: [],
    ...overrides,
  }
}

function makeVersionFlat(overrides: Partial<WorkflowVersionModel> = {}): WorkflowVersionModel {
  return {
    id: 'ver-001',
    workflowId: 'wf-001',
    version: 1,
    status: 'draft',
    approvedBy: null,
    approvedAt: null,
    notes: null,
    createdAt: new Date('2026-04-01'),
    createdBy: 'system',
    updatedAt: new Date('2026-04-01'),
    updatedBy: 'system',
    ...overrides,
  }
}

// ── Mock dependencies ─────────────────────────────────────────────────────────

function makeService() {
  const repo = {
    findAll: vi.fn(),
    findAllDeleted: vi.fn(),
    findDetailById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    listVersions: vi.fn(),
    findVersionById: vi.fn(),
    createVersion: vi.fn(),
    replaceVersionTree: vi.fn(),
    updateVersionNotes: vi.fn(),
  }

  const prisma = {
    workflow: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  }

  const auditLog = { record: vi.fn().mockResolvedValue(undefined) }
  const gateway = { emit: vi.fn() }

  // WorkflowsService extends BaseRegistryService which needs prisma/auditLog/gateway
  // We instantiate it and manually override the delegate used by base methods
  const service = new WorkflowsService(
    prisma as never,
    auditLog as never,
    gateway as never,
    repo as never,
  )

  // Patch delegate so base class findById works via mock
  ;(service as never)['delegate'] = prisma.workflow

  return { service, repo, prisma, auditLog, gateway }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WorkflowsService', () => {
  let ctx: ReturnType<typeof makeService>

  beforeEach(() => {
    ctx = makeService()
  })

  // ── findAll ────────────────────────────────────────────────────────────────

  it('findAll delegates to repository', async () => {
    const expected = { data: [], total: 0, page: 1, limit: 25, totalPages: 0 }
    ctx.repo.findAll.mockResolvedValue(expected)

    const result = await ctx.service.findAll({ page: 1, limit: 25, plantId: 'plant-001' })
    expect(result).toBe(expected)
    expect(ctx.repo.findAll).toHaveBeenCalledWith({ page: 1, limit: 25, plantId: 'plant-001' })
  })

  it('findAll enforces plantId filter by passing it to repository', async () => {
    ctx.repo.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 25, totalPages: 0 })

    await ctx.service.findAll({ page: 1, limit: 25, plantId: 'plant-ACME' })
    expect(ctx.repo.findAll).toHaveBeenCalledWith(expect.objectContaining({ plantId: 'plant-ACME' }))
  })

  // ── findDetailById ─────────────────────────────────────────────────────────

  it('findDetailById returns workflow with currentVersion tree', async () => {
    const wf = makeWorkflow()
    ctx.repo.findDetailById.mockResolvedValue(wf)

    const result = await ctx.service.findDetailById('wf-001')
    expect(result.id).toBe('wf-001')
    expect(result.currentVersion).not.toBeNull()
    expect(result.currentVersion?.status).toBe('draft')
  })

  it('findDetailById throws NotFoundException when workflow not found', async () => {
    ctx.repo.findDetailById.mockResolvedValue(null)

    await expect(ctx.service.findDetailById('wf-MISSING')).rejects.toThrow(NotFoundException)
  })

  // ── create ─────────────────────────────────────────────────────────────────

  it('create returns workflow with first draft version', async () => {
    const wf = makeWorkflow()
    ctx.repo.create.mockResolvedValue(wf)

    const result = await ctx.service.create(
      { code: 'WF-TEST', name: 'Test', plantId: 'plant-001' },
      'user-1',
    )

    expect(result.currentVersion?.status).toBe('draft')
    expect(result.currentVersion?.version).toBe(1)
  })

  it('create records audit log after creation', async () => {
    const wf = makeWorkflow()
    ctx.repo.create.mockResolvedValue(wf)

    await ctx.service.create({ code: 'WF-TEST', name: 'Test', plantId: 'plant-001' }, 'user-1')
    expect(ctx.auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'Workflow', action: 'create' }),
    )
  })

  // ── update ─────────────────────────────────────────────────────────────────

  it('update returns updated workflow metadata', async () => {
    const wf = makeWorkflow()
    ctx.prisma.workflow.findFirst.mockResolvedValue(wf)
    ctx.repo.update.mockResolvedValue({ ...wf, name: 'Updated Name' })

    const result = await ctx.service.update('wf-001', { name: 'Updated Name' }, 'user-1')
    expect(result.name).toBe('Updated Name')
    expect(ctx.auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'update' }),
    )
  })

  // ── softDelete & restore ───────────────────────────────────────────────────

  it('softDelete marks workflow as deleted via base class', async () => {
    const wf = makeWorkflow()
    ctx.prisma.workflow.findFirst.mockResolvedValue(wf)
    ctx.prisma.workflow.update.mockResolvedValue({ ...wf, deletedAt: new Date() })

    await ctx.service.softDelete('wf-001', 'user-1')
    expect(ctx.prisma.workflow.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date) }) }),
    )
  })

  it('restore clears deletedAt via base class', async () => {
    const deleted = makeWorkflow({ deletedAt: new Date() })
    ctx.prisma.workflow.findUnique.mockResolvedValue(deleted)
    ctx.prisma.workflow.update.mockResolvedValue({ ...deleted, deletedAt: null })

    const result = await ctx.service.restore('wf-001', 'user-1')
    expect(result.deletedAt).toBeNull()
  })

  // ── listVersions ───────────────────────────────────────────────────────────

  it('listVersions returns all versions for a workflow', async () => {
    ctx.prisma.workflow.findFirst.mockResolvedValue(makeWorkflow())
    const versions = [makeVersionFlat(), makeVersionFlat({ id: 'ver-002', version: 2 })]
    ctx.repo.listVersions.mockResolvedValue(versions)

    const result = await ctx.service.listVersions('wf-001')
    expect(result).toHaveLength(2)
  })

  it('listVersions throws NotFoundException when workflow not found', async () => {
    ctx.prisma.workflow.findFirst.mockResolvedValue(null)

    await expect(ctx.service.listVersions('wf-MISSING')).rejects.toThrow(NotFoundException)
  })

  // ── createVersion ──────────────────────────────────────────────────────────

  it('createVersion creates a new draft version and records audit log', async () => {
    ctx.prisma.workflow.findFirst.mockResolvedValue(makeWorkflow())
    const newVer = makeVersionDetail({ id: 'ver-002', version: 2 })
    ctx.repo.createVersion.mockResolvedValue(newVer)

    const result = await ctx.service.createVersion('wf-001', 'user-1')
    expect(result.version).toBe(2)
    expect(result.status).toBe('draft')
    expect(ctx.auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'WorkflowVersion', action: 'create' }),
    )
  })

  // ── updateVersion ──────────────────────────────────────────────────────────

  it('updateVersion replaces phase/group/step tree on draft version', async () => {
    ctx.prisma.workflow.findFirst.mockResolvedValue(makeWorkflow())
    const existingVer = makeVersionDetail()
    ctx.repo.findVersionById.mockResolvedValue(existingVer)

    const updatedVer = makeVersionDetail({ phases: [] })
    ctx.repo.replaceVersionTree.mockResolvedValue(updatedVer)

    const phases = [
      {
        order: 1,
        category: 'production',
        name: 'Phase 1',
        isCycleBased: false,
        isAutoGenerated: false,
        groups: [
          {
            order: 1,
            category: 'manual',
            name: 'Group 1',
            supportsParallel: false,
            supportsRecovery: false,
            isAutoGenerated: false,
            steps: [
              {
                order: 1,
                category: 'PRODUCTION',
                actionType: 'manual_operation',
                type: 'normal',
                source: 'manual',
                name: 'Step 1',
                isRequired: true,
              },
            ],
          },
        ],
      },
    ]

    await ctx.service.updateVersion('wf-001', 'ver-001', { phases }, 'user-1')
    expect(ctx.repo.replaceVersionTree).toHaveBeenCalledWith('ver-001', phases, 'user-1')
  })

  it('updateVersion throws ForbiddenException when version is not draft', async () => {
    ctx.prisma.workflow.findFirst.mockResolvedValue(makeWorkflow())
    ctx.repo.findVersionById.mockResolvedValue(makeVersionDetail({ status: 'approved' }))

    await expect(
      ctx.service.updateVersion('wf-001', 'ver-001', { phases: [] }, 'user-1'),
    ).rejects.toThrow(ForbiddenException)
  })

  it('updateVersion throws BadRequestException on invalid structure (empty phase)', async () => {
    ctx.prisma.workflow.findFirst.mockResolvedValue(makeWorkflow())
    ctx.repo.findVersionById.mockResolvedValue(makeVersionDetail({ status: 'draft' }))

    // Phase with no groups — triggers structural error
    const phases = [
      {
        order: 1,
        category: 'production',
        name: 'Phase 1',
        isCycleBased: false,
        isAutoGenerated: false,
        groups: [], // empty groups → structural error
      },
    ]

    await expect(
      ctx.service.updateVersion('wf-001', 'ver-001', { phases }, 'user-1'),
    ).rejects.toThrow(BadRequestException)
  })

  it('updateVersion throws NotFoundException when version does not belong to workflow', async () => {
    ctx.prisma.workflow.findFirst.mockResolvedValue(makeWorkflow())
    ctx.repo.findVersionById.mockResolvedValue(
      makeVersionDetail({ workflowId: 'wf-DIFFERENT' }),
    )

    await expect(
      ctx.service.updateVersion('wf-001', 'ver-001', {}, 'user-1'),
    ).rejects.toThrow(NotFoundException)
  })

  it('findVersionById throws NotFoundException when version not found', async () => {
    ctx.prisma.workflow.findFirst.mockResolvedValue(makeWorkflow())
    ctx.repo.findVersionById.mockResolvedValue(null)

    await expect(ctx.service.findVersionById('wf-001', 'ver-MISSING')).rejects.toThrow(
      NotFoundException,
    )
  })
})

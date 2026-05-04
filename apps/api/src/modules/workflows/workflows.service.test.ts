import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common'
import { WorkflowsService } from './workflows.service'
import type { WorkflowDetailModel, WorkflowVersionDetailModel, WorkflowVersionModel, PhaseModel } from './workflows.repository'

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
    approveVersion: vi.fn(),
    deprecateVersion: vi.fn(),
    cloneWorkflow: vi.fn(),
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
  ;(service as unknown as Record<string, unknown>)['delegate'] = prisma.workflow

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

  // ── approveVersion ─────────────────────────────────────────────────────────

  function makeVersionWithValidTree(
    overrides: Partial<WorkflowVersionDetailModel> = {},
  ): WorkflowVersionDetailModel {
    const phase: PhaseModel = {
      id: 'phase-1',
      workflowVersionId: 'ver-001',
      order: 1,
      category: 'production',
      name: 'P1',
      description: null,
      imageUrl: null,
      isCycleBased: false,
      isAutoGenerated: false,
      createdAt: new Date('2026-04-01'),
      updatedAt: new Date('2026-04-01'),
      createdBy: 'system',
      updatedBy: 'system',
      groups: [
        {
          id: 'group-1',
          phaseId: 'phase-1',
          order: 1,
          category: 'manual',
          name: 'G1',
          description: null,
          supportsParallel: false,
          supportsRecovery: false,
          isAutoGenerated: false,
          createdAt: new Date('2026-04-01'),
          updatedAt: new Date('2026-04-01'),
          createdBy: 'system',
          updatedBy: 'system',
          steps: [
            {
              id: 'step-1',
              groupId: 'group-1',
              order: 1,
              category: 'PRODUCTION',
              actionType: 'manual_operation',
              type: 'normal',
              source: 'manual',
              name: 'S1',
              instructions: null,
              skillId: null,
              deviceId: null,
              recipeId: null,
              toolId: null,
              standardTimeSec: null,
              isRequired: true,
              partReference: null,
              noTargetPolicy: null,
              data: null,
              createdAt: new Date('2026-04-01'),
              updatedAt: new Date('2026-04-01'),
              createdBy: 'system',
              updatedBy: 'system',
            },
          ],
        },
      ],
    }
    return makeVersionDetail({ phases: [phase], ...overrides })
  }

  it('approveVersion transitions draft → approved and records audit log', async () => {
    ctx.prisma.workflow.findFirst.mockResolvedValue(makeWorkflow())
    const draft = makeVersionWithValidTree({ status: 'draft' })
    const approved = makeVersionWithValidTree({
      status: 'approved',
      approvedBy: 'user-1',
      approvedAt: new Date(),
    })
    ctx.repo.findVersionById
      .mockResolvedValueOnce(draft)
      .mockResolvedValueOnce(approved)
    ctx.repo.approveVersion.mockResolvedValue(approved)

    const result = await ctx.service.approveVersion('wf-001', 'ver-001', 'user-1')
    expect(result.status).toBe('approved')
    expect(ctx.repo.approveVersion).toHaveBeenCalledWith('ver-001', 'user-1')
    expect(ctx.auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'WorkflowVersion',
        action: 'state_change',
      }),
    )
  })

  it('approveVersion throws ConflictException when transitioning from approved', async () => {
    ctx.prisma.workflow.findFirst.mockResolvedValue(makeWorkflow())
    ctx.repo.findVersionById.mockResolvedValue(
      makeVersionWithValidTree({ status: 'approved' }),
    )

    await expect(
      ctx.service.approveVersion('wf-001', 'ver-001', 'user-1'),
    ).rejects.toThrow(ConflictException)
  })

  it('approveVersion throws ConflictException when transitioning from deprecated', async () => {
    ctx.prisma.workflow.findFirst.mockResolvedValue(makeWorkflow())
    ctx.repo.findVersionById.mockResolvedValue(
      makeVersionWithValidTree({ status: 'deprecated' }),
    )

    await expect(
      ctx.service.approveVersion('wf-001', 'ver-001', 'user-1'),
    ).rejects.toThrow(ConflictException)
  })

  it('approveVersion throws BadRequestException when workflow has no phases', async () => {
    ctx.prisma.workflow.findFirst.mockResolvedValue(makeWorkflow())
    ctx.repo.findVersionById.mockResolvedValue(
      makeVersionDetail({ status: 'draft', phases: [] }),
    )

    await expect(
      ctx.service.approveVersion('wf-001', 'ver-001', 'user-1'),
    ).rejects.toThrow(BadRequestException)
  })

  it('approveVersion throws BadRequestException when phase has no groups', async () => {
    ctx.prisma.workflow.findFirst.mockResolvedValue(makeWorkflow())
    const broken = makeVersionWithValidTree({ status: 'draft' })
    broken.phases[0]!.groups = []
    ctx.repo.findVersionById.mockResolvedValue(broken)

    await expect(
      ctx.service.approveVersion('wf-001', 'ver-001', 'user-1'),
    ).rejects.toThrow(BadRequestException)
  })

  it('approveVersion throws NotFoundException when version does not belong to workflow', async () => {
    ctx.prisma.workflow.findFirst.mockResolvedValue(makeWorkflow())
    ctx.repo.findVersionById.mockResolvedValue(
      makeVersionWithValidTree({ workflowId: 'wf-OTHER' }),
    )

    await expect(
      ctx.service.approveVersion('wf-001', 'ver-001', 'user-1'),
    ).rejects.toThrow(NotFoundException)
  })

  // ── deprecateVersion ───────────────────────────────────────────────────────

  it('deprecateVersion transitions approved → deprecated and records audit log', async () => {
    ctx.prisma.workflow.findFirst.mockResolvedValue(makeWorkflow())
    const approved = makeVersionWithValidTree({ status: 'approved' })
    const deprecated = makeVersionWithValidTree({ status: 'deprecated' })
    ctx.repo.findVersionById
      .mockResolvedValueOnce(approved)
      .mockResolvedValueOnce(deprecated)
    ctx.repo.deprecateVersion.mockResolvedValue(deprecated)

    const result = await ctx.service.deprecateVersion(
      'wf-001',
      'ver-001',
      'No longer needed for this product line',
      'user-1',
    )
    expect(result.status).toBe('deprecated')
    expect(ctx.repo.deprecateVersion).toHaveBeenCalledWith(
      'ver-001',
      'user-1',
      'No longer needed for this product line',
    )
    expect(ctx.auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'WorkflowVersion',
        action: 'state_change',
      }),
    )
  })

  it('deprecateVersion transitions draft → deprecated', async () => {
    ctx.prisma.workflow.findFirst.mockResolvedValue(makeWorkflow())
    const draft = makeVersionWithValidTree({ status: 'draft' })
    const deprecated = makeVersionWithValidTree({ status: 'deprecated' })
    ctx.repo.findVersionById
      .mockResolvedValueOnce(draft)
      .mockResolvedValueOnce(deprecated)
    ctx.repo.deprecateVersion.mockResolvedValue(deprecated)

    const result = await ctx.service.deprecateVersion(
      'wf-001',
      'ver-001',
      'Cancelled before approval',
      'user-1',
    )
    expect(result.status).toBe('deprecated')
  })

  it('deprecateVersion throws ConflictException when already deprecated', async () => {
    ctx.prisma.workflow.findFirst.mockResolvedValue(makeWorkflow())
    ctx.repo.findVersionById.mockResolvedValue(
      makeVersionWithValidTree({ status: 'deprecated' }),
    )

    await expect(
      ctx.service.deprecateVersion('wf-001', 'ver-001', 'reason text', 'user-1'),
    ).rejects.toThrow(ConflictException)
  })

  // ── cloneWorkflow ──────────────────────────────────────────────────────────

  it('cloneWorkflow returns a new draft workflow seeded from source', async () => {
    const source = makeWorkflow({ id: 'wf-source' })
    source.currentVersion = makeVersionWithValidTree()
    ctx.repo.findDetailById.mockResolvedValue(source)

    const cloned = makeWorkflow({ id: 'wf-clone', code: 'WF-NEW' })
    cloned.currentVersion = makeVersionWithValidTree({ id: 'ver-clone', status: 'draft' })
    ctx.repo.cloneWorkflow.mockResolvedValue(cloned)

    const result = await ctx.service.cloneWorkflow(
      'wf-source',
      { code: 'WF-NEW', name: 'Cloned Workflow' },
      'user-1',
    )
    expect(result.id).toBe('wf-clone')
    expect(result.currentVersion?.status).toBe('draft')
    expect(ctx.auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'Workflow', action: 'create' }),
    )
  })

  it('cloneWorkflow throws NotFoundException when source missing', async () => {
    ctx.repo.findDetailById.mockResolvedValue(null)

    await expect(
      ctx.service.cloneWorkflow('wf-MISSING', { code: 'NEW', name: 'New' }, 'user-1'),
    ).rejects.toThrow(NotFoundException)
  })

  it('cloneWorkflow throws BadRequestException when source has no tree', async () => {
    const source = makeWorkflow({ id: 'wf-source' })
    source.currentVersion = makeVersionDetail({ phases: [] })
    ctx.repo.findDetailById.mockResolvedValue(source)

    await expect(
      ctx.service.cloneWorkflow('wf-source', { code: 'NEW', name: 'New' }, 'user-1'),
    ).rejects.toThrow(BadRequestException)
  })

  it('cloneWorkflow falls back to source plantId when none provided', async () => {
    const source = makeWorkflow({ id: 'wf-source', plantId: 'plant-source' })
    source.currentVersion = makeVersionWithValidTree()
    ctx.repo.findDetailById.mockResolvedValue(source)

    const cloned = makeWorkflow({ id: 'wf-clone', plantId: 'plant-source' })
    cloned.currentVersion = makeVersionWithValidTree({ id: 'ver-clone' })
    ctx.repo.cloneWorkflow.mockResolvedValue(cloned)

    await ctx.service.cloneWorkflow(
      'wf-source',
      { code: 'WF-NEW', name: 'New' },
      'user-1',
    )
    const callArg = ctx.repo.cloneWorkflow.mock.calls[0]![1] as { plantId: string }
    expect(callArg.plantId).toBe('plant-source')
  })

  it('cloneWorkflow uses provided plantId when given', async () => {
    const source = makeWorkflow({ id: 'wf-source', plantId: 'plant-source' })
    source.currentVersion = makeVersionWithValidTree()
    ctx.repo.findDetailById.mockResolvedValue(source)

    const cloned = makeWorkflow({ id: 'wf-clone', plantId: 'plant-target' })
    cloned.currentVersion = makeVersionWithValidTree({ id: 'ver-clone' })
    ctx.repo.cloneWorkflow.mockResolvedValue(cloned)

    await ctx.service.cloneWorkflow(
      'wf-source',
      { code: 'WF-NEW', name: 'New', plantId: 'plant-target' },
      'user-1',
    )
    const callArg = ctx.repo.cloneWorkflow.mock.calls[0]![1] as { plantId: string }
    expect(callArg.plantId).toBe('plant-target')
  })

  it('cloneWorkflow audit log includes sourceWorkflowId in metadata', async () => {
    const source = makeWorkflow({ id: 'wf-source' })
    source.currentVersion = makeVersionWithValidTree()
    ctx.repo.findDetailById.mockResolvedValue(source)

    const cloned = makeWorkflow({ id: 'wf-clone' })
    cloned.currentVersion = makeVersionWithValidTree({ id: 'ver-clone' })
    ctx.repo.cloneWorkflow.mockResolvedValue(cloned)

    await ctx.service.cloneWorkflow(
      'wf-source',
      { code: 'WF-NEW', name: 'New' },
      'user-1',
    )
    expect(ctx.auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'create',
        entityType: 'Workflow',
        after: expect.objectContaining({ sourceWorkflowId: 'wf-source' }),
      }),
    )
  })

  it('approveVersion audit log captures status before/after', async () => {
    ctx.prisma.workflow.findFirst.mockResolvedValue(makeWorkflow())
    const draft = makeVersionWithValidTree({ status: 'draft' })
    const approved = makeVersionWithValidTree({
      status: 'approved',
      approvedBy: 'user-1',
      approvedAt: new Date(),
    })
    ctx.repo.findVersionById
      .mockResolvedValueOnce(draft)
      .mockResolvedValueOnce(approved)
    ctx.repo.approveVersion.mockResolvedValue(approved)

    await ctx.service.approveVersion('wf-001', 'ver-001', 'user-1')
    const auditCall = ctx.auditLog.record.mock.calls[0]![0] as {
      before: unknown
      after: unknown
    }
    expect(auditCall.before).toEqual({ status: 'draft' })
    expect(auditCall.after).toEqual(
      expect.objectContaining({ status: 'approved', approvedBy: 'user-1' }),
    )
  })

  it('deprecateVersion audit log captures reason', async () => {
    ctx.prisma.workflow.findFirst.mockResolvedValue(makeWorkflow())
    const approved = makeVersionWithValidTree({ status: 'approved' })
    const deprecated = makeVersionWithValidTree({ status: 'deprecated' })
    ctx.repo.findVersionById
      .mockResolvedValueOnce(approved)
      .mockResolvedValueOnce(deprecated)
    ctx.repo.deprecateVersion.mockResolvedValue(deprecated)

    await ctx.service.deprecateVersion(
      'wf-001',
      'ver-001',
      'Quality team request — process change ECN-2026-014',
      'user-1',
    )
    const auditCall = ctx.auditLog.record.mock.calls[0]![0] as {
      after: { reason?: string }
    }
    expect(auditCall.after.reason).toBe(
      'Quality team request — process change ECN-2026-014',
    )
  })

  it('approveVersion does not call repo.approveVersion when validation fails', async () => {
    ctx.prisma.workflow.findFirst.mockResolvedValue(makeWorkflow())
    ctx.repo.findVersionById.mockResolvedValue(
      makeVersionDetail({ status: 'draft', phases: [] }),
    )

    try {
      await ctx.service.approveVersion('wf-001', 'ver-001', 'user-1')
    } catch {
      // expected
    }
    expect(ctx.repo.approveVersion).not.toHaveBeenCalled()
    expect(ctx.auditLog.record).not.toHaveBeenCalled()
  })

  it('approveVersion does not call repo.approveVersion when conflict', async () => {
    ctx.prisma.workflow.findFirst.mockResolvedValue(makeWorkflow())
    ctx.repo.findVersionById.mockResolvedValue(
      makeVersionWithValidTree({ status: 'approved' }),
    )

    try {
      await ctx.service.approveVersion('wf-001', 'ver-001', 'user-1')
    } catch {
      // expected
    }
    expect(ctx.repo.approveVersion).not.toHaveBeenCalled()
    expect(ctx.auditLog.record).not.toHaveBeenCalled()
  })

  it('deprecateVersion preserves source workflow lookup error semantics', async () => {
    ctx.prisma.workflow.findFirst.mockResolvedValue(null)

    await expect(
      ctx.service.deprecateVersion('wf-MISSING', 'ver-1', 'reason text long enough', 'user-1'),
    ).rejects.toThrow(NotFoundException)
  })

  it('approveVersion fetches version a second time after update for fresh state', async () => {
    ctx.prisma.workflow.findFirst.mockResolvedValue(makeWorkflow())
    const draft = makeVersionWithValidTree({ status: 'draft' })
    const approved = makeVersionWithValidTree({
      status: 'approved',
      approvedBy: 'user-1',
      approvedAt: new Date(),
    })
    ctx.repo.findVersionById
      .mockResolvedValueOnce(draft)
      .mockResolvedValueOnce(approved)
    ctx.repo.approveVersion.mockResolvedValue(approved)

    await ctx.service.approveVersion('wf-001', 'ver-001', 'user-1')
    // Once for the gate check, once after the update to return fresh state
    expect(ctx.repo.findVersionById).toHaveBeenCalledTimes(2)
  })
})

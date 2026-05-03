import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import {
  ToolsService,
  deriveWearStatus,
  isToolExceeded,
} from './tools.service'

type FakeTool = {
  id: string
  code: string
  name: string
  equipmentNodeId: string | null
  currentCyclesCount: number
  maxCycles: number | null
  wearStatus: string
  lastUsedAt: Date | null
  replacedAt: Date | null
  replacementCount: number
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  version: number
  createdBy: string
  updatedBy: string
}

const baseTool = (over: Partial<FakeTool> = {}): FakeTool => ({
  id: 'tool-1',
  code: 'TOOL-CRIMP-8MM',
  name: 'Crimp die',
  equipmentNodeId: 'eq-1',
  currentCyclesCount: 0,
  maxCycles: 1000,
  wearStatus: 'new',
  lastUsedAt: null,
  replacedAt: null,
  replacementCount: 0,
  createdAt: new Date('2026-04-01T10:00:00Z'),
  updatedAt: new Date('2026-04-01T10:00:00Z'),
  deletedAt: null,
  version: 1,
  createdBy: 'system',
  updatedBy: 'system',
  ...over,
})

function makeService(initialRow: FakeTool | null) {
  let row = initialRow
  const findFirstMock = vi.fn().mockImplementation(async () => row)
  const updateMock = vi.fn().mockImplementation(async (args: { data: Record<string, unknown> }) => {
    if (!row) return null
    const incVersion = (args.data['version'] as { increment?: number } | undefined)?.increment ?? 0
    const incReplacement = (args.data['replacementCount'] as { increment?: number } | undefined)?.increment ?? 0
    const updated: FakeTool = {
      ...row,
      ...(args.data as unknown as Partial<FakeTool>),
      version: row.version + (incVersion || 1),
      replacementCount: row.replacementCount + incReplacement,
    }
    row = updated
    return updated
  })
  const wearHistoryCreateMock = vi.fn().mockResolvedValue(undefined)
  const txCallback = vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn({
      toolWearHistory: { create: wearHistoryCreateMock },
      tool: { update: updateMock },
    }),
  )

  const prisma = {
    tool: { findFirst: findFirstMock, update: updateMock },
    $transaction: txCallback,
  } as unknown as ConstructorParameters<typeof ToolsService>[0]

  const recordMock = vi.fn().mockResolvedValue(undefined)
  const auditLog = {
    record: recordMock,
  } as unknown as ConstructorParameters<typeof ToolsService>[1]

  const emitMock = vi.fn()
  const gateway = {
    emit: emitMock,
  } as unknown as ConstructorParameters<typeof ToolsService>[2]

  const repo = {
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  } as unknown as ConstructorParameters<typeof ToolsService>[3]

  const service = new ToolsService(prisma, auditLog, gateway, repo)
  return { service, findFirstMock, updateMock, wearHistoryCreateMock, txCallback, recordMock, emitMock }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('deriveWearStatus + isToolExceeded helpers', () => {
  it('returns good for null/zero maxCycles (unlimited)', () => {
    expect(deriveWearStatus(500, null)).toBe('good')
    expect(deriveWearStatus(500, 0)).toBe('good')
  })
  it('returns good below 70%', () => {
    expect(deriveWearStatus(699, 1000)).toBe('good')
  })
  it('returns worn between 70% and 89%', () => {
    expect(deriveWearStatus(700, 1000)).toBe('worn')
    expect(deriveWearStatus(899, 1000)).toBe('worn')
  })
  it('returns at_limit at 90% and above (including >100%)', () => {
    expect(deriveWearStatus(900, 1000)).toBe('at_limit')
    expect(deriveWearStatus(1000, 1000)).toBe('at_limit')
    expect(deriveWearStatus(1500, 1000)).toBe('at_limit')
  })
  it('isToolExceeded only true at 100% or above', () => {
    expect(isToolExceeded({ currentCyclesCount: 999, maxCycles: 1000 })).toBe(false)
    expect(isToolExceeded({ currentCyclesCount: 1000, maxCycles: 1000 })).toBe(true)
    expect(isToolExceeded({ currentCyclesCount: 100, maxCycles: null })).toBe(false)
  })
})

describe('ToolsService.recordCycle', () => {
  it('increments currentCyclesCount, refreshes wearStatus, stamps lastUsedAt', async () => {
    const { service, updateMock, recordMock, emitMock } = makeService(
      baseTool({ currentCyclesCount: 698, maxCycles: 1000, wearStatus: 'good' }),
    )
    const after = await service.recordCycle('tool-1', 'op-1', 'plant-1')
    expect(updateMock).toHaveBeenCalledOnce()
    const data = updateMock.mock.calls[0]?.[0]?.data
    expect(data?.currentCyclesCount).toBe(699)
    expect(data?.wearStatus).toBe('good') // 699/1000 = 69.9% → still good
    expect(data?.lastUsedAt).toBeInstanceOf(Date)
    expect(after.currentCyclesCount).toBe(699)
    expect(recordMock).toHaveBeenCalledOnce()
    expect(recordMock.mock.calls[0]?.[0]?.after?.kind).toBe('cycle_increment')
    expect(emitMock).toHaveBeenCalledOnce()
  })

  it('promotes wearStatus to worn at 70% threshold', async () => {
    const { service, updateMock } = makeService(
      baseTool({ currentCyclesCount: 699, maxCycles: 1000, wearStatus: 'good' }),
    )
    await service.recordCycle('tool-1', 'op-1', 'plant-1')
    expect(updateMock.mock.calls[0]?.[0]?.data?.wearStatus).toBe('worn')
  })

  it('promotes to at_limit at 90% threshold', async () => {
    const { service, updateMock } = makeService(
      baseTool({ currentCyclesCount: 899, maxCycles: 1000, wearStatus: 'worn' }),
    )
    await service.recordCycle('tool-1', 'op-1', 'plant-1')
    expect(updateMock.mock.calls[0]?.[0]?.data?.wearStatus).toBe('at_limit')
  })

  it('throws NotFound when tool is missing', async () => {
    const { service } = makeService(null)
    await expect(service.recordCycle('missing', 'op-1', 'plant-1')).rejects.toBeInstanceOf(NotFoundException)
  })
})

describe('ToolsService.replace', () => {
  it('resets counter, sets wearStatus=replaced, bumps replacementCount, writes history + audit', async () => {
    const { service, wearHistoryCreateMock, updateMock, recordMock, txCallback } = makeService(
      baseTool({ currentCyclesCount: 950, wearStatus: 'at_limit', replacementCount: 2 }),
    )
    await service.replace('tool-1', { reason: 'mola consumata' }, 'op-1', 'plant-1')
    expect(txCallback).toHaveBeenCalledOnce()
    expect(wearHistoryCreateMock).toHaveBeenCalledOnce()
    expect(wearHistoryCreateMock.mock.calls[0]?.[0]?.data?.previousCyclesCount).toBe(950)
    expect(wearHistoryCreateMock.mock.calls[0]?.[0]?.data?.reason).toBe('mola consumata')
    const updateData = updateMock.mock.calls[0]?.[0]?.data
    expect(updateData?.currentCyclesCount).toBe(0)
    expect(updateData?.wearStatus).toBe('replaced')
    expect(updateData?.replacementCount).toEqual({ increment: 1 })
    expect(recordMock).toHaveBeenCalledOnce()
    expect(recordMock.mock.calls[0]?.[0]?.after?.kind).toBe('replace')
  })

  it('stashes photoBase64 in audit log payload (Q2 — no schema migration)', async () => {
    const { service, recordMock } = makeService(baseTool())
    const photo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA' // truncated
    await service.replace(
      'tool-1',
      { reason: 'die crack', photoBase64: photo, replacementToolId: 'tool-spare-1' },
      'op-1',
      'plant-1',
    )
    const audit = recordMock.mock.calls[0]?.[0]
    expect(audit?.after?.photoBase64).toBe(photo)
    expect(audit?.after?.replacementToolId).toBe('tool-spare-1')
  })

  it('throws Unprocessable on missing/empty reason', async () => {
    const { service } = makeService(baseTool())
    await expect(
      service.replace('tool-1', { reason: '   ' }, 'op-1', 'plant-1'),
    ).rejects.toBeInstanceOf(UnprocessableEntityException)
  })

  it('throws NotFound when tool is missing', async () => {
    const { service } = makeService(null)
    await expect(
      service.replace('missing', { reason: 'gone' }, 'op-1', 'plant-1'),
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})

import { describe, it, expect, vi } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { SampleIdResolver } from './sample-id.resolver'

const makePrisma = (opts: {
  woCode?: string | null
  latestSampleNumber?: number | null
}) => {
  const woFindFirst = vi.fn().mockResolvedValue(
    opts.woCode === null || opts.woCode === undefined
      ? null
      : { code: opts.woCode },
  )
  const sampleFindFirst = vi.fn().mockResolvedValue(
    opts.latestSampleNumber === null || opts.latestSampleNumber === undefined
      ? null
      : { sampleNumber: opts.latestSampleNumber },
  )
  const prisma = {
    workOrder: { findFirst: woFindFirst },
    sample: { findFirst: sampleFindFirst },
  } as unknown as ConstructorParameters<typeof SampleIdResolver>[0]
  return { prisma, woFindFirst, sampleFindFirst }
}

describe('SampleIdResolver', () => {
  it('has ruleId "6"', () => {
    const { prisma } = makePrisma({})
    expect(new SampleIdResolver(prisma).ruleId).toBe('6')
  })

  it('returns SAMPLE-{WO}-001 when no prior samples exist', async () => {
    const { prisma } = makePrisma({
      woCode: 'WO-20260501-001',
      latestSampleNumber: null,
    })
    const resolver = new SampleIdResolver(prisma)
    const code = await resolver.resolve({ workOrderId: 'wo-1' })
    expect(code).toBe('SAMPLE-WO-20260501-001-001')
  })

  it('increments to 002 when 1 prior sample exists for the WO', async () => {
    const { prisma } = makePrisma({
      woCode: 'WO-20260501-001',
      latestSampleNumber: 1,
    })
    const resolver = new SampleIdResolver(prisma)
    const code = await resolver.resolve({ workOrderId: 'wo-1' })
    expect(code).toBe('SAMPLE-WO-20260501-001-002')
  })

  it('respects gaps in sampleNumber (next = max + 1)', async () => {
    const { prisma } = makePrisma({
      woCode: 'WO-X',
      latestSampleNumber: 9,
    })
    const resolver = new SampleIdResolver(prisma)
    const code = await resolver.resolve({ workOrderId: 'wo-1' })
    expect(code).toBe('SAMPLE-WO-X-010')
  })

  it('throws NotFoundException when WorkOrder not found', async () => {
    const { prisma } = makePrisma({ woCode: null })
    const resolver = new SampleIdResolver(prisma)
    await expect(
      resolver.resolve({ workOrderId: 'missing' }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('accepts optional stepId in context (forwarded for traceability)', async () => {
    const { prisma } = makePrisma({
      woCode: 'WO-20260501-001',
      latestSampleNumber: null,
    })
    const resolver = new SampleIdResolver(prisma)
    const code = await resolver.resolve({
      workOrderId: 'wo-1',
      stepId: 'step-xyz',
    })
    // stepId does not appear in the code (no column to store it today)
    expect(code).toBe('SAMPLE-WO-20260501-001-001')
  })

  it('queries Sample ordered by sampleNumber desc, scoped to WO', async () => {
    const { prisma, sampleFindFirst } = makePrisma({
      woCode: 'WO-X',
      latestSampleNumber: 0,
    })
    const resolver = new SampleIdResolver(prisma)
    await resolver.resolve({ workOrderId: 'wo-1' })
    expect(sampleFindFirst).toHaveBeenCalledWith({
      where: { workOrderId: 'wo-1' },
      orderBy: { sampleNumber: 'desc' },
      select: { sampleNumber: true },
    })
  })
})

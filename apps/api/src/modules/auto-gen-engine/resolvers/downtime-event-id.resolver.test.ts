import { describe, it, expect, vi } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { DowntimeEventIdResolver } from './downtime-event-id.resolver'

const makePrisma = (opts: {
  equipmentCode?: string | null
  downtimeCount?: number
}) => {
  const equipmentFindFirst = vi.fn().mockResolvedValue(
    opts.equipmentCode === null || opts.equipmentCode === undefined
      ? null
      : { code: opts.equipmentCode },
  )
  const downtimeCount = vi.fn().mockResolvedValue(opts.downtimeCount ?? 0)
  const prisma = {
    equipmentNode: { findFirst: equipmentFindFirst },
    downtimeEvent: { count: downtimeCount },
  } as unknown as ConstructorParameters<typeof DowntimeEventIdResolver>[0]
  return { prisma, equipmentFindFirst, downtimeCount }
}

describe('DowntimeEventIdResolver', () => {
  it('has ruleId "7"', () => {
    const { prisma } = makePrisma({})
    expect(new DowntimeEventIdResolver(prisma).ruleId).toBe('7')
  })

  it('returns DOWN-{EQ}-YYYYMMDD-001 when no prior downtime exists today', async () => {
    const { prisma } = makePrisma({
      equipmentCode: 'EXTRUDER-01',
      downtimeCount: 0,
    })
    const resolver = new DowntimeEventIdResolver(prisma)
    const code = await resolver.resolve({
      plantId: 'p1',
      equipmentNodeId: 'eq-1',
      occurredAt: new Date(2026, 4, 1, 10, 0, 0),
    })
    expect(code).toBe('DOWN-EXTRUDER-01-20260501-001')
  })

  it('increments to 002 when 1 prior downtime exists for equipment same day', async () => {
    const { prisma } = makePrisma({
      equipmentCode: 'EXTRUDER-01',
      downtimeCount: 1,
    })
    const resolver = new DowntimeEventIdResolver(prisma)
    const code = await resolver.resolve({
      plantId: 'p1',
      equipmentNodeId: 'eq-1',
      occurredAt: new Date(2026, 4, 1, 10, 0, 0),
    })
    expect(code).toBe('DOWN-EXTRUDER-01-20260501-002')
  })

  it('throws NotFoundException when equipment not found', async () => {
    const { prisma } = makePrisma({ equipmentCode: null })
    const resolver = new DowntimeEventIdResolver(prisma)
    await expect(
      resolver.resolve({
        plantId: 'p1',
        equipmentNodeId: 'missing',
        occurredAt: new Date(2026, 4, 1),
      }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('queries DowntimeEvent with startedAt range bounded to the day', async () => {
    const { prisma, downtimeCount } = makePrisma({
      equipmentCode: 'X',
      downtimeCount: 0,
    })
    const resolver = new DowntimeEventIdResolver(prisma)
    await resolver.resolve({
      plantId: 'p1',
      equipmentNodeId: 'eq-1',
      occurredAt: new Date(2026, 4, 1, 14, 30, 0),
    })
    const call = downtimeCount.mock.calls[0]?.[0] as {
      where: {
        equipmentNodeId: string
        startedAt: { gte: Date; lt: Date }
      }
    }
    expect(call.where.equipmentNodeId).toBe('eq-1')
    expect(call.where.startedAt.gte).toEqual(new Date(2026, 4, 1, 0, 0, 0))
    expect(call.where.startedAt.lt).toEqual(new Date(2026, 4, 2, 0, 0, 0))
  })

  it('formats day with leading zeros', async () => {
    const { prisma } = makePrisma({ equipmentCode: 'A', downtimeCount: 0 })
    const resolver = new DowntimeEventIdResolver(prisma)
    const code = await resolver.resolve({
      plantId: 'p1',
      equipmentNodeId: 'eq-1',
      occurredAt: new Date(2026, 0, 5, 9, 0, 0), // 2026-01-05
    })
    expect(code).toBe('DOWN-A-20260105-001')
  })

  it('zero-pads sequence to 3 digits', async () => {
    const { prisma } = makePrisma({ equipmentCode: 'A', downtimeCount: 99 })
    const resolver = new DowntimeEventIdResolver(prisma)
    const code = await resolver.resolve({
      plantId: 'p1',
      equipmentNodeId: 'eq-1',
      occurredAt: new Date(2026, 4, 1),
    })
    expect(code).toBe('DOWN-A-20260501-100')
  })
})

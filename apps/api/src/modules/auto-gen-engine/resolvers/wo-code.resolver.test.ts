import { describe, it, expect, vi } from 'vitest'
import { WoCodeResolver } from './wo-code.resolver'

const makePrisma = (woCount: number) => {
  const count = vi.fn().mockResolvedValue(woCount)
  const prisma = {
    workOrder: { count },
  } as unknown as ConstructorParameters<typeof WoCodeResolver>[0]
  return { prisma, count }
}

describe('WoCodeResolver', () => {
  it('has ruleId "2"', () => {
    const { prisma } = makePrisma(0)
    expect(new WoCodeResolver(prisma).ruleId).toBe('2')
  })

  it('returns WO-YYYYMMDD-001 when no prior WO exists', async () => {
    const { prisma } = makePrisma(0)
    const resolver = new WoCodeResolver(prisma)
    const code = await resolver.resolve({
      plantId: 'p1',
      releasedAt: new Date(2026, 4, 1, 12, 0, 0), // 2026-05-01 local
    })
    expect(code).toBe('WO-20260501-001')
  })

  it('increments to 002 when 1 prior WO exists same day same plant', async () => {
    const { prisma } = makePrisma(1)
    const resolver = new WoCodeResolver(prisma)
    const code = await resolver.resolve({
      plantId: 'p1',
      releasedAt: new Date(2026, 4, 1, 12, 0, 0),
    })
    expect(code).toBe('WO-20260501-002')
  })

  it('zero-pads sequence to 3 digits', async () => {
    const { prisma } = makePrisma(99)
    const resolver = new WoCodeResolver(prisma)
    const code = await resolver.resolve({
      plantId: 'p1',
      releasedAt: new Date(2026, 4, 1, 12, 0, 0),
    })
    expect(code).toBe('WO-20260501-100')
  })

  it('formats day with leading zeros for single-digit month/day', async () => {
    const { prisma } = makePrisma(0)
    const resolver = new WoCodeResolver(prisma)
    const code = await resolver.resolve({
      plantId: 'p1',
      releasedAt: new Date(2026, 0, 5, 12, 0, 0), // 2026-01-05
    })
    expect(code).toBe('WO-20260105-001')
  })

  it('queries WorkOrder with the exact day-prefix scoped per plant', async () => {
    const { prisma, count } = makePrisma(0)
    const resolver = new WoCodeResolver(prisma)
    await resolver.resolve({
      plantId: 'plant-XYZ',
      releasedAt: new Date(2026, 11, 31, 23, 59, 0),
    })
    expect(count).toHaveBeenCalledWith({
      where: {
        plantId: 'plant-XYZ',
        code: { startsWith: 'WO-20261231-' },
      },
    })
  })
})

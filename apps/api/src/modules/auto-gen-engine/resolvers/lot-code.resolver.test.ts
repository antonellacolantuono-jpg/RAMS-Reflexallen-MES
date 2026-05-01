import { describe, it, expect, vi } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { LotCodeResolver } from './lot-code.resolver'

const makePrisma = (opts: {
  itemCode?: string | null
  lotCount?: number
}) => {
  const itemFindFirst = vi.fn().mockResolvedValue(
    opts.itemCode === null || opts.itemCode === undefined
      ? null
      : { code: opts.itemCode },
  )
  const lotCount = vi.fn().mockResolvedValue(opts.lotCount ?? 0)
  const prisma = {
    item: { findFirst: itemFindFirst },
    lot: { count: lotCount },
  } as unknown as ConstructorParameters<typeof LotCodeResolver>[0]
  return { prisma, itemFindFirst, lotCount }
}

describe('LotCodeResolver', () => {
  it('has ruleId "1"', () => {
    const { prisma } = makePrisma({})
    const resolver = new LotCodeResolver(prisma)
    expect(resolver.ruleId).toBe('1')
  })

  it('returns LOT-{ITEM}-{YEAR}-0001 when no prior lots exist', async () => {
    const { prisma } = makePrisma({ itemCode: 'PNE12X2', lotCount: 0 })
    const resolver = new LotCodeResolver(prisma)
    const code = await resolver.resolve({
      plantId: 'p1',
      itemId: 'item-1',
      year: 2026,
    })
    expect(code).toBe('LOT-PNE12X2-2026-0001')
  })

  it('increments to 0002 when 1 prior lot exists with same prefix', async () => {
    const { prisma } = makePrisma({ itemCode: 'PNE12X2', lotCount: 1 })
    const resolver = new LotCodeResolver(prisma)
    const code = await resolver.resolve({
      plantId: 'p1',
      itemId: 'item-1',
      year: 2026,
    })
    expect(code).toBe('LOT-PNE12X2-2026-0002')
  })

  it('zero-pads sequence to 4 digits', async () => {
    const { prisma } = makePrisma({ itemCode: 'X', lotCount: 9999 })
    const resolver = new LotCodeResolver(prisma)
    const code = await resolver.resolve({
      plantId: 'p1',
      itemId: 'item-1',
      year: 2026,
    })
    expect(code).toBe('LOT-X-2026-10000')
  })

  it('throws NotFoundException when item not found', async () => {
    const { prisma } = makePrisma({ itemCode: null })
    const resolver = new LotCodeResolver(prisma)
    await expect(
      resolver.resolve({ plantId: 'p1', itemId: 'missing', year: 2026 }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('queries Lot with the exact prefix scoped per plant', async () => {
    const { prisma, lotCount } = makePrisma({ itemCode: 'ABC', lotCount: 0 })
    const resolver = new LotCodeResolver(prisma)
    await resolver.resolve({ plantId: 'p1', itemId: 'item-1', year: 2026 })
    expect(lotCount).toHaveBeenCalledWith({
      where: {
        plantId: 'p1',
        lotNumber: { startsWith: 'LOT-ABC-2026-' },
      },
    })
  })

  it('isolates sequence per year (year boundary)', async () => {
    const { prisma } = makePrisma({ itemCode: 'X', lotCount: 0 })
    const resolver = new LotCodeResolver(prisma)
    const c2025 = await resolver.resolve({
      plantId: 'p1',
      itemId: 'item-1',
      year: 2025,
    })
    const c2026 = await resolver.resolve({
      plantId: 'p1',
      itemId: 'item-1',
      year: 2026,
    })
    expect(c2025).toBe('LOT-X-2025-0001')
    expect(c2026).toBe('LOT-X-2026-0001')
  })
})

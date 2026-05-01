import { describe, it, expect, vi } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { BoxCodeResolver } from './box-code.resolver'

const makePrisma = (opts: {
  boxTypeCode?: string | null
  boxCount?: number
}) => {
  const boxTypeFindFirst = vi.fn().mockResolvedValue(
    opts.boxTypeCode === null || opts.boxTypeCode === undefined
      ? null
      : { code: opts.boxTypeCode },
  )
  const boxCount = vi.fn().mockResolvedValue(opts.boxCount ?? 0)
  const prisma = {
    boxType: { findFirst: boxTypeFindFirst },
    box: { count: boxCount },
  } as unknown as ConstructorParameters<typeof BoxCodeResolver>[0]
  return { prisma, boxTypeFindFirst, boxCount }
}

describe('BoxCodeResolver', () => {
  it('has ruleId "3"', () => {
    const { prisma } = makePrisma({})
    expect(new BoxCodeResolver(prisma).ruleId).toBe('3')
  })

  it('returns BOX-{TYPE}-0001 when no prior boxes exist', async () => {
    const { prisma } = makePrisma({ boxTypeCode: 'PALLET-EU', boxCount: 0 })
    const resolver = new BoxCodeResolver(prisma)
    const code = await resolver.resolve({ plantId: 'p1', boxTypeId: 'bt-1' })
    expect(code).toBe('BOX-PALLET-EU-0001')
  })

  it('increments to 0002 when 1 prior box exists for the type', async () => {
    const { prisma } = makePrisma({ boxTypeCode: 'PALLET-EU', boxCount: 1 })
    const resolver = new BoxCodeResolver(prisma)
    const code = await resolver.resolve({ plantId: 'p1', boxTypeId: 'bt-1' })
    expect(code).toBe('BOX-PALLET-EU-0002')
  })

  it('throws NotFoundException when BoxType not found', async () => {
    const { prisma } = makePrisma({ boxTypeCode: null })
    const resolver = new BoxCodeResolver(prisma)
    await expect(
      resolver.resolve({ plantId: 'p1', boxTypeId: 'missing' }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('queries Box with the exact prefix scoped per plant', async () => {
    const { prisma, boxCount } = makePrisma({ boxTypeCode: 'X', boxCount: 0 })
    const resolver = new BoxCodeResolver(prisma)
    await resolver.resolve({ plantId: 'p1', boxTypeId: 'bt-1' })
    expect(boxCount).toHaveBeenCalledWith({
      where: { plantId: 'p1', code: { startsWith: 'BOX-X-' } },
    })
  })

  it('zero-pads sequence to 4 digits', async () => {
    const { prisma } = makePrisma({ boxTypeCode: 'A', boxCount: 99 })
    const resolver = new BoxCodeResolver(prisma)
    const code = await resolver.resolve({ plantId: 'p1', boxTypeId: 'bt-1' })
    expect(code).toBe('BOX-A-0100')
  })
})

import { describe, it, expect, vi } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { MaintenanceCodeResolver } from './maintenance-code.resolver'

const makePrisma = (opts: {
  equipmentCode?: string | null
  maintCount?: number
}) => {
  const equipmentFindFirst = vi.fn().mockResolvedValue(
    opts.equipmentCode === null || opts.equipmentCode === undefined
      ? null
      : { code: opts.equipmentCode },
  )
  const maintCount = vi.fn().mockResolvedValue(opts.maintCount ?? 0)
  const prisma = {
    equipmentNode: { findFirst: equipmentFindFirst },
    maintenanceOrder: { count: maintCount },
  } as unknown as ConstructorParameters<typeof MaintenanceCodeResolver>[0]
  return { prisma, equipmentFindFirst, maintCount }
}

describe('MaintenanceCodeResolver', () => {
  it('has ruleId "4"', () => {
    const { prisma } = makePrisma({})
    expect(new MaintenanceCodeResolver(prisma).ruleId).toBe('4')
  })

  it('returns MAINT-{EQ}-0001 when no prior maintenance orders exist', async () => {
    const { prisma } = makePrisma({
      equipmentCode: 'EXTRUDER-01',
      maintCount: 0,
    })
    const resolver = new MaintenanceCodeResolver(prisma)
    const code = await resolver.resolve({
      plantId: 'p1',
      equipmentNodeId: 'eq-1',
    })
    expect(code).toBe('MAINT-EXTRUDER-01-0001')
  })

  it('increments to 0002 when 1 prior maintenance exists for equipment', async () => {
    const { prisma } = makePrisma({
      equipmentCode: 'EXTRUDER-01',
      maintCount: 1,
    })
    const resolver = new MaintenanceCodeResolver(prisma)
    const code = await resolver.resolve({
      plantId: 'p1',
      equipmentNodeId: 'eq-1',
    })
    expect(code).toBe('MAINT-EXTRUDER-01-0002')
  })

  it('throws NotFoundException when equipment not found', async () => {
    const { prisma } = makePrisma({ equipmentCode: null })
    const resolver = new MaintenanceCodeResolver(prisma)
    await expect(
      resolver.resolve({ plantId: 'p1', equipmentNodeId: 'missing' }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('queries MaintenanceOrder scoped per plant + equipment', async () => {
    const { prisma, maintCount } = makePrisma({
      equipmentCode: 'X',
      maintCount: 0,
    })
    const resolver = new MaintenanceCodeResolver(prisma)
    await resolver.resolve({ plantId: 'p1', equipmentNodeId: 'eq-1' })
    expect(maintCount).toHaveBeenCalledWith({
      where: {
        plantId: 'p1',
        equipmentNodeId: 'eq-1',
        code: { startsWith: 'MAINT-X-' },
      },
    })
  })

  it('zero-pads sequence to 4 digits', async () => {
    const { prisma } = makePrisma({ equipmentCode: 'A', maintCount: 9 })
    const resolver = new MaintenanceCodeResolver(prisma)
    const code = await resolver.resolve({
      plantId: 'p1',
      equipmentNodeId: 'eq-1',
    })
    expect(code).toBe('MAINT-A-0010')
  })
})

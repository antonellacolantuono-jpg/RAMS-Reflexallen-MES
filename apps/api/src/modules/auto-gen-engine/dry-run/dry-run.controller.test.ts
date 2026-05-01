import { describe, it, expect, vi } from 'vitest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { DryRunController } from './dry-run.controller'

const makeController = (
  resolveImpl: (
    ruleId: string,
    ctx: unknown,
  ) => Promise<string> | string = (rid) => `mock-code-${rid}`,
) => {
  const resolve = vi.fn().mockImplementation(async (rid, ctx) => resolveImpl(rid, ctx))
  const engine = { resolve } as unknown as ConstructorParameters<typeof DryRunController>[0]
  return { controller: new DryRunController(engine), resolve }
}

describe('DryRunController', () => {
  it('resolves rule "2" (WO) with valid context and echoes context back', async () => {
    const { controller, resolve } = makeController(() => 'WO-20260501-001')
    const result = await controller.dryRun('2', {
      plantId: 'p1',
      releasedAt: '2026-05-01T10:00:00Z',
    })
    expect(result.ruleId).toBe('2')
    expect(result.code).toBe('WO-20260501-001')
    expect(result.contextEcho.plantId).toBe('p1')
    expect(result.contextEcho.releasedAt).toBeInstanceOf(Date)
    expect(resolve).toHaveBeenCalledOnce()
  })

  it('resolves rule "1" (LOT) with valid context', async () => {
    const { controller } = makeController(() => 'LOT-X-2026-0001')
    const result = await controller.dryRun('1', {
      plantId: 'p1',
      itemId: 'item-1',
      year: 2026,
    })
    expect(result.code).toBe('LOT-X-2026-0001')
  })

  it('resolves rule "5" (RECIPE_VERSION) with minimal context', async () => {
    const { controller } = makeController(() => 'v1.0.0')
    const result = await controller.dryRun('5', { recipeId: 'r1' })
    expect(result.code).toBe('v1.0.0')
  })

  it('throws NotFoundException for unknown rule id', async () => {
    const { controller } = makeController()
    await expect(controller.dryRun('999', {})).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it('throws BadRequestException when context is missing required fields', async () => {
    const { controller } = makeController()
    await expect(
      controller.dryRun('1', { plantId: 'p1' /* missing itemId, year */ }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('throws BadRequestException when releasedAt is not a parseable date', async () => {
    const { controller } = makeController()
    await expect(
      controller.dryRun('2', { plantId: 'p1', releasedAt: 'not-a-date' }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('does not invoke the engine when validation fails', async () => {
    const { controller, resolve } = makeController()
    await expect(
      controller.dryRun('1', { plantId: 'p1' }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(resolve).not.toHaveBeenCalled()
  })

  it('propagates engine exceptions (e.g. NotFound from resolver)', async () => {
    const { controller } = makeController(() => {
      throw new NotFoundException('Item not found')
    })
    await expect(
      controller.dryRun('1', { plantId: 'p1', itemId: 'x', year: 2026 }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})

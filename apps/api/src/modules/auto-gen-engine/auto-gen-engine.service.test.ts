import { describe, it, expect, vi } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { AutoGenEngineService } from './auto-gen-engine.service'
import type { IAutoGenResolver } from './interfaces/auto-gen-resolver.interface'

const makeResolver = (
  ruleId: string,
  fn: (ctx: unknown) => Promise<string> | string = () =>
    Promise.resolve(`resolved-${ruleId}`),
): IAutoGenResolver => ({
  ruleId,
  resolve: vi.fn().mockImplementation(async (ctx) => fn(ctx)),
})

describe('AutoGenEngineService', () => {
  it('dispatches to the correct resolver when multiple are registered', async () => {
    const r1 = makeResolver('1', () => 'LOT-X-2026-001')
    const r2 = makeResolver('2', () => 'WO-20260501-001')
    const r3 = makeResolver('3', () => 'BOX-A-001')
    const engine = new AutoGenEngineService([r1, r2, r3])

    expect(await engine.resolve('1', {})).toBe('LOT-X-2026-001')
    expect(await engine.resolve('2', {})).toBe('WO-20260501-001')
    expect(await engine.resolve('3', {})).toBe('BOX-A-001')

    expect(r1.resolve).toHaveBeenCalledOnce()
    expect(r2.resolve).toHaveBeenCalledOnce()
    expect(r3.resolve).toHaveBeenCalledOnce()
  })

  it('throws NotFoundException for unknown ruleId', async () => {
    const engine = new AutoGenEngineService([makeResolver('1')])
    await expect(engine.resolve('999', {})).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it('throws on duplicate resolver registration', () => {
    expect(() =>
      new AutoGenEngineService([makeResolver('1'), makeResolver('1')]),
    ).toThrow(/duplicate resolver/i)
  })

  it('passes context through to the resolver unchanged', async () => {
    const ctx = { plantId: 'p1', releasedAt: new Date('2026-05-01T10:00:00Z') }
    const resolver = makeResolver('2', (received) => {
      expect(received).toBe(ctx)
      return 'WO-20260501-001'
    })
    const engine = new AutoGenEngineService([resolver])
    await engine.resolve('2', ctx)
    expect(resolver.resolve).toHaveBeenCalledWith(ctx)
  })

  it('propagates exceptions thrown by the resolver', async () => {
    const resolver = makeResolver('4', () => {
      throw new Error('resolver boom')
    })
    const engine = new AutoGenEngineService([resolver])
    await expect(engine.resolve('4', {})).rejects.toThrow('resolver boom')
  })

  it('hasResolver and getRegisteredRuleIds reflect the registry', () => {
    const engine = new AutoGenEngineService([
      makeResolver('3'),
      makeResolver('1'),
      makeResolver('5'),
    ])
    expect(engine.hasResolver('1')).toBe(true)
    expect(engine.hasResolver('3')).toBe(true)
    expect(engine.hasResolver('5')).toBe(true)
    expect(engine.hasResolver('2')).toBe(false)
    expect(engine.getRegisteredRuleIds()).toEqual(['1', '3', '5'])
  })

  it('initialises with an empty registry when no resolvers are provided', async () => {
    const engine = new AutoGenEngineService([])
    expect(engine.getRegisteredRuleIds()).toEqual([])
    await expect(engine.resolve('1', {})).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })
})

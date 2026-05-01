import { describe, it, expect, vi } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { RecipeVersionResolver } from './recipe-version.resolver'

const makePrisma = (opts: {
  recipeFound?: boolean
  latestVersion?: number | null
}) => {
  const recipeFindFirst = vi.fn().mockResolvedValue(
    opts.recipeFound === false ? null : { id: 'r1' },
  )
  const recipeVersionFindFirst = vi.fn().mockResolvedValue(
    opts.latestVersion === null || opts.latestVersion === undefined
      ? null
      : { version: opts.latestVersion },
  )
  const prisma = {
    recipe: { findFirst: recipeFindFirst },
    recipeVersion: { findFirst: recipeVersionFindFirst },
  } as unknown as ConstructorParameters<typeof RecipeVersionResolver>[0]
  return { prisma, recipeFindFirst, recipeVersionFindFirst }
}

describe('RecipeVersionResolver', () => {
  it('has ruleId "5"', () => {
    const { prisma } = makePrisma({})
    expect(new RecipeVersionResolver(prisma).ruleId).toBe('5')
  })

  it('returns v1.0.0 when no prior version exists', async () => {
    const { prisma } = makePrisma({ recipeFound: true, latestVersion: null })
    const resolver = new RecipeVersionResolver(prisma)
    const code = await resolver.resolve({ recipeId: 'r1' })
    expect(code).toBe('v1.0.0')
  })

  it('increments to v2.0.0 when latest version is 1', async () => {
    const { prisma } = makePrisma({ recipeFound: true, latestVersion: 1 })
    const resolver = new RecipeVersionResolver(prisma)
    const code = await resolver.resolve({ recipeId: 'r1' })
    expect(code).toBe('v2.0.0')
  })

  it('respects gaps (next = max + 1, not count + 1)', async () => {
    const { prisma } = makePrisma({ recipeFound: true, latestVersion: 7 })
    const resolver = new RecipeVersionResolver(prisma)
    const code = await resolver.resolve({ recipeId: 'r1' })
    expect(code).toBe('v8.0.0')
  })

  it('throws NotFoundException when recipe not found', async () => {
    const { prisma } = makePrisma({ recipeFound: false })
    const resolver = new RecipeVersionResolver(prisma)
    await expect(resolver.resolve({ recipeId: 'missing' })).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it('queries RecipeVersion ordered by version desc, scoped to recipe', async () => {
    const { prisma, recipeVersionFindFirst } = makePrisma({
      recipeFound: true,
      latestVersion: 0,
    })
    const resolver = new RecipeVersionResolver(prisma)
    await resolver.resolve({ recipeId: 'r1' })
    expect(recipeVersionFindFirst).toHaveBeenCalledWith({
      where: { recipeId: 'r1' },
      orderBy: { version: 'desc' },
      select: { version: true },
    })
  })
})

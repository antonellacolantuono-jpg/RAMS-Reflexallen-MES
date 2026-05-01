import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type { IAutoGenResolver } from '../interfaces/auto-gen-resolver.interface'
import { RULE_IDS } from '../types'

export interface RecipeVersionContext {
  recipeId: string
}

/**
 * Generates the next recipe version code in semver-ish form `vN.0.0` where
 * N is `max(RecipeVersion.version) + 1` for the recipe (or 1 when none).
 *
 * Reads the existing `RecipeVersion.version Int` field rather than counting
 * rows so the resolver respects whatever the highest-existing version is
 * (gaps are tolerated).
 */
@Injectable()
export class RecipeVersionResolver
  implements IAutoGenResolver<RecipeVersionContext>
{
  readonly ruleId = RULE_IDS.RECIPE_VERSION

  constructor(private readonly prisma: PrismaService) {}

  async resolve(ctx: RecipeVersionContext): Promise<string> {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id: ctx.recipeId, deletedAt: null },
      select: { id: true },
    })
    if (!recipe) {
      throw new NotFoundException(`Recipe ${ctx.recipeId} not found`)
    }
    const latest = await this.prisma.recipeVersion.findFirst({
      where: { recipeId: ctx.recipeId },
      orderBy: { version: 'desc' },
      select: { version: true },
    })
    const next = (latest?.version ?? 0) + 1
    return `v${next}.0.0`
  }
}

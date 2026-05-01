import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type { IAutoGenResolver } from '../interfaces/auto-gen-resolver.interface'
import { RULE_IDS } from '../types'

export interface LotCodeContext {
  plantId: string
  itemId: string
  year: number
}

/**
 * Generates lot numbers in the form `LOT-{ITEM_CODE}-{YEAR}-{SEQ}` where
 * SEQ is the count of existing lots for the same plant whose lotNumber
 * starts with the same prefix, plus one (zero-padded to 4 digits).
 *
 * Example: LOT-PNE12X2-2026-0001
 */
@Injectable()
export class LotCodeResolver implements IAutoGenResolver<LotCodeContext> {
  readonly ruleId = RULE_IDS.LOT_NUMBER

  constructor(private readonly prisma: PrismaService) {}

  async resolve(ctx: LotCodeContext): Promise<string> {
    const item = await this.prisma.item.findFirst({
      where: { id: ctx.itemId, plantId: ctx.plantId, deletedAt: null },
      select: { code: true },
    })
    if (!item) {
      throw new NotFoundException(`Item ${ctx.itemId} not found in plant`)
    }
    const prefix = `LOT-${item.code}-${ctx.year}-`
    const existing = await this.prisma.lot.count({
      where: { plantId: ctx.plantId, lotNumber: { startsWith: prefix } },
    })
    const seq = (existing + 1).toString().padStart(4, '0')
    return `${prefix}${seq}`
  }
}

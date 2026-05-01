import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type { IAutoGenResolver } from '../interfaces/auto-gen-resolver.interface'
import { RULE_IDS } from '../types'

export interface BoxCodeContext {
  plantId: string
  boxTypeId: string
}

/**
 * Generates box codes in the form `BOX-{TYPE_CODE}-{SEQ}` where SEQ is
 * the count of existing boxes for the same plant whose code starts with
 * the same prefix, plus one (zero-padded to 4 digits).
 *
 * Example: BOX-PALLET-EU-0001
 */
@Injectable()
export class BoxCodeResolver implements IAutoGenResolver<BoxCodeContext> {
  readonly ruleId = RULE_IDS.BOX_CODE

  constructor(private readonly prisma: PrismaService) {}

  async resolve(ctx: BoxCodeContext): Promise<string> {
    const boxType = await this.prisma.boxType.findFirst({
      where: { id: ctx.boxTypeId, plantId: ctx.plantId, deletedAt: null },
      select: { code: true },
    })
    if (!boxType) {
      throw new NotFoundException(
        `BoxType ${ctx.boxTypeId} not found in plant`,
      )
    }
    const prefix = `BOX-${boxType.code}-`
    const existing = await this.prisma.box.count({
      where: { plantId: ctx.plantId, code: { startsWith: prefix } },
    })
    const seq = (existing + 1).toString().padStart(4, '0')
    return `${prefix}${seq}`
  }
}

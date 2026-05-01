import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type { IAutoGenResolver } from '../interfaces/auto-gen-resolver.interface'
import { RULE_IDS } from '../types'

export interface WoCodeContext {
  plantId: string
  releasedAt: Date
}

/**
 * Generates WO codes in the form `WO-YYYYMMDD-NNN`, scoped per-plant
 * per-day. Sequence is computed from the existing count of WOs whose
 * code starts with the same `WO-YYYYMMDD-` prefix in the same plant
 * (including soft-deleted rows so the sequence never collides).
 *
 * Extracted byte-identically from release.service.generateWoCode (D6).
 */
@Injectable()
export class WoCodeResolver implements IAutoGenResolver<WoCodeContext> {
  readonly ruleId = RULE_IDS.WORK_ORDER_NUMBER

  constructor(private readonly prisma: PrismaService) {}

  async resolve(ctx: WoCodeContext): Promise<string> {
    const day = formatYYYYMMDD(ctx.releasedAt)
    const prefix = `WO-${day}-`
    const existing = await this.prisma.workOrder.count({
      where: { plantId: ctx.plantId, code: { startsWith: prefix } },
    })
    const seq = (existing + 1).toString().padStart(3, '0')
    return `${prefix}${seq}`
  }
}

function formatYYYYMMDD(d: Date): string {
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${y}${m}${day}`
}

import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type { IAutoGenResolver } from '../interfaces/auto-gen-resolver.interface'
import { RULE_IDS } from '../types'

export interface DowntimeEventContext {
  plantId: string
  equipmentNodeId: string
  occurredAt: Date
}

/**
 * Generates downtime event identifiers in the form
 * `DOWN-{EQUIPMENT_CODE}-{YYYYMMDD}-{SEQ}` where SEQ is the count of
 * existing downtime events for the equipment that started on the same
 * day, plus one (zero-padded to 3 digits).
 *
 * Note: the DowntimeEvent table has no `code` column today, so the
 * generated string is purely a human-friendly identifier (used for
 * dry-run preview, audit log references, and external systems). The
 * sequence is computed by counting `startedAt` rows on that day rather
 * than by string-matching an existing `code`.
 */
@Injectable()
export class DowntimeEventIdResolver
  implements IAutoGenResolver<DowntimeEventContext>
{
  readonly ruleId = RULE_IDS.DOWNTIME_EVENT

  constructor(private readonly prisma: PrismaService) {}

  async resolve(ctx: DowntimeEventContext): Promise<string> {
    const equipment = await this.prisma.equipmentNode.findFirst({
      where: {
        id: ctx.equipmentNodeId,
        plantId: ctx.plantId,
        deletedAt: null,
      },
      select: { code: true },
    })
    if (!equipment) {
      throw new NotFoundException(
        `EquipmentNode ${ctx.equipmentNodeId} not found in plant`,
      )
    }
    const day = formatYYYYMMDD(ctx.occurredAt)
    const startOfDayDate = startOfDay(ctx.occurredAt)
    const startOfNextDay = new Date(startOfDayDate)
    startOfNextDay.setDate(startOfNextDay.getDate() + 1)
    const existing = await this.prisma.downtimeEvent.count({
      where: {
        equipmentNodeId: ctx.equipmentNodeId,
        startedAt: { gte: startOfDayDate, lt: startOfNextDay },
      },
    })
    const seq = (existing + 1).toString().padStart(3, '0')
    return `DOWN-${equipment.code}-${day}-${seq}`
  }
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function formatYYYYMMDD(d: Date): string {
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${y}${m}${day}`
}

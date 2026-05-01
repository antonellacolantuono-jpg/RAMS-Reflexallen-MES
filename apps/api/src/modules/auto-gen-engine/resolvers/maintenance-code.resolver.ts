import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type { IAutoGenResolver } from '../interfaces/auto-gen-resolver.interface'
import { RULE_IDS } from '../types'

export interface MaintenanceCodeContext {
  plantId: string
  equipmentNodeId: string
}

/**
 * Generates maintenance order codes in the form `MAINT-{EQUIPMENT_CODE}-{SEQ}`
 * where SEQ is the count of existing maintenance orders for the same
 * equipment, plus one (zero-padded to 4 digits).
 *
 * Example: MAINT-EXTRUDER-01-0001
 */
@Injectable()
export class MaintenanceCodeResolver
  implements IAutoGenResolver<MaintenanceCodeContext>
{
  readonly ruleId = RULE_IDS.MAINTENANCE_ORDER

  constructor(private readonly prisma: PrismaService) {}

  async resolve(ctx: MaintenanceCodeContext): Promise<string> {
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
    const prefix = `MAINT-${equipment.code}-`
    const existing = await this.prisma.maintenanceOrder.count({
      where: {
        plantId: ctx.plantId,
        equipmentNodeId: ctx.equipmentNodeId,
        code: { startsWith: prefix },
      },
    })
    const seq = (existing + 1).toString().padStart(4, '0')
    return `${prefix}${seq}`
  }
}

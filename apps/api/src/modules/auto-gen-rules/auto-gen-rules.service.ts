import { Injectable, NotFoundException } from '@nestjs/common'

export type AutoGenRule = {
  id: string
  name: string
  trigger: string
  scope: string
  description: string
}

const AUTO_GEN_RULES: AutoGenRule[] = [
  {
    id: '1',
    name: 'Lot Number Generation',
    trigger: 'lot_created',
    scope: 'lot',
    description: 'Generates sequential lot numbers per item per year (format: LOT-{ITEM}-{YEAR}-{SEQ})',
  },
  {
    id: '2',
    name: 'Work Order Number',
    trigger: 'work_order_created',
    scope: 'work_order',
    description: 'Generates WO codes (format: WO-{YYYYMMDD}-{NNN}, per-plant per-day sequence)',
  },
  {
    id: '3',
    name: 'Box Code',
    trigger: 'box_created',
    scope: 'box',
    description: 'Generates box codes (format: BOX-{TYPE}-{SEQ})',
  },
  {
    id: '4',
    name: 'Maintenance Order Number',
    trigger: 'maintenance_created',
    scope: 'maintenance',
    description: 'Sequential maintenance order codes per equipment',
  },
  {
    id: '5',
    name: 'Recipe Version Code',
    trigger: 'recipe_version_created',
    scope: 'recipe',
    description: 'Semantic version numbers for recipe versions (v1.0.0)',
  },
  {
    id: '6',
    name: 'Sample ID',
    trigger: 'sample_created',
    scope: 'sample',
    description: 'Sample IDs tied to production record and step',
  },
  {
    id: '7',
    name: 'Downtime Event ID',
    trigger: 'downtime_created',
    scope: 'downtime',
    description: 'Sequential downtime event identifiers per equipment per day',
  },
]

@Injectable()
export class AutoGenRulesService {
  findAll(): AutoGenRule[] {
    return AUTO_GEN_RULES
  }

  findById(id: string): AutoGenRule {
    const rule = AUTO_GEN_RULES.find((r) => r.id === id)
    if (!rule) throw new NotFoundException(`AutoGenRule ${id} not found`)
    return rule
  }
}

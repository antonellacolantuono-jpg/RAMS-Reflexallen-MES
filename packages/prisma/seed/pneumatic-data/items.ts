// PROMPT_PNE_2 D1 — Items + BoxType for the Pneumatic Air demo product.
//
// Product: PNE-TUBE-12-680 (12mm × 680mm, shorter demo variant of the 2000mm
// production spec ITM-FG-RFA-PNE-001 — chosen for faster demo cycles).
// Customer reference: Iveco / Volvo (truck braking system).

import { upsertByPlantCode, type PneumaticSeedContext, type Prisma } from '../helpers/upsert'

export const PNE_ITEMS = [
  // Finished good — the demo product
  {
    code: 'PNE-TUBE-12-680',
    name: 'Tubo pneumatico PA12 12mm × 680mm (Iveco/Volvo)',
    itemType: 'finished_good',
    trackingMode: 'lot',
    uom: 'pc',
    description: 'Tubo PA12 + EVOH co-estruso, raccordi crimpati end A + end B, certificato ISO 7628 / DIN 73378.',
  },
  // Components
  {
    code: 'RACC-PNE-12-A',
    name: 'Raccordo end A — push-in maschio M12',
    itemType: 'component',
    trackingMode: 'lot',
    uom: 'pc',
    description: 'Raccordo push-in lato A 12mm, acciaio zincato, fornitore Stauff.',
  },
  {
    code: 'RACC-PNE-12-B',
    name: 'Raccordo end B — push-in femmina M12 quick-release',
    itemType: 'component',
    trackingMode: 'lot',
    uom: 'pc',
    description: 'Raccordo push-in lato B 12mm con sgancio rapido, acciaio zincato, fornitore Stauff.',
  },
  // Consumables
  {
    code: 'LBL-PNE-001',
    name: 'Etichetta tubo pneumatico — adesiva 50×20',
    itemType: 'consumable',
    trackingMode: 'none',
    uom: 'pc',
    description: 'Etichetta adesiva con marcatura serial number + data, applicata in fase Leak Test.',
  },
  {
    code: 'TAPE-IDENT-001',
    name: 'Nastro identificazione cliente — Iveco/Volvo',
    itemType: 'consumable',
    trackingMode: 'none',
    uom: 'pc',
    description: 'Nastro adesivo blu con logo cliente, applicato in fase Leak Test (parallelo).',
  },
] as const

export const PNE_BOX_TYPES = [
  {
    code: 'BTYPE-PLT-RFA-001',
    name: 'Pallet returnable Reflexallen 80×120',
    maxWeightG: 800_000,
    maxUnitsCount: 50,
    isReturnable: true,
    description: 'Pallet returnable EPAL custom Reflexallen, capacità 50 tubi, peso max 800kg.',
  },
] as const

export async function seedItems(prisma: Prisma, ctx: PneumaticSeedContext): Promise<void> {
  for (const item of PNE_ITEMS) {
    const created = await upsertByPlantCode(prisma.item, ctx.plantId, item.code, {
      name: item.name,
      itemType: item.itemType,
      trackingMode: item.trackingMode,
      uom: item.uom,
      description: item.description,
    })
    ctx.items[item.code] = created
  }

  for (const bt of PNE_BOX_TYPES) {
    const created = await upsertByPlantCode(prisma.boxType, ctx.plantId, bt.code, {
      name: bt.name,
      maxWeightG: bt.maxWeightG,
      maxUnitsCount: bt.maxUnitsCount,
      isReturnable: bt.isReturnable,
      description: bt.description,
    })
    ctx.boxTypes[bt.code] = created
  }

  console.log(`✓ Items: ${PNE_ITEMS.length} + BoxTypes: ${PNE_BOX_TYPES.length}`)
}

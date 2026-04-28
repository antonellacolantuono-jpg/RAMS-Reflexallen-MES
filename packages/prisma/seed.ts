import { prisma } from './src/client'

const SYSTEM = 'seed'

async function main(): Promise<void> {
  console.log('🌱 Seeding MOCK_DATA_PNEUMATIC_AIR...')

  // ── 1. Plant ─────────────────────────────────────────────────────────────
  const plant = await prisma.plant.upsert({
    where: { code: 'PLT-RFA-MO-001' },
    update: {},
    create: {
      code: 'PLT-RFA-MO-001',
      name: 'Stabilimento Reflexallen Modena',
      timezone: 'Europe/Rome',
      locale: 'it-IT',
      address: 'Via Emilia Est 128, 41100 Modena MO, Italy',
    },
  })
  console.log('✓ Plant:', plant.code)

  // ── 2. Skills ────────────────────────────────────────────────────────────
  const skillDefs = [
    { code: 'EXT', name: 'Estrusione', category: 'production', description: 'Operazione linee estrusione PA12/EVOH' },
    { code: 'ASSY', name: 'Assemblaggio', category: 'production', description: 'Assemblaggio crimp e raccordi' },
    { code: 'QC', name: 'Controllo Qualità', category: 'quality', description: 'Ispezione visiva e dimensionale' },
    { code: 'TEST', name: 'Testing', category: 'quality', description: 'Collaudo tenuta (leak test) e prove pressione' },
    { code: 'PACK', name: 'Imballaggio', category: 'logistics', description: 'Confezionamento e etichettatura colli' },
    { code: 'FORKLIFT', name: 'Mulettista', category: 'logistics', description: 'Abilitazione conduzione carrello elevatore' },
    { code: 'WAREHOUSE', name: 'Magazzino', category: 'logistics', description: 'Gestione magazzino materie prime e prodotti finiti' },
  ]

  const skills: Record<string, { id: string }> = {}
  for (const s of skillDefs) {
    const skill = await prisma.skill.upsert({
      where: { plantId_code: { plantId: plant.id, code: s.code } },
      update: {},
      create: { ...s, plantId: plant.id, createdBy: SYSTEM, updatedBy: SYSTEM },
    })
    skills[s.code] = skill
  }
  console.log('✓ Skills:', Object.keys(skills).join(', '))

  // ── 3. Operators ──────────────────────────────────────────────────────────
  const operatorDefs = [
    {
      badge: 'OP-001', firstName: 'Marco', lastName: 'Rossi',
      skillCodes: ['EXT', 'ASSY', 'QC'],
    },
    {
      badge: 'OP-002', firstName: 'Laura', lastName: 'Ferrari',
      skillCodes: ['QC', 'TEST', 'PACK'],
    },
    {
      badge: 'OP-003', firstName: 'Giovanni', lastName: 'Bianchi',
      skillCodes: ['FORKLIFT', 'WAREHOUSE', 'PACK'],
    },
    {
      badge: 'OP-004', firstName: 'Sara', lastName: 'Conti',
      skillCodes: ['EXT', 'TEST'],
    },
  ]

  const operators: Record<string, { id: string }> = {}
  for (const op of operatorDefs) {
    const operator = await prisma.operator.upsert({
      where: { badge: op.badge },
      update: {},
      create: {
        badge: op.badge,
        firstName: op.firstName,
        lastName: op.lastName,
        status: 'active',
        plantId: plant.id,
        createdBy: SYSTEM,
        updatedBy: SYSTEM,
      },
    })
    operators[op.badge] = operator

    for (const code of op.skillCodes) {
      const skill = skills[code]
      if (!skill) continue
      await prisma.operatorSkill.upsert({
        where: { operatorId_skillId: { operatorId: operator.id, skillId: skill.id } },
        update: {},
        create: {
          operatorId: operator.id,
          skillId: skill.id,
          certifiedAt: new Date('2024-01-15'),
          expiresAt: new Date('2026-01-15'),
          level: 'certified',
          certifiedBy: SYSTEM,
        },
      })
    }
  }
  console.log('✓ Operators:', Object.keys(operators).join(', '))

  // ── 4. Items ──────────────────────────────────────────────────────────────
  const itemDefs = [
    // Finished goods
    { code: 'FG-PNEU-5M-8MM', name: 'Tubo pneumatico PA12 5m ⌀8mm', itemType: 'finished_good', trackingMode: 'serial', uom: 'pc' },
    { code: 'FG-PNEU-10M-8MM', name: 'Tubo pneumatico PA12 10m ⌀8mm', itemType: 'finished_good', trackingMode: 'serial', uom: 'pc' },
    { code: 'FG-PNEU-5M-10MM', name: 'Tubo pneumatico PA12 5m ⌀10mm', itemType: 'finished_good', trackingMode: 'serial', uom: 'pc' },
    // Raw materials
    { code: 'RM-PA12-NATURAL', name: 'Granulo PA12 naturale', itemType: 'raw_material', trackingMode: 'lot', uom: 'kg' },
    { code: 'RM-EVOH-44', name: 'Granulo EVOH 44 mol%', itemType: 'raw_material', trackingMode: 'lot', uom: 'kg' },
    { code: 'RM-PA12-BLACK', name: 'Granulo PA12 nero UV-stab', itemType: 'raw_material', trackingMode: 'lot', uom: 'kg' },
    // Components
    { code: 'COMP-CRIMP-8MM', name: 'Raccordo crimp ⌀8mm acciaio zincato', itemType: 'component', trackingMode: 'lot', uom: 'pc' },
    { code: 'COMP-CRIMP-10MM', name: 'Raccordo crimp ⌀10mm acciaio zincato', itemType: 'component', trackingMode: 'lot', uom: 'pc' },
    { code: 'COMP-SLEEVE-8MM', name: 'Ghiera crimp ⌀8mm', itemType: 'component', trackingMode: 'lot', uom: 'pc' },
    // Consumables
    { code: 'CONS-LABEL-A4', name: 'Etichetta adesiva A4 (500pz)', itemType: 'consumable', trackingMode: 'none', uom: 'box' },
    { code: 'CONS-BARRIER-BAG', name: 'Sacchetto barriera antistatica', itemType: 'consumable', trackingMode: 'none', uom: 'pc' },
  ]

  const items: Record<string, { id: string }> = {}
  for (const item of itemDefs) {
    const created = await prisma.item.upsert({
      where: { plantId_code: { plantId: plant.id, code: item.code } },
      update: {},
      create: {
        ...item,
        plantId: plant.id,
        createdBy: SYSTEM,
        updatedBy: SYSTEM,
      },
    })
    items[item.code] = created
  }
  console.log('✓ Items:', Object.keys(items).length, 'records')

  // ── 5. BOM ────────────────────────────────────────────────────────────────
  const bomItem = items['FG-PNEU-5M-8MM']
  if (bomItem) {
    const existingBom = await (prisma as any).bOM.findFirst({
      where: { itemId: bomItem.id, version: 1 },
    })

    if (!existingBom) {
      const bom = await (prisma as any).bOM.create({
        data: {
          itemId: bomItem.id,
          version: 1,
          status: 'approved',
          effectiveFrom: new Date('2024-01-01'),
          notes: 'BOM base tubo pneumatico 5m 8mm',
          createdBy: SYSTEM,
          updatedBy: SYSTEM,
        },
      })

      const bomComponents = [
        { code: 'RM-PA12-NATURAL', qty: 0.08, uom: 'kg' },
        { code: 'RM-EVOH-44', qty: 0.02, uom: 'kg' },
        { code: 'RM-PA12-BLACK', qty: 0.005, uom: 'kg' },
        { code: 'COMP-CRIMP-8MM', qty: 2, uom: 'pc' },
        { code: 'COMP-SLEEVE-8MM', qty: 2, uom: 'pc' },
      ]

      for (let i = 0; i < bomComponents.length; i++) {
        const comp = bomComponents[i]
        if (!comp) continue
        const compItem = items[comp.code]
        if (!compItem) continue
        await (prisma as any).bOMLine.create({
          data: {
            bomId: bom.id,
            componentId: compItem.id,
            qty: comp.qty,
            uom: comp.uom,
            position: i + 1,
          },
        })
      }
      console.log('✓ BOM created for', bomItem.code)
    } else {
      console.log('✓ BOM already exists for', bomItem.code)
    }
  }

  // ── 6. Equipment Hierarchy ────────────────────────────────────────────────
  const eqDefs = [
    { code: 'AREA-PNEU', name: 'Area Pneumatica', level: 'area', parentCode: null },
    { code: 'WC-EXT-01', name: 'Linea Estrusione 01', level: 'work_center', parentCode: 'AREA-PNEU' },
    { code: 'WC-CRIMP-01', name: 'Postazione Crimp 01', level: 'work_center', parentCode: 'AREA-PNEU' },
    { code: 'WC-LEAK-01', name: 'Banco Leak Test 01', level: 'work_center', parentCode: 'AREA-PNEU' },
    { code: 'EQ-EXT-01A', name: 'Estrusore principale EXT-01A', level: 'work_unit', parentCode: 'WC-EXT-01' },
    { code: 'EQ-EXT-01B', name: 'Coestrusore EVOH EXT-01B', level: 'work_unit', parentCode: 'WC-EXT-01' },
    { code: 'EQ-CRIMP-01A', name: 'Pressa crimp CRIMP-01A', level: 'work_unit', parentCode: 'WC-CRIMP-01' },
    { code: 'EQ-LEAK-01A', name: 'Tester tenuta LEAK-01A', level: 'work_unit', parentCode: 'WC-LEAK-01' },
  ]

  const eqNodes: Record<string, { id: string }> = {}
  for (const eq of eqDefs) {
    const parentId = eq.parentCode ? eqNodes[eq.parentCode]?.id : undefined
    const node = await prisma.equipmentNode.upsert({
      where: { plantId_code: { plantId: plant.id, code: eq.code } },
      update: {},
      create: {
        code: eq.code,
        name: eq.name,
        level: eq.level,
        status: 'available',
        parentId: parentId ?? null,
        plantId: plant.id,
        createdBy: SYSTEM,
        updatedBy: SYSTEM,
      },
    })
    eqNodes[eq.code] = node
  }
  console.log('✓ Equipment nodes:', Object.keys(eqNodes).join(', '))

  // ── 7. Tools ──────────────────────────────────────────────────────────────
  const toolDefs = [
    { code: 'TOOL-HEAD-8MM', name: 'Testa estrusione ⌀8mm', equipmentNodeCode: 'EQ-EXT-01A', maxCycles: 5000 },
    { code: 'TOOL-CALIB-8MM', name: 'Calibratore ⌀8mm', equipmentNodeCode: 'EQ-EXT-01A', maxCycles: 10000 },
    { code: 'TOOL-CRIMP-8MM', name: 'Crimp die ⌀8mm acciaio', equipmentNodeCode: 'EQ-CRIMP-01A', maxCycles: 20000 },
  ]

  for (const t of toolDefs) {
    const equipmentNodeId = eqNodes[t.equipmentNodeCode]?.id
    const existing = await (prisma as any).tool.findFirst({ where: { code: t.code } })
    if (!existing) {
      await (prisma as any).tool.create({
        data: {
          code: t.code,
          name: t.name,
          equipmentNodeId: equipmentNodeId ?? null,
          maxCycles: t.maxCycles,
          wearStatus: 'new',
          createdBy: SYSTEM,
          updatedBy: SYSTEM,
        },
      })
    }
  }
  console.log('✓ Tools:', toolDefs.map((t) => t.code).join(', '))

  // ── 8. Recipes ────────────────────────────────────────────────────────────
  const recipeDefs = [
    {
      code: 'RCP-EXT-8MM-PA12', name: 'Estrusione PA12 ⌀8mm',
      itemCode: 'FG-PNEU-5M-8MM', equipmentNodeCode: 'EQ-EXT-01A',
      params: [
        { key: 'temp_zone_1', value: '240', unit: '°C' },
        { key: 'temp_zone_2', value: '245', unit: '°C' },
        { key: 'temp_zone_3', value: '250', unit: '°C' },
        { key: 'head_pressure', value: '180', unit: 'bar' },
        { key: 'line_speed', value: '12.5', unit: 'm/min' },
      ],
    },
    {
      code: 'RCP-CRIMP-8MM', name: 'Crimp raccordi ⌀8mm',
      itemCode: 'FG-PNEU-5M-8MM', equipmentNodeCode: 'EQ-CRIMP-01A',
      params: [
        { key: 'crimp_force', value: '18500', unit: 'N' },
        { key: 'crimp_diameter', value: '10.2', unit: 'mm' },
      ],
    },
    {
      code: 'RCP-LEAK-10BAR', name: 'Leak test 10 bar',
      itemCode: 'FG-PNEU-5M-8MM', equipmentNodeCode: 'EQ-LEAK-01A',
      params: [
        { key: 'test_pressure', value: '10', unit: 'bar' },
        { key: 'hold_time_s', value: '30', unit: 's' },
        { key: 'max_leak_rate', value: '0.005', unit: 'bar/min' },
      ],
    },
  ]

  for (const r of recipeDefs) {
    const existingRecipe = await prisma.recipe.findFirst({
      where: { plantId: plant.id, code: r.code },
    })
    if (!existingRecipe) {
      const itemId = r.itemCode ? items[r.itemCode]?.id : undefined
      const recipe = await prisma.recipe.create({
        data: {
          code: r.code,
          name: r.name,
          status: 'effective',
          plantId: plant.id,
          itemId: itemId ?? null,
          createdBy: SYSTEM,
          updatedBy: SYSTEM,
        },
      })
      await prisma.recipeVersion.create({
        data: {
          recipeId: recipe.id,
          version: 1,
          status: 'effective',
          parameters: JSON.stringify(r.params),
          createdBy: SYSTEM,
        },
      })
    }
  }
  console.log('✓ Recipes:', recipeDefs.map((r) => r.code).join(', '))

  // ── 9. BoxTypes ───────────────────────────────────────────────────────────
  const existingBoxType = await prisma.boxType.findFirst({
    where: { plantId: plant.id, code: 'BT-PALLET-EUR' },
  })
  if (!existingBoxType) {
    await prisma.boxType.create({
      data: {
        code: 'BT-PALLET-EUR',
        name: 'Pallet europeo 80x120',
        maxWeightG: 1000000,
        maxUnitsCount: 100,
        isReturnable: true,
        description: 'Pallet EPAL standard 800x1200mm, max 1000kg',
        plantId: plant.id,
        createdBy: SYSTEM,
        updatedBy: SYSTEM,
      },
    })
    console.log('✓ BoxType: BT-PALLET-EUR')
  } else {
    console.log('✓ BoxType already exists')
  }

  // ── 10. AttentionPoints ───────────────────────────────────────────────────
  const apDefs = [
    { entityType: 'EquipmentNode', severity: 'warning', message: 'EXT-01A: temperatura testa fuori range tolleranza (+3°C rispetto alla ricetta) — verificare termocoppia' },
    { entityType: 'Item', severity: 'info', message: 'RM-EVOH-44: stock in esaurimento — giacenza residua stimata 4 giorni' },
    { entityType: 'Operator', severity: 'warning', message: 'OP-002 (L. Ferrari): certificazione QC in scadenza tra 22 giorni' },
    { entityType: 'Tool', severity: 'critical', message: 'TOOL-HEAD-8MM: usura critica — superato 95% dei cicli massimi' },
    { entityType: 'Item', severity: 'warning', message: 'FG-PNEU-5M-8MM: 3 pezzi in attesa di rilascio qualità (hold QC)' },
    { entityType: 'EquipmentNode', severity: 'info', message: 'EQ-CRIMP-01A: manutenzione preventiva schedulata per 2026-05-15' },
  ]

  for (const ap of apDefs) {
    const existing = await (prisma as any).attentionPoint.findFirst({
      where: { entityType: ap.entityType, message: ap.message },
    })
    if (!existing) {
      await (prisma as any).attentionPoint.create({
        data: {
          entityType: ap.entityType,
          entityId: plant.id,
          severity: ap.severity,
          message: ap.message,
          plantId: plant.id,
          createdBy: SYSTEM,
        },
      })
    }
  }
  console.log('✓ AttentionPoints:', apDefs.length, 'records')

  // ── 11. CauseCodes ────────────────────────────────────────────────────────
  const ccDefs = [
    // Scrap
    { code: 'SC-001', name: 'Difetto dimensionale', category: 'scrap', description: 'Diametro fuori tolleranza' },
    { code: 'SC-002', name: 'Bolla/vuoto', category: 'scrap', description: 'Bolla d\'aria nel materiale estruso' },
    { code: 'SC-003', name: 'Crimp difettoso', category: 'scrap', description: 'Raccordo non crimpato correttamente' },
    { code: 'SC-004', name: 'Leak test fallito', category: 'scrap', description: 'Tubo non supera collaudo tenuta' },
    // Downtime
    { code: 'DT-001', name: 'Cambio attrezzatura', category: 'downtime', description: 'Setup/cambio testa estrusione o crimp die' },
    { code: 'DT-002', name: 'Guasto meccanico', category: 'downtime', description: 'Rottura componenti meccanici' },
    { code: 'DT-003', name: 'Mancanza materiale', category: 'downtime', description: 'Attesa arrivo materia prima' },
    { code: 'DT-004', name: 'Manutenzione programmata', category: 'downtime', description: 'Fermo per manutenzione preventiva pianificata' },
  ]

  for (const cc of ccDefs) {
    const existing = await prisma.causeCode.findFirst({
      where: { plantId: plant.id, code: cc.code },
    })
    if (!existing) {
      await prisma.causeCode.create({
        data: { ...cc, plantId: plant.id, createdBy: SYSTEM, updatedBy: SYSTEM },
      })
    }
  }
  console.log('✓ CauseCodes:', ccDefs.length, 'records')

  console.log('\n✅ Seed complete — MOCK_DATA_PNEUMATIC_AIR loaded successfully')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import * as argon2 from 'argon2'
import { prisma } from './src/client'

const SYSTEM = 'seed'

async function hashPin(pin: string): Promise<string> {
  return argon2.hash(pin, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  })
}

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
    { code: 'MANAGER', name: 'Plant Manager', category: 'leadership', description: 'Rilascio ordini di lavoro, approvazione workflow (D6 PROMPT_5_FULL)' },
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
      pin: '1234',
      skillCodes: ['EXT', 'ASSY', 'QC', 'MANAGER'],
    },
    {
      badge: 'OP-002', firstName: 'Laura', lastName: 'Ferrari',
      pin: '2222',
      skillCodes: ['QC', 'TEST', 'PACK'],
    },
    {
      badge: 'OP-003', firstName: 'Giovanni', lastName: 'Bianchi',
      pin: '3333',
      skillCodes: ['FORKLIFT', 'WAREHOUSE', 'PACK'],
    },
    {
      badge: 'OP-004', firstName: 'Sara', lastName: 'Conti',
      pin: '4444',
      skillCodes: ['EXT', 'TEST'],
    },
  ]

  const operators: Record<string, { id: string }> = {}
  for (const op of operatorDefs) {
    const existing = await prisma.operator.findUnique({ where: { badge: op.badge } })
    const pinHash = existing?.pinHash ?? (await hashPin(op.pin))
    const operator = await prisma.operator.upsert({
      where: { badge: op.badge },
      update: { pinHash },
      create: {
        badge: op.badge,
        firstName: op.firstName,
        lastName: op.lastName,
        status: 'active',
        plantId: plant.id,
        pinHash,
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

  // ── 12. Shifts ────────────────────────────────────────────────────────────
  const shiftA = await prisma.shift.upsert({
    where: { plantId_code: { plantId: plant.id, code: 'A' } },
    update: {},
    create: {
      code: 'A',
      name: 'Turno A — Mattina',
      startTime: '06:00',
      endTime: '14:00',
      plantId: plant.id,
      createdBy: SYSTEM,
      updatedBy: SYSTEM,
    },
  })
  console.log('✓ Shift:', shiftA.code)

  // ── 13. ShiftAssignments (today, all 4 operators on shift A) ──────────────
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (const badge of ['OP-001', 'OP-002', 'OP-003', 'OP-004']) {
    const op = operators[badge]
    if (!op) continue
    await prisma.shiftAssignment.upsert({
      where: {
        shiftId_operatorId_date: {
          shiftId: shiftA.id,
          operatorId: op.id,
          date: today,
        },
      },
      update: {},
      create: {
        shiftId: shiftA.id,
        operatorId: op.id,
        date: today,
        createdBy: SYSTEM,
      },
    })
  }
  console.log('✓ ShiftAssignments: 4 records (today, shift A)')

  // ── 14. WorkOrders + WorkOrderAssignments ─────────────────────────────────
  const woDefs: Array<{
    code: string
    itemCode: string
    qtyTarget: number
    qtyProduced: number
    status: string
    priority: string
    actualStart: Date | null
    operatorBadge: string
    assignmentStatus: 'accepted' | 'active'
  }> = [
    { code: 'WO-2026-0101', itemCode: 'FG-PNEU-5M-8MM', qtyTarget: 50, qtyProduced: 12, status: 'in_progress', priority: 'high', actualStart: new Date('2026-04-30T06:30:00Z'), operatorBadge: 'OP-001', assignmentStatus: 'active' },
    { code: 'WO-2026-0102', itemCode: 'FG-PNEU-10M-8MM', qtyTarget: 30, qtyProduced: 0, status: 'released', priority: 'normal', actualStart: null, operatorBadge: 'OP-001', assignmentStatus: 'accepted' },
    { code: 'WO-2026-0103', itemCode: 'FG-PNEU-5M-10MM', qtyTarget: 100, qtyProduced: 25, status: 'in_progress', priority: 'normal', actualStart: new Date('2026-04-30T07:00:00Z'), operatorBadge: 'OP-002', assignmentStatus: 'active' },
    { code: 'WO-2026-0104', itemCode: 'FG-PNEU-5M-8MM', qtyTarget: 80, qtyProduced: 0, status: 'released', priority: 'low', actualStart: null, operatorBadge: 'OP-003', assignmentStatus: 'accepted' },
    { code: 'WO-2026-0105', itemCode: 'FG-PNEU-5M-10MM', qtyTarget: 25, qtyProduced: 5, status: 'in_progress', priority: 'normal', actualStart: new Date('2026-04-30T06:45:00Z'), operatorBadge: 'OP-004', assignmentStatus: 'active' },
  ]

  for (const wo of woDefs) {
    const item = items[wo.itemCode]
    const op = operators[wo.operatorBadge]
    if (!item || !op) continue

    const workOrder = await prisma.workOrder.upsert({
      where: { plantId_code: { plantId: plant.id, code: wo.code } },
      update: {},
      create: {
        code: wo.code,
        itemId: item.id,
        plantId: plant.id,
        qtyTarget: wo.qtyTarget,
        qtyProduced: wo.qtyProduced,
        status: wo.status,
        priority: wo.priority,
        actualStart: wo.actualStart,
        createdBy: SYSTEM,
        updatedBy: SYSTEM,
      },
    })

    await prisma.workOrderAssignment.upsert({
      where: { workOrderId_operatorId: { workOrderId: workOrder.id, operatorId: op.id } },
      update: {},
      create: {
        workOrderId: workOrder.id,
        operatorId: op.id,
        status: wo.assignmentStatus,
        acceptedAt: new Date(),
        createdBy: SYSTEM,
        updatedBy: SYSTEM,
      },
    })
  }
  console.log('✓ WorkOrders + WorkOrderAssignments:', woDefs.length, 'each')

  // ── 15. Demo workflow: parallel Device Execution Group (D4 of PROMPT_5_FULL) ─
  const demoWoCode = 'WO-2026-0101'
  const demoItemCode = 'FG-PNEU-5M-8MM'
  const demoItem = items[demoItemCode]
  const demoWo = await prisma.workOrder.findFirst({
    where: { plantId: plant.id, code: demoWoCode },
  })

  if (demoItem && demoWo) {
    const wfCode = 'WF-PNEU-CURE-DEMO'
    let workflow = await prisma.workflow.findFirst({
      where: { plantId: plant.id, code: wfCode },
    })
    if (!workflow) {
      workflow = await prisma.workflow.create({
        data: {
          code: wfCode,
          name: 'Demo cura autoclave (parallel ops)',
          itemId: demoItem.id,
          plantId: plant.id,
          description: 'Workflow di demo per swimlane Device Execution Group',
          createdBy: SYSTEM,
          updatedBy: SYSTEM,
        },
      })
    }

    let version = await prisma.workflowVersion.findFirst({
      where: { workflowId: workflow.id, version: 1 },
    })
    if (!version) {
      version = await prisma.workflowVersion.create({
        data: {
          workflowId: workflow.id,
          version: 1,
          // D6: must be 'approved' for the release flow to accept it
          // (canonical WorkflowVersionStatus values per schema.prisma).
          status: 'approved',
          approvedBy: SYSTEM,
          approvedAt: new Date(),
          createdBy: SYSTEM,
          updatedBy: SYSTEM,
        },
      })
    } else if (version.status !== 'approved') {
      // Backfill: any pre-D6 demo workflow seeded with the legacy 'effective'
      // status is migrated to 'approved' so the release demo works without
      // a manual db reset.
      version = await prisma.workflowVersion.update({
        where: { id: version.id },
        data: {
          status: 'approved',
          approvedBy: SYSTEM,
          approvedAt: new Date(),
          updatedBy: SYSTEM,
        },
      })
    }

    if (workflow.currentVersionId !== version.id) {
      await prisma.workflow.update({
        where: { id: workflow.id },
        data: { currentVersionId: version.id, updatedBy: SYSTEM },
      })
    }

    let phase = await prisma.phase.findFirst({
      where: { workflowVersionId: version.id, order: 1 },
    })
    if (!phase) {
      phase = await prisma.phase.create({
        data: {
          workflowVersionId: version.id,
          order: 1,
          category: 'production',
          name: 'Produzione cura',
          createdBy: SYSTEM,
          updatedBy: SYSTEM,
        },
      })
    }

    let group = await prisma.group.findFirst({
      where: { phaseId: phase.id, order: 1 },
    })
    if (!group) {
      group = await prisma.group.create({
        data: {
          phaseId: phase.id,
          order: 1,
          category: 'device_execution',
          name: 'Cura autoclave',
          supportsParallel: true,
          description: 'Gruppo Device Execution con operazioni parallele',
          createdBy: SYSTEM,
          updatedBy: SYSTEM,
        },
      })
    }

    const stepDefs: Array<{
      order: number
      name: string
      category: string
      actionType: string
      deviceCategory: string
      instructions: string
    }> = [
      {
        order: 1,
        name: 'Setup attrezzatura autoclave',
        category: 'setup',
        actionType: 'verify_workstation',
        deviceCategory: 'pre',
        instructions: 'Verifica che attrezzatura e ricetta siano pronti',
      },
      {
        order: 2,
        name: 'Avvio ciclo cura',
        category: 'production',
        actionType: 'device_run',
        deviceCategory: 'device_main',
        instructions: 'Avvia ciclo cura autoclave secondo ricetta',
      },
      {
        order: 3,
        name: 'Controllo qualità campione',
        category: 'quality_control',
        actionType: 'visual_check',
        deviceCategory: 'parallel',
        instructions: 'Esegui ispezione visiva del campione di riferimento',
      },
      {
        order: 4,
        name: 'Etichettatura batch successivo',
        category: 'logistics',
        actionType: 'apply_label',
        deviceCategory: 'parallel',
        instructions: 'Prepara etichette per il batch successivo durante la cura',
      },
      {
        order: 5,
        name: 'Pulizia postazione',
        category: 'teardown',
        actionType: 'cleanup',
        deviceCategory: 'post',
        instructions: 'Pulizia finale dopo cura completata',
      },
    ]

    const seedStartedAt = demoWo.actualStart ?? new Date('2026-04-30T06:30:00Z')

    for (const def of stepDefs) {
      let step = await prisma.step.findFirst({
        where: { groupId: group.id, order: def.order },
      })
      if (!step) {
        step = await prisma.step.create({
          data: {
            groupId: group.id,
            order: def.order,
            category: def.category,
            actionType: def.actionType,
            deviceCategory: def.deviceCategory,
            name: def.name,
            instructions: def.instructions,
            createdBy: SYSTEM,
            updatedBy: SYSTEM,
          },
        })
      } else if (step.deviceCategory !== def.deviceCategory) {
        await prisma.step.update({
          where: { id: step.id },
          data: { deviceCategory: def.deviceCategory, updatedBy: SYSTEM },
        })
      }

      const existingExec = await prisma.stepExecution.findFirst({
        where: { workOrderId: demoWo.id, stepId: step.id },
      })
      if (!existingExec) {
        await prisma.stepExecution.create({
          data: {
            workOrderId: demoWo.id,
            stepId: step.id,
            status: 'pending',
            startedAt: seedStartedAt,
          },
        })
      }
    }
    console.log(
      '✓ Demo parallel group:',
      group.name,
      `(5 steps: 1 pre + 1 main + 2 parallel + 1 post → ${demoWoCode})`,
    )
  } else {
    console.log('⚠ Skipped demo parallel group (item or WO missing)')
  }

  // ── 16. Workflow templates (Pneumatic Air, PROMPT_3b Session B) ───────────
  // Three reference workflows usable as starting points via the Templates Wizard.
  // Wizard filters by `code: { startsWith: 'TPL_' }`.
  type TemplateStepDef = {
    order: number
    name: string
    category: string
    actionType: string
    instructions?: string
  }
  type TemplateGroupDef = {
    order: number
    name: string
    category: string
    supportsParallel?: boolean
    steps: TemplateStepDef[]
  }
  type TemplatePhaseDef = {
    order: number
    name: string
    category: string
    groups: TemplateGroupDef[]
  }
  type TemplateDef = {
    code: string
    name: string
    description: string
    phases: TemplatePhaseDef[]
  }

  const templates: TemplateDef[] = [
    {
      code: 'TPL_PNEU_EXTRUSION_V1',
      name: 'Template — Estrusione tubo pneumatico',
      description:
        'Template di partenza per cicli estrusione PA12/EVOH (linee co-estrusione)',
      phases: [
        {
          order: 1,
          name: 'Setup linea',
          category: 'setup',
          groups: [
            {
              order: 1,
              name: 'Preparazione',
              category: 'manual',
              steps: [
                {
                  order: 1,
                  name: 'Verifica ricetta estrusore',
                  category: 'setup',
                  actionType: 'verify_workstation',
                  instructions:
                    'Controlla che la ricetta caricata corrisponda al codice articolo',
                },
                {
                  order: 2,
                  name: 'Carico granulato PA12',
                  category: 'setup',
                  actionType: 'manual_operation',
                  instructions:
                    'Versa la corretta quantità di PA12 nel silos primario',
                },
              ],
            },
          ],
        },
        {
          order: 2,
          name: 'Estrusione continua',
          category: 'production',
          groups: [
            {
              order: 1,
              name: 'Run estrusore',
              category: 'device_execution',
              steps: [
                {
                  order: 1,
                  name: 'Avvio estrusore',
                  category: 'production',
                  actionType: 'device_run',
                  instructions:
                    'Avvia il programma di estrusione e verifica i parametri di processo',
                },
                {
                  order: 2,
                  name: 'Prelievo campione iniziale',
                  category: 'quality_control',
                  actionType: 'sample_take',
                  instructions:
                    'Preleva un campione dopo i primi 10 metri per misure dimensionali',
                },
                {
                  order: 3,
                  name: 'Stop ciclo',
                  category: 'teardown',
                  actionType: 'cleanup',
                  instructions: 'Arresta linea e prepara estrusore al cambio',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      code: 'TPL_PNEU_CRIMPING_V1',
      name: 'Template — Crimpatura raccordi',
      description:
        'Template per assemblaggio raccordi crimpati su tubo pneumatico estruso',
      phases: [
        {
          order: 1,
          name: 'Produzione',
          category: 'production',
          groups: [
            {
              order: 1,
              name: 'Operazione crimp',
              category: 'device_execution',
              steps: [
                {
                  order: 1,
                  name: 'Carico tubo nel banco',
                  category: 'production',
                  actionType: 'manual_operation',
                  instructions: 'Posiziona il tubo nella sede di crimpatura',
                },
                {
                  order: 2,
                  name: 'Ciclo crimpatura',
                  category: 'production',
                  actionType: 'device_run',
                  instructions: 'Avvia il ciclo crimp con la pinza idraulica',
                },
              ],
            },
          ],
        },
        {
          order: 2,
          name: 'Controllo qualità',
          category: 'quality_control',
          groups: [
            {
              order: 1,
              name: 'Verifica visiva',
              category: 'quality_control',
              steps: [
                {
                  order: 1,
                  name: 'Ispezione visiva crimp',
                  category: 'quality_control',
                  actionType: 'visual_check',
                  instructions:
                    'Verifica assenza di difetti visivi sul colletto crimp',
                },
                {
                  order: 2,
                  name: 'Predisposizione leak test',
                  category: 'logistics',
                  actionType: 'apply_label',
                  instructions: 'Applica etichetta lotto e prepara per leak test',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      code: 'TPL_PNEU_LEAK_TEST_V1',
      name: 'Template — Leak test tubo crimpato',
      description:
        'Template per banco prove tenuta (collaudo finale tubo pneumatico)',
      phases: [
        {
          order: 1,
          name: 'Collaudo',
          category: 'quality_control',
          groups: [
            {
              order: 1,
              name: 'Banco leak tester',
              category: 'quality_control',
              steps: [
                {
                  order: 1,
                  name: 'Scansione lotto',
                  category: 'logistics',
                  actionType: 'scan_qr',
                  instructions: 'Leggi il QR del lotto in collaudo',
                },
                {
                  order: 2,
                  name: 'Esecuzione leak test',
                  category: 'quality_control',
                  actionType: 'device_run',
                  instructions:
                    'Avvia il leak test alla pressione prescritta (vedi ricetta)',
                },
                {
                  order: 3,
                  name: 'Registra esito',
                  category: 'quality_control',
                  actionType: 'record_value',
                  instructions: 'Memorizza il valore di tenuta misurato',
                },
                {
                  order: 4,
                  name: 'Decisione accettazione',
                  category: 'decision',
                  actionType: 'decision',
                  instructions:
                    'Accetta o rifiuta il lotto in base alla soglia di tenuta',
                },
              ],
            },
          ],
        },
      ],
    },
  ]

  for (const tpl of templates) {
    let tplWorkflow = await prisma.workflow.findFirst({
      where: { plantId: plant.id, code: tpl.code },
    })
    if (!tplWorkflow) {
      tplWorkflow = await prisma.workflow.create({
        data: {
          code: tpl.code,
          name: tpl.name,
          description: tpl.description,
          plantId: plant.id,
          createdBy: SYSTEM,
          updatedBy: SYSTEM,
        },
      })
    }

    let tplVersion = await prisma.workflowVersion.findFirst({
      where: { workflowId: tplWorkflow.id, version: 1 },
    })
    if (!tplVersion) {
      tplVersion = await prisma.workflowVersion.create({
        data: {
          workflowId: tplWorkflow.id,
          version: 1,
          status: 'approved',
          approvedBy: SYSTEM,
          approvedAt: new Date(),
          notes: 'Template di riferimento — clonabile via wizard',
          createdBy: SYSTEM,
          updatedBy: SYSTEM,
        },
      })
    }

    if (tplWorkflow.currentVersionId !== tplVersion.id) {
      await prisma.workflow.update({
        where: { id: tplWorkflow.id },
        data: { currentVersionId: tplVersion.id, updatedBy: SYSTEM },
      })
    }

    const existingPhaseCount = await prisma.phase.count({
      where: { workflowVersionId: tplVersion.id },
    })
    if (existingPhaseCount === 0) {
      for (const phaseDef of tpl.phases) {
        const tplPhase = await prisma.phase.create({
          data: {
            workflowVersionId: tplVersion.id,
            order: phaseDef.order,
            category: phaseDef.category,
            name: phaseDef.name,
            createdBy: SYSTEM,
            updatedBy: SYSTEM,
          },
        })
        for (const groupDef of phaseDef.groups) {
          const tplGroup = await prisma.group.create({
            data: {
              phaseId: tplPhase.id,
              order: groupDef.order,
              category: groupDef.category,
              name: groupDef.name,
              supportsParallel: groupDef.supportsParallel ?? false,
              createdBy: SYSTEM,
              updatedBy: SYSTEM,
            },
          })
          for (const stepDef of groupDef.steps) {
            await prisma.step.create({
              data: {
                groupId: tplGroup.id,
                order: stepDef.order,
                category: stepDef.category,
                actionType: stepDef.actionType,
                name: stepDef.name,
                instructions: stepDef.instructions ?? null,
                createdBy: SYSTEM,
                updatedBy: SYSTEM,
              },
            })
          }
        }
      }
    }
  }
  console.log('✓ Workflow templates:', templates.map((t) => t.code).join(', '))

  // ── 17. MaintenanceOrders (PROMPT_9 demo) ────────────────────────────────
  const mntDefs = [
    {
      code: 'MNT-2026-0001',
      equipmentNodeCode: 'EQ-EXT-01A',
      type: 'preventive',
      status: 'scheduled',
      priority: 'normal',
      description: 'Pulizia testa estrusione + lubrificazione cuscinetti',
      plannedStart: new Date('2026-05-15T08:00:00Z'),
      plannedEnd: new Date('2026-05-15T11:00:00Z'),
    },
    {
      code: 'MNT-2026-0002',
      equipmentNodeCode: 'EQ-LEAK-01A',
      type: 'calibration',
      status: 'in_progress',
      priority: 'high',
      description: 'Calibrazione trasduttore pressione — certificato annuale',
      plannedStart: new Date('2026-05-04T14:00:00Z'),
      plannedEnd: new Date('2026-05-04T17:00:00Z'),
    },
    {
      code: 'MNT-2026-0003',
      equipmentNodeCode: 'EQ-CRIMP-01A',
      type: 'corrective',
      status: 'completed',
      priority: 'urgent',
      description: 'Sostituzione guarnizione idraulica pressa crimp (perdita olio)',
      plannedStart: new Date('2026-04-28T09:00:00Z'),
      plannedEnd: new Date('2026-04-28T13:00:00Z'),
    },
  ]

  for (const mnt of mntDefs) {
    const eq = eqNodes[mnt.equipmentNodeCode]
    if (!eq) continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (prisma as any).maintenanceOrder.findFirst({
      where: { plantId: plant.id, code: mnt.code },
    })
    if (!existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).maintenanceOrder.create({
        data: {
          code: mnt.code,
          equipmentNodeId: eq.id,
          type: mnt.type,
          status: mnt.status,
          priority: mnt.priority,
          description: mnt.description,
          plannedStart: mnt.plannedStart,
          plannedEnd: mnt.plannedEnd,
          ...(mnt.status === 'in_progress' || mnt.status === 'completed'
            ? { actualStart: mnt.plannedStart }
            : {}),
          ...(mnt.status === 'completed' ? { actualEnd: mnt.plannedEnd } : {}),
          plantId: plant.id,
          createdBy: SYSTEM,
          updatedBy: SYSTEM,
        },
      })
    }
  }
  console.log('✓ MaintenanceOrders:', mntDefs.map((m) => m.code).join(', '))

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

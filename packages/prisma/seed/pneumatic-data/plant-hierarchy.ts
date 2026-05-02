// PROMPT_PNE_2 D1 — Plant hierarchy + Devices for the Pneumatic Air line.
//
// Hierarchy (per PROMPT_PNE_2 § 3.2):
//   Site: PLT-RFA-MO-001  (existing — upserted no-op if baseline ran)
//   └── Area: AREA-PNE-AIR-001 (Linea Pneumatic Air)
//       ├── WC-ASSY-PNE-01  Banco Assemblaggio       → WS-ASSY-01   → DEV-CRIMP-001  (press)
//       ├── WC-LEAK-PNE-01  Test funzionali Leak     → WS-LEAK-01   → DEV-LEAK-001   (leak_tester)
//       ├── WC-CAMERA-PNE-01 Test funzionali Camera  → WS-CAMERA-01 → DEV-CAMERA-001 (measurement)
//       └── WC-PACK-PNE-01  Imballaggio              → WS-PACK-01   (no device)
//
// Schema notes:
// - EquipmentNode.level enum: enterprise|site|area|work_center|work_unit|equipment_module
//   The schema has no "workstation" level → workstations modeled as work_unit (mirrors baseline
//   which uses work_unit for individual machines).
// - Device.code does NOT exist in schema. PROMPT-spec device codes (DEV-CRIMP-001 etc.) are
//   stored on Device.serialNumber (which IS @unique) so they survive idempotency.

import { SYSTEM, upsertByPlantCode, type PneumaticSeedContext, type Prisma } from '../helpers/upsert'

export const PNE_AREA = {
  code: 'AREA-PNE-AIR-001',
  name: 'Linea Pneumatic Air',
  level: 'area' as const,
  parentCode: null as string | null,
}

export const PNE_WORK_CENTERS = [
  { code: 'WC-ASSY-PNE-01', name: 'Banco Assemblaggio', level: 'work_center' as const, parentCode: 'AREA-PNE-AIR-001' },
  { code: 'WC-LEAK-PNE-01', name: 'Test funzionali Leak', level: 'work_center' as const, parentCode: 'AREA-PNE-AIR-001' },
  { code: 'WC-CAMERA-PNE-01', name: 'Test funzionali Camera', level: 'work_center' as const, parentCode: 'AREA-PNE-AIR-001' },
  { code: 'WC-PACK-PNE-01', name: 'Imballaggio', level: 'work_center' as const, parentCode: 'AREA-PNE-AIR-001' },
] as const

export const PNE_WORKSTATIONS = [
  { code: 'WS-ASSY-01', name: 'Banco assemblaggio crimpatura', level: 'work_unit' as const, parentCode: 'WC-ASSY-PNE-01' },
  { code: 'WS-LEAK-01', name: 'Banco leak test', level: 'work_unit' as const, parentCode: 'WC-LEAK-PNE-01' },
  { code: 'WS-CAMERA-01', name: 'Banco camera test', level: 'work_unit' as const, parentCode: 'WC-CAMERA-PNE-01' },
  { code: 'WS-PACK-01', name: 'Banco imballaggio', level: 'work_unit' as const, parentCode: 'WC-PACK-PNE-01' },
] as const

// Devices: serialNumber acts as the unique PROMPT-spec code.
// equipmentNodeCode points to the workstation (work_unit) the device sits on.
export const PNE_DEVICES = [
  {
    serialNumber: 'DEV-CRIMP-001',
    name: 'Crimpatrice servo-elettrica',
    deviceType: 'press',
    equipmentNodeCode: 'WS-ASSY-01',
    isMock: true,
    firmwareVersion: '2.4.1',
  },
  {
    serialNumber: 'DEV-LEAK-001',
    name: 'Leak Tester ATEQ Premier i style',
    deviceType: 'leak_tester',
    equipmentNodeCode: 'WS-LEAK-01',
    isMock: true,
    firmwareVersion: '5.1.0',
  },
  {
    serialNumber: 'DEV-CAMERA-001',
    name: 'Camera vision system',
    deviceType: 'measurement',
    equipmentNodeCode: 'WS-CAMERA-01',
    isMock: true,
    firmwareVersion: '1.8.2',
  },
] as const

export async function seedPlantHierarchy(prisma: Prisma, ctx: PneumaticSeedContext): Promise<void> {
  // 1. Plant — upsert (no-op if baseline already created)
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
  ctx.plantId = plant.id

  // 2. Area + work centers + workstations
  const allNodes = [PNE_AREA, ...PNE_WORK_CENTERS, ...PNE_WORKSTATIONS]
  for (const node of allNodes) {
    const parentId = node.parentCode ? ctx.equipmentNodes[node.parentCode]?.id : undefined
    const created = await upsertByPlantCode(
      prisma.equipmentNode,
      ctx.plantId,
      node.code,
      {
        name: node.name,
        level: node.level,
        status: 'available',
        parentId: parentId ?? null,
      },
    )
    ctx.equipmentNodes[node.code] = created
  }

  // 3. Devices — keyed by serialNumber (acts as PROMPT-spec code)
  for (const dev of PNE_DEVICES) {
    const equipmentNodeId = ctx.equipmentNodes[dev.equipmentNodeCode]?.id
    if (!equipmentNodeId) {
      throw new Error(`Device ${dev.serialNumber} references unknown equipment node ${dev.equipmentNodeCode}`)
    }
    const existing = await prisma.device.findUnique({ where: { serialNumber: dev.serialNumber } })
    const created = existing
      ? await prisma.device.update({
          where: { serialNumber: dev.serialNumber },
          data: {
            equipmentNodeId,
            deviceType: dev.deviceType,
            isMock: dev.isMock,
            firmwareVersion: dev.firmwareVersion,
            updatedBy: SYSTEM,
          },
        })
      : await prisma.device.create({
          data: {
            equipmentNodeId,
            deviceType: dev.deviceType,
            serialNumber: dev.serialNumber,
            isMock: dev.isMock,
            firmwareVersion: dev.firmwareVersion,
            createdBy: SYSTEM,
            updatedBy: SYSTEM,
          },
        })
    ctx.devices[dev.serialNumber] = created
  }

  console.log(
    `✓ Plant hierarchy: 1 area / ${PNE_WORK_CENTERS.length} WCs / ${PNE_WORKSTATIONS.length} WSs / ${PNE_DEVICES.length} devices`,
  )
}

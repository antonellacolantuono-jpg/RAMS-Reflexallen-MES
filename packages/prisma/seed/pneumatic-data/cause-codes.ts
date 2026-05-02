// PROMPT_PNE_2 D2 — Cause codes for the Pneumatic Air line.
//
// 6 cause codes per PROMPT § 3.2. Codes are literal lowercase snake-case as
// specified in the prompt — distinct from baseline `SC-001/DT-001` format so
// no collision risk on warm DB.
//
// Schema note: CauseCode has no severity column (only code/name/category/phase/
// description/plantId). Severity encoded in description text — same workaround
// as fault-codes.ts (S1 surprise budget).

import { upsertByPlantCode, type PneumaticSeedContext, type Prisma } from '../helpers/upsert'

export const PNE_CAUSE_CODES = [
  {
    code: 'material_defect',
    name: 'Difetto materiale',
    category: 'scrap',
    phase: 'production',
    severity: 'high',
    description: 'Severity: high. Difetto strutturale del materiale (porosità, contaminazione, granuli alieni).',
  },
  {
    code: 'process_error',
    name: 'Errore processo',
    category: 'scrap',
    phase: 'production',
    severity: 'medium',
    description: 'Severity: medium. Parametro di processo fuori range (temperatura, pressione, velocità).',
  },
  {
    code: 'tool_wear',
    name: 'Usura utensile',
    category: 'scrap',
    phase: 'production',
    severity: 'medium',
    description: 'Severity: medium. Usura attrezzo o utensile oltre soglia limite (testa, calibratore, crimp die).',
  },
  {
    code: 'crimp_leak',
    name: 'Difetto crimpatura',
    category: 'scrap',
    phase: 'quality_control',
    severity: 'high',
    description: 'Severity: high. Crimpatura non conforme — perdita su raccordo end A o end B.',
  },
  {
    code: 'camera_calibration',
    name: 'Calibrazione camera',
    category: 'scrap',
    phase: 'quality_control',
    severity: 'medium',
    description: 'Severity: medium. Drift di calibrazione del sistema vision — ricalibrazione richiesta.',
  },
  {
    code: 'other',
    name: 'Altro',
    category: 'scrap',
    phase: null as string | null,
    severity: 'variable',
    description: 'Severity: variable. Causa non classificata — operatore deve compilare nota dettagliata.',
  },
] as const

export async function seedCauseCodes(prisma: Prisma, ctx: PneumaticSeedContext): Promise<void> {
  for (const cc of PNE_CAUSE_CODES) {
    await upsertByPlantCode(prisma.causeCode, ctx.plantId, cc.code, {
      name: cc.name,
      category: cc.category,
      phase: cc.phase,
      description: cc.description,
    })
  }
  console.log(`✓ Cause codes: ${PNE_CAUSE_CODES.length}`)
}

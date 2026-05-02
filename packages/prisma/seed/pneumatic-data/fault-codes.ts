// PROMPT_PNE_2 D2 — Fault codes for the Pneumatic Air recovery sub-flows.
//
// IMPORTANT WORKAROUND (S1 surprise budget — user-confirmed 2026-05-02):
// FaultCode model is MISSING from packages/prisma/schema.prisma. Schema
// migrations are out of scope per PROMPT_PNE_2 § 4. As workaround, fault
// codes are stored as CauseCode rows with:
//   - category = 'recovery_fault' (new value alongside scrap/downtime/defect/rework)
//   - phase = 'leak' or 'camera' (which recovery flow consumes the fault)
//   - severity encoded in description text (CauseCode lacks severity column)
//   - code prefix LK-* / CM-* redundantly encodes phase scope (consumed by
//     HMI Recovery dropdowns — PROMPT_PNE_4)
//
// Promotion to first-class FaultCode model tracked by TODO-041 (D4 work).

import { upsertByPlantCode, type PneumaticSeedContext, type Prisma } from '../helpers/upsert'

export const PNE_FAULT_CODES = [
  // Leak recovery (5)
  {
    code: 'LK-HOSE-LOOSE',
    name: 'Connessione tubo allentata',
    phase: 'leak',
    severity: 'medium',
    suggestedAction: 're-tighten',
    description: 'Severity: medium. Suggested action: re-tighten hose connections and re-test.',
  },
  {
    code: 'LK-SEAL-CONTAM',
    name: 'Superficie sigillante contaminata',
    phase: 'leak',
    severity: 'medium',
    suggestedAction: 'clean',
    description: 'Severity: medium. Suggested action: clean sealing surfaces with isopropyl alcohol and re-test.',
  },
  {
    code: 'LK-REAL-DEFECT',
    name: 'Difetto reale del tubo (porosità)',
    phase: 'leak',
    severity: 'high',
    suggestedAction: 'scrap',
    description: 'Severity: high. Suggested action: scrap with cause code material_defect — porosity confirmed.',
  },
  {
    code: 'LK-CRIMP-LEAK',
    name: 'Perdita su crimpatura',
    phase: 'leak',
    severity: 'high',
    suggestedAction: 'scrap',
    description: 'Severity: high. Suggested action: scrap with cause code crimp_leak — re-crimp not recoverable in-place.',
  },
  {
    code: 'LK-OTHER',
    name: 'Altro (leak)',
    phase: 'leak',
    severity: 'low',
    suggestedAction: 'operator_decision',
    description: 'Severity: low. Suggested action: operator decision — fill in detailed note for QC review.',
  },
  // Camera recovery (5)
  {
    code: 'CM-MISALIGN',
    name: 'Camera disallineata',
    phase: 'camera',
    severity: 'medium',
    suggestedAction: 'realign',
    description: 'Severity: medium. Suggested action: realign vision module to fixture and re-test.',
  },
  {
    code: 'CM-LIGHTING',
    name: 'Problema illuminazione',
    phase: 'camera',
    severity: 'low',
    suggestedAction: 'check_lights',
    description: 'Severity: low. Suggested action: verify ring-light intensity and re-test.',
  },
  {
    code: 'CM-POSITIONING',
    name: 'Tubo mal posizionato',
    phase: 'camera',
    severity: 'medium',
    suggestedAction: 'reposition',
    description: 'Severity: medium. Suggested action: reposition tube on fixture per SOP and re-test.',
  },
  {
    code: 'CM-REAL-DEFECT',
    name: 'Difetto conformità reale',
    phase: 'camera',
    severity: 'high',
    suggestedAction: 'scrap',
    description: 'Severity: high. Suggested action: scrap with cause code material_defect — non-conformance confirmed.',
  },
  {
    code: 'CM-CALIBRATION',
    name: 'Drift calibrazione',
    phase: 'camera',
    severity: 'medium',
    suggestedAction: 'recalibrate',
    description: 'Severity: medium. Suggested action: recalibrate vision module against reference target and re-test.',
  },
] as const

export async function seedFaultCodes(prisma: Prisma, ctx: PneumaticSeedContext): Promise<void> {
  for (const fc of PNE_FAULT_CODES) {
    await upsertByPlantCode(prisma.causeCode, ctx.plantId, fc.code, {
      name: fc.name,
      category: 'recovery_fault',
      phase: fc.phase,
      description: fc.description,
    })
  }
  const leakCount = PNE_FAULT_CODES.filter((f) => f.phase === 'leak').length
  const cameraCount = PNE_FAULT_CODES.filter((f) => f.phase === 'camera').length
  console.log(`✓ Fault codes (CauseCode workaround S1): ${leakCount} leak + ${cameraCount} camera = ${PNE_FAULT_CODES.length}`)
}

// PROMPT_PNE_2 D1 — Skills for the Pneumatic Air operators.
//
// Convention note: baseline seed.ts uses BARE skill codes (no SKILL- prefix):
// EXT, ASSY, QC, TEST, PACK, FORKLIFT, WAREHOUSE, MANAGER. PROMPT_PNE_2 § 3.2
// also writes them bare (ASSY, TEST, QC, IDENTIFICATION). This seed reuses the
// 3 baseline-shared codes (ASSY, TEST, QC) via idempotent upsert and adds only
// IDENTIFICATION as net-new. Every other code is identical no-op on warm DB.

import { upsertByPlantCode, type PneumaticSeedContext, type Prisma } from '../helpers/upsert'

export const PNE_SKILLS = [
  {
    code: 'ASSY',
    name: 'Assemblaggio',
    category: 'production',
    description: 'Assemblaggio crimp e raccordi (baseline-shared)',
    netNew: false,
  },
  {
    code: 'TEST',
    name: 'Testing',
    category: 'quality',
    description: 'Collaudo tenuta (leak test) e camera test (baseline-shared)',
    netNew: false,
  },
  {
    code: 'QC',
    name: 'Controllo Qualità',
    category: 'quality',
    description: 'Ispezione visiva e dimensionale (baseline-shared)',
    netNew: false,
  },
  {
    code: 'IDENTIFICATION',
    name: 'Identificazione',
    category: 'logistics',
    description: 'Scansione QR/barcode, stampa e applicazione etichette (PNE net-new)',
    netNew: true,
  },
] as const

export async function seedSkills(prisma: Prisma, ctx: PneumaticSeedContext): Promise<void> {
  for (const s of PNE_SKILLS) {
    const created = await upsertByPlantCode(prisma.skill, ctx.plantId, s.code, {
      name: s.name,
      category: s.category,
      description: s.description,
    })
    ctx.skills[s.code] = created
  }
  const newCount = PNE_SKILLS.filter((s) => s.netNew).length
  console.log(`✓ Skills: ${PNE_SKILLS.length} (${newCount} net-new, ${PNE_SKILLS.length - newCount} baseline-shared)`)
}

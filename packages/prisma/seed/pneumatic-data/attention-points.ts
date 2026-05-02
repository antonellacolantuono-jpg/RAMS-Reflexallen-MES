// PROMPT_PNE_2 D2 — Attention points for the Pneumatic Air workflow.
//
// 3 APs per PROMPT § 3.2. Schema mapping:
//   PROMPT severity      → schema.AttentionPoint.severity (info|warning|critical)
//   high                 → critical
//   medium               → warning
//   low                  → info
//
// AttentionPoint has NO `code` column → the PROMPT-spec code (AP-CRIMP-FORCE
// etc.) is embedded as a `[CODE]` prefix in the message field for traceability
// in HMI dropdowns. Idempotency is achieved by `findFirst({ where: { message }})`
// since the code prefix makes the message stable.
//
// entityType is set to 'Step' but entityId is a placeholder string until D3
// creates the actual Step rows. The HMI is expected to resolve APs by entityId
// match — text-based loose coupling per existing baseline pattern (which uses
// plant.id as entityId for plant-wide attention points).

import { SYSTEM, type PneumaticSeedContext, type Prisma } from '../helpers/upsert'

export const PNE_ATTENTION_POINTS = [
  {
    code: 'AP-CRIMP-FORCE',
    severity: 'critical' as const, // PROMPT high → schema critical
    category: 'process',
    entityType: 'Step',
    entityIdPlaceholder: 'STEP-CRIMP-A,STEP-CRIMP-B', // resolves once D3 lands
    promptMessage: 'Verificare forza crimpatura entro tolleranza ±1kN',
  },
  {
    code: 'AP-LEAK-PRESSURE',
    severity: 'critical' as const, // PROMPT high → schema critical
    category: 'safety',
    entityType: 'Step',
    entityIdPlaceholder: 'STEP-LEAK-001,STEP-LEAK-008', // position + disconnect
    promptMessage: 'Disinnestare aria compressa prima di scollegare fixture',
  },
  {
    code: 'AP-LABEL-LEGIBILITY',
    severity: 'warning' as const, // PROMPT medium → schema warning
    category: 'quality',
    entityType: 'Step',
    entityIdPlaceholder: 'STEP-LEAK-004,STEP-PACK-005', // apply label + box label
    promptMessage: 'Verificare che marcatura sia leggibile prima di applicare etichetta',
  },
] as const

function buildMessage(ap: (typeof PNE_ATTENTION_POINTS)[number]): string {
  return `[${ap.code}] [${ap.category}] ${ap.promptMessage}`
}

export async function seedAttentionPoints(prisma: Prisma, ctx: PneumaticSeedContext): Promise<void> {
  for (const ap of PNE_ATTENTION_POINTS) {
    const message = buildMessage(ap)
    const existing = await prisma.attentionPoint.findFirst({
      where: { plantId: ctx.plantId, message },
    })
    if (existing) {
      // Update mutable fields if drifted (severity, entityType)
      await prisma.attentionPoint.update({
        where: { id: existing.id },
        data: { severity: ap.severity, entityType: ap.entityType },
      })
    } else {
      await prisma.attentionPoint.create({
        data: {
          entityType: ap.entityType,
          entityId: ap.entityIdPlaceholder,
          severity: ap.severity,
          message,
          plantId: ctx.plantId,
          createdBy: SYSTEM,
        },
      })
    }
  }
  console.log(`✓ Attention points: ${PNE_ATTENTION_POINTS.length}`)
}

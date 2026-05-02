// PROMPT_PNE_2 — Pneumatic Air seed orchestrator.
//
// Run with:  pnpm --filter @mes/prisma seed:pneumatic
//
// Idempotent: re-running on warm DB performs upsert no-ops.
// Safe to run alongside the baseline `pnpm db:seed` (different unique codes).
//
// D1 (this commit): plant hierarchy + items + recipes + skills + operators.
// D2: cause/fault codes + attention points + WO (status=draft).
// D3: workflow v1 + WO release transition + snapshot.
// D4: workflow v0 (Empty) + STATUS closure.

import { prisma } from '../src/client'
import { emptyContext } from './helpers/upsert'
import { seedPlantHierarchy } from './pneumatic-data/plant-hierarchy'
import { seedItems } from './pneumatic-data/items'
import { seedRecipes } from './pneumatic-data/recipes'
import { seedSkills } from './pneumatic-data/skills'
import { seedOperators } from './pneumatic-data/operators'
import { seedCauseCodes } from './pneumatic-data/cause-codes'
import { seedFaultCodes } from './pneumatic-data/fault-codes'
import { seedAttentionPoints } from './pneumatic-data/attention-points'
import { seedWorkOrderDraft, releaseWorkOrder } from './pneumatic-data/work-orders'
import { seedWorkflowV1 } from './pneumatic-data/workflow-v1'
import { seedWorkflowV0Empty } from './pneumatic-data/workflow-v0-empty'

async function main(): Promise<void> {
  console.log('🌱 Seeding Pneumatic Air (PROMPT_PNE_2)...')
  const ctx = emptyContext('') // plantId is filled by seedPlantHierarchy

  // D1 — foundation
  await seedPlantHierarchy(prisma, ctx)
  await seedItems(prisma, ctx)
  await seedRecipes(prisma, ctx) // depends on items + devices
  await seedSkills(prisma, ctx)
  await seedOperators(prisma, ctx) // depends on skills

  // D2 — auxiliary entities + WO draft
  await seedCauseCodes(prisma, ctx)
  await seedFaultCodes(prisma, ctx) // CauseCode rows with category=recovery_fault (S1 workaround)
  await seedAttentionPoints(prisma, ctx)
  const { workOrderId } = await seedWorkOrderDraft(prisma, ctx)

  // D3 — workflow v1 + WO release transition + snapshot
  const { workflowVersionId } = await seedWorkflowV1(prisma, ctx)
  await releaseWorkOrder(prisma, ctx, workOrderId, workflowVersionId)

  // D4 — empty workflow scaffold (UX validation)
  await seedWorkflowV0Empty(prisma, ctx)

  console.log('✅ Pneumatic Air seed (D4) complete.')
}

main()
  .catch((err) => {
    console.error('❌ Pneumatic Air seed failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

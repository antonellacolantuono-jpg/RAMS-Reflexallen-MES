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

async function main(): Promise<void> {
  console.log('🌱 Seeding Pneumatic Air (PROMPT_PNE_2)...')
  const ctx = emptyContext('') // plantId is filled by seedPlantHierarchy

  await seedPlantHierarchy(prisma, ctx)
  await seedItems(prisma, ctx)
  await seedRecipes(prisma, ctx) // depends on items + devices
  await seedSkills(prisma, ctx)
  await seedOperators(prisma, ctx) // depends on skills

  console.log('✅ Pneumatic Air seed (D1) complete.')
}

main()
  .catch((err) => {
    console.error('❌ Pneumatic Air seed failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

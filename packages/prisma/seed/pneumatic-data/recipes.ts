// PROMPT_PNE_2 D1 — Recipes for the Pneumatic Air production line.
//
// 3 recipes, each linked to its device via Recipe.deviceId (single-FK; PROMPT
// "deviceCompat" maps directly).
//
// Per ADR-001 / WORKFLOW_PNEUMATIC_AIR_DETAILED.md § 7:
//   RCP-LEAK-PNE-12-001 v2 — leak test 6 bar / 45s cycle, 0.5 mbar/min PASS
//                            threshold, MARGINAL 0.5-1.0, FAIL > 1.0
//   RCP-CRIMP-12-001     v1 — crimp force 25 kN ± 1, 8 sec cycle
//   RCP-CAMERA-PNE-001   v1 — camera 8s cycle, 4 ROIs ≥ 95% similarity

import { SYSTEM, upsertByPlantCode, type PneumaticSeedContext, type Prisma } from '../helpers/upsert'

export const PNE_RECIPES = [
  {
    code: 'RCP-LEAK-PNE-12-001',
    name: 'Leak test M12 — 6 bar / 45s',
    deviceCode: 'DEV-LEAK-001',
    itemCode: 'PNE-TUBE-12-680',
    currentVersion: 2,
    versions: [
      {
        version: 1,
        status: 'deprecated',
        parameters: {
          test_pressure_bar: 5.5,
          cycle_time_sec: 40,
          pass_threshold_mbar_min: 0.5,
        },
      },
      {
        version: 2,
        status: 'approved',
        parameters: {
          test_pressure_bar: 6.0,
          cycle_time_sec: 45,
          parallel_steps_buffer_sec: 5,
          pass_threshold_mbar_min: 0.5,
          marginal_threshold_mbar_min: 1.0,
          fail_above_mbar_min: 1.0,
          phases: [
            { name: 'pressurize', sec: 5 },
            { name: 'stabilize', sec: 5 },
            { name: 'hold', sec: 30 },
            { name: 'depressurize', sec: 5 },
          ],
        },
      },
    ],
  },
  {
    code: 'RCP-CRIMP-12-001',
    name: 'Crimp raccordi M12 — 25 kN servo-elettrico',
    deviceCode: 'DEV-CRIMP-001',
    itemCode: 'PNE-TUBE-12-680',
    currentVersion: 1,
    versions: [
      {
        version: 1,
        status: 'approved',
        parameters: {
          crimp_force_kn: 25.0,
          tolerance_kn: 1.0,
          cycle_time_sec: 8,
          hold_time_sec: 2,
          attention_points: ['AP-CRIMP-FORCE'],
        },
      },
    ],
  },
  {
    code: 'RCP-CAMERA-PNE-001',
    name: 'Camera test M12 — 8s, 4 ROIs',
    deviceCode: 'DEV-CAMERA-001',
    itemCode: 'PNE-TUBE-12-680',
    currentVersion: 1,
    versions: [
      {
        version: 1,
        status: 'approved',
        parameters: {
          cycle_time_sec: 8,
          rois: [
            { name: 'raccordo_a', similarity_threshold: 0.95 },
            { name: 'raccordo_b', similarity_threshold: 0.95 },
            { name: 'label_position', similarity_threshold: 0.95 },
            { name: 'tape_position', similarity_threshold: 0.95 },
          ],
        },
      },
    ],
  },
] as const

export async function seedRecipes(prisma: Prisma, ctx: PneumaticSeedContext): Promise<void> {
  for (const r of PNE_RECIPES) {
    const deviceId = ctx.devices[r.deviceCode]?.id
    const itemId = ctx.items[r.itemCode]?.id
    if (!deviceId) {
      throw new Error(`Recipe ${r.code} references unknown device ${r.deviceCode}`)
    }
    if (!itemId) {
      throw new Error(`Recipe ${r.code} references unknown item ${r.itemCode}`)
    }

    const recipe = await upsertByPlantCode(prisma.recipe, ctx.plantId, r.code, {
      name: r.name,
      status: 'approved',
      deviceId,
      itemId,
    })
    ctx.recipes[r.code] = recipe

    for (const v of r.versions) {
      const existing = await prisma.recipeVersion.findUnique({
        where: { recipeId_version: { recipeId: recipe.id, version: v.version } },
      })
      if (!existing) {
        await prisma.recipeVersion.create({
          data: {
            recipeId: recipe.id,
            version: v.version,
            status: v.status,
            parameters: JSON.stringify(v.parameters),
            approvedBy: v.status === 'approved' ? SYSTEM : null,
            approvedAt: v.status === 'approved' ? new Date() : null,
            createdBy: SYSTEM,
          },
        })
      }
    }
  }

  const totalVersions = PNE_RECIPES.reduce((sum, r) => sum + r.versions.length, 0)
  console.log(`✓ Recipes: ${PNE_RECIPES.length} (with ${totalVersions} versions)`)
}

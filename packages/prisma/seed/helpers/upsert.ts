// Pneumatic Air seed (PROMPT_PNE_2) — shared helpers.
//
// Idempotent upsert wrappers used by every pneumatic-data/*.ts module.
// Mirrors the upsert pattern from packages/prisma/seed.ts (baseline)
// so the new seed runs on a fresh DB OR alongside the baseline.

import type { PrismaClient } from '@prisma/client'

export const SYSTEM = 'seed-pneumatic'

/**
 * Upsert a plant-scoped entity by its (plantId, code) composite key.
 * Works for any model that exposes a `plantId_code` Prisma where input
 * (Item, Skill, Recipe, Workflow, WorkOrder, Shift, BoxType, CauseCode,
 * EquipmentNode).
 */
export async function upsertByPlantCode<TCreate extends Record<string, unknown>>(
  delegate: {
    upsert: (args: {
      where: { plantId_code: { plantId: string; code: string } }
      create: Record<string, unknown>
      update: Record<string, unknown>
    }) => Promise<{ id: string }>
  },
  plantId: string,
  code: string,
  create: TCreate,
  update: Partial<TCreate> = {},
): Promise<{ id: string }> {
  return delegate.upsert({
    where: { plantId_code: { plantId, code } },
    create: { ...create, plantId, code, createdBy: SYSTEM, updatedBy: SYSTEM },
    update: { ...update, updatedBy: SYSTEM },
  })
}

/**
 * Context object threaded through every seeder so downstream entities can
 * reference upstream IDs without re-querying.
 */
export interface PneumaticSeedContext {
  plantId: string
  // Plant hierarchy IDs keyed by code
  equipmentNodes: Record<string, { id: string }>
  // Device IDs keyed by serialNumber (acts as PROMPT-spec "device code")
  devices: Record<string, { id: string }>
  // Master data IDs keyed by code
  items: Record<string, { id: string }>
  boxTypes: Record<string, { id: string }>
  recipes: Record<string, { id: string }>
  skills: Record<string, { id: string }>
  // Operator IDs keyed by badge
  operators: Record<string, { id: string }>
}

export function emptyContext(plantId: string): PneumaticSeedContext {
  return {
    plantId,
    equipmentNodes: {},
    devices: {},
    items: {},
    boxTypes: {},
    recipes: {},
    skills: {},
    operators: {},
  }
}

export type Prisma = PrismaClient

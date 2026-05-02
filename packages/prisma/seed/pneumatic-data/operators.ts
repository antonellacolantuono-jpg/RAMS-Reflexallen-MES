// PROMPT_PNE_2 D1 — Operators for the Pneumatic Air demo.
//
// Mario Rossi (badge 1234, PIN 1234, skills [ASSY, TEST, QC, IDENTIFICATION])
// Anna Verdi  (badge 5678, PIN 5678, skills [TEST, QC])
//
// PINs are argon2id-hashed at seed time (NEVER bcrypt — per CLAUDE.md).
// Existing baseline operators (Marco Rossi, Laura Ferrari, Giovanni Bianchi,
// Sara Conti — badges OP-001..OP-004) are UNTOUCHED. Different badges, different
// names, no conflict.

import * as argon2 from 'argon2'
import { SYSTEM, type PneumaticSeedContext, type Prisma } from '../helpers/upsert'

export const PNE_OPERATORS = [
  {
    badge: '1234',
    pin: '1234',
    firstName: 'Mario',
    lastName: 'Rossi',
    skillCodes: ['ASSY', 'TEST', 'QC', 'IDENTIFICATION'],
  },
  {
    badge: '5678',
    pin: '5678',
    firstName: 'Anna',
    lastName: 'Verdi',
    skillCodes: ['TEST', 'QC'],
  },
] as const

async function hashPin(pin: string): Promise<string> {
  return argon2.hash(pin, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  })
}

export async function seedOperators(prisma: Prisma, ctx: PneumaticSeedContext): Promise<void> {
  for (const op of PNE_OPERATORS) {
    const existing = await prisma.operator.findUnique({ where: { badge: op.badge } })
    const pinHash = existing?.pinHash ?? (await hashPin(op.pin))

    const operator = await prisma.operator.upsert({
      where: { badge: op.badge },
      update: { firstName: op.firstName, lastName: op.lastName, pinHash, updatedBy: SYSTEM },
      create: {
        badge: op.badge,
        firstName: op.firstName,
        lastName: op.lastName,
        status: 'active',
        plantId: ctx.plantId,
        pinHash,
        createdBy: SYSTEM,
        updatedBy: SYSTEM,
      },
    })
    ctx.operators[op.badge] = operator

    for (const skillCode of op.skillCodes) {
      const skill = ctx.skills[skillCode]
      if (!skill) {
        throw new Error(`Operator ${op.badge} references unknown skill ${skillCode}`)
      }
      await prisma.operatorSkill.upsert({
        where: { operatorId_skillId: { operatorId: operator.id, skillId: skill.id } },
        update: {},
        create: {
          operatorId: operator.id,
          skillId: skill.id,
          certifiedAt: new Date('2025-06-01'),
          expiresAt: new Date('2027-06-01'),
          level: 'certified',
          certifiedBy: SYSTEM,
        },
      })
    }
  }
  console.log(`✓ Operators: ${PNE_OPERATORS.length} (Mario Rossi 1234, Anna Verdi 5678)`)
}

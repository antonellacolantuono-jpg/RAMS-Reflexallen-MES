// PROMPT_PNE_2 D4 — Workflow v0 (Empty) for UX validation of the workflow editor.
//
// Code:    wf-pneumatic-air-680-v0
// Status:  draft  (PROMPT "Draft" → schema enum 'draft')
// Item:    PNE-TUBE-12-680  (same id as v1 — process engineer can compare)
// Body:    EMPTY — zero Phase rows.
//
// Purpose (per PROMPT_PNE_2 § 3.2): scaffold for Antonella to manually build
// a Pneumatic Air workflow from scratch using the configurator UI, validating
// the F1.2/F1.3 editor UX on a real production case.

import { SYSTEM, type PneumaticSeedContext, type Prisma } from '../helpers/upsert'

export const PNE_WORKFLOW_V0_CODE = 'wf-pneumatic-air-680-v0'
export const PNE_WORKFLOW_V0_NAME = 'Pneumatic Air M12 680mm v0 (Empty)'

/**
 * Maps PROMPT-spec workflow status labels to schema enum values.
 * Used both by the v0 seed and by D4 tests to keep the mapping a single
 * source of truth.
 *
 * Schema enum: WorkflowVersionStatus = draft | approved | deprecated
 */
export function mapPromptStatus(promptStatus: 'Active' | 'Draft' | 'Deprecated'): 'approved' | 'draft' | 'deprecated' {
  switch (promptStatus) {
    case 'Active':
      return 'approved'
    case 'Draft':
      return 'draft'
    case 'Deprecated':
      return 'deprecated'
    default: {
      // Exhaustive check — `never`-typed default branch trips TS at compile if a new
      // PROMPT label is added without a mapping.
      const _exhaustive: never = promptStatus
      throw new Error(`Unknown PROMPT status: ${String(_exhaustive)}`)
    }
  }
}

export async function seedWorkflowV0Empty(
  prisma: Prisma,
  ctx: PneumaticSeedContext,
): Promise<{ workflowId: string; workflowVersionId: string }> {
  const item = ctx.items['PNE-TUBE-12-680']
  if (!item) throw new Error('Workflow v0 requires item PNE-TUBE-12-680 (must run D1 first)')

  // 1. Workflow row (no item-FK clash with v1 — both reference the same item)
  const workflow = await prisma.workflow.upsert({
    where: { plantId_code: { plantId: ctx.plantId, code: PNE_WORKFLOW_V0_CODE } },
    update: { name: PNE_WORKFLOW_V0_NAME, itemId: item.id, updatedBy: SYSTEM },
    create: {
      code: PNE_WORKFLOW_V0_CODE,
      name: PNE_WORKFLOW_V0_NAME,
      itemId: item.id,
      description: 'Workflow vuoto (Draft) per costruzione manuale UX validation. Stesso prodotto di v1: PNE-TUBE-12-680.',
      plantId: ctx.plantId,
      createdBy: SYSTEM,
      updatedBy: SYSTEM,
    },
  })

  // 2. WorkflowVersion v1 with status='draft' (PROMPT "Draft" → schema 'draft')
  const status = mapPromptStatus('Draft')
  let version = await prisma.workflowVersion.findUnique({
    where: { workflowId_version: { workflowId: workflow.id, version: 1 } },
  })
  if (!version) {
    version = await prisma.workflowVersion.create({
      data: {
        workflowId: workflow.id,
        version: 1,
        status,
        notes: 'Empty scaffold — fill via /workflows/<id> editor (PROMPT_PNE_2 D4).',
        createdBy: SYSTEM,
        updatedBy: SYSTEM,
      },
    })
  } else if (version.status !== status) {
    version = await prisma.workflowVersion.update({
      where: { id: version.id },
      data: { status, updatedBy: SYSTEM },
    })
  }

  if (workflow.currentVersionId !== version.id) {
    await prisma.workflow.update({
      where: { id: workflow.id },
      data: { currentVersionId: version.id, updatedBy: SYSTEM },
    })
  }

  // 3. Body MUST be empty — no phase / group / step rows.
  const phaseCount = await prisma.phase.count({ where: { workflowVersionId: version.id } })
  if (phaseCount !== 0) {
    throw new Error(
      `Workflow v0 must have empty body but found ${phaseCount} phases. ` +
        'Did someone manually add steps via the editor? The seed will not delete them.',
    )
  }

  console.log(`✓ Workflow v0 (Empty): ${PNE_WORKFLOW_V0_CODE} (status=draft, body=empty for UX validation)`)
  return { workflowId: workflow.id, workflowVersionId: version.id }
}

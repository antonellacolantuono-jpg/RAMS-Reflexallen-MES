import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type { IAutoGenResolver } from '../interfaces/auto-gen-resolver.interface'
import { RULE_IDS } from '../types'

export interface SampleIdContext {
  workOrderId: string
  /**
   * Optional reference to the step that produced the sample. Captured
   * for traceability in the dry-run echo but not embedded in the code
   * (the Sample model has no stepId column today; PROMPT_4_PHASE_2 may
   * extend the schema).
   */
  stepId?: string | null
}

/**
 * Generates sample IDs in the form `SAMPLE-{WO_CODE}-{SEQ}` where SEQ is
 * `max(Sample.sampleNumber) + 1` for the work order (zero-padded to 3
 * digits). Honors the existing `@@unique([workOrderId, sampleNumber])`
 * constraint so the next number is collision-safe.
 */
@Injectable()
export class SampleIdResolver implements IAutoGenResolver<SampleIdContext> {
  readonly ruleId = RULE_IDS.SAMPLE_ID

  constructor(private readonly prisma: PrismaService) {}

  async resolve(ctx: SampleIdContext): Promise<string> {
    const wo = await this.prisma.workOrder.findFirst({
      where: { id: ctx.workOrderId, deletedAt: null },
      select: { code: true },
    })
    if (!wo) {
      throw new NotFoundException(`WorkOrder ${ctx.workOrderId} not found`)
    }
    const latest = await this.prisma.sample.findFirst({
      where: { workOrderId: ctx.workOrderId },
      orderBy: { sampleNumber: 'desc' },
      select: { sampleNumber: true },
    })
    const next = (latest?.sampleNumber ?? 0) + 1
    const seq = next.toString().padStart(3, '0')
    return `SAMPLE-${wo.code}-${seq}`
  }
}

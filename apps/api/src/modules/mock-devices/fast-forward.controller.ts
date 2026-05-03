// PROMPT_PNE_3 D4 — FastForward debug endpoint.
//
// Skips the simulator dispatch entirely and drives the StepExecution state
// machine directly: useful for demo prep / manual verification when waiting
// 45s for a leak cycle to complete is impractical.
//
// Routes live under /api/internal/* (debug-only namespace, mirrors the
// /api/internal/mock-devices/* pattern from D2). Gated on DEMO_MODE=true:
// every endpoint returns 404 when DEMO_MODE is unset or false. Production
// builds refuse to boot if DEMO_MODE is unset (see main.ts boot guard).
//
// Why this is NOT step-execution dispatch (TODO-043 context): this endpoint
// is a thin pass-through over the existing `StepExecutionService.applyTransition`
// API — it does NOT introduce any new dispatch branch. The actual
// SimulatorRegistry → step execution wiring is deferred to PROMPT_PNE_4 D1
// (TODO-043) when HMI Leak/Camera specialized work needs auto-cycle.

import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Req,
} from '@nestjs/common'
import type { Request } from 'express'
import type { JwtAuthenticatedUser } from '../auth/jwt.strategy'
import { StepExecutionService } from '../work-orders/step-execution.service'

const FAST_FORWARD_OUTCOMES = ['PASS', 'FAIL', 'SCRAP'] as const
type FastForwardOutcome = (typeof FAST_FORWARD_OUTCOMES)[number]

const OUTCOME_TO_EVENT: Record<FastForwardOutcome, 'COMPLETE_OK' | 'COMPLETE_NOK' | 'MARK_SCRAPPED'> = {
  PASS: 'COMPLETE_OK',
  FAIL: 'COMPLETE_NOK',
  SCRAP: 'MARK_SCRAPPED',
}

interface FastForwardBody {
  stepExecutionId: string
  outcome: FastForwardOutcome
}

// PROMPT_PNE_3 D4 hotfix #2 — public (no @UseGuards): see MockDevicesController
// for rationale. When the /demo page calls without a session, fall back to a
// demo identity (DEMO_USER_ID + DEMO_PLANT_ID env vars). plantId must point at
// a real seeded plant for the WO lookup to succeed; if unset, the request
// surfaces a clean 404 from the WO/plant filter rather than a 500.
@Controller('internal/fast-forward')
export class FastForwardController {
  constructor(private readonly stepExecution: StepExecutionService) {}

  @Post(':woId/complete-step')
  @HttpCode(HttpStatus.OK)
  async completeStep(
    @Req() req: Request,
    @Param('woId') woId: string,
    @Body() body: unknown,
  ) {
    this.ensureDemoMode()
    const parsed = parseBody(body)
    const user = (req.user as JwtAuthenticatedUser | undefined) ?? {
      id: process.env['DEMO_USER_ID'] ?? 'demo-user',
      badge: 'DEMO',
      plantId: process.env['DEMO_PLANT_ID'] ?? '',
    }

    const eventType = OUTCOME_TO_EVENT[parsed.outcome]
    const event =
      eventType === 'MARK_SCRAPPED'
        ? { type: eventType, by: user.id, reason: 'fast_forward_demo' }
        : { type: eventType, by: user.id }

    const result = await this.stepExecution.applyTransition({
      workOrderId: woId,
      stepExecutionId: parsed.stepExecutionId,
      event,
      changedBy: user.id,
      plantId: user.plantId,
    })
    return { result }
  }

  private ensureDemoMode(): void {
    if (process.env['DEMO_MODE'] !== 'true') {
      throw new NotFoundException()
    }
  }
}

function parseBody(body: unknown): FastForwardBody {
  if (!body || typeof body !== 'object') {
    throw new BadRequestException(
      'Body richiesto: { stepExecutionId: string, outcome: PASS|FAIL|SCRAP }',
    )
  }
  const obj = body as { stepExecutionId?: unknown; outcome?: unknown }
  if (typeof obj.stepExecutionId !== 'string' || obj.stepExecutionId.trim().length === 0) {
    throw new BadRequestException('stepExecutionId è obbligatorio')
  }
  if (
    typeof obj.outcome !== 'string' ||
    !FAST_FORWARD_OUTCOMES.includes(obj.outcome as FastForwardOutcome)
  ) {
    throw new BadRequestException(
      `outcome deve essere uno tra ${FAST_FORWARD_OUTCOMES.join(', ')}`,
    )
  }
  return {
    stepExecutionId: obj.stepExecutionId,
    outcome: obj.outcome as FastForwardOutcome,
  }
}

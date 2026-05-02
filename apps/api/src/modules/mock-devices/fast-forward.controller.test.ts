import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import type { Request } from 'express'
import { FastForwardController } from './fast-forward.controller'
import type { StepExecutionService } from '../work-orders/step-execution.service'

function makeReq(): Request {
  return {
    user: { id: 'op-1', badge: 'OP-001', plantId: 'plant-1' },
  } as unknown as Request
}

function makeController() {
  const applyTransition = vi.fn().mockResolvedValue({
    stepExecutionId: 'se-1',
    workOrderId: 'wo-1',
    fromStatus: 'running',
    toStatus: 'done',
    event: 'COMPLETE_OK',
    changedAt: '2026-05-02T10:00:00.000Z',
    notes: [],
    causeCode: null,
    recoveryStage: null,
    attemptCount: 0,
    autoScrapped: false,
  })
  const service = { applyTransition } as unknown as StepExecutionService
  const controller = new FastForwardController(service)
  return { controller, applyTransition }
}

describe('FastForwardController', () => {
  const originalDemoMode = process.env['DEMO_MODE']

  beforeEach(() => {
    process.env['DEMO_MODE'] = 'true'
  })

  afterEach(() => {
    if (originalDemoMode === undefined) delete process.env['DEMO_MODE']
    else process.env['DEMO_MODE'] = originalDemoMode
  })

  it('returns 404 when DEMO_MODE != "true"', async () => {
    delete process.env['DEMO_MODE']
    const { controller } = makeController()
    await expect(
      controller.completeStep(makeReq(), 'wo-1', {
        stepExecutionId: 'se-1',
        outcome: 'PASS',
      }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('PASS outcome dispatches COMPLETE_OK with caller as `by`', async () => {
    const { controller, applyTransition } = makeController()
    await controller.completeStep(makeReq(), 'wo-42', {
      stepExecutionId: 'se-7',
      outcome: 'PASS',
    })
    expect(applyTransition).toHaveBeenCalledOnce()
    const arg = applyTransition.mock.calls[0]?.[0]
    expect(arg).toMatchObject({
      workOrderId: 'wo-42',
      stepExecutionId: 'se-7',
      changedBy: 'op-1',
      plantId: 'plant-1',
    })
    expect(arg.event).toEqual({ type: 'COMPLETE_OK', by: 'op-1' })
  })

  it('FAIL maps to COMPLETE_NOK; SCRAP maps to MARK_SCRAPPED with reason', async () => {
    const { controller, applyTransition } = makeController()
    await controller.completeStep(makeReq(), 'wo-1', {
      stepExecutionId: 'se-1',
      outcome: 'FAIL',
    })
    expect(applyTransition.mock.calls[0]?.[0].event).toEqual({
      type: 'COMPLETE_NOK',
      by: 'op-1',
    })

    applyTransition.mockClear()
    await controller.completeStep(makeReq(), 'wo-1', {
      stepExecutionId: 'se-2',
      outcome: 'SCRAP',
    })
    expect(applyTransition.mock.calls[0]?.[0].event).toEqual({
      type: 'MARK_SCRAPPED',
      by: 'op-1',
      reason: 'fast_forward_demo',
    })
  })

  it('rejects unknown outcomes with BadRequest (Italian message)', async () => {
    const { controller, applyTransition } = makeController()
    await expect(
      controller.completeStep(makeReq(), 'wo-1', {
        stepExecutionId: 'se-1',
        outcome: 'BOGUS',
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(applyTransition).not.toHaveBeenCalled()
  })

  it('rejects missing stepExecutionId with BadRequest', async () => {
    const { controller } = makeController()
    await expect(
      controller.completeStep(makeReq(), 'wo-1', { outcome: 'PASS' }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })
})

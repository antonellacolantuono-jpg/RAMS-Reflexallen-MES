import { describe, it, expect, vi } from 'vitest'
import { BadRequestException, ForbiddenException } from '@nestjs/common'
import type { Request } from 'express'
import { ReleaseController } from './release.controller'
import type { ReleaseService } from './release.service'

const VALID_BODY = {
  workflowId: 'cl000000000000000000wf01',
  itemId: 'cl000000000000000000item1',
  quantity: 25,
  assignedOperatorId: 'cl000000000000000000op001',
  priority: 'normal',
}

function makeMockReq(user: {
  id: string
  badge: string
  plantId: string
}): Request {
  return { user } as unknown as Request
}

function makeController(serviceImpl?: Partial<ReleaseService>) {
  const releaseMock = vi.fn().mockResolvedValue({
    workOrderId: 'wo-1',
    workOrderCode: 'WO-20260501-001',
    snapshotId: 'snap-1',
    stepExecutionCount: 3,
    releasedAt: '2026-05-01T10:00:00.000Z',
  })
  const service = {
    release: releaseMock,
    ...serviceImpl,
  } as unknown as ReleaseService
  const controller = new ReleaseController(service)
  return { controller, releaseMock, service }
}

describe('ReleaseController.release', () => {
  it('forwards parsed body + JWT user to service.release', async () => {
    const { controller, releaseMock } = makeController()
    const req = makeMockReq({
      id: 'op-mgr',
      badge: 'OP-001',
      plantId: 'plant-1',
    })
    const out = await controller.release(req, VALID_BODY)
    expect(out.result.workOrderId).toBe('wo-1')
    expect(releaseMock).toHaveBeenCalledOnce()
    const arg = releaseMock.mock.calls[0]?.[0]
    expect(arg).toMatchObject({
      workflowId: VALID_BODY.workflowId,
      itemId: VALID_BODY.itemId,
      quantity: 25,
      assignedOperatorId: VALID_BODY.assignedOperatorId,
      priority: 'normal',
      releasedBy: 'op-mgr',
      plantId: 'plant-1',
    })
    expect(arg.assignedShiftId).toBeNull()
  })

  it('passes assignedShiftId when provided', async () => {
    const { controller, releaseMock } = makeController()
    const req = makeMockReq({
      id: 'op-mgr',
      badge: 'OP-001',
      plantId: 'plant-1',
    })
    await controller.release(req, {
      ...VALID_BODY,
      assignedShiftId: 'cl000000000000000000shft1',
    })
    const arg = releaseMock.mock.calls[0]?.[0]
    expect(arg.assignedShiftId).toBe('cl000000000000000000shft1')
  })

  it('throws BadRequestException on Zod validation failure', async () => {
    const { controller, releaseMock } = makeController()
    const req = makeMockReq({
      id: 'op-mgr',
      badge: 'OP-001',
      plantId: 'plant-1',
    })
    await expect(
      controller.release(req, { ...VALID_BODY, quantity: 0 }),
    ).rejects.toBeInstanceOf(BadRequestException)
    await expect(
      controller.release(req, { ...VALID_BODY, quantity: -1 }),
    ).rejects.toBeInstanceOf(BadRequestException)
    await expect(controller.release(req, {})).rejects.toBeInstanceOf(
      BadRequestException,
    )
    expect(releaseMock).not.toHaveBeenCalled()
  })

  it('rejects non-cuid identifiers via Zod', async () => {
    const { controller, releaseMock } = makeController()
    const req = makeMockReq({
      id: 'op-mgr',
      badge: 'OP-001',
      plantId: 'plant-1',
    })
    await expect(
      controller.release(req, { ...VALID_BODY, workflowId: 'not-a-cuid' }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(releaseMock).not.toHaveBeenCalled()
  })

  it('propagates ForbiddenException from service (RBAC)', async () => {
    const releaseMock = vi
      .fn()
      .mockRejectedValue(
        new ForbiddenException('Operator lacks MANAGER skill'),
      )
    const service = { release: releaseMock } as unknown as ReleaseService
    const controller = new ReleaseController(service)
    const req = makeMockReq({
      id: 'op-2',
      badge: 'OP-002',
      plantId: 'plant-1',
    })
    await expect(controller.release(req, VALID_BODY)).rejects.toBeInstanceOf(
      ForbiddenException,
    )
  })

  it('defaults priority to "normal" when omitted', async () => {
    const { controller, releaseMock } = makeController()
    const req = makeMockReq({
      id: 'op-mgr',
      badge: 'OP-001',
      plantId: 'plant-1',
    })
    const { priority: _omit, ...body } = VALID_BODY
    void _omit
    await controller.release(req, body)
    const arg = releaseMock.mock.calls[0]?.[0]
    expect(arg.priority).toBe('normal')
  })
})

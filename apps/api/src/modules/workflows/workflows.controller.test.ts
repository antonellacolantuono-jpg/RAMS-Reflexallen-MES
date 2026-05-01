import { describe, it, expect, vi } from 'vitest'
import { WorkflowsController } from './workflows.controller'
import type { WorkflowsService } from './workflows.service'
import type { AuditLogService } from '../audit-log/audit-log.service'

async function expectZodRejection<T>(fn: () => Promise<T> | T): Promise<void> {
  let caught: unknown = null
  try {
    await fn()
  } catch (e) {
    caught = e
  }
  expect(caught).not.toBeNull()
  const name = (caught as { name?: string } | null)?.name
  expect(name).toBe('ZodError')
}

function makeController(serviceImpl?: Partial<WorkflowsService>) {
  const service = {
    approveVersion: vi.fn().mockResolvedValue({ id: 'ver-1', status: 'approved' }),
    deprecateVersion: vi.fn().mockResolvedValue({ id: 'ver-1', status: 'deprecated' }),
    cloneWorkflow: vi.fn().mockResolvedValue({ id: 'wf-clone' }),
    ...serviceImpl,
  } as unknown as WorkflowsService
  const audit = { record: vi.fn() } as unknown as AuditLogService
  const controller = new WorkflowsController(service, audit)
  return { controller, service }
}

describe('WorkflowsController — versioning lifecycle endpoints', () => {
  it('approveVersion forwards id+vid+actor to service', async () => {
    const { controller, service } = makeController()
    const result = await controller.approveVersion('wf-1', 'ver-1')
    expect(result).toMatchObject({ status: 'approved' })
    expect(service.approveVersion).toHaveBeenCalledWith('wf-1', 'ver-1', 'system')
  })

  it('deprecateVersion parses reason via Zod and forwards to service', async () => {
    const { controller, service } = makeController()
    const result = await controller.deprecateVersion('wf-1', 'ver-1', {
      reason: 'No longer needed for this product line',
    })
    expect(result).toMatchObject({ status: 'deprecated' })
    expect(service.deprecateVersion).toHaveBeenCalledWith(
      'wf-1',
      'ver-1',
      'No longer needed for this product line',
      'system',
    )
  })

  it('deprecateVersion throws ZodError when reason is missing', async () => {
    const { controller } = makeController()
    await expectZodRejection(() => controller.deprecateVersion('wf-1', 'ver-1', {}))
  })

  it('deprecateVersion throws ZodError when reason is shorter than 10 chars', async () => {
    const { controller } = makeController()
    await expectZodRejection(() =>
      controller.deprecateVersion('wf-1', 'ver-1', { reason: 'too short' }),
    )
  })
})

describe('WorkflowsController — clone endpoint', () => {
  it('clone parses body via Zod and forwards to service', async () => {
    const { controller, service } = makeController()
    const result = await controller.clone('wf-source', {
      code: 'WF-NEW',
      name: 'New Workflow',
    })
    expect(result).toMatchObject({ id: 'wf-clone' })
    expect(service.cloneWorkflow).toHaveBeenCalledWith(
      'wf-source',
      { code: 'WF-NEW', name: 'New Workflow' },
      'system',
    )
  })

  it('clone passes optional plantId and description through', async () => {
    const { controller, service } = makeController()
    await controller.clone('wf-source', {
      code: 'WF-NEW',
      name: 'New Workflow',
      description: 'Cloned for line A',
      plantId: 'cl000000000000000000plnt1',
    })
    expect(service.cloneWorkflow).toHaveBeenCalledWith(
      'wf-source',
      expect.objectContaining({
        code: 'WF-NEW',
        description: 'Cloned for line A',
        plantId: 'cl000000000000000000plnt1',
      }),
      'system',
    )
  })

  it('clone throws ZodError when code is missing', async () => {
    const { controller } = makeController()
    await expectZodRejection(() => controller.clone('wf-source', { name: 'New' }))
  })

  it('clone throws ZodError when name is missing', async () => {
    const { controller } = makeController()
    await expectZodRejection(() => controller.clone('wf-source', { code: 'WF-NEW' }))
  })

  it('clone throws ZodError when plantId is not a cuid', async () => {
    const { controller } = makeController()
    await expectZodRejection(() =>
      controller.clone('wf-source', {
        code: 'WF-NEW',
        name: 'New',
        plantId: 'not-a-cuid',
      }),
    )
  })
})

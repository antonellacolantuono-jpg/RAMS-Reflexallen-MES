import { describe, it, expect, vi } from 'vitest'
import { SyncQueue } from './index'

describe('SyncQueue', () => {
  it('executes a job and returns success result', async () => {
    const q = new SyncQueue()
    const result = await q.addJob('test-job', { value: 42 }, async (data) => data.value * 2)
    expect(result.success).toBe(true)
    expect(result.result).toBe(84)
    expect(result.name).toBe('test-job')
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('executes handler via setImmediate (async)', async () => {
    const q = new SyncQueue()
    const order: string[] = []
    const jobPromise = q.addJob('order-test', {}, async () => {
      order.push('handler')
    })
    order.push('after-addJob')
    await jobPromise
    expect(order).toEqual(['after-addJob', 'handler'])
  })

  it('captures handler errors as failure result', async () => {
    const q = new SyncQueue()
    const result = await q.addJob('failing-job', {}, async () => {
      throw new Error('something went wrong')
    })
    expect(result.success).toBe(false)
    expect(result.error).toBe('something went wrong')
  })

  it('runs multiple jobs sequentially', async () => {
    const q = new SyncQueue()
    const results = await Promise.all([
      q.addJob('job-1', 1, async (n) => n + 10),
      q.addJob('job-2', 2, async (n) => n + 20),
      q.addJob('job-3', 3, async (n) => n + 30),
    ])
    expect(results[0]!.result).toBe(11)
    expect(results[1]!.result).toBe(22)
    expect(results[2]!.result).toBe(33)
  })

  it('passes data to handler', async () => {
    const q = new SyncQueue()
    const payload = { userId: 'u1', action: 'send-email' }
    const captured: typeof payload[] = []
    await q.addJob('capture', payload, async (data) => { captured.push(data) })
    expect(captured[0]).toEqual(payload)
  })
})

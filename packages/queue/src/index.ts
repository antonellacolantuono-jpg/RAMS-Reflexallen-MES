export type JobHandler<T = unknown, R = unknown> = (data: T) => Promise<R>

export interface JobResult<R = unknown> {
  name: string
  success: boolean
  result?: R
  error?: string
  durationMs: number
}

export class SyncQueue {
  async addJob<T, R>(
    name: string,
    data: T,
    handler: JobHandler<T, R>,
  ): Promise<JobResult<R>> {
    const start = Date.now()
    try {
      const result = await new Promise<R>((resolve, reject) => {
        setImmediate(async () => {
          try {
            resolve(await handler(data))
          } catch (err) {
            reject(err)
          }
        })
      })
      return { name, success: true, result, durationMs: Date.now() - start }
    } catch (err) {
      return {
        name,
        success: false,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      }
    }
  }
}

export const queue = new SyncQueue()
export default queue

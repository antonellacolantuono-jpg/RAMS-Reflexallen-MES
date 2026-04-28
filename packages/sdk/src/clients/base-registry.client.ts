import type { MesClient } from '../client.js'

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AuditLogEntry {
  id: string
  entityType: string
  entityId: string
  action: string
  changedBy: string
  changedAt: string
  before: unknown
  after: unknown
}

export class BaseRegistryClient<TModel, TCreate, TUpdate, TFilters extends Record<string, unknown>> {
  constructor(
    protected readonly client: MesClient,
    protected readonly basePath: string,
  ) {}

  list(filters?: Partial<TFilters>): Promise<PaginatedResult<TModel>> {
    const qs = filters ? '?' + new URLSearchParams(filters as Record<string, string>).toString() : ''
    return this.client.get<PaginatedResult<TModel>>(`${this.basePath}${qs}`)
  }

  trash(params?: { page?: number; limit?: number }): Promise<PaginatedResult<TModel>> {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return this.client.get<PaginatedResult<TModel>>(`${this.basePath}/trash${qs}`)
  }

  get(id: string): Promise<TModel> {
    return this.client.get<TModel>(`${this.basePath}/${id}`)
  }

  create(data: TCreate): Promise<TModel> {
    return this.client.post<TModel>(this.basePath, data)
  }

  update(id: string, data: TUpdate): Promise<TModel> {
    return this.client.patch<TModel>(`${this.basePath}/${id}`, data)
  }

  remove(id: string): Promise<void> {
    return this.client.delete<void>(`${this.basePath}/${id}`)
  }

  delete(id: string): Promise<void> {
    return this.remove(id)
  }

  restore(id: string): Promise<TModel> {
    return this.client.post<TModel>(`${this.basePath}/${id}/restore`)
  }

  audit(id: string, params?: { page?: number; limit?: number }): Promise<PaginatedResult<AuditLogEntry>> {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return this.client.get<PaginatedResult<AuditLogEntry>>(`${this.basePath}/${id}/audit${qs}`)
  }
}

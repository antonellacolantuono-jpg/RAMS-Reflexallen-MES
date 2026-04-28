export interface MesClientOptions {
  baseUrl: string
  /** JWT bearer token — set after login */
  token?: string
}

export interface ApiError {
  statusCode: number
  message: string
  error?: string
}

export class MesApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(`MES API ${statusCode}: ${message}`)
    this.name = 'MesApiError'
  }
}

export class MesClient {
  private baseUrl: string
  private token: string | undefined

  constructor(options: MesClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '')
    this.token = options.token
  }

  setToken(token: string): void {
    this.token = token
  }

  clearToken(): void {
    this.token = undefined
  }

  private buildHeaders(extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...extra,
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    return headers
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path)
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body)
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body)
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body)
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path)
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const init: RequestInit = {
      method,
      headers: this.buildHeaders(),
    }
    if (body !== undefined) {
      init.body = JSON.stringify(body)
    }
    const response = await fetch(url, init)

    if (!response.ok) {
      let errorBody: unknown
      try {
        errorBody = await response.json()
      } catch {
        errorBody = await response.text()
      }
      const message =
        typeof errorBody === 'object' &&
        errorBody !== null &&
        'message' in errorBody &&
        typeof (errorBody as ApiError).message === 'string'
          ? (errorBody as ApiError).message
          : response.statusText
      throw new MesApiError(response.status, message, errorBody)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json() as Promise<T>
  }
}

export function createClient(options: MesClientOptions): MesClient {
  return new MesClient(options)
}

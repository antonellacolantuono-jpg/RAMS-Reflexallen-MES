'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, ApiError } from './api-client'

export type AuthOperator = {
  id: string
  badge: string
  firstName: string
  lastName: string
  plantId: string
  status: string
}

export type MineWorkOrder = {
  id: string
  code: string
  itemCode: string
  itemName: string
  quantity: number
  completed: number
  priority: 'low' | 'normal' | 'high'
  status: 'ready' | 'in_progress'
  startedAt: string | null
  shiftCode: string | null
}

export const meQueryKey = ['me'] as const
export const myWorkOrdersQueryKey = ['my-work-orders'] as const

export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: async () => {
      const res = await apiGet<{ operator: AuthOperator }>('/api/auth/me')
      return res.operator
    },
    retry: (count, err) => {
      if (err instanceof ApiError && err.status === 401) return false
      return count < 1
    },
    staleTime: 30_000,
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (credentials: { badge: string; pin: string }) => {
      const res = await apiPost<{ operator: AuthOperator }>(
        '/api/auth/login',
        credentials,
      )
      return res.operator
    },
    onSuccess: (operator) => {
      qc.setQueryData(meQueryKey, operator)
    },
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiPost<{ ok: true }>('/api/auth/logout'),
    onSuccess: () => {
      qc.removeQueries({ queryKey: meQueryKey })
      qc.removeQueries({ queryKey: myWorkOrdersQueryKey })
    },
  })
}

export function useMyWorkOrders(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: myWorkOrdersQueryKey,
    queryFn: async () => {
      const res = await apiGet<{ workOrders: MineWorkOrder[] }>(
        '/api/work-orders/mine',
      )
      return res.workOrders
    },
    enabled: options.enabled ?? true,
    staleTime: 15_000,
  })
}

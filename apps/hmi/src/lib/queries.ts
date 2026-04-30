'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, ApiError } from './api-client'

export type StepExecutionStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'blocked'
  | 'qc_hold'
  | 'scrapped'
  | 'done'
  | 'skipped'
  | 'cancelled'
  | 'recovered'
  | 'error'

export type WorkOrderStep = {
  stepExecutionId: string
  workOrderId: string
  stepId: string
  status: StepExecutionStatus
  result: string | null
  durationSec: number | null
  startedAt: string | null
  completedAt: string | null
  stepName: string
  stepCategory: string
  stepOrder: number
  actionType: string
  instructions: string | null
}

export type StepTransitionResult = {
  stepExecutionId: string
  workOrderId: string
  fromStatus: StepExecutionStatus
  toStatus: StepExecutionStatus
  event: string
  changedAt: string
  notes: string[]
  causeCode: string | null
}

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

export const workOrderStepsQueryKey = (workOrderId: string) =>
  ['work-order-steps', workOrderId] as const

export function useWorkOrderSteps(
  workOrderId: string,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: workOrderStepsQueryKey(workOrderId),
    queryFn: async () => {
      const res = await apiGet<{ steps: WorkOrderStep[] }>(
        `/api/work-orders/${encodeURIComponent(workOrderId)}/steps`,
      )
      return res.steps
    },
    enabled: options.enabled ?? true,
    staleTime: 5_000,
  })
}

export function useTransitionStep(workOrderId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      stepExecutionId: string
      event: { type: string; [k: string]: unknown }
    }) => {
      const res = await apiPost<{ result: StepTransitionResult }>(
        `/api/work-orders/${encodeURIComponent(workOrderId)}/steps/${encodeURIComponent(input.stepExecutionId)}/transitions`,
        { event: input.event },
      )
      return res.result
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workOrderStepsQueryKey(workOrderId) })
    },
  })
}

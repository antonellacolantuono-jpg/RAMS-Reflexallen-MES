'use client'
import { create } from 'zustand'
import type { AuthOperator } from './queries'

// Lightweight UI cache so deep routes (/wo/[id]) can render before /api/auth/me
// resolves. Authoritative auth state lives in React Query (useMe). Dashboard
// hydrates this store from useMe data; logout clears it. No persistence.
interface OperatorState {
  operator: AuthOperator | null
  setOperator: (op: AuthOperator | null) => void
  logout: () => void
}

export const useOperatorStore = create<OperatorState>((set) => ({
  operator: null,
  setOperator: (op) => set({ operator: op }),
  logout: () => set({ operator: null }),
}))

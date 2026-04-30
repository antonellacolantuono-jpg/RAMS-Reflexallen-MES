'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { MockOperator } from './mock-data'

interface OperatorState {
  operator: MockOperator | null
  loginAt: string | null
  setOperator: (op: MockOperator) => void
  logout: () => void
}

const sessionStorageJSON = createJSONStorage(() => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    }
  }
  return window.sessionStorage
})

export const useOperatorStore = create<OperatorState>()(
  persist(
    (set) => ({
      operator: null,
      loginAt: null,
      setOperator: (op) =>
        set({ operator: op, loginAt: new Date().toISOString() }),
      logout: () => set({ operator: null, loginAt: null }),
    }),
    {
      name: 'hmi-operator',
      storage: sessionStorageJSON,
    },
  ),
)

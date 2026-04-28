'use client'

import { useRegistrySync } from '../../hooks/useRegistrySync'

export function RegistrySyncProvider({ children }: { children: React.ReactNode }) {
  useRegistrySync()
  return <>{children}</>
}

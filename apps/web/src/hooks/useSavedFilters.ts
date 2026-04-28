'use client'

import { useState, useCallback } from 'react'

export interface FilterPreset {
  name: string
  filters: Record<string, unknown>
}

function key(module: string) { return `mes:filters:${module}` }

function read(module: string): FilterPreset[] {
  try {
    return JSON.parse(localStorage.getItem(key(module)) ?? '[]') as FilterPreset[]
  } catch {
    return []
  }
}

export function useSavedFilters(module: string) {
  const [presets, setPresets] = useState<FilterPreset[]>(() => read(module))

  const save = useCallback((name: string, filters: Record<string, unknown>) => {
    const current = read(module).filter((p) => p.name !== name)
    const updated = [...current, { name, filters }]
    localStorage.setItem(key(module), JSON.stringify(updated))
    setPresets(updated)
  }, [module])

  const remove = useCallback((name: string) => {
    const updated = read(module).filter((p) => p.name !== name)
    localStorage.setItem(key(module), JSON.stringify(updated))
    setPresets(updated)
  }, [module])

  return { presets, save, remove }
}

'use client'

import { useState, useCallback } from 'react'

export interface RecentEntry {
  module: string
  id: string
  label: string
  href: string
  viewedAt: string
}

const MAX_PER_MODULE = 10
const STORAGE_KEY = 'mes:recently-viewed'

function readAll(): RecentEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as RecentEntry[]
  } catch {
    return []
  }
}

function writeAll(entries: RecentEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function useRecentlyViewed(module?: string) {
  const [entries, setEntries] = useState<RecentEntry[]>(() => {
    const all = readAll()
    return module ? all.filter((e) => e.module === module) : all
  })

  const push = useCallback((entry: Omit<RecentEntry, 'viewedAt'>) => {
    const all = readAll().filter((e) => !(e.module === entry.module && e.id === entry.id))
    const moduleEntries = [{ ...entry, viewedAt: new Date().toISOString() }, ...all.filter((e) => e.module === entry.module)]
    const capped = moduleEntries.slice(0, MAX_PER_MODULE)
    const others = all.filter((e) => e.module !== entry.module)
    const updated = [...capped.slice(0, 1), ...others, ...capped.slice(1)]
    writeAll(updated)
    setEntries(module ? updated.filter((e) => e.module === module) : updated)
  }, [module])

  const last3 = readAll().slice(0, 3)

  return { entries, push, last3 }
}

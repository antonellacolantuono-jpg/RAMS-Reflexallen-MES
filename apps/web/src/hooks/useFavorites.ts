'use client'

import { useState, useCallback } from 'react'

export interface FavoriteEntry {
  module: string
  id: string
  label: string
  href: string
}

const STORAGE_KEY = 'mes:favorites'

function read(): FavoriteEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as FavoriteEntry[]
  } catch {
    return []
  }
}

function write(entries: FavoriteEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteEntry[]>(read)

  const isFavorite = useCallback((module: string, id: string) =>
    favorites.some((f) => f.module === module && f.id === id), [favorites])

  const toggle = useCallback((entry: FavoriteEntry) => {
    const current = read()
    const exists = current.some((f) => f.module === entry.module && f.id === entry.id)
    const updated = exists
      ? current.filter((f) => !(f.module === entry.module && f.id === entry.id))
      : [...current, entry]
    write(updated)
    setFavorites(updated)
  }, [])

  return { favorites, isFavorite, toggle }
}

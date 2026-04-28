'use client'

import Link from 'next/link'
import { useFavorites } from '../../hooks/useFavorites'

export function FavoritesBar() {
  const { favorites } = useFavorites()

  if (favorites.length === 0) return null

  return (
    <div className="px-3 py-2">
      <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
        Preferiti
      </p>
      <ul className="flex flex-col gap-0.5">
        {favorites.map((entry) => (
          <li key={`${entry.module}-${entry.id}`}>
            <Link
              href={entry.href}
              className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <span className="text-amber-400">★</span>
              <span className="truncate">{entry.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed'

export function RecentlyViewed() {
  const { last3 } = useRecentlyViewed()

  if (last3.length === 0) return null

  return (
    <div className="px-3 py-2">
      <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
        Recenti
      </p>
      <ul className="flex flex-col gap-0.5">
        {last3.map((entry) => (
          <li key={`${entry.module}-${entry.id}`}>
            <Link
              href={entry.href}
              className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <span className="truncate">{entry.label}</span>
              <span className="ml-auto shrink-0 text-[10px] text-neutral-400">{entry.module}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

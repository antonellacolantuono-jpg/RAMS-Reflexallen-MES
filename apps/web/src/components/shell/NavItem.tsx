'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type * as React from 'react'
import { cn } from '@mes/ui'

interface NavItemProps {
  href: string
  /** Emoji string (existing entries) OR a ReactNode (lucide-react icon component). */
  icon: string | React.ReactNode
  label: string
  count?: number
}

export function NavItem({ href, icon, label, count }: NavItemProps) {
  const pathname = usePathname()
  // Exact match for the root '/' entry — otherwise '/items', '/tools', etc.
  // would all be flagged active under the root prefix.
  const active =
    href === '/'
      ? pathname === '/'
      : pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded text-[12.5px] transition-colors',
        active
          ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] font-medium'
          : 'text-[var(--ink-2)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)]',
      )}
    >
      <span className="w-4 flex items-center justify-center text-[13px]">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && (
        <span className="text-[10.5px] text-[var(--ink-3)] tabular">{count}</span>
      )}
    </Link>
  )
}

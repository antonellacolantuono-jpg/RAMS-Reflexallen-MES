'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@mes/ui'

interface NavItemProps {
  href: string
  icon: string
  label: string
  count?: number
}

export function NavItem({ href, icon, label, count }: NavItemProps) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + '/')

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
      <span className="w-4 text-center text-[13px]">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && (
        <span className="text-[10.5px] text-[var(--ink-3)] tabular">{count}</span>
      )}
    </Link>
  )
}

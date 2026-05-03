import Link from 'next/link'
import { BarChart3 } from 'lucide-react'
import { NavItem } from './NavItem'
import { RecentlyViewed } from './RecentlyViewed'
import { FavoritesBar } from './FavoritesBar'

const REGISTRY_NAV = [
  { href: '/items',              icon: '📦', label: 'Articoli' },
  { href: '/bom',                icon: '🔩', label: 'Distinte base' },
  { href: '/equipment',          icon: '🏭', label: 'Gerarchia impianti' },
  { href: '/workstations',       icon: '⚙️',  label: 'Postazioni' },
  { href: '/recipes',            icon: '📋', label: 'Ricette' },
  { href: '/skills',             icon: '🎓', label: 'Competenze' },
  { href: '/operators',          icon: '👷', label: 'Operatori' },
  { href: '/cause-codes',        icon: '⚠️',  label: 'Codici causa' },
  { href: '/attention-points',   icon: '🔔', label: 'Punti attenzione' },
  { href: '/tools',              icon: '🔧', label: 'Attrezzatura' },
  { href: '/maintenance-orders', icon: '🛠️',  label: 'Manutenzioni' },
  { href: '/box-types',          icon: '📫', label: 'Tipi imballo' },
  { href: '/boxes',              icon: '📮', label: 'Imballi' },
  { href: '/auto-gen-rules',     icon: '🤖', label: 'Regole auto-gen' },
  { href: '/workflows',          icon: '🔀', label: 'Flussi di lavoro' },
]

export function Sidebar() {
  return (
    <aside className="w-56 flex-shrink-0 bg-[var(--paper-2)] hairline-r flex flex-col h-full">
      <div className="h-12 hairline-b flex items-center px-4 gap-2">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/rams-light.svg" alt="RAMS" className="h-6" />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        <div className="uppercase-label px-2 py-1 mt-1 mb-0.5">Panoramica</div>
        <NavItem href="/" icon={<BarChart3 className="w-3.5 h-3.5" />} label="Dashboard" />

        <div className="uppercase-label px-2 py-1 mt-3 mb-0.5">Anagrafiche</div>
        {REGISTRY_NAV.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}

        <div className="uppercase-label px-2 py-1 mt-3 mb-0.5">Sistema</div>
        <NavItem href="/trash" icon="🗑️" label="Cestino" />
      </nav>

      <div className="hairline-t">
        <FavoritesBar />
        <RecentlyViewed />
      </div>

      <div className="hairline-t p-3 flex items-center gap-2 text-[11px] text-[var(--ink-3)]">
        <span>Reflexallen MES v1.2</span>
      </div>
    </aside>
  )
}

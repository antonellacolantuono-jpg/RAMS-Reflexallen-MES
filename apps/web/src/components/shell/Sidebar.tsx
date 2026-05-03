import Link from 'next/link'
import {
  AlertTriangle,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Cog,
  Factory,
  GitBranch,
  HardHat,
  Layers,
  MonitorSmartphone,
  Package,
  Package2,
  PackageOpen,
  Trash2,
  User,
  Wrench,
} from 'lucide-react'
import { NavItem } from './NavItem'
import { RecentlyViewed } from './RecentlyViewed'
import { FavoritesBar } from './FavoritesBar'

const ICON_CLS = 'w-3.5 h-3.5'

const REGISTRY_NAV = [
  { href: '/items',              icon: <Package className={ICON_CLS} />,            label: 'Articoli' },
  { href: '/bom',                icon: <Layers className={ICON_CLS} />,             label: 'Distinte base' },
  { href: '/equipment',          icon: <Factory className={ICON_CLS} />,            label: 'Gerarchia impianti' },
  { href: '/workstations',       icon: <MonitorSmartphone className={ICON_CLS} />,  label: 'Postazioni' },
  { href: '/recipes',            icon: <BookOpen className={ICON_CLS} />,           label: 'Ricette' },
  { href: '/skills',             icon: <Award className={ICON_CLS} />,              label: 'Competenze' },
  { href: '/operators',          icon: <User className={ICON_CLS} />,               label: 'Operatori' },
  { href: '/cause-codes',        icon: <AlertTriangle className={ICON_CLS} />,      label: 'Codici causa' },
  { href: '/attention-points',   icon: <Bell className={ICON_CLS} />,               label: 'Punti attenzione' },
  { href: '/tools',              icon: <Wrench className={ICON_CLS} />,             label: 'Attrezzatura' },
  { href: '/maintenance-orders', icon: <HardHat className={ICON_CLS} />,            label: 'Manutenzioni' },
  { href: '/box-types',          icon: <PackageOpen className={ICON_CLS} />,        label: 'Tipi imballo' },
  { href: '/boxes',              icon: <Package2 className={ICON_CLS} />,           label: 'Imballi' },
  { href: '/auto-gen-rules',     icon: <Cog className={ICON_CLS} />,                label: 'Regole auto-gen' },
  { href: '/workflows',          icon: <GitBranch className={ICON_CLS} />,          label: 'Flussi di lavoro' },
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
        <NavItem href="/" icon={<BarChart3 className={ICON_CLS} />} label="Dashboard" />

        <div className="uppercase-label px-2 py-1 mt-3 mb-0.5">Anagrafiche</div>
        {REGISTRY_NAV.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}

        <div className="uppercase-label px-2 py-1 mt-3 mb-0.5">Sistema</div>
        <NavItem href="/trash" icon={<Trash2 className={ICON_CLS} />} label="Cestino" />
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

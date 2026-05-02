# PROMPT_DS_LIFT — Allineamento `@mes/ui` al Design System handoff

> **Versione**: 1.0 — **Creato**: 02/05/2026
> **Spec compliance**: v1.2
> **Repo HEAD ref**: `c8f2284` (PROMPT_3b_FULL Session B chiuso)
> **Effort budget**: 18-24h Claude Code, spezzato in D1-D6
> **Test count delta target**: +25 tests (da 473 a ≥498)
> **Output principale**: 14+ pattern del Design System portati in `@mes/ui` come componenti TS riutilizzabili

---

## Contesto

Il bundle handoff in `docs/design-handoff/` contiene il source JSX dei pattern Design System che mancano nel package `@mes/ui` e che sono **prerequisito** per i prossimi PROMPT (P6 Andon + Plant Overview, P7 Registry detail + WO BO, P3c Live Preview, e tutto F2/F3). Senza questo lift, ogni PROMPT successivo dovrebbe reinventare gli stessi pattern, con drift visivo certo.

I componenti vengono **portati**, non copiati: il bundle è prototype HTML/CSS/JS in browser, qui produciamo TS proper con props tipizzate, accessibility checks dove rilevanti, integrazione con il design token system esistente (`apps/web/tailwind.config.ts` già mappa CSS vars), e usage di `lucide-react` invece di Icon-paths inline.

Foundation già allineata (verificata 02/05): Avenir Next Cyr fonts (5 weights) presenti in `apps/web/public/fonts/`, OKLCH tokens già in tailwind config, primitive base in `@mes/ui` (Button, Badge, Card, etc.) coerenti col bundle.

---

## Pre-flight check

Prima di iniziare D1:

1. Conferma `docs/design-handoff/` esiste e contiene `source/primitives.jsx`, `source/design-system-views.jsx`, `source/design-system-tables.jsx`, `source/design-system-dashboard.jsx`, `source/design-system-detail.jsx`, `source/styles/tokens.css`. Se non c'è, blocca e chiedi all'utente di estrarre il bundle.
2. Leggi `docs/design-handoff/README.md` per orientarti.
3. Esegui `pnpm install && pnpm build && pnpm test` da clean: deve essere green a 473 tests / build 12/12.
4. Ispeziona `packages/ui/src/index.ts` (export attuali) e `packages/ui/src/components/` (struttura).

---

## D1 — Foundation primitives mancanti (~3h)

**Goal**: aggiungere i 4 primitivi base del bundle che oggi non esistono in `@mes/ui`: Drawer, Modal, ToastProvider, PriorityBadge.

**Reference**: `docs/design-handoff/source/primitives.jsx` (intero file, ~304 righe — Drawer ~righe 200-250, Modal ~righe 250-280, ToastProvider ~righe 280-304, PriorityBadge cerca per nome)

**Tasks**:

1. **PriorityBadge** — `packages/ui/src/components/priority-badge.tsx`
   - Props: `{ priority: 'low' | 'normal' | 'high' | 'urgent' }`
   - Mapping: low→neutral, normal→info, high→warn, urgent→bad (usa StatusBadge tone esistente)
   - Label IT: "Bassa", "Normale", "Alta", "Urgente"
   - 1 unit test per ogni livello (4 tests)

2. **Drawer** — `packages/ui/src/components/drawer.tsx`
   - Props: `{ open: boolean; onClose: () => void; title: string; subtitle?: string; width?: number; actions?: ReactNode; children: ReactNode }`
   - Default width: 720px; min 320, max 100vw
   - Side: dx (default), focus trap, ESC chiude, click backdrop chiude
   - Animation: slide-in-right 200ms (rispetta `prefers-reduced-motion`)
   - 3 unit tests: open/close, ESC handler, backdrop click

3. **Modal** — `packages/ui/src/components/modal.tsx`
   - Props: `{ open: boolean; onClose: () => void; title: string; children: ReactNode; actions?: ReactNode; width?: number }`
   - Default width: 480px, center stage
   - ESC + backdrop, focus trap, scroll lock body
   - 3 unit tests

4. **ToastProvider + useToast hook** — `packages/ui/src/components/toast.tsx`
   - Provider in tree (wrappa l'app), context per push/dismiss
   - API: `useToast()` ritorna `{ toast: (msg, options?) => void }`
   - Options: `{ tone?: 'ok'|'warn'|'bad'|'info'|'neutral'; duration?: ms (default 4000) }`
   - Render top-right stack, max 3 visibili
   - 3 unit tests: push, auto-dismiss, manual dismiss

**Modifiche**:
- `packages/ui/src/index.ts`: aggiungi export per i 4 nuovi componenti
- `packages/ui/package.json`: nessuna nuova dep (usa `react` esistente)

**Verification D1**:
- `pnpm --filter @mes/ui test`: +13 tests (4 PriorityBadge + 3 Drawer + 3 Modal + 3 Toast)
- `pnpm build`: 12/12
- `pnpm lint`: 0 nuovi warning

**Commit**: `feat(ui): foundation primitives — Drawer, Modal, Toast, PriorityBadge (PROMPT_DS_LIFT D1)`

---

## D2 — View primitives (~3-4h)

**Goal**: aggiungere i pattern di view: TreeNode (per Equipment Hierarchy), EmptyState (per registry vuoti), ViewSwitcher (toggle list/card/flow/gantt), SplitView shell (tree + detail layout).

**Reference**: 
- `docs/design-handoff/source/design-system-views.jsx:76-95` per `ViewSwitcher`
- `:144-180` per `TreeNode`
- `:216-265` per `EmptyState` + `EmptyIllust`
- `:299-340` per `SplitViewSection`

**Tasks**:

1. **ViewSwitcher** — `packages/ui/src/components/view-switcher.tsx`
   - Props: `{ value: 'list' | 'card' | 'flow' | 'gantt' | 'calendar'; onChange: (v) => void; views: Array<'list'|'card'|'flow'|'gantt'|'calendar'> }`
   - Render: pill toggle con icon-only + tooltip su hover
   - Icone via `lucide-react`: List, LayoutGrid, GitBranch, Calendar, BarChart3
   - 2 unit tests

2. **TreeNode** — `packages/ui/src/components/tree-node.tsx`
   - Props: `{ icon?: LucideIcon; label: string; sub?: string; expanded?: boolean; hasChildren?: boolean; depth?: number; selected?: boolean; metric?: { value: number; tone?: 'ok'|'warn'|'bad' }; status?: 'ok'|'warn'|'bad'|'neutral'; match?: string; onToggle?: () => void; onClick?: () => void }`
   - Indent: 16px per depth
   - Caret: ChevronRight (collapsed) / ChevronDown (expanded), solo se hasChildren
   - Match highlight: wrap substring match in `<mark className="bg-warn-soft">`
   - Mini progress bar inline se `metric` presente
   - Status dot a destra se `status` presente
   - 4 unit tests: indent, caret toggle, match highlight, selected state

3. **EmptyState** — `packages/ui/src/components/empty-state.tsx`
   - Props: `{ kind?: 'select' | 'no-data' | 'no-results' | 'error'; title: string; body?: string; cta?: { label: string; onClick: () => void }; compact?: boolean }`
   - 4 illustration SVG inline (`EmptyIllust`) — copia path dalle righe `:216-265` del bundle, conserva proporzioni
   - 3 unit tests: per kind, con/senza CTA

4. **SplitView** — `packages/ui/src/components/split-view.tsx`
   - Props: `{ tree: ReactNode; detail: ReactNode; treeWidth?: number; minTreeWidth?: number; maxTreeWidth?: number }`
   - Layout: tree fissa 240-280px (default 260), detail flex
   - Resize handle hover-only, min 200, max 420
   - Mobile: <800px collapsa tree (state interno)
   - URL hash sync per selezione: hook helper `useSplitViewSelection(key)` che legge/scrive `window.location.hash` (`#${key}-${id}`)
   - 3 unit tests: resize bound, mobile collapse, hash sync

**Modifiche**:
- `packages/ui/src/index.ts`: 4 nuovi export

**Verification D2**:
- Test count delta: +12 (cumul +25)
- Build/lint green

**Commit**: `feat(ui): view primitives — TreeNode, EmptyState, ViewSwitcher, SplitView (PROMPT_DS_LIFT D2)`

---

## D3 — Operational Table v0.7 suite (~5-6h, increment più complesso)

**Goal**: portare l'intero pattern Operational Table v0.7 e refactorizzare il `RegistryListPage` esistente affinché lo usi. Questo chiude il gap principale §4 dell'audit per tutti i registry.

**Reference**: `docs/design-handoff/source/design-system-tables.jsx` intero file, in particolare:
- `:47-60` Check (3-state checkbox)
- `:62-74` SortIcon
- `:75-88` FilterChip
- `:89-120` SavedViews
- `:121-145` FilterBar
- `:146-165` BulkBar
- `:166-200` RowMenu
- `:200-208` SAMPLE_ROWS
- `:209+` `OperationalTableSection` (composizione completa)

**Tasks**:

1. **Sub-componenti (ognuno suo file)** — `packages/ui/src/components/op-table/`
   - `check.tsx` — `Check` 3-state (off/mixed/on), props `{ state, onClick }`
   - `sort-icon.tsx` — `SortIcon` con dir + idx, mostra index numerico se multi-sort
   - `filter-chip.tsx` — `FilterChip` props `{ field; op; value; onRemove }`, render "field op value ×"
   - `saved-views.tsx` — `SavedViews` tabs con count badge, props `{ views: Array<{id; label; count?; dot?}>; value; onChange }`
   - `filter-bar.tsx` — `FilterBar` integra search + filter chips + "+ Add filter" + "Clear all"
   - `bulk-bar.tsx` — `BulkBar` strip flottante che appare su selection, props `{ count; onClear; actions: Array<{label; icon?; onClick; tone?}> }`
   - `row-menu.tsx` — `RowMenu` kebab `…` dropdown contestuale per riga
   - 2 tests per componente = 14 tests

2. **OperationalTable composer** — `packages/ui/src/components/op-table/operational-table.tsx`
   - Props (riprendi struttura `<OpTable>` dal bundle):
     ```
     {
       rows: T[];
       columns: Array<{ id; label; w?; num?; sortable?; render?: (row) => ReactNode }>;
       views?: Array<{ id; label; count?; dot? }>;
       activeView?: string;
       onViewChange?;
       rowActions?: Array<{ id; label; icon?; kbd?; tone? }>;
       bulkActions?: Array<'release'|'hold'|'assign'|'export'|'cancel' | { id; label; icon?; tone? }>;
       aggregates?: { [columnId: string]: 'sum' | 'avg' | 'count' };
       searchPlaceholder?: string;
       onRowClick?: (row) => void;
       loading?;
       totalCount?;
       page?; onPageChange?;
     }
     ```
   - Internal state: selection set, sort (multi-shift), filters
   - Footer aggregate sticky 24px tall
   - Status bar bottom con pagination + sort summary + "Last refresh HH:MM:SS"
   - Inline progress 3px (height) per columns con `num: true` e render custom
   - 6 integration tests: select all, multi-sort shift, filter chip add/remove, bulk action, aggregate, pagination

3. **Refactor RegistryListPage** — `apps/web/src/components/registry/RegistryListPage.tsx`
   - Manten retrocompatibilità props attuali (title, subtitle, moduleKey, client, columns, newHref, extraFilters)
   - Aggiungi nuove props OPZIONALI: `views?`, `bulkActions?`, `aggregates?`
   - Internamente usa `OperationalTable` invece di `DataTable + SearchBar + BulkActionBar` cablati a mano
   - **NON rompere** chiamate esistenti da `apps/web/src/app/(registries)/*/page.tsx`: tutte le 14 list page devono continuare a funzionare invariate (smoke check `pnpm dev`)

4. **Smoke test app**: dopo refactor, naviga manualmente le 14 list page in dev mode + verifica:
   - Articoli (items) carica e mostra dati
   - Operatori carica
   - Equipment carica
   - Workflows carica
   - I 11 con detail = 404 continuano a 404 (P7 chiuderà quelli)

**Modifiche**:
- `packages/ui/src/index.ts`: export `OperationalTable` + sub-componenti (export named, no default)

**Verification D3**:
- Test count delta: +20 (cumul +45)
- Build/lint green
- `pnpm dev` smoke: 14 registry list pages render senza errori console

**Commit**: `feat(ui): Operational Table v0.7 suite + RegistryListPage refactor (PROMPT_DS_LIFT D3)`

---

## D4 — Card primitives (~3-4h)

**Goal**: aggiungere i pattern card per Andon Dashboard, Plant Overview, registry card grid view.

**Reference**:
- `docs/design-handoff/source/design-system-views.jsx:341-407` per `RegistryTile` + `CardGridSection`
- `docs/design-handoff/source/design-system-dashboard.jsx:54-256` per `KpiHero`, `PhaseChip`, `WCCard`, `AlertBanner`

**Tasks**:

1. **RegistryTile** — `packages/ui/src/components/registry-tile.tsx`
   - Props: `{ code: string; title: string; sub?: string; status?: StatusBadgeStatus; kpi?: string|number; kpiLabel?: string; photo?: string }`
   - Layout: photo top (placeholder se assente, deterministic-color background), code monospace small, title medium, sub ink-3, KPI bottom-right grande
   - Densità via `data-density` parent: compact 6-col, balanced 4-col, spacious 3-col (rispetta tokens.css density vars)
   - 3 tests

2. **KpiHero** — `packages/ui/src/components/kpi-hero.tsx`
   - Props: `{ label: string; value: string|number; unit?: string; sub?: string; trend?: 'up'|'down'|'flat'; tone?: 'ok'|'warn'|'bad'|'info'|'accent'|'neutral'; big?: boolean; ok?: boolean }`
   - Render: label small caps top, value enorme (text-6xl con `big`, text-5xl default), unit subscript, sub ink-3 below
   - Trend arrow icon se trend presente, colored per tone
   - 4 tests (varianti tone, big, trend)

3. **PhaseChip** — `packages/ui/src/components/phase-chip.tsx`
   - Props: `{ label: string; phase: 'inbound'|'setup'|'production'|'qc'|'outbound'|'teardown'; active?: boolean; done?: boolean }`
   - Render: pill 3 stati: pending (greyed), active (filled coloured ink), done (greyed + check)
   - Phase color from `var(--c-${phase})`
   - 6 tests (3 stati × 2 con/senza done)

4. **WCCard** — `packages/ui/src/components/wc-card.tsx` (Work Center Card per Andon)
   - Props: `{ code: string; name: string; wo?: string; q?: { current: number; target: number }; pct?: number; oee?: number; status?: 'ok'|'warn'|'bad'|'idle'; op?: string }`
   - Compact card per Andon grid: code mono top, name medium, WO + qty + OEE inline
   - Border-left 3px colore status
   - 3 tests

5. **AlertBanner** — `packages/ui/src/components/alert-banner.tsx`
   - Props: `{ tone: 'ok'|'warn'|'bad'|'info'; kicker?: string; title: string; body?: string; cta?: { label; onClick } }`
   - Render: border-left 4px tone, kicker tone-ink small caps, title bold, body normal, CTA button-link inline
   - 4 tests (per tone)

6. **LiveAlert** — `packages/ui/src/components/live-alert.tsx`
   - Props: `{ tone: 'ok'|'warn'|'bad'|'info'; message: string; time: string }`
   - Compact row alert per Andon issue feed: icon + message + time relativo
   - Pulse animation se nuovo (props `isNew?`), rispetta prefers-reduced-motion
   - 2 tests

**Modifiche**:
- `packages/ui/src/index.ts`: 6 nuovi export

**Verification D4**:
- Test count delta: +22 (cumul +67)
- Build/lint green

**Commit**: `feat(ui): card primitives — RegistryTile, KpiHero, PhaseChip, WCCard, AlertBanner, LiveAlert (PROMPT_DS_LIFT D4)`

---

## D5 — Detail page primitives (~3-4h)

**Goal**: aggiungere i pattern detail page (per WO Detail BO + future entity detail), e l'AuditTrail UI viewer (gap §16.2 dell'audit).

**Reference**: `docs/design-handoff/source/design-system-detail.jsx` intero file:
- `:39-149` `DetailHeaderSection`
- `:150-356` `DetailBodySection`
- `:357-513` `AuditTrailSection`
- `:514+` `TabStatesSection`

**Tasks**:

1. **DetailHeader** — `packages/ui/src/components/detail-header.tsx`
   - Props: `{ breadcrumb?: ReactNode; title: string; code?: string; statusBadge?: ReactNode; priorityBadge?: ReactNode; subtitle?: string; actions?: ReactNode }`
   - Layout: breadcrumb small ink-3 top, title row con badges inline, subtitle ink-3, actions destra
   - 3 tests

2. **DetailBody** — `packages/ui/src/components/detail-body.tsx`
   - Props: `{ main: ReactNode; sidebar?: ReactNode; sidebarWidth?: number }`
   - Layout 2-col: main flex, sidebar fissa 320px (default), gap 24
   - Mobile: stacked
   - 2 tests

3. **AuditTimeline** — `packages/ui/src/components/audit-timeline.tsx`
   - Props: `{ entries: Array<{ id; at: Date; actor: string; action: string; entity?: string; diff?: { field; before; after }[]; tone?: 'ok'|'warn'|'bad'|'info'|'neutral' }> }`
   - Render: vertical timeline, dot tone-coloured + line, per entry: time + actor + action + diff inline (espanddibile)
   - Diff format: `field: before → after` con strikethrough su before
   - 5 tests: empty, single, multiple, with diff, expand/collapse

4. **Estensione `Tabs` esistente** — `packages/ui/src/components/tabs.tsx`
   - Aggiungi prop `tabs[].count?: number` (mostra count badge inline tipo "Materials 6 · Execution 168")
   - Aggiungi prop `tabs[].dot?: 'ok'|'warn'|'bad'` (status dot prima del label)
   - Aggiungi prop `tabs[].kbd?: string` (keyboard hint piccolo a destra)
   - Backward-compat: tabs senza queste props renderizzano come prima
   - 4 tests delta

**Modifiche**:
- `packages/ui/src/index.ts`: 3 nuovi export, aggiorna types Tabs

**Verification D5**:
- Test count delta: +14 (cumul +81)
- Build/lint green

**Commit**: `feat(ui): detail patterns — DetailHeader, DetailBody, AuditTimeline + Tabs extensions (PROMPT_DS_LIFT D5)`

---

## D6 — Plant Map + Canvas suite + Showcase + verification (~3-4h)

**Goal**: portare i pattern visivi specifici (Plant Map per Andon/Plant Overview, Canvas suite per Workflow Editor lift), estendere la showcase page esistente per documentare tutti i nuovi componenti, e chiudere i gates.

**Reference**:
- `docs/design-handoff/source/design-system-views.jsx:771-846` per `PlantNode` + `PlantMapRecipe`
- `:409-619` per Canvas suite (CanvasGrid, ZoomControls, Minimap, CanvasToolbar, CanvasStateBar, GenericNode, Edge, ArrowDefs)

**Tasks**:

1. **PlantNode + PlantMap** — `packages/ui/src/components/plant-map/`
   - `plant-node.tsx`: card SVG con `{ x; y; code; name; status: 'ok'|'warn'|'bad'|'idle'; kpi?: string; selected?; onClick? }` — renderizza dentro `<svg>` parent
   - `plant-map.tsx`: container con `{ background?: string (URL SVG/PNG floor plan); width: number; height: number; nodes: Array<PlantNodeProps>; zones?: Array<{ x; y; w; h; label; phase }>; onNodeClick?: (node) => void }`
   - Pulse animation su node status flip (rispetta prefers-reduced-motion)
   - 4 tests

2. **Canvas suite** — `packages/ui/src/components/canvas/`
   - `canvas-grid.tsx`: SVG grid 64px square background pattern
   - `zoom-controls.tsx`: floating bottom-right `+ / − / fit / 90%` buttons
   - `minimap.tsx`: viewport-locked thumbnail bottom-right
   - `canvas-toolbar.tsx`: top-left toolbar `{ tools: Array<{ id; icon; label; active? }> }`
   - `canvas-state-bar.tsx`: bottom strip con state info
   - `generic-node.tsx`: `{ x; y; w?; icon?; kicker?; title; sub?; status?; selected?; invalid?; ports?: Array<'in'|'out'> }`
   - `edge.tsx`: `{ from; to; kind?: 'bezier'|'step'; label?; animated?; tone? }`
   - `arrow-defs.tsx`: shared `<defs>` per markers freccia
   - **Nota integrazione**: il workflow editor attuale usa React Flow (`@xyflow/react`). Questi sono componenti per pattern **standalone** (es. dashboard mini-flow), NON sostituiscono React Flow nel workflow editor principale. La sostituzione è scope di P3c, non di questo PROMPT.
   - 6 tests totali (1 base per componente)

3. **Estensione Showcase page** — `apps/web/src/app/page.tsx`
   - Mantieni i 3 tab attuali (Components, Colors, Typography)
   - Aggiungi 3 nuovi tab: **Patterns**, **Detail**, **Dashboard**
   - **Patterns tab**: sezioni TreeNode, EmptyState, ViewSwitcher, SplitView demo, RegistryTile card grid
   - **Detail tab**: DetailHeader live preview, DetailBody layout, AuditTimeline con 5 mock entries, Tabs estensioni
   - **Dashboard tab**: KpiHero (4 varianti), PhaseChip 6-fasi bar, WCCard grid, AlertBanner 4 toni, LiveAlert feed
   - **Components tab esteso**: aggiungi sezioni Drawer, Modal, Toast, PriorityBadge
   - Per ogni nuova sezione: live preview + (optional) snippet codice
   - Lazy import dove sensato per perf

4. **Operational Table demo** — aggiungi a Patterns tab
   - Esempio con 6 sample rows tipo `SAMPLE_ROWS` del bundle (`design-system-tables.jsx:200-208`)
   - 3 saved views, 2 filter chips iniziali, bulk actions disponibili
   - Footer aggregate `Σ qty / AVG value`

5. **Plant Map demo** — aggiungi a Dashboard tab
   - 5-6 PlantNode posizionati su grid 64px, 1 zone `TEST & COLLAUDO` overlay
   - Mostra interazione click → log node info

**Modifiche**:
- `packages/ui/src/index.ts`: export PlantMap + Canvas suite
- `apps/web/src/app/page.tsx`: estensione showcase

6. **Verification gates finale**:
   ```bash
   pnpm install                 # clean
   pnpm build                   # 12/12 successful
   pnpm lint                    # zero new warnings
   pnpm test                    # 498+ tests (delta +25 minimum, target +81 ideal)
   pnpm dev                     # smoke: home / showcase tab navigation, /work-orders 404 ok, /items list rendering
   ```

7. **STATUS.md update**: aggiungi sezione `PROMPT_DS_LIFT — 100% complete` con breakdown D1-D6, test delta, commit refs.

8. **TODO.md**: chiudi TODO relativi al gap §4 audit:
   - TODO-NNN: "Operational Table v0.7 lift" → done
   - TODO-NNN: "Drawer/Modal/Toast in @mes/ui" → done
   - TODO-NNN: "AuditTrail UI viewer (§16.2)" → primitive done, integrazione con backend in P7
   - TODO-NNN: "Plant Map primitives" → primitives done, integrazione in P6

**Commit finale**: `feat(ui): Plant Map + Canvas + Showcase extension (PROMPT_DS_LIFT D6, 100% complete)`

---

## Recap delivery

| Increment | Componenti aggiunti | Tests delta | Cumul |
|---|---|---|---|
| D1 | Drawer, Modal, ToastProvider, PriorityBadge | +13 | 486 |
| D2 | TreeNode, EmptyState, ViewSwitcher, SplitView | +12 | 498 |
| D3 | OperationalTable suite (8 sub-comp + composer) + RegistryListPage refactor | +20 | 518 |
| D4 | RegistryTile, KpiHero, PhaseChip, WCCard, AlertBanner, LiveAlert | +22 | 540 |
| D5 | DetailHeader, DetailBody, AuditTimeline, Tabs extensions | +14 | 554 |
| D6 | PlantMap, Canvas suite (8 sub-comp), Showcase extension | +6 | 560 |
| | **Totale: ~30 componenti, +87 tests** | | |

Numero target tests è conservativo: ≥498 (cioè +25). Il delta ideale è +87. Se per vincoli di tempo qualche sub-componente è scaffolding (es. SplitView resize handle), accettabile, basta aprire un TODO.

---

## Anti-pattern da evitare

- **Non copiare letteralmente** dal bundle: il bundle è prototype JS, qui produciamo TS proper con types.
- **Non importare Tailwind CDN**: già configurato compile-time, classi disponibili.
- **Non usare Babel-standalone**: TS transpila al build.
- **Non duplicare CSS vars**: già in `tailwind.config.ts` come var(--paper) etc.
- **Non duplicare font-face**: già caricati in `apps/web/src/app/layout.tsx` o globals.css.
- **Non rompere RegistryListPage callers**: 14 chiamate attuali devono continuare a funzionare invariate.
- **Non spostare HMI**: `apps/hmi` ha la sua app separata, non toccare in questo PROMPT.
- **Non fare i18n qui**: stringhe in italiano hardcoded acceptable, i18n è F1.5 separato.
- **Non sostituire React Flow nel Workflow Editor**: il Canvas suite è per pattern standalone, P3c è il PROMPT per Live Preview.

---

## Riferimento incrociato gap audit

PROMPT_DS_LIFT chiude integralmente:
- §4 Gap Design System voci 1-9 (Operational Table, Split View, Tree Node, RegistryTile, PhaseChip, Plant Map, Tabs ricchi)
- §16.2 audit Audit Trail UI (primitive AuditTimeline, integrazione backend in P7)
- Asse UI 19 schermate: prerequisito per chiudere screen 01 (Plant Overview, P6), 02-03 (WO BO, P7), 06-10 (registries con detail, P7), 19 (Andon, P6)

PROMPT_DS_LIFT NON chiude (fuori scope, dovuto a F1/F2/F3):
- WO Detail rich completo (P7 + P9)
- Skills Matrix (P13)
- Live Preview State-Driven (P3c)
- Scheduling/Equipment/Industrial Ops/CFRP/Safety (F2/F3)

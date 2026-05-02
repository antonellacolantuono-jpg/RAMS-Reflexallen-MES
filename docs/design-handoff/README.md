# Design Handoff — Reference per Claude Code

> **Origine**: bundle esportato da Claude Design (claude.ai/design) il 02/05/2026.
> **Cosa è**: source JSX/CSS dei 19 mockup MES Suite + intero Design System.
> **Cosa NON è**: codice di produzione. È un prototipo HTML/CSS/JS in browser (React UMD + Babel-standalone + Tailwind CDN). Va **portato** a TS/Next.js/Tailwind compilato del nostro repo, **non copiato letteralmente**.

---

## Come usarlo

Per ogni PROMPT che tocca UI, **i file qui sotto sono il riferimento autoritativo** del visual design. Quando il PROMPT dice "vedi `docs/design-handoff/source/<file>:<linea>`", apri quel file, leggi la composizione JSX, e portala nel nostro stack:

| Bundle (qui) | Target (nostro repo) |
|---|---|
| Tailwind via CDN `cdn.tailwindcss.com/3.4.16` | Tailwind compile-time già configurato in `apps/web/tailwind.config.ts` (CSS vars già mappate) |
| React UMD + Babel-standalone | React 18 importato + TS compilation |
| Inline JSX in `<script type="text/babel">` | Componenti TS in `packages/ui/src/components/` |
| `styles/tokens.css` con CSS vars OKLCH | **Già allineate** in `apps/web/src/app/globals.css` (verificato 02/05) |
| Font Avenir Next Cyr da `assets/fonts/` | **Già presenti** in `apps/web/public/fonts/` (file identici) |
| `Icon` con SVG path inline | Sostituire con `lucide-react` (già in dep) — match nome icona |

**Regola**: il bundle è IL SOURCE DI VERITÀ visiva. Se diverge da `apps/web/src/app/page.tsx` showcase attuale, ha ragione il bundle. Se diverge dai PDF Design System Print, ha ragione il bundle (i PDF sono export rendering).

---

## Mappa file → cosa ci trovi dentro

### Primitivi base

**`source/primitives.jsx`** (304 righe) — componenti foundation
- `Icon` (~60 path SVG inline), `Btn`, `Badge`, `StatusBadge`, **`PriorityBadge`** ⭐ nuovo, `Progress`, `KPI`, `Tabs`, `Field`, `Input`, `Select`, `Card`
- **`Drawer`** ⭐ nuovo (~80 righe, slide-in pannello dx)
- **`Modal`** ⭐ nuovo (overlay center)
- **`ToastProvider`** + `ToastCtx` ⭐ nuovo (notification system)

⭐ = non presente in `@mes/ui` attuale, da portare.

### Pattern Design System

**`source/design-system-views.jsx`** (915 righe) — pattern di viste
- riga 76: `ViewSwitcher` (list/card/flow/gantt toggle)
- riga 144: `TreeNode` (hierarchical row con caret + icon + sub-code + mini progress + status dot)
- riga 216-265: `EmptyIllust` + `EmptyState` (illustrazioni SVG no-data)
- riga 299: `SplitViewSection` (tree 240-280 + detail dx)
- riga 341: `RegistryTile` (card con foto + KPI + status badge per card grid)
- riga 409: `CanvasGrid` + `ZoomControls` + `Minimap` + `CanvasToolbar` + `CanvasStateBar` (workflow editor canvas)
- riga 476: `GenericNode` + `Edge` + `ArrowDefs` (nodi/archi React Flow style)
- riga 620: `InspectorSection` (configurator pannello dx)
- riga 697: `WorkflowRecipe` (esempio composizione completa workflow)
- riga 771: `PlantNode` + riga 787: `PlantMapRecipe` ⭐ (Plant Map SVG floor-plan)
- riga 847: `RoutingRecipe`

**`source/design-system-tables.jsx`** (428 righe) — Operational Table v0.7
- riga 47: `Check` (3-state checkbox: off/mixed/on)
- riga 62: `SortIcon` (sortable column indicator con multi-shift index)
- riga 75: `FilterChip` (chip "field op value × remove")
- riga 89: `SavedViews` (tabs con count badge)
- riga 121: `FilterBar` (search + filter chips + add filter)
- riga 146: `BulkBar` (multi-select bulk actions strip)
- riga 166: `RowMenu` (row kebab dropdown)
- riga 209: **`OperationalTableSection`** (composizione completa, target del lift)

**`source/design-system-dashboard.jsx`** (444 righe) — pattern dashboard
- riga 54: `KpiHero` ⭐ (KPI big-number per Andon)
- riga 109: `PhaseChip` (3 stati pending/active/done per phase bar)
- riga 185: `ExecRow` (execution log row)
- riga 229: `WCCard` ⭐ (workstation card per Andon grid)
- riga 283: `AlertBanner` ⭐ (banner severity colored)
- riga 346: `PhaseMixRow`
- riga 381: `LiveAlert` ⭐ (live alert feed item)

**`source/design-system-detail.jsx`** (608 righe) — pattern detail page
- riga 39: `DetailHeaderSection` (header WO/entity con title + badge + actions)
- riga 150: `DetailBodySection` (body layout 2-col entity detail)
- riga 357: **`AuditTrailSection`** ⭐ (audit trail UI viewer — gap §16.2 dell'audit)
- riga 514: `TabStatesSection` (tab variazioni: count, dot, kbd)

### Mockup 19 schermate

**`source/screens-1.jsx`** (298 righe) — Plant Overview + Work Orders List
**`source/screens-2.jsx`** (371 righe) — WO Detail con sub-componenti per i 7 tab
- riga 177: `WorkflowSnapshot`
- riga 220: `MaterialsTab`
- riga 261: `ExecutionTab`
- riga 304: `QualityTab`
- riga 331: `GenealogyTab`
- riga 353: `ActivityTab`

**`source/screens-3-workflow.jsx`** (613 righe) — Workflow Editor 4-pane
- riga 212: `TreeNode` (palette tree)
- riga 232: `PaletteSection`
- riga 249-298: `PhaseBlock` + `GroupBlock`
- riga 300-450: `Inspector` + 4 varianti (Workflow/Phase/Group/Step)
- riga 547: `AutogenDiff` (Live Preview State-Driven — riferimento P3c)
- riga 587: `ValidationResults`

**`source/screens-4-registries.jsx`** (433 righe) — registries varie
- riga 163: `BOMTab`
- riga 207: `InventoryTab`
- riga 262: `EqTreeNode` + riga 294: `EqDetail` (Equipment Hierarchy split-view)

**`source/screens-5-hmi.jsx`** (660 righe) — HMI 7 schermate + box ops
- riga 207: `HMIShell` (wrapper standard HMI)
- riga 224: `HMIBigBtn` (touch target 48×48+)
- riga 237: `HMILogin`
- riga 270: `HMIWorkOrders`
- riga 312: `HMIBOMCheck`
- riga 349: `HMIWorkScreen`
- riga 413: `HMIParallel`
- riga 463: `HMIRecovery`
- riga 526: `HMIPacking`

**`source/screens-6-misc.jsx`** (193 righe) — Andon Dashboard + altro
**`source/flowmap.jsx`** (316 righe) — Flow Map screen
**`source/app.jsx`** (224 righe) — composizione root mockup (router stati + nav)

### CSS / Asset

- `source/styles/tokens.css` — variabili CSS OKLCH (già allineate al nostro repo)
- `source/styles/glass.css` — glass-effect (esperimento, non in MVP)
- `source/assets/brand/` — logo SVG Reflexallen + RAMS

### Entry HTML (riferimento, NON da implementare letteralmente)

- `source/index.html` — entry mockup completo (carica tutti gli screen-*.jsx)
- `source/Design System.html` — entry showcase DS (carica i design-system-*.jsx)

---

## Cosa NON è qui (escluso volutamente)

- `chats/` — transcript chat design (300+ pagine, non rilevanti per implementazione)
- `style-probe-*.jsx`, `*.html` — esperimenti glass/light alternativi non in MVP
- `tweaks-panel.jsx` — pannello live-edit del prototype (non serve in produzione)
- `uploads/` — duplicato dei .md già in `docs/` del repo (MASTER_SPECIFICATION, etc.)
- `export/ds/`, `export/RAMS - *.html` — re-export del bundle stesso
- `*-print.html` — versioni print rendering, già presenti come PDF in Project Knowledge

---

## Versionamento del bundle

Bundle estratto: 02/05/2026 da Claude Design `9QkDS4RHpLfMjt4MPVECrQ`.
Se il design viene modificato in Claude Design, **il bundle qui è obsoleto** finché non re-esporti. Fare `git diff` su questa cartella in caso di nuovo handoff.

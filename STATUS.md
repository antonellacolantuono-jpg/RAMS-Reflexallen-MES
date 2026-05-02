# RAMS-Reflexallen-MES — Project Status

> **Last update**: May 2, 2026 (PROMPT_PNE_1 D1-D4 closed — F1.3 100% complete)
> **Repository**: https://github.com/antonellacolantuono-jpg/RAMS-Reflexallen-MES
> **Stack**: NestJS + Next.js 14 + Prisma SQLite + pnpm Turborepo + shadcn-style + Reflexallen design system

---

## ✅ PROMPT_PNE_1 — Resource Selection complete (Step Configurator) — 100% complete (May 2, 2026)

F1.3 of ROADMAP v2 (Pneumatic First). Fills the AddStepDialog SHELL that PROMPT_3d D2 created with: 6 Resource tabs (Materials/Tools/Devices/Skills/Recipes/Attention Points), Recipe-Device coupling (client-side filter on `recipe.deviceId IN [selectedDeviceIds]`), Action Configuration per step kind/category (8 forms), and the Save flow wired into the existing canvas auto-save pipeline.

### Test count

- **Baseline (post PROMPT_3d D6)**: 619
- **Final**: **637** (api 249 / domain 197 / ui 119 / schemas 29 / cache 8 / queue 5 / storage 6 / **web 24**)
- **Delta**: **+18 tests** (target floor +12 → ≥631, ideal +18 → ≥637; achieved ideal exactly)

### D1-D4 breakdown

| Increment | Scope | Test delta | Cumul | Commit |
|---|---|---|---|---|
| D1 | Resource tabs scaffold (Materials/Tools/Devices) + ResourceList primitive + AddStepDialog state lift | +5 | 624 | `91a15b2` |
| D2 | Skills + Recipes (device-coupled) + Attention Points tabs | +4 | 628 | `0c83c6e` |
| D3 | 8 Action Config forms + ActionConfig switch + 8 Zod schemas + AddStepDialog wire | +5 | 633 | `62033f9` |
| D4 | Save flow with Zod validation + extended store payload + buildSavePayload toolId/recipeId + STATUS / ROADMAP / TODO | +4 | **637** | _this commit_ |

### Architectural decisions (kept after D4)

1. **Session-only persistence for multi-select arrays + per-form Action Config** (TODO-040): single-FK ids (`skillId`, `deviceId`, `recipeId`, `toolId`) bake into `node.data` and persist via the existing `WorkflowStepInputSchema`; multi-select arrays (`materialIds[]`, `attentionPointIds[]`) and the kind-specific `actionConfig` blob live in `node.data` only — lossy on reload. Decision rationale: stays inside § 7 surprise budget (no DB migration); fits 8-12h effort budget; PROMPT_PNE_2 will seed `WF-PNEU-680-V1-DEMO` with all resources pre-wired so the demo path doesn't suffer the lossy contract. Tracked by **TODO-040** for F2 / PROMPT_7 (`Step.config Json?` column + `step_materials` / `step_attention_points` M:N tables).

2. **Two parallel form ecosystems — explicit decision, not technical debt**: the existing 9-form ecosystem in `apps/web/src/components/workflow/forms/*` (ProductionStepForm, QualityControlStepForm, …, PhaseConfigurator, GroupConfigurator) drives the **edit** path via `PropertiesTab` for already-existing steps. The new 8-form ecosystem in `apps/web/src/components/workflow/configurator/action-forms/*` drives the **create** path inside `AddStepDialog` with a single shared `actionConfig` state object. Both ecosystems coexist intentionally; merging them requires backend persistence parity (TODO-040 dependency).

3. **Client-side recipe-device filter (no API extension)**: `Recipe.deviceId` is a single FK; PROMPT_PNE_1 § 3.2's `compatibleDevices` array does not exist in the schema. RecipesTab fetches `sdk.recipes.list({ limit: 200 })` once and filters client-side via `recipes.filter(r => selectedDeviceIds.includes(r.deviceId))`. Mirrors `ProductionStepForm`'s pattern. Backend `?compatibleDeviceIds=` extension deferred to F2 / PROMPT_7 if a recipe set ever exceeds the 200-item paginated cap.

4. **Mixed test strategy continued**: pure logic in `@mes/domain` + presentational primitives in `@mes/ui` covered most of DS_LIFT and PROMPT_3d. PROMPT_PNE_1 land entirely in `apps/web` because the configurator forms are intrinsically tied to TanStack Query + react-hook-form + zustand — not mockable as pure functions. apps/web web test count grew from 6 (post-PROMPT_3d) to **24** (+18 from D1-D4). New test infrastructure: `afterEach(cleanup)` registered in `apps/web/src/test-setup.ts` to fix DOM pollution between tests on Windows + Vitest 2.1.x (auto-cleanup is unreliable in this combo per documented escape hatch).

5. **Backward-compat preserved**: schema unchanged (zero migrations); `buildSavePayload` extended additively to also emit `recipeId` + `toolId` from `node.data` (was missing — latent bug pre-existed D4); `addStepNodeToGroup` now writes `standardTimeSec` (canonical key consumed by `buildSavePayload`) alongside `durationSec` for inspector-form compat — closes the previously-broken duration round-trip from dialog-created steps. Both fixes are additive and do not affect existing seeded test workflows.

### TODOs closed by PROMPT_PNE_1

- **TODO-034** — Add Step full configurator (6 resource tabs Materials/Tools/Devices/Skills/Recipes/AttentionPoints) — done across D1+D2.

### TODOs opened by PROMPT_PNE_1

- **TODO-040** — Multi-select resources (materialIds, attentionPointIds) + kind/category-specific Action Config in AddStepDialog are session-only / lossy on reload. Owner: F2 / PROMPT_7 (registry detail polish + schema migration). Scope: add `Step.config Json?` column + `step_materials` + `step_attention_points` M:N tables, hydrate on GET, persist on save. Estimate 6-10h backend + 2-4h frontend.

### Verification commands (final)

```
pnpm install                        # clean (729 packages, 17.8s)
pnpm --filter @mes/prisma generate  # TODO-031 workaround
pnpm build                          # 12/12 successful (24.5s — most cached)
pnpm lint                           # 3/3 (apps/web clean; pre-existing TODO-002 hmi <img> warnings)
pnpm --filter @mes/web      type-check   # tsc --noEmit clean
pnpm --filter @mes/api      test    # 249/249 pass
pnpm --filter @mes/domain   test    # 197/197 pass
pnpm --filter @mes/ui       test    # 119/119 pass
pnpm --filter @mes/schemas  test    # 29/29 pass
pnpm --filter @mes/cache    test    # 8/8 pass
pnpm --filter @mes/queue    test    # 5/5 pass
pnpm --filter @mes/storage  test    # 6/6 pass
pnpm --filter @mes/web      test    # 24/24 pass (was 6 baseline; +18 from D1-D4)
```

Runtime smoke deferred to user pre-merge per CLAUDE.md PHASE 4. Suggested checks (per ROADMAP § 4.6 `.next` cache reminder):
- `Remove-Item -Recurse -Force apps\web\.next -ErrorAction SilentlyContinue ; pnpm dev`
- Open `/workflows/<wf-test-001-id>`, drag a `manual` step kind onto an existing group.
- Fill name + Manual instructions + open Materials tab, select 2 items + open Tools tab, select 1 tool.
- Save → step appears in canvas, name visible, single-FK fields persist across browser reload (multi-select arrays + actionConfig session-only by design — TODO-040).

---

## ✅ PROMPT_3d — Workflow Editor UX-lift — 100% complete (May 2, 2026)

Refactor of the workflow editor to mockup-faithful layout (F1.2 in ROADMAP v2 Pneumatic First). The editor was the demo-blocking customer-facing surface for Reflex Allen — palette ungated, canvas phase-columns horizontal, inspector 3-tab Properties/Metadata/Audit, dialogs for phase/group/step/validate, Visual/Parallel toggle.

### Test count

- **Baseline (post DS_LIFT)**: 587
- **Final**: **619** (api 249 / domain 197 / ui 119 / schemas 29 / cache 8 / queue 5 / storage 6 / **web 6**)
- **Delta**: **+32 tests** (target floor +18 → ≥605, ideal +24 → ≥611; achieved with +8 buffer over ideal)

### D1-D6 breakdown

| Increment | Scope | Test delta | Cumul | Commit |
|---|---|---|---|---|
| D1 | Palette refactor to ungated STEP CATEGORIES + STEP KINDS; apps/web vitest setup | +5 | 592 | `a388f46` |
| D2 | Drag-drop wiring + AddStepDialog shell + Modal.fullScreen prop | +8 | 600 | `c668dec` |
| D3 | Canvas refactor — horizontal phase columns + DS_LIFT chrome (Toolbar/StateBar/Zoom) | +7 | 607 | `25505b8` |
| D4 | Inspector 3-tab Properties/Metadata/Audit + audit-adapter stub (TODO-033) | +1 | 608 | `7aece39` |
| D5 | AddPhaseDrawer + AddGroupModal + ValidateDrawer + EmptyState success | +4 | 612 | `b52ab67` |
| D5 hotfix | Primary submit button visibility (`bg-accent` token; Drawer flex footer) | +3 | 615 | `89ed752` |
| D6 | Visual/Parallel toggle + ParallelView + WorkflowTopBar + STATUS / ROADMAP / TODO | +4 | **619** | _this commit_ |

### Architectural decisions (kept after D6)

1. **Mixed test strategy** (decided in PHASE 1 of plan): pure logic extracted to `@mes/domain` (palette descriptors, compatibility matrix, layout algorithm, parallel-view selectors, validation issue navigator) + presentational primitives extended in `@mes/ui` (Modal `fullScreen`, EmptyState `success`, Drawer flex footer) covered most of the test budget. apps/web gained a minimal vitest setup (vitest + jsdom + @testing-library) timeboxed at ≤2h — finished within budget and now hosts 6 component smokes. **Apps/web now has new devDeps** (vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom). Contributors must run `pnpm install` after pulling this branch on local Windows, otherwise smoke tests fail with module-not-found (same lesson as DS_LIFT lucide-react episode).

2. **`EmptyState.kind="success"` extension** (D5): added the missing success variant with CheckCircle illust in `var(--ok)` tone. Backward-compatible — pre-existing 4 kinds untouched. Used by ValidateDrawer's "Workflow valido" empty state.

3. **`Modal.fullScreen` prop extension** (D2): additive `fullScreen?: boolean` (default false). When true: `h-screen w-screen rounded-none`, no width style. Used by AddStepDialog. Pre-existing centered behavior unchanged. Tracked in `Modal.test.tsx` regressions.

4. **`Drawer` footer flex layout fix** (D5 hotfix): `@mes/ui` Drawer footer container previously rendered `<div className="border-t … px-5 py-4">` with no flex layout — when callsites passed a Fragment with two buttons (Annulla + primary submit) they did not align right. D5 hotfix harmonized with Modal: `flex justify-end gap-2`. Audited all callsites — fragment / array / single child all compose correctly. Drawer test asserts the layout shape so future regressions are caught.

5. **Custom column layout (not dagre LR)** (D3): the new `layoutPhaseColumns` pure function in `@mes/domain` is deterministic and configurable (column width / gap / header height / step indent). Easier to reason about, easier to test, mockup-aligned. `applyDagreLayout` retained as named export for fallback / Parallel view future expansion.

6. **Dialog primary buttons use `bg-accent` token** (D5 hotfix): apps/web tailwind config defines `accent` / `ok` / `bad` / `warn` / `info` semantic tokens but does NOT define a `primary` color SCALE. Classes like `bg-primary-600` generate zero CSS → invisible buttons. PROMPT_3d's 4 dialogs (AddPhase / AddGroup / AddStep / topbar Aggiungi Fase) use `bg-accent` + `hover:bg-accent-2` (matches `Button.tsx` primary variant). Pre-existing pages with the same antipattern tracked separately as **TODO-039**.

7. **Backward-compat preserved**: schema unchanged (zero migrations); `buildSavePayload` format unchanged; both drag-drop dataTransfer formats (`application/workflow-palette` new, `application/workflow-node` legacy) honored side-by-side; existing 9 step forms + Phase + Group configurators reused verbatim inside `PropertiesTab`.

### TODOs closed by PROMPT_3d

- Workflow editor mockup-fidelity refactor (PROMPT_3d full scope) — done across D1-D6.

### TODOs opened by PROMPT_3d

- **TODO-034** — Add Step full configurator (6 resource tabs) — owned by **PROMPT_PNE_1**.
- **TODO-035** — Parallel view editing (currently read-only) — owned by **F2**.
- **TODO-036** — Decision-step `onOk`/`onNok` schema fields missing — owned by **F2** (or earlier if PNE_2 needs decision branches for recovery flows).
- **TODO-037** — `@mes/ui` CanvasEdge / React Flow EdgeProps API asymmetry — owned by **F2** (recommend Option B = document).
- **TODO-038** — Workflow-root metadata editing (tags + defaultWorkCenters) — owned by **F2 / PROMPT_7** (registry detail polish).
- **TODO-039** — Design token migration (`bg-primary-*` / `bg-success-*` / `text-primary-*` unmapped in apps/web) — owned by **F2 / PROMPT_7**. Recommend extending tailwind config (option A) rather than blanket migration.

### Verification commands (final)

```
pnpm install
pnpm build                              # 12/12 successful
pnpm lint                               # 3/3 (apps/web clean; pre-existing hmi <img> warning per TODO-002)
pnpm --filter @mes/domain test          # 197/197 pass
pnpm --filter @mes/ui     test          # 119/119 pass
pnpm --filter @mes/web    test          # 6/6 pass
pnpm --filter @mes/api    test          # 249/249 pass
pnpm --filter @mes/schemas test         # 29/29 pass
pnpm --filter @mes/cache  test          # 8/8 pass
pnpm --filter @mes/queue  test          # 5/5 pass
pnpm --filter @mes/storage test         # 6/6 pass
```

Runtime smoke deferred to user pre-merge (per CLAUDE.md PHASE 4). End-to-end flow verified on `WF-TEST-001` after D5 hotfix (re-smoke 2026-05-02 confirmed 16 functional points all green: phase create, group create, step drag-drop, AddStepDialog full-screen, reload-persistence, validate drawer, all dialog primaries visible).

---

## ✅ PROMPT_DS_LIFT — 100% complete (May 2, 2026)

Lift the Reflexallen design-handoff bundle (`docs/design-handoff/source/*.jsx`)
into typed @mes/ui primitives. Foundation for F1.2 (PROMPT_6 Andon / Plant
Overview), F1.3 (PROMPT_7 Registry detail + WO Detail BO), F1.4 (PROMPT_3c
Live Preview).

### Test count

- **Baseline**: 473 (Session B commit message — the 385 observed in pre-flight was flaky due to the Windows vitest tmp dir bug `ANTONE~1.COL` dropping 3 @mes/api test files; counted correctly from D1 onward).
- **Final**: **587** tests across 7 packages (api 249, domain 176, schemas 29, cache 8, queue 5, storage 6, **ui 114**).
- **Delta**: **+114 tests** (target was ≥+25 minimum / +87 ideal; achieved with +27 buffer over ideal).

### D1-D6 breakdown

| Increment | Components added | Test delta | Cumul total | Commit |
|---|---|---|---|---|
| D1 | Drawer audit + Modal audit + Toast (full impl from no-op stub) + PriorityBadge | +20 | 493 | `8991925` |
| D2 | TreeNode + EmptyState + ViewSwitcher + SplitView + lucide-react dep | +19 | 512 | `ec1a3fb` |
| D3 | Operational Table v0.7 (8 sub-components + composer) + RegistryListPage `useOperationalTable` flag + Items canary | +24 | 536 | `51422e1` |
| D4 | RegistryTile + KpiHero + PhaseChip + WCCard + AlertBanner + LiveAlert | +23 | 559 | `2398be9` |
| D5 | DetailHeader + DetailBody + AuditTimeline + Tabs extensions (count/dot/kbd) | +15 | 574 | `dfc7281` |
| D6 | PlantNode + PlantMap + Canvas suite (CanvasGrid/ZoomControls/Minimap/CanvasToolbar/CanvasStateBar/GenericNode/Edge/ArrowDefs) + showcase 3 new tabs | +13 | 587 | _this commit_ |
| **Total** | **~32 new primitives + 1 extended (Tabs)** | **+114** | **587** | |

### Architectural decisions (kept after D6)

- **Test baseline correction**: 473 confirmed; pre-flight 385 was flaky.
- **RegistryListPage feature-flag (D3)**: opt-in `useOperationalTable=true`; the 10 standard callsites stay on the legacy DataTable path. Items is the only canary on the new path (migrated directly inline because Items has bespoke type-tab logic). The flag's API surface is in place so the 10 standard pages can opt in incrementally.
- **Toast.tsx was a no-op stub before D1**: D1 wired up the real implementation. Existing `useToast().show()` callers now produce visible top-right toasts. UX delta tracked by TODO-032 (audit callsites for tone/duration tuning).
- **AuditTimeline naming (D5)**: `AuditTimelineEntry`, NOT `AuditEntry` — the latter is exported from the legacy `ActivityFeed.tsx` with a different shape (`{changedBy, createdAt}`) consumed by `items/[id]/page.tsx`. Both types coexist intentionally; adapter from API audit_log row → `AuditTimelineEntry` tracked by TODO-033 for P7/P9.
- **Drawer width default 480 (D1)**: kept the existing default to avoid breaking 8 existing callsites. Bundle spec is 720; downstream consumers (WO Detail in P7, Equipment 7-tab in P9) should pass `width={720}` explicitly.
- **lucide-react** (D2): added to `packages/ui/package.json` as a regular dependency (^0.453.0); also added to `apps/web/package.json` as a direct dep (Next.js production build needs the explicit reference; transitive resolution is enough only for type-checking).
- **Canvas suite is standalone** (D6): NOT a replacement for `@xyflow/react` in the workflow editor. The suite is for one-off mini-flow renders (e.g. dashboard widgets). React Flow replacement is scope of P3c.
- **Prisma client cache gap** (TODO-031, discovered in pre-flight): turbo restores `@mes/prisma` `dist/` but not the generated client at `node_modules/.pnpm/@prisma+client@*/`. Manual workaround `pnpm --filter @mes/prisma generate` until TODO-031 is fixed (recommended approach: turbo `dependsOn` split, NOT a postinstall hook).

### TODOs closed by PROMPT_DS_LIFT

- **Operational Table v0.7 lift** → done in D3 (commit `51422e1`).
- **Drawer / Modal / Toast in @mes/ui** → done in D1 (commit `8991925`); Toast was a no-op stub, now full impl.
- **AuditTrail UI viewer (§16.2)** → primitive done in D5 (commit `dfc7281`); backend integration tracked by TODO-033 for P7/P9.
- **Plant Map primitives** → done in D6 (this commit); integration with live data tracked by P6 Andon / Plant Overview.

### TODOs opened by PROMPT_DS_LIFT

- **TODO-031** — Prisma client cache gap (recommended fix: turbo `dependsOn`).
- **TODO-032** — Audit existing `useToast()` callsites after Toast no-op stub fix.
- **TODO-033** — Adapter audit-log API row shape → `AuditTimelineEntry`; do not delete ActivityFeed callsites until adapter is wired.

### Verification commands (final)

```
pnpm install
pnpm build                           # 12/12 successful
pnpm lint                            # 3/3 (0 new warnings; 2 baseline @mes/hmi <img> warnings tracked by TODO-002)
pnpm --filter @mes/ui test           # 114/114 pass (29 files)
pnpm --filter @mes/api test          # 249/249 pass
pnpm --filter @mes/domain test       # 176/176 pass
pnpm --filter @mes/schemas test      # 29/29 pass
pnpm --filter @mes/cache test        # 8/8 pass
pnpm --filter @mes/queue test        # 5/5 pass
pnpm --filter @mes/storage test      # 6/6 pass
```

Runtime smoke deferred to user pre-merge (no Playwright / Vitest browser-mode
infrastructure in repo). Suggested checks:
- `/items` (canary) — 6 SavedViews tabs, search, sort, multi-select, BulkBar
- `/operators`, `/equipment` (any 2 of 10 RegistryListPage callsites) — render
  identically to pre-D3 (legacy path)
- `/` showcase — 6 tabs (Components / Patterns / Detail / Dashboard / Colors /
  Typography) navigate; Drawer/Modal/Toast/PlantMap/Canvas demos render

---

## 📜 Project history (timeline)

- **April 27** — PROMPT_1 Foundation drafted
- **April 28** — PROMPT_2 Registries audited + recovered. PROMPT_3a D1-D3 merged
- **April 29** — PC migration. PROMPT_3a D4-D6 merged. PROMPT_3a complete
- **April 30 morning** — PROMPT_3b_REDUCED merged
- **April 30 afternoon** — PROMPT_5_LITE merged. `finalize-prompt.ps1` added
- **April 30 evening** — PROMPT_5_FULL D1+D2 merged
- **April 30 late evening** — PROMPT_5_FULL D3 merged
- **May 1 morning** — PROMPT_5_FULL D4 merged
- **May 1 afternoon** — PROMPT_5_FULL D5 merged
- **May 1 evening** — PROMPT_5_FULL D6 merged. PROMPT_5_FULL 100% complete
- **May 1 late evening** — PROMPT_4 merged (45 min execution time)
- **May 1 very late evening** — **PROMPT_3b_FULL Session A merged** (3 step forms + Phase/Group configurators + canvas badges)

---

## ✅ Current state (verified May 1 very late evening — Session A merged)

### Completed PROMPTs (6/8 at 100%, +1 partial)
- PROMPT_1, 2, 3a, 5_LITE — all 100%
- PROMPT_3b_REDUCED — 100%
- PROMPT_5_FULL (D1-D6) — 100%
- PROMPT_4 (AutoGenEngine + 7 resolvers) — 100%
- **PROMPT_3b_FULL Session A** — 50% of PROMPT_3b_FULL done (Session B remaining)

### PROMPT_3b_FULL Session A — 9/9 step categories + canvas badges (NEW May 1 very late evening)

**Plan reinterpretation**: original spec assumed PARALLEL was a missing StepCategory. Actually PARALLEL is a `StepDeviceCategory` flag (sub-flag for parallel-ops on Step.deviceCategory, added in PROMPT_5 D4). The truly missing step categories are DECISION, INFORMATION, TEARDOWN. Session A delivers full 9/9 step coverage.

**Forms shipped (3 new, mirror SetupStepForm pattern)**:
- ✅ `apps/web/src/components/workflow/forms/DecisionStepForm.tsx` (155 lines) — fields: name, instructions, decisionType (auto_branch | manual_choice | condition_check), causeCodeId
- ✅ `apps/web/src/components/workflow/forms/InformationStepForm.tsx` (138 lines) — fields: name, instructions, informationType (read_sop | safety_briefing | view_video | view_drawing), attachmentUrl
- ✅ `apps/web/src/components/workflow/forms/TeardownStepForm.tsx` (151 lines) — fields: name, instructions, teardownType (cleanup | unload_recipe | last_piece), toolId

**Production form extension**:
- ✅ `apps/web/src/components/workflow/forms/ProductionStepForm.tsx` — added `deviceCategory` selector (4 enum: pre | device_main | parallel | post). Closes parallel-ops data loop with PROMPT_5 D4 swimlane rendering.

**Phase + Group configurators (new)**:
- ✅ `PhaseConfigurator.tsx` (116 lines) — fields: name, category (6 PhaseCategory), isCycleBased
- ✅ `GroupConfigurator.tsx` (140 lines) — fields: name, category (9 GroupCategory), supportsParallel, supportsRecovery

**Validation badges on canvas nodes**:
- ✅ Refactored `ValidationPanel.tsx` to share validation logic via new `useWorkflowValidation()` hook
- ✅ `validation-context.tsx` provides errorNodeIds Set across canvas + sidebar
- ✅ `useWorkflowValidation.ts` (97 lines) extracts buildValidationStructure
- ✅ `nodes/NodeErrorBadge.tsx` — red ▲ badge with native title tooltip (no new dep)
- ✅ Wired into StepNode, PhaseNode, GroupNode

**Domain rule helpers (new pure functions, +12 tests)**:
- ✅ `extractErrorNodeIds(errors)` — derives Set<string> of node IDs with errors
- ✅ `groupErrorsByNodeId(errors)` — groups validation errors by node for tooltip display

**Opportunistic fixes**:
- ✅ `WorkflowCanvas.buildSavePayload` — now reads `isCycleBased`, `supportsParallel`, `supportsRecovery` from node.data (was hardcoded `false`)
- ✅ `WorkflowPalette.STEP_ITEMS` extended with decision, information, teardown
- ✅ `WorkflowCanvas.DEFAULT_ACTION_TYPE` extended for decision (manual_choice), information (read_sop), teardown (cleanup)

**Verification (May 1 very late evening)**:
- ✅ `pnpm install`: clean
- ✅ `pnpm build`: 12/12 successful, 0 errors (33s)
- ✅ `pnpm lint`: 3/3 clean (only pre-existing img warnings)
- ✅ `pnpm test`: **443 tests passed across 40 files** (was 431, +12 domain tests). Below ≥460 target — gap honest: apps/web has no test runner, 5 React forms + 2 configurators + context hook can't be unit-tested in this session.
- ✅ `pnpm dev`: 3 apps boot, /api/health 200, web 200, hmi 200, /workflows 200

**Test breakdown delta (vs PROMPT_4 baseline 431)**:
| Package | Pre | Post | Delta |
|---|---|---|---|
| `@mes/api` | 219 | 219 | 0 |
| `@mes/domain` | 164 | 176 | **+12** |
| `@mes/schemas` | 29 | 29 | 0 |
| Other | 19 | 19 | 0 |
| **Total** | **431** | **443** | **+12** |

---

## 🟡 Known issues (TODO list)

20 entries currently tracked. Session A closed TODO-008, TODO-013, TODO-014.

**HIGH severity (open)**:
- TODO-010 — Versioning UI (Session B — Option A: 2 modals on existing 3-state machine)
- TODO-017 — Refresh token rotation (D1+D2 partial)

**MEDIUM severity (open)**:
- TODO-001..007, 009, 015, 016 (registry/cosmetic/scope-deferred items)
- TODO-011 — Templates wizard (Session B)
- TODO-012 — Canvas polish: right-click + keyboard shortcuts (Session B)
- TODO-024 — Change-of-shift / hand-off flow (post-MVP)
- TODO-026 — Per-stage StepExecution model deferral
- TODO-027 — PROMPT_4_PHASE_2: wire AutoGenEngine to entity creation flows (post-MVP)
- TODO-028 — Pointer to archived workflow-step rules spec (potential PROMPT_4b)

**LOW severity**:
- TODO-025 — HMI logo cross-reference

**Closed by Session A**:
- TODO-008 — ✅ closed (reinterpreted as DECISION+INFORMATION+TEARDOWN forms + deviceCategory selector for parallel-ops data side)
- TODO-013 — ✅ closed (inline canvas badges via shared validation context)
- TODO-014 — ✅ closed (Phase + Group configurator forms shipped)

**To create in Session B**:
- TODO-029 — Canvas drag-to-reorder steps within group (dropped from PROMPT_3b_FULL scope, low priority)
- Session B will also correct TODO-010 wording (the original mentioned 5-state lifecycle which doesn't exist — actual schema is 3-state draft → approved → deprecated)

---

## 🚀 Roadmap — re-baselined May 1 very late evening

| Phase | Scope | Status | Time estimate |
|---|---|---|---|
| PROMPT_1 | Foundation | ✅ Done | — |
| PROMPT_2 | 13 Registries | ✅ Done | — |
| PROMPT_3a | Workflow Designer Core | ✅ Done | — |
| PROMPT_3b_REDUCED | Advanced (3 forms + Validation) | ✅ Done | — |
| PROMPT_5_LITE | HMI Execution (mock) | ✅ Done | — |
| PROMPT_5_FULL | Production-grade HMI (D1-D6) | ✅ Done | — |
| PROMPT_4 | Auto-Generation Engine | ✅ Done | — |
| **PROMPT_3b_FULL Session A** | **3 forms + configurators + badges** | **✅ Done (May 1)** | — |
| PROMPT_3b_FULL Session B | Versioning UI + templates wizard + canvas polish | ⏭️ Next | 4-5h |
| PROMPT_6 | Dashboard & Reporting (handoff Claude Design) | ⏭️ Planned | 5-7h |
| PROMPT_3c | WorkflowSnapshot live preview + perf + E2E | ⏭️ Planned | 8-10h |

**Realistic MVP target**: 8-12 May. Session B + PROMPT_6 + PROMPT_3c = ~17-22h Claude Code residue.

---

## 📋 Conventions (unchanged)

### Technical
- Stack: pnpm workspaces + Turborepo, React 18, Next.js 14, NestJS 10, TypeScript strict
- DB: SQLite local
- Auth: ✅ Argon2id implemented for PIN. JWT in HttpOnly cookie
- State machines: XState v5 — 6 machines
- Validation: Zod (FE+BE shared via `@mes/schemas`)
- Real-time: Socket.IO (server emit + HMI listener)
- Workflow Designer: `@xyflow/react` + `@dagrejs/dagre` + Zustand + react-hook-form + Zod. **9/9 step categories** + Phase/Group configurators + inline validation badges (Session A)
- HMI: Zustand + `@tanstack/react-query` + `@xstate/react` + `socket.io-client`
- RBAC: skill-based via `OperatorSkill` join (QC, MANAGER)
- Code generation: AutoGenEngine pattern with 7 resolvers

### Compliance
- IATF 16949 → audit log 15+ years
- GDPR → operator data minimization
- ECE-R104 (Safety Devices)
- 21 CFR Part 11 → electronic signatures
- PIN auth: Argon2id — OWASP 2024 compliant
- WorkflowSnapshot immutability: ADR-001

---

## ⚠️ Lessons learned (consolidated, +6 from Session A)

### Original (April 28-29) — 12 lessons
### April 30 (D1-D5) — 24 lessons
### May 1 (D6 + PROMPT_4) — 12 lessons

### Session A — 6 new

49. **PARALLEL is a deviceCategory flag, not a StepCategory**: original kickoff confused these. Discovery during PHASE 1 reading saved hours of dead-end work. Lesson: always cross-check enum semantics against the actual schema/types files before coding.

50. **Test gap honesty**: target was ≥460 tests, achieved 443. Apps/web has no vitest runner — React forms can't be unit-tested in this session. Better to be honest than gonfiare with low-value tests. Lesson: when target unreachable for environmental reasons, document and explain rather than padding.

51. **WorkflowValidationProvider context pattern**: shared validation state between canvas (badges) and sidebar (ValidationPanel) via React Context. Avoids store mutation, no duplication, single source of truth. Reusable for future cross-component derived state.

52. **buildSavePayload opportunistic fix**: while extending payload for new step types, noticed isCycleBased/supportsParallel/supportsRecovery were hardcoded `false` (legacy). Read from node.data instead. Phase/Group configurators now actually persist their toggles. Pattern: when touching serialization code, audit other related fields for hidden hardcoded defaults.

53. **Worktree .env quirk for apps/api dev smoke**: NestConfigModule resolves envFilePath relative to package cwd, not project root. Worktree needs .env copies in root, packages/prisma, AND apps/api. Operational note for future Session B and beyond — relevant for dev smoke but not for build/test/lint gates.

54. **Vitest 2.1.x parallel runner Windows flake**: `pnpm test` sometimes hits temp-file races (UNKNOWN error opening AppData\Local\Temp\…). Workaround: run with `--concurrency=1` or per-package serial. Test results are correct in both modes — only the parallel runner has the race. Worth noting for CI considerations.

---

## 🗂️ Repo structure (post Session A)

```
apps/web/src/components/workflow/
├── forms/
│   ├── ProductionStepForm.tsx       (extended with deviceCategory)
│   ├── QualityControlStepForm.tsx
│   ├── ScanStepForm.tsx (IDENTIFICATION)
│   ├── LogisticsStepForm.tsx
│   ├── SetupStepForm.tsx
│   ├── RecoveryStepForm.tsx
│   ├── DecisionStepForm.tsx         ← NEW Session A
│   ├── InformationStepForm.tsx      ← NEW Session A
│   ├── TeardownStepForm.tsx         ← NEW Session A
│   ├── PhaseConfigurator.tsx        ← NEW Session A
│   ├── GroupConfigurator.tsx        ← NEW Session A
│   └── StepConfigurator.tsx         (router for 9 step + 2 node types)
├── nodes/
│   ├── StepNode.tsx                 (with NodeErrorBadge)
│   ├── PhaseNode.tsx                (with NodeErrorBadge)
│   ├── GroupNode.tsx                (with NodeErrorBadge)
│   └── NodeErrorBadge.tsx           ← NEW Session A
├── validation-context.tsx           ← NEW Session A
├── useWorkflowValidation.ts         ← NEW Session A
├── ValidationPanel.tsx              (refactored to use shared hook)
├── WorkflowCanvas.tsx               (palette extended, save payload fixed)
├── WorkflowPalette.tsx              (3 new step items)
└── store.ts
```

9/9 step categories covered. Phase + Group configurators wired. Inline badges on every node type.

---

## 🎯 Next concrete action

**PROMPT_3b_FULL Session B** (~4-5h) — completes PROMPT_3b_FULL.

Scope:
- 2.5 Versioning UI Option A: 2 modals (Approve, Deprecate) on existing 3-state machine + sidebar history
- 2.6 Templates wizard: seed 3 Pneumatic Air templates as Workflows with code prefix `TPL_PNEU_*` + filter wizard on prefix
- 2.7 Canvas polish: right-click context menu (delete/duplicate/disable), keyboard shortcuts (Del, Ctrl+D, Ctrl+Z, Ctrl+Shift+Z) — drag-to-reorder dropped to TODO-029
- 2.8 Final DoD + atomic commit

After Session B, PROMPT_3b_FULL is 100% complete and 7/8 PROMPT done.

---

## 📊 Progress dashboard

```
PROMPT_1   ████████████ 100% Foundation
PROMPT_2   ████████████ 100% Registries
PROMPT_3a  ████████████ 100% Workflow Core
PROMPT_3b  ██████████░░  80% (REDUCED + Session A done; Session B 4-5h)
PROMPT_4   ████████████ 100% Auto-gen
PROMPT_5   ████████████ 100% Production-grade HMI
PROMPT_3c  ░░░░░░░░░░░░   0% (unblocked)
PROMPT_6   ░░░░░░░░░░░░   0% (handoff Claude Design ready)
─────────────────────────────────────
~78% MVP done | Tests 443 (+249% from baseline 127) | Build 12/12 | TODOs 20 | 6.5/8 PROMPT done
```

**MVP target 8-12 May confirmed realistic.**


## Smoke verifications

- 2026-05-02 13:30: smoke /items canary verified by user (Antonella). 6 type tabs visible (Tutti/PF/Semi/MP/Comp/Cons), layout correct, search/sort/multi-select rendering OK. /operators and /equipment legacy paths render correctly without tabs (backward-compat preserved). PROMPT_DS_LIFT D3 confirmed runtime-stable on Windows + Chrome.


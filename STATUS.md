# RAMS-Reflexallen-MES — Project Status

> **Last update**: May 4, 2026 (GO PROMPT_15 — Item Detail 360° + FourPaneConfigurator + Step.workUnitId)
> **Repository**: https://github.com/antonellacolantuono-jpg/RAMS-Reflexallen-MES
> **Stack**: NestJS + Next.js 14 + Prisma SQLite + pnpm Turborepo + shadcn-style + Reflexallen design system

---

## ✅ GO PROMPT_15 — Item Detail 360° + FourPaneConfigurator + Step.workUnitId (May 4, 2026)

Closes user request 2026-05-04: *"nel dettaglio di un articolo ci deve essere l'elenco di tutte le risorse che servono per crearlo e il flusso di lavoro e i possibili luoghi di lavoro. ogni singolo step quindi si crea popolando la descrizione e il titolo selezionando l'azione, la risorsa e il dove."* Three coordinated features delivered in a single batch.

### Scope delivered

- **Component A — Item Detail 360°**: tabbed Item detail page with 5 tabs (Dettagli, Risorse, Workflow, Postazioni, Attività). New aggregate endpoint `GET /api/items/:id/360` returns BOM + tools-used + skills-required + workflows + WC/WU tree + (mock) production stats. URL-synced via `?tab=...` query param. `EntityDetail` primitive in `@mes/ui` extended with optional controlled `activeTab` + `onTabChange` props (backward-compatible). 6 new panel components in `apps/web/src/components/items/detail-360/`.
- **Component B — FourPaneConfigurator**: new universal primitive in `@mes/ui` per MASTER_SPEC § 14.4 (4 panes: Wizard / Resource Palette / Configuration Center / Live Preview). Responsive: ≥1280px 4-column / 1024-1280 Live Preview as drawer toggle / <1024 stacked tabs. New `StepConfiguratorPane` wraps the primitive (Hybrid scope per user decision #5: Configuration Center has Main / Pre-Post / Avanzate tabs). AddStepDialog deprecated and replaced at the page-level mount; the existing 5-test suite stays green (TODO-071 logged for full removal post-demo).
- **Component C — Step.workUnitId**: nullable `workUnitId String?` field added to `Step` schema with `EquipmentNode` relation (named `StepWorkUnit`). Zod (`WorkflowStepInputSchema`), SDK (`WorkflowStepModel`, `WorkOrderSnapshotStepModel`), snapshot serializer (`workflow-snapshot.rules.ts` + `release.service.ts`), HMI step DTO (`step-execution.service.ts`) and HMI client type (`apps/hmi/src/lib/queries.ts`) all extended. `WorkflowSnapshotProjection` now hydrates `workUnit { id, code, name }` via single batched query in `findDetail()`. Display: Postazione column in WorkflowHierarchyTable, 📍 badge in WorkflowCardView, "📍 Postazione: WS-XXX" chip in HMI StepCard.

### Architectural decisions (resolved via AskUserQuestion 2026-05-04)

1. **Risorse "Tools" panel**: derive from `Workflow.steps[].toolId` where `Workflow.itemId = X` (no schema change, S9 absorbed).
2. **Workflows panel filter**: strict `Workflow.itemId = X` only, with empty-state CTA "Crea workflow per questo articolo" (S10 absorbed).
3. **WU dropdown filter in Configurator "Dove" step**: show ALL plant work units (no WC scoping — `Workflow.workCenterId` doesn't exist; S6 absorbed).
4. **Item Detail tabs**: `EntityDetail` already accepts dynamic `tabs: EntityTab[]` — minor controllable-state refactor for URL sync (S13 absorbed, no conflict).
5. **StepConfiguratorPane scope**: Hybrid — wizard exposes Main fields (title/desc/duration/blocking/image) + Pre/Post (device-only: time mode/part ref/no-target) + Avanzate (recoveryConfig/parallel buffer/attention points/materials/verification checklist). AddStepDialog deprecated immediately.

### Test count

- Baseline (commit 718b610): 1014 passing across 10 packages.
- Added: +1 `workflow-snapshot.rules.test.ts` (workUnitId round-trip), +1 `release.service.test.ts` (workUnitId round-trip), +5 `items.service.get360.test.ts`, +11 `panels.test.tsx` (Item 360 panels), +7 `four-pane-configurator.test.tsx`, +9 `StepConfiguratorPane.test.tsx`, +1 `WorkflowHierarchyTable.test.tsx` (Postazione column), +2 `StepCard.test.tsx` HMI (Postazione chip render + null guard).
- Total new: **+37 tests** → expected **1051 passing** post-batch (full DoD verification pending).

### Files changed (by area)

- `packages/prisma/schema.prisma` — Step.workUnitId + EquipmentNode inverse relation.
- `packages/schemas/src/registries/workflow.schema.ts` — workUnitId in WorkflowStepInputSchema.
- `packages/sdk/src/clients/registry-clients.ts` — WorkflowStepModel.workUnitId, WorkOrderSnapshotStepModel.workUnitId+workUnit, ItemsClient.get360 + 7 new Item360* DTO types.
- `packages/domain/src/rules/workflow-snapshot.rules.ts` (+test) — SourceStep + ClonedStep + cloneStep workUnitId.
- `packages/ui/src/components/EntityDetail.tsx` — controlled tab props.
- `packages/ui/src/components/four-pane-configurator.tsx` (NEW, +test).
- `packages/ui/src/index.ts` — FourPaneConfigurator exports.
- `apps/api/src/modules/items/items.service.ts` (+test) — get360() aggregate + 7 DTO types.
- `apps/api/src/modules/items/items.controller.ts` — `:id/360` route.
- `apps/api/src/modules/work-orders/release.service.ts` (+test) — step serializer workUnitId.
- `apps/api/src/modules/work-orders/work-orders.service.ts` (+test) — projection workUnitId+workUnit hydration.
- `apps/api/src/modules/work-orders/step-execution.service.ts` — workUnit include + DTO fields.
- `apps/web/src/app/(registries)/items/[id]/page.tsx` — 5 tabs + URL sync.
- `apps/web/src/components/items/detail-360/*.tsx` (6 NEW + test).
- `apps/web/src/components/workflow/configurator/StepConfiguratorPane.tsx` (NEW, +test).
- `apps/web/src/components/workflow/AddStepDialog.tsx` — `@deprecated` notice.
- `apps/web/src/app/(registries)/workflows/[id]/page.tsx` — swap to StepConfiguratorPane.
- `apps/web/src/components/workflow/store.ts` — addStepNodeToGroup payload workUnitId.
- `apps/web/src/components/workflow/save-payload.ts` — workUnitId persisted.
- `apps/web/src/components/workflow/WorkflowHierarchyTable.tsx` (+test) — Postazione column.
- `apps/web/src/components/workflow/WorkflowCardView.tsx` (+test) — 📍 badge.
- `apps/hmi/src/lib/queries.ts` — workUnitId+workUnit on WorkOrderStep.
- `apps/hmi/src/components/StepCard.tsx` (+test) — Postazione chip.
- `TODO.md` — TODO-071, TODO-072, TODO-074 entries.
- `STATUS.md` — this entry.

### Surprises absorbed

- **S6 — Workflow.workCenterId missing**: WU dropdown shows ALL plant WUs (decision #3). User picks the right one. Acceptable for demo.
- **S9 — Tool.compatibleItems missing**: Risorse Tools panel derived from workflow steps (decision #1). Empty-state hint when no workflow links the item.
- **S10 — Workflow.itemId optional**: strict filter (decision #2). Empty-state CTA links to `/workflows/new`.
- **S11 — Step snapshot serializer cascade (expected)**: 5 files updated (`workflow-snapshot.rules.ts`, `release.service.ts`, `release.service.test.ts`, `workflow-snapshot.rules.test.ts`, `work-orders.service.ts`). Round-trip assertions added.
- **S13 — Item detail tabs collision**: ABSORBED (not a hit). `EntityDetail` already accepts dynamic tabs; minor controllable-state refactor for URL sync.
- S7, S8, S12, S14, S15: SAFE (no impact).

### Conventional commit (suggested)

```
feat(items+workflow): Item Detail 360° + FourPaneConfigurator step editor + workUnitId field (PROMPT_15)
```

---

## ✅ GO FIX-2 — Image upload + display generico per 4 entità (May 4, 2026)

Closes the user-feedback gap surfaced during the 2026-05-04 manual smoke ("manca il fix dell'inserimento delle immagini nella pagina di dettaglio e nelle tabelle. c'è solo nello step"). Pre-Fix-2 only Steps had an image surface (a session-only mock in AddStepDialog rendered by HMI StepCard); Items, Equipment, and Phases had no image plumbing at all and registry list / detail / Workflow Tabella / Card / Live Preview never rendered images.

### Scope delivered

- **Component A** — New `<ImageUpload>` primitive in `@mes/ui` ([packages/ui/src/components/image-upload.tsx](packages/ui/src/components/image-upload.tsx)). Drag-drop + click-to-browse + FileReader → canvas resize to max 1024px / JPEG q0.85 → base64 data URL → `onChange`. MIME + size validation (default 500KB raw, 3 MIME types). Italian copy. 5 vitest cases.
- **Component B** — New `<ImageDisplay>` primitive in `@mes/ui` ([packages/ui/src/components/image-display.tsx](packages/ui/src/components/image-display.tsx)). 5 size variants (thumbnail / small / medium / large / reference) + Lucide-icon or first-letter-initial fallback. 9 vitest cases (5 base + 4 iconCategory parameterized).
- **Component C — Schema + Zod + SDK + snapshot serializer.** Added `imageUrl String?` to Item, EquipmentNode, Phase ([packages/prisma/schema.prisma](packages/prisma/schema.prisma)). Step intentionally keeps using `step.data.photoUrl` (already wired end-to-end via StepExecution service). Extended Zod create/update schemas in `@mes/schemas` ([item](packages/schemas/src/registries/item.schema.ts), [equipment](packages/schemas/src/registries/equipment.schema.ts), [workflow](packages/schemas/src/registries/workflow.schema.ts)). Updated `@mes/sdk` types ([packages/sdk/src/clients/registry-clients.ts](packages/sdk/src/clients/registry-clients.ts)). Critical trap: snapshot serializer at [release.service.ts](apps/api/src/modules/work-orders/release.service.ts:171) is an explicit allowlist — Phase imageUrl needed adding to the cloned shape (`SourcePhase` + `ClonedPhase` in [packages/domain/src/rules/workflow-snapshot.rules.ts](packages/domain/src/rules/workflow-snapshot.rules.ts) + the mapper). Projection type updated at [work-orders.service.ts](apps/api/src/modules/work-orders/work-orders.service.ts) and parser populates `imageUrl: ph['imageUrl'] ?? null`.
- **Component D — Form integration on 4 entities + retire legacy.**
  - Item: [edit](apps/web/src/app/(registries)/items/[id]/edit/page.tsx) + [new](apps/web/src/app/(registries)/items/new/page.tsx) — `<ImageUpload>` bolted onto existing `useState` pattern (RHF migration deferred to TODO-069).
  - Equipment: [edit](apps/web/src/app/(registries)/equipment/[id]/edit/page.tsx) + [new](apps/web/src/app/(registries)/equipment/new/page.tsx).
  - Workflow Phase: [PhaseConfigurator.tsx](apps/web/src/components/workflow/forms/PhaseConfigurator.tsx) — `imageUrl` added to `PhaseFormSchema` + Controller-wrapped `<ImageUpload>`. `WorkflowCanvas` load and `buildSavePayload` updated to round-trip the field through the workflow editor session state.
  - Workflow Step: [ProductionStepForm.tsx](apps/web/src/components/workflow/forms/ProductionStepForm.tsx) — `photoUrl` exposed via Controller (Zod `StepDataSchema.photoUrl` already present, max bumped from 2000 to 700_000 to allow base64).
  - Legacy: `PhotoUploadField` (was used only by AddStepDialog) **deleted**; `AddStepDialog` migrated to `<ImageUpload>` from `@mes/ui`.
- **Component E — Display integration on 7 surfaces.**
  - Item + Equipment detail pages: hero `<ImageDisplay size="large">` in the Details tab (top-left, beside the dl).
  - Item + Equipment registry list pages: 32px-wide thumbnail column at the left edge ([items page](apps/web/src/app/(registries)/items/page.tsx), [equipment page](apps/web/src/app/(registries)/equipment/page.tsx)).
  - Workflow Tabella ([WorkflowHierarchyTable.tsx](apps/web/src/components/workflow/WorkflowHierarchyTable.tsx)): thumbnail next to the name on Phase + Step rows (Group rows skip per spec).
  - Workflow Card ([WorkflowCardView.tsx](apps/web/src/components/workflow/WorkflowCardView.tsx)): `size="medium"` thumbnail in step card top-left.
  - Live Preview ([LivePreviewStepCard.tsx](apps/web/src/components/workflow/LivePreviewStepCard.tsx)): raw `<img>` swapped for `<ImageDisplay size="reference">` for fallback consistency.
  - HMI runtime ([apps/hmi/src/components/StepCard.tsx](apps/hmi/src/components/StepCard.tsx)): same swap, photo behavior preserved.
  - Workflow Flusso canvas StepNode/PhaseNode **explicitly deferred** to TODO-067.
- **Component F — Tests.** +16 tests across 4 files (5 image-upload, 9 image-display, 1 phase-imageUrl in domain, 3 phase-imageUrl in save-payload). Plus extension of existing `release.service.test.ts` and `work-orders.service.test.ts` snapshot-fixture assertions.
- **Component G — Bookkeeping.** TODO-066 (S3 migration), TODO-067 (Flusso canvas), TODO-068 (remaining 5 entities), TODO-069 (RHF migration), TODO-070 (list-endpoint projection).

### Architectural decisions (recon-driven, confirmed with user)

- **Phase imageUrl flows through `WorkflowSnapshot`** (ADR-001 immutability). Serializer allowlist + projection + test fixtures all updated together.
- **Step keeps `data.photoUrl`** (no top-level column). End-to-end flow already exists through StepExecution service; adding a parallel column would force changes across 5+ files for zero behavior gain.
- **Item + Equipment forms keep raw `useState`** (RHF migration filed as TODO-069). Bolt-on `<ImageUpload>` was trivial.
- **`PhotoUploadField` retired** (was a 155-line session-only mock). New `<ImageUpload>` is a strict superset (resize, MIME validation, size cap). Single call site (AddStepDialog) migrated in same batch.
- **Storage strategy = base64-in-DB until TODO-066.** SQLite TEXT is unbounded; 1024px JPEG q0.85 averages ~150-300KB base64. Zod cap = 700KB on each `imageUrl` and on `Step.data.photoUrl`.
- **List-endpoint base64 projection optimization deferred** to TODO-070 — non-issue at current dataset size.
- **Workflow Flusso canvas StepNode/PhaseNode deferred** to TODO-067 — scope creep risk on @xyflow node layout.

### Test count

Pre-batch baseline: 998 across 10 packages.
Post-batch verified: **1014 across 10 packages** (target was 1014-1018; on the lower bound).

| Package | Tests | Δ |
|---|---|---|
| @mes/cache | 8 | 0 |
| @mes/queue | 5 | 0 |
| @mes/storage | 6 | 0 |
| @mes/prisma | 26 | 0 |
| @mes/domain | 198 | +1 (phase imageUrl preserved) |
| @mes/schemas | 39 | 0 |
| @mes/api | 319 | +1 (phase imageUrl in release snapshot test) |
| @mes/ui | 197 | +14 (5 ImageUpload + 9 ImageDisplay) |
| @mes/web | 160 | +3 (Phase imageUrl in save-payload) |
| @mes/hmi | 56 | 0 |
| **Total** | **1014** | **+16** |

### Files changed (by area)

- **Schema + DB**: [packages/prisma/schema.prisma](packages/prisma/schema.prisma) — 3 new `imageUrl` columns. SQLite db pushed (`db:push`), Prisma client regenerated.
- **Domain**: [packages/domain/src/rules/workflow-snapshot.rules.ts](packages/domain/src/rules/workflow-snapshot.rules.ts) (+ test) — Phase serializer.
- **Schemas (Zod)**: 3 files in [packages/schemas/src/registries/](packages/schemas/src/registries/).
- **SDK types**: [packages/sdk/src/clients/registry-clients.ts](packages/sdk/src/clients/registry-clients.ts) — Item / Equipment / WorkflowPhase / WorkOrderSnapshotPhase models.
- **API**: items.repository, equipment.repository, workflows.repository (3 phase-create call sites), work-orders/release.service + projection in work-orders.service. Test fixtures updated.
- **Web — primitives**: 4 new files in [packages/ui/src/components/](packages/ui/src/components/) (image-upload, image-display, + tests).
- **Web — forms**: items/equipment/phase/step pages and configurators.
- **Web — displays**: 7 files (item+equipment detail, item+equipment list, WorkflowHierarchyTable, WorkflowCardView, LivePreviewStepCard).
- **HMI**: [StepCard.tsx](apps/hmi/src/components/StepCard.tsx) — `<ImageDisplay>` swap.
- **Save payload**: [save-payload.ts](apps/web/src/components/workflow/save-payload.ts) — Phase imageUrl serialized; [WorkflowCanvas.tsx](apps/web/src/components/workflow/WorkflowCanvas.tsx) — Phase imageUrl loaded into node.data.
- **Legacy retired**: `apps/web/src/components/workflow/configurator/PhotoUploadField.tsx` + colocated test deleted.

### Surprises absorbed

- **S11 (new — caught in recon)**: Snapshot serializer is an explicit allowlist; schema migration alone would have silently dropped Phase imageUrl from released WOs. Required updating release.service.ts, the `SourcePhase`/`ClonedPhase` types in domain, the snapshotProjection type in work-orders.service.ts, plus 2 test fixtures.
- **S12 (new — caught in pre-flight)**: Dev servers on ports 3000/3001/3002 held a Windows file lock on `query_engine-windows.dll.node`, blocking `pnpm --filter @mes/prisma generate`. Stopped before Component C.
- **S10 absorbed (HMI already worked)**: HMI StepCard already rendered `step.data.photoUrl` end-to-end. Replacement with `<ImageDisplay>` was purely cosmetic for fallback consistency.

### Conventional commit (suggested)

```
feat(images): add image upload + display for Items + Equipment + Workflow Steps + Phases (Fix 2)

- New @mes/ui primitives: ImageUpload (drag-drop + base64 + canvas resize)
  and ImageDisplay (5 sizes + Lucide-icon / initial fallback).
- Prisma schema: imageUrl String? on Item, EquipmentNode, Phase. Step keeps
  using step.data.photoUrl. SQLite db pushed.
- Snapshot serializer + projection extended for Phase imageUrl
  (release.service.ts allowlist + work-orders.service.ts projection +
  cloneWorkflowTree clonePhase + SourcePhase/ClonedPhase types).
- 4 forms wired (item + equipment + phase + step). PhotoUploadField legacy
  retired; AddStepDialog migrated to ImageUpload from @mes/ui.
- 7 display surfaces wired: Item/Equipment detail hero + registry list
  thumbnail + WorkflowHierarchyTable + WorkflowCardView + LivePreviewStepCard
  + HMI StepCard. Workflow Flusso canvas deferred (TODO-067).
- Tests: 998 → 1014 (+16). New TODO-066/067/068/069/070.
```

---

## ✅ GO BATCH B+C Phase 1 — TODO-061 preRetryStepIds seed (May 6, 2026)

Closes the manual smoke gate skipped at PROMPT_7 D4 (commit `12e5f2a`). Backend wire-up of `Step.data.recoveryConfig.preRetryStepIds` shipped in D4; the seed never wrote the field, so the HMI recovery panel rendered an empty pre-retry list. This batch populates the seed.

### Recon outcome — Phase 2 (PROMPT_PNE_5) deferred

Recon discovered the existing auto-gen engine ([`apps/api/src/modules/auto-gen-engine/`](apps/api/src/modules/auto-gen-engine/)) is a **code/ID generator** (`(ruleId, ctx) → string`, 7 resolvers for lot codes / WO codes / sample IDs / etc.), **not a step-injection engine**. PROMPT_PNE_5's "auto-trigger label printing + packaging conditional at WO release" needs a fundamentally new pattern:
- New module to evaluate rules and mutate cloned `WorkflowSnapshot.snapshotData` JSON.
- `Item.requiresPackaging` schema migration (CLAUDE.md flags this as needing explicit approval — out of batch scope).
- DEV-PRINT-001 + BOX-CARTON-EUROPALLET seed.
- Integration in [`release.service.ts:205-241`](apps/api/src/modules/work-orders/release.service.ts) between snapshot clone and StepExecution creation.

Realistic effort 4-6h, not the 2h budget. S6 (new rule type) + S8 (scope > 2h) per surprise budget. Demo path unaffected — label/packaging steps are not in the F1 demo journey. PROMPT_PNE_5 stays deferred per D4 decision (post-demo with PROMPT_DEPLOYMENT or line modules PROMPT_10/11/12/13).

### Phase 1 — Scope delivered

| Component | File | Notes |
|---|---|---|
| Two-pass seed pattern | [`packages/prisma/seed/pneumatic-data/workflow-v1.ts`](packages/prisma/seed/pneumatic-data/workflow-v1.ts) | New `StepRecoveryConfigDef` interface + `extractStepCode(name)` helper. `seedWorkflowV1()` extended: pass 1 builds `Map<bracketCode → cuid>` while upserting steps; pass 2 walks the same definition, resolves `preRetryStepCodes` → cuids via the map, writes `Step.data` as `JSON.stringify({ recoveryConfig: { enabled, maxAttempts, preRetryStepIds } })`. Throws if any code is unresolved (catches typos at seed time). Idempotent (same JSON each run). |
| STEP-LEAK-003 recoveryConfig | same file (L117) | `recoveryConfig: { enabled: true, maxAttempts: 2, preRetryStepCodes: ['STEP-LEAK-RECOVERY-CHECK', 'STEP-LEAK-RECOVERY-CLEAN'] }` |
| Camera test cycle recoveryConfig | same file (L158) | `recoveryConfig: { enabled: true, maxAttempts: 2, preRetryStepCodes: ['STEP-CAM-RECOVERY-CLEAN'] }`. Step keeps current name `[3.2] Camera test cycle` (no rename to STEP-CAM-002 — bracket-code resolution handles it). |
| Seed assertions | [`packages/prisma/seed/pneumatic-data/__tests__/inline-recovery.test.ts`](packages/prisma/seed/pneumatic-data/__tests__/inline-recovery.test.ts) | +2 in-memory tests: STEP-LEAK-003 has `recoveryConfig` pointing to LEAK refs; camera step has `recoveryConfig` pointing to CAM ref. Both also verify the referenced bracket codes actually exist in the corresponding recovery-ref group (B2 / C2). |
| TODO.md | [TODO.md](TODO.md) | TODO-061 → Resolved with full closure write-up. Tier 3 list updated to drop the entry. |
| Header comment | workflow-v1.ts | Stale "recoveryConfig persistence deferred to PROMPT_7" comment refreshed to reference PROMPT_7 D1-D4 (shipped) + TODO-061 (this batch). |

### Architectural decisions (recon-driven)

- **R1 — Two-pass seed**: chosen over one-pass-with-deferred-updates because the seed already runs sequentially through phases and the Map<code, cuid> is small (30 entries). Throwing on unresolved codes catches typos early.
- **R2 — Reuse existing recovery-ref steps**: STEP-LEAK-RECOVERY-CHECK / STEP-LEAK-RECOVERY-CLEAN / STEP-CAM-RECOVERY-CLEAN already seeded in groups B2 / C2 as `category: 'recovery'`. No new STEP-CALIBRATE-* steps invented.
- **R3 — In-memory assertions**: existing test file pattern operates on the `PNE_WORKFLOW_V1` constant. New assertions follow the same shape. Runtime resolution is exercised by the seed run itself (no separate DB fixture needed).
- **R4 — `[3.2]` keeps name**: the brief named the step "STEP-CAM-002" but the seed uses `[3.2] Camera test cycle`. Bracket-code resolution by regex handles either naming; renaming was unnecessary churn.

### Test count

- **Baseline (PROMPT_VIEWSWITCHER close)**: 980 tests
- **This batch adds**: +2 in inline-recovery.test.ts
- **New total**: **982 tests** (verified across 10 packages)

| Package | Tests |
|---|---|
| @mes/api | 319 |
| @mes/domain | 197 |
| @mes/ui | 181 |
| @mes/web | 145 |
| @mes/hmi | 56 |
| @mes/schemas | 39 |
| @mes/prisma | 26 (was 24) |
| @mes/cache | 8 |
| @mes/storage | 6 |
| @mes/queue | 5 |
| **Total** | **982** |

### Files changed

```
packages/prisma/seed/pneumatic-data/workflow-v1.ts                              (StepDef + 2 step entries + two-pass logic + comment refresh)
packages/prisma/seed/pneumatic-data/__tests__/inline-recovery.test.ts          (+2 assertions)
TODO.md                                                                         (TODO-061 → Resolved)
STATUS.md                                                                       (this entry)
```

### Verification (DoD)

```
$ pnpm --filter @mes/prisma seed:pneumatic
✓ Workflow v1: wf-pneumatic-air-680-v1 (4 phases / 7 groups / 30 steps; 2 recovery-refs groups, hidden from linear flow)
✓ WO release: WO-2026-PNE-0042 → released, snapshot cmopq9ts…, 30 step executions (0 new)
✅ Pneumatic Air seed (D4) complete.

$ pnpm --filter @mes/prisma test
Test Files  16 passed (16)
     Tests  26 passed (26)

$ # DB verification (direct Prisma query)
[STEP-LEAK-003] Run leak test cycle
  data: {"recoveryConfig":{"enabled":true,"maxAttempts":2,"preRetryStepIds":["cmopq9tm8004mecovpboq6r8b","cmopq9tmm004oecovhr0ub9dr"]}}
[3.2] Camera test cycle
  data: {"recoveryConfig":{"enabled":true,"maxAttempts":2,"preRetryStepIds":["cmopq9tp00054ecov7fi2svr9"]}}
# IDs resolve to:
cmopq9tm8004mecovpboq6r8b → [STEP-LEAK-RECOVERY-CHECK] Verifica integrità tubo e sede (recovery)
cmopq9tmm004oecovhr0ub9dr → [STEP-LEAK-RECOVERY-CLEAN] Pulisci sede e riconnetti tubi (recovery)
cmopq9tp00054ecov7fi2svr9 → [STEP-CAM-RECOVERY-CLEAN] Pulisci lente e riposiziona pezzo (recovery)

$ # Per-package totals — see test count table above. Aggregated: 982 passing.
```

**Web build smoke**: not run — `apps/web/.next/trace` was locked by the live dev server on port 3001. Test suite passing across all 10 packages is the load-bearing verification.

**Manual smoke gate** (closes the gate skipped at commit `12e5f2a`):
- Boot dev (`pnpm dev`), open HMI, login Mario Rossi → WO-2026-PNE-0042 → STEP-LEAK-003.
- `/demo`: Force FAIL on DEV-LEAK-001.
- Run leak step → recovery panel now renders the 2 seeded pre-retry step names ("Verifica integrità tubo e sede" + "Pulisci sede e riconnetti tubi") instead of an empty list.

### Conventional commit

```
feat(seed): populate preRetryStepIds for STEP-LEAK-003 + camera test (TODO-061 closure)
```

---

## ✅ PROMPT_VIEWSWITCHER_WORKFLOWS — Workflow editor view modes + Sidebar Lucide (May 5, 2026)

Pre-demo polish batch closing TODO-065 (Tier 1 PRE-DEMO). Two coordinated changes:

### Scope delivered

| Component | File | Notes |
|---|---|---|
| Sidebar Lucide icons | [`apps/web/src/components/shell/Sidebar.tsx`](apps/web/src/components/shell/Sidebar.tsx) | All 16 emoji icons (Articoli/BoM/Equipment/Workstations/Recipes/Skills/Operators/CauseCodes/AttentionPoints/Tools/MaintenanceOrders/BoxTypes/Boxes/AutoGenRules/Workflows + Cestino) replaced with Lucide React components (Package, Layers, Factory, MonitorSmartphone, BookOpen, Award, User, AlertTriangle, Bell, Wrench, HardHat, PackageOpen, Package2, Cog, GitBranch, Trash2). NavItem unchanged — already accepts `string \| ReactNode`. |
| ViewSwitcher labels override | [`packages/ui/src/components/view-switcher.tsx`](packages/ui/src/components/view-switcher.tsx) + [`use-registry-view.tsx`](packages/ui/src/components/use-registry-view.tsx) | Optional `labels?: Partial<Record<ViewMode, string>>` prop on `ViewSwitcher`; `useRegistryView` forwards. Backwards-compatible — existing Lista / Schede / Flusso labels remain default. Workflows uses `{ list: 'Tabella' }`. |
| WorkflowHierarchyTable | [`apps/web/src/components/workflow/WorkflowHierarchyTable.tsx`](apps/web/src/components/workflow/WorkflowHierarchyTable.tsx) (NEW) | Hierarchical Phase > Group > Step indented HTML table with chevron expand/collapse per phase + group. Columns: Nome / Tipo / Durata / Stato. Phase rows carry the accent CSS-var border (`--c-{category}`). Click drives `useWorkflowStore.selectNode(id, kind)` for Inspector + Live Preview sync. `readOnly` prop disables click handler (used by WO Detail snapshot tab). +6 Vitest cases. |
| WorkflowCardView | [`apps/web/src/components/workflow/WorkflowCardView.tsx`](apps/web/src/components/workflow/WorkflowCardView.tsx) (NEW) | Vertical card sections grouped by phase. Phase header carries the accent border + AUTO-GEN badge if applicable + step count + total duration. One card per step with name, group name, type badge, duration. Click drives selection sync. +3 Vitest cases. |
| Phase color helper | [`apps/web/src/lib/phase-color.ts`](apps/web/src/lib/phase-color.ts) (NEW) | Lifted `PHASE_COLOR` map (6 categories → CSS vars) from WO Detail page; `phaseColor(category)` falls back to `var(--ink-3)` for unknown values. Reused by WorkflowHierarchyTable, WorkflowCardView, WO Detail Snapshot tab. |
| Workflow editor toolbar | [`apps/web/src/app/(registries)/workflows/[id]/page.tsx`](apps/web/src/app/(registries)/workflows/%5Bid%5D/page.tsx) | `useRegistryView({ registryId: 'workflows', availableViews: ['flow','list','card'], defaultView: 'flow', labels: { list: 'Tabella' } })`. Switcher rendered in toolbar between "Rilascia WO" and "Anteprima". Mode persisted under `localStorage['rams.view.workflows']`. Canvas pane conditionally renders Canvas/Tabella/Card; canvas stays mounted (CSS `hidden`) when not active so Inspector + Live Preview lookups continue to work via the seeded `useWorkflowStore.nodes[]`. |
| WO Detail Snapshot tab refactor | [`apps/web/src/app/(registries)/work-orders/[id]/page.tsx`](apps/web/src/app/(registries)/work-orders/%5Bid%5D/page.tsx) | Bonus: replaced 2-column PhaseCard grid (~50 LOC) with `WorkflowHierarchyTable readOnly` driven by a small `snapshotToWorkflowModel` adapter that fills missing SDK fields (snapshot Step shape is reduced vs full WorkflowStepModel). Existing test "Snapshot bloccato al rilascio" + "Estrusione" + "Avvio linea" + "Scan ricetta" still pass — all rendered by hierarchy table. |

### Architectural decisions

- **S6 (resolved)** — ViewSwitcher tooltip "Lista" vs user-requested "Tabella": optional `labels` override prop (6-line non-breaking extension) was the chosen path. `Workflows` is the only consumer using the override today; other registries (TODO-064 pending) keep the default "Lista".
- **S7 (resolved)** — Inspector + Live Preview rely on `useWorkflowStore.nodes[]` seeded by `WorkflowCanvas`'s `useEffect`. Keeping the canvas mounted with `display:none` when in Tabella/Card view preserves the seeding without any refactor of the seeding logic itself. Trade-off: one initial dagre layout computation per page load (≤30 nodes for the demo workflow, imperceptible).
- **S9 (resolved)** — Lifting `PHASE_COLOR` to `lib/phase-color.ts` succeeded; the WO Detail page imports it from the new path. No fallback inline duplication needed.

### Test count delta

- **Baseline (PROMPT_9 close)**: 971 tests across 10 packages
- **This batch adds**: WorkflowHierarchyTable.test.tsx (+6), WorkflowCardView.test.tsx (+3) = **+9 tests**
- **Expected total ≈ 980 tests**. Final figure verified in DoD below.

### Files changed

```
apps/web/src/components/shell/Sidebar.tsx                               (16 emoji → Lucide)
apps/web/src/lib/phase-color.ts                                         (NEW)
apps/web/src/components/workflow/WorkflowHierarchyTable.tsx             (NEW)
apps/web/src/components/workflow/WorkflowHierarchyTable.test.tsx        (NEW, 6 cases)
apps/web/src/components/workflow/WorkflowCardView.tsx                   (NEW)
apps/web/src/components/workflow/WorkflowCardView.test.tsx              (NEW, 3 cases)
apps/web/src/app/(registries)/workflows/[id]/page.tsx                   (toolbar + conditional canvas/table/card)
apps/web/src/app/(registries)/work-orders/[id]/page.tsx                 (Snapshot tab uses WorkflowHierarchyTable readOnly)
packages/ui/src/components/view-switcher.tsx                            (optional labels prop)
packages/ui/src/components/use-registry-view.tsx                        (forward labels prop)
TODO.md                                                                 (TODO-065 → RESOLVED)
STATUS.md                                                               (this entry)
docs/MASTER_BACKLOG.md                                                  (§ 1 + § 10 update log)
```

---

## ✅ PROMPT_9 — Equipment + Maintenance + Tool Wear (REDUCED SCOPE) + Dashboard nav — shipped (May 4, 2026)

Pre-demo (Reflex Allen, 18-22 May 2026), per Strategy B Realistic decided 2026-05-04, anticipated PROMPT_9 from 11-13 mag to 5-7 mag with a reduced scope (~2-2.5h batch). Schema recon confirmed `MaintenanceOrder`, `MaintenanceLog`, `EquipmentStateLog`, `ToolWearHistory` all already present in [schema.prisma:952-1054](packages/prisma/schema.prisma) — **no migration needed** (S7 surprise avoided).

### Scope delivered

| Component | File | Notes |
|---|---|---|
| Tool wear thresholds + helpers | [`apps/api/src/modules/tools/tools.service.ts`](apps/api/src/modules/tools/tools.service.ts) | `deriveWearStatus()` (good <70% / worn 70-89% / at_limit ≥90%) + `isToolExceeded()` predicate (Q1: `at_limit` enum stays, "exceeded" derived not enum value). `recordCycle()` increments + recomputes wearStatus + audits as `state_change` with `kind: 'cycle_increment'`. `replace()` resets counter, bumps replacementCount, inserts ToolWearHistory, stashes `photoBase64` in AuditLog payload (Q2: no schema migration this batch). |
| Tools controller endpoint | [`apps/api/src/modules/tools/tools.controller.ts`](apps/api/src/modules/tools/tools.controller.ts) | `POST /tools/:id/replace` accepts `{ reason, photoBase64?, replacementToolId? }` validated by new `ReplaceToolSchema`. |
| Step-execution wear hook | [`apps/api/src/modules/work-orders/step-execution.service.ts`](apps/api/src/modules/work-orders/step-execution.service.ts) | (1) Block guard: throws `UnprocessableEntityException` on START when bound tool is exceeded. (2) Auto-increment: when COMPLETE_OK lands a tool-bearing step in `done`, calls `toolsService.recordCycle()`. Best-effort (logs.warn but does NOT roll back the transition on failure). (3) DTO extended with `toolId`, `toolWearStatus`, `toolIsExceeded` projections. |
| MaintenanceOrders module | [`apps/api/src/modules/maintenance-orders/`](apps/api/src/modules/maintenance-orders/) (4 files) | Module + Controller + Service + Repository per `tools/` pattern. Endpoints: GET list/detail, POST create, PATCH update (rejects 422 if status != scheduled), DELETE soft-delete. Code generation: `MNT-{YYYY}-{NNNN}` per [EQUIPMENT_MANAGEMENT.md §2.2](docs/extensions/EQUIPMENT_MANAGEMENT.md), per-(plantId, year) sequence. Action endpoints (Start/Complete/Cancel) deferred to TODO-062. |
| Schemas | [`packages/schemas/src/registries/maintenance-order.schema.ts`](packages/schemas/src/registries/maintenance-order.schema.ts) (new) + [`tool.schema.ts`](packages/schemas/src/registries/tool.schema.ts) (extended) | `MAINTENANCE_TYPES/STATUSES/PRIORITIES` enums + Create/Update/Filters Zod schemas using schema-native field names (plannedStart/plannedEnd, description, equipmentNodeId). |
| SDK | [`packages/sdk/src/clients/registry-clients.ts`](packages/sdk/src/clients/registry-clients.ts) | `MaintenanceOrdersClient extends BaseRegistryClient` + `ToolsClient.replace(id, data)` method. Wired into `sdk.maintenanceOrders` in [`apps/web/src/lib/sdk.ts`](apps/web/src/lib/sdk.ts). |
| Back-office UI | [`apps/web/src/app/(registries)/maintenance-orders/`](apps/web/src/app/(registries)/maintenance-orders/) (3 pages) | List with status/type/priority columns; Detail with tabs (Dettagli / Pianificazione / Attività + ActivityFeed audit log); Create form with equipment dropdown + datetime-local pickers. Action buttons defer to TODO-062 (notice rendered). |
| Sidebar Dashboard nav | [`apps/web/src/components/shell/Sidebar.tsx`](apps/web/src/components/shell/Sidebar.tsx) + [`NavItem.tsx`](apps/web/src/components/shell/NavItem.tsx) | NEW "Panoramica" section above "Anagrafiche" with Dashboard link (`/`, `<BarChart3>` lucide-react icon — Q4 decision). NavItem extended to accept `string \| ReactNode` for icon. NEW Manutenzioni entry (🛠️) in REGISTRY_NAV between Tools and BoxTypes. Active-state guard fixed for `/` (exact match instead of prefix). |
| Seed | [`packages/prisma/seed.ts`](packages/prisma/seed.ts) | +3 demo MaintenanceOrders: MNT-2026-0001 (preventive scheduled, EQ-EXT-01A), MNT-2026-0002 (calibration in_progress, EQ-LEAK-01A), MNT-2026-0003 (corrective completed, EQ-CRIMP-01A). Idempotent. |

### Architectural decisions (Q1-Q4 from 2026-05-04)

1. **Q1 — Tool wear "exceeded" stays as a derived predicate, not a new enum value.** ToolWearStatus enum is `new | good | worn | at_limit | replaced`. Tool stays at `at_limit` once ≥90%; `isToolExceeded()` returns true when `currentCyclesCount >= maxCycles`. Block guard surfaces this as a domain error on START. Avoids schema migration.

2. **Q2 — `photoBase64` stashed in AuditLog.after JSON payload, no schema migration.** ToolWearHistory schema has no `attachmentUrls` field; replacement form's photo flows via audit log payload. Tracked as TODO-062 follow-up: post-DEPLOYMENT (when MinIO/R2 is available), migrate to S3-backed photo storage with URL refs in audit log instead of base64. Migration script: read existing replace audit entries, upload base64 to S3, replace `payload.photoBase64` with `payload.photoUrl`. Audit log table can grow large with base64 photos (~100KB per replacement).

3. **Q3 — MaintenanceOrder UI: list + detail + create only.** Action buttons (Start/Complete/Cancel) deferred to TODO-062 to keep this batch under 2.5h. Detail page renders amber notice; API still exposes the full CRUD shape.

4. **Q4 — Sidebar Dashboard nav uses `BarChart3` lucide-react icon (not emoji).** NavItem prop signature widened from `icon: string` to `icon: string \| ReactNode`. Active-state branch tightened for `/` to exact match.

### Decisions formalized at this batch (per MASTER_BACKLOG.md § 9)

- **D1** ✅ Strategy B Realistic adopted — ship date 18-22 giu (slipped +5-7 days vs original 13-15 giu target).
- **D2** ✅ Sound HMI deferred — tracked as TODO-057.
- **D3** ✅ AUTH_BASIC deferred post-demo — merged with PROMPT_DEPLOYMENT (5-12 giu). HMI auth already functional (Argon2id PINs from PROMPT_5_FULL D1+D2).
- **D4** ✅ PROMPT_PNE_5 deferred post-demo.
- **D5** ✅ ViewSwitcher Workflows pre-demo — separate batch 5-6 mag (next after PROMPT_9). Tracked as TODO-065.
- D6 (docs owner) + D7 (Andon post-demo customer feedback) remain OPEN.

### Test count (literal output appended in DoD section at bottom)

- **Baseline (PROMPT_3c close)**: 944 (api 296 / domain 197 / ui 181 / web 132 / hmi 56 / schemas 39 / prisma 24 / cache 8 / storage 6 / queue 5)
- **Added in this batch**: tools.service.test.ts (~15), maintenance-orders.service.test.ts (~6), step-execution wear hook (+4), maintenance-orders pages (~4). Expected total ≈ **973 tests** (+29). Final figure verified post-DoD.

### Files changed

```
packages/schemas/src/registries/maintenance-order.schema.ts                 (NEW)
packages/schemas/src/registries/tool.schema.ts                              (+ReplaceToolSchema)
packages/schemas/src/registries/index.ts                                    (re-export)
packages/sdk/src/clients/registry-clients.ts                                (+MaintenanceOrdersClient + ToolsClient.replace)
packages/sdk/src/index.ts                                                   (re-export)
apps/web/src/lib/sdk.ts                                                     (wire .maintenanceOrders)
apps/api/src/modules/maintenance-orders/maintenance-orders.module.ts        (NEW)
apps/api/src/modules/maintenance-orders/maintenance-orders.controller.ts    (NEW)
apps/api/src/modules/maintenance-orders/maintenance-orders.service.ts       (NEW)
apps/api/src/modules/maintenance-orders/maintenance-orders.repository.ts    (NEW)
apps/api/src/modules/maintenance-orders/maintenance-orders.service.test.ts  (NEW)
apps/api/src/app.module.ts                                                  (register MaintenanceOrdersModule)
apps/api/src/modules/tools/tools.service.ts                                 (recordCycle + replace + helpers)
apps/api/src/modules/tools/tools.service.test.ts                            (NEW)
apps/api/src/modules/tools/tools.controller.ts                              (POST /:id/replace)
apps/api/src/modules/work-orders/step-execution.service.ts                  (block guard + recordCycle hook + tool projection)
apps/api/src/modules/work-orders/step-execution.service.test.ts             (+4 wear cases)
apps/api/src/modules/work-orders/work-orders.module.ts                      (import ToolsModule)
apps/web/src/app/(registries)/maintenance-orders/page.tsx                   (NEW list)
apps/web/src/app/(registries)/maintenance-orders/page.test.tsx              (NEW)
apps/web/src/app/(registries)/maintenance-orders/[id]/page.tsx              (NEW detail)
apps/web/src/app/(registries)/maintenance-orders/new/page.tsx               (NEW form)
apps/web/src/app/(registries)/maintenance-orders/new/page.test.tsx          (NEW)
apps/web/src/components/shell/Sidebar.tsx                                   (Panoramica section + Manutenzioni entry)
apps/web/src/components/shell/NavItem.tsx                                   (icon: string | ReactNode)
packages/prisma/seed.ts                                                     (+3 MaintenanceOrders)
TODO.md                                                                     (+TODO-062/063/064/065 + tier guidance update)
MASTER_BACKLOG.md                                                           (§ 1 roadmap, § 3.1 AUTH_BASIC deferred, § 9 D1-D7 overhaul, § 10 update log)
STATUS.md                                                                   (this entry)
```

### Verification (May 4, 2026 — literal command output)

**A. Type-check** — clean (run per app, since root `pnpm type-check` is blocked by pre-existing `@mes/cache/storage/queue` placeholder packages that have no tsconfig and emit `tsc --help` instead — unrelated to this batch):

```
$ pnpm --filter @mes/api type-check
> @mes/api@0.1.0 type-check ...
> tsc --noEmit
(exit 0, no output)

$ pnpm --filter @mes/web type-check
> @mes/web@0.1.0 type-check ...
> tsc --noEmit
(exit 0, no output)
```

**B. Lint** — clean:

```
$ pnpm --filter @mes/api lint
> @mes/api@0.1.0 lint ...
> tsc --noEmit
(exit 0)

$ pnpm --filter @mes/web lint
> @mes/web@0.1.0 lint ...
> next lint
✔ No ESLint warnings or errors
```

**C. Tests** — **971 tests passing** across 10 packages (was 944 baseline → **+27**):

| Package | Tests | Δ vs baseline |
|---|---|---|
| `@mes/api` | 319 (33 files) | +23 (maintenance-orders.service +6, tools.service +13, step-execution wear hook +4) |
| `@mes/web` | 136 (59 files) | +4 (maintenance-orders/page +2, maintenance-orders/new/page +2) |
| `@mes/hmi` | 56 | 0 |
| `@mes/domain` | 197 | 0 |
| `@mes/ui` | 181 | 0 |
| `@mes/schemas` | 39 | 0 |
| `@mes/prisma` | 24 | 0 |
| `@mes/cache` | 8 | 0 |
| `@mes/storage` | 6 | 0 |
| `@mes/queue` | 5 | 0 |
| **Total** | **971** | **+27** |

Each suite ran via `pnpm --filter <pkg> test` (per-package vitest); `pnpm test` at root has a Turbo dependency on `@mes/prisma#generate`, which fails on Windows when the dev servers hold the Prisma engine DLL. Tests themselves are independent of the regenerate step (the existing client is current — schema unchanged this batch).

**D. Build** — clean:

```
$ pnpm --filter @mes/api build
> @mes/api@0.1.0 build ...
> tsc -p tsconfig.build.json
(exit 0)

$ pnpm --filter @mes/web build
> @mes/web@0.1.0 build ...
> next build
✓ Generating static pages (35/35)
... 36 routes total (was 33 baseline) — +3 new:
  ○ /maintenance-orders                  887 B           139 kB
  ƒ /maintenance-orders/[id]             3.78 kB         137 kB
  ○ /maintenance-orders/new              5.4 kB          131 kB
```

**E. Seed** — `pnpm --filter @mes/prisma db:seed` ran clean: `✓ MaintenanceOrders: MNT-2026-0001, MNT-2026-0002, MNT-2026-0003 ... ✅ Seed complete`.

**F. Manual smoke — DEFERRED to user.** The harness blocked auto-respawning `pnpm dev` after I killed the 3 zombie servers (PIDs 33636/28180/30484) for the build step. To complete manual smoke, the user runs:

```powershell
pnpm dev   # 3000/3001/3002
```

Then verifies in browser:
1. http://localhost:3001/ — Sidebar shows new "Panoramica > Dashboard" section at the top with `BarChart3` icon.
2. http://localhost:3001/maintenance-orders — list page shows the 3 seeded MNT rows (MNT-2026-0001 / 0002 / 0003) with status badges and equipment links.
3. Click a row → detail page renders header (status + priority badges), Dettagli tab, Pianificazione tab (planned vs actual), Attività tab (audit feed).
4. Click "+ Nuovo" → form with equipment dropdown (populated from `sdk.equipment.list`), datetime-local pickers, MNT-AAAA-NNNN auto-code notice. Submit → redirects to detail page of newly-created MNT-2026-0004.
5. http://localhost:3002 → login OP-001 (badge `OP-001`, PIN `1234`) → open WO-2026-0101 → step using `TOOL-CRIMP-8MM` shows tool wear hook on completion (verify increment via `pnpm --filter @mes/prisma exec prisma studio` Tool table).
6. (Optional) Manually set `tool.currentCyclesCount = maxCycles` via studio → start the corresponding step in HMI → expect 422 with `Tool ${code} exceeded lifetime; replace before use`.

**G. Surprise log this batch**:
- **S+1 (resolved)**: ToolWearStatus enum doesn't have `exceeded` value (Q1 decision: derived predicate `isToolExceeded()` instead — see code in `tools.service.ts`).
- **S+1 (resolved)**: ToolWearHistory schema has no photo column (Q2 decision: `photoBase64` stashed in AuditLog payload — see TODO-062 for S3 migration plan).
- **S+1 (resolved)**: Pre-existing root `pnpm type-check` failure for `@mes/cache/storage/queue` (no tsconfig). Unrelated to this batch; out of scope.
- **S+1 (resolved)**: 3 zombie dev servers held Prisma DLL + .next/trace; killed with user authorization (PIDs 33636/28180/30484).

---

## ✅ PROMPT_3c — Workflow Editor Live Preview (batch 1) — shipped (May 3, 2026)

Per MASTER_SPECIFICATION § 14.5, the workflow editor now renders an operator's-eye sidebar that mirrors the HMI StepCard for the currently selected step. Engineers can click through the 11 spec states (FLUSSO OK: idle, ready, in_progress, paused, complete, retry — FLUSSO KO: error, failed, warning, timeout, offline) without releasing a Work Order or logging into the HMI, collapsing the iteration loop from ~5 min to ~2 sec.

### Scope delivered

| Component | File | Notes |
|---|---|---|
| State catalogue | `apps/web/src/components/workflow/livePreview/states.ts` | 11 states across two flow groups; static map to the 11 HMI `StepExecutionStatus` values so visual parity is testable |
| Mock data engine | `apps/web/src/components/workflow/livePreview/mockData.ts` | `nodeToPreviewData(node)` adapter + `mockStateFields(state, stepId)` deterministic FNV-1a hash → `(durationSec, attemptCount, blockedNote)` |
| Operator-eye renderer | `apps/web/src/components/workflow/LivePreviewStepCard.tsx` | Mirror of `apps/hmi/src/components/StepCard.tsx` visual logic (status maps / glyphs / tones / callouts). Stateless, read-only, 300ms transitions. |
| Sidebar container | `apps/web/src/components/workflow/StepLivePreview.tsx` | Subscribes to Zustand store, renders state chips bar + card; resets to `idle` on selection change |
| 5th pane wiring | `apps/web/src/app/(registries)/workflows/[id]/page.tsx` | Toggleable `react-resizable-panels` `<Panel>` next to Inspector; "Anteprima" toolbar button mirrors the existing "Storico" pattern; defaults ON for discoverability |

### Architectural decisions

1. **Adapter, not cross-app import** — HMI's `StepCard` consumes runtime `WorkOrderStep` data; the editor only has workflow AST nodes, and tsconfig paths don't bridge `apps/hmi` → `apps/web`. Mirroring the visual logic in a new `LivePreviewStepCard` keeps the app boundary clean and lets HMI continue evolving its execution-data shape independently. The 11 mirror-parity test cases in `LivePreviewStepCard.test.tsx` are the canary if the HMI visual contract drifts.

2. **Deterministic mock data via FNV-1a hash of `stepId`** — Runtime fields the AST doesn't carry (durationSec, attemptCount, blockedNote) are synthesized per `(state, stepId)` so the preview is reproducible across re-renders. No randomness, no flicker. Lightweight inline hash avoids the cost (and async surface) of `crypto.subtle`.

3. **Toggleable 5th pane, not tabbed inspector** — Reuses the existing `react-resizable-panels` infrastructure (Validation / Palette / Canvas / Inspector / **Preview** / optional History). Engineers can compare form edits and the preview side-by-side, which a tabbed inspector would force into separate views. Default ON ensures the feature is discovered without onboarding.

4. **Chip-driven only for v1** — The spec § 14.5 also calls for clicking action buttons inside the preview to simulate state transitions; that needs a small state machine and ~80 LOC + tests. Deferred to v1.1; current version is read-only with chip-controlled state, which already covers the "what does failure look like" feedback loop.

### Test count

- **Baseline (PROMPT_DESIGN_ALIGNMENT close + PROMPT_7 D4)**: 909 (api 296 / domain 197 / ui 181 / web 97 / hmi 56 / schemas 39 / prisma 24 / cache 8 / storage 6 / queue 5)
- **Final**: **944** (api 296 / domain 197 / ui 181 / **web 132** / hmi 56 / schemas 39 / prisma 24 / cache 8 / storage 6 / queue 5)
- **Delta**: **+35 tests** (web only — 3 new test files: `mockData.test.ts` 11 / `LivePreviewStepCard.test.tsx` 18 / `StepLivePreview.test.tsx` 6). Zero regressions in any other package.

### Verification (May 3, 2026)

- ✅ `pnpm --filter @mes/web type-check` clean (exit 0)
- ✅ `pnpm --filter @mes/web lint` clean (no warnings or errors)
- ✅ `pnpm test` — **17 tasks successful**, 944 tests passing (full Turborepo run)
- ✅ `pnpm build` — **13 tasks successful**, 33+ web routes generated, `/workflows/[id]` route 143 kB / 269 kB First Load JS
- ⏳ Manual smoke deferred — chip-driven preview + toggle button verified by tests; in-browser confirmation can run as part of demo dress rehearsal

### Files changed

```
apps/web/src/components/workflow/livePreview/states.ts                     (NEW)
apps/web/src/components/workflow/livePreview/mockData.ts                   (NEW)
apps/web/src/components/workflow/livePreview/mockData.test.ts              (NEW)
apps/web/src/components/workflow/LivePreviewStepCard.tsx                   (NEW)
apps/web/src/components/workflow/LivePreviewStepCard.test.tsx              (NEW)
apps/web/src/components/workflow/StepLivePreview.tsx                       (NEW)
apps/web/src/components/workflow/StepLivePreview.test.tsx                  (NEW)
apps/web/src/app/(registries)/workflows/[id]/page.tsx                      (toggle + 5th pane)
STATUS.md                                                                  (this entry)
TODO.md                                                                    (TODO-061 added)
```

### TODOs opened by PROMPT_3c batch 1

- **TODO-061** — Seed `Step.data.recoveryConfig.preRetryStepIds` for STEP-LEAK-003 + STEP-CAM-002. Surfaced during PROMPT_7 D4 closure manual smoke. Tier 3 polish; effort ~30 min.

### Out of scope (later PROMPT_3c batches)

- WorkflowSnapshot integration (depends on WO release flow)
- Performance benchmarks for canvas at 100+ nodes
- Playwright E2E (Vitest + RTL only here)
- Per-action-type specialized renderers (SCAN_QR mock, DEVICE_RUN telemetry)
- Action-button-driven state simulation in the preview
- Responsive floating-drawer mode <1280px (per spec § 14.4)

---

## ✅ PROMPT_DESIGN_ALIGNMENT — full-app mockup alignment — 100% complete (May 3, 2026)

Bridges the gap between F1 (Pneumatic vertical demo path) and F2 (Andon + back-office registry detail). Lifts every back-office surface, the HMI shell, and the home dashboard from "spec-correct" to "mockup-faithful" against `design-system/source/project/screens-*.jsx`. Absorbs the original PROMPT_7 D2 (registry detail/edit/new pages) and D3 (WO BO 7-tab) scope.

### Scope delivered

| Phase | Batch | Scope | Commit |
|---|---|---|---|
| D1 prep | — | `Button` + `StatusBadge` aligned to mockup tokens (size/variant matrix) | `e9550ed` |
| D2 | 1 | HMI Decision A (variant migration: explicit `variant=`/`size=` props on every `<Button>`) | `69a7a32` |
| D2 | 2 | Registry list pages aligned to mockup tokens (DataTable, Filter strip, Bulk-actions bar) | `4fa80e2` |
| D2 | 3 | Trash page action buttons | `a799e3c` |
| D2 | 4.5 | `HMIShell` + `HMIBigBtn` primitives in `@mes/ui`; HMI screens wrapped | `4e3d89d` |
| D3 | 5 | `useRegistryView` hook + wired across 13 registries (filter / sort / multi-select / pagination unified) | `ba176c5` |
| D3 | 6 | `/` rebuilt as Plant Overview Dashboard (KPI strip + Active WOs + Live Activity + Equipment Status + 6 Big Losses + Box Inventory) from mockup `ScreenDashboard` | `3588a2e` |
| D3 | 7.1 | BoM + Recipe scalar-fidelity detail/edit/new (6 pages) | `8dcae9e` |
| D3 | 7.2 | Equipment + Skills + Operators detail/edit/new (9 pages) | `56f1cba` |
| D3 | 7.3 | Cause-codes + Attention-points + Tools detail/edit/new (9 pages) | `d210530` |
| D3 | 7.4 | Box-types + Boxes detail/edit/new (6 pages) | `3c2c270` |
| D3 | 8 | Risorse tab on Equipment detail for `work_unit` / `work_center` levels (cross-tree) | `316a1cd` |
| D3 | 9 | Back-office WO detail page with 7-tab layout (Overview / Steps / Resources / Quality / Audit / Genealogy / Comments) | `98d55bd` |
| D4 | closure | TODO-055 fix (move `deriveEquipmentCounts` + `deriveBoxCounts` out of `(registries)/page.tsx` to `lib/dashboard-helpers.ts` — unblocks `pnpm --filter @mes/web build`) + this STATUS / ROADMAP / TODO / MASTER_BACKLOG closure | _this commit_ |

**Totals**: 30 registry CRUD pages across 11 registries (BoM, Recipe, Equipment, Skill, Operator, Cause-code, Attention-point, Tool, Box-type, Box) + 1 Plant Overview Dashboard + 1 WC Risorse tab + 1 WO BO 7-tab + 5 D2 batches (Button/StatusBadge tokens, HMI Decision A migration, registry-list alignment, trash page, HMI Shell) + 1 `useRegistryView` hook unifying registry list behavior + Drift Decisions A+B (variant prop migration, registry-view shape).

### Test count

- **Baseline (post PROMPT_PNE_SEED_CLEANUP)**: 770 (api 284 / domain 197 / ui 119 / web 38 / hmi 36 / schemas 29 / prisma 22 / cache 8 / storage 6 / queue 5 + 26 from PNE_SEED_CLEANUP rebaseline that brought 744 → 770 mid-flight)
- **Final**: **898** (api 296 / domain 197 / ui 181 / web 97 / hmi 45 / schemas 39 / prisma 24 / cache 8 / storage 6 / queue 5)
- **Delta**: **+128 tests** across PROMPT_DESIGN_ALIGNMENT (api +12 / ui +62 / web +59 / hmi +9 / schemas +10 / prisma +2). Zero regressions.

### Architectural decisions (kept across batches)

1. **Drift Decision A — Button variant prop migration**: The mockup `Button` primitive uses explicit `variant=` / `size=` props (e.g. `variant="ghost" size="sm"`) instead of class-name composition. D1 prep aligned the `@mes/ui` `Button` to this contract; D2 Batch 1 migrated every HMI `<Button>` callsite. Back-office migrations followed in D2 Batch 2-3. **Why**: callers no longer need to know the design-token internals; one prop swap per surface vs. line-by-line class rewrites.

2. **Drift Decision B — `useRegistryView` shape**: Originally each registry list page open-coded filter / sort / multi-select / pagination state. D3 Batch 5 introduced `useRegistryView` (in `apps/web/src/lib/use-registry-view.ts`) with a single hook signature wired across 13 registries. **Why**: 13 list pages × 4 state slices = 52 ad-hoc useState/useReducer instances pre-Batch 5; one hook + per-registry config object post-Batch 5. New registries get the unified behavior with one import.

3. **Plant Overview helpers location** (TODO-055 fix in D4 closure): `deriveEquipmentCounts` + `deriveBoxCounts` were originally co-located in `apps/web/src/app/(registries)/page.tsx` so the page test could import them without jumping files. Next.js 14 App Router rejects extra named exports from `page.tsx` files at build time (the `OmitWithTag` index-signature check on `.next/types/app/(registries)/page.ts` flags any non-allowlisted export). D4 closure moved both helpers to `apps/web/src/lib/dashboard-helpers.ts`; the page imports them at the call site, the test imports them from the helper module. **Build now passes.** Pattern lesson: pure helpers in `app/*/page.tsx` are a latent build break — keep them in `lib/` from the start.

4. **WO BO 7-tab single-page layout (D3 Batch 9)**: The mockup `ScreenWO` component renders the WO detail as one route with 7 tab panels (Overview / Steps / Resources / Quality / Audit / Genealogy / Comments) inside a single shell. Implemented as `apps/web/src/app/(registries)/work-orders/[id]/page.tsx` with a `Tabs` primitive from `@mes/ui` and per-tab data fetching via TanStack Query (lazy on tab switch). **Why one route vs. nested**: tab state lives in `useState`, not URL — keeps the back-button behavior simple for the demo; nested routes (e.g. `/work-orders/[id]/steps`) are a post-MVP refinement if customer wants deep-linkable tabs.

5. **Equipment Risorse tab (D3 Batch 8) — cross-tree query**: For `level=work_unit` or `level=work_center` equipment nodes, the Risorse tab renders the contents of the work_unit / work_center: child equipment + assigned operators + recipes scoped to that node. The query fans out across the equipment tree by walking `parentId` from the selected node. **Why scope-conditional**: leaf equipment (e.g. a single device) has no children — showing an empty Risorse tab would be visual noise. The tab is hidden for irrelevant levels.

6. **5 D2 batches as separate commits**: Originally planned as one D2 monolithic commit. Split into 5 because (a) HMI variant migration touches 30+ files and is risky to bundle with back-office work, (b) `HMIShell` + `HMIBigBtn` are net-new primitives and deserve their own atomic commit for `@mes/ui` consumers to track, (c) trash page action button polish surfaced mid-stream and was opportunistic. **Why split commits**: each batch passes tests independently; a regression in one is one revert away from clean.

### TODOs closed by PROMPT_DESIGN_ALIGNMENT

- **TODO-039** — Design token migration `bg-primary-*` / `bg-success-*` (closed by D2 Batch 2 token alignment).
- **TODO-055** — Move `deriveEquipmentCounts` helper out of Next.js page file (closed by D4 closure).

### TODOs opened by PROMPT_DESIGN_ALIGNMENT

- **TODO-049** — BoM lines not persisted on create/update (D3 Batch 7.1: frontend ships scalar-fidelity, repo gap to close in F2).
- **TODO-050** — Recipe parameters/versions not persisted (D3 Batch 7.1: same pattern as TODO-049).
- **TODO-052** — Equipment ISA-95 tree visualization (D3 Batch 7.2: `Tree` primitive missing in `@mes/ui`, deferred).
- **TODO-053** — Skills × Operators matrix view (D3 Batch 7.2: `SkillsClient.matrix()` SDK declared but controller route missing).
- **TODO-054** — Operator-Skill assignment editor (D3 Batch 7.2: same pattern as TODO-053 on `OperatorsController`).
- **TODO-056 (NEW)** — Multi-level timer aggregation on WO BO Steps tab (D3 Batch 9: Steps tab shows per-step elapsed timers; aggregate roll-up to group / phase / WO levels deferred to PROMPT_9).

### Verification (May 3, 2026)

- ✅ All **898 tests pass** across 17 tasks (`pnpm test` — full Turborepo run, 13 cached + 4 fresh after D4 changes)
- ✅ `pnpm --filter @mes/web type-check` clean (exit 0, fresh `.next/types/` regen)
- ✅ `pnpm --filter @mes/web build` clean (exit 0, 33/33 routes generated, **was previously blocked by TODO-055**)
- ✅ `pnpm --filter @mes/web test` 97 passing (54 test files; +59 vs baseline)
- ⏳ Manual `pnpm dev` smoke pending in D4 closure (Phase 3a) — verify `/`, `/items`, `/equipment`, `/work-orders`, `/dev/showcase`, HMI `/`

### Lessons learned (Lessons 59 + 60)

- **Lesson 59 (Worktree corruption recovery via git plumbing)** — Mid-session, Claude Code worktrees can have stale `.git` references that prevent normal `git push` / `git merge` from the worktree. Recovery pattern: `GIT_DIR=<parent-repo>/.git` + plumbing-level `git commit-tree` + `git update-ref refs/heads/<branch>`. **Anti-pattern**: `git worktree remove --force` on an unmerged branch (loses uncommitted work). **Real case**: D2 Batch 4.5 + 5 worktree divergence — reconciled in 5 steps: (1) commit in worktree, (2) push branch, (3) ff-merge to main from parent repo, (4) push main from parent, (5) cleanup worktree.

- **Lesson 60 (Worktree consolidation discipline)** — Each Claude Code session may create a worktree with its own `node_modules` (~700 MB - 1 GB). Accumulated zombie worktrees waste disk and create symlink hell on Windows. **Pattern**: after EVERY batch closure, consolidate to main + `git worktree remove` + `git branch -D` (local) + `git push origin --delete` (remote). **On Windows specifically**: `git worktree remove` can fail with "Result too large" when path length > 260 chars — git de-registers the worktree but the physical folder remains. **Workaround**: `robocopy /MIR <empty-folder> <stale-worktree-path>` to truncate-then-`Remove-Item`. Apply discipline retroactively — long-running projects accumulate orphans fast.

### Files changed (D4 closure)

```
apps/web/src/lib/dashboard-helpers.ts                              (NEW)
apps/web/src/app/(registries)/page.tsx                             (extracted helpers)
apps/web/src/app/(registries)/page.test.tsx                        (import path updated)
STATUS.md                                                          (this entry + Lesson 59/60)
ROADMAP.md                                                         (F1.7 added + change log)
TODO.md                                                            (TODO-055 closed; TODO-056 added)
MASTER_BACKLOG.md                                                  (§ 1 status / § 2 TODO / § 10 update log)
```

---

## 🩹 Hotfix — PROMPT_PNE_SEED_CLEANUP (post F1 close, May 3, 2026)

Re-designed `wf-pneumatic-air-680-v1` seed to align the operator-facing flow with the D5 RecoveryFlow / D4.2 HMIScrapForm runtime. The original PNE_2 seed modelled recovery as inline `[REC-LEAK-*]` / `[REC-CAM-*]` step rows in the linear workflow — once D4 shipped the inline recovery panel + scrap modal, the seeded steps started competing with the modal flow and confusing the operator (HMI showed `[STEP-LEAK-003]` blocked then auto-advanced to `[REC-LEAK-ATT-2]` instead of opening the recovery panel).

### Scope (revised vs spec)

The original spec aimed at a full Production phase restructure (Setup / Production / Outbound / Teardown auto-gen) with `recoveryConfig` persisted on the seed. Three pre-flight surprises forced a smaller, honest scope (decisions D-A through D-D documented mid-session):

- **D-A** Drop `recoveryConfig` persistence from seed entirely. The `Step` schema has no JSON column, and the HMI runtime never reads `recoveryConfig` (it's a workflow-editor-only convention from D4.1). Persistence + DTO projection + runtime read + pre-retry execution all deferred to PROMPT_7 (TODO-040 extended below).
- **D-B** Keep the existing 4-phase split (Final Assembly / Leak Test / Camera Test / Imballaggio). No restructure to Setup/Production/Outbound/Teardown — too risky for the demo.
- **D-C** Accept that pre-retry step ref execution at "Riprova" click is NOT implemented. Refs appear in the workflow editor for the process engineer; runtime falls back to direct device cycle re-launch.
- **D-D** Use `name.match(/Recovery/i)` as the HMI page filter signal — same convention `PNE_WORKFLOW_V1_COUNTS.recoveryGroups` already uses.

### Changes

- **Seed** `packages/prisma/seed/pneumatic-data/workflow-v1.ts`:
  - Removed 8 inline recovery steps: REC-LEAK-DIAG, REC-LEAK-ATT-1, REC-LEAK-ATT-2, REC-LEAK-SCRAP, REC-CAM-DIAG, REC-CAM-ATT-1, REC-CAM-ATT-2, REC-CAM-SCRAP.
  - Replaced with 2 dedicated "refs only" groups holding 3 hidden steps (category=`recovery`):
    - B2 — Leak Recovery (refs): STEP-LEAK-RECOVERY-CHECK + STEP-LEAK-RECOVERY-CLEAN
    - C2 — Camera Recovery (refs): STEP-CAM-RECOVERY-CLEAN
  - Added new group C3 — Conformity Check with STEP-CONFORMITY-001 (binary manual_choice: Conforme / Non conforme).
  - Updated STEP-LEAK-007 + [3.3] decision step instructions to reference the D5 RecoveryFlow inline panel + D4.2 HMIScrapForm modal (no longer reference inline B2/C2 sub-flow).
  - Counts: 4 phases / **7 groups (was 6)** / **30 steps (was 34)** / 2 recovery-refs groups.
- **HMI** `apps/hmi/src/app/wo/[id]/page.tsx`:
  - Added `RECOVERY_GROUP_PATTERN = /Recovery/i` + `isRecoveryRefStep(step)` predicate.
  - Derived `visibleSteps` memo filters out recovery-refs steps from: linear render, active step pick, allTerminal computation, auto-start parallel effect, progress bar counters.
  - Hidden ref steps remain in the underlying `steps` array for ID-based lookups (NOK / scrap) but never reach the operator surface.
- **Tests**:
  - `__tests__/inline-recovery.test.ts` rewritten: asserts 0 inline REC-* names + 3 hidden recovery-refs in 2 dedicated groups + decision step instructions reference RecoveryFlow + C3 Conformity Check shape.
  - `__tests__/workflow-v1.test.ts` counts rebaselined: groups 6→7, steps 34→30, groupsPerPhase [1,2,2,1]→[1,2,3,1], stepCounts [8,9,4,4,4,5]→[8,9,2,4,1,1,5]. Added `recovery` to validStepCategories.
  - `__tests__/workflow-v0.test.ts` count assertion bumped 34→30.
  - New `apps/hmi/src/app/wo/[id]/components/recovery-refs-filter.test.ts` (6 tests) pins the `isRecoveryRefStep` rule against future regression.

### Verification (May 3, 2026)

- ✅ Build 13/13 successful (`pnpm build`)
- ✅ Lint clean (only pre-existing PNE_3 hmi `<img>` warnings, unchanged)
- ✅ All **744 tests pass** (was 734, **+10 net**: prisma 18→22 from rewritten inline-recovery suite, hmi 30→36 from new filter test):
  - api 284 / domain 197 / ui 119 / web 38 / hmi **36** / schemas 29 / prisma **22** / cache 8 / storage 6 / queue 5
- ⏳ Manual `pnpm dev` smoke (recovery modal flow end-to-end after re-seed) — pending operator sign-off before commit per workflow rules.

### Lessons learned (Lesson 58)

- **Lesson 58 (SEED_CLEANUP pre-flight)**: shipping a full UI surface (D4.1 recoveryConfig section + D4.2 ScrapForm + D5 RecoveryFlow inline panel) does not by itself produce a working runtime feature. The recoveryConfig field flows through the editor but never reaches the runtime: no schema column, no DTO projection, no HMI read. Pre-flight on the SEED_CLEANUP hotfix surfaced the gap before touching code; without that step we'd have shipped a seed that documents pre-retry refs that the runtime can't execute. Practical guideline: when a hotfix promises behaviour that depends on cross-layer plumbing (editor → DB → DTO → HMI runtime), trace the read path explicitly during pre-flight, not just the write path.

### Files changed

```
packages/prisma/seed/pneumatic-data/workflow-v1.ts
packages/prisma/seed/pneumatic-data/__tests__/workflow-v1.test.ts
packages/prisma/seed/pneumatic-data/__tests__/workflow-v0.test.ts
packages/prisma/seed/pneumatic-data/__tests__/inline-recovery.test.ts          (rewritten)
apps/hmi/src/app/wo/[id]/page.tsx
apps/hmi/src/app/wo/[id]/components/recovery-refs-filter.test.ts                (new)
TODO.md                                                                          (TODO-040 extended)
STATUS.md                                                                        (this entry)
```

---

## 🎉 F1 (Pneumatic First) — 100% complete (May 3, 2026)

Pneumatic Air vertical demo path is end-to-end functional: workflow editor with Action Type catalog + autofill + photo upload (D1) → HMI Step Generic with device cycle dispatch (TODO-043 closed in D2 at runtime) → parallel slots split layout during the leak cycle (D3) → page.tsx wiring + recovery configurable + scrap form with cause code & photo (D4).

### F1 closure summary

| PROMPT | Closed | Commits | Tests added | Cumul | Key deliverable |
|---|---|---|---|---|---|
| F1.1 DS_LIFT | 2026-05-02 | 14 patterns lifted to `@mes/ui` | — | — | foundation primitives |
| F1.2 PROMPT_3d | 2026-05-02 | palette ungated, phase-columns canvas, 3-tab inspector | — | — | workflow editor mockup-faithful |
| F1.3 PROMPT_PNE_1 | 2026-05-02 | step configurator with 6 resource tabs + 8 action forms | — | — | step builder UX |
| F1.4 PROMPT_PNE_2 | 2026-05-02 | 4 D increments | +18 | 655 | Pneumatic seed (workflows v0/v1, 34 steps, 3 recipes) |
| F1.5 PROMPT_PNE_3 | 2026-05-02 | 4 D increments + 2 hotfixes | +37 | 692 | mock simulators + DemoToggle + FastForward |
| F1.6 PROMPT_PNE_4_FOCUSED | 2026-05-03 | 4 D increments | **+42** | **734** | Action Type + photo, HMI device cycle, parallel slots, recovery + scrap, F1 closure |
| **Total residual F1 tests** | | | **+97** | **734** | |

### Lessons accumulated through F1

- **Lesson 54**: Vitest 2.1 + Windows multi-worker temp-dir race. Mitigated per-package via `--no-file-parallelism` (api / domain) or `fileParallelism: false` baked into `vitest.config.ts` (web / hmi added in PNE_4).
- **Lesson 55**: TypeScript constructor params with function default values trigger Nest DI Function-resolution. Use `@Optional()` proactively (PNE_3 D4 hotfix #1).
- **Lesson 56**: NestJS auth guards run before method handlers. Use `@Public` (or no guards) for debug-only `/api/internal/*` routes; rely on env-var fallback (`DEMO_USER_ID`, `DEMO_PLANT_ID`) when no JWT context. Always run `pnpm dev` post-Dn to catch DI/auth runtime issues — not just `pnpm test` (PNE_3 D4 hotfix #2 + PNE_4 D2 boot smoke confirmed dispatcher path live end-to-end).
- **Lesson 57 (PNE_4 D4.0)**: shipping new HMI components doesn't make them visible — host pages must mount them. The PNE_4 D2 work shipped `StepGeneric` + `DeviceCycleView` but the existing `apps/hmi/src/app/wo/[id]/page.tsx` continued rendering `StepCard` for every step. Caught during user-side smoke after D2 commit; fixed in D4.0 by routing the active `device_run` device_main group to `<DeviceCycleWithParallels />` directly. Pinned by a regression test on the `isDeviceCycleStep` detection rule.

### Demo-ready confirmation (May 3, 2026)

- ✅ All 13 packages build clean (`pnpm build`)
- ✅ `pnpm lint` clean (only pre-existing PNE_3 hmi `<img>` warnings, no errors)
- ✅ All 734 tests pass: api 284 / domain 197 / ui 119 / web 38 / hmi 30 / schemas 29 / prisma 18 / cache 8 / storage 6 / queue 5
- ✅ Lesson 56 boot smoke (PNE_4 D2): API + DI graph clean, dispatcher end-to-end runtime verified (Mario Rossi START on STEP-LEAK-003 → 45s simulator → step status `done` result `ok`)
- ✅ Env templates committed: `apps/api/.env.example`, `apps/web/.env.local.example`, `apps/hmi/.env.local.example`
- ✅ CLAUDE.md "Demo mode setup" section added

### F2 (post-demo, 21 May+)

F2 begins after the Reflex Allen demo. PROMPT_6 (Andon + Plant Overview) is first; refer to `ROADMAP.md` § 2 F2.

---

## ✅ PROMPT_PNE_3 — Mock device simulator + Demo Toggle Panel — 100% complete (May 2, 2026)

F1.5 of ROADMAP v2 (Pneumatic First). Three demo-grade device simulators (LeakTester / CameraTester / CrimpPress) with deterministic outcome bands keyed off the PROMPT_PNE_2 seeded recipes; WS broadcast of `device:cycle:started/progress/complete` on the existing `WorkOrderEventsGateway`; REST controls under `/api/internal/mock-devices/*`; `/api/internal/fast-forward/:woId/complete-step` debug endpoint; back-office Demo Toggle Panel at `/demo` (server-gated `notFound()` + client polling 2s + Italian Toast feedback). Every surface gated on `DEMO_MODE=true`; production builds refuse to boot if `DEMO_MODE` is unset.

### Test count

- **Baseline (post PROMPT_PNE_2 D4)**: 655
- **Final**: **692** (api 281 / domain 197 / ui 119 / schemas 29 / cache 8 / queue 5 / storage 6 / web 29 / prisma 18)
- **Delta**: **+37 tests** (target floor +12 → ≥667, ideal +18 → ≥673; achieved with +19 buffer over ideal)

### D1-D4 breakdown

| Increment | Scope | Test delta | Cumul | Commit |
|---|---|---|---|---|
| D1 | MockDevicesModule + types + DemoControllerService + MockLeakTesterService + REST controller (gated DEMO_MODE) + WorkOrderEventsGateway emitDeviceCycle{Started,Progress,Complete} broadcasts + main.ts boot guard + .env.example DEMO_MODE | +17 | 672 | `53347fa` |
| D2 | MockCameraTesterService (4 ROIs/PASS-FAIL) + MockCrimpPressService (25kN ±1/PASS-FAIL) + controller route refactor `/api/internal/mock-devices/*` (`override-next` / `start-cycle`) + `/demo` page scaffolding + DeviceCard primitive | +12 | 684 | `a3e5f4e` |
| D3 | `MockDeviceStatus.lastOutcome` (set on complete, cleared on next start) on all 3 simulators + `/demo` server/client split (server gate + client polling 2s + Toast IT) + override + start handlers + DeviceCard `lastOutcome` badge + override-scheduled message + TODO-044 (WS deferral) | +3 | 687 | `f9cb037` |
| D4 | FastForwardController (`/api/internal/fast-forward/:woId/complete-step` mapping PASS/FAIL/SCRAP → COMPLETE_OK/COMPLETE_NOK/MARK_SCRAPPED via existing StepExecutionService.applyTransition) + WorkOrdersModule import + STATUS / ROADMAP / TODO closure | +5 | **692** | _this commit_ |

### Architectural decisions (kept after D4)

1. **Deferred device-execution integration (Issue 3 / TODO-043 / Option 3b)**: PROMPT_PNE_3 § 3.4 assumed `apps/api/src/modules/work-orders/step-execution/device-step-executor.ts` already existed (presumed-shipped by PROMPT_5_FULL D3). It does NOT — the actual `step-execution.service.ts` is purely XState-driven and never calls a "device client". Creating the device-execution dispatch branch from scratch is out of PROMPT_PNE_3's 8-12h budget per § 8 surprise budget. Resolution: ship standalone simulators reachable via `/api/internal/mock-devices/*` + DemoToggle UI + FastForward (which drives the existing state machine API directly, no new dispatch branch). Wiring the `SimulatorRegistry` into step-execution dispatch when an HMI operator advances a `device_run` step is owned by **PROMPT_PNE_4 D1** (HMI Leak/Camera specialized work) — tracked by TODO-043 with full acceptance criteria.

2. **MARGINAL outcome scoped to LeakTester only**: leak rate has a real grey zone (0.5..1.0 mbar/min — passing under spec but flagged for retest). Camera ROI similarity and crimp force tolerance are binary tolerance checks — values either pass or fail, no MARGINAL. `MockDevice.supportedOutcomes` declares this per-device and the controller's `parseOutcomeBody` rejects MARGINAL on camera/crimp with BadRequest. DeviceCard hides the MARGINAL button when not supported.

3. **2s polling vs WebSocket (TODO-044, deferred)**: simulators broadcast `device:cycle:started/progress/complete` on `WorkOrderEventsGateway` since D1, but apps/web `DemoPanel` uses a `setInterval(2000ms)` polling loop on `listMockDevices()` instead. Polling is sufficient for the demo (3 devices, low traffic) but adds ~30 req/min/tab and aliases sub-second crimp telemetry to 2s ticks. Replacement with `useDeviceEventsSubscription` hook + `socket.io-client` tracked in TODO-044 (Medium, 1-2h, owner F2 PROMPT_7 or earlier if demo prep flags lag).

4. **`/api/internal/*` namespace for debug-only surfaces**: PROMPT_PNE_3 § 3.3 said `/api/mock-devices/*`. Per the user's D2 instruction, all debug routes live under `/api/internal/*` (mock-devices + fast-forward) to give ops a clear "this isn't part of the production API surface" signal. Combined with the `DEMO_MODE` controller gate + main.ts boot guard, that's three layers of safety against accidental production exposure.

5. **`/demo` server/client split (Next.js 14 pattern)**: `app/demo/page.tsx` stays as a server component that calls `notFound()` if `NEXT_PUBLIC_DEMO_MODE != 'true'` (so non-demo deployments don't ship the JS bundle at all); the interactive `<DemoPanel>` is the only `'use client'` component on the route. Mirrors the dynamic-import idiom but works at the route level. The `ToastProvider` is wrapped inside `DemoPanel` because the `/demo` route has no parent `(registries)` layout (no shared sidebar / chrome).

### TODOs closed by PROMPT_PNE_3

- _none directly closed_ — PROMPT_PNE_3 was greenfield.

### TODOs opened by PROMPT_PNE_3

- **TODO-043** — Wire SimulatorRegistry into step-execution dispatch (deferred). Owner: **PROMPT_PNE_4 D1**. HIGH priority. PNE_3 ships standalone simulators + DemoToggle + FastForward as the reachable surfaces; step-execution auto-dispatch when an operator advances a `device_run` step is the natural extension.
- **TODO-044** — DemoToggle Panel: replace 2s polling with WebSocket subscription. Owner: **F2 PROMPT_7** (or earlier if demo prep flags polling lag on crimp's 100ms telemetry). MEDIUM priority. Simulator broadcasts already exist (D1) — only the apps/web subscription is missing.

### Verification commands (final)

```
pnpm install                                            # already installed, no-op (729 pkgs)
pnpm --filter @mes/prisma generate                      # already generated by turbo prisma:generate task
pnpm build                                              # 13/13 successful
pnpm lint                                               # 3/3 (apps/web ESLint clean; apps/api type-check clean)
pnpm --filter @mes/api      exec vitest run --no-file-parallelism   # 281/281 pass (24 + 6 mock-devices test files)
pnpm --filter @mes/domain   exec vitest run --no-file-parallelism   # 197/197 pass
pnpm --filter @mes/ui       test                                    # 119/119 pass
pnpm --filter @mes/schemas  test                                    # 29/29 pass
pnpm --filter @mes/cache    test                                    # 8/8 pass
pnpm --filter @mes/queue    test                                    # 5/5 pass
pnpm --filter @mes/storage  test                                    # 6/6 pass
pnpm --filter @mes/web      exec vitest run --no-file-parallelism   # 29/29 pass (24 baseline + 3 DeviceCard + 2 DemoPanel)
pnpm --filter @mes/prisma   test                                    # 18/18 pass
```

Note: per-package serial run (`--no-file-parallelism`) used for `@mes/api`, `@mes/domain`, `@mes/web` to dodge the documented Vitest 2.1.x + Windows temp-dir race (Lesson #54 from STATUS history).

Runtime smoke deferred to user pre-merge per CLAUDE.md PHASE 4. Suggested checks (assumes `.env` populated with `DEMO_MODE=true` + `NEXT_PUBLIC_DEMO_MODE=true` and dev DB seeded via `pnpm --filter @mes/prisma seed:pneumatic`):

1. `pnpm dev` — API on 3000, web on 3001, hmi on 3002.
2. Open http://localhost:3001/demo (back-office, port 3001).
3. Verify 3 device cards (DEV-LEAK-001 / DEV-CAMERA-001 / DEV-CRIMP-001) — each with default PASS, idle status, expected duration (45s / 8s / 8s).
4. Click "Force FAIL" on DEV-LEAK-001 → toast "Override programmato su DEV-LEAK-001: FAIL ...". Card body shows "Override programmato: FAIL".
5. Click "Start cycle" on DEV-LEAK-001 → toast "Ciclo avviato su DEV-LEAK-001". Card transitions to RUNNING badge; buttons disabled.
6. Wait ~45 seconds (or polling tick at 2s). Card returns to IDLE with `Ultimo: FAIL` badge in the header.
7. FastForward smoke (curl):
   ```
   curl -X POST http://localhost:3000/api/internal/fast-forward/<woId>/complete-step \
     -H 'Content-Type: application/json' -H 'Cookie: <login JWT cookie>' \
     -d '{"stepExecutionId":"<seId>","outcome":"PASS"}'
   ```
   Should return 200 with `{ result: { fromStatus: 'running', toStatus: 'done', event: 'COMPLETE_OK', ... } }`.
8. With `DEMO_MODE=false`: `/api/internal/mock-devices` and `/api/internal/fast-forward/...` both return 404; `/demo` page returns 404.

---

## ✅ PROMPT_PNE_2 — Pneumatic Air seed (double workflow + WO) — 100% complete (May 2, 2026)

F1.4 of ROADMAP v2 (Pneumatic First). Seeds the dev SQLite DB with the Pneumatic Air production reality so demo path is one-command-ready (`pnpm --filter @mes/prisma seed:pneumatic`). Idempotent. Coexists with the baseline seed (`pnpm db:seed`) — different unique codes throughout.

### Test count

- **Baseline (post PROMPT_PNE_1 D4)**: 637
- **Final**: **655** (api 249 / domain 197 / ui 119 / **prisma 18** / schemas 29 / cache 8 / queue 5 / storage 6 / web 24)
- **Delta**: **+18 tests** (target floor +12 → ≥649, ideal +16 → ≥653; achieved +18 = +6 above floor, +2 above ideal)

### D1-D4 breakdown

| Increment | Scope | Test delta | Cumul | Commit |
|---|---|---|---|---|
| D1 | Plant hierarchy (1 area / 4 WCs / 4 WSs / 3 devices) + 5 items + 1 BoxType + 3 recipes (4 versions) + 4 skills + 2 operators (Mario Rossi 1234, Anna Verdi 5678 — argon2id) + vitest setup for `@mes/prisma` | +5 | 642 | `57b40e1` |
| D2 | 6 cause codes + 10 fault codes (CauseCode workaround S1) + 3 attention points + WO-2026-PNE-0042 draft (Mario Rossi proposed) | +4 | 646 | `6529541` |
| D3 | Workflow v1 (4 phases / 6 groups / 34 steps incl. inline recovery B2 + C2) + WO release transition (draft → released, assignment → accepted, snapshot 18958 chars JSON, 34 StepExecution rows) | +6 | 652 | `94d9ab2` |
| D4 | Workflow v0 (Empty) scaffold + status enum mapping helper + TODO-031 turbo fix + STATUS / ROADMAP / TODO closure | +3 | **655** | _this commit_ |

### Architectural decisions (kept after D4)

1. **S1 — FaultCode model is MISSING from `packages/prisma/schema.prisma`** (§ 5 STOP discovered in D1 pre-flight, user-confirmed workaround):
   - 10 fault codes seeded as `CauseCode` rows with `category='recovery_fault'`.
   - Phase scope (`leak`/`camera`) encoded BOTH in `phase` column AND in `LK-*`/`CM-*` code prefix (redundant for HMI Recovery dropdown lookup).
   - Severity (absent in CauseCode schema) encoded in description text as `Severity: high|medium|low`.
   - Recovery diagnosis steps reference fault codes by code-string in `instructions` text (no `Step.recoveryFaultCodes[]` FK).
   - Tracked by **TODO-041** (split FaultCode into first-class model in F2 / PROMPT_7). Future fault codes for other phases (PACK/ASSY/etc.) would need to extend the phase enum AND prefix vocabulary — decide explicitly when promoting.

2. **S2 — Recovery sub-flows modeled as INLINE groups** (existing TODO-036, user-confirmed):
   - PROMPT_PNE_2 § 3.2 specified `wf-leak-recovery-pne` and `wf-camera-recovery-pne` as separate Workflows linked from decision steps; the schema lacks `Step.onNokTargetWorkflowId` so this is impossible without migration (out of scope per § 4).
   - Workaround: Group **B2 — Leak Recovery (inline)** under Phase 2 + Group **C2 — Camera Recovery (inline)** under Phase 3, both with `supportsRecovery=true` and 4 steps (diagnosis → 2 retries → scrap).
   - Decision steps (`STEP-LEAK-007` and `[3.3]`) reference the recovery group by name in their `instructions` text (text-based loose-coupling).
   - Final shape: 4 phases / **6 groups** (4 main + 2 inline recovery) / **34 step rows** (8 + 9 + 4 + 4 + 4 + 5).

3. **S3 — `parallelStepsBufferSec` field MISSING on Group/Step** (user-confirmed):
   - PROMPT § 3.2 specifies `parallelStepsBufferSec: 5` for Group B1's device-execution; the schema has no such column.
   - Workaround: encode `parallelStepsBufferSec: 5` in `STEP-LEAK-003.instructions` text. Tracked by existing **TODO-040** dependency (workflow step `config Json?` column).

4. **S4 — `WorkOrderAssignment` schema has no workstation FK**:
   - PROMPT § 3.2 says WO is "assigned to WS-LEAK-01 + WS-ASSY-01 + WS-CAMERA-01 + WS-PACK-01"; schema only has `(workOrderId, operatorId)` per assignment row.
   - Workaround: workstation context is implicit via the workflow's step→deviceId chain (each step's device's equipmentNode ancestry resolves to a workstation). Single `WorkOrderAssignment` row created for Mario Rossi (operator). Anna Verdi seeded as a usable login but not assigned to this WO (PROMPT spec lists only Mario in `assignedOperators`).

5. **PROMPT § 1 "19 steps" undercount vs § 3.2 enumeration of 26+8=34**:
   - Trust the per-step enumeration in § 3.2 (informal undercount in § 1 summary). Documented for future PROMPT spec rewrites — see **TODO-042** doc-hygiene entry.

6. **WorkflowSnapshot creation bypasses release service** (mirrors baseline `WF-PNEU-CURE-DEMO` pattern in `seed.ts:498-696`):
   - Release service (`apps/api/src/modules/work-orders/release.service.ts`) requires API request context (operator session, audit user) unavailable in a seed.
   - Seed manually clones the WorkflowVersion tree via `cloneWorkflowTree` from `@mes/domain` (added as workspace dep on `@mes/prisma`), JSON-serializes to `WorkflowSnapshot.snapshotData`, creates 34 `StepExecution` rows with `status=pending` + `startedAt=releasedAt`. Idempotent: snapshot is `@unique` on workOrderId; per-step executions checked via `findFirst`.

7. **Vitest 2.1.x Windows parallel-runner flake — per-package strategies are NOT uniform** (expansion of STATUS lesson 54 originally documented as @mes/ui-only):
   - Discovered during PROMPT_PNE_2 D1 + D3 that the flake also affects `@mes/domain` (drops 2-3 of 15 test files randomly) and `@mes/ui` (drops 2 of 29 randomly — confirmed run 1 = 119/29, run 2 = 107/27).
   - Per-package mitigation table:
     | Package | Strategy | Notes |
     |---|---|---|
     | `@mes/prisma` | `pool=forks` + `singleFork=true` | Pure Node, no DOM. Set in vitest.config.ts |
     | `@mes/ui` | Default parallel runner; re-run on flake | `singleFork` BREAKS jsdom DOM cleanup between tests |
     | `@mes/domain` | `singleFork` works; default also works most runs but flakes 2-3 files randomly | No DOM |
     | `@mes/web` | Default works because `afterEach(cleanup)` was added in PROMPT_PNE_1 D4 | jsdom cleanup workaround |
     | `@mes/api`, `@mes/schemas`, `@mes/cache`, `@mes/queue`, `@mes/storage` | Default works | Stable on these |
   - Standardizing across all packages estimated 1-2h backend (F2 polish opportunity, not in PROMPT_PNE_2 scope).

8. **Skill code prefix corrected vs initial plan**: plan agent claimed baseline used `SKILL-` prefix; verification of `seed.ts:33-42` showed BARE codes (`EXT, ASSY, QC, TEST, ...`). PNE_2 seed uses bare codes too — `IDENTIFICATION` is the only net-new (3 baseline-shared: ASSY, QC, TEST).

9. **Operator-name conflict spurious**: plan agent claimed existing seed had Mario Rossi / Anna Verdi at OP-002/OP-003. Verification showed Marco Rossi / Laura Ferrari / Giovanni Bianchi / Sara Conti. Net-new badges (1234/5678) + net-new names → no conflict, no name suffix needed.

### TODOs closed by PROMPT_PNE_2

- **TODO-031** — Turbo dependsOn fix for Prisma client cache gap. Closed (validated below).

### TODOs opened by PROMPT_PNE_2

- **TODO-041** — Split FaultCode from CauseCode (currently colocated under category='recovery_fault'). Owner: F2 / PROMPT_7 (or earlier if HMI Recovery PROMPT_PNE_4 needs proper FK semantics).
- **TODO-042** — PROMPT_PNE_2 § 1 summary said "19 steps" but enumeration totals 34 step rows. Documentation hygiene only — no code action.

### TODO-031 fix — validation evidence

```
turbo.json @mes/prisma#generate task added (cache: false, inputs: schema.prisma)
build pipeline gains dependsOn ["@mes/prisma#generate"]

Simulated clean state procedure (per user instructions):
  1. mv node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma → .prisma.backup
  2. pnpm build → "Tasks: 13 successful, 13 total | Cached: 12 cached, 13 total" (generate runs fresh, downstreams cached)
  3. ls .prisma → client/ ✓ regenerated
  4. pnpm --filter @mes/prisma seed:pneumatic → ✓ runs end-to-end (proves runtime client works)
  5. rm -rf .prisma.backup → cleaned
```

All 4 acceptance criteria met. TODO-031 closed.

### Verification commands (final, May 2 2026)

```
pnpm install                              # clean (729 packages, 25.4s)
pnpm --filter @mes/prisma db:reset / db:push  # fresh SQLite
pnpm --filter @mes/prisma db:seed         # baseline (5 WOs, 3 templates, demo workflow)
pnpm --filter @mes/prisma seed:pneumatic  # 1st run — creates all PNE entities + 34 step executions
pnpm --filter @mes/prisma seed:pneumatic  # 2nd run — idempotent, 0 new step executions
pnpm build                                # 13/13 successful (was 12 — generate is the new task)
pnpm lint                                 # 3/3 (0 warnings, FULL TURBO cache)
pnpm --filter @mes/api      test          # 249/249 pass
pnpm --filter @mes/domain   test          # 197/197 pass (default config; flake mitigated by re-run if hit)
pnpm --filter @mes/ui       test          # 119/119 pass (default; flake confirmed — re-run on miss)
pnpm --filter @mes/prisma   test          # 18/18 pass (15 files; singleFork bypasses Windows tmp-race)
pnpm --filter @mes/schemas  test          # 29/29
pnpm --filter @mes/cache    test          # 8/8
pnpm --filter @mes/queue    test          # 5/5
pnpm --filter @mes/storage  test          # 6/6
pnpm --filter @mes/web      test          # 24/24
```

### Manual smoke (DoD § A-F)

Verified end-to-end on May 2, 2026:

- ✅ A — Fresh DB: `rm dev.db && db:push` → schema applied
- ✅ B — Baseline seed: `db:seed` → MOCK_DATA_PNEUMATIC_AIR loaded (Plant + 4 baseline ops + 5 WOs + WF-PNEU-CURE-DEMO + 3 templates)
- ✅ C — PNE seed 1st run: 1 area / 4 WCs / 4 WSs / 3 devices / 5 items / 1 BoxType / 3 recipes (4 versions) / 4 skills / 2 operators / 6 cause codes / 10 fault codes / 3 APs / 1 WO (released) / 1 workflow v1 (4 phases / 6 groups / 34 steps) / 1 workflow v0 (empty) / 1 snapshot / 34 step executions
- ✅ D — PNE seed 2nd run: idempotent, 0 new step executions, snapshot reused, all upserts no-op
- ✅ E — TODO-031 turbo fix validated: `.prisma/client` removed → `pnpm build` → regenerated transparently → seed runs
- ⏭️ F — UI smoke deferred to user pre-merge per CLAUDE.md PHASE 4. Suggested checks per ROADMAP § 4.6:
  - `Remove-Item -Recurse -Force apps\web\.next; pnpm dev`
  - `localhost:3001/workflows` → verify `wf-pneumatic-air-680-v1` (Active/approved) + `wf-pneumatic-air-680-v0` (Draft) appear in list
  - Open v1 detail → 4 phases + 6 groups + 34 steps render
  - Open v0 detail → empty canvas with palette ungated (PROMPT_3d palette behavior)
  - `localhost:3001/work-orders` → `WO-2026-PNE-0042` in `released` state, qty 100, Mario Rossi (badge 1234) assigned

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

55. **TypeScript constructor params with function default values trigger Nest DI Function-resolution attempts**: Symptom: `Nest can't resolve dependencies of X (..., ?)` at boot, despite test-green via direct instantiation. Cause: TS emits `Function` parameter metadata for `random: () => number = Math.random`; Nest tries to resolve a `Function` provider for that index and fails. Fix: `@Optional()` decorator on the parameter so Nest skips DI and uses the default value. Detection gap: unit tests using `new ServiceX(...)` bypass the DI container entirely; only runtime smoke (`pnpm dev`) catches it. Going forward: when introducing services with function-typed default-value constructor args, either (a) add `@Optional()` proactively, or (b) add a minimal NestJS-bootstrap integration test that wires through the DI container, not just direct instantiation. (Encountered: PROMPT_PNE_3 D4 hotfix, May 3, 2026 — affected MockLeakTester / MockCameraTester / MockCrimpPress.)

56. **Auth-strategy decisions must be explicit per controller; method-level gating runs AFTER guard**: Symptom: `/api/internal/mock-devices` returned 401 instead of the expected 404-when-DEMO_MODE-off, blocking the back-office /demo page. Cause: PNE_3 added `@UseGuards(JwtAuthGuard)` at the class level on both mock controllers, but the DEMO_MODE check (which throws 404) lives inside the method body — guards always fire first, so the demo page got 401 before the method ever ran. Architectural note: this codebase has NO global JWT guard and NO `@Public()` decorator — auth is opt-in per controller via `@UseGuards`. To make a route public, simply omit the decorator. Fix: removed `@UseGuards` from both `/api/internal/*` controllers; FastForward (which uses `req.user.id`/`plantId` for audit) now falls back to `DEMO_USER_ID`/`DEMO_PLANT_ID` env vars when no session is present. Detection gap: same as Lesson 55 — unit tests instantiate controllers directly and synthesize `req.user`, so neither the guard nor the missing-user path is exercised; only HTTP-level smoke catches it. Going forward: when introducing a new controller, write a one-line comment at class declaration stating the auth posture (Public / Authenticated / Role-Based) and the rationale, so the choice is reviewable rather than implicit. (Encountered: PROMPT_PNE_3 D4 hotfix #2, May 3, 2026.)

### PROMPT_DESIGN_ALIGNMENT D4 closure — 2 new (Lessons 59 + 60)

59. **Worktree corruption recovery via git plumbing**: Mid-session, Claude Code worktrees can develop stale `.git` references that prevent normal `git push` / `git merge` from inside the worktree (symptom: "fatal: not a git repository" when the worktree's `.git` file points at a removed entry in `<parent>/.git/worktrees/`). **Recovery pattern**: from the parent repo, set `GIT_DIR=<parent>/.git` and use plumbing — `git commit-tree` to materialize the worktree state as a commit + `git update-ref refs/heads/<branch>` to attach it. **Anti-pattern**: `git worktree remove --force` on an unmerged branch destroys uncommitted work. **Real case**: D2 Batch 4.5 + 5 worktree divergence — reconciled in 5 steps: (1) commit in worktree, (2) push branch, (3) ff-merge to main from parent repo, (4) push main from parent, (5) cleanup worktree. Going forward: never `--force` a worktree remove without first verifying the branch is fully merged upstream. (Encountered: PROMPT_DESIGN_ALIGNMENT D2-D3 transition, May 3, 2026.)

60. **Worktree consolidation discipline**: Each Claude Code session that uses an isolated worktree creates a `node_modules/` of ~700 MB - 1 GB. Accumulated zombie worktrees waste disk and create symlink hell on Windows long-path projects. **Pattern**: after EVERY batch closure, consolidate to main + `git worktree remove <path>` + `git branch -D <branch>` (local) + `git push origin --delete <branch>` (remote). **On Windows specifically**: `git worktree remove` can fail with "Result too large" when path length > 260 chars — git de-registers the worktree internally but the physical folder remains. **Workaround**: `robocopy /MIR <empty-folder> <stale-worktree-path>` to truncate the directory contents below the path-length limit, then `Remove-Item -Recurse -Force` succeeds. Apply discipline retroactively — long-running projects accumulate orphans fast. (Encountered: PROMPT_DESIGN_ALIGNMENT D3 batches 6-9, May 3, 2026.)

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


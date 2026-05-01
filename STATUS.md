# RAMS-Reflexallen-MES — Project Status

> **Last update**: May 1, 2026, late evening (🎉 **PROMPT_4 complete in 45 min**)
> **Repository**: https://github.com/antonellacolantuono-jpg/MES
> **Stack**: NestJS + Next.js 14 + Prisma SQLite + pnpm Turborepo + shadcn-style + Reflexallen design system

---

## 🎉 Major milestones reached today

```
✅ PROMPT_5_FULL — 100% (May 1 evening)
✅ PROMPT_4      — 100% (May 1 late evening, 45 min vs 3-4h budget)
```

**6 PROMPT su 8 completati al 100%.** Restano solo PROMPT_3b_FULL, PROMPT_3c, PROMPT_6.

---

## 📜 Project history (timeline)

- **April 27** — PROMPT_1 Foundation drafted
- **April 28** — PROMPT_2 Registries audited + recovered. PROMPT_3a D1-D3 merged
- **April 29** — PC migration. PROMPT_3a D4-D6 merged. PROMPT_3a complete
- **April 30 morning** — PROMPT_3b_REDUCED merged
- **April 30 afternoon** — PROMPT_5_LITE merged
- **April 30 evening** — PROMPT_5_FULL D1+D2 merged
- **April 30 late evening** — PROMPT_5_FULL D3 merged
- **May 1 morning** — PROMPT_5_FULL D4 merged
- **May 1 afternoon** — PROMPT_5_FULL D5 merged
- **May 1 evening** — PROMPT_5_FULL D6 merged. **PROMPT_5_FULL 100% complete**
- **May 1 late evening** — **PROMPT_4 merged. AutoGenEngine + 7 resolvers + dry-run preview** (45 min execution time)

---

## ✅ Current state (verified May 1 late evening)

### PROMPT_1-3a-3b_REDUCED-5_LITE
(All complete — see git log for details)

### PROMPT_5_FULL — Production-grade HMI execution (✅ 100% complete)
6 deliverable: D1 Argon2+JWT, D2 HMI auth, D3 11-state machine, D4 parallel swimlane, D5 recovery+QC review, D6 WO release+Socket.IO.

### PROMPT_4 — Auto-Generation Engine (✅ 100% complete — NEW May 1 late evening)

**Strategia A approved**: implement logic for the 7 code-generator rules already seeded in PROMPT_2 (visible at `/auto-gen-rules`).

**8 deliverable consolidated in single atomic commit `b9c7472`** (45 min Claude Code time):

**D0 — Schema verification (ZERO new migration)**
- All 6 entity Prisma models verified to exist (Lot, Box, MaintenanceOrder, RecipeVersion, Sample, DowntimeEvent)
- Schema realities discovered:
  - `Lot` uses `lotNumber` (not `code`) with `(plantId, lotNumber)` unique
  - `Box.code` is globally `@unique` (no plantId scope)
  - `RecipeVersion.version Int` (not semver string)
  - `Sample.sampleNumber Int` and `DowntimeEvent` have no `code` field
- Conclusion: count-based pattern from D6 reusable for all 7 resolvers, no schema changes needed

**D1 — Engine core**
- ✅ `apps/api/src/modules/auto-gen-engine/auto-gen-engine.service.ts` — Strategy pattern with DI registry
- ✅ `auto-gen-engine.module.ts` wires 7 resolvers + dry-run controller
- ✅ `interfaces/auto-gen-resolver.interface.ts` defines `IAutoGenResolver<C>`
- ✅ `types.ts` exports `RULE_IDS` enum
- ✅ +7 service tests (registry lookup, missing rule, multi-resolver dispatch, exception propagation)

**D2 — 7 resolvers**
- ✅ `lot-code.resolver.ts` (LOT-{ITEM}-{YEAR}-{SEQ}, +7 tests)
- ✅ `wo-code.resolver.ts` (WO-{YYYYMMDD}-{NNN}, +6 tests, byte-identical extraction from D6)
- ✅ `box-code.resolver.ts` (BOX-{TYPE}-{SEQ}, +6 tests)
- ✅ `maintenance-code.resolver.ts` (MAINT-{EQUIPMENT}-{SEQ}, +6 tests)
- ✅ `recipe-version.resolver.ts` (vN.0.0 from `version Int` count, +6 tests)
- ✅ `sample-id.resolver.ts` (SAMPLE-{WO}-{STEP}-{SEQ}, +7 tests)
- ✅ `downtime-event-id.resolver.ts` (DOWN-{EQUIPMENT}-{YYYYMMDD}-{SEQ}, +7 tests)
- Pattern: `prisma.<entity>.count({ where: { ...scope, code: { startsWith: prefix } } })` + padding
- All resolvers independently unit-testable with mocked PrismaService

**D3 — D6 release flow integration (CRITICAL — 17 existing tests stay green)**
- ✅ `release.service.generateWoCode` extracted byte-identically into `WoCodeResolver`
- ✅ `release.service` now delegates: `engine.resolve('2', { plantId, releasedAt })`
- ✅ +1 D3 regression test asserts `engine.resolve('2', ctx) === oldGenerateWoCode(ctx)`
- ✅ WO format unchanged (WO-YYYYMMDD-NNN, per Q2 reconciliation)

**D4 — Dry-run controller**
- ✅ `POST /api/auto-gen-rules/:id/dry-run` with JwtAuthGuard
- ✅ Per-rule Zod discriminated union schema in `packages/schemas/src/registries/auto-gen-rule.schema.ts`
- ✅ Returns `{ code: string, contextEcho: object }` — never writes to DB
- ✅ +8 controller tests (valid dry-run for representative rules, invalid context → 400, unknown ruleId → 404)

**D5 — Web admin dry-run UI**
- ✅ `apps/web/src/app/(registries)/auto-gen-rules/page.tsx` — added "Prova regola" button per card
- ✅ `apps/web/src/app/(registries)/auto-gen-rules/[id]/dry-run/page.tsx` — Italian per-rule input form + result card
- ✅ `AutoGenRulesClient.dryRun(ruleId, context)` added to SDK
- ✅ Corrected `AutoGenRuleModel` SDK shape (removed phantom `code`/`isActive` fields)

**D6 — Schema/service drift fix (opportunistic)**
- ✅ `AUTO_GEN_TRIGGERS` enum in `@mes/schemas` aligned to actual seeded triggers (`lot_created`, `work_order_created`, `box_created`, `maintenance_created`, `recipe_version_created`, `sample_created`, `downtime_created`) — was outdated `work_order_released`, `lot_received`, etc.
- ✅ `AUTO_GEN_SCOPES` aligned to the 7 actual scopes
- ✅ Rule 2 description in `auto-gen-rules.service.ts` updated to `WO-{YYYYMMDD}-{NNN}` (matches D6 reality)

**D7 — Archive obsolete spec**
- ✅ `prompts/PROMPT_4_AUTO_GENERATION.md` (workflow-step enrichment spec — never implemented) moved to `prompts/archive/PROMPT_4_workflow_step_rules_obsolete.md` with deprecation note prepended
- ✅ Pattern consistent with existing archive (`PROMPT_1B_obsolete.md`, `PROMPT_3_WORKFLOW_DESIGNER_obsolete.md`)
- ✅ TODO-027 added: PROMPT_4_PHASE_2 wiring engine to entity creation flows for Lot/Box/Maint/Recipe/Sample/Downtime (~10-15h, post-MVP)
- ✅ TODO-028 added: pointer to archived workflow-step rules spec for potential future PROMPT_4b

**D8 — Final DoD**
- ✅ `pnpm build`: 12/12 successful, 0 errors
- ✅ `pnpm lint`: 3/3 clean
- ✅ `pnpm test`: 431 tests passed across 40 files (was 370/31, +61/+9)
- ✅ `prisma migrate status`: 4 migrations (no new — PROMPT_4 added zero)
- ✅ Single atomic commit `b9c7472` on `claude/musing-lalande-20499e`, pushed and merged via finalize-prompt.ps1

### Verification evidence (May 1 late evening — post-PROMPT_4)

- ✅ `pnpm install`: clean
- ✅ `pnpm build`: 12 successful / 12 total, 0 errors (FULL TURBO cached)
- ✅ `pnpm lint`: 3/3, 0 errors
- ✅ `pnpm test`: **431 tests passed across 40 files**, 0 failed (was 370/31; +61 from PROMPT_4)
- ✅ `prisma migrate status`: 4 migrations (init + pinHash D1 + status D3 + deviceCategory D4), schema in sync — **PROMPT_4 added zero migrations**

### Test breakdown (May 1 late evening — post-PROMPT_4)

| Package | Test files | Tests passed |
|---|---|---|
| `@mes/api` | 22 | 219 |
| `@mes/domain` | 11 | 164 |
| `@mes/schemas` | 3 | 29 |
| `@mes/cache` | 1 | 8 |
| `@mes/storage` | 1 | 6 |
| `@mes/queue` | 1 | 5 |
| **Total** | **40** | **431** |

API additions PROMPT_4: auto-gen-engine.service (7) + 7 resolvers (45) + dry-run.controller (8) + release.service +1 regression = **+61 tests**.

---

## 🟡 Known issues (TODO list)

23 entries currently tracked. PROMPT_4 added TODO-027 + TODO-028. Quick summary:

**HIGH severity (open)**:
- TODO-008 — PARALLEL + TEARDOWN step forms (PROMPT_3b_FULL)
- TODO-010 — Versioning UI lifecycle modals (PROMPT_3b_FULL)
- TODO-017 — Refresh token rotation (D1+D2 partial)

**MEDIUM severity (open)**:
- TODO-001..016 (registry/cosmetic/scope-deferred items)
- TODO-024 — Change-of-shift / hand-off flow (post-MVP)
- TODO-026 — Per-stage StepExecution model (D5 deferral)
- **TODO-027** (NEW) — PROMPT_4_PHASE_2: wire AutoGenEngine to entity creation flows for Lot/Box/Maint/Recipe/Sample/Downtime (~10-15h, post-MVP)
- **TODO-028** (NEW) — Pointer to archived workflow-step rules spec for potential future PROMPT_4b

**LOW severity**:
- TODO-025 — HMI logo cross-reference to TODO-002

**Closed by recent PROMPTs**:
- TODO-004 (Argon2 PIN) — D1
- TODO-018 (11-state machine) — D3
- TODO-019 (parallel ops) — D4
- TODO-020 (4-stage recovery) — D5
- TODO-021 (WO release flow) — D6
- TODO-022 (StepExecution persistence) — D3
- TODO-023 (Socket.IO real-time) — D6

---

## 🚀 Roadmap — re-baselined May 1 late evening

| Phase | Scope | Status | Time estimate |
|---|---|---|---|
| PROMPT_1 | Foundation | ✅ Done | — |
| PROMPT_2 | 13 Registries | ✅ Done | — |
| PROMPT_3a | Workflow Designer Core | ✅ Done | — |
| PROMPT_3b_REDUCED | Advanced (3 forms + Validation) | ✅ Done | — |
| PROMPT_5_LITE | HMI Execution (mock) | ✅ Done | — |
| PROMPT_5_FULL | Production-grade HMI (D1-D6) | ✅ Done | — |
| **PROMPT_4** | **Auto-Generation Engine (7 resolvers + dry-run)** | **✅ Done (May 1)** | — |
| PROMPT_3b_FULL | PARALLEL/TEARDOWN forms + versioning UI + templates + canvas polish | ⏭️ Planned | 6-8h |
| PROMPT_6 | Dashboard & Reporting (handoff Claude Design `index.html`) | ⏭️ Planned | 5-7h |
| PROMPT_3c | WorkflowSnapshot live preview + 11-state preview + performance + E2E | ⏭️ Planned | 8-10h |

**Realistic MVP target**: end of week 2 (May 9-12). 3 PROMPT residui ~20-25h Claude Code.

---

## 📋 Conventions (unchanged)

### Technical
- **Stack**: pnpm workspaces + Turborepo, React 18, Next.js 14, NestJS 10, TypeScript strict
- **DB**: SQLite local
- **Auth**: ✅ Argon2id implemented for PIN. JWT in HttpOnly cookie
- **State machines**: XState v5 — 6 machines (Box, Equipment, WorkOrder, Workflow, StepExecution, Recovery)
- **Validation**: Zod (FE+BE shared via `@mes/schemas`)
- **Real-time**: Socket.IO (server emit + HMI listener as of D6)
- **Workflow Designer**: `@xyflow/react` + `@dagrejs/dagre` + Zustand + react-hook-form + Zod
- **HMI**: Zustand + `@tanstack/react-query` + `@xstate/react` + `socket.io-client`
- **RBAC**: skill-based via `OperatorSkill` join (QC, MANAGER, future roles)
- **Code generation**: ✅ AutoGenEngine pattern (Strategy + DI registry) for all sequence/format generators

### Compliance
- IATF 16949 → audit log 15+ years (every WO release + step transition + recovery + qc-review + auto-gen logged)
- GDPR → operator data minimization
- ECE-R104 (Safety Devices) → reflectance thresholds
- 21 CFR Part 11 → electronic signatures (D5 quality holds, D6 release captures `releasedBy`)
- **PIN auth**: Argon2id — OWASP 2024 compliant
- **WorkflowSnapshot immutability**: ADR-001 enforced (deep-clone JSON)

---

## ⚠️ Lessons learned (consolidated)

### Original (April 28-29) — 12 lessons
Trust filesystem, DoD compliance, worktree inspection, server processes, .env paths, pnpm test ≠ tsc, prisma generate per-worktree, no .js extensions, dist consumers, Windows PATH, corepack bugs, pre-flight check.

### April 30 (D1-D5) — 24 lessons
Plan-mode + git push, worktree locks, useReducer vs XState, hydration-safe routes, primitive reuse, build gate, schema verification, canonical models, inline utils, finalize-prompt.ps1, generic 401, defense-in-depth, discovery-before-extension, zero schema change, RBAC OperatorSkill, server-side enforcement, pickNokEvent smart routing, additive API extensions.

### May 1 (D6 + PROMPT_4) — 12 new lessons

37-42. (D6 lessons preserved)

43. **Strategy pattern + DI registry for code generation**: 7 resolvers each implementing `IAutoGenResolver`, registered via NestJS DI tokens. Clean separation, easy to add 8th resolver later. Pattern reusable for any "rule engine" where N implementations share an interface.

44. **Byte-identical extraction = zero behavior change**: D6's `generateWoCode` was extracted into `WoCodeResolver` with the same query, same padding, same prefix. **17 existing tests stayed green** without modification. Pattern: when refactoring inline logic into a service, preserve the exact algorithm — assert via 1 regression test that old vs new return same output for same inputs.

45. **Schema/service drift opportunistic fix**: while implementing PROMPT_4, found `AUTO_GEN_TRIGGERS` enum in `@mes/schemas` had different values from actual seeded triggers in service. Fixed in same commit since touching the file anyway. Pattern: when working on a file, scan for related drift and fix opportunistically (no separate PR needed for trivial alignments).

46. **Count-based pattern is timeless for sequence generation**: `prisma.<entity>.count({ where: { ...scope, code: { startsWith: prefix } } })` works for any code generator without lock infrastructure or AutoGenSequence table. Limitation: not collision-safe under high concurrency. For MVP single-user scenarios, perfect. Production-grade may need Postgres `nextval()` or distributed lock.

47. **45 minutes vs 3-4h budget = 5× faster than estimate**: PROMPT_4 finished in <1h thanks to (a) zero schema migration, (b) reuse of D6 count-based pattern, (c) pure Strategy resolvers (no async/locks). Lesson: when a prompt's dependencies are already in place from prior work, the effort drops dramatically.

48. **Discriminated union Zod for per-rule validation**: dry-run controller validates context with a discriminated union keyed on `ruleId`. Each rule has its own Zod schema in `packages/schemas/src/registries/auto-gen-rule.schema.ts`. Single source of truth, type-safe across stack.

---

## 🗂️ Repo structure (verified post-PROMPT_4)

```
RAMS-Reflexallen-MES/
├── apps/
│   ├── api/          ✅ 14 modules including auto-gen-engine (7 resolvers + dry-run)
│   ├── web/          ✅ 22 routes (registries + workflow editor + workflow release + dry-run preview)
│   └── hmi/          ✅ 6 routes + Argon2 + 11-state + parallel + recovery + Socket.IO
├── packages/
│   ├── domain/       ✅ 6 XState machines + 5 rule files + 164 tests
│   ├── prisma/       ✅ 64 models + 4 migrations + seed (8 skills incl. MANAGER)
│   ├── schemas/      ✅ 13 registry schemas + workflow + auth + step-execution + work-order-release + auto-gen-rule (with dry-run)
│   ├── sdk/          ✅ all clients including AutoGenRulesClient.dryRun
│   ├── types/        ✅ 11 enum files
│   ├── ui/           ✅ 16 base + 8 Tier-2 primitives
│   ├── cache/        ✅ in-memory placeholder
│   ├── queue/        ✅ sync placeholder
│   └── storage/      ✅ local fs placeholder
├── design-system/    (Reflexallen handoff bundle)
├── docs/             (specs)
├── prompts/          (PROMPT_1..3a, 3b_REDUCED, 5_LITE, 5_FULL, DOD_TEMPLATE v1.1)
│   └── archive/      (PROMPT_1B_obsolete, PROMPT_3_obsolete, PROMPT_4_workflow_step_rules_obsolete)
└── scripts/          ✅ finalize-prompt.ps1 (battle-tested 8 times today)
```

---

## 🎯 Next concrete action

3 PROMPT residui ordinati per priorità raccomandata:

### Option A — PROMPT_3b_FULL (6-8h)
Completa il Workflow Designer con:
- 2 step forms residui (PARALLEL + TEARDOWN)
- Versioning UI (submit-for-approval, approve/reject, publish-as-effective modali)
- Templates wizard (3 template Pneumatic Air seedati)
- Canvas polish (right-click context menu, keyboard shortcuts, drag-to-reorder)
- Inline validation badges sui nodi del canvas (oltre ValidationPanel)
- Phase + Group configurator forms

### Option B — PROMPT_6 Dashboard (5-7h, con handoff Claude Design)
Dashboard manager con:
- Plant Overview (KPI cards: OEE, Throughput, Scrap, ecc.)
- Active Work Orders list
- Live Activity feed (Socket.IO)
- Andon dashboard a parete (auto-refresh)
- Reportistica (export Excel/PDF)
- Detail page WO (la pagina dell'`index.html` di Claude Design)

### Option C — PROMPT_3c (8-10h, è il più complesso)
WorkflowSnapshot + Live Preview con:
- Snapshot immutability tests
- Live preview 11-state simulation nel workflow editor
- Performance ottimizzazioni (canvas con 100+ nodi)
- E2E Playwright tests

**Mia raccomandazione**: Option B (PROMPT_6 Dashboard). È il più "visibile" e usa il handoff Claude Design già pronto. Aggiunge il "lato manager" che oggi manca.

---

## 📊 Progress dashboard

```
PROMPT_1   ████████████ 100% Foundation
PROMPT_2   ████████████ 100% Registries
PROMPT_3a  ████████████ 100% Workflow Core
PROMPT_3b  ███████░░░░░  60% (REDUCED)
PROMPT_4   ████████████ 100% 🎉 AUTO-GEN ENGINE (45 min)
PROMPT_5   ████████████ 100% PRODUCTION-GRADE HMI
PROMPT_3c  ░░░░░░░░░░░░   0% (unblocked)
PROMPT_6   ░░░░░░░░░░░░   0% (handoff Claude Design ready)
─────────────────────────────────
75% MVP done | Tests 431 (+227% from baseline 127) | Build 12/12 | TODOs 23 | 6/8 PROMPT done
```

**Realistic MVP target**: 8-12 May. 3 PROMPT residui (~20-25h Claude Code).

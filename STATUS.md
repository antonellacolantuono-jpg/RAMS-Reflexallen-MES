# RAMS-Reflexallen-MES — Project Status

> **Last update**: April 30, 2026, late evening (PROMPT_5_FULL D3 merged)
> **Repository**: https://github.com/antonellacolantuono-jpg/RAMS-Reflexallen-MES
> **Stack**: NestJS + Next.js 14 + Prisma SQLite + pnpm Turborepo + shadcn-style + Reflexallen design system

---

## 📜 Project history (timeline)

- **April 27** — PROMPT_1 (Foundation) drafted and partially executed
- **April 28** — PROMPT_2 (Registries) audited + recovered + merged. PROMPT_3a D1, D2, D3 merged
- **April 29** — PC migration. D4, D5, D6 merged. **PROMPT_3a complete**, DOD_TEMPLATE v1.1 published
- **April 30 morning** — PROMPT_3b_REDUCED merged (3 step forms + ValidationPanel + 8 TODOs)
- **April 30 afternoon** — PROMPT_5_LITE merged (HMI mock execution + 9 TODOs). `finalize-prompt.ps1` automation script added
- **April 30 evening** — PROMPT_5_FULL D1+D2 merged (Argon2 PIN auth + HMI integration)
- **April 30 late evening** — **PROMPT_5_FULL D3 merged** (XState 11-state machine + persistence + AuditLog audit)

---

## ✅ Current state (verified April 30 late evening — D3 merged)

### PROMPT_1 — Foundation
- Monorepo: pnpm workspaces + Turborepo, 14 packages
- 3 apps boot, 4 XState v5 machines (now 5 with step-execution), 64 Prisma models (with new status field)
- Reflexallen design system

### PROMPT_2 — 13 Registries CRUD
- 13 NestJS modules with full CRUD + soft-delete + audit
- 18 web admin routes
- HMI login (now real Argon2)
- Seed `MOCK_DATA_PNEUMATIC_AIR` + auth + WO assignments

### PROMPT_3a — Workflow Designer Core (D1-D6)
- 4-pane editor with xyflow canvas + dagre layout
- Drag-drop palette + 30s auto-save
- 3 step configurator forms (PRODUCTION, QUALITY_CONTROL, IDENTIFICATION)

### PROMPT_3b_REDUCED — Workflow Designer Advanced
- 3 additional step forms (LOGISTICS, SETUP, RECOVERY) — 6/8 categories
- ValidationPanel sidebar with clickable errors
- 8 TODOs for PROMPT_3b_FULL

### PROMPT_5_LITE — HMI Execution (mock data)
- PIN keypad login (mock validation)
- Operator dashboard (mock WOs)
- Workflow execution (useReducer 4-state, client-only)
- Done screen with stats
- 9 TODOs for PROMPT_5_FULL

### PROMPT_5_FULL D1+D2 — Production-grade auth
- ✅ `Operator.pinHash String?` migration applied
- ✅ Argon2id PIN hashing (memoryCost 64MB, timeCost 3)
- ✅ JWT in HttpOnly cookie `mes_jwt`, 8h expiry
- ✅ Endpoints: `/api/auth/login`, `/logout`, `/me`
- ✅ HMI rewired to real auth + `useMe()` + `useMyWorkOrders()`
- ✅ `GET /api/work-orders/mine` with WorkOrderAssignment + ShiftAssignment join (zero schema change)

### PROMPT_5_FULL D3 — XState 11-state step execution machine (NEW April 30 late evening)

**Domain machine** (commit `274741d`):
- ✅ `packages/domain/src/machines/step-execution.machine.ts` (464 lines) — XState v5 machine with 11 states + 20 events
- ✅ `packages/domain/src/machines/step-execution.machine.test.ts` (395 lines, **34 tests**) — covers every transition, guards, final-state immutability, context updates
- ✅ States: pending, running, paused, blocked, qc_hold, scrapped, done, skipped, cancelled, recovered, error
- ✅ Events: START, COMPLETE_OK, COMPLETE_NOK, PAUSE, RESUME, REQUEST_QC, QC_APPROVE, QC_REJECT, SKIP, CANCEL, MARK_SCRAPPED, RECOVER, RESUME_AFTER_RECOVERY, COMPLETE_AFTER_RECOVERY, ERROR, RESET, RECORD_NOTE, ASSIGN_OPERATOR, TICK
- ✅ Guards: `REQUEST_QC` requires `stepCategory === 'QC'`; `RECOVER` requires `from in ['blocked','scrapped']`

**Schema migration** (`20260430141508_add_step_execution_status`):
- ✅ Added `status String @default("pending")` to `StepExecution` model
- ✅ Added index `step_executions_status_idx`
- ✅ Single ALTER TABLE, backfill applied via default

**API endpoint** (`POST /api/work-orders/:id/steps/:stepExecId/transitions`):
- ✅ `apps/api/src/modules/work-orders/step-execution.service.ts` (329 lines) — wraps domain machine, persists status, writes AuditLog (`entityType=StepExecution, action=transition, payload={fromStatus, toStatus, event, notes}`), emits Socket.IO `step:transition` event
- ✅ `apps/api/src/modules/work-orders/step-execution.controller.ts` (61 lines) — JwtAuthGuard, Zod validation
- ✅ `apps/api/src/modules/events/work-order-events.gateway.ts` (29 lines) — server-side emit gateway (HMI listener deferred to D6)
- ✅ `step-execution.service.test.ts` (339 lines, **16 tests**) — happy path, NOK, QC, invalid event, audit + emit, plant scoping, refresh-from-DB

**HMI integration**:
- ✅ `apps/hmi/src/app/wo/[id]/page.tsx` rewritten with `useMachine(stepExecutionMachine)` + real API queries
- ✅ `apps/hmi/src/components/StepCard.tsx` extended with 4 new visual states: paused (yellow ring), qc_hold (purple ring), scrapped (line-through), recovered (green ring)
- ✅ `apps/hmi/src/lib/queries.ts` extended with `useStepsForWorkOrder` + `useTransitionStep` mutations
- ✅ `@xstate/react@^4.1.0` added to apps/hmi

**Schemas**:
- ✅ `packages/schemas/src/step-execution.schema.ts` (102 lines) — Zod discriminated union over event `type`

### Verification evidence (April 30 late evening — post-D3)

- ✅ `pnpm install`: deps consistent (xstate added to api, @xstate/react added to hmi)
- ✅ `pnpm build`: 12 successful / 12 total, 0 errors
- ✅ `pnpm lint`: 3/3 successful, 0 errors (2 pre-existing img warnings from D2 carry-over)
- ✅ `pnpm test` (forced fresh): **251 tests passed across 22 files**, 0 failed (was 201 in PROMPT_5_FULL D1+D2; +50 from D3: 34 machine + 16 API service)
- ✅ `prisma migrate status`: 3 migrations, schema in sync
- ✅ `pnpm dev`: all 3 apps boot

### Test breakdown (April 30 late evening — post-D3)

| Package | Test files | Tests passed |
|---|---|---|
| `@mes/api` | 10 | 102 |
| `@mes/domain` | 6 | 101 |
| `@mes/schemas` | 3 | 29 |
| `@mes/cache` | 1 | 8 |
| `@mes/storage` | 1 | 6 |
| `@mes/queue` | 1 | 5 |
| **Total** | **22** | **251** |

Domain test files: box.machine, equipment.machine, work-order.machine, workflow.machine, workflow.rules, **step-execution.machine** (34 — NEW).

API test files: pagination, items.service, operators.service, audit-log.service, auto-gen-rules.service, workflows.service, pin-hash.util, auth.service, work-orders.service, **step-execution.service** (16 — NEW).

---

## 🟡 Known issues (TODO list)

24 entries currently tracked. PROMPT_5_FULL D3 introduced no new TODO entries. Quick summary:

**HIGH severity (open)**:
- TODO-008 — PARALLEL + TEARDOWN step forms (PROMPT_3b_FULL)
- TODO-010 — Versioning UI lifecycle modals (PROMPT_3b_FULL)
- TODO-017 — Refresh token rotation **(D1+D2 partial)**
- TODO-018 — ✅ **Closed by D3** (full 11-state machine implemented + persistence)
- TODO-019 — Parallel ops (PROMPT_5_FULL D4 — next)
- TODO-020 — 4-stage recovery flow (PROMPT_5_FULL D5)
- TODO-021 — WO release flow (PROMPT_5_FULL D6 / unblocks PROMPT_3c)

**MEDIUM severity (open)**:
- TODO-001..016 (registry/cosmetic/scope-deferred items)
- TODO-022 — StepExecution real persistence (✅ **closed by D3**: persistence wired via API + AuditLog)
- TODO-023 — Socket.IO real-time updates (server emit done in D3, HMI listener deferred to D6)
- TODO-024 — Change-of-shift / hand-off flow

**LOW severity**:
- TODO-025 — HMI logo cross-reference to TODO-002

**Closed (or progressing)**:
- TODO-004 — Argon2 PIN: ✅ closed by D1
- TODO-018 — 11-state machine + persistence: ✅ closed by D3
- TODO-022 — StepExecution writes: ✅ closed by D3 (server-side; HMI ready)

---

## 🚀 Roadmap — re-baselined April 30 late evening

| Phase | Scope | Status | Time estimate |
|---|---|---|---|
| PROMPT_1 | Foundation | ✅ Done | — |
| PROMPT_2 | 13 Registries | ✅ Done | — |
| PROMPT_3a | Workflow Designer Core | ✅ Done | — |
| PROMPT_3b_REDUCED | Advanced (3 forms + Validation) | ✅ Done | — |
| PROMPT_5_LITE | HMI Execution (mock) | ✅ Done | — |
| PROMPT_5_FULL D1+D2 | Argon2 + JWT + HMI integration | ✅ Done | — |
| **PROMPT_5_FULL D3** | **11-state machine + persistence + AuditLog** | **✅ Done (April 30 late evening)** | — |
| PROMPT_5_FULL D4 | Parallel ops swimlane (Device Execution Group) | ⏭️ Next | 1-1.5h |
| PROMPT_5_FULL D5 | 4-stage recovery + quality holds | ⏭️ Planned | 1.5-2h |
| PROMPT_5_FULL D6 | WO release flow + Socket.IO HMI listener | ⏭️ Planned | 2-2.5h |
| PROMPT_4 | Auto-Generation Engine (7 rules) | ⏭️ Planned | 3-4h |
| PROMPT_3b_FULL | PARALLEL/TEARDOWN forms + versioning UI + templates + canvas polish | ⏭️ Planned | 6-8h |
| PROMPT_6 | Dashboard & Reporting (handoff Claude Design `index.html`) | ⏭️ Planned | 3-5h |
| PROMPT_3c | WorkflowSnapshot + Live Preview (after D6) | ⏭️ Planned | 8-10h |

**Realistic MVP target**: end of week 2 (May 9-12). From PROMPT_4 onward, `scripts/finalize-prompt.ps1` automates merge + cleanup.

---

## 📋 Conventions (unchanged)

### Technical
- **Stack**: pnpm workspaces + Turborepo, React 18, Next.js 14, NestJS 10, TypeScript strict
- **DB**: SQLite local (NOT PostgreSQL), in-memory cache, sync queue, local filesystem
- **Auth**: ✅ Argon2id implemented for PIN. JWT in HttpOnly cookie. NEVER bcrypt.
- **State machines**: XState v5. 5 machines now: Box, Equipment, WorkOrder, Workflow, **StepExecution (D3)**
- **Validation**: Zod (FE+BE shared schemas via `@mes/schemas`)
- **Real-time**: Socket.IO (server emit working as of D3; HMI listener in D6)
- **Workflow Designer**: `@xyflow/react` + `@dagrejs/dagre` + Zustand + react-hook-form + Zod
- **HMI**: Zustand UI state + `@tanstack/react-query` server state + `@xstate/react` step execution

### Compliance
- IATF 16949 → audit log 15+ years (StepExecution transitions now logged)
- GDPR → operator data minimization
- ECE-R104 (Safety Devices) → reflectance thresholds, homologation
- 21 CFR Part 11 → electronic signatures (D5 quality holds will exercise this)
- **PIN auth**: Argon2id (memoryCost 64MB, timeCost 3) — OWASP 2024 compliant

---

## ⚠️ Lessons learned (consolidated)

### Original (April 28-29)
1. Trust the filesystem, not the agent's narrative.
2. No PROMPT is "done" without DoD compliance.
3. Worktrees must be inspected before each session.
4. Server processes outlive sessions.
5. `.env` is project-local secret.
6. `pnpm test` is not enough — `tsc` and `ts-node` are stricter.
7. `prisma generate` is per-worktree.
8. Internal workspace imports must NOT use `.js` extensions.
9. Workspace package consumers depend on built `dist/`.
10. Windows PATH is fragile.
11. corepack 5.x has signature verification bugs.
12. Pre-flight check at every session start.

### April 30 morning/afternoon
13. Plan-mode in Claude Code Desktop blocks `git push` — push manually if locked.
14. Worktree files locked by Claude Code Desktop — close fully before rmdir.
15. `useReducer` vs XState: prefer simpler tool for simple cases.
16. Hydration-safe protected routes for sessionStorage in Next.js 14.
17. Reuse existing primitives (PinKeypad reused).
18. TS strict regression catch via mandatory `pnpm build` gate.

### April 30 evening (D1+D2)
19. Schema verification is non-negotiable: agent verified before code, found 3 missing fields.
20. Q2 resolution pattern: prefer canonical models (zero schema change) over denormalization.
21. Inline pin-hash util in seed.ts: cross-package imports awkward; pragmatic for single-use.
22. `finalize-prompt.ps1` works: closes PROMPT in 1 command (with Y confirmation).
23. Generic 401 on auth failure: prevents enumeration attacks.
24. `pinHash` strip pattern: defense in depth at repository AND service layer.

### April 30 late evening (D3)
25. **Domain machine spec before implementation**: 11 states + 20 events documented in plan with truth table BEFORE writing code. Made implementation mechanical, no ambiguity, 34 tests easy to author.
26. **`@xstate/react@^4.1.0` is the React companion for XState v5**: NOT @xstate/react@^3 (which is v4 of XState). Match major versions or face confusion.
27. **`AuditLog.payload Json` is the right pattern for transition events**: avoids creating dedicated `StepTransition` table. Reuse over duplication. (Alternative considered and rejected as over-engineering.)
28. **Socket.IO server emit ≠ HMI listener**: separating these into different deliverables (D3 server, D6 client) keeps each commit focused and testable.
29. **Test ratio matters**: D3 had ratio test:code ~85-103% across machine + service. High coverage made the diff trustworthy without manual smoke per case.
30. **Auto-push from Claude Code works smoothly**: when authorized at start of session, no plan-mode blocks. The `finalize-prompt.ps1` then handles merge + cleanup in 1 command (with first-push errored cosmetically; second push detected as already-up-to-date).

---

## 🗂️ Repo structure (verified post-D3)

```
RAMS-Reflexallen-MES/
├── apps/
│   ├── api/          ✅ 13 registry modules + audit-log + events + workflows + auth + work-orders (now with step-execution endpoint + work-order-events.gateway)
│   ├── web/          ✅ 21 routes
│   └── hmi/          ✅ 4 routes + REAL auth + REAL step execution (XState 11-state + API + AuditLog)
├── packages/
│   ├── domain/       ✅ 5 XState machines (Box, Equipment, WorkOrder, Workflow, StepExecution) + rules + 101 tests
│   ├── prisma/       ✅ 64 models (StepExecution + status field) + 3 migrations
│   ├── schemas/      ✅ 13 registry schemas + workflow + auth + step-execution
│   ├── sdk/          ✅ base-registry + 13 registry clients + workflows
│   ├── types/        ✅ 11 enum files
│   ├── ui/           ✅ 16 base + 8 Tier-2 primitives
│   ├── cache/        ✅ in-memory placeholder
│   ├── queue/        ✅ sync placeholder
│   └── storage/      ✅ local fs placeholder
├── design-system/    (Reflexallen handoff bundle)
├── docs/             (specs)
├── prompts/          (PROMPT_1..3a, 3b_REDUCED, 5_LITE, 5_FULL, DOD_TEMPLATE v1.1, archive)
└── scripts/          ✅ finalize-prompt.ps1 (battle-tested for D1+D2 + D3)
```

---

## 🎯 Next concrete action

**PROMPT_5_FULL D4 — Parallel operations swimlane (Device Execution Group)**.

D4 introduces a horizontal swimlane UI for parallel steps within a Group. When a Group has `category: 'parallel'`:
- Render multiple StepCards in horizontal lanes
- Shared cycle timer at top
- Sync point: when all parallel steps reach `done`, the group's main step transitions automatically
- Domain rule `parallel-ops.rules.ts` to compute swimlanes + sync points

Estimated time: 1-1.5h Claude Code. Same flow as D3 (PHASE 0 → 1 → 2 → 3 → auto-push → finalize-prompt.ps1).

---

## 📊 Progress dashboard

```
PROMPT_1   ████████████ 100% Foundation
PROMPT_2   ████████████ 100% Registries
PROMPT_3a  ████████████ 100% Workflow Core
PROMPT_3b  ███████░░░░░  60% (REDUCED done; FULL deferred)
PROMPT_4   ░░░░░░░░░░░░   0% Auto-gen
PROMPT_5   ███████░░░░░  60% (LITE + D1+D2+D3 done; D4-D6 next)
PROMPT_3c  ░░░░░░░░░░░░   0% (blocked by PROMPT_5_FULL D6)
PROMPT_6   ░░░░░░░░░░░░   0% (handoff index.html ready in Claude Design)
─────────────────────────────────────
MVP target: 9-12 May  |  Tests: 251  |  Build: 12/12  |  TODOs: 22 open (3 closed by D3 work)
```

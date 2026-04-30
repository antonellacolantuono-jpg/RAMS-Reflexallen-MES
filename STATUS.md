# RAMS-Reflexallen-MES — Project Status

> **Last update**: April 30, 2026, late evening (PROMPT_5_FULL D1+D2 merged)
> **Repository**: https://github.com/antonellacolantuono-jpg/RAMS-Reflexallen-MES
> **Stack**: NestJS + Next.js 14 + Prisma SQLite + pnpm Turborepo + shadcn-style + Reflexallen design system

---

## 📜 Project history (timeline)

- **April 27** — PROMPT_1 (Foundation) drafted and partially executed
- **April 28** — PROMPT_2 (Registries) audited + recovered + merged. PROMPT_3a D1, D2, D3 merged
- **April 29** — PC migration (new corporate laptop). D4, D5, D6 merged. **PROMPT_3a complete**, DOD_TEMPLATE v1.1 published
- **April 30 morning** — PROMPT_3b_REDUCED merged (3 step forms + ValidationPanel + 8 TODOs)
- **April 30 afternoon** — PROMPT_5_LITE merged (HMI login + dashboard + WO execution + done + 9 TODOs). `finalize-prompt.ps1` automation script added
- **April 30 evening** — **PROMPT_5_FULL D1+D2 merged** (Argon2id PIN auth backend + HMI auth integration). PROMPT_5_FULL D3-D6 deferred to next sessions

---

## ✅ Current state (verified April 30 late evening)

### PROMPT_1 — Foundation
- Monorepo: pnpm workspaces + Turborepo, 14 packages
- 3 apps boot (api 3000, web 3001, hmi 3002)
- 4 XState v5 machines, 63 Prisma models, Reflexallen design system

### PROMPT_2 — 13 Registries CRUD
- 13 NestJS modules with full CRUD + soft-delete + audit
- 18 web admin routes
- HMI login mockup
- Seed `MOCK_DATA_PNEUMATIC_AIR` loaded

### PROMPT_3a — Workflow Designer Core (D1-D6)
- Workflow XState machine + rules + 38 tests
- Workflow API: 12 endpoints
- Web pages with 4-pane editor (`react-resizable-panels`)
- xyflow canvas + dagre layout + Zustand store
- Drag-drop palette + 30s debounced auto-save
- 3 step configurator forms (PRODUCTION, QUALITY_CONTROL, IDENTIFICATION)

### PROMPT_3b_REDUCED — Workflow Designer Advanced
- 3 additional step forms (LOGISTICS, SETUP, RECOVERY) — coverage 6/8 categories
- StepCategory.RECOVERY added (TS-only enum)
- ValidationPanel sidebar with clickable errors → scrollToNode animation
- 8 TODOs added (TODO-008, 010..016) for PROMPT_3b_FULL

### PROMPT_5_LITE — HMI Execution (mock data)
- PIN keypad login (mock validation)
- Operator dashboard with assigned WO list (mock)
- Workflow execution screen with OK/NOK transitions (useReducer client-state)
- Done screen with stats grid
- 9 TODOs added (TODO-017..025) for PROMPT_5_FULL

### PROMPT_5_FULL D1+D2 — Production-grade auth (NEW April 30 evening)

**D1 — Argon2id PIN backend + JWT cookies**
- ✅ `Operator.pinHash String?` migration applied
- ✅ Module `apps/api/src/modules/auth/`: AuthController, AuthService, JwtStrategy, JwtAuthGuard
- ✅ Endpoints: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- ✅ Argon2id hashing with memoryCost: 65536, timeCost: 3
- ✅ JWT in HttpOnly cookie `mes_jwt`, SameSite=Strict, 8h expiry
- ✅ `cookie-parser`, `passport-jwt`, `@nestjs/jwt`, `@nestjs/passport` installed
- ✅ Generic 401 errors (no badge enumeration)
- ✅ `pinHash` stripped from all registry CRUD responses
- ✅ Seed updated: 4 operators (OP-001..004) hashed with argon2id `$argon2id$v=19$m=65536,t=3,p=1$`
- ✅ +12 tests (pin-hash util 5 + auth.service 7)

**D2 — HMI auth integration**
- ✅ `@tanstack/react-query@5.x` added to apps/hmi
- ✅ `apps/hmi/src/lib/api-client.ts` — fetch wrapper with `credentials: 'include'`
- ✅ `apps/hmi/src/lib/queries.ts` — useMe, useLogin, useLogout, useMyWorkOrders
- ✅ `apps/hmi/src/app/providers.tsx` — QueryClientProvider singleton
- ✅ Login page rewired to real `/api/auth/login` (mock validation removed)
- ✅ Dashboard reads from `useMe()` + `useMyWorkOrders()` (real API)
- ✅ `MOCK_OPERATORS` deleted from `mock-data.ts`
- ✅ `operator-store.ts` slimmed to UI-state only
- ✅ New endpoint `GET /api/work-orders/mine` with JwtAuthGuard
  - Query via `WorkOrderAssignment` (status: active/in_progress) + `ShiftAssignment` (current time window)
  - Pattern Q2: zero schema change, uses canonical v1.2 SCHEDULING_ASSIGNMENT models
- ✅ Seed updated: 2-3 WorkOrderAssignment per OP-001..004 + 1 ShiftAssignment each
- ✅ +7 tests (work-orders.service.test.ts)

**Runtime smoke verified (Gate C)**:
1. POST /api/auth/login OP-001/1234 → 200 + Set-Cookie mes_jwt
2. GET /api/auth/me with cookie → 200 sanitized operator (no pinHash)
3. GET /api/work-orders/mine with cookie → 2 WOs for OP-001
4. GET /api/auth/me without cookie → 401
5. POST /api/auth/login wrong PIN → 401 generic
6. POST /api/auth/logout → 200 cookie cleared

### Verification evidence (April 30 late evening)

- ✅ `pnpm install`: deps consistent
- ✅ `pnpm build`: 12 successful / 12 total
- ✅ `pnpm test` (forced fresh): **201 tests passed across 18 files**, 0 failed (was 182 in PROMPT_5_LITE; +19 from PROMPT_5_FULL D1+D2)
- ✅ `prisma migrate`: `20260430123414_add_operator_pin_hash` applied
- ✅ `pnpm seed`: 4 operators hashed, 8-10 WorkOrderAssignment + 4 ShiftAssignment created (idempotent)
- ✅ `pnpm dev`: all 3 apps boot, runtime smoke 6/6 verified

### Test breakdown (April 30 late evening)

| Package | Test files | Tests passed |
|---|---|---|
| `@mes/api` | 8 | 86 |
| `@mes/domain` | 5 | 67 |
| `@mes/schemas` | 3 | 29 |
| `@mes/cache` | 1 | 8 |
| `@mes/storage` | 1 | 6 |
| `@mes/queue` | 1 | 5 |
| **Total** | **19** | **201** |

API test files: pagination, items.service, operators.service, audit-log.service, auto-gen-rules.service, workflows.service, **pin-hash.util** (5), **auth.service** (7), **work-orders.service** (7).

---

## 🟡 Known issues (TODO list)

24 entries currently tracked. PROMPT_5_FULL D1+D2 partially closed TODO-017 (login + JWT done; refresh token rotation deferred). Quick summary:

**HIGH severity (open)**:
- TODO-008 — PARALLEL + TEARDOWN step forms (PROMPT_3b_FULL)
- TODO-010 — Versioning UI lifecycle modals (PROMPT_3b_FULL)
- TODO-017 — Refresh token rotation **(D1+D2 partial: login/me/logout done, refresh deferred)**
- TODO-018 — Full 11-state step machine (PROMPT_5_FULL D3)
- TODO-019 — Parallel ops with Device Execution Group (PROMPT_5_FULL D4)
- TODO-020 — 4-stage recovery flow (PROMPT_5_FULL D5)
- TODO-021 — WO release flow (PROMPT_5_FULL D6 / unblocks PROMPT_3c)

**MEDIUM severity (open)**:
- TODO-001..016 (registry/cosmetic/scope-deferred items)
- TODO-022 — StepExecution real persistence (PROMPT_5_FULL D3)
- TODO-023 — Socket.IO real-time updates (PROMPT_5_FULL D6)
- TODO-024 — Change-of-shift / hand-off flow (post-MVP)

**LOW severity**:
- TODO-025 — HMI logo cross-reference to TODO-002

**Closed (or progressing)**:
- TODO-004 — Argon2 PIN exercise: ✅ partially closed (now exercised at integration level via `/api/auth/login`)

---

## 🚀 Roadmap — re-baselined April 30 late evening

| Phase | Scope | Status | Time estimate |
|---|---|---|---|
| PROMPT_1 | Foundation | ✅ Done | — |
| PROMPT_2 | 13 Registries | ✅ Done | — |
| PROMPT_3a | Workflow Designer Core | ✅ Done | — |
| PROMPT_3b_REDUCED | Advanced (3 forms + Validation) | ✅ Done | — |
| PROMPT_5_LITE | HMI Execution (mock) | ✅ Done | — |
| **PROMPT_5_FULL D1+D2** | **Argon2 + JWT + HMI integration** | **✅ Done (April 30)** | — |
| PROMPT_5_FULL D3 | 11-state step machine + persistence | ⏭️ Next | 2h |
| PROMPT_5_FULL D4 | Parallel ops swimlane | ⏭️ Planned | 1h |
| PROMPT_5_FULL D5 | 4-stage recovery + quality holds | ⏭️ Planned | 1.5h |
| PROMPT_5_FULL D6 | WO release flow + Socket.IO | ⏭️ Planned | 2h |
| PROMPT_4 | Auto-Generation Engine (7 rules) | ⏭️ Planned | 3-4h |
| PROMPT_3b_FULL | PARALLEL/TEARDOWN forms + versioning UI + templates + canvas polish | ⏭️ Planned | 6-8h |
| PROMPT_6 | Dashboard & Reporting (handoff Claude Design `index.html`) | ⏭️ Planned | 3-5h |
| PROMPT_3c | WorkflowSnapshot + Live Preview | ⏭️ Planned (after PROMPT_5_FULL D6) | 8-10h |

**Realistic MVP target**: end of week 2 (May 9-10). Each PROMPT uses DOD_TEMPLATE.md v1.1 with build + runtime smoke gates. From PROMPT_4 onward, `scripts/finalize-prompt.ps1` automates merge + cleanup (already used for PROMPT_5_FULL D1+D2 closure).

---

## 📋 Conventions (unchanged)

### Technical

- **Stack**: pnpm workspaces + Turborepo, React 18, Next.js 14, NestJS 10, TypeScript strict
- **DB**: SQLite local (NOT PostgreSQL), in-memory cache, sync queue, local filesystem
- **Auth**: ✅ Argon2id implemented (PROMPT_5_FULL D1) for PIN. JWT in HttpOnly cookie. NEVER bcrypt.
- **State machines**: XState v5 (or `useReducer` for simple cases)
- **Validation**: Zod (FE+BE shared schemas via `@mes/schemas`)
- **Real-time**: Socket.IO (existing gateway, will be extended in PROMPT_5_FULL D6)
- **Workflow Designer**: `@xyflow/react` + `@dagrejs/dagre` + Zustand + react-hook-form + Zod
- **HMI**: Zustand for UI state + `@tanstack/react-query` for server state. Auth via JWT cookie.

### Compliance

- IATF 16949 → audit log 15+ years, lot genealogy bidirectional
- GDPR → operator data minimization, soft delete only
- ECE-R104 (Safety Devices) → reflectance thresholds, homologation cert validity
- 21 CFR Part 11 → electronic signatures (planned for PROMPT_5_FULL D5)
- **PIN auth**: Argon2id (memoryCost 64MB, timeCost 3, parallelism 1) — meets OWASP 2024 recommendations

---

## ⚠️ Lessons learned (consolidated)

### Original (April 28-29)
1. Trust the filesystem, not the agent's narrative.
2. No PROMPT is "done" without DoD compliance.
3. Worktrees must be inspected before each session.
4. Server processes outlive sessions.
5. `.env` is project-local secret (root + `packages/prisma/`).
6. `pnpm test` is not enough — `tsc` and `ts-node` are stricter.
7. `prisma generate` is per-worktree.
8. Internal workspace imports must NOT use `.js` extensions.
9. Workspace package consumers depend on built `dist/`.
10. Windows PATH is fragile (Group Policy / IT may reset).
11. corepack 5.x has signature verification bugs.
12. Pre-flight check at every session start.

### From April 30 morning/afternoon
13. Plan-mode in Claude Code Desktop blocks `git push` — push manually if locked.
14. Worktree files locked by Claude Code Desktop — close fully before rmdir.
15. `useReducer` vs XState: prefer simpler tool for simple cases.
16. Hydration-safe protected routes for sessionStorage in Next.js 14.
17. Reuse existing primitives (PinKeypad reused in PROMPT_5_LITE).
18. TS strict regression catch via mandatory `pnpm build` gate.

### From April 30 evening (PROMPT_5_FULL D1+D2)
19. **Schema verification is non-negotiable**: PROMPT_5_FULL.md claimed `Operator.pinHash` and `WorkOrder.assignedOperatorId` existed; Claude Code verified via direct schema read and found them missing. Plan-mode protected from silent assumption.
20. **Q2 resolution pattern**: when missing fields could be denormalized OR sourced via canonical models, prefer canonical (zero schema change). `WorkOrderAssignment` + `ShiftAssignment` join is the v1.2 SCHEDULING_ASSIGNMENT pattern.
21. **Inline pin-hash util in seed.ts**: cross-package imports awkward; for single-use utilities, inline duplication is pragmatic. Refactor when 2+ consumers materialize.
22. **`finalize-prompt.ps1` works**: closed PROMPT_5_FULL D1+D2 in 1 command (with Y confirmation). The script gates on working tree clean and pre-existing branch on origin. Saves ~10 min per PROMPT closure.
23. **Generic 401 on auth failure**: never differentiate "wrong badge" from "wrong PIN" in error messages — prevents enumeration attacks.
24. **`pinHash` strip pattern**: enforce at repository level (returning `Operator` type without pinHash) and reinforce at service level (sanitize before response). Defense in depth.

---

## 🗂️ Repo structure (verified April 30 late evening)

```
RAMS-Reflexallen-MES/
├── apps/
│   ├── api/          ✅ 13 registry modules + audit + events + workflows + auth + work-orders
│   ├── web/          ✅ 21 routes (registries + workflow editor with 6/8 categories + ValidationPanel)
│   └── hmi/          ✅ 4 routes (login + dashboard + wo + done) + REAL auth (Argon2 + JWT cookies)
├── packages/
│   ├── domain/       ✅ 4 XState machines + rules + 67 tests
│   ├── prisma/       ✅ 63 models + 2 migrations (init, add_operator_pin_hash)
│   ├── schemas/      ✅ 13 registry schemas + workflow schema + auth schema
│   ├── sdk/          ✅ base-registry client + 13 registry clients + workflows client
│   ├── types/        ✅ 11 enum files
│   ├── ui/           ✅ 16 base + 8 Tier-2 primitives
│   ├── cache/        ✅ in-memory placeholder
│   ├── queue/        ✅ sync placeholder
│   └── storage/      ✅ local fs placeholder
├── design-system/    (Reflexallen handoff bundle)
├── docs/             (specs + extensions)
├── prompts/          (PROMPT_1, PROMPT_2, PROMPT_3a, PROMPT_3b_REDUCED, PROMPT_5_LITE, PROMPT_5_FULL, PROMPT_4 placeholder, PROMPT_3b_FULL, PROMPT_3c, PROMPT_6, DOD_TEMPLATE v1.1, archive)
└── scripts/          ✅ finalize-prompt.ps1 (battle-tested for D1+D2 closure)
```

---

## 🎯 Next concrete action

**PROMPT_5_FULL D3 — XState 11-state step machine + persistence**.

D3 is the most technically dense deliverable of PROMPT_5_FULL. It will:
- Replace `useReducer` (PROMPT_5_LITE D3 baseline) with XState v5 11-state machine
- Add `step-execution.machine.ts` in `packages/domain/src/machines/`
- Add `POST /api/work-orders/:id/steps/:stepExecId/transitions` endpoint
- Persist transitions to `StepExecution` table (real DB writes)
- Update HMI `wo/[id]/page.tsx` to use `useMachine(stepExecutionMachine)` + POST on every transition
- Update StepCard with new visual states (paused, qc_hold, scrapped, recovered)
- ~25+ machine tests + 8+ API tests

Estimated time: 2-3h Claude Code. Follow same pattern: PHASE 0 pre-flight, PHASE 1 plan, PHASE 2 build, PHASE 3 DoD with auto-push, then `scripts/finalize-prompt.ps1` for merge.

---

## 📊 Progress dashboard

```
PROMPT_1   ████████████ 100% Foundation
PROMPT_2   ████████████ 100% Registries
PROMPT_3a  ████████████ 100% Workflow Core
PROMPT_3b  ███████░░░░░  60% (REDUCED done; FULL deferred)
PROMPT_4   ░░░░░░░░░░░░   0% Auto-gen
PROMPT_5   █████░░░░░░░  35% (LITE + D1+D2 done; D3-D6 deferred)
PROMPT_3c  ░░░░░░░░░░░░   0% (blocked by PROMPT_5_FULL D6)
PROMPT_6   ░░░░░░░░░░░░   0% (handoff index.html ready in Claude Design)
─────────────────────────────────────
MVP target: 9-10 May  |  Tests: 201  |  Build: 12/12  |  TODOs: 24 open
```

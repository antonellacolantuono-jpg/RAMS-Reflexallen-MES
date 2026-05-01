# RAMS-Reflexallen-MES — Project Status

> **Last update**: May 1, 2026, evening (🎉 **PROMPT_5_FULL 100% COMPLETE**)
> **Repository**: https://github.com/antonellacolantuono-jpg/RAMS-Reflexallen-MES
> **Stack**: NestJS + Next.js 14 + Prisma SQLite + pnpm Turborepo + shadcn-style + Reflexallen design system

---

## 🎉 Major milestone: PROMPT_5_FULL is 100% complete

After 6 deliverables across 2 days, the **HMI Execution layer is production-grade**:

```
✅ D1 — Argon2id PIN auth + JWT cookies
✅ D2 — HMI auth integration (real /api/auth/login + useMe + useMyWorkOrders)
✅ D3 — XState 11-state step execution machine + persistence + AuditLog
✅ D4 — Device Execution Group parallel swimlane + Step.deviceCategory
✅ D5 — 4-stage recovery flow + quality holds + qc-review RBAC
✅ D6 — WO release flow + WorkflowSnapshot + Socket.IO HMI listener
```

**End-to-end demo navigable**:
1. Plant Manager (OP-001) opens web admin → `/workflows/<approved_id>/release` → creates WO
2. Backend deep-clones the workflow → creates WorkflowSnapshot (immutable per ADR-001) → creates StepExecutions
3. Within 1 second, OP-002's HMI dashboard sees the new WO appear (Socket.IO `wo:assigned` event, no refresh)
4. OP-002 opens WO → executes steps via XState 11-state machine → transitions persist with AuditLog
5. NOK on attempt 2 auto-scraps server-side; QC review approves/rejects via `/qc-review`; parallel device groups render in swimlane
6. Manager sees real-time `step:transition` events on Socket.IO (HMI listener wired in D6)

This is **the operational backbone of the MES**. Everything from PROMPT_3c onward (snapshot live preview, dashboard reporting, auto-gen rules) builds on top of this.

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
- **May 1 evening** — **PROMPT_5_FULL D6 merged. PROMPT_5_FULL 100% complete.**

---

## ✅ Current state (verified May 1 evening)

### PROMPT_1 — Foundation
Monorepo + 14 packages + 3 apps + 6 XState v5 machines + 64 Prisma models + Reflexallen design system.

### PROMPT_2 — 13 Registries CRUD
13 NestJS modules with full CRUD + soft-delete + audit. 18 web admin routes. HMI login (real Argon2). Seed with auth + WO assignments + MANAGER skill (D6).

### PROMPT_3a — Workflow Designer Core (D1-D6)
4-pane editor with xyflow canvas + dagre + Zustand store. 3 step configurator forms (PRODUCTION, QC, IDENTIFICATION).

### PROMPT_3b_REDUCED — Workflow Designer Advanced
3 additional step forms (LOGISTICS, SETUP, RECOVERY) → 6/8 categories. ValidationPanel sidebar.

### PROMPT_5_LITE — HMI Execution (mock data)
PIN keypad login (mock), operator dashboard, workflow execution (useReducer 4-state), done screen.

### PROMPT_5_FULL — Production-grade HMI execution (✅ 100% COMPLETE May 1 evening)

**D1+D2 — Argon2 + JWT + HMI integration**
- `Operator.pinHash String?` + Argon2id (memoryCost 64MB, timeCost 3) — OWASP 2024 compliant
- JWT in HttpOnly cookie `mes_jwt`, 8h expiry
- `/api/auth/login`, `/logout`, `/me`
- HMI rewired to real auth + `useMe()` + `useMyWorkOrders()`
- `GET /api/work-orders/mine` via WorkOrderAssignment + ShiftAssignment join

**D3 — XState 11-state step machine + persistence**
- 11 states + 20 events (pending, running, paused, blocked, qc_hold, scrapped, done, skipped, cancelled, recovered, error)
- `StepExecution.status` migration + index
- `POST /api/work-orders/:id/steps/:stepExecId/transitions` with JwtAuthGuard
- AuditLog persistence + Socket.IO server emit `step:transition`
- HMI rewired with `useMachine()` + 4 new visual states on StepCard

**D4 — Device Execution Group parallel swimlane**
- `Step.deviceCategory String?` migration (pre / device_main / parallel / post)
- `parallel-ops.rules.ts` + ParallelStepLane component with shared timer
- API sync logic: when all parallel siblings done, main step auto-completes
- Seed: 1 demo group with 5 steps spanning all 4 lanes

**D5 — 4-stage recovery + quality holds**
- Recovery XState machine (5 states + 5 events): diagnosis → attempt_1 → attempt_2 → recovered/scrap
- `quality-hold.rules.ts` predicates
- `/api/qc-review` module (list + approve + reject) with QC skill RBAC
- `/api/auth/login` and `/me` extended with `skillCodes: string[]`
- Auto-scrap server-side: `COMPLETE_NOK` with `attemptCount >= 2` chains `MARK_SCRAPPED`
- HMI: RecoveryFlow component (Italian stepper) + `/qc-review` routes
- Zero schema change (recoveryStage + attemptCount in `StepExecution.data Json`)

**D6 — WO release flow + Socket.IO HMI listener (NEW May 1 evening)**

*Backend*:
- ✅ `apps/api/src/modules/work-orders/release.service.ts` (380 lines) — transactional WO + WorkflowSnapshot + StepExecution[] + WorkOrderAssignment creation
- ✅ `apps/api/src/modules/work-orders/release.controller.ts` (39 lines) — `POST /api/work-orders/release` with MANAGER skill RBAC
- ✅ Deep-clone immutable: `WorkflowSnapshot.snapshotData String` (JSON-serialized full tree per ADR-001)
- ✅ WO code format: `WO-YYYYMMDD-NNN` per-plant per-day sequence
- ✅ Audit log entry `state_change` on release; `actualStart=null` (set by first START transition)
- ✅ Events gateway extended: `wo:released` (broadcast), `wo:assigned` (per-operator room `op:${operatorId}`)
- ✅ +27 API tests (release service 17 + controller 4 + events gateway 6)

*Domain*:
- ✅ `packages/domain/src/rules/workflow-snapshot.rules.ts` (243 lines) — `cloneWorkflowTree(version)` + 12 rule tests for ordering, empty groups, parallel device categories
- ✅ `packages/domain/src/rules/manager.rules.ts` — `MANAGER_SKILL_CODE` + `canRelease` helper

*Web admin*:
- ✅ `apps/web/src/app/(registries)/workflows/[id]/release/page.tsx` (281 lines) — react-hook-form + Zod release form
- ✅ "Rilascia WO" button on workflow detail (visible only when `currentVersion.status === 'approved'`)
- ✅ `EntityForm` extended with `submitLabel` prop (additive)

*HMI*:
- ✅ `apps/hmi/src/lib/socket.ts` (49 lines) — singleton socket.io-client with JWT cookie credentials
- ✅ `useWoAssignedSubscription(operatorId)` — joins `op:${operatorId}` room, invalidates `myWorkOrders` on event
- ✅ `useStepTransitionSubscription(workOrderId)` — joins `wo:${workOrderId}` room, invalidates `workOrderSteps` on event
- ✅ Wired into dashboard + wo/[id] pages
- ✅ `socket.io-client@^4.7.5` added (matches v4 server)

*Seed*:
- ✅ MANAGER skill added (`leadership` category)
- ✅ OP-001 assigned MANAGER skill (idempotent)
- ✅ Demo workflow migrated to status `approved` for release smoke test

**Runtime smoke verified end-to-end (Gate C)**:
1. OP-001 (MANAGER) → POST `/api/work-orders/release` → 200 + `WO-20260501-001` + snapshot + 5 stepExec ✅
2. OP-002 (no MANAGER) → POST `/api/work-orders/release` → 403 Forbidden ✅
3. OP-002 GET `/api/work-orders/mine` → released WO appears (status=`ready`, qty=25) ✅
4. Snapshot is immutable: `WorkflowSnapshot.snapshotData` JSON deep-cloned from version, FK back to WO ✅

### Verification evidence (May 1 evening — post-D6)

- ✅ `pnpm install`: deps consistent (socket.io-client@4.8.3 added)
- ✅ `pnpm build`: 12 successful / 12 total, 0 errors
- ✅ `pnpm lint`: 3/3, 0 errors (only pre-existing `<img>` warnings from D2 carry-over)
- ✅ `pnpm test`: **370 tests passed across 28 files**, 0 failed (was 331 in D5; +39 from D6: 12 domain + 27 api)
- ✅ `prisma migrate status`: 4 migrations applied (init + pinHash D1 + status D3 + deviceCategory D4), schema in sync — **D6 added zero migrations**
- ✅ `pnpm dev`: API + Web + HMI all "ready"; new endpoints + socket events functioning end-to-end

### Test breakdown (May 1 evening — post-D6)

| Package | Test files | Tests passed |
|---|---|---|
| `@mes/api` | 14 | 158 |
| `@mes/domain` | 11 | 164 |
| `@mes/schemas` | 3 | 29 |
| `@mes/cache` | 1 | 8 |
| `@mes/storage` | 1 | 6 |
| `@mes/queue` | 1 | 5 |
| **Total** | **31** | **370** |

Domain (D6 additions): **workflow-snapshot.rules** (12) + **manager.rules** (2).

API (D6 additions): **release.service** (17) + **release.controller** (4) + **work-order-events.gateway** (6).

---

## 🟡 Known issues (TODO list)

21 entries currently tracked. PROMPT_5_FULL D6 closed TODO-021 + TODO-023. Quick summary:

**HIGH severity (open)**:
- TODO-008 — PARALLEL + TEARDOWN step forms (PROMPT_3b_FULL)
- TODO-010 — Versioning UI lifecycle modals (PROMPT_3b_FULL)
- TODO-017 — Refresh token rotation (D1+D2 partial)

**MEDIUM severity (open)**:
- TODO-001..016 (registry/cosmetic/scope-deferred items)
- TODO-024 — Change-of-shift / hand-off flow (post-MVP)
- TODO-026 — Per-stage StepExecution model (D5 deferral, may need for PROMPT_4)

**LOW severity**:
- TODO-025 — HMI logo cross-reference to TODO-002

**Closed by PROMPT_5_FULL**:
- TODO-004 (Argon2 PIN) — D1
- TODO-018 (11-state machine) — D3
- TODO-019 (parallel ops) — D4
- TODO-020 (4-stage recovery) — D5
- TODO-021 (WO release flow) — **D6** ✅
- TODO-022 (StepExecution persistence) — D3
- TODO-023 (Socket.IO real-time) — **D6** ✅

---

## 🚀 Roadmap — re-baselined May 1 evening

| Phase | Scope | Status | Time estimate |
|---|---|---|---|
| PROMPT_1 | Foundation | ✅ Done | — |
| PROMPT_2 | 13 Registries | ✅ Done | — |
| PROMPT_3a | Workflow Designer Core | ✅ Done | — |
| PROMPT_3b_REDUCED | Advanced (3 forms + Validation) | ✅ Done | — |
| PROMPT_5_LITE | HMI Execution (mock) | ✅ Done | — |
| **PROMPT_5_FULL** | **Production-grade HMI (D1-D6 all merged)** | **✅ 100% COMPLETE (May 1)** | — |
| PROMPT_4 | Auto-Generation Engine (7 rules) | ⏭️ Next | 3-4h |
| PROMPT_3b_FULL | PARALLEL/TEARDOWN forms + versioning UI + templates + canvas polish | ⏭️ Planned | 6-8h |
| PROMPT_6 | Dashboard & Reporting (handoff Claude Design `index.html`) | ⏭️ Planned | 5-7h |
| PROMPT_3c | WorkflowSnapshot live preview + 11-state preview + performance + E2E | ⏭️ UNBLOCKED | 8-10h |

**Realistic MVP target**: end of week 2 (May 9-12).

PROMPT_3c is now **unblocked** because PROMPT_5_FULL D6 ships the WO release + WorkflowSnapshot foundation. The live preview can simulate the full execution against a real snapshot.

---

## 📋 Conventions (unchanged)

### Technical
- **Stack**: pnpm workspaces + Turborepo, React 18, Next.js 14, NestJS 10, TypeScript strict
- **DB**: SQLite local (NOT PostgreSQL), in-memory cache, sync queue, local filesystem
- **Auth**: ✅ Argon2id implemented for PIN. JWT in HttpOnly cookie. NEVER bcrypt.
- **State machines**: XState v5. **6 machines**: Box, Equipment, WorkOrder, Workflow, StepExecution, Recovery
- **Validation**: Zod (FE+BE shared schemas via `@mes/schemas`)
- **Real-time**: ✅ Socket.IO (server emit + HMI listener both wired as of D6)
- **Workflow Designer**: `@xyflow/react` + `@dagrejs/dagre` + Zustand + react-hook-form + Zod
- **HMI**: Zustand UI state + `@tanstack/react-query` server state + `@xstate/react` step execution + `socket.io-client` for live updates
- **RBAC**: skill-based via `OperatorSkill` join — pattern reusable for QC, MANAGER, future roles

### Compliance
- IATF 16949 → audit log 15+ years (every WO release + step transition + recovery + qc-review logged)
- GDPR → operator data minimization
- ECE-R104 (Safety Devices) → reflectance thresholds, homologation
- 21 CFR Part 11 → electronic signatures (D5 quality holds capture approver identity in AuditLog; D6 release captures `releasedBy`)
- **PIN auth**: Argon2id — OWASP 2024 compliant
- **WorkflowSnapshot immutability**: ADR-001 enforced (deep-clone JSON, never edited)

---

## ⚠️ Lessons learned (consolidated)

### Original (April 28-29) — 12 lessons
Trust filesystem, DoD compliance, worktree inspection, server processes, `.env` paths, `pnpm test` ≠ `tsc`, `prisma generate` per-worktree, no `.js` extensions, dist consumers, Windows PATH, corepack bugs, pre-flight check.

### April 30 morning/afternoon (D1-D5) — 18 lessons
Plan-mode + git push, worktree locks, useReducer vs XState, hydration-safe routes, primitive reuse, build gate, schema verification, canonical models, inline utils, `finalize-prompt.ps1`, generic 401, defense-in-depth, discovery-before-extension, zero schema change, RBAC OperatorSkill, server-side enforcement, `pickNokEvent` smart routing, additive API extensions.

### May 1 evening (D6) — 6 new lessons

37. **Schema verification can be PASS in one shot**: D6's plan check confirmed all needed fields exist on `WorkflowSnapshot`, `WorkOrder`, `StepExecution`, `WorkOrderAssignment` without proposing any migration. Pattern: when adding a flow that orchestrates existing entities, schema gap is rare.

38. **MANAGER skill follows QC skill pattern**: D5 added QC skill assignments to OP-002. D6 adds MANAGER skill to OP-001. Same shape, same idempotent seed pattern. Future roles (e.g., MAINTENANCE) follow this template.

39. **Single transactional release is non-negotiable**: WO release creates 4-5 entity types (WorkOrder + WorkflowSnapshot + StepExecution[] + WorkOrderAssignment + optional ShiftAssignment). Wrapping in `prisma.$transaction` prevents partial state on failure. Pattern for any future "release"-style operation.

40. **WorkflowSnapshot as `String` JSON column (not separate tables)**: simplest pattern for immutable deep-clone. Pros: no FK cascade complexity, no orphan rows, fits ADR-001 immutability semantics. Cons: snapshot internals are not queryable via Prisma. Acceptable for MVP; may evolve in PROMPT_3c if live preview needs structured queries.

41. **Socket.IO subscription pattern via react-query `invalidateQueries`**: instead of mirroring server state in local Zustand or maintaining a separate live cache, the listener invalidates the relevant query key. React-query refetches. No duplicate state, no stale UI, no memory leak. Pattern for any future Socket.IO-driven real-time UI.

42. **Multi-room emit targeting**: D6 introduces room-targeted emits (`op:${operatorId}` and `wo:${workOrderId}`). Manager broadcasts to all (`wo:released`), but per-operator events go to specific rooms. Foundation for PROMPT_6 dashboard real-time KPIs (probably room `dashboard:plant:${plantId}`).

---

## 🗂️ Repo structure (verified post-D6)

```
RAMS-Reflexallen-MES/
├── apps/
│   ├── api/          ✅ 13 registry modules + audit + events (4 emit types) + workflows + auth + work-orders (with release endpoint) + qc-review
│   ├── web/          ✅ 22 routes (registries + workflow editor + workflow release + new + trash + home)
│   └── hmi/          ✅ 6 routes (login + dashboard + wo + done + qc-review × 2) + Argon2 + 11-state + parallel + recovery + Socket.IO
├── packages/
│   ├── domain/       ✅ 6 XState machines + 5 rule files + 164 tests (now includes workflow-snapshot.rules + manager.rules)
│   ├── prisma/       ✅ 64 models + 4 migrations + seed with 8 skills (incl. MANAGER) + demo released WO
│   ├── schemas/      ✅ 13 registry schemas + workflow + auth + step-execution + work-order-release
│   ├── sdk/          ✅ base-registry + 13 registry clients + workflows
│   ├── types/        ✅ 11 enum files
│   ├── ui/           ✅ 16 base + 8 Tier-2 primitives (EntityForm now supports submitLabel)
│   ├── cache/        ✅ in-memory placeholder
│   ├── queue/        ✅ sync placeholder
│   └── storage/      ✅ local fs placeholder
├── design-system/    (Reflexallen handoff bundle)
├── docs/             (specs)
├── prompts/          (PROMPT_1..3a, 3b_REDUCED, 5_LITE, 5_FULL, DOD_TEMPLATE v1.1, archive)
└── scripts/          ✅ finalize-prompt.ps1 (battle-tested for 6 PROMPT_5_FULL deliverables)
```

---

## 🎯 Next concrete action

PROMPT_5_FULL is complete. The natural next step is **PROMPT_4 (Auto-Generation Engine)** to leverage the new release flow + StepExecution surface that D6 just shipped.

**PROMPT_4 — Auto-Generation Engine**:
- Implements logic for the 7 rules already seeded in PROMPT_2 (visible at `/auto-gen-rules`):
  - BOM Check on Setup start
  - First piece sample (100% Production batch)
  - Calibration interval check
  - Tool wear projection
  - Attention point auto-resolve
  - Periodic QC sample (every N units)
  - End-of-shift cleanup
- Trigger: when a WO is released (D6 endpoint), auto-gen evaluates rules and inserts steps
- UI: lists existing rules (read-only — already done) + dry-run preview "what would auto-gen do for this WO?"

Estimated time: 3-4h Claude Code. Same flow as D6: PHASE 0 → 1 → 2 → 3 → auto-push → finalize-prompt.ps1.

---

## 📊 Progress dashboard

```
PROMPT_1   ████████████ 100% Foundation
PROMPT_2   ████████████ 100% Registries
PROMPT_3a  ████████████ 100% Workflow Core
PROMPT_3b  ███████░░░░░  60% (REDUCED done; FULL deferred)
PROMPT_4   ░░░░░░░░░░░░   0% Auto-gen (NEXT)
PROMPT_5   ████████████ 100% 🎉 PRODUCTION-GRADE HMI
PROMPT_3c  ░░░░░░░░░░░░   0% (unblocked by D6)
PROMPT_6   ░░░░░░░░░░░░   0% (handoff Claude Design ready)
─────────────────────────────────────
MVP target: 9-12 May | Tests: 370 | Build: 12/12 | TODOs: 21 open (2 closed by D6)
```

**6/8 PROMPT done at 50%+** | **Test +191% in 5 days** (127 → 370) | **MVP at 68%**.

PROMPT_5_FULL was the largest prompt of the project (8-10h Claude Code distributed across 6 deliverables). Closing it represents reaching the operational core of the MES. Everything from here builds on a stable, audited, production-grade execution layer.

# RAMS-Reflexallen-MES — Project Status

> **Last update**: May 1, 2026, late afternoon (PROMPT_5_FULL D5 merged)
> **Repository**: https://github.com/antonellacolantuono-jpg/RAMS-Reflexallen-MES
> **Stack**: NestJS + Next.js 14 + Prisma SQLite + pnpm Turborepo + shadcn-style + Reflexallen design system

---

## 📜 Project history (timeline)

- **April 27** — PROMPT_1 Foundation drafted
- **April 28** — PROMPT_2 Registries audited + recovered + merged. PROMPT_3a D1-D3 merged
- **April 29** — PC migration. PROMPT_3a D4-D6 merged. **PROMPT_3a complete**, DOD_TEMPLATE v1.1
- **April 30 morning** — PROMPT_3b_REDUCED merged
- **April 30 afternoon** — PROMPT_5_LITE merged. `finalize-prompt.ps1` added
- **April 30 evening** — PROMPT_5_FULL D1+D2 merged (Argon2 + HMI auth)
- **April 30 late evening** — PROMPT_5_FULL D3 merged (XState 11-state + persistence)
- **May 1 morning** — PROMPT_5_FULL D4 merged (parallel swimlane)
- **May 1 afternoon** — **PROMPT_5_FULL D5 merged** (4-stage recovery + quality holds)

---

## ✅ Current state (verified May 1, late afternoon)

### PROMPT_1 — Foundation
Monorepo + 14 packages + 3 apps (api/web/hmi) + 6 XState v5 machines (after D5) + 64 Prisma models + Reflexallen design system.

### PROMPT_2 — 13 Registries CRUD
13 NestJS modules + 18 web admin routes + HMI login (real Argon2) + seed `MOCK_DATA_PNEUMATIC_AIR` + auth + WO assignments.

### PROMPT_3a — Workflow Designer Core (D1-D6)
4-pane editor with xyflow canvas + dagre + Zustand store + drag-drop palette + 30s auto-save + 3 step configurator forms.

### PROMPT_3b_REDUCED — Workflow Designer Advanced
3 additional step forms (LOGISTICS, SETUP, RECOVERY) → 6/8 categories. ValidationPanel sidebar with clickable errors.

### PROMPT_5_LITE — HMI Execution (mock data)
PIN keypad login (mock validation), operator dashboard (mock WOs), workflow execution (useReducer 4-state), done screen.

### PROMPT_5_FULL D1+D2 — Production-grade auth
- `Operator.pinHash String?` migration applied
- Argon2id PIN hashing (memoryCost 64MB, timeCost 3) — OWASP 2024 compliant
- JWT in HttpOnly cookie `mes_jwt`, 8h expiry
- Endpoints: `/api/auth/login`, `/logout`, `/me`
- HMI rewired to real auth + `useMe()` + `useMyWorkOrders()`
- `GET /api/work-orders/mine` with WorkOrderAssignment + ShiftAssignment join (zero schema change)

### PROMPT_5_FULL D3 — XState 11-state step execution machine
- `step-execution.machine.ts` — 11 states + 20 events (pending, running, paused, blocked, qc_hold, scrapped, done, skipped, cancelled, recovered, error)
- `StepExecution.status String @default("pending")` migration applied + index
- `POST /api/work-orders/:id/steps/:stepExecId/transitions` endpoint with JwtAuthGuard
- AuditLog persistence + Socket.IO server emit `step:transition`
- HMI page rewired with `useMachine()` + 4 new visual states on StepCard

### PROMPT_5_FULL D4 — Device Execution Group parallel swimlane
- `Step.deviceCategory String?` migration applied (pre / device_main / parallel / post)
- `parallel-ops.rules.ts` (`splitGroupIntoLanes` + sync points)
- HMI `ParallelStepLane.tsx` with shared timer + horizontal lanes
- API sync logic: when all parallel siblings done, main step auto-completes
- Seed extension: 1 demo group with 5 steps spanning all 4 lanes

### PROMPT_5_FULL D5 — 4-stage recovery flow + quality holds (NEW May 1 afternoon)

**Domain**:
- ✅ `packages/domain/src/machines/recovery.machine.ts` (238 lines) — XState v5 machine with 5 states (diagnosis, attempt_1, attempt_2, recovered, scrap) + 5 events
- ✅ `packages/domain/src/machines/recovery.machine.test.ts` (247 lines, **23 tests**)
- ✅ `packages/domain/src/rules/quality-hold.rules.ts` (65 lines) — predicates: `requiresQcApproval`, `canApproveQcHold`, `triggersQualityHold`, `pickNokEvent`
- ✅ `packages/domain/src/rules/quality-hold.rules.test.ts` (72 lines, **10 tests**)
- ✅ `nextRecoveryStage` + `isMaxAttemptsReached` helpers exported

**API**:
- ✅ `apps/api/src/modules/qc-review/` (4 files: module + controller + service + tests)
- ✅ Endpoints: `GET /api/qc-review` (list qc_hold), `POST /:id/approve`, `POST /:id/reject`
- ✅ RBAC: requires QC skill via `OperatorSkill` join (skill check fires before step lookup)
- ✅ `/api/auth/login` and `/api/auth/me` extended with `skillCodes: string[]` (additive, non-breaking)
- ✅ `step-execution.service` tracks `recoveryStage` + `attemptCount` in `StepExecution.data Json` column (zero schema change)
- ✅ Auto-scrap server-side: `COMPLETE_NOK` with `attemptCount >= 2` chains `MARK_SCRAPPED` with reason `auto_scrap_max_attempts`. AuditLog + Socket.IO for both transitions.
- ✅ +21 API tests (qc-review service 11 + step-execution recovery 10)

**HMI**:
- ✅ `apps/hmi/src/components/RecoveryFlow.tsx` (181 lines) — Italian stepper (Diagnosi → Tentativo 1 → Tentativo 2 → Scarto)
- ✅ `apps/hmi/src/app/qc-review/page.tsx` + `[stepExecId]/page.tsx` — list + detail routes
- ✅ Dashboard "Revisione QC" button (visible only for operators with QC skill)
- ✅ `pickNokEvent` smart routing: NOK on QC step → `REQUEST_QC`, normal NOK → `COMPLETE_NOK`
- ✅ `queries.ts` extended with 3 hooks: `useQcReviewList`, `useApproveQc`, `useRejectQc`
- ✅ `WorkOrderStep` DTO extended with `recoveryStage`, `attemptCount`
- ✅ `StepTransitionResult` extended with `recoveryStage`, `attemptCount`, `autoScrapped`
- ✅ `blocked` removed from `PAST_STATUSES` so recovery flow doesn't skip done screen prematurely

**Runtime smoke verified end-to-end** (Gate C):
- Login OP-002 (has QC skill) → returns `skillCodes: ["QC","TEST","PACK"]`
- Login OP-003 (no QC skill) → POST /qc-review/.../approve → 403 Forbidden
- OP-002 on missing stepExecId → 404 (skill check passes, lookup fails — correct order)

### Verification evidence (May 1 late afternoon — post-D5)

- ✅ `pnpm install`: deps consistent
- ✅ `pnpm build`: 12 successful / 12 total, 0 errors
- ✅ `pnpm lint`: 3/3, 0 errors (only pre-existing `<img>` warnings from D2 carry-over)
- ✅ `pnpm test` (forced fresh): **331 tests passed across 26 files**, 0 failed (was 275 in D4; +56 from D5: recovery 23 + quality-hold 10 + qc-review 11 + step-execution recovery 10 + auth skillCodes 2)
- ✅ `prisma migrate status`: 4 migrations applied (D1 pinHash + D3 status + D4 deviceCategory + init), schema in sync — **D5 added zero migrations** (StepExecution.data Json reused)
- ✅ `pnpm dev`: API + HMI + Web all 200; new routes mapped (3 qc-review + extended /me)

### Test breakdown (May 1 late afternoon — post-D5)

| Package | Test files | Tests passed |
|---|---|---|
| `@mes/api` | 11 | 131 |
| `@mes/domain` | 9 | 152 |
| `@mes/schemas` | 3 | 29 |
| `@mes/cache` | 1 | 8 |
| `@mes/storage` | 1 | 6 |
| `@mes/queue` | 1 | 5 |
| **Total** | **26** | **331** |

Domain test files: box.machine, equipment.machine, work-order.machine, workflow.machine, workflow.rules, step-execution.machine, **recovery.machine** (23 — NEW), parallel-ops.rules, **quality-hold.rules** (10 — NEW).

API test files: pagination, items.service, operators.service, audit-log.service, auto-gen-rules.service, workflows.service, pin-hash.util, auth.service, work-orders.service, step-execution.service, **qc-review.service** (11 — NEW).

---

## 🟡 Known issues (TODO list)

23 entries currently tracked. PROMPT_5_FULL D5 closed TODO-020, added TODO-026. Quick summary:

**HIGH severity (open)**:
- TODO-008 — PARALLEL + TEARDOWN step forms (PROMPT_3b_FULL)
- TODO-010 — Versioning UI lifecycle modals (PROMPT_3b_FULL)
- TODO-017 — Refresh token rotation (D1+D2 partial)
- TODO-021 — WO release flow (PROMPT_5_FULL D6 — last deliverable)

**MEDIUM severity (open)**:
- TODO-001..016 (registry/cosmetic/scope-deferred items)
- TODO-019 — Parallel ops (✅ closed by D4)
- TODO-023 — Socket.IO real-time updates (server emit done; HMI listener deferred to D6)
- TODO-024 — Change-of-shift / hand-off flow
- TODO-026 (NEW) — Per-stage StepExecution model deferral (D5 ships single-row recovery state via JSON; PROMPT_4 may require per-stage rows)

**LOW severity**:
- TODO-025 — HMI logo cross-reference to TODO-002

**Closed by D5**:
- TODO-020 — ✅ 4-stage recovery flow + quality holds implemented

**Closed by previous D**:
- TODO-004 (Argon2 PIN) — D1
- TODO-018 (11-state machine) — D3
- TODO-019 (parallel ops) — D4
- TODO-022 (StepExecution persistence) — D3

---

## 🚀 Roadmap — re-baselined May 1 late afternoon

| Phase | Scope | Status | Time estimate |
|---|---|---|---|
| PROMPT_1 | Foundation | ✅ Done | — |
| PROMPT_2 | 13 Registries | ✅ Done | — |
| PROMPT_3a | Workflow Designer Core | ✅ Done | — |
| PROMPT_3b_REDUCED | Advanced (3 forms + Validation) | ✅ Done | — |
| PROMPT_5_LITE | HMI Execution (mock) | ✅ Done | — |
| PROMPT_5_FULL D1-D2 | Argon2 + JWT + HMI integration | ✅ Done | — |
| PROMPT_5_FULL D3 | XState 11-state + persistence | ✅ Done | — |
| PROMPT_5_FULL D4 | Parallel swimlane (Device Execution Group) | ✅ Done | — |
| **PROMPT_5_FULL D5** | **4-stage recovery + quality holds** | **✅ Done (May 1)** | — |
| PROMPT_5_FULL D6 | WO release flow + Socket.IO HMI listener | ⏭️ Next | 2-2.5h |
| PROMPT_4 | Auto-Generation Engine (7 rules) | ⏭️ Planned | 3-4h |
| PROMPT_3b_FULL | PARALLEL/TEARDOWN forms + versioning UI + templates + canvas polish | ⏭️ Planned | 6-8h |
| PROMPT_6 | Dashboard & Reporting (handoff Claude Design `index.html`) | ⏭️ Planned | 3-5h |
| PROMPT_3c | WorkflowSnapshot + Live Preview (after D6) | ⏭️ Planned | 8-10h |

**Realistic MVP target**: end of week 2 (May 9-12). After D6, PROMPT_5_FULL is 100% complete and PROMPT_3c becomes unblocked.

---

## 📋 Conventions (unchanged)

### Technical
- **Stack**: pnpm workspaces + Turborepo, React 18, Next.js 14, NestJS 10, TypeScript strict
- **DB**: SQLite local (NOT PostgreSQL), in-memory cache, sync queue, local filesystem
- **Auth**: ✅ Argon2id implemented for PIN. JWT in HttpOnly cookie. NEVER bcrypt.
- **State machines**: XState v5. **6 machines now**: Box, Equipment, WorkOrder, Workflow, StepExecution, **Recovery (D5)**
- **Validation**: Zod (FE+BE shared schemas via `@mes/schemas`)
- **Real-time**: Socket.IO (server emit working as of D3; HMI listener in D6)
- **Workflow Designer**: `@xyflow/react` + `@dagrejs/dagre` + Zustand + react-hook-form + Zod
- **HMI**: Zustand UI state + `@tanstack/react-query` server state + `@xstate/react` step execution
- **RBAC**: skill-based via `OperatorSkill` join (D5 pattern, reusable for future role checks)

### Compliance
- IATF 16949 → audit log 15+ years (StepExecution + recovery + qc-review transitions all logged)
- GDPR → operator data minimization
- ECE-R104 (Safety Devices) → reflectance thresholds, homologation
- 21 CFR Part 11 → electronic signatures (D5 quality holds capture approver identity in AuditLog)
- **PIN auth**: Argon2id — OWASP 2024 compliant

---

## ⚠️ Lessons learned (consolidated)

### Original (April 28-29)
1-12. (Keep all original lessons)

### April 30 morning/afternoon (D1-D4)
13-30. (Keep all D1-D4 lessons)

### May 1 (D5)
31. **Discovery before extension**: Claude Code identified that the 11-state machine already covered leaf-level recovery transitions (`MARK_SCRAPPED`, `RECOVER`, `QC_APPROVE`, `QC_REJECT`). D5 became a layer on top, not a rewrite. Saved 30%+ of the work.
32. **Zero schema change is a real option**: D5 used the existing `StepExecution.data Json?` column for `recoveryStage` + `attemptCount`. No migration. Pattern: when adding tracking fields, verify if a JSON column exists before proposing a new column.
33. **RBAC pattern via OperatorSkill**: skill-based access checks are clean (skill check fires before resource lookup). Reusable pattern for future role-based features.
34. **Server-side enforcement of business rules**: auto-scrap on attempt 2 NOK is enforced server-side, not client-side. The client cannot bypass this. AuditLog records both transitions (the COMPLETE_NOK and the chained MARK_SCRAPPED) for full traceability.
35. **`pickNokEvent` smart routing**: instead of having two separate buttons in HMI, the same NOK button routes to different events based on step category. Reduces UX complexity, business logic in domain layer.
36. **Additive API extensions**: `/me` and `/login` returning `skillCodes: string[]` is additive; pre-D5 clients ignore the new field. Pattern for evolving APIs without versioning.

---

## 🎯 Next concrete action

**PROMPT_5_FULL D6 — WO release flow + Socket.IO HMI listener**.

D6 is the LAST deliverable of PROMPT_5_FULL. After this, PROMPT_5_FULL is 100% complete and PROMPT_3c (WorkflowSnapshot + Live Preview) becomes unblocked.

Scope:
- **WO release flow**: Plant Manager (operator with MANAGER skill) selects an approved workflow + an item + a quantity → system creates `WorkflowSnapshot` (deep clone, immutable), creates `WorkOrder`, initializes `StepExecution` records for every step in the snapshot
- **Manager UI**: new web admin page `/workflows/[id]/release` to create WOs from approved workflows
- **HMI Socket.IO listener**: subscribes to `wo:released`, `wo:assigned`, `step:transition` — operators see new WOs and live transitions without refresh

Estimated time: 2-2.5h Claude Code. Same flow as D5: PHASE 0 → 1 → 2 → 3 → auto-push → finalize-prompt.ps1.

---

## 📊 Progress dashboard

```
PROMPT_1   ████████████ 100% Foundation
PROMPT_2   ████████████ 100% Registries
PROMPT_3a  ████████████ 100% Workflow Core
PROMPT_3b  ███████░░░░░  60% (REDUCED done; FULL deferred)
PROMPT_4   ░░░░░░░░░░░░   0% Auto-gen
PROMPT_5   ██████████░░  83% (LITE + D1-D5 done; D6 next = LAST)
PROMPT_3c  ░░░░░░░░░░░░   0% (blocked by PROMPT_5_FULL D6)
PROMPT_6   ░░░░░░░░░░░░   0% (handoff index.html ready in Claude Design)
─────────────────────────────────────────────
MVP target: 9-12 May | Tests: 331 | Build: 12/12 | TODOs: 23 open (1 closed by D5)
```

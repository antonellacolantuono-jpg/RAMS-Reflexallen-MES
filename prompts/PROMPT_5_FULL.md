# PROMPT_5_FULL — HMI Execution (production-ready)

> **Type**: Build prompt for Claude Code Desktop (Step 5 of 8 PROMPT, FULL scope)
> **Predecessor**: PROMPT_5_LITE (commit `924d3cf`, merged April 30 afternoon)
> **Successor**: PROMPT_4 (auto-gen) → PROMPT_6 (dashboard) → PROMPT_3b_FULL → PROMPT_3c
> **Estimated Claude Code time**: 8-10 hours (split across 6 deliverables, each commit-able independently)
> **Status**: Active — promoted PROMPT_5 to FULL after PROMPT_5_LITE delivery; the lite version replaced as the "fast demo" baseline.

---

## ⚠️ Why FULL now, why not before LITE

PROMPT_5_LITE delivered the visual HMI shell (login, dashboard, WO execution, done) with mock data and `useReducer` client-state. It's "the operator side exists". PROMPT_5_FULL upgrades that shell to **production-grade execution**:

- Real Argon2id PIN auth + JWT cookies + refresh
- Full 11-state step machine (XState v5) replacing 4-state `useReducer`
- Parallel ops (Device Execution Group): one main step + concurrent sub-steps with shared timer
- 4-stage recovery flow: diagnosis → attempt 1 → attempt 2 → scrap
- Quality holds: WO can be paused for QC review, resumes only after approval
- Real `StepExecution` writes via API (no more client-state)
- Socket.IO real-time: operator A's progress visible to manager B
- WO release flow: Plant Manager creates a WO from an approved workflow snapshot (this also unblocks PROMPT_3c)

Everything PROMPT_5_LITE marked as TODO-017..024 is addressed here. After this prompt, the HMI is **truly the MES execution layer**, not a demo.

---

## 🎯 Goal

After PROMPT_5_FULL is verified done:

1. **Operator** types badge OP-001 + PIN. Backend hashes with Argon2id, validates against `operator.pinHash` from DB, returns JWT. HMI stores JWT in HttpOnly cookie. Refresh works.
2. **Operator** sees only their assigned WOs (real query against DB, filtered by current shift + assignment).
3. **Operator** opens WO. Steps load from DB (`StepExecution` records). State is `pending` initially.
4. **Operator** taps "OK". XState 11-state machine transitions: `pending → running → done`. Backend persists. Manager dashboard sees the transition live (Socket.IO).
5. **Operator** hits NOK on a step. State → `blocked`. Modal asks for cause code + notes. Recovery state machine kicks: `diagnosis` (auto-step) → operator confirms → `attempt_1` (rerun) → if NOK again → `attempt_2` → if still NOK → `scrap`. All transitions auditable.
6. **Quality hold**: a step in QC category can transition to `qc_hold`. WO progress freezes until a QC supervisor (any operator with `QC` skill) approves/rejects.
7. **Parallel ops**: a Production step with `groupCategory: 'parallel'` runs alongside QC sample step on the same item, with shared cycle timer.
8. **WO release**: a Plant Manager (any operator with `MANAGER` skill) selects an approved workflow + an item + a quantity, system creates a `WorkOrderSnapshot` (immutable copy) + `WorkOrder` + initial `StepExecution` records.

---

## ⚠️ Hard constraints — DO NOT violate

### Schema is sacred (mostly)
- **Existing models** (`Operator`, `WorkOrder`, `WorkflowSnapshot`, `StepExecution`, `Phase`, `Group`, `Step`, `Recipe`, `Item`, `Skill`, `Plant`, `AuditLog`) — DO NOT modify their fields.
- **Allowed schema additions** (with explicit user approval per change):
  - `Operator.pinHash` field — already exists in schema. Verify, don't add.
  - `WorkOrder.assignedShift`, `WorkOrder.assignedOperatorId` — already exist. Verify.
  - **NEW**: optional `Step.config Json?` for TODO-007/016 fields if integrated as part of execution wiring (qcThresholds, expectedPattern, scanType, recoveryStage). **STOP and ask** before adding.

### Stack alignment
- **Auth**: Argon2id (`@node-rs/argon2` or `argon2` npm). NEVER bcrypt.
- **JWT**: `jsonwebtoken` v9+ for sign/verify. Cookies must be HttpOnly + SameSite=Strict + Secure (in prod) + Max-Age 8h.
- **State machine**: XState v5 (`@xstate/react`) for the 11-state step machine and the 4-stage recovery flow.
- **Socket.IO**: existing event gateway in `apps/api/src/modules/events/` — extend, don't replace.
- **Persistence**: real `StepExecution.create / update / findMany` via Prisma + NestJS controller. NO mock-data.ts in HMI for execution state.

### No work outside scope
- ❌ Multi-tenant tenant switching UI (deferred)
- ❌ Operator self-registration (deferred)
- ❌ Password reset flow (deferred)
- ❌ Multi-factor auth (deferred — single-factor PIN is sufficient for shop-floor)
- ❌ Voice commands or barcode scanner integration (deferred)
- ❌ Offline mode / sync queue (deferred)
- ❌ Print labels / paper documents (deferred)
- ❌ Andon escalation hooks (PROMPT_6 territory)
- ❌ Dashboard manager (PROMPT_6 territory)
- ❌ Modify existing registry modules

If something feels needed but is in this list, STOP and ask.

---

## 📚 Required reading before planning

| File | Why |
|---|---|
| `STATUS.md` | Current state |
| `TODO.md` | TODO-017..024 are this prompt's targets — verify wording matches |
| `prompts/DOD_TEMPLATE.md` v1.1 | Verification gates (build + runtime smoke mandatory) |
| `prompts/PROMPT_5_LITE.md` | Predecessor scope — what's already done |
| `apps/hmi/src/app/page.tsx` | Existing login (mock validation, will be rewired to real auth) |
| `apps/hmi/src/lib/operator-store.ts` | Zustand store (will be extended with JWT + auth state) |
| `apps/hmi/src/lib/mock-data.ts` | TO BE REMOVED in stages (replaced by real API calls) |
| `apps/hmi/src/app/wo/[id]/page.tsx` | Execution screen (useReducer → XState) |
| `apps/hmi/src/components/StepCard.tsx` | Step UI (need new states: paused, qc_hold, scrapped, recovered) |
| `apps/api/src/modules/operators/operators.service.ts` | For PIN hashing reference |
| `apps/api/src/modules/events/events.gateway.ts` | Socket.IO existing gateway |
| `packages/domain/src/machines/work-order.machine.ts` | XState v5 pattern reference (existing) |
| `packages/prisma/schema.prisma` (workflow / step execution / WO sections) | Confirm field availability |
| `packages/types/src/enums/step.enum.ts` | StepCategory, StepStatus enums |

After reading, summarize in 12-15 lines:
- D1-D6 scope and dependencies between them
- Schema gaps (any fields missing — STOP and ask if found)
- Routes/endpoints to add in `apps/api`
- Files to create/modify per deliverable
- State machine transitions covered (XState 11-state diagram in plain text)
- Recovery flow diagram (4 stages)
- Any ambiguity needing clarification

Wait for explicit "go" before Phase 2.

---

## 🛠 Phase 2 — Build (after user "go")

Execute D1 → D6 in order. After each, verify with DoD gates, suggest commit, wait for user "ok next". Each deliverable must compile and test independently — committable atomic.

### D1 — Argon2id PIN backend + JWT auth

**Goal**: real auth foundation. Operators with `pinHash` populated can log in.

**Backend**:
- New module: `apps/api/src/modules/auth/`
  - `auth.controller.ts` — `POST /api/auth/login` { badge, pin } → { jwt, operator }, `POST /api/auth/logout`, `GET /api/auth/me` (uses JWT)
  - `auth.service.ts` — `login(badge, pin)`: find operator by badge → `argon2.verify(operator.pinHash, pin)` → if valid, return JWT signed with `JWT_SECRET` (8h expiry)
  - `jwt.guard.ts` — `JwtAuthGuard` extends `AuthGuard('jwt')` (passport-jwt strategy)
  - `jwt.strategy.ts` — passport JWT extraction from HttpOnly cookie
- New utility: `apps/api/src/modules/operators/pin-hash.util.ts` — `hashPin(pin: string)` using `argon2.hash(pin, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3 })`
- Modify `apps/api/src/modules/operators/operators.service.ts` — when creating operator, hash the PIN before persisting. Add `setOperatorPin(id, newPin)` method.
- Update seed: hash the mock PINs (1234, 2222, 3333, 4444) for OP-001..OP-004 before persisting.
- Modify `apps/api/src/main.ts` — add `cookie-parser` middleware, configure CORS to allow credentials (HMI origin :3002).

**Schema verification**:
- Confirm `Operator.pinHash String` field exists. If not, STOP and ask.

**Tests**:
- New: `apps/api/src/modules/auth/auth.service.test.ts` — happy path login, wrong PIN, unknown badge, JWT round-trip.
- New: `apps/api/src/modules/operators/pin-hash.util.test.ts` — hash → verify pattern.

**Verification (paste literal output)**:
```powershell
pnpm --filter @mes/api build 2>&1 | Select-Object -Last 10
pnpm --filter @mes/api test 2>&1 | Select-Object -Last 5
pnpm test 2>&1 | Select-Object -Last 5
```
Expected: 0 build errors, ≥190 tests passing (~8 new auth tests).

Manual smoke (only if dev running):
```powershell
$body = @{ badge = "OP-001"; pin = "1234" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri http://localhost:3000/api/auth/login -Body $body -ContentType "application/json" -SessionVariable s
$s.Cookies.GetCookies("http://localhost:3000")  # JWT cookie
Invoke-RestMethod -Uri http://localhost:3000/api/auth/me -WebSession $s
```

**Commit message**: `feat(api): add Argon2id PIN auth with JWT cookies (D1 of PROMPT_5_FULL)`

---

### D2 — HMI auth integration

**Goal**: rewire HMI login to real backend. Remove mock validation. JWT cookie persists across refresh.

**Modify**:
- `apps/hmi/src/app/page.tsx` — replace `validateOperatorPin` mock with `fetch('/api/auth/login', { credentials: 'include', body })`. On success, no need to store operator manually — read from `/api/auth/me`. Redirect to `/dashboard`.
- `apps/hmi/src/lib/operator-store.ts` — remove sessionStorage, replace with React Query `useQuery(['me'])` reading from `/api/auth/me`. Operator is fetched fresh on every protected route mount. Store keeps only UI state (last selected WO, etc.), no auth state.
- `apps/hmi/src/app/dashboard/page.tsx` — replace `useOperatorStore` with `useQuery(['me'])`. If 401 → redirect to `/`. Filter WOs via real API: `GET /api/work-orders?assignedTo=<operatorId>&shift=<currentShift>`.
- New: `apps/hmi/src/lib/api-client.ts` — fetch wrapper with `credentials: 'include'` for cookies. Optional retry on 401 via `/api/auth/refresh`.
- Remove: `apps/hmi/src/lib/mock-data.ts` MOCK_OPERATORS map only — keep MOCK_WORK_ORDERS until D3 (will be removed).

**Backend**:
- New endpoint: `GET /api/work-orders?assignedTo=...&shift=...` — read from `WorkOrder` table. (If WO model needs new fields, STOP and ask.)
- For demo: seed needs to create 8-10 WOs with `assignedOperatorId`, `assignedShift`, `status: 'in_progress'`, `currentVersionId` linked to a workflow.

**Verification**:
- Dev login from HMI works end-to-end.
- Refresh on `/dashboard` does not kick to `/`.
- 401 on expired JWT redirects to `/`.

**Commit message**: `feat(hmi): wire login + dashboard to real auth + WO API (D2 of PROMPT_5_FULL)`

---

### D3 — Full 11-state step machine (XState v5)

**Goal**: replace D3-of-LITE useReducer with XState 11-state machine. Persist transitions to `StepExecution`.

**States**:
```
pending → running → paused
                  → blocked
                  → qc_hold
                  → scrapped
                  → done
                  → skipped
                  → cancelled
                  → recovered (only from blocked or scrapped)
                  → error (catch-all)
```

11 states total. 

**Domain**:
- New: `packages/domain/src/machines/step-execution.machine.ts` — XState v5 machine with 11 states + ~20 events.
- New: `packages/domain/src/machines/step-execution.machine.test.ts` — at least 25 tests covering all transitions.

**Backend**:
- Modify: `apps/api/src/modules/work-orders/` (create if missing) with endpoints:
  - `POST /api/work-orders/:id/steps/:stepExecId/transitions` { event: string, payload: any } → applies transition + writes `StepExecution.status` + audit log.
  - `GET /api/work-orders/:id/steps/:stepExecId/state` → current state.
- New: `step-execution.service.ts` — wraps the domain machine, persists state, emits Socket.IO `step:transition` event.

**HMI**:
- Modify `apps/hmi/src/app/wo/[id]/page.tsx`: replace `useReducer` with `useMachine(stepExecutionMachine)`. On every transition, POST to `/api/work-orders/:id/steps/:sid/transitions`.
- Modify `apps/hmi/src/components/StepCard.tsx` — add visual states: paused (yellow ring), qc_hold (purple ring), scrapped (strikethrough), recovered (green ring with retry icon).

**Tests**:
- Domain: 25+ machine tests
- API: 8+ transition endpoint tests

**Verification**:
- All transitions audit-logged.
- Refresh on `/wo/[id]` resumes from DB state, not client memory.

**Commit message**: `feat(domain+api+hmi): add 11-state step execution machine with persistence (D3 of PROMPT_5_FULL)`

---

### D4 — Parallel operations (Device Execution Group)

**Goal**: when a Group has `category: 'parallel'`, render a swimlane UI in HMI showing concurrent steps with shared cycle timer.

**Domain**:
- New rule in `packages/domain/src/rules/parallel-ops.rules.ts` — given a Group, return ordered swimlanes + sync points.

**HMI**:
- New: `apps/hmi/src/components/ParallelStepLane.tsx` — renders multiple StepCards in horizontal lanes with shared timer at top.
- Modify `apps/hmi/src/app/wo/[id]/page.tsx` — when current group is parallel, render `<ParallelStepLane>` instead of vertical timeline.

**Backend**:
- Extend transition endpoint to handle parallel-group sync: when all parallel steps reach `done`, the group's main step transitions automatically.

**Tests**:
- Domain: 10+ tests for parallel-ops rules.
- HMI smoke: parallel group renders correctly.

**Commit message**: `feat(domain+hmi): add Device Execution Group with parallel steps swimlane (D4 of PROMPT_5_FULL)`

---

### D5 — 4-stage recovery flow + quality holds

**Goal**: when NOK is hit, instead of just "blocked", trigger 4-stage recovery state machine. Quality category steps can hold the WO until QC approves.

**Domain**:
- New: `packages/domain/src/machines/recovery.machine.ts` — 4-stage XState: `diagnosis → attempt_1 → attempt_2 → scrap`. From any stage can transition to `recovered` (operator marks issue resolved).
- New: `packages/domain/src/rules/quality-hold.rules.ts` — given a step, return whether it triggers a hold (e.g., visual_check + result NOK).

**HMI**:
- Modify NOK modal: now spawns a recovery sub-flow instead of just a blocked badge. Each stage shows the operator the suggested action.
- New: `apps/hmi/src/components/RecoveryFlow.tsx` — visual stage indicator + action buttons.
- Quality hold: when a QC step transitions to `qc_hold`, WO header shows banner "In attesa di approvazione QC". A user with `QC` skill can navigate to a separate `/qc-review` page (new route) and approve/reject.

**Backend**:
- New endpoints:
  - `POST /api/qc-review/:stepExecId/approve` — requires QC skill JWT
  - `POST /api/qc-review/:stepExecId/reject` { reason } — same
- Recovery transitions persist as audit events.

**Tests**:
- Domain: 15+ tests for recovery + quality-hold rules.
- API: 6+ tests for QC endpoints.

**Commit message**: `feat(domain+api+hmi): add 4-stage recovery flow + quality holds (D5 of PROMPT_5_FULL)`

---

### D6 — WO release flow + Socket.IO real-time

**Goal**: a manager can release a WO from an approved workflow. Operators see new WOs appear without refresh. Step transitions are visible in real-time across sessions.

**Backend**:
- New: `apps/api/src/modules/work-orders/work-orders.service.ts` (extend if exists)
  - `POST /api/work-orders/release` { workflowId, itemId, quantity, assignedOperatorId, assignedShift } → creates `WorkflowSnapshot` (deep clone of workflow tree), creates `WorkOrder`, initializes `StepExecution` records for every step in the snapshot.
  - Requires manager JWT (operator with `MANAGER` skill).
- Extend events gateway: emit `wo:released`, `wo:assigned`, `step:transition`, `qc_hold:created`, `recovery:started` events.

**HMI**:
- Modify `apps/hmi/src/app/dashboard/page.tsx` — subscribe to Socket.IO `wo:assigned` events for the current operator. New WO appears as a card with subtle animation.
- Modify `apps/hmi/src/app/wo/[id]/page.tsx` — subscribe to `step:transition` events for this WO. If another operator/system transitions a step (e.g., parallel ops), UI updates without refresh.

**Web admin** (separate concern, but tied to release):
- New: `apps/web/src/app/(workflows)/workflows/[id]/release/page.tsx` — manager UI to release a WO from this workflow's effective version. Form: select item + quantity + operator + shift. Submit → POST to `/api/work-orders/release`.

**Tests**:
- Domain (snapshot creation): 8+ tests
- API (release endpoint, RBAC for manager): 10+ tests
- HMI (Socket.IO subscription): smoke test

**Commit message**: `feat(api+web+hmi): add WO release flow + Socket.IO real-time (D6 of PROMPT_5_FULL)`

---

## 📂 Files to create / modify (final list)

### Create (estimated 25-30 new files)

**Backend (apps/api/)**:
- `src/modules/auth/auth.module.ts`, `auth.controller.ts`, `auth.service.ts`, `jwt.guard.ts`, `jwt.strategy.ts`
- `src/modules/auth/auth.service.test.ts`
- `src/modules/operators/pin-hash.util.ts` + `.test.ts`
- `src/modules/work-orders/work-orders.module.ts`, `work-orders.controller.ts`, `work-orders.service.ts`, `step-execution.service.ts` + tests
- `src/modules/qc-review/qc-review.module.ts`, `qc-review.controller.ts`, `qc-review.service.ts` + tests

**Domain (packages/domain/)**:
- `src/machines/step-execution.machine.ts` + `.test.ts`
- `src/machines/recovery.machine.ts` + `.test.ts`
- `src/rules/parallel-ops.rules.ts` + `.test.ts`
- `src/rules/quality-hold.rules.ts` + `.test.ts`

**HMI (apps/hmi/)**:
- `src/lib/api-client.ts`
- `src/components/ParallelStepLane.tsx`
- `src/components/RecoveryFlow.tsx`
- `src/app/qc-review/page.tsx`
- `src/app/qc-review/[stepExecId]/page.tsx`

**Web (apps/web/)**:
- `src/app/(workflows)/workflows/[id]/release/page.tsx`

### Modify

**Backend**:
- `src/main.ts` (cookie-parser + CORS)
- `src/app.module.ts` (register AuthModule, WorkOrdersModule, QcReviewModule)
- `src/modules/operators/operators.service.ts` (PIN hashing on create)
- `src/modules/events/events.gateway.ts` (new event types)
- `packages/prisma/seed.ts` (hash PINs for OP-001..OP-004)

**HMI**:
- `src/app/page.tsx` (real login)
- `src/app/dashboard/page.tsx` (useQuery(['me']) + real WOs)
- `src/app/wo/[id]/page.tsx` (XState + persistence + Socket.IO)
- `src/components/StepCard.tsx` (new states)
- `src/lib/operator-store.ts` (slim down — UI state only)
- DELETE: `src/lib/mock-data.ts`

**TODO.md** — close TODO-004, 017, 018, 019, 020, 021, 022, 023. Keep TODO-024 open (change-of-shift hand-off — deferred to post-MVP).

### Forbidden
- `packages/prisma/schema.prisma` — exception: only if you find a missing field critical for D6 (e.g., `WorkflowSnapshot.releasedBy String?`). STOP and ask before adding.
- Any file in `apps/web/src/app/(registries)/...` — registry CRUD untouched.

---

## 🧪 Phase 3 — Definition of Done

Per `prompts/DOD_TEMPLATE.md` v1.1.

### A. Tests
```powershell
pnpm test 2>&1 | Select-Object -Last 30
```
Expected: ≥260 tests passing (PROMPT_5_LITE baseline 182 + ~80 new across D1-D6), 0 failed.

### B. Build
```powershell
pnpm --filter @mes/api build 2>&1 | Select-Object -Last 10
pnpm --filter @mes/hmi build 2>&1 | Select-Object -Last 10
pnpm --filter @mes/web build 2>&1 | Select-Object -Last 10
pnpm build 2>&1 | Select-Object -Last 10
```
Expected: 0 errors all packages, 12/12 tasks.

### C. Runtime smoke
```powershell
pnpm dev
```
30 seconds wait. Expect:
- API: routes mapped including new auth/work-orders/qc-review
- Web: ready
- HMI: ready

Manual smoke (browser):
1. Login OP-001/1234 → JWT cookie set
2. Refresh `/dashboard` → still logged in
3. Open WO → run step OK → state persists
4. Open WO with parallel group → see swimlane
5. NOK on a step → recovery flow modal
6. Logout → cookie cleared, redirect to /

### D. Git
```powershell
git status
git diff --stat origin/main..HEAD
```
Expected: only files in declared scope. NO `schema.prisma` (unless explicitly approved).

### E. Push + merge
6 atomic commits. Push to worktree branch. Use `scripts/finalize-prompt.ps1` for merge:
```powershell
.\scripts\finalize-prompt.ps1 -Branch "claude/<your-branch>" -Title "PROMPT_5_FULL: HMI production-ready (Argon2 + 11-state + parallel + recovery + WO release + Socket.IO)"
```

---

## 🚫 Out of scope

(See "Hard constraints" section above.)

---

## 🆘 Failure protocol

If at any deliverable a check fails:
1. STOP immediately
2. Paste failing output verbatim
3. State hypothesis
4. Ask before fixing

If a deliverable would require schema changes not pre-approved, STOP and ask.

If at any point the scope feels bigger than 1 deliverable's worth (>4h Claude Code), STOP and ask whether to split.

---

## 🚀 Begin

When the user pastes this prompt:

1. Confirm context loaded (read all required files)
2. Summarize PROMPT_5_FULL scope in 12-15 lines
3. Identify any schema gaps and ASK before adding fields
4. List ambiguities
5. Wait for "go" before Phase 2

Do NOT start coding before explicit "go".

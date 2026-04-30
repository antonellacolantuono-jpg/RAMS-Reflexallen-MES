# PROMPT_5_LITE — HMI Execution (lite for same-day demo)

> **Type**: Build prompt for Claude Code Desktop (Step 5 of 6, LITE scope)
> **Predecessor**: PROMPT_3b_REDUCED (commit `515fc6b`, merged April 30 morning)
> **Successor**: PROMPT_4 (Auto-Generation Engine, post-demo)
> **Estimated Claude Code time**: 3-4 hours
> **Last updated**: 2026-04-30
> **Status**: Active — LITE scope; full PROMPT_5 (with Argon2, 11-state machine, parallel ops, recovery) deferred to post-demo.

---

## ⚠️ Why "LITE"

This is a **deliberately scoped-down** version of PROMPT_5. The original PROMPT_5 covers full execution (Argon2id PIN auth, 11-state step machine, parallel ops, 4-stage recovery, quality holds, WO release flow, JWT cookies, audit trail at every transition).

For same-day delivery alongside PROMPT_3b_REDUCED, this version covers the **happy-path execution flow** only — enough to demo "operator opens HMI, logs in, executes a workflow, finishes". Everything else (and there's a lot of "everything else") is consolidated into `PROMPT_5_FULL.md` for post-demo completion.

---

## 🎯 Goal

Build a navigable HMI execution flow (`localhost:3002`) that demonstrates a complete operator journey:

1. **Login screen** — operator enters badge ID + PIN keypad (mock validation, no real auth)
2. **Operator dashboard** — shows current shift + a list of mock Work Orders assigned to the logged-in operator
3. **Workflow execution** — opens a WO, sees its steps in sequence, can mark each step as OK or NOK, completes the WO

Sufficient for a demo that shows "the operator side of the MES exists and is touch-friendly". NOT production-ready.

After this prompt is verified done, a viewer of the demo can:
- See the HMI login PIN keypad and click through with mock badge `OP-001` + PIN `1234`
- See a dashboard listing Work Orders (hardcoded, but realistic — uses operator names from seed)
- Click a WO → see its workflow steps with progress bar
- Tap each step "OK" or "NOK" → see status update
- Complete the WO → success screen

---

## ⚠️ Hard constraints — DO NOT violate

### Schema is sacred
**DO NOT modify `packages/prisma/schema.prisma`.** All HMI data is mock/hardcoded for demo. Real persistence is in PROMPT_5_FULL.

### No real auth
**DO NOT implement JWT, refresh tokens, Argon2id, or any real auth flow.** Mock PIN validation is hardcoded client-side comparing against a static map (e.g., `{ 'OP-001': '1234', 'OP-002': '2222' }`). Real auth is in PROMPT_5_FULL with full backend integration.

### No backend changes
**DO NOT touch any file in `apps/api/`** beyond reading. The HMI in this LITE version is fully client-side React with hardcoded mock data. No new endpoints, no new modules, no DB queries.

### Stack alignment
- ✅ Next.js 14 + React 18 + TypeScript strict (apps/hmi)
- ✅ Tailwind + Reflexallen design tokens (already in `apps/hmi/src/app/globals.css`)
- ✅ Touch targets ≥ 44px (industrial UI requirement)
- ✅ XState v5 for step execution state (use simple machine for status: pending → running → done OR pending → running → blocked)
- ✅ Zustand if you need cross-page state (e.g., logged-in operator). React Context is also fine for simple use.

### No work outside scope
- ❌ NO real Argon2id PIN hashing
- ❌ NO JWT or session cookies
- ❌ NO backend API for auth
- ❌ NO 11-state step machine — only pending / running / done / blocked
- ❌ NO parallel ops (Device Execution Group with concurrent steps)
- ❌ NO 4-stage recovery flow
- ❌ NO quality holds (workflow can't be paused for QC review in LITE)
- ❌ NO scrap/rework UI
- ❌ NO real WO release flow (WOs are hardcoded mocks)
- ❌ NO Socket.IO real-time updates (HMI is purely client-side state)
- ❌ NO printable label generation
- ❌ NO Andon link or escalation
- ❌ NO change-of-shift / hand-off flow
- ❌ NO Prisma schema changes
- ❌ NO modifications to apps/api or apps/web

If something feels needed but is in this list, STOP and ask rather than expanding scope.

---

## 📚 Required reading before planning

| File | Why |
|---|---|
| `STATUS.md` | Current state, latest baseline |
| `TODO.md` | Known issues — context for what NOT to fix |
| `prompts/DOD_TEMPLATE.md` v1.1 | Verification gates |
| `MASTER_SPECIFICATION.md` (if exists) | HMI requirements (touch sizes, gloves, density modes) |
| `apps/hmi/src/app/page.tsx` | Existing HMI login mockup (D6 of PROMPT_2) — extend or replace |
| `apps/hmi/src/app/globals.css` | Reflexallen design tokens |
| `apps/hmi/package.json` | Current deps (react-hook-form, zustand, xstate likely already there since web/api use them) |
| `apps/hmi/tsconfig.json` | TS config |
| `apps/web/src/components/shell/Sidebar.tsx` | Reference for how the design system is applied (use same tokens) |
| `apps/web/src/components/registry/RegistryListPage.tsx` | Reference for layout patterns |
| `packages/prisma/MOCK_DATA_PNEUMATIC_AIR.md` (or seed.ts) | Real mock data we already have: operators (OP-001..OP-004), skills, items. Use these names in hardcoded data. |
| `packages/types/src/enums/step.enum.ts` | StepCategory + StepActionType enums (used to render step types in HMI) |
| `packages/domain/src/machines/work-order.machine.ts` | Reference for state machine pattern (don't reuse, but follow same XState v5 style) |

After reading, summarize in 8-12 lines:
- D1/D2/D3/D4 scope IN/OUT
- Mock data plan (which operator, which WOs, which steps)
- Routes to add (e.g., `/`, `/dashboard`, `/wo/[id]`, `/step/[stepId]`, `/wo/[id]/done`)
- State management choice (Zustand global or React Context)
- Any ambiguity needing clarification

Wait for explicit "go" before Phase 2.

---

## 🛠 Phase 2 — Build (after user "go")

Execute D1, D2, D3, D4 in order. After each: run verification commands, paste literal output, suggest commit message, wait for user "ok next".

### D1 — Login screen with PIN keypad

**Goal**: replace or extend the current HMI login mockup with a working PIN keypad. Click PIN digits → on submit, validates against hardcoded map → redirect to dashboard.

**Files to create / modify**:
- `apps/hmi/src/app/page.tsx` — replace placeholder content with PinKeypad UI:
  - Badge field (text input, autofocus)
  - 4-digit PIN keypad (12 buttons: 1-9, 0, clear, backspace)
  - "Accedi" submit button
  - On submit: validate against `MOCK_OPERATORS` map. If valid → `useOperatorStore.setState({ operatorId, badge, pin })` and `router.push('/dashboard')`. If invalid → show "Badge o PIN errato" error.
  - All buttons ≥ 56px tall (touch targets, gloves-friendly)
  - Clean, large, industrial style. Use Reflexallen tokens.

- `apps/hmi/src/components/PinKeypad.tsx` — reusable keypad component
- `apps/hmi/src/lib/mock-data.ts` — single file with all mock data:
  ```typescript
  export const MOCK_OPERATORS = {
    'OP-001': { id: '...', firstName: 'Marco', lastName: 'Rossi', pin: '1234', currentShift: 'A' },
    'OP-002': { id: '...', firstName: 'Giulia', lastName: 'Bianchi', pin: '2222', currentShift: 'A' },
    'OP-003': { id: '...', firstName: 'Luca', lastName: 'Verdi', pin: '3333', currentShift: 'B' },
    'OP-004': { id: '...', firstName: 'Anna', lastName: 'Neri', pin: '4444', currentShift: 'B' },
  } as const

  export const MOCK_WORK_ORDERS = [
    { id: 'WO-2026-0001', code: 'WO-2026-0001', itemCode: 'FG-PNEU-5M-8MM', itemName: 'Tubo pneumatico 5m 8mm', quantity: 50, completed: 12, assignedTo: 'OP-001', priority: 'high', status: 'in_progress', startedAt: '2026-04-30T08:00:00Z' },
    { id: 'WO-2026-0002', ... }, // 4-5 WOs total per OP-001 alone
    ...
  ]

  export const MOCK_WORKFLOW_STEPS = (woId: string) => {
    // Hardcoded sequence per WO. Returns:
    // [{ id, woId, name, category, instructions, standardTimeSec, status: 'pending'|'running'|'done'|'blocked', skillCode, deviceCode }]
    // 5-8 steps per WO, varied categories
  }
  ```

- `apps/hmi/src/lib/operator-store.ts` — Zustand store for the logged-in operator. Persisted to `sessionStorage` so a refresh doesn't kick the operator out (mock-only — real auth uses cookies in PROMPT_5_FULL).

**Verification (paste literal output)**:
```powershell
pnpm --filter @mes/hmi build 2>&1 | Select-Object -Last 10
pnpm test 2>&1 | Select-Object -Last 5
```
Expected: 0 errors, ≥182 tests passing (no test changes).

**Commit message**: `feat(hmi): add PIN keypad login with mock operator validation (D1)`

---

### D2 — Operator dashboard

**Goal**: After login, operator lands on `/dashboard` and sees their assigned Work Orders.

**Files to create / modify**:
- `apps/hmi/src/app/dashboard/page.tsx` — protected route (redirects to `/` if no operator in store):
  - Header: "Bentornato, [firstName] [lastName]" + current shift + logout button
  - Active WO list: cards with WO code, item name, progress bar (completed / quantity), priority badge, "Inizia →" or "Continua →" button
  - Tap a WO card → `router.push('/wo/<id>')`
  - Empty state if no assigned WOs
  - Touch-friendly: card height ≥ 80px, big tap targets

- `apps/hmi/src/components/WorkOrderCard.tsx` — reusable card

**Behavior**:
- Reads logged-in operator from `useOperatorStore`
- Filters `MOCK_WORK_ORDERS` by `assignedTo === operator.badge`
- Shows shift-relevant WOs only (current logic: all WOs for the logged-in op; full PROMPT_5 will filter by current shift)

**Verification**:
Same as D1.

**Commit message**: `feat(hmi): add operator dashboard with assigned WO list (D2)`

---

### D3 — Workflow execution screen

**Goal**: Operator opens a WO, sees its workflow steps in sequence, can mark each as OK / NOK.

**Files to create / modify**:
- `apps/hmi/src/app/wo/[id]/page.tsx` — protected route:
  - Header: WO code + item name + progress bar + "Esci" button
  - Vertical timeline of steps: each step is a card with name, category icon, status badge (pending/running/done/blocked)
  - Current step is highlighted (running)
  - Active step shows: instructions text + standard time + skill required + device + "OK" big button + "NOK" smaller button
  - Past steps (done) are collapsed/dimmed
  - Future steps (pending) are dimmed
  - Tap "OK" → step transitions to `done`, next pending step transitions to `running`
  - Tap "NOK" → step transitions to `blocked`, modal opens "Cosa è andato storto?" with simple textarea (no real persistence). Submit → step stays `blocked`, but for demo continue with next step.

- `apps/hmi/src/lib/execution-state.ts` — XState v5 simple step machine:
  ```typescript
  // states: 'pending' | 'running' | 'done' | 'blocked'
  // events: { type: 'START' } | { type: 'COMPLETE_OK' } | { type: 'COMPLETE_NOK', notes: string }
  ```
  Or simpler: just useState/useReducer in the component with explicit transitions. XState is overkill for 4 states + 3 events; documented here as an option per CLAUDE.md "stack: XState".

- `apps/hmi/src/components/StepCard.tsx` — reusable

**State persistence (LITE compromise)**:
- WO execution state lives in client memory only. Refresh = start over.
- This is documented as a TODO. Real persistence needs `StepExecution` model writes (PROMPT_5_FULL).

**Verification**:
Same as D1 + D2.

**Commit message**: `feat(hmi): add workflow execution screen with OK/NOK step transitions (D3)`

---

### D4 — Done screen + TODO.md update

**Goal**:
1. When all steps in a WO are done, redirect to `/wo/[id]/done` with a success message + "Torna al dashboard" button.
2. Add 4-6 TODO entries tracking everything skipped in PROMPT_5_LITE.

**Files to create / modify**:
- `apps/hmi/src/app/wo/[id]/done/page.tsx` — success screen:
  - Large green check icon
  - "Ordine di lavoro [code] completato!"
  - Stats: total time, # of steps OK, # NOK
  - "Torna al dashboard" big button → `/dashboard`

- `TODO.md` — append new entries (use next free number, currently TODO-016 was the last):

| ID | Severity | Title (one-line) |
|---|---|---|
| TODO-017 | HIGH | PROMPT_5_FULL: real Argon2id PIN auth + JWT cookies + refresh + /api/auth endpoints |
| TODO-018 | HIGH | PROMPT_5_FULL: full 11-state step machine (pending/running/paused/blocked/qc_hold/scrapped/recovered/done/skipped/cancelled/error) |
| TODO-019 | HIGH | PROMPT_5_FULL: parallel ops (Device Execution Group with swimlane UI) |
| TODO-020 | HIGH | PROMPT_5_FULL: 4-stage recovery flow (diagnosis → attempt 1 → attempt 2 → scrap) with state machine |
| TODO-021 | HIGH | PROMPT_5_FULL: WO release flow (Plant Manager creates real WO from approved workflow snapshot — this also unblocks PROMPT_3c) |
| TODO-022 | MEDIUM | PROMPT_5_FULL: real persistence — StepExecution writes via /api/work-orders/:id/steps/:sid endpoints (replace HMI-LITE client-state) |
| TODO-023 | MEDIUM | PROMPT_5_FULL: Socket.IO real-time updates (operator A sees operator B's progress live, manager dashboard refreshes) |
| TODO-024 | MEDIUM | PROMPT_5_FULL: change-of-shift hand-off flow + paper printout |
| TODO-025 | LOW | HMI logo broken (pre-existing TODO-002) — verify still relevant after PROMPT_5_LITE landing page changes |

**Verification**:
```powershell
git diff TODO.md
```
Expected: 9 new entries appended, no deletions.

**Commit message**: `feat(hmi): add WO done screen + track 9 PROMPT_5_FULL items as TODOs (D4)`

---

## 📂 Files to create / modify (final list)

**Create**:
- `apps/hmi/src/components/PinKeypad.tsx`
- `apps/hmi/src/lib/mock-data.ts`
- `apps/hmi/src/lib/operator-store.ts`
- `apps/hmi/src/app/dashboard/page.tsx`
- `apps/hmi/src/components/WorkOrderCard.tsx`
- `apps/hmi/src/app/wo/[id]/page.tsx`
- `apps/hmi/src/lib/execution-state.ts` (optional, only if you choose XState; otherwise inline useReducer)
- `apps/hmi/src/components/StepCard.tsx`
- `apps/hmi/src/app/wo/[id]/done/page.tsx`

**Modify**:
- `apps/hmi/src/app/page.tsx` (replace mock with real PinKeypad screen)
- `TODO.md` (append 9 entries)
- `apps/hmi/package.json` (only if you need to add zustand/xstate as direct deps — likely already transitive via @mes/web pattern)
- `pnpm-lock.yaml` (if package.json changes)

**Forbidden**:
- `packages/prisma/schema.prisma`
- Any file in `apps/api/`
- Any file in `apps/web/` (except read-only inspection)
- Any registry module
- TODO-001..016 entries (don't modify, only append)

---

## 🧪 Phase 3 — Definition of Done

Per `prompts/DOD_TEMPLATE.md` v1.1.

### A. Tests
```powershell
pnpm test 2>&1 | Select-Object -Last 30
```
Expected: ≥182 passing, 0 failed (no HMI tests are required in LITE).

### B. Build
```powershell
pnpm --filter @mes/hmi build 2>&1 | Select-Object -Last 15
pnpm build 2>&1 | Select-Object -Last 10
```
Expected: 0 errors, all 12 tasks successful.

### C. Runtime smoke (lightweight — paste only the "Ready" lines)
```powershell
pnpm dev
```
Wait 30 seconds, expect:
- API: routes mapped (no TS errors)
- Web: "Ready in Xs"
- HMI: "Ready in Xs"

### D. Git
```powershell
git status
git diff --stat origin/main..HEAD
```
Expected:
- Working tree clean
- Only files in `apps/hmi/` + `TODO.md` + (optionally) `pnpm-lock.yaml`
- NO `schema.prisma`, NO `apps/api`, NO `apps/web`

### E. Suggested commit + push

4 atomic commits (one per D), or 1 squashed if you prefer:
```powershell
# (commits as suggested per D)
git push origin claude/<your-worktree-branch>
```

STOP. Paste:
- Build output (Gate B last 10 lines)
- Test count
- git diff --stat
- 4 commit hashes
- Push output

Wait for user merge.

---

## 🚫 Out of scope (DO NOT do these)

- ❌ Real Argon2id PIN hashing
- ❌ JWT, sessions, cookies, /api/auth endpoints
- ❌ 11-state step machine (LITE: pending/running/done/blocked only)
- ❌ Parallel ops (Device Execution Group)
- ❌ 4-stage recovery flow
- ❌ Quality holds, scrap/rework UI
- ❌ WO release flow (WOs are hardcoded mocks)
- ❌ Socket.IO real-time
- ❌ Real `StepExecution` writes (LITE: client-state only)
- ❌ Change-of-shift / hand-off
- ❌ Andon link / escalation
- ❌ Printable labels
- ❌ Schema modifications
- ❌ Touching apps/api or apps/web

---

## 🆘 Failure protocol

If at any deliverable a check fails:
1. STOP immediately
2. Paste the failing output verbatim
3. State your hypothesis
4. Ask before fixing

If a deliverable seems to require something outside scope to "feel complete", **STOP and ask**.

---

## 🚀 Begin

When the user pastes this prompt:

1. Confirm context loaded (read all required files)
2. Summarize PROMPT_5_LITE scope in 8-12 lines
3. List any ambiguity
4. Wait for "go" before Phase 2

Do NOT start coding before explicit "go".

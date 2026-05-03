# TODO — RAMS-Reflexallen-MES

> **Purpose**: Track known issues and technical debt that cannot be fixed in the current session but must not be forgotten.
> **Owner**: Antonella
> **Last updated**: 2026-05-02 (PROMPT_PNE_3 D3 — opened TODO-044)

---

## How to use this file

- Each entry has a unique ID, severity, and a clear acceptance criterion.
- When fixing an entry, link the commit/PR that closes it and move it to the "Resolved" section.
- Add new entries at the top of the relevant severity bucket.
- Review this file before starting any new PROMPT session (part of pre-flight check).

---

## 🟠 High priority (should fix before MVP — May 8-9)

### TODO-043 — PROMPT_PNE_3: wire SimulatorRegistry into step-execution dispatch

**Status**: ✅ **CLOSED by PROMPT_PNE_4_FOCUSED D2** (2026-05-03, commit `d61fc86`).
**Resolution**: New `MockDeviceDispatcherService` (`apps/api/src/modules/mock-devices/mock-device-dispatcher.service.ts`) registered in `MockDevicesModule`, injected into `StepExecutionService` via `@Optional` + `forwardRef` (avoids circular dep — `FastForwardController` moved to `WorkOrdersModule` to clean up the prior MockDevicesModule → WorkOrdersModule import). The 3 simulator services (leak/camera/crimp) gained an optional `CycleCompletionListener` parameter on `start()` that fires when `complete()` runs. `StepExecutionService.applyTransition` triggers `dispatcher.dispatch(...)` after `START` lands a `device_run` device_main step on a known mock serial under `DEMO_MODE`; the registered outcome listener fires the matching `COMPLETE_OK` (PASS/MARGINAL) or `COMPLETE_NOK` (FAIL, causeCode=`auto_device_fail`) follow-up transition. Identity captured at dispatch time (req.changedBy / plantId) with `DEMO_USER_ID`/`DEMO_PLANT_ID` env fallback (Lesson 56). Real-device path is a silent no-op (canDispatch returns false for unknown serials).
**Verification**: end-to-end runtime smoke confirmed — Mario Rossi login → POST transitions/START on STEP-LEAK-003 → simulator runs 45s → cycle PASS → step auto-transitioned to `status: "done"`, `result: "ok"` (commit `d61fc86` notes).

---

### TODO-017 — PROMPT_5_FULL: real Argon2id PIN auth + JWT cookies + /api/auth endpoints

**Discovered**: 2026-04-30 (during PROMPT_5_LITE)
**Status**: 🟡 PARTIAL — D1+D2 of PROMPT_5_FULL closed the core auth flow on 2026-04-30. Refresh-token rotation deferred (8h sliding window via re-login is acceptable for demo).
**File**: `apps/api/src/modules/auth/` (new module) + `apps/hmi/src/app/page.tsx` + new HMI auth client
**Symptom**: HMI login validates the operator badge + PIN against a hardcoded `MOCK_OPERATORS` map in `apps/hmi/src/lib/mock-data.ts`. There is no real authentication: PINs are stored in plaintext, no hashing, no session, no /api/auth endpoint, no token, no refresh. The Zustand store persists the "logged-in operator" to `sessionStorage` only — anyone can write to that store from devtools.
**Acceptance criterion**:
- ✅ Operators are seeded with Argon2id-hashed PINs (replaces TODO-004) — done in D1.
- ✅ `POST /api/auth/login` accepts `{ badge, pin }` and returns a short-lived JWT (httpOnly secure cookie) — done in D1.
- ❌ `POST /api/auth/refresh` rotates the access token — DEFERRED (relogin every 8h acceptable for demo; revisit before prod).
- ✅ `POST /api/auth/logout` clears the cookie — done in D1.
- ✅ HMI guards every protected route via the cookie (`useMe` on top of `/api/auth/me`) — done in D2.
- ✅ Bcrypt is forbidden — Argon2id only (per CLAUDE.md) — done in D1.
**Remaining effort for refresh-token rotation**: ~1-2 hours. Add `RefreshToken` model + `/api/auth/refresh` endpoint that rotates the access cookie + revokes the old refresh token.
**Estimated effort**: 4-6 hours (4h delivered in D1+D2; 1-2h remaining for refresh rotation)
**Blocker for**: any non-demo HMI deployment. Supersedes TODO-004.

---

### TODO-018 — PROMPT_5_FULL: full 11-state step execution machine

**Discovered**: 2026-04-30 (during PROMPT_5_LITE)
**File**: `apps/hmi/src/app/wo/[id]/page.tsx` + new `packages/domain/src/machines/step-execution.machine.ts` + new `apps/api/src/modules/work-orders/step-executions/`
**Symptom**: PROMPT_5_LITE collapses step status into 4 states (`pending`/`running`/`done`/`blocked`) using an inline `useReducer`. The MASTER_SPECIFICATION calls for an 11-state XState machine: `pending`, `running`, `paused`, `blocked`, `qc_hold`, `scrapped`, `recovered`, `done`, `skipped`, `cancelled`, `error`. None of the recovery / hold / scrap / skip transitions are wired.
**Acceptance criterion**:
- New XState v5 machine in `packages/domain` covering all 11 states with formal guards/actions.
- Tests in `packages/domain` cover every transition (target ≥ 95% coverage per TESTING_STRATEGY.md).
- HMI execution screen replaces the LITE `useReducer` with the machine via `@xstate/react`.
- Status-bound UI variants for every state (paused = yellow border, qc_hold = warn icon, scrapped = bad icon + crossed-out, etc.).
**Estimated effort**: 3-4 hours
**Blocker for**: real production execution semantics; ties into recovery (TODO-020) and quality holds.

---

### TODO-019 — PROMPT_5_FULL: parallel operations (Device Execution Group)

**Discovered**: 2026-04-30 (during PROMPT_5_LITE)
**File**: `apps/hmi/src/app/wo/[id]/page.tsx` (extend) + new `apps/hmi/src/components/SwimlaneTimeline.tsx`
**Symptom**: HMI LITE renders steps as a **single vertical timeline** — only one step is `running` at a time. The MASTER_SPECIFICATION defines a Device Execution Group where a main step (e.g. autoclave run, leak test) runs **concurrently** with sub-steps (operator can perform setup of next batch while the device is running). LITE collapses these into sequential steps.
**Acceptance criterion**:
- Detect Device Execution Groups in the workflow snapshot and render them as a **horizontal swimlane** (main lane + parallel-step lanes).
- Operator can transition steps in different lanes independently.
- Buffer time between main and parallel steps is configurable (matches `Step.deviceCategory` enum: `pre`/`device_main`/`parallel`/`post`).
- Stops the WO from completing until all lanes terminate.
**Estimated effort**: 4-6 hours
**Blocker for**: CFRP autoclave cure cycles (4-12h main step, multiple parallel ops); Pneumatic Air leak-test parallel batches.

---

### TODO-020 — PROMPT_5_FULL: 4-stage recovery flow with state machine

**Status**: ✅ **CLOSED by PROMPT_5_FULL D5** (2026-05-01).
**Resolution**: Recovery flow shipped as a **single-StepExecution model with stage-machine tracking** (not separate steps per stage — pragmatic deviation from the original acceptance criterion, see TODO-026 for the rationale and the work that *would* be needed to switch to per-stage StepExecutions if PROMPT_4 auto-generation requires it).
**Delivered**:
- New XState v5 machine `packages/domain/src/machines/recovery.machine.ts` (5 states: diagnosis, attempt_1, attempt_2, recovered, scrap; 5 events) with 23 unit tests covering every transition + helpers (`nextRecoveryStage`, `isMaxAttemptsReached`).
- New rule module `packages/domain/src/rules/quality-hold.rules.ts` (4 predicates) with 10 unit tests.
- `apps/api/src/modules/work-orders/step-execution.service.ts` extended to track `recoveryStage` + `attemptCount` in `StepExecution.data` JSON column (zero schema change). Auto-scrap is enforced server-side: a COMPLETE_NOK fired with prior `attemptCount >= 2` chains a `MARK_SCRAPPED` transition with reason `auto_scrap_max_attempts`.
- New module `apps/api/src/modules/qc-review/` with `GET /api/qc-review`, `POST /:id/approve`, `POST /:id/reject` (RBAC: requires QC skill via OperatorSkill join, plant-scoped) — 11 unit tests.
- HMI: new `RecoveryFlow` component with Italian stepper UI (Diagnosi → Tentativo 1 → Tentativo 2 → Scarto), wired into `wo/[id]/page.tsx` for blocked + recovered statuses. New routes `/qc-review` (list) and `/qc-review/[stepExecId]` (approve/reject). Dashboard exposes a "Revisione QC" button only for operators with QC skill (skillCodes pulled from `/api/auth/me`).
- `/api/auth/me` extended with `skillCodes: string[]` (additive, non-breaking — pre-D5 clients ignore the field).
**Audit**: every transition (including the auto-scrap chain) emits a `state_change` AuditLog entry with `before`, `after.event`, `after.recoveryStage`, `after.attemptCount`. Socket.IO `step:transition` is also emitted twice on auto-scrap (once for blocked, once for scrapped).

---

### TODO-021 — PROMPT_5_FULL: WO release flow (Plant Manager)

**Status**: ✅ **CLOSED by PROMPT_5_FULL D6** (2026-05-01).
**Resolution**: Plant Manager release flow shipped end-to-end:
- New `POST /api/work-orders/release` endpoint with MANAGER-skill RBAC (mirrors D5 QC pattern via `OperatorSkill→Skill` join). 403 returned when caller lacks MANAGER, 422 when workflow currentVersion is not `approved`, 400 on invalid quantity, 404 on missing item/operator/shift.
- Single Prisma `$transaction` creates: WorkOrder (status='released', actualStart=null per Q4), WorkflowSnapshot (deep-clone of full Phase→Group→Step tree, JSON-serialized into `snapshotData`), one StepExecution per cloned step (status=pending), and a WorkOrderAssignment (status='accepted'). Optional ShiftAssignment when `assignedShiftId` provided.
- New web admin page `apps/web/src/app/(registries)/workflows/[id]/release/page.tsx` (form: Item×Qty×Operator×Priority) + "Rilascia WO" button on workflow detail (visible only when `currentVersion.status === 'approved'`).
- `WorkOrder.code` follows `WO-YYYYMMDD-NNN` per-plant per-day sequence.
- Snapshot is IMMUTABLE post-release (per ADR-001) — subsequent edits to source workflow do not affect in-flight WOs.
- Audit log records `WorkOrder/state_change/release` with snapshotId + stepExecutionCount.
- Domain helpers: `cloneWorkflowTree` + `listClonedStepIds` in `packages/domain/src/rules/workflow-snapshot.rules.ts` (8 unit tests). MANAGER skill predicate in `packages/domain/src/rules/manager.rules.ts` (3 unit tests).
- Seed extended: MANAGER skill added to skill registry; OP-001 ↔ MANAGER OperatorSkill assignment; demo workflow `WF-PNEU-CURE-DEMO` migrated from `effective` to `approved` so the release flow is testable on first seed.
**Verification (runtime smoke, 2026-05-01)**:
- OP-001 (MANAGER) login → POST /api/work-orders/release → 200 with `{ workOrderId, workOrderCode: WO-20260501-001, snapshotId, stepExecutionCount: 5 }`.
- OP-002 (no MANAGER) login → POST /api/work-orders/release → 403 Forbidden.
- OP-002 GET /api/work-orders/mine → released WO visible immediately (status=ready, qty=25).

---

### TODO-008 — PROMPT_3b_FULL: missing step configurator forms

**Status**: ✅ **CLOSED by PROMPT_3b_FULL Session A** (2026-05-01).
**Resolution (with reinterpretation)**: original entry assumed PARALLEL was a top-level `StepCategory`. In reality `StepCategory` has 9 values (`production, logistics, identification, quality_control, decision, information, setup, teardown, recovery`) and PARALLEL is a `StepDeviceCategory` flag on the Step model (`pre|device_main|parallel|post`). Session A delivered:
- 3 new step forms covering the truly missing categories: `DecisionStepForm`, `InformationStepForm`, `TeardownStepForm` (StepConfigurator now covers 9/9 categories).
- `deviceCategory` selector added inside `ProductionStepForm` to capture the parallel-ops semantics on the data side (HMI swimlane rendering already shipped in PROMPT_5 D4).
- `WorkflowPalette` `STEP_ITEMS` extended (decision, information, teardown).
- `WorkflowCanvas` `DEFAULT_ACTION_TYPE` extended for the 3 new categories + recovery; `buildSavePayload` now reads `isCycleBased`, `supportsParallel`, `supportsRecovery` from `node.data` instead of hardcoding `false`.
**Note**: form-internal type fields (`decisionType`, `informationType`, `teardownType`, `attachmentUrl`, `causeCodeId`, `deviceCategory`) remain session-only by design — consolidated under TODO-016.

---

### TODO-010 — PROMPT_3b_FULL: versioning UI lifecycle modals

**Status**: ✅ **CLOSED by PROMPT_3b_FULL Session B** (2026-05-01).
**Wording correction**: original TODO described a 5-state submit→review→approve/reject→publish flow that does not exist in the codebase. The actual `WorkflowVersion` lifecycle is **3-state** (`draft → approved → deprecated`) per [packages/domain/src/machines/workflow.machine.ts](packages/domain/src/machines/workflow.machine.ts) and the `canTransition` rule. Session B implements that real lifecycle.
**Resolution**:
- Backend: 2 new controller endpoints (`POST /workflows/:id/versions/:vid/approve`, `…/deprecate`) + 2 service methods (`approveVersion`, `deprecateVersion`) gated by `canTransition` from `@mes/domain` + structural validation via `validateWorkflowStructure` on approve. `ConflictException` for invalid transitions; `BadRequestException` for empty/structural errors. Audit log entries with `state_change` action capture before/after status (and `reason` on deprecate). 12 new service tests + 4 new controller tests (zod parse + happy path).
- Frontend: `ApproveVersionModal` (uses `useValidationContext` to block approval when validation errors are present), `DeprecateVersionModal` (required `reason` ≥10 chars, IATF traceability), `VersionHistorySidebar` (right rail, lists all versions with status/createdAt/approvedBy). Wired into the workflow detail page header.
- SDK: `WorkflowsClient.approveVersion()` + `.deprecateVersion(reason)`.

---

### TODO-001 — Seed creates ~35 soft-deleted records as side effect

**Discovered**: 2026-04-28 (afternoon, during PROMPT_2 verification)
**File**: `packages/prisma/seed.ts`
**Symptom**: After `pnpm --filter @mes/prisma run db:seed`, navigating to `localhost:3001/tools` (and `/recipes`, `/bom`, etc.) shows "Nessun elemento trovato" with a banner "X elementi eliminati". The cestino (`/trash`) shows ~35 records soft-deleted at the same timestamp as the seed.
**Hypothesis**: The seed script likely sets `deletedAt: <date>` on some records, or has a cleanup step that soft-deletes after creation. Needs reading.
**Acceptance criterion**:
- After fresh seed, every registry list page (`/tools`, `/recipes`, `/bom`, `/equipment`, `/operators`, `/skills`, `/cause-codes`, `/attention-points`, `/items`) shows the expected count from `MOCK_DATA_PNEUMATIC_AIR.md` with **zero** records in trash.
- Re-running seed is still idempotent (counts don't increase).
**Estimated effort**: 30-60 min (depends on root cause)
**Blocker for**: nothing currently (cosmetic). Could be relevant if PROMPT_3 needs to test workflows that consume tools/recipes — in that case fix first.

---

### TODO-002 — HMI logo broken in browser

**Discovered**: 2026-04-28 (afternoon, during PROMPT_2 verification)
**File**: `apps/hmi/src/app/page.tsx` (or wherever the login mockup renders the logo)
**Symptom**: On `localhost:3002`, the brand logo is shown as a broken image with alt text "Reflexallen" visible.
**Root cause confirmed**: Asset path mismatch. The SVG files exist correctly in `apps/hmi/public/brand/` (verified: 10 SVGs including `reflexallen-logomark-light.svg`, `rams-logo-light.svg`, etc.), but the `<img src="...">` in the page references a wrong path.
**Acceptance criterion**:
- Visiting `localhost:3002` shows the Reflexallen logo correctly rendered (not broken image icon).
- DevTools network tab shows 200 for the logo asset.
**Estimated effort**: 5-10 min (find the offending line, update the path)
**Blocker for**: nothing (cosmetic). Demo polish.

---

## 🟡 Medium priority (good to have)

### TODO-044 — DemoToggle Panel: replace 2s polling with WebSocket subscription

**Discovered**: 2026-05-02 (during PROMPT_PNE_3 D3)
**Status**: 🟢 PENDING — D3 ships polling intentionally; WebSocket integration deferred.
**File**: `apps/web/src/components/demo/DemoPanel.tsx` + `apps/api/src/modules/events/work-order-events.gateway.ts` (already emits `device:cycle:started/progress/complete` from PROMPT_PNE_3 D1)
**Symptom**: D3 of PROMPT_PNE_3 wires the Demo Toggle Panel state via a `setInterval`-based 2s polling loop on `GET /api/internal/mock-devices`. The simulators ALREADY broadcast `device:cycle:started/progress/complete` via `WorkOrderEventsGateway` (added in D1) — those broadcasts are not yet consumed on the web side. Polling is acceptable for the demo (3 devices, low traffic) but adds a baseline of ~30 requests/min per open tab and lags real-time progress (sub-second cycle telemetry on crimp gets aliased to 2s ticks).
**Acceptance criterion**:
- New `useDeviceEventsSubscription()` hook in `apps/web/src/lib/demo-api.ts` (or a new `apps/web/src/lib/socket.ts`) opens a `socket.io-client` connection to `NEXT_PUBLIC_WS_URL`, listens to `device:cycle:started/progress/complete`, and merges the payload into `MockDeviceStatus` via the same shape `getMockDeviceStatus()` returns.
- DemoPanel drops the `setInterval(2000)` loop and calls `useDeviceEventsSubscription()` instead. Initial fetch (`listMockDevices`) on mount is preserved as the baseline state.
- Cleanup on unmount: socket disconnect + listener removal (mirror the HMI pattern from `apps/hmi/src/lib/socket.ts` once it lands per TODO-023 follow-up).
- DEV MODE leaves the room ungated (broadcast). Production hardening (per-device room scope) is captured by TODO-017 follow-up.
**Estimated effort**: 1-2 hours (socket client wiring + hook + DemoPanel migration + tests).
**Blocker for**: nothing in MVP demo (polling is sufficient). Owner: F2 PROMPT_7 or earlier if Reflex Allen demo prep flags polling lag on the cycle progress display.

---

### TODO-042 — PROMPT_PNE_2 § 1 summary said "19 steps" but enumeration totals 34 step rows (documentation hygiene only)

**Discovered**: 2026-05-02 (during PROMPT_PNE_2 D3 implementation)
**File**: `prompts/PROMPT_PNE_2.md` § 1 summary
**Symptom**: PROMPT_PNE_2 § 1 says workflow v1 has "4 phases / 4 groups / 19 steps". The per-step enumeration in § 3.2 totals **26 main-path steps** (Phase 1 = 8, Phase 2 = 9, Phase 3 = 4, Phase 4 = 5) **+ 8 inline recovery steps** (B2 4 + C2 4) = **34 step rows**. The "19" figure was an informal undercount in the summary block — the enumerated step list is the authoritative source.
**Acceptance criterion** (documentation only):
- Future PROMPT spec rewrites should reconcile the abstract figure in § 1 summaries with the per-step enumeration in § 3.2 detail blocks. Same lesson applies to other PROMPT specs (PROMPT_PNE_3 / PNE_4 currently being drafted).
- No code action — the seeded data is correct (34 rows verified by `seed:pneumatic` output and `workflow-v1.test.ts`).
**Estimated effort**: 0 (documentation hygiene; lesson for spec-author).
**Blocker for**: nothing.

---

### TODO-041 — Split FaultCode from CauseCode (currently colocated under category='recovery_fault')

**Discovered**: 2026-05-02 (during PROMPT_PNE_2 D1 pre-flight — § 5 STOP discovery)
**File**: `packages/prisma/schema.prisma` (no `FaultCode` model exists today) + `packages/prisma/seed/pneumatic-data/fault-codes.ts` (workaround using CauseCode rows) + future `apps/api/src/modules/fault-codes/` + future `apps/web/src/.../FaultCodePicker.tsx` (HMI Recovery dropdown)
**Symptom**: PROMPT_PNE_2 § 5 pre-flight grep for `model FaultCode` returns 0 matches. CauseCode is the only "code" model in the schema. The PROMPT specifies 10 fault codes (5 LK-* leak + 5 CM-* camera) for the recovery flows, but there is no first-class FaultCode entity to host them. PROMPT § 4 says schema migrations are out of scope, so PNE_2 D2 seeded the 10 fault codes as `CauseCode` rows with `category='recovery_fault'` and `phase='leak'|'camera'`. Severity (absent in CauseCode schema) encoded in description text. Phase scope encoded redundantly in `phase` column AND in the `LK-*`/`CM-*` code prefix.
**Why this matters**: works fine for the demo path because the data is queryable by category. But:
- HMI Recovery dropdowns must filter `CauseCode where category=recovery_fault and phase=leak` instead of selecting from a `FaultCode[]` collection — extra category-filtering logic on every read.
- Workflow Step lacks `Step.recoveryFaultCodes[]` FK → recovery diagnosis steps reference fault codes by code-string in `instructions` text (loose-coupling).
- Future fault codes for non-recovery scenarios (e.g., setup-time tooling faults) would need yet another category value, blurring the CauseCode taxonomy further.
- Adding any phase beyond leak/camera (e.g., `pack`, `assy`) would require extending BOTH the `phase` enum AND the code prefix vocabulary — currently undocumented.
**Acceptance criterion**:
- Schema change: new `FaultCode` model with `code`, `name`, `phase` (or `recoveryGroupId` FK), `severity` (info|warning|critical), `suggestedAction` text, `plantId`. Migration moves the 10 PNE rows from `CauseCode` (category=recovery_fault) to `FaultCode` (with severity from description text → severity column). Explicit product confirmation needed before touching schema.
- Add `Step.recoveryFaultCodes` M:N relation. Diagnosis steps in inline-recovery groups (B2 + C2) reference fault codes via FK instead of via `instructions` text.
- HMI Recovery component: dropdown queries `FaultCode where phase=leak|camera` directly.
- Migration plan: lift 10 rows from category='recovery_fault' on CauseCode → new FaultCode table; preserve codes/names/phase; parse severity from description text; drop the workaround comments from seed file headers.
**Estimated effort**: 4-6 hours backend (schema + migration + module + tests) + 2-3 hours frontend (HMI Recovery dropdown wire). Future-fault-code-vocabulary policy decision needed at the same time.
**Blocker for**: HMI Recovery (PROMPT_PNE_4 D3) IF the dropdown UI semantics expect first-class FaultCode entity. If text-based reference works (search-as-you-type with prefix filter), can defer to F2 / PROMPT_7. Owner: F2 / PROMPT_7 default; pull earlier if PNE_4 Recovery dropdown design says otherwise.

---

### TODO-040 — AddStepDialog multi-select arrays + per-form Action Config session-only / lossy on reload

**Status update 2026-05-03 (PROMPT_PNE_4_FOCUSED D1 + D4)**: scope extended with three additional session-only fields, all stored on `node.data`:
- `actionType` (DB-level Step.actionType — already round-trips via `buildSavePayload`'s default + dialog override; future schema migration would just persist the explicit override).
- `description` (autofill mirror from D1 templates — used as a richer alternative to `instructions` on the HMI; lossy on reload).
- `photoBase64` (mock attachment from PhotoUploadField, base64 in-memory; never reaches the server).
- `recoveryConfig` (D4.1: `enabled` / `maxAttempts` / `preRetryStepIds[]` from AutomaticForm's recovery section; lossy on reload — runtime falls back to `MAX_RECOVERY_ATTEMPTS=2` constant from `@mes/domain`).
Schema migration to land all session-only fields stays scoped to F2 / PROMPT_7. Demo path uses the seeded workflow (PNE_2) where all values are baked in by the seed script.

**Discovered**: 2026-05-02 (during PROMPT_PNE_1 D1 surprise-budget resolution — § 7 trigger A & B)
**File**: `packages/prisma/schema.prisma` (`Step` model) + `packages/schemas/src/registries/workflow.schema.ts` (`WorkflowStepInputSchema`) + new `apps/api/src/modules/workflow-steps/` lookup endpoints + `apps/web/src/components/workflow/AddStepDialog.tsx` (hydrate path) + `apps/web/src/components/workflow/WorkflowCanvas.tsx` (`buildSavePayload`)
**Symptom**: PROMPT_PNE_1 D4 saves a new step via `addStepNodeToGroup` and the canvas auto-save pipeline. Single-FK ids (`skillId`, `deviceId`, `recipeId`, `toolId`) round-trip fine via `WorkflowStepInputSchema`. But the **multi-select resource arrays** (`materialIds[]` from MaterialsTab, `attentionPointIds[]` from AttentionPointsTab) and the **per-form Action Config blob** (Manual `maxDurationStr`/`labelIt`/`labelEn`/`isRequired`, Automatic `parallelStepsBufferSec`/`onNok`/`onNokWorkflowId`/`passThresholdNote`, Guided `verificationChecklist`, Parallel `partReference`/`durationDuringDeviceCycleSec`/`description`, Sub-flow `triggerCondition`, Decision `branchLabel`/`on*TargetId`, Information `contentType`/`contentUrl`/`ackRequired`, SetupTeardown `durationStr`) are stored only in `node.data` — they survive zustand state but are dropped at the `WorkflowStepInputSchema` boundary. Reloading `/workflows/<id>` rebuilds steps from the server payload, and those fields come back empty. The InlineHint banner above the Action Config column flags this to the operator.
**Why this matters**: PROMPT_PNE_2 will seed `WF-PNEU-680-V1-DEMO` with all resources pre-wired so the demo path is unaffected. PROMPT_PNE_2 v0 (Empty workflow) and any process engineer building a workflow from scratch will hit lossy reload — annoyance, not blocker, but a quality-of-life cliff.
**Acceptance criterion**:
- Schema change: `Step.config Json?` + `step_materials` (Step ↔ Item M:N) + `step_attention_points` (Step ↔ AttentionPoint M:N). Migration required. Explicit product confirmation needed before touching schema.
- Extend `WorkflowStepInputSchema` to accept `config: z.record(z.unknown()).optional()`, `materialIds: z.array(z.string().cuid()).optional()`, `attentionPointIds: z.array(z.string().cuid()).optional()`.
- `buildSavePayload` emits the new fields from `node.data`.
- API `findOne` / `findVersion` projection hydrates them back into the response shape.
- AddStepDialog hydrates from `step.config` + `step.materialIds` + `step.attentionPointIds` when re-opening on an existing step (covered by the future "edit existing step" merge of `forms/*` + `action-forms/*` ecosystems).
**Estimated effort**: 6-10 hours backend (schema + migration + payload wiring + tests) + 2-4 hours frontend (hydration path + cross-form-ecosystem unification).
**Blocker for**: nothing in MVP demo (PROMPT_PNE_2 seed pre-wires v1 Demo). Owner: F2 / PROMPT_7. Pull earlier if process engineer feedback flags lossy reload during F1.4-F1.6 user testing.

---

### TODO-039 — Design token migration: bg-primary-* / bg-success-* / text-primary-* unmapped in apps/web

**Discovered**: 2026-05-02 (during PROMPT_3d D5 hotfix — primary submit button invisible bug)
**File**: `apps/web/tailwind.config.ts` + multiple callsites across `apps/web/src` and a few in `packages/ui` legacy components
**Symptom**: `apps/web/tailwind.config.ts` defines `accent` / `accent-2` / `accent-soft` / `accent-ink` (and `ok` / `warn` / `bad` / `info` semantic tokens) but does NOT define a `primary` / `success` / `error` color SCALE. Classes like `bg-primary-600`, `bg-success-600`, `bg-error-600`, `text-primary-700` therefore generate **zero CSS** — buttons using them render as white text on transparent (= invisible white-on-white on white backgrounds). The D5 hotfix fixed the 4 dialogs added in PROMPT_3d (AddPhaseDrawer, AddGroupModal, AddStepDialog, "+ Aggiungi Fase" topbar) by switching to `bg-accent`. The wider codebase still uses `bg-primary-600` / `bg-success-600` extensively:
- `apps/web/src/app/(registries)/items/page.tsx` — primary CTA button
- `apps/web/src/app/(registries)/workflows/page.tsx` — "Nuovo workflow" button
- `apps/web/src/app/(registries)/workflows/from-template/page.tsx` — wizard buttons
- `apps/web/src/app/(registries)/workflows/[id]/page.tsx` — `Approva versione` (`bg-success-600`), `Rilascia WO` (`bg-primary-600`)
- `apps/web/src/app/(registries)/workflows/[id]/release/page.tsx` — release submit button
- `packages/ui/src/components/Modal.tsx` — `ConfirmModal` default variant (`bg-primary-600`)
- `packages/ui/src/components/EntityForm.tsx`, `DataTable.tsx`, `EntityDetail.tsx`, `SearchBar.tsx` — various
**Acceptance criterion**:
- Either (a) extend `apps/web/tailwind.config.ts` with explicit `primary` / `success` / `error` color scales mapped to the existing OKLCH tokens, OR (b) migrate every `bg-primary-*` / `bg-success-*` / `text-primary-*` callsite to use the defined `accent` / `ok` / `bad` tokens. (a) is the safer, less-churn option.
- Add a regression test in `packages/ui` that asserts critical buttons (Modal `ConfirmModal` primary, Drawer footer primaries) carry a defined background class — protects against silent re-introduction.
- Visual smoke on every primary / success / danger button in the registry detail / list pages.
**Estimated effort**: 1-2 hours for option (a) + visual smoke; 4-6 hours for option (b) blanket migration.
**Blocker for**: any registry detail polish where primary CTAs need to be visible. Owner: F2 PROMPT_7 (registry detail + WO detail polish). Could pull earlier if Reflex Allen demo touches a page with hidden CTAs.

---

### TODO-038 — Workflow-root metadata editing (tags + defaultWorkCenters)

**Discovered**: 2026-05-02 (during PROMPT_3d D4 — Inspector 3-tab refactor)
**File**: `apps/web/src/components/workflow/inspector/MetadataTab.tsx` + `apps/web/src/app/(registries)/workflows/[id]/page.tsx`
**Symptom**: PROMPT_3d §3.5 prescribed editable `tags` (csv) and `defaultWorkCenters` (multi-select) for the **workflow root** metadata view. D4's MetadataTab is read-only and only renders metadata for selected canvas nodes (phase / group / step). The workflow root is not a canvas node today (it's the page-level `workflow` object loaded via `useQuery`), so MetadataTab cannot reach those fields. Editable surface deferred.
**Acceptance criterion**:
- Either (a) add a synthetic "workflow root selected" state (e.g., when nothing else is selected, the Inspector shows workflow-root metadata) with an editable form for `tags` + `defaultWorkCenters`, OR (b) hoist workflow-root metadata editing into the page topbar / a dedicated header strip near the PageHeader. Approach (b) is closer to mockup intent (workflow-level meta belongs to the header band, not the side inspector).
- New SDK endpoint or extension to existing `sdk.workflows.update(id, { tags, defaultWorkCenters })` if not already supported.
- Audit log entry on save (per ADR-014).
**Estimated effort**: 2-3 hours (form + endpoint plumbing + tests).
**Blocker for**: nothing in MVP (the schema fields remain editable via API; just no UI). Owner: F2 / PROMPT_7 (registry detail + workflow detail polish). Could pull earlier if Reflex Allen demo needs to surface these on stage.

---

### TODO-036 — Decision-step onOk/onNok target fields missing on Step schema

**Discovered**: 2026-05-02 (during PROMPT_3d D3 — canvas refactor)
**File**: `packages/prisma/schema.prisma` (`Step` model) + `apps/web/src/components/workflow/WorkflowCanvas.tsx` (`buildGraph` edge emission)
**Symptom**: PROMPT_3d §3.3 calls for explicit decision-edge rendering in the workflow canvas — when a step has category `decision`, two edges should render: `onOk` (success branch → next phase / next step) and `onNok` (failure branch → recovery sub-flow). The current `Step` Prisma model has no fields to capture these targets, so D3 ships without explicit decision-edge rendering. Sequential edges between decision steps and their immediate next sibling continue to render unchanged.
**Acceptance criterion**:
- Schema change: `Step.onOkTargetId String?` + `Step.onNokTargetId String?` (or polymorphic — could target a step OR a phase). Migration required. Explicit product confirmation needed before touching schema.
- `buildGraph` in `WorkflowCanvas.tsx` emits 2 additional edges per decision step (with edge type `decision-ok` / `decision-nok`); new edge components rendered with green / red tones (per CanvasEdge `tone='ok'` / `'bad'` mapping).
- DecisionStepForm (already exists) extends with onOk/onNok target selectors.
- Validation: a decision step without populated targets emits a workflow validation error.
**Estimated effort**: 3-4 hours (schema + migration + buildGraph + edge components + form fields + validation)
**Blocker for**: nothing in MVP. Owner: F2 (PROMPT_7) or earlier if PROMPT_PNE_2 seed needs decision branches for recovery flows. Wait for product confirmation before schema work.

---

### TODO-037 — @mes/ui CanvasEdge cannot drop directly into React Flow as a custom edge

**Discovered**: 2026-05-02 (during PROMPT_3d D3 — edge restyle)
**File**: `packages/ui/src/components/canvas/edge.tsx` + `apps/web/src/components/workflow/edges/SequentialEdge.tsx`
**Symptom**: PROMPT_3d §3.3 D3 said "Replace edge type 'sequential' with `<CanvasEdge>` from `@mes/ui`". The DS_LIFT `CanvasEdge` component takes `from`/`to` endpoint props (standalone use) and renders its own positioning. React Flow custom edges, by contrast, must accept `EdgeProps` (sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, etc.) and use React Flow's path helpers (`getBezierPath`, `getSmoothStepPath`). The two APIs are not directly compatible. D3 keeps `SequentialEdge` as a React Flow custom edge but visually aligned to CanvasEdge (same stroke colour `var(--ink-3)`, same width 1.25px, same bezier curve).
**Acceptance criterion** (option A — harmonize):
- Add an `EdgeProps`-compatible variant export from `@mes/ui` (e.g., `CanvasEdgeReactFlow`) that accepts React Flow-style props and internally calls `getBezierPath` / `getSmoothStepPath` then renders a path with the DS_LIFT tones + arrow markers.
- Web app's `SequentialEdge` is replaced by importing this from `@mes/ui` directly.
**Acceptance criterion** (option B — document asymmetry):
- Add a section to `docs/CONVENTIONS.md` (or design tokens doc) noting that `@mes/ui` Canvas Edge is for STANDALONE diagrams (dashboard widgets, mini-flow renders), NOT React Flow integration. Workflow editor uses local React Flow custom edges that mirror the CanvasEdge visual specification.
- Update `STATUS.md` reference list with the asymmetry as an architectural decision.
**Recommendation**: option B (document asymmetry) for MVP — the visual outcome is equivalent; option A is engineering polish for F2/F3.
**Estimated effort**: option A 2-3 hours (new variant + tests); option B 30 min (docs).
**Blocker for**: nothing. Polish.

---

### TODO-027 — PROMPT_4_PHASE_2: wire AutoGenEngine to entity creation flows

**Discovered**: 2026-05-01 (during PROMPT_4 scope decision — Q1 / Strategia A)
**File**: new modules under `apps/api/src/modules/{lots,boxes,maintenance-orders,recipe-versions,samples,downtime-events}/` + entity creation services
**Symptom**: PROMPT_4 ships the AutoGenEngine + 7 resolvers + dry-run preview UI on `/auto-gen-rules`. The engine is wired into ONE consumer today: `release.service` calls `engine.resolve('2', ...)` for the WO code. The other 6 entities (Lot, Box, MaintenanceOrder, RecipeVersion, Sample, DowntimeEvent) have NO creation endpoints in the API today, so resolvers 1, 3, 4, 5, 6, 7 are exercised only via the dry-run UI. End-users who want to create a Lot or Box manually have nowhere to do it.
**Acceptance criterion**:
- For each of Lot, Box, MaintenanceOrder, RecipeVersion, Sample, DowntimeEvent: a NestJS module with CRUD controller + service + repository following the 13-registry pattern (see `apps/api/src/modules/items/` as reference).
- Each create endpoint calls `engine.resolve(<ruleId>, context)` and persists the returned code into the entity's `code` / `lotNumber` / equivalent field.
- For entities without a `code` column (Sample.sampleNumber, RecipeVersion.version, DowntimeEvent has no code field), persist the int part of the resolved code where applicable; the human-friendly string (e.g., `DOWN-EXTRUDER-01-20260501-001`) lives in audit logs and dry-run previews only.
- Web admin UI for each new module (list + create + detail), matching the existing 13 registries.
- AuditLog entries on every create.
- Tests: ~10 per module (CRUD + auto-gen integration + RBAC).
**Estimated effort**: 10-15 hours (2-3h per entity × 6 entities, with the engine integration being the simplest part).
**Blocker for**: stakeholder demos that need to create a Lot or Box manually (today they can only see them via seed-loaded data). Not blocking MVP.

---

### TODO-028 — Spec §8.3 workflow-step enrichment rules (Strategia B, archived)

**Discovered**: 2026-05-01 (during PROMPT_4 scope decision — original PROMPT_4 spec was archived)
**File**: spec at `prompts/archive/PROMPT_4_workflow_step_rules_obsolete.md`; would land as a new `apps/api/src/modules/workflow-generation/` module
**Symptom**: The original `prompts/PROMPT_4_AUTO_GENERATION.md` described 7 RULES THAT GENERATE WORKFLOW STEPS (Skills check, BOM check sequenziale, Tooling check, Device verify & recipe load, FAI, Reset & cleanup, Box packaging) inserted automatically into the WorkflowSnapshot when a WO is released. PROMPT_4 implemented the orthogonal "code generators" interpretation instead (7 sequence-number rules — see TODO-027). The workflow-step enrichment concept is preserved in the archived spec but not implemented.
**Acceptance criterion** (if revisited):
- New service that mutates the `WorkflowSnapshotPayload.phases[]` array AFTER `cloneWorkflowTree()` returns and BEFORE the snapshot is JSON-serialized into the DB (per the hook point identified at [release.service.ts:202](apps/api/src/modules/work-orders/release.service.ts:202)).
- Each of the 7 rules implemented as a separate, independently-testable service following the rule-registry pattern from PROMPT_4 (`IAutoGenResolver`-style).
- Generated steps marked with `source: 'auto_generated'` (already a valid `StepSource` enum value per `packages/prisma/schema.prisma:41`) and `isAutoGenerated: true` on Phase/Group (fields already exist).
- Per-WO config to enable/disable each optional rule via the release dialog UI.
**Estimated effort**: 10-15 hours (the original spec estimated 2-3h but it underestimates the snapshot mutability + per-rule tests + UI surface).
**Blocker for**: nothing in MVP. Revisit when WorkflowSnapshot mutability rules are formally defined OR if Reflexallen process engineers ask for "automatic setup phases" on top of designed workflows.

---

### TODO-022 — PROMPT_5_FULL: real persistence — StepExecution writes via API

**Discovered**: 2026-04-30 (during PROMPT_5_LITE)
**File**: `apps/hmi/src/app/wo/[id]/page.tsx` + new `apps/api/src/modules/work-orders/step-executions/` + new `packages/sdk/src/clients/step-executions.client.ts`
**Symptom**: HMI LITE keeps the WO execution state (`steps`, `notes`, `nokDraft`) entirely in client memory via `useReducer`. Refreshing the browser **resets the WO to its initial state** — every step goes back to `pending` (or step 1 to `running`). No `StepExecution` records are written to the DB. There's no audit trail of what an operator did or how long each step took. The mock `getMockSteps(woId)` always returns a freshly-initialized array.
**Acceptance criterion**:
- New `StepExecution` Prisma model already exists (verify with `schema.prisma`); if missing, add fields: `stepId`, `workOrderId`, `operatorId`, `status`, `startedAt`, `completedAt`, `actualTimeSec`, `notes`.
- `POST /api/work-orders/:woId/step-executions` creates a record on `START`.
- `PATCH /api/work-orders/:woId/step-executions/:seId` updates on `COMPLETE_OK` / `COMPLETE_NOK`.
- HMI replaces the `useReducer` mock with TanStack Query mutations that hit these endpoints.
- Refreshing `/wo/[id]` rehydrates the timeline from server state (last `running` step is the resume point).
- Audit log entry per transition (per ADR-014).
**Estimated effort**: 4-5 hours
**Blocker for**: any real demo where the operator may close the browser mid-WO. LITE workaround documented in code.

---

### TODO-023 — PROMPT_5_FULL: Socket.IO real-time updates

**Status**: ✅ **CLOSED by PROMPT_5_FULL D6** (2026-05-01).
**Resolution**: HMI socket listener now subscribes to two room types via the existing `WorkOrderEventsGateway`:
- `op:{operatorId}` room receives `wo:assigned` events (emitted by the release service for the assigned operator) → invalidates `myWorkOrdersQueryKey` so the dashboard updates without refresh.
- `wo:{workOrderId}` room receives `step:transition` events (emitted by `step-execution.service` since D3) → invalidates `workOrderStepsQueryKey(workOrderId)` so live transitions land on the WO detail page.
- Server-side: gateway extended with `emitWoReleased` (broadcast on `wo:released`) + `emitWoAssigned` (per-operator room) + `@SubscribeMessage('subscribe:wo'|'subscribe:op')` handlers that join rooms; symmetric unsubscribe handlers for clean unmount. (4 unit tests covering both new emitters + a regression for D3 emitStepTransition + a no-op-when-server-undefined guard.)
- Client-side: new `apps/hmi/src/lib/socket.ts` singleton (`socket.io-client@^4.7.5` + `withCredentials: true` to forward the JWT cookie). New hooks `useWoAssignedSubscription` + `useStepTransitionSubscription` in `apps/hmi/src/lib/queries.ts` wired into the dashboard and `wo/[id]` pages.
**Open follow-up (NOT a regression of TODO-023)**:
- DEV MODE leaves room joins ungated (any client can subscribe to any room). Production hardening — validate JWT in the WS handshake, scope room joins to operators that own the WO — is captured by TODO-017 (refresh-token rotation + per-namespace auth). Not blocking MVP.
**Verification (runtime smoke, 2026-05-01)**:
- API up with 4 new `@SubscribeMessage` handlers mapped (subscribe:wo, unsubscribe:wo, subscribe:op, unsubscribe:op).
- Manager release of a WO emits `wo:assigned` to `op:{newOperatorId}` room; HMI dashboard invalidation triggers automatically.

---

### TODO-024 — PROMPT_5_FULL: change-of-shift hand-off flow + paper printout

**Discovered**: 2026-04-30 (during PROMPT_5_LITE)
**File**: new `apps/hmi/src/app/handoff/page.tsx` + new `apps/api/src/modules/shifts/handoff/` + paper template
**Symptom**: HMI LITE has no concept of shift change. An operator simply logs out at end of shift; the next operator logs in and sees their own dashboard. There is no formal hand-off: in-progress WOs aren't transferred, no notes are passed, no paper printout is generated. Real production needs a structured hand-off (open WOs, blockers, attention points, signed printout).
**Acceptance criterion**:
- "End of shift" action on the dashboard opens a hand-off summary (in-progress WOs, blockers, last activity).
- Operator can add notes to each WO and select the next-shift operator.
- Submit generates a printable A4 hand-off sheet (PDF) signed electronically.
- Incoming operator sees a "Hand-off pending — review" banner on first login of next shift.
**Estimated effort**: 3-4 hours
**Blocker for**: full shift-management compliance.

---

### TODO-011 — PROMPT_3b_FULL: templates wizard ("Nuovo da template")

**Status**: ✅ **CLOSED by PROMPT_3b_FULL Session B** (2026-05-01).
**Resolution**:
- Backend: new `POST /workflows/:id/clone` endpoint + `cloneWorkflow` service method + `cloneWorkflow` repository method (deep tree copy in a single Prisma transaction; new `id` on every Workflow/Phase/Group/Step row, source `plantId` preserved when not overridden, audit log entry with `sourceWorkflowId` in metadata). 6 new service tests + 5 new controller tests.
- Seed: 3 reference templates added — `TPL_PNEU_EXTRUSION_V1`, `TPL_PNEU_CRIMPING_V1`, `TPL_PNEU_LEAK_TEST_V1` — each as a full `approved` Workflow + `WorkflowVersion v1` + Phase/Group/Step tree (extrusion: 2 phases, 5 steps; crimping: 2 phases, 4 steps; leak test: 1 phase, 4 steps including a DECISION step).
- Frontend: new route `/workflows/from-template` with 3-step wizard (pick → configure → confirm). New `TemplatePicker` component renders a card grid filtered on `code: { startsWith: 'TPL_' }`. New "Nuovo da template" button on `/workflows` list page.
- SDK: `WorkflowsClient.clone(id, body)`.
- CFRP/Safety Devices template seeds remain as TODO-005 / TODO-006 (out of MVP scope per original prompt).

---

### TODO-012 — PROMPT_3b_FULL: canvas polish (right-click, keyboard, undo/redo)

**Status**: ✅ **CLOSED by PROMPT_3b_FULL Session B** (2026-05-01).
**Resolution**:
- Right-click: `onNodeContextMenu` wired on the xyflow canvas opens a fixed-position `CanvasContextMenu` (Tailwind primitives only, no new lib). Items per node type: Step → "Duplica" + "Elimina"; Phase / Group → "Elimina". Closes on click-outside / Escape.
- Keyboard shortcuts: new `useCanvasKeyboardShortcuts` hook attaches a window `keydown` listener (skipped when focus is inside `<input>`/`<textarea>`/`[contenteditable]`). Bindings: `Del` / `Backspace` → delete selected, `Ctrl/Cmd+D` → duplicate selected step, `Ctrl/Cmd+Z` → undo, `Ctrl/Cmd+Shift+Z` → redo.
- Undo/redo: custom history stack in the Zustand store (`history.past[]` + `history.future[]`, capped at 50 entries; no `zundo` dep). Mutating actions (`updateNodeData`, `deleteNode`, `duplicateNode`) call `pushHistory()` first; `clearHistory` available for new-workflow loads.
- Delete cascades: deleting a Phase or Group also removes descendants and any incident edges.
- Drag-to-reorder steps within a Group is **deferred to TODO-029** (post-MVP, requires `step.order` recomputation across siblings).

---

### TODO-013 — PROMPT_3b_FULL: inline validation badges on canvas nodes

**Status**: ✅ **CLOSED by PROMPT_3b_FULL Session A** (2026-05-01).
**Resolution**:
- New pure helpers `extractErrorNodeIds(result)` + `groupErrorsByNodeId(result)` in `packages/domain/src/rules/workflow.rules.ts` (8 unit tests added — 5 + 3 — bringing domain test count to 172).
- New `useWorkflowValidation()` hook in `apps/web/src/components/workflow/useWorkflowValidation.ts` — single source of truth for the designer (memoized validation, errorNodeIds, errorsByNodeId).
- New `WorkflowValidationProvider` + `useNodeBadge(nodeId)` React context in `validation-context.tsx`. ValidationPanel now reads from context instead of duplicating buildValidationStructure + 4 useQuery calls.
- New `<NodeErrorBadge nodeId>` component renders a red ▲ on the top-right of every PhaseNode/GroupNode/StepNode when its id has errors. Native `<span title>` tooltip lists the messages.
- Provider mounted in `apps/web/src/app/(registries)/workflows/[id]/page.tsx` so canvas + sidebar share the same memoized result.

---

### TODO-014 — PROMPT_3b_FULL: Phase and Group configurator forms

**Status**: ✅ **CLOSED by PROMPT_3b_FULL Session A** (2026-05-01).
**Resolution**:
- New `PhaseConfigurator` form (`forms/PhaseConfigurator.tsx`): name, category (6 PhaseCategory values from palette), `isCycleBased` checkbox.
- New `GroupConfigurator` form (`forms/GroupConfigurator.tsx`): name, category (9 GroupCategory values from palette), `supportsParallel` and `supportsRecovery` checkboxes.
- `StepConfigurator.tsx` router extended: routes `phaseNode` → PhaseConfigurator, `groupNode` → GroupConfigurator, `stepNode` → 9-case category switch (the previous "Configuratore disponibile solo per gli step (D6)" placeholder is gone).
- `WorkflowCanvas.buildGraph` now hydrates `phase.isCycleBased`, `group.supportsParallel`, `group.supportsRecovery` into `node.data` so reload restores the values.
- `WorkflowCanvas.buildSavePayload` reads those fields back from `node.data` (replaces previous hardcoded `false` defaults), so changes survive auto-save.

---

### TODO-015 — Recovery flow simplification (single-step vs 4-stage state machine)

**Discovered**: 2026-04-30 (during PROMPT_3b_REDUCED D1 implementation)
**File**: `apps/web/src/components/workflow/forms/RecoveryStepForm.tsx`
**Symptom**: D1 ships RecoveryStepForm as a single-step form with a `recoveryStage` selector (diagnosis / attempt_1 / attempt_2 / scrap). The full Recovery flow per spec is auto-generation of 4 connected steps (diagnosis → attempt 1 → attempt 2 → scrap) with state-machine wiring. Current form is a placeholder for the simplified case; the full flow generator is missing.
**Acceptance criterion**:
- A new "Recovery" group template auto-generates 4 connected steps when dropped on the canvas.
- State transitions between the 4 steps are wired (diagnosis success → exit; failure → attempt 1 → ...).
- Or: integration with PROMPT_4 auto-generation engine if recovery is auto-generated post-QC fail.
**Estimated effort**: 2-3 hours
**Blocker for**: full recovery semantics (current form supports manual placement of any single recovery step, sufficient for demo).

---

### TODO-016 — Session-only fields + coarse-grained StepActionType (consolidated)

**Discovered**: 2026-04-30 (during PROMPT_3b_REDUCED D1 implementation)
**File**: `packages/prisma/schema.prisma` (`Step` model) + `packages/types/src/enums/step.enum.ts` + `apps/web/src/components/workflow/WorkflowCanvas.tsx` (`buildSavePayload`, `buildGraph`)
**Symptom**: Two related gaps:
1. **Session-only fields**. D1 introduces UI-only fields stored in `node.data` that don't survive save/reload (same gap class as TODO-007 for QC thresholds and Scan expectedPattern):
   - LogisticsStepForm: `logisticsType`, `boxTypeId`, `targetLocation`
   - SetupStepForm: `setupType`
   - RecoveryStepForm: `recoveryStage`, `causeCodeId`
2. **Coarse-grained StepActionType**. D1 collapses multiple form-internal selectors onto a small set of existing action types (`MOVE`, `VERIFY_MATERIAL`, `LOAD_RECIPE`, `REWORK`). Fine-grained values (PICK_PART, PLACE_PART, TRANSFER_LOT, RECEIVE_LOT, SHIP_LOT, BOM_CHECK, TOOL_VERIFY, CALIBRATE, RECOVER_DIAGNOSE, RECOVER_RETRY, RECOVER_SCRAP) are needed when PROMPT_4 (auto-generation) and PROMPT_5 (HMI step renderer) require category-internal type distinctions for behavior.
**Acceptance criterion**:
- Add `config Json?` field to `Step` Prisma model (covers TODO-007 too).
- Extend `WorkflowStepInputSchema` to accept a `config` record; `buildSavePayload` emits per-form `config` blobs.
- `buildGraph` reads `step.config` back into `node.data` on workflow load — reload of `/workflows/[id]` restores all session-only fields.
- Expand `StepActionType` enum with the missing fine-grained values when PROMPT_4 / PROMPT_5 land; update D1 forms to map 1:1 instead of collapsing.
**Estimated effort**: 2-3 hours total (1-2h schema + payload wiring; 1h enum + form remapping)
**Blocker for**: production-quality D1 forms (current state: forms work in-session, demo-quality but lossy on reload).

---

### TODO-007 — Step configurator: thresholds & expectedPattern not persisted

**Discovered**: 2026-04-29 (during D6 implementation)
**File**: `packages/prisma/schema.prisma` (`WorkflowStep` model) + `packages/schemas/src/registries/workflow.schema.ts` + `apps/web/src/components/workflow/WorkflowCanvas.tsx` (`buildSavePayload`, `buildGraph`)
**Symptom**: D6 step forms accept `qcThresholds` and `scanExpectedPattern` but persist them only in `node.data` session state. Prisma `WorkflowStep` model lacks a `config Json?` field. The values survive auto-save round-trips within a single session (because the Zustand store keeps them in node.data) but are lost on page reload because the backend has nowhere to store them.
**Acceptance criterion**:
- Add `config Json?` field to `WorkflowStep` Prisma model with a migration.
- Extend `WorkflowStepInputSchema` with `config: z.record(z.unknown()).optional()`.
- `buildSavePayload` in `WorkflowCanvas.tsx` emits `config: { thresholds, expectedPattern, ... }` for QC / Scan steps.
- `buildGraph` reads `step.config` back into node.data for those fields.
- Reload of `/workflows/[id]` restores previously edited thresholds and expected patterns.
**Estimated effort**: 1-2 hours (schema + migration + payload wiring + tests)
**Blocker for**: production-quality QC and Scan step configuration. Workaround for D6 demos: keep the same browser session.

---

### TODO-003 — Turbo warnings for placeholder packages

**Discovered**: 2026-04-28 (during `pnpm build`)
**File**: `turbo.json`
**Symptom**: `pnpm build` ends with 3 WARNING lines:
```
WARNING  no output files found for task @mes/cache#build. Please check your `outputs` key in `turbo.json`
WARNING  no output files found for task @mes/queue#build. Please check your `outputs` key in `turbo.json`
WARNING  no output files found for task @mes/storage#build. Please check your `outputs` key in `turbo.json`
```
**Root cause**: These three packages are placeholders (in-memory implementations) without a real build output. `turbo.json` declares a generic `build` task with `outputs` expectations that they don't satisfy.
**Acceptance criterion**:
- `pnpm build` ends with 0 warnings.
- Either: (a) the three packages produce a real build output (e.g., compiled JS); or (b) `turbo.json` exempts them from the `outputs` requirement via per-package config.
**Estimated effort**: 10-20 min
**Blocker for**: nothing (cosmetic).

---

### TODO-004 — Argon2id PIN hashing not exercised at integration level

**Discovered**: 2026-04-28 (during PROMPT_2 verification)
**File**: `packages/prisma/seed.ts` + future `apps/api/src/modules/auth/`
**Symptom**: Operators are seeded with PIN values (likely placeholder or plaintext). The `argon2` package is installed and declared as a dependency, but no actual hashing has been verified to work end-to-end.
**Acceptance criterion** (deferred to PROMPT_5):
- Seed stores Argon2id hash in DB, never plain PIN.
- Login flow (HMI) verifies PIN against hash with `argon2.verify()`.
- A unit test exercises `argon2.hash` + `argon2.verify` round-trip.
**Estimated effort**: implicit in PROMPT_5 scope
**Blocker for**: HMI auth flow (PROMPT_5).

---

### TODO-005 — Add CFRP workflow templates to Workflow Designer

**Discovered**: 2026-04-29 (planning PROMPT_3)
**File**: `packages/prisma/seed.ts` + future Workflow Designer templates
**Spec source**: `docs/extensions/CFRP_MODULE.md`, `docs/extensions/WORKFLOW_CFRP.md`, `docs/extensions/WORKFLOW_CFRP_DETAILED.md`
**Symptom**: PROMPT_3a (Workflow Designer Core) ships with templates and seed data only for Pneumatic Air. CFRP-specific workflows (Mold management, Out-time tracking, Cure Cycles, NDT, prepreg roll lifecycle) are not yet usable in the designer.
**Acceptance criterion**:
- Seed adds at least one mock CFRP item (e.g., `MC-FAIRING-001`), one mock Mold, one Cure Cycle Recipe.
- Workflow Designer "New from Template" wizard offers "CFRP — Standard Lamination" template.
- Process Engineer can create a CFRP workflow that includes: prepreg checkout → layup → vacuum bag → autoclave cure → NDT.
- All ECE/IATF compliance fields (out-time tracking, cure cycle telemetry references) are configurable per step.
**Estimated effort**: 4-6 hours (likely PROMPT_3b or a separate PROMPT_3.5)
**Blocker for**: full MVP coverage of CFRP production line.

---

### TODO-006 — Add Safety Devices workflow templates to Workflow Designer

**Discovered**: 2026-04-29 (planning PROMPT_3)
**File**: `packages/prisma/seed.ts` + future Workflow Designer templates
**Spec source**: `docs/extensions/SAFETY_DEVICES_MODULE.md`, `docs/extensions/WORKFLOW_SAFETY_DEVICES.md`, `docs/extensions/WORKFLOW_SAFETY_DEVICES_DETAILED.md`
**Symptom**: PROMPT_3a (Workflow Designer Core) ships with templates and seed data only for Pneumatic Air. Safety Devices workflows (reflective film lamination, reflectance testing, homologation cert checks, aging tests, ECE-R104 compliance) are not yet usable in the designer.
**Acceptance criterion**:
- Seed adds at least one Safety Device item, one Reflective Film Roll, one Homologation Certificate, one Reflectance Test record.
- Workflow Designer "New from Template" wizard offers "Safety Device — Reflective Lamination" template.
- Process Engineer can create a Safety Device workflow that includes: film checkout → lamination → reflectance test → cross-cut adhesion test → ECE certification.
- ECE-R104 reflectance threshold values are wired into the QC step configuration.
**Estimated effort**: 4-6 hours (likely PROMPT_3b or a separate PROMPT_3.5)
**Blocker for**: full MVP coverage of Safety Devices production line.

---

## 🟢 Low priority (nice to have)

### TODO-026 — Recovery flow: per-stage StepExecution model (deferred from D5)

**Discovered**: 2026-05-01 (during PROMPT_5_FULL D5 implementation)
**File**: `apps/api/src/modules/work-orders/step-execution.service.ts` + future PROMPT_4 auto-generation rules
**Symptom**: D5 ships recovery flow tracking as `recoveryStage` + `attemptCount` JSON fields on the **same** StepExecution row that originally went NOK. The original TODO-020 acceptance criterion called for **each recovery stage to be its own StepExecution** (auto-generated when a step transitions to `blocked`). This deviation was a pragmatic choice: zero schema change, simpler audit log, easier HMI rendering. It works for D5's "operator clicks recover/scrap" flow but does not yet emit per-stage rows.
**Why this matters later**: PROMPT_4 (auto-generation engine) overlaps with this — if the auto-gen rules need to materialize the diagnosis/attempt_1/attempt_2/scrap stages as discrete `StepExecution` rows (e.g., to assign different cause codes per stage, route them to different operators, or compute per-stage cycle times), the current D5 single-row model is insufficient.
**Acceptance criterion** (if revisited):
- On `blocked → recovered` transition, the API auto-generates a new `StepExecution` row of category `recovery` with `recoveryStage` populated, linked to the parent step via a new `parentStepExecutionId` field (schema change required).
- HMI renders the recovery sub-steps as nested cards under the parent step.
- Each stage records its own `cause_code`, `operatorId`, and timing.
- Migration path: existing single-row recovery state becomes a "compact" view; per-stage rows are written going forward without breaking historical data.
**Estimated effort**: 3-4 hours (schema change + per-stage row generation + HMI nested rendering)
**Blocker for**: nothing in MVP. Revisit when PROMPT_4 auto-generation requires per-stage rows or when reporting needs per-attempt analytics.

---

### TODO-025 — HMI logo follow-up after PROMPT_5_LITE

**Discovered**: 2026-04-30 (during PROMPT_5_LITE)
**File**: `apps/hmi/src/app/page.tsx`, `apps/hmi/src/app/dashboard/page.tsx`, `apps/hmi/src/app/wo/[id]/page.tsx`
**Symptom**: PROMPT_5_LITE introduced new HMI screens (dashboard, WO execution, done) that all reference `/brand/logo-light.svg`. TODO-002 is the canonical entry tracking the broken HMI logo (login screen). This entry is a **cross-reference note** so we don't lose the follow-up: re-verify TODO-002 is still relevant after the new screens land. If the asset path is fixed (per TODO-002 acceptance criterion), the dashboard + WO + done screens will benefit automatically; if not, all four screens show a broken image.
**Acceptance criterion**:
- See TODO-002 for the canonical fix (asset path mismatch).
- After TODO-002 is closed, manually verify all 4 HMI screens (login, dashboard, /wo/[id], /wo/[id]/done) render the logo correctly.
- This entry is closed automatically when TODO-002 is resolved (no separate work needed).
**Estimated effort**: 0 (covered by TODO-002 fix; verification only)
**Blocker for**: nothing (cosmetic). Demo polish.

---

### TODO-029 — Workflow canvas: drag-to-reorder steps within a Group

**Discovered**: 2026-05-01 (deferred from PROMPT_3b_FULL Session B canvas polish scope)
**File**: `apps/web/src/components/workflow/WorkflowCanvas.tsx` + `store.ts`
**Symptom**: Today the only way to change the order of steps inside a Group is to delete and re-add them. xyflow has hooks for drag-and-drop reordering but Session B closed without wiring them — Session B shipped delete + duplicate + undo/redo via context menu and keyboard shortcuts, which already cover most user intents.
**Acceptance criterion**:
- Drag-and-drop a step node within its parent Group recalculates `step.order` for all siblings (1..N) in a single store update.
- New `order` values are part of the auto-save payload (`buildSavePayload` already reads `step.data.order`).
- Cross-Group drag is rejected (or moves the step to the new Group + recomputes both sides — design decision deferred).
- Undo/redo restores the previous order array correctly (history snapshot already captures `nodes[]` shape).
**Estimated effort**: 1-2 hours
**Blocker for**: nothing. Productivity polish; expected post-MVP.

---

### TODO-030 — Workflow canvas: "Disable" action on right-click (Step.isEnabled)

**Discovered**: 2026-05-01 (during PROMPT_3b_FULL Session B Q3 — omitted from MVP)
**File**: `packages/prisma/schema.prisma` (Step model) + `apps/web/src/components/workflow/CanvasContextMenu.tsx` + service/repo
**Symptom**: The right-click context menu shipped in Session B has Delete + Duplicate but no "Disable / Toggle Required" action. Some process engineers may want to keep an obsolete step in the workflow as documentation while marking it inactive (skip at runtime). The current Step Prisma model has no `isEnabled` boolean — only `isRequired` (semantically different: required-but-disabled doesn't fit).
**Acceptance criterion**:
- Schema change: `Step.isEnabled Boolean @default(true)` (migration required) — explicit product confirmation needed before touching schema.
- HMI execution semantics: a step with `isEnabled = false` is auto-completed with `status: 'skipped'` when reached.
- Right-click menu adds "Disabilita" / "Abilita" toggle entry.
- Audit log entry on toggle.
**Estimated effort**: 2-3 hours (mostly schema + migration + HMI auto-skip)
**Blocker for**: nothing. Wait for product confirmation before schema work.

---

### TODO-031 — Turborepo cache restores @mes/prisma dist/ but not generated Prisma client

**Status**: ✅ **CLOSED by PROMPT_PNE_2 D4** (2026-05-02, commit pending).
**Resolution**: Added explicit `@mes/prisma#generate` task to `turbo.json` with `cache: false` + `inputs: ["schema.prisma"]`, and added it to the `build` pipeline's `dependsOn`. Now any package whose `build` depends on the Prisma client transitively waits on the generate step before its own build runs. The `cache: false` on generate ensures it runs every build (cheap — ~600ms) but downstream packages still cache their builds correctly.
**Validation evidence (literal, May 2)**:
```
turbo.json @mes/prisma#generate task added (cache: false, inputs: schema.prisma)
build pipeline gains dependsOn ["@mes/prisma#generate"]

Simulated clean state (per user instructions):
  1. mv node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma → .prisma.backup
  2. pnpm build → "Tasks: 13 successful, 13 total | Cached: 12 cached, 13 total" (generate runs fresh, downstreams cached)
  3. ls .prisma → client/ ✓ regenerated
  4. pnpm --filter @mes/prisma seed:pneumatic → ✓ runs end-to-end (proves runtime client works)
  5. rm -rf .prisma.backup → cleaned
```
All 4 acceptance criteria met:
1. ✅ turbo.json has new `@mes/prisma#generate` task definition
2. ✅ Simulated clean state regenerates Prisma client transparently via `pnpm build`
3. ✅ Documented in STATUS as architectural decision (PROMPT_PNE_2 closure section)
4. ✅ Moved from open to closed in this entry

---

### TODO-033 — P7/P9: write adapter audit-log API row → AuditTimelineEntry

**Discovered**: 2026-05-02 (during PROMPT_DS_LIFT D5 — AuditTimeline primitive lift)
**File**: future `apps/web/src/lib/audit-log-adapter.ts` + first AuditTimeline callsite in P7 (registry detail) or P9 (WO Detail BO)
**Symptom**: D5 ships `AuditTimeline` as a UI primitive in @mes/ui with its own `AuditTimelineEntry` shape: `{ id, at: Date, actor, action, entity?, diff?: AuditDiffLine[], tone? }`. The existing `AuditEntry` type (from `ActivityFeed.tsx`, used by `items/[id]/page.tsx`) has a different shape — `{ changedBy, createdAt, ... }` — closer to the API audit_log row shape. Both types coexist **intentionally**: AuditTimeline is the new primitive for richer detail views (with diffs and tone-coloured timeline dots), ActivityFeed is the legacy compact list. Wiring AuditTimeline to real audit-log API rows requires an adapter.
**Acceptance criterion**:
- New util `mapAuditLogRowToTimelineEntry(row)` in `apps/web/src/lib/audit-log-adapter.ts` (or similar) that maps the SDK audit-log row shape to `AuditTimelineEntry`. Inputs come from `sdk.auditLog.list(...)` (define endpoint if not present); output drives AuditTimeline.
- `tone` mapping: state changes → ok, overrides → warn, NCR/scrap → bad, comments → info, system events → neutral.
- `diff` mapping: when the row's `before` and `after` JSON columns contain materialised changes, derive `AuditDiffLine[]` per top-level key; skip empty diffs.
- First callsite (P7 registry detail OR P9 WO Detail) renders the new AuditTimeline driven by the adapter; verify with at least 5 audit-log rows in seed data.
- **Do NOT delete** any `ActivityFeed` callsites in `items/[id]/page.tsx` (or anywhere else) until the adapter is wired and the new AuditTimeline rendering is tested. Both types coexist intentionally during the migration window.
**Estimated effort**: 1-2 hours (adapter + first callsite + test).
**Blocker for**: nothing currently. Lights up the AuditTimeline primitive once detail pages need richer audit views than ActivityFeed provides.

---

### TODO-032 — Audit existing useToast() callsites after Toast.tsx no-op stub fix

**Discovered**: 2026-05-02 (during PROMPT_DS_LIFT D1 — Toast component audit)
**File**: any caller of `useToast()` from `@mes/ui` across `apps/web/` and `apps/hmi/`
**Symptom**: Before D1, `Toast.tsx` was a no-op stub: `ToastProvider` returned `{ show: () => undefined, dismiss: () => undefined }`. Every call to `useToast().show(...)` produced zero user feedback for the entire history of the project. D1 wired up the real implementation (top-right portal, max 3 stack, 4000ms default). From the D1 commit forward, those same callsites now produce visible toasts — intended behavior, but a UX delta.
**Acceptance criterion**:
- Grep for `useToast(` across `apps/web/src` and `apps/hmi/src`; for each callsite, verify the wording, tone (`ok`/`warn`/`bad`/`info`), and frequency are appropriate. Adjust if specific flows now feel too noisy (e.g. validation errors firing on every keystroke would now spam toasts).
- Confirm there is no callsite that relied on the silent no-op (none expected — silent no-ops are usually accidental, not intentional).
- If any flow needs a quieter behavior, pass `options: { duration: 0 }` (no auto-dismiss; only manual) or simply remove the call.
**Estimated effort**: 30-60 min (mostly grep + read).
**Blocker for**: nothing. UX polish; do during F1 demo prep or at the start of P6/P7.

---

## ✅ Resolved

_No entries yet._

---

## 📋 Process

When fixing a TODO entry:

1. Implement the fix on a feature branch (or directly on main for solo dev).
2. Verify the acceptance criterion with the literal commands listed.
3. Move the entry from its priority bucket to `## ✅ Resolved`, adding:
   - Resolution date
   - Commit hash that closed it
   - Brief note on root cause (if useful for the future)
4. Commit `chore: resolve TODO-XXX` (or include as part of a larger commit if related to a feature).

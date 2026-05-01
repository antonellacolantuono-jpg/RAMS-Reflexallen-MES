# TODO — RAMS-Reflexallen-MES

> **Purpose**: Track known issues and technical debt that cannot be fixed in the current session but must not be forgotten.
> **Owner**: Antonella
> **Last updated**: 2026-05-01 (PROMPT_3b_FULL Session A — closed TODO-008, TODO-013, TODO-014)

---

## How to use this file

- Each entry has a unique ID, severity, and a clear acceptance criterion.
- When fixing an entry, link the commit/PR that closes it and move it to the "Resolved" section.
- Add new entries at the top of the relevant severity bucket.
- Review this file before starting any new PROMPT session (part of pre-flight check).

---

## 🟠 High priority (should fix before MVP — May 8-9)

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

**Discovered**: 2026-04-30 (during PROMPT_3b_REDUCED scope reduction)
**File**: `apps/web/src/app/(registries)/workflows/[id]/page.tsx` + new modal components
**Symptom**: Workflow API supports submit/approve/reject/publish (verified in PROMPT_3a D2) but UI exposes none of it. Engineers cannot move a workflow through draft→approved→deprecated states from the editor.
**Acceptance criterion**:
- Submit-for-approval modal with comment field (Process Engineer).
- Approve / Reject modal (QC Manager).
- Publish-as-effective modal (Plant Manager).
- Version history sidebar showing prior versions and statuses.
- Approval requires zero validation errors (gate via D2 ValidationPanel).
**Estimated effort**: 3-4 hours
**Blocker for**: production-grade workflow lifecycle management.

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

**Discovered**: 2026-04-30 (during PROMPT_3b_REDUCED scope reduction)
**File**: new `apps/web/src/components/workflow/TemplateWizard.tsx`
**Symptom**: New workflows must be authored from scratch. Repeating common patterns (Pneumatic Air full pipeline, CFRP standard lamination, Safety Devices reflective lamination) wastes engineer time.
**Acceptance criterion**:
- "Nuovo da template" button on `/workflows` list.
- At least 3 Pneumatic Air templates seeded from `MOCK_DATA_PNEUMATIC_AIR.md`.
- Selecting a template clones its phases/groups/steps into a new draft workflow.
**Estimated effort**: 2 hours
**Blocker for**: nothing (productivity feature). Tied to TODO-005 / TODO-006 for CFRP and Safety Devices template seeds.

---

### TODO-012 — PROMPT_3b_FULL: canvas polish (right-click, keyboard, drag-to-reorder)

**Discovered**: 2026-04-30 (during PROMPT_3b_REDUCED scope reduction)
**File**: `apps/web/src/components/workflow/WorkflowCanvas.tsx`
**Symptom**: Canvas is functional but lacks polish:
- No right-click context menu (delete, duplicate).
- No keyboard shortcuts (Del, Ctrl+D for duplicate, Ctrl+Z / Ctrl+Shift+Z for undo/redo).
- Cannot drag-to-reorder steps within a Group (must delete + re-add).
**Acceptance criterion**:
- Right-clicking a node opens a context menu with Delete and Duplicate.
- Del key deletes selected node; Ctrl+D duplicates.
- Ctrl+Z / Ctrl+Shift+Z drive an undo stack (at least node create/delete/move).
- Drag-and-drop reordering of steps within a Group recalculates `step.order`.
**Estimated effort**: 2-3 hours
**Blocker for**: nothing (UX polish).

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

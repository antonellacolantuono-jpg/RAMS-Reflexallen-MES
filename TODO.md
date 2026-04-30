# TODO — RAMS-Reflexallen-MES

> **Purpose**: Track known issues and technical debt that cannot be fixed in the current session but must not be forgotten.
> **Owner**: Antonella
> **Last updated**: 2026-04-30

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
**File**: `apps/api/src/modules/auth/` (new module) + `apps/hmi/src/app/page.tsx` + new HMI auth client
**Symptom**: HMI login validates the operator badge + PIN against a hardcoded `MOCK_OPERATORS` map in `apps/hmi/src/lib/mock-data.ts`. There is no real authentication: PINs are stored in plaintext, no hashing, no session, no /api/auth endpoint, no token, no refresh. The Zustand store persists the "logged-in operator" to `sessionStorage` only — anyone can write to that store from devtools.
**Acceptance criterion**:
- Operators are seeded with Argon2id-hashed PINs (replaces TODO-004).
- `POST /api/auth/login` accepts `{ badge, pin }` and returns a short-lived JWT (httpOnly secure cookie) + refresh token.
- `POST /api/auth/refresh` rotates the access token.
- `POST /api/auth/logout` revokes the refresh token.
- HMI guards every protected route via the cookie (or via a `useSession` hook on top of `/api/auth/me`).
- Bcrypt is forbidden — Argon2id only (per CLAUDE.md).
**Estimated effort**: 4-6 hours
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

**Discovered**: 2026-04-30 (during PROMPT_5_LITE)
**File**: extend step-execution machine (TODO-018) + `apps/hmi/src/app/wo/[id]/recovery/page.tsx` (new)
**Symptom**: HMI LITE marks a NOK step as `blocked` with a free-text note in client memory, then continues to the next step. The MASTER_SPECIFICATION defines a 4-stage recovery flow: **diagnosis → attempt 1 → attempt 2 → scrap**, each as its own auto-generated step with cause-code linkage and operator decision points. None of this is wired.
**Acceptance criterion**:
- Recovery flow is auto-generated when a step transitions to `blocked` (overlaps with PROMPT_4 auto-gen rules).
- Each recovery stage is its own `StepExecution` with cause code, attempted-by-operator, outcome.
- After 2 failed attempts, the lot/piece is automatically marked for scrap (`scrapped` state, with audit log).
- Recovery flow integrates with the 11-state machine (TODO-018) — `blocked → recovered` (success) or `blocked → scrapped` (terminal).
- UI: a dedicated `/wo/[id]/recovery` screen guides the operator through diagnosis → attempt → scrap decision.
**Estimated effort**: 4-5 hours
**Blocker for**: full failure semantics; supersedes TODO-015.

---

### TODO-021 — PROMPT_5_FULL: WO release flow (Plant Manager)

**Discovered**: 2026-04-30 (during PROMPT_5_LITE)
**File**: new `apps/web/src/app/(registries)/work-orders/` routes + new `apps/api/src/modules/work-orders/release/` controller
**Symptom**: HMI LITE uses 10 hardcoded WOs in `apps/hmi/src/lib/mock-data.ts`. There is no UI for a Plant Manager to release a real WO from an approved workflow snapshot. The `WorkOrder` Prisma model exists, but no endpoints, no creation form, no release-from-snapshot logic.
**Acceptance criterion**:
- Web admin: `/work-orders` registry list + creation form (Item × qty × workflow × scheduled date × assignee).
- "Release" action snapshots the approved workflow into `WorkflowSnapshot` (per ADR-001) and links it to the WO.
- Released WO appears on the assigned operator's HMI dashboard (replaces hardcoded mocks).
- Release requires the workflow to be in `approved` state with zero validation errors.
**Estimated effort**: 5-6 hours
**Blocker for**: end-to-end real production flow. Also unblocks PROMPT_3c (snapshot + live preview).

---

### TODO-008 — PROMPT_3b_FULL: PARALLEL + TEARDOWN step configurator forms

**Discovered**: 2026-04-30 (during PROMPT_3b_REDUCED scope reduction)
**File**: `apps/web/src/components/workflow/forms/`
**Symptom**: PROMPT_3b_REDUCED ships 6/8 step categories (PRODUCTION, QUALITY_CONTROL, IDENTIFICATION, LOGISTICS, SETUP, RECOVERY). PARALLEL and TEARDOWN are deferred:
- PARALLEL — Device Execution Group with parallel-steps swimlane (main step + concurrent sub-steps + buffer time). Most complex of the 8.
- TEARDOWN — cleanup, reset, archive sub-types. Simpler but deferred for symmetry.
**Acceptance criterion**:
- `apps/web/src/components/workflow/forms/ParallelStepForm.tsx` and `TeardownStepForm.tsx` exist following the ProductionStepForm pattern.
- `StepConfigurator.tsx` switch covers all 8 categories.
- `WorkflowPalette.tsx` `STEP_ITEMS` includes parallel + teardown.
**Estimated effort**: 3-4 hours
**Blocker for**: full coverage of complex production lines (CFRP autoclave parallel runs, Pneumatic cleanup phases).

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

**Discovered**: 2026-04-30 (during PROMPT_5_LITE)
**File**: `apps/api/src/gateways/` (new) + new `apps/hmi/src/lib/socket-client.ts` + extend dashboard to subscribe
**Symptom**: HMI LITE is a pure CSR app — there is no WebSocket layer, no event subscription, no real-time updates. If operator A on station 1 progresses a WO, operator B on a manager dashboard does not see the update until they refresh. The MASTER_SPECIFICATION calls for Socket.IO event-driven updates so the manager Andon and KPI dashboards refresh live.
**Acceptance criterion**:
- API Socket.IO gateway emits events on every `StepExecution` transition (overlaps with TODO-022).
- HMI dashboard + admin dashboard subscribe to `wo.updated` / `step.completed` events and update the UI without refresh.
- Manager Andon screen (PROMPT_6) consumes the same channel.
- Connection auth via the JWT cookie (TODO-017).
**Estimated effort**: 3-4 hours
**Blocker for**: live shop-floor visibility. Quality-of-life feature, not strictly required for MVP.

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

**Discovered**: 2026-04-30 (during PROMPT_3b_REDUCED D2 implementation)
**File**: `apps/web/src/components/workflow/nodes/StepNode.tsx`, `PhaseNode.tsx`, `GroupNode.tsx`
**Symptom**: PROMPT_3b_REDUCED D2 ships ValidationPanel as a sidebar list. Errors are not visible inline on the canvas — engineers must scan the sidebar to find which node is wrong, then click to scroll. A red badge with a tooltip on each offending node would surface errors at the node itself.
**Acceptance criterion**:
- Each node type renders a small badge (red triangle) when its id appears in any `error.field` from `validateWorkflowStructure`.
- Hover shows the error message(s) as a tooltip.
- Badge updates reactively as the workflow tree changes.
**Estimated effort**: 1-2 hours
**Blocker for**: nothing (D2 sidebar is sufficient for current demo).

---

### TODO-014 — PROMPT_3b_FULL: Phase and Group configurator forms

**Discovered**: 2026-04-30 (during PROMPT_3b_REDUCED scope reduction)
**File**: extend `apps/web/src/components/workflow/forms/StepConfigurator.tsx` OR new `PhaseConfigurator` / `GroupConfigurator`
**Symptom**: Selecting a Phase or Group node currently shows the "Configuratore disponibile solo per gli step (D6)" placeholder. Cannot edit phase category/name or group `supportsParallel` / `supportsRecovery` flags from the UI.
**Acceptance criterion**:
- Selecting a Phase opens a form: name, category (6 phase categories), order.
- Selecting a Group opens a form: name, category (9 group categories), supportsParallel, supportsRecovery, order.
- Both forms follow the same blur-onChange + auto-save pattern as the step forms.
**Estimated effort**: 1-2 hours
**Blocker for**: in-place editing of workflow structure (current workaround: edit names directly via store mutations).

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

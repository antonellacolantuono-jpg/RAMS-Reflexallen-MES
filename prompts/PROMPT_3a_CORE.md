# PROMPT_3a — Workflow Designer Core

> **Type**: Build prompt for Claude Code Desktop (Step 3a of 6)
> **Predecessor**: PROMPT_2 (registries) merged on `main` as commit `b376142`
> **Successor**: PROMPT_3b (advanced forms + versioning UI) and PROMPT_3c (snapshot + live preview)
> **Estimated Claude Code time**: 8-10 hours (across multiple sessions if needed)
> **Last updated**: 2026-04-29
> **Status**: Active

---

## 🎯 Goal of this prompt (read carefully)

Build the **foundation** of the Workflow Designer: a working visual editor where a Process Engineer can open `localhost:3001/workflows/[id]`, see a canvas, drag steps from a palette, configure them with a basic form, and persist the result via the API. Nothing more.

The full Workflow Designer (8 polymorphic forms, live preview with 11 states, snapshot, versioning approval flow) is **NOT** in scope of PROMPT_3a. Those land in PROMPT_3b and PROMPT_3c.

After this prompt is verified done, the system supports:

- Workflow + WorkflowVersion CRUD via API
- Visual canvas at `/workflows/[id]` with drag-drop and auto-layout
- 3 step categories with form configurator: PRODUCTION, QUALITY_CONTROL, SCAN
- Auto-save on edit (debounced)
- The workflow can be saved as draft and reloaded

---

## ⚠️ Hard constraints — DO NOT violate any of these

### Schema is sacred
**DO NOT modify `packages/prisma/schema.prisma`.** The 7 models needed already exist on `main` (verified April 29):

```
Workflow             — already has plantId, code, currentVersionId, audit fields
WorkflowVersion      — already has status (string), version, approval fields
Phase                — already has category (string), order, isCycleBased
Group                — already has supportsParallel, supportsRecovery, category
Step                 — already has category, actionType, type, source, all polymorphic refs (skill, device, recipe, tool), partReference, noTargetPolicy
WorkflowSnapshot     — exists but is OUT OF SCOPE for 3a (PROMPT_3c will use it)
StepExecution        — exists but is OUT OF SCOPE for 3a (PROMPT_5 will use it)
```

If you believe a field is missing, **STOP and ask** before editing the schema. The 13 registries built in PROMPT_2 depend on the current schema; any change risks breaking them.

### No work outside scope
- ❌ NO snapshot logic (`WorkflowSnapshot` model not touched)
- ❌ NO live preview component (the 11-state HMI emulator)
- ❌ NO versioning UI beyond "save as draft" (no approve/reject/publish modals yet)
- ❌ NO templates wizard ("New from Template")
- ❌ NO Device Execution Group special UI (no swimlanes for parallel)
- ❌ NO recovery flow UI (4-stage wizard)
- ❌ NO performance optimization beyond memoization basics
- ❌ NO E2E tests (only unit + integration)

If something feels needed but is in this list, STOP and ask rather than expanding scope.

### Stack alignment (no surprises)
- ✅ React Flow library: **`@xyflow/react`** (modern, MIT, actively maintained successor of `reactflow`)
- ✅ Auto-layout: `@dagrejs/dagre`
- ✅ State management on canvas: **Zustand** (not Redux, not Context)
- ✅ Server state: **TanStack Query** (already used in PROMPT_2)
- ✅ Forms: **react-hook-form + Zod** (consistent with PROMPT_2)
- ✅ Resizable panes: `react-resizable-panels`
- ✅ TypeScript strict everywhere
- ❌ NO Material UI, NO Bootstrap, NO styled-components — use `@mes/ui` primitives + Tailwind

### Compliance reminders (light touch in 3a)
- IATF 16949: every workflow edit goes through `AuditLogService` (existing in PROMPT_2)
- GDPR: soft delete only (use `deletedAt`, never `prisma.delete()`)
- All API queries enforce `plantId` filter (multi-tenant)

---

## 📚 Required reading before planning

Before you write any code, **load context from these files**:

| File | Why |
|---|---|
| `STATUS.md` | Current state of the repo, including known issues (TODO-001 to TODO-006). |
| `TODO.md` | Track of pending issues. Helps you know what NOT to fix here. |
| `prompts/DOD_TEMPLATE.md` | Definition of Done. Every claim must be paired with literal command output. |
| `docs/MASTER_SPECIFICATION.md` sections 8-12 | Workflow domain (Phase, Group, Step, parallel ops). |
| `docs/BEST_PRACTICES.md` sections 1-7, 18, 21 | Patterns: TanStack Query, Zod, multi-tenant, error handling, MES domain implementation. |
| `docs/CONVENTIONS.md` | Naming, file layout, Conventional Commits. |
| `docs/TESTING_STRATEGY.md` | Pyramid (70/25/5), what to unit-test vs integration. |
| `docs/extensions/WORKFLOW_PNEUMATIC_AIR.md` | High-level reference workflow (the only one we support in 3a). |
| `docs/extensions/WORKFLOW_PNEUMATIC_AIR_DETAILED.md` | Step-by-step + branching for Pneumatic Air (used to verify the form configurator handles real data). |
| `packages/prisma/schema.prisma` | The 7 Workflow-related models (lines covering Workflow, WorkflowVersion, Phase, Group, Step). Read them for field names — do NOT modify. |
| `apps/api/src/common/base-registry.service.ts` | DRY pattern from PROMPT_2 — Workflow service should follow the same shape. |
| `apps/api/src/common/base-registry.controller.ts` | Same. |
| `apps/web/src/components/registry/RegistryListPage.tsx` | UI shell pattern from PROMPT_2 — the workflow list page should match style. |

After reading, **summarize in 8-12 lines** what you understood about scope, then STOP and wait for the user's "go" before Phase 2.

---

## 🛠 Phase 2 — Build (after user says "go")

Execute deliverables D1-D6 **in order**. After each deliverable: run the verification commands, paste literal output in chat, commit, wait for user acknowledgement before moving on.

### D1 — Workflow domain logic (`packages/domain`)

**Goal**: Pure domain logic for the workflow lifecycle. No DB, no React.

**Files to create**:

- `packages/domain/src/machines/workflow.machine.ts` — XState v5 machine for `WorkflowVersion` lifecycle: `draft` → `submitted` → `approved` → `effective` → `superseded` / `archived`. (Just the machine — wiring to UI lands in 3b.)
- `packages/domain/src/rules/workflow.rules.ts` — pure functions:
  - `validateWorkflowStructure(workflow)` → returns `{ ok: true } | { ok: false, errors: ValidationError[] }`. Checks: at least 1 phase, every phase has at least 1 group, every group has at least 1 step, no orphan groups, all `step.skillId` / `deviceId` / `recipeId` / `toolId` exist in their respective collections (passed as args).
  - `canEdit(versionStatus)` → returns `boolean`. True only if status is `draft`.
  - `canTransition(fromStatus, toStatus)` → returns `boolean`. Mirrors XState machine.
- `packages/domain/src/machines/workflow.machine.test.ts` — at least 12 tests covering all transitions and rejected transitions.
- `packages/domain/src/rules/workflow.rules.test.ts` — at least 10 tests covering valid structure, missing phase, orphan group, broken refs.

**Verification**:
```powershell
pnpm --filter @mes/domain test 2>&1 | Select-String "Tests" | Select-Object -Last 3
```
Expected: previous 29 tests still pass + new tests → total ≥ 51.

**Commit**: `feat(domain): add workflow XState machine and validation rules (D1)`

---

### D2 — Workflow API (`apps/api`)

**Goal**: REST endpoints for Workflow + WorkflowVersion CRUD. Same pattern as registries (extends `BaseRegistryService` where it makes sense).

**Files to create**:

- `apps/api/src/modules/workflows/workflows.module.ts`
- `apps/api/src/modules/workflows/workflows.repository.ts` — Prisma access, plantId enforced.
- `apps/api/src/modules/workflows/workflows.service.ts` — business logic, calls `validateWorkflowStructure` from `@mes/domain` on save.
- `apps/api/src/modules/workflows/workflows.controller.ts` — REST endpoints.
- `apps/api/src/modules/workflows/workflows.service.test.ts` — at least 12 tests (create, list, get, update, soft-delete, restore, plantId enforcement, validation rejection on invalid structure, version creation).
- Wire `WorkflowsModule` into `apps/api/src/app.module.ts` imports array.

**Endpoints**:
```
GET    /api/workflows                       # list, paginated, filtered by plantId
POST   /api/workflows                       # create new (also creates first version in draft)
GET    /api/workflows/:id                   # detail with current version + phases + groups + steps
PATCH  /api/workflows/:id                   # update workflow metadata
DELETE /api/workflows/:id                   # soft-delete
POST   /api/workflows/:id/restore           # restore from trash
GET    /api/workflows/trash                 # list soft-deleted
GET    /api/workflows/:id/audit             # audit log
GET    /api/workflows/:id/versions          # list all versions of this workflow
POST   /api/workflows/:id/versions          # create new draft version (clone of current)
GET    /api/workflows/:id/versions/:vid     # full version with phases/groups/steps
PATCH  /api/workflows/:id/versions/:vid     # update phases/groups/steps tree (only if status=draft)
```

**Out of scope for D2** (deferred to 3b):
- ❌ POST `/versions/:vid/approve`, `/reject`, `/publish` endpoints
- ❌ POST `/versions/:vid/clone` endpoint (use `POST /versions` as duplicate-source for now)
- ❌ Cross-version diff endpoint

**Verification**:
```powershell
pnpm --filter @mes/api test 2>&1 | Select-String "Tests" | Select-Object -Last 3
pnpm dev   # start in another terminal
# wait 30 seconds
Invoke-RestMethod http://localhost:3000/api/workflows
Invoke-RestMethod -Method POST -Uri http://localhost:3000/api/workflows -Body '{"code":"WF-PNEU-TUBE","name":"Pneumatic tube production","plantId":"<paste-real-plantId-from-db>"}' -ContentType "application/json"
```
Expected: previous 50 API tests still pass + new tests → total ≥ 62. Workflow creation returns 201 with the workflow object containing a `currentVersion` of status `draft`.

**Commit**: `feat(api): add workflows module with CRUD and version creation (D2)`

---

### D3 — Workflow list page + canvas page shell (`apps/web`)

**Goal**: Two new pages — list of workflows and the workflow editor shell (canvas not yet wired).

**Files to create**:

- `apps/web/src/app/(registries)/workflows/page.tsx` — list page using `RegistryListPage` (existing component from PROMPT_2). Columns: code, name, item, currentVersion, status, updatedAt.
- `apps/web/src/app/(registries)/workflows/[id]/page.tsx` — editor page. **Initially renders an empty 4-pane layout placeholder** with `react-resizable-panels`:
  - Pane 1 (left ~25%): "Wizard" placeholder
  - Pane 2 (left-bottom ~25%): "Palette" placeholder
  - Pane 3 (center ~50%): "Canvas" placeholder (will hold React Flow in D4)
  - Pane 4 (right ~30%): "Configurator" placeholder
- `apps/web/src/app/(registries)/workflows/new/page.tsx` — new workflow creation form (similar to `/items/new`).
- Update sidebar `apps/web/src/components/shell/Sidebar.tsx` to enable the "Workflow" entry (was disabled in PROMPT_2).

**Out of scope for D3**:
- ❌ React Flow installation and rendering (D4)
- ❌ Drag-drop (D5)
- ❌ Form configurator (D6)

**Verification**:
```powershell
pnpm dev
# in browser
# 1. localhost:3001/workflows → should show empty list (no workflows yet)
# 2. localhost:3001/workflows/new → form renders, can submit
# 3. After submit, redirect to /workflows/[newId] → shows 4-pane layout (placeholders)
# 4. Sidebar "Workflow" entry is enabled and links to /workflows
```

**Commit**: `feat(web): add workflows list and editor shell pages (D3)`

---

### D4 — React Flow canvas (`apps/web`)

**Goal**: Wire `@xyflow/react` into pane 3 of the editor. Render the workflow tree (Phases → Groups → Steps) as nodes with edges.

**Files to create/modify**:

- Install dependencies in `apps/web`:
  ```bash
  pnpm --filter @mes/web add @xyflow/react @dagrejs/dagre zustand
  ```
- `apps/web/src/components/workflow/WorkflowCanvas.tsx` — main React Flow component.
- `apps/web/src/components/workflow/nodes/PhaseNode.tsx` — custom node for Phase. Color-coded by `category` (use design tokens: 6 phase categories from `@mes/types/enums/phase.enum.ts`).
- `apps/web/src/components/workflow/nodes/GroupNode.tsx` — custom node for Group.
- `apps/web/src/components/workflow/nodes/StepNode.tsx` — custom node for Step. Shows `name`, `category`, `standardTimeSec` if set, lock icon if `source === 'auto_generated'`.
- `apps/web/src/components/workflow/edges/SequentialEdge.tsx` — default edge type.
- `apps/web/src/components/workflow/layout.ts` — `applyDagreLayout(nodes, edges)` utility using `@dagrejs/dagre`.
- `apps/web/src/components/workflow/store.ts` — Zustand store with `nodes`, `edges`, `selectedNodeId`, `setNodes`, `setEdges`, `selectNode`.

**Behavior**:
- On page mount, fetch workflow detail via SDK, transform tree to `nodes[]` and `edges[]`, run dagre layout, render.
- Pan/zoom enabled, mini-map enabled, controls (top-right) enabled.
- Click on a node selects it (updates Zustand `selectedNodeId`).

**Out of scope for D4**:
- ❌ Drag from Palette to Canvas (D5)
- ❌ Drag to reorder (D5)
- ❌ Right-click context menu (D5)

**Verification**:
```powershell
pnpm --filter @mes/web build
# In browser, after creating a workflow with at least 1 phase + 1 group + 1 step (manually via API for now):
# localhost:3001/workflows/[id] → Canvas renders with nodes laid out
```
Expected: canvas displays nodes, no console errors, mini-map and controls visible.

**Commit**: `feat(web): integrate xyflow canvas with phase/group/step nodes (D4)`

---

### D5 — Palette + drag-drop (`apps/web`)

**Goal**: Make pane 2 (Palette) functional. User can drag a Phase/Group/Step item onto the Canvas and it appears as a new node.

**Files to create/modify**:

- `apps/web/src/components/workflow/WorkflowPalette.tsx` — list of draggable item templates:
  - "Add Phase" (with category selector: production, quality, setup, teardown, packaging, logistics)
  - "Add Group" (only enabled if a Phase is selected)
  - "Add Step" with 3 categories: PRODUCTION, QUALITY_CONTROL, SCAN (others deferred to 3b)
- Drag-drop wiring: HTML5 drag-and-drop API (no extra library). On drop on Canvas, create a new node in Zustand store and trigger save.
- Auto-save: debounced 30 seconds. Calls `PATCH /api/workflows/:id/versions/:vid` with the full updated tree.
- Visual feedback: dropped node is highlighted for 2 seconds.

**Out of scope for D5**:
- ❌ Reorder by dragging within canvas (D5b in PROMPT_3b)
- ❌ Right-click context menu (deferred)
- ❌ Keyboard shortcuts (deferred)
- ❌ Undo/redo (deferred)

**Verification**:
- User can drag "Phase: Production" onto canvas → new PhaseNode appears
- User can drag "Group" onto a PhaseNode → new GroupNode appears as child
- User can drag "Step: PRODUCTION" onto a GroupNode → new StepNode appears
- After 30 seconds of inactivity, the workflow is saved (verify with `Invoke-RestMethod` on the version endpoint and confirm the new nodes are persisted)
- Refresh page → workflow loads with the same nodes

**Commit**: `feat(web): add workflow palette with drag-drop and auto-save (D5)`

---

### D6 — Step configurator form (3 categories) (`apps/web`)

**Goal**: Make pane 4 (Configurator) functional for the 3 most common step categories. When a user selects a StepNode, the right pane shows a form to edit its fields.

**Files to create**:

- `apps/web/src/components/workflow/forms/StepConfigurator.tsx` — switches form by step `category`.
- `apps/web/src/components/workflow/forms/ProductionStepForm.tsx` — fields: name, instructions, skillId (dropdown of skills from API), deviceId (dropdown), standardTimeSec, isRequired.
- `apps/web/src/components/workflow/forms/QualityControlStepForm.tsx` — fields: name, instructions, type (visual/dimensional/functional dropdown), thresholds (JSON editor placeholder for now).
- `apps/web/src/components/workflow/forms/ScanStepForm.tsx` — fields: name, instructions, scanType (qr/serial/id), expected pattern (regex string).
- All forms use `react-hook-form` + Zod schemas (extend existing schemas in `packages/schemas/src/registries/`).
- On submit, update Zustand store; auto-save kicks in.

**Out of scope for D6**:
- ❌ The other 5 step categories (LOGISTICS, SETUP, TEARDOWN, PARALLEL, RECOVERY) — deferred to 3b
- ❌ Live preview of the step (the 11-state mini HMI) — deferred to 3c
- ❌ Inline validation messages on canvas nodes (deferred)

**Verification**:
- Click a StepNode of category PRODUCTION → ProductionStepForm renders with current values
- Edit a field → after blur, value is persisted in store
- After 30s of idle, auto-save fires
- Refresh page → edited value is loaded

**Commit**: `feat(web): add step configurator form for PRODUCTION, QUALITY_CONTROL, SCAN (D6)`

---

## 🧪 Phase 3 — Definition of Done (paste output literally)

Before declaring PROMPT_3a done, run each command and **paste the literal output** in the chat. No paraphrasing.

### A. Test reality
```powershell
pnpm test 2>&1 | Select-Object -Last 30
```
Acceptance: 11 packages successful (up from 8 in PROMPT_2 baseline). Total tests **≥ 175** (was 127, plus ~48 new). No `Failed:` lines.

### B. Build reality
```powershell
pnpm build 2>&1 | Select-Object -Last 15
pnpm lint 2>&1 | Select-Object -Last 15
```
Acceptance: both exit 0. No new warnings beyond the 3 pre-existing turbo placeholder warnings (TODO-003).

### C. Runtime reality
```powershell
pnpm dev   # in terminal 1
# in terminal 2, wait 30s then:
Invoke-RestMethod http://localhost:3000/api/workflows
Invoke-WebRequest -UseBasicParsing http://localhost:3001/workflows | Select-Object StatusCode
Invoke-WebRequest -UseBasicParsing http://localhost:3001/workflows/new | Select-Object StatusCode
```
Acceptance: `/api/workflows` returns valid JSON (empty list initially is OK). Both web URLs return 200.

### D. End-to-end smoke
Manually in browser:
1. Open `localhost:3001/workflows/new`, create a workflow `WF-TEST-001`. Capture screenshot.
2. Open the editor: drag a Phase from Palette to Canvas, then a Group, then a Step (PRODUCTION). Capture screenshot.
3. Click the Step, edit name in the configurator. Wait 30s for auto-save.
4. Refresh page. Verify the workflow tree is exactly as left.

Paste 4 screenshots or describe each step's outcome.

### E. Git reality
```powershell
git status
git log --oneline | Select-Object -First 10
```
Acceptance: working tree clean. Log shows exactly 6 new commits on top of the previous head, one per deliverable D1-D6, in Conventional Commits format.

### F. Documentation reality
- [ ] `STATUS.md` updated with PROMPT_3a verification evidence (real test count, real endpoint counts, real route counts).
- [ ] `TODO.md` updated: any new known issue discovered during PROMPT_3a is added; nothing removed.
- [ ] No claim made about features not built (live preview, snapshot, 8 forms, versioning UI all remain in 3b/3c TODOs).

---

## 🚫 Out of scope (DO NOT do these in PROMPT_3a)

- ❌ Schema modifications
- ❌ WorkflowSnapshot logic (model is there but untouched)
- ❌ The other 5 step category forms (LOGISTICS, SETUP, TEARDOWN, PARALLEL, RECOVERY)
- ❌ Live preview / mini HMI emulator (the 11 states)
- ❌ Versioning approval UI (approve/reject/publish modals)
- ❌ Workflow templates ("New from Template" wizard)
- ❌ Device Execution Group swimlane UI
- ❌ Recovery Flow 4-stage wizard
- ❌ Diff view between versions
- ❌ Performance tuning beyond memo basics
- ❌ E2E tests (Playwright)
- ❌ Performance test "100+ nodes < 1 sec"
- ❌ Touching `apps/hmi`
- ❌ Fixing TODO-001 (seed soft-delete bug) unless it actively blocks workflow creation
- ❌ Fixing TODO-002 (HMI logo) — out of scope of web admin

---

## 🆘 Failure protocol

If at any deliverable a check fails or output is unexpected:
1. **STOP**. Do not attempt to paper over.
2. Paste the failing output verbatim.
3. State your hypothesis about the cause.
4. Ask before attempting a fix.

If a deliverable seems to require something outside this prompt's scope to "feel complete", **STOP and ask** rather than expanding scope.

---

## 🚀 Begin

When the user pastes this prompt:

1. Confirm context loaded from the files in "Required reading"
2. Summarize PROMPT_3a scope in 8-12 lines (your own words)
3. List any ambiguity you found in the spec
4. **Wait for "go"** before Phase 2

Do **not** start coding before explicit "go".

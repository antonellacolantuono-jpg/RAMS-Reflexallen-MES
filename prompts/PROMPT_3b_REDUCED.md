# PROMPT_3b_REDUCED — Workflow Designer Advanced (reduced for same-day delivery)

> **Type**: Build prompt for Claude Code Desktop (Step 3b of 6, REDUCED scope)
> **Predecessor**: PROMPT_3a (commit `e38014c`, merged April 29 evening)
> **Successor**: PROMPT_5_LITE (HMI execution, same day)
> **Estimated Claude Code time**: 3-4 hours
> **Last updated**: 2026-04-30
> **Status**: Active — REDUCED scope from full PROMPT_3b_ADVANCED.md

---

## ⚠️ Why "REDUCED"

This is a **deliberately scoped-down** version of PROMPT_3b. The original PROMPT_3b_ADVANCED covered 5 deliverables (5 step forms + validation panel + versioning UI + templates wizard + canvas polish). For same-day delivery alongside PROMPT_5_LITE, this version cuts to the **3 most impactful deliverables** for the demo:

- D1: 3 additional step forms (LOGISTICS, SETUP, RECOVERY) — covering 6/8 categories
- D2: validation panel base (sidebar list of errors, no canvas badges)
- D3: TODO.md update tracking everything skipped

The remaining work (PARALLEL/TEARDOWN forms, versioning UI, templates wizard, canvas polish) is consolidated into `PROMPT_3b_FULL.md` for post-demo completion (next week).

---

## 🎯 Goal

Extend the Workflow Designer from 3 step categories (PRODUCTION, QUALITY_CONTROL, IDENTIFICATION — done in D6 of PROMPT_3a) to **6 step categories** by adding LOGISTICS, SETUP, RECOVERY forms; and add a **validation panel** that shows cross-step errors as a clickable sidebar list (errors → click → scroll to relevant node).

After this prompt is verified done, a Process Engineer can:
- Drag any of 6 step categories from the palette onto the canvas (PRODUCTION, QUALITY_CONTROL, IDENTIFICATION + LOGISTICS, SETUP, RECOVERY)
- Click any step node and configure it via a category-specific form
- See validation errors in a sidebar panel
- Click an error to be brought to the offending node

---

## ⚠️ Hard constraints — DO NOT violate any of these

### Schema is sacred
**DO NOT modify `packages/prisma/schema.prisma`.** Use existing models. If you believe a field is missing, STOP and ask.

### Pattern continuity
- Forms MUST follow the same pattern as `apps/web/src/components/workflow/forms/ProductionStepForm.tsx` (D6 baseline): react-hook-form + Zod, blur-triggered onChange, useQuery for dropdowns.
- Validation panel uses `validateWorkflowStructure` from `packages/domain/src/rules/workflow.rules.ts` (exists since D1 of PROMPT_3a).

### No work outside scope
- ❌ NO PARALLEL or TEARDOWN forms (deferred to PROMPT_3b_FULL)
- ❌ NO versioning UI (approve/reject/publish modals) (deferred)
- ❌ NO templates wizard ("New from Template") (deferred)
- ❌ NO canvas polish (right-click, keyboard shortcuts, drag-to-reorder) (deferred)
- ❌ NO inline validation badges on canvas nodes (deferred — only sidebar list in D2 here)
- ❌ NO Phase / Group configurator forms (deferred to PROMPT_3b_FULL)
- ❌ NO Prisma schema changes
- ❌ NO modifications to other registry modules (items, equipment, operators, etc.)

If something feels needed but is in this list, STOP and ask rather than expanding scope.

### Stack alignment
Same as D6:
- ✅ react-hook-form + Zod (zod from direct dependency added in D6)
- ✅ @mes/ui primitives (Button, Field, Input, Select)
- ✅ Raw `<textarea>` (no Textarea primitive in @mes/ui)
- ✅ inline `useQuery` for dropdowns where needed
- ✅ Zustand store for selectedNodeId / nodes

---

## 📚 Required reading before planning

| File | Why |
|---|---|
| `STATUS.md` | Current state, latest baseline |
| `TODO.md` | 9 known issues — context for what NOT to fix here |
| `prompts/DOD_TEMPLATE.md` v1.1 | Verification gates including build + runtime smoke |
| `prompts/PROMPT_3a_CORE.md` D4-D6 sections | Pattern reference (canvas, palette, configurator) |
| `apps/web/src/components/workflow/forms/StepConfigurator.tsx` | Router pattern; you will extend the switch |
| `apps/web/src/components/workflow/forms/ProductionStepForm.tsx` | Baseline form pattern to copy for new forms |
| `apps/web/src/components/workflow/forms/QualityControlStepForm.tsx` | Reference for forms with category-internal type dropdown |
| `apps/web/src/components/workflow/forms/ScanStepForm.tsx` | Reference for forms with action-type-mapped dropdown |
| `apps/web/src/components/workflow/store.ts` | Existing Zustand actions; you may add `validationErrors` field |
| `apps/web/src/components/workflow/WorkflowCanvas.tsx` | Existing buildGraph + buildSavePayload + auto-save |
| `apps/web/src/app/(registries)/workflows/[id]/page.tsx` | 4-pane layout; you will add a new validation panel section |
| `packages/types/src/enums/step.enum.ts` | StepCategory + StepActionType enums |
| `packages/domain/src/rules/workflow.rules.ts` | `validateWorkflowStructure` already implemented in D1 |
| `packages/domain/src/rules/workflow.rules.test.ts` | Test patterns reference |

After reading, summarize in 8-12 lines:
- D1/D2/D3 scope IN/OUT
- The 3 step categories you'll add (LOGISTICS, SETUP, RECOVERY) and what each form contains
- Where validation panel renders (NEW pane in existing layout? Sidebar?)
- Files to create/modify
- Any ambiguity needing clarification

Wait for explicit "go" before Phase 2.

---

## 🛠 Phase 2 — Build (after user "go")

Execute D1, D2, D3 in order. After each: run verification commands, paste literal output, suggest commit message, wait for user acknowledgement.

### D1 — 3 additional step forms (LOGISTICS, SETUP, RECOVERY)

**Goal**: extend coverage from 3/8 to 6/8 step categories.

**New files**:

- `apps/web/src/components/workflow/forms/LogisticsStepForm.tsx`
  - Fields: `name`, `instructions`, `logisticsType` (Select: pick / place / transfer / receive / ship → maps to `StepActionType.PICK_PART / PLACE_PART / TRANSFER_LOT / RECEIVE_LOT / SHIP_LOT`), `boxTypeId` (optional Select from `useQuery(['box-types'])`), `targetLocation` (raw text input — NOT a real location dropdown, deferred)
  - Action type fallback when undefined: `pick_part`

- `apps/web/src/components/workflow/forms/SetupStepForm.tsx`
  - Fields: `name`, `instructions`, `setupType` (Select: bom_check / tool_check / device_calibration / recipe_load → maps to `StepActionType.BOM_CHECK / TOOL_VERIFY / CALIBRATE / LOAD_RECIPE`), `recipeId` (optional Select from `useQuery(['recipes'])`), `toolId` (optional Select from `useQuery(['tools'])`)
  - Action type fallback: `bom_check`

- `apps/web/src/components/workflow/forms/RecoveryStepForm.tsx`
  - Fields: `name`, `instructions`, `recoveryStage` (Select: diagnosis / attempt_1 / attempt_2 / scrap → maps to `StepActionType.RECOVER_DIAGNOSE / RECOVER_RETRY / RECOVER_SCRAP`), `causeCodeId` (optional Select from `useQuery(['cause-codes'])`)
  - Action type fallback: `recover_diagnose`
  - Note: this is a SIMPLIFIED single-step form. The full 4-stage recovery flow (with state machine wiring to multiple steps automatically) is deferred to PROMPT_3b_FULL.

**Modified files**:

- `apps/web/src/components/workflow/forms/StepConfigurator.tsx`
  - Add 3 new cases to the category switch
  - For step.category === LOGISTICS → render LogisticsStepForm
  - For step.category === SETUP → render SetupStepForm
  - For step.category === RECOVERY → render RecoveryStepForm
  - Update the empty-state message to include the 3 new supported categories

- `apps/web/src/components/workflow/WorkflowPalette.tsx`
  - Verify the palette already includes LOGISTICS / SETUP / RECOVERY draggable templates. If not, add them. Use the same pattern as PRODUCTION/QC/SCAN.

**Out of scope for D1**:
- ❌ PARALLEL form (Device Execution Group with parallel steps swimlane) — too complex, deferred
- ❌ TEARDOWN form — also deferred for symmetry with PARALLEL

**Verification**:
```powershell
pnpm --filter @mes/web build 2>&1 | Select-Object -Last 10
pnpm test 2>&1 | Select-Object -Last 5
```
Expected: 0 errors, ≥182 tests passing.

**Commit message**: `feat(web): add 3 step configurator forms (LOGISTICS, SETUP, RECOVERY) — 6/8 categories covered (D1)`

---

### D2 — Validation panel (sidebar list, no canvas badges)

**Goal**: surface cross-step validation errors as a sidebar list, clickable, no inline badges on canvas nodes.

**Where it renders**: in the existing 4-pane layout at `/workflows/[id]/page.tsx`, add a **collapsible section at the bottom of the Wizard pane (left)** OR as a new accordion section. Keep the layout clean — do NOT add a 5th pane.

**Existing logic**: `validateWorkflowStructure` already exists in `packages/domain/src/rules/workflow.rules.ts`. It returns `{ ok: true } | { ok: false, errors: ValidationError[] }`. Each error has shape `{ field: string, message: string, ... }`.

**New files**:

- `apps/web/src/components/workflow/ValidationPanel.tsx`
  - Reads workflow tree from store (or pass workflow as prop)
  - Calls `validateWorkflowStructure(workflow, refs)` where `refs` = `{ skills, devices, recipes, tools }` (use existing useQuery hits)
  - If `ok: true` → renders empty state "Nessun errore" with green check icon
  - If `ok: false` → renders list of errors. Each error row:
    - Severity icon (red triangle for hard errors)
    - Error message (Italian if possible, otherwise English)
    - Field path (e.g., "Phase 'Setup' / Group 'BOM' / Step 'Check')
    - Click → calls `selectNode(extractedNodeIdFromField)` in store, scrolling the canvas to that node
  - Re-runs validation when workflow tree changes (use store subscription or useMemo)

**Modified files**:

- `apps/web/src/app/(registries)/workflows/[id]/page.tsx`
  - Add `<ValidationPanel workflow={workflow} />` somewhere in the Wizard pane (or as a separate accordion section). Keep it scrollable and collapsible.

**Out of scope for D2**:
- ❌ Inline validation badges on canvas nodes (deferred to PROMPT_3b_FULL)
- ❌ Real-time validation re-run on every keystroke (settle for on-blur / on-save)
- ❌ Cross-version validation (compare effective vs draft)
- ❌ Approval-gate validation (require zero errors before submit) — deferred to versioning UI

**Verification**:
```powershell
pnpm --filter @mes/web build 2>&1 | Select-Object -Last 10
pnpm test 2>&1 | Select-Object -Last 5
```
Expected: 0 errors, ≥182 tests passing.

Manual smoke (optional, only if dev server is running):
- Open `/workflows/[some-id]`
- Add a Phase with no Group → ValidationPanel should show "Phase 'X' has no Group"
- Click the error → canvas scrolls to that Phase node

**Commit message**: `feat(web): add ValidationPanel sidebar with clickable errors (D2)`

---

### D3 — TODO.md update tracking all deferred items

**Goal**: every "skipped" feature today must be a tracked TODO entry.

**File modified**: `TODO.md`

Add the following entries (assign next free numbers — start from TODO-008 since TODO-001..007 are already taken):

```markdown
### TODO-NNN (HIGH) — PROMPT_3b_FULL completion: PARALLEL + TEARDOWN step forms
File: apps/web/src/components/workflow/forms/
Missing: forms for the 2 most complex step categories.
- PARALLEL: Device Execution Group with parallel steps swimlane (main step + concurrent sub-steps + buffer time)
- TEARDOWN: cleanup, reset, archive sub-types
Time: 3-4h (parts of full PROMPT_3b)

### TODO-NNN (HIGH) — PROMPT_3b_FULL: versioning UI lifecycle
File: apps/web/src/app/(registries)/workflows/[id]/page.tsx + new modals
Missing: workflow lifecycle UI (currently API supports submit/approve/reject/publish but UI doesn't expose it).
- Submit-for-approval modal with comment
- Approve/Reject modal for QC Manager
- Publish-as-effective modal for Plant Manager
- Version history sidebar
Time: 3-4h

### TODO-NNN (MEDIUM) — PROMPT_3b_FULL: templates wizard
File: new component apps/web/src/components/workflow/TemplateWizard.tsx
Missing: "New workflow from template" with at least 3 Pneumatic Air templates seedable from MOCK_DATA.
Time: 2h

### TODO-NNN (MEDIUM) — PROMPT_3b_FULL: canvas polish
File: apps/web/src/components/workflow/WorkflowCanvas.tsx
Missing:
- Right-click context menu on nodes (delete, duplicate)
- Keyboard shortcuts: Del, Ctrl+D, Ctrl+Z, Ctrl+Shift+Z
- Drag-to-reorder steps within a Group
Time: 2-3h

### TODO-NNN (MEDIUM) — PROMPT_3b_FULL: inline validation badges on canvas
File: apps/web/src/components/workflow/nodes/StepNode.tsx (and Phase/Group nodes)
Missing: red badge with tooltip on nodes that have validation errors. Currently errors only in sidebar (D2 of PROMPT_3b_REDUCED).
Time: 1-2h

### TODO-NNN (MEDIUM) — PROMPT_3b_FULL: Phase and Group configurator forms
File: extend apps/web/src/components/workflow/forms/StepConfigurator.tsx OR new PhaseConfigurator/GroupConfigurator
Missing: forms for editing Phase metadata (category, name) and Group metadata (supportsParallel, supportsRecovery).
Currently Phase/Group nodes show empty configurator.
Time: 1-2h

### TODO-NNN (MEDIUM) — Recovery flow simplification
File: apps/web/src/components/workflow/forms/RecoveryStepForm.tsx
Currently a single-step form with stage selector. The full 4-stage recovery flow (auto-generation of diagnosis → attempt 1 → attempt 2 → scrap as separate connected steps) is missing.
Time: 2-3h
```

**Verification**:
```powershell
git diff TODO.md
```
Expected: 7 new TODO entries, no deletions or modifications to existing entries.

**Commit message**: `docs: track 7 PROMPT_3b_FULL completion items as TODO entries (D3)`

---

## 🧪 Phase 3 — Definition of Done

Per `prompts/DOD_TEMPLATE.md` v1.1 — paste literal command outputs.

### A. Test reality
```powershell
pnpm test 2>&1 | Select-Object -Last 30
```
Acceptance: ≥182 tests passing (D6 baseline), 0 failed.

### B. Build reality
```powershell
pnpm --filter @mes/web build 2>&1 | Select-Object -Last 15
pnpm build 2>&1 | Select-Object -Last 10
```
Acceptance: 0 errors, all tasks successful.

### C. Runtime reality (lightweight, since we did D1-D5 verification yesterday)
```powershell
pnpm dev
```
Wait 30 seconds, expect:
- API logs: WorkflowsController routes mapped, no TS errors
- Web "Ready in Xs"
- HMI "Ready in Xs"

If any startup fails, STOP and paste log.

(NOT running full curl tests for time — workflow API already verified in PROMPT_3a.)

### D. Git reality
```powershell
git status
git diff --stat origin/main..HEAD
```

Acceptance:
- Working tree clean
- ONLY these files in diff:
  - 3 new forms in `apps/web/src/components/workflow/forms/`
  - `apps/web/src/components/workflow/forms/StepConfigurator.tsx` (modified)
  - `apps/web/src/components/workflow/WorkflowPalette.tsx` (modified, IF needed)
  - `apps/web/src/components/workflow/ValidationPanel.tsx` (new)
  - `apps/web/src/app/(registries)/workflows/[id]/page.tsx` (modified)
  - `TODO.md` (modified, +7 entries)
- NO `schema.prisma`, NO other registry modules

If unexpected files appear, STOP and explain.

### E. Suggested commit + push

3 commits (one per D), or 1 squashed commit if you prefer atomicity:
```powershell
git add apps/web/src/components/workflow/forms/LogisticsStepForm.tsx apps/web/src/components/workflow/forms/SetupStepForm.tsx apps/web/src/components/workflow/forms/RecoveryStepForm.tsx apps/web/src/components/workflow/forms/StepConfigurator.tsx apps/web/src/components/workflow/WorkflowPalette.tsx
git commit -m "feat(web): add 3 step configurator forms (LOGISTICS, SETUP, RECOVERY) — 6/8 categories covered (D1)"

git add apps/web/src/components/workflow/ValidationPanel.tsx apps/web/src/app/(registries)/workflows/[id]/page.tsx
git commit -m "feat(web): add ValidationPanel sidebar with clickable errors (D2)"

git add TODO.md
git commit -m "docs: track 7 PROMPT_3b_FULL completion items as TODO entries (D3)"

git push origin <your-worktree-branch>
```

STOP. Paste:
- Build output (Gate B last 10 lines)
- Test count (Gate A summary)
- git diff --stat (Gate D)
- 3 commit hashes
- Push output

Wait for user merge into main.

---

## 🚫 Out of scope (DO NOT do these in PROMPT_3b_REDUCED)

- ❌ PARALLEL or TEARDOWN step forms
- ❌ Versioning UI (modals approve/reject/publish, history sidebar, diff view)
- ❌ Templates wizard
- ❌ Canvas polish (right-click, keyboard shortcuts, drag-to-reorder)
- ❌ Inline validation badges on canvas nodes
- ❌ Phase / Group configurator forms
- ❌ Schema modifications
- ❌ WorkflowSnapshot logic (PROMPT_3c)
- ❌ Live preview / mini HMI emulator (PROMPT_3c)
- ❌ Touching apps/api beyond reading
- ❌ Touching apps/hmi
- ❌ Fixing TODO-001..009 unless they actively block (e.g., TODO-009 form save bug — only fix if you cannot create test workflows; otherwise create via API)

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
2. Summarize PROMPT_3b_REDUCED scope in 8-12 lines
3. List any ambiguity
4. Wait for "go" before Phase 2

Do NOT start coding before explicit "go".

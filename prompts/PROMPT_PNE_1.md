# PROMPT_PNE_1 — Resource Selection complete (Step Configurator)

> **Version**: 1.0
> **Author**: Antonella Colantuono (via Claude chat)
> **Date**: 2026-05-02
> **Branch base**: `main` (post PROMPT_3d merge)
> **Estimated effort**: 8-12h (across 4 increments — smaller PROMPT)
> **Test budget**: floor +12, ideal +18
> **Mockup fidelity**: HIGH on this PROMPT (configurator is customer-visible)

---

## 1. Goal

Implement the full Resource Selection content inside the Add Step configurator (the SHELL was created in PROMPT_3d D2). Specifically: the 6-tab Resource panel that lets a process engineer attach Materials, Tools, Devices, Skills, Recipes, Attention Points to a step.

Reference visual: section A3 of conversation brief (Add Step full-screen configurator, central column "RESOURCE SELECTION").

This PROMPT also wires the Action Configuration content (right column) for each step kind, which was a placeholder in PROMPT_3d D2.

---

## 2. What stays unchanged

- AddStepDialog shell layout (3 columns) from PROMPT_3d D2
- Step kind palette and step category palette (unchanged from PROMPT_3d D1)
- Existing API endpoints `/api/items`, `/api/tools`, `/api/equipment`, `/api/skills`, `/api/recipes`, `/api/attention-points` (unchanged)
- Database schema (no migrations)

---

## 3. What changes

### 3.1 Resource panel: 6 tabs

Replace the placeholder `<EmptyState>` in AddStepDialog center column with a `<Tabs>` from `@mes/ui` containing 6 tabs:

| Tab | Source API | Selection mode | Display |
|---|---|---|---|
| **Materials** | `GET /api/items?type=raw_material,component,consumable,finished_good` (all types) | multi-select | List with photo placeholder + code mono + name + UM + stock available |
| **Tools** | `GET /api/tools` | multi-select | List with code + name + status (active/maintenance) + dimensions |
| **Devices** | `GET /api/equipment?level=device` | multi-select | List with code + name + type + status |
| **Skills** | `GET /api/skills` | multi-select | List with code + name + level required |
| **Recipes** | `GET /api/recipes?deviceId={selectedDeviceId}` (filter by selected device if present) | single-select | List with code + version + device compat + parameters preview |
| **Attention Points** | `GET /api/attention-points` | multi-select | List with code + category + severity + label |

Each tab body has:
- Header with search input (filters list client-side OR server-side via API q-param)
- Body: scrollable list with checkboxes (or radio for Recipes)
- Footer: "X selezionati" counter + "Pulisci" button to clear selection

Use `<Tabs count={selectedCount}>` extension from DS_LIFT D5: each tab shows a count badge of currently selected resources. Use the new `dot` prop for color-coded indication (e.g., green dot = at least 1 selected, neutral = empty).

### 3.2 Recipe-Device coupling

The Recipes tab is **dependent** on Device selection:
- If no device selected: show `<EmptyState kind="select" title="Seleziona prima un dispositivo" body="Le ricette sono filtrate per dispositivo" compact />`.
- If 1 device selected: filter recipes by `deviceCompatibility` (recipes whose `compatibleDevices` array contains the device ID).
- If multiple devices selected: show recipes compatible with ANY of them (union), with a chip on each row indicating which device it's for.

### 3.3 Action Configuration panel — by Step Kind

Replace the placeholder in AddStepDialog right column with form fields specific to the step kind:

#### Manual
- Instructions (textarea, rich text optional, required)
- Standard duration (number input, sec, default 0)
- Max duration (number input, sec, optional)
- Italian label override (text, optional, falls back to Name)
- English label override (text, optional)
- Required step (toggle, default true)

#### Automatic / Device-driven
- Device (read-only, populated from Devices selection — disabled if no device selected, with help text "Seleziona un dispositivo nella tab Risorse")
- Recipe (read-only, populated from Recipes selection — same)
- Cycle time (number input, sec, populated from recipe.standardCycleTime if recipe selected; editable)
- **Parallel steps buffer** (number input, sec, default 5; help text "Tempo di buffer per gli step paralleli, prima del termine del ciclo")
- **Allows parallel steps** (toggle, default false; if true, opens a sub-section "Step paralleli" with picker — but for PROMPT_PNE_1, render this as a placeholder section "TODO PNE_4: HMI rendering" — the data structure exists since PROMPT_3a but UI to add parallel sub-steps is in scope for PNE_4).
- On NOK: dropdown `Stop and alert | Trigger recovery sub-flow | Block WO | Continue` (if "Trigger recovery sub-flow" selected, sub-field "Recovery Workflow" with autocomplete from existing workflows of category "recovery").
- Pass threshold: depends on device type (for leak tester: leak rate < X mbar/min; for camera: ROI similarity ≥ X%; etc.). Render as dynamic fields based on `device.type` enum.

#### Guided (Manual w/ device)
- Instructions (textarea, required)
- Tool (read-only, populated from Tools selection)
- Verification checklist (multi-line input, one item per line; renders as checkboxes at runtime)
- Standard duration (number input, sec)

#### Parallel (when chosen as a Step Kind)
- Parent step (autocomplete from existing steps in current workflow with `supportsParallel: true`)
- Part reference (select: `previous | current | next`)
- Duration during device cycle (number input, sec, must be ≤ parent.cycleTime - parent.parallelStepsBufferSec)
- Description (textarea, required)

#### Sub-flow
- Sub-flow workflow link (autocomplete from existing workflows of category "recovery" or "subflow")
- Trigger condition (select: `onNok | manual | conditional`)

#### Decision
- Branch label (text, required, e.g., "PASS / FAIL / MARGINAL")
- On-OK target (autocomplete from existing steps in current workflow OR "next" sentinel for next step)
- On-NOK target (autocomplete OR "previous" sentinel)
- On-MARGINAL target (autocomplete, optional)

#### Information
- Content type (select: SOP / Video / Drawing / Safety briefing)
- Content reference (file picker or URL — for MVP, just URL text input)
- Acknowledgment required (toggle)

#### Setup / Teardown
- Auto-generated badge (read-only, based on group category)
- Standard duration

### 3.4 Save flow

- On click "Salva Step": validate all required fields per step kind.
- Call existing API `POST /workflows/:id/versions/:vid/groups/:gid/steps` with payload including all selected resources as relations.
- On success: dialog closes, toast "Step '{name}' aggiunto", new step appears in canvas tree.
- On validation error: highlight invalid fields, toast "Compilare i campi obbligatori".

---

## 4. Pre-flight checks

```bash
git status                          # clean main, post PROMPT_3d merge
git log --oneline -10               # PROMPT_3d D6 at HEAD
pnpm test --run 2>&1 | tail -5      # cumul ~614

# Verify endpoints exist
grep -E "items|tools|equipment|skills|recipes|attention-points" apps/api/src/**/*.controller.ts -l

# Verify AddStepDialog shell exists from PROMPT_3d
ls apps/web/src/components/workflows/AddStepDialog.tsx
```

If anything fails, stop and report.

---

## 5. Increments

### D1 — Resource tabs scaffold (Materials, Tools, Devices)

**Scope**: 3 of 6 tabs (the simpler ones — no recipe-device coupling).

**Files**:
- `apps/web/src/components/workflows/configurator/ResourceTabs.tsx` (new — Tabs container)
- `apps/web/src/components/workflows/configurator/MaterialsTab.tsx` (new)
- `apps/web/src/components/workflows/configurator/ToolsTab.tsx` (new)
- `apps/web/src/components/workflows/configurator/DevicesTab.tsx` (new)
- `apps/web/src/components/workflows/configurator/ResourceList.tsx` (new — generic list with search + multi-select)

**Tasks**:
- ResourceTabs renders `<Tabs count={selectedCount}>` for the 6 tabs (Materials/Tools/Devices/Skills/Recipes/Attention Points). For D1, only Materials/Tools/Devices have content; others render a placeholder `<EmptyState kind="data" title="Tab in sviluppo (D2)" compact />`.
- Each tab fetches data via TanStack Query.
- ResourceList: generic component receives `items: T[]`, `selectedIds: string[]`, `onToggle: (id) => void`, `renderRow: (item) => ReactNode`, plus search.
- MaterialsTab uses ResourceList with item-specific render (photo placeholder + code + name + UM + stock).
- ToolsTab and DevicesTab analogous.

**Tests** (target +5):
- ResourceTabs renders 6 tabs (1)
- MaterialsTab renders fetched items (1)
- Search filters list (1)
- Toggle adds/removes from selection (1)
- ToolsTab renders fetched tools (1)

**Gates D1**:
- type-check + build + lint
- Cumul: ~614 → ~619

**Commit**: `feat(workflow-configurator): resource tabs scaffold + Materials/Tools/Devices (PROMPT_PNE_1 D1)`

### D2 — Skills, Recipes (with device coupling), Attention Points

**Scope**: remaining 3 tabs.

**Files**:
- `apps/web/src/components/workflows/configurator/SkillsTab.tsx` (new)
- `apps/web/src/components/workflows/configurator/RecipesTab.tsx` (new — with device dependency)
- `apps/web/src/components/workflows/configurator/AttentionPointsTab.tsx` (new)

**Tasks**:
- SkillsTab: ResourceList with skill-specific render (code + name + level required).
- RecipesTab: depends on selected device IDs. If empty → EmptyState "select" kind. Otherwise: fetch `/api/recipes?compatibleDeviceIds=...`. Render with device-compat chip.
- AttentionPointsTab: ResourceList with category + severity + label.

**Tests** (target +4):
- RecipesTab shows EmptyState when no device (1)
- RecipesTab fetches with device filter (1)
- SkillsTab renders skills (1)
- AttentionPointsTab renders points (1)

**Gates D2**:
- type-check + build + lint
- Cumul: ~619 → ~623

**Commit**: `feat(workflow-configurator): Skills + Recipes (device-coupled) + Attention Points tabs (PROMPT_PNE_1 D2)`

### D3 — Action Config per step kind

**Scope**: replace placeholder action config with kind-specific form.

**Files**:
- `apps/web/src/components/workflows/configurator/ActionConfig.tsx` (new — switch on stepKind)
- `apps/web/src/components/workflows/configurator/action-forms/*.tsx` (one file per kind: ManualForm, AutomaticForm, GuidedForm, ParallelForm, SubFlowForm, DecisionForm, InformationForm, SetupTeardownForm)
- `apps/web/src/lib/step-validation-schemas.ts` (Zod schemas per step kind)

**Tasks**:
- ActionConfig renders the appropriate form based on selected step kind.
- Each form uses react-hook-form with the kind-specific Zod schema.
- Field bindings to the parent AddStepDialog state.
- Live computation: e.g., AutomaticForm cycle time auto-fills from selected recipe.

**Tests** (target +5):
- ManualForm renders required fields (1)
- AutomaticForm enables device/recipe from Resource selection (1)
- AutomaticForm cycle time auto-fills from recipe (1)
- DecisionForm autocompletes step targets (1)
- ParallelForm validates duration ≤ parent cycle - buffer (1)

**Gates D3**:
- type-check + build + lint
- Cumul: ~623 → ~628

**Commit**: `feat(workflow-configurator): action config per step kind (PROMPT_PNE_1 D3)`

### D4 — Wire save flow + integration test + STATUS update

**Scope**: end-to-end flow from drag-drop to step creation in DB.

**Files**:
- `apps/web/src/components/workflows/AddStepDialog.tsx` (wire submit handler)
- `apps/web/src/lib/workflow-step-mutations.ts` (TanStack Query mutation for POST step)
- `STATUS.md` (PROMPT_PNE_1 closure section)

**Tasks**:
- Submit handler: collect all state from ResourceTabs + ActionConfig, validate via top-level Zod schema, call mutation.
- Mutation: optimistic update + invalidate workflow query on success.
- On success: close dialog, toast, focus new step in canvas (selected).
- On error: show error toast with reason.

**Tests** (target +4):
- Successful submit creates step with all resources (1)
- Validation prevents submit with missing required fields (1)
- Optimistic update shows step in tree before server response (1)
- Error rolls back optimistic update (1)

**Manual verification**:
- Open workflow `WF-TEST-001`, drag a "Manual" step kind onto an existing group, fill name + instructions, save. Verify step appears in canvas and persists across refresh.

**Gates D4** (FINAL):
- type-check + build + lint clean
- Cumul: ~628 → ~632 (target floor: 614 + 12 = 626; ideal: 614 + 18 = 632)
- STATUS.md updated

**Commit**: `feat(workflow-configurator): wire save flow + close PROMPT_PNE_1 (PROMPT_PNE_1 D4)`

---

## 6. Test target ladder

| Increment | Cumul | Floor | Ideal |
|---|---|---|---|
| Baseline | 614 | — | — |
| D1 | ~619 | ≥617 | ≥620 |
| D2 | ~623 | ≥620 | ≥625 |
| D3 | ~628 | ≥624 | ≥630 |
| D4 | ~632 | **≥626** | **≥632** |

---

## 7. Surprise budget

Stop and ask if:
- API endpoints listed don't exist or have different shapes than expected (re-check PROMPT_2 / PROMPT_3a-b output)
- Recipe-device compatibility relation isn't already in schema (would require DB migration — out of scope here)
- Existing AddStepDialog shell (from PROMPT_3d) doesn't expose hooks for resource selection state

---

## 8. Exit criteria

- 4 increments committed
- Test cumul ≥ 626
- pnpm build 12/12, lint clean
- Manual smoke: at least 1 step created end-to-end with resources attached
- STATUS.md updated

---

**End PROMPT_PNE_1**

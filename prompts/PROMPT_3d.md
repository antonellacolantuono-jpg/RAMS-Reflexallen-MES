# PROMPT_3d — Workflow Editor UX-lift to mockup

> **Version**: 1.0
> **Author**: Antonella Colantuono (via Claude chat)
> **Date**: 2026-05-02
> **Branch base**: `main` (post DS_LIFT merge)
> **Estimated effort**: 14-20h (across 6 increments)
> **Test budget**: floor +18, ideal +24
> **Mockup fidelity**: NON-NEGOTIABLE on this PROMPT

---

## 1. Goal

Refactor the existing workflow editor (`apps/web/src/app/(workflows)/workflows/[id]/page.tsx` and supporting components) to match the Design System mockup faithfully:

- **Palette**: ungated. STEP CATEGORIES (7) + STEP KINDS (5) always available; phase creation moves to a `+ Add Phase` button on canvas top-right.
- **Drag-drop**: directly drop a Step Kind onto a Group node in canvas (or from palette to tree). Selecting a Group in canvas activates the drop zone.
- **Canvas**: phase columns horizontal layout (vs current vertical tree). Each phase = one column with stacked groups; groups contain steps stacked.
- **Inspector**: 3 tabs Properties / Metadata / Audit (vs current single Configuratore pane).
- **Canvas toolbar**: Visual Editor / Parallel toggle (top of canvas).
- **Backward compatibility**: existing test workflow `WF-TEST-001` (and any other workflow already in DB) must keep loading and editing without data loss. Schema unchanged; only UI restructured.

Reference visual: `docs/design-handoff/source/screens-1.jsx` (or relevant section of bundle that shows the mockup workflow editor).

---

## 2. What stays unchanged

- Database schema for `Workflow`, `WorkflowVersion`, `Phase`, `Group`, `Step`, `Resource` (no migrations in this PROMPT)
- API endpoints `/api/workflows/*` (no changes)
- Domain logic (validation, autogen, snapshot on release): untouched
- Step action types and step parameters model: untouched
- React Flow library (xyflow) usage in canvas: STAYS, the refactor is on top of React Flow nodes/edges, not replacing it

---

## 3. What changes

UI-only. Specifically:

### 3.1 Palette refactor

**Current** (`apps/web/src/components/workflows/WorkflowPalette.tsx` or equivalent):
```
PALETTE
├── FASI (clickable list of 6 phases)
├── GRUPPI (gated: "Seleziona una Fase")
└── STEP (gated: "Seleziona un Gruppo")
```

**Target**:
```
PALETTE
├── STEP CATEGORIES (always visible, drag handles)
│   ├── Identification (Scan, label, register)
│   ├── Production (Assemble, machining)
│   ├── Quality Control (Inspect, test)
│   ├── Logistics (Move, pack, ship)
│   ├── Service (Setup, maintain)
│   ├── Safety (Lockout, PPE)
│   └── Documentation (Photo, sign-off)
└── STEP KINDS (always visible, drag handles)
    ├── Manual (Operator action)
    ├── Automatic (Device-driven)
    ├── Guided (Manual w/ device)
    ├── Parallel (Pause/resume)
    └── Sub-flow (Recovery, etc.)
```

**Removed from palette**: FASI section. Phase creation moves to `+ Add Phase` button on canvas top-right (see 3.4).

**Removed from palette**: GRUPPI section. Group creation happens via right-click on a Phase node, OR via a small `+` button on each Phase column header.

**Phase categories that map to palette**: still respected when creating phases (Inbound, Setup, Production, QC, Outbound, Teardown). The `+ Add Phase` drawer presents a category dropdown.

### 3.2 Drag-drop interaction

- Each item in STEP CATEGORIES and STEP KINDS is a draggable card (use `@xyflow/react` drag pattern OR HTML5 drag-drop, your choice based on existing setup).
- Drop targets are Group nodes in the canvas. When dragging starts, all eligible Group nodes pulse (border accent ring) to indicate drop zones. Ineligible groups (compatibility matrix mismatch — see MASTER_SPECIFICATION § 7.6) are dimmed.
- On drop: open the Add Step configurator (covered in `PROMPT_PNE_1.md` as a separate increment for resource selection complete; for `PROMPT_3d` create the **shell** of the Add Step configurator with placeholder Resource/Action panes — full content in PNE_1).
- Right-click on Phase node opens context menu with `+ Add Group` (modal `<Modal>`). Right-click on Group node opens `+ Add Step` (full-screen overlay with the Add Step configurator).

### 3.3 Canvas layout — phase columns horizontal

**Current**: vertical tree (Phase 1 → Group 1 → Step 1 stacked top to bottom in single column).

**Target**: phase columns horizontal.
- Each Phase = one vertical column, side-by-side, separated by a small gap.
- Each column has a header with phase code (PH-01), icon (📥/🔧/⚙️/🎯/📤/✅), name, category badge.
- Groups stack vertically inside each phase column. Each Group has its name, category, AUTO badge if auto-gen, parallel/recovery support indicators.
- Steps stack vertically inside each group, numbered (01, 02, 03...). Each step shows name + tiny icon for category.
- Dependency arrows (from `decision` step branches, `onNok`, `onOk`) render as React Flow edges between phases.
- Use `@mes/ui` Canvas suite components (created in DS_LIFT D6): `CanvasGrid` for background, `ZoomControls` bottom-right, `Minimap` bottom-left, `CanvasToolbar` top-left, `CanvasStateBar` top-right.

### 3.4 Canvas toolbar — Visual Editor / Parallel toggle

Top of canvas, two pill tabs:
- **Visual Editor** (default): the phase columns layout.
- **Parallel**: shows a "parallel view" of the device execution group(s) in the workflow — for each group with `supportsParallel: true`, render the device main step + its parallel steps as side-by-side cards (similar to how HMI will render at runtime). Read-only initial implementation — clicking a parallel step opens its inspector but doesn't allow editing on this view (Visual Editor remains the editing canvas).

### 3.5 Inspector — 3 tabs

**Current**: single pane with form fields.

**Target**: `<Tabs>` from `@mes/ui` with 3 tabs:

- **Properties** (default tab): existing fields (Name, Instructions, Skill, Device, Standard time, Device category, Required step, etc.) move here. No content change.
- **Metadata**: shows `code`, `version`, `status` (Draft/Active/Deprecated/Approved), `createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `tags` (comma-separated, editable in Workflow node only), `defaultWorkCenters` (multi-select of work centers, editable in Workflow node only). For Step nodes, Metadata shows: stepId, sequence, parentGroupId, parentPhaseId, autoGenerated (boolean readonly), createdAt/By + updatedAt/By.
- **Audit**: shows `<AuditTimeline>` from `@mes/ui` with the audit log entries scoped to this node. For now (PROMPT_3d), use a stub adapter: read from existing `audit_logs` table filtered by `entityType` and `entityId`. If no entries, show `<EmptyState kind="data" title="Nessuna attività registrata" />`. Full adapter integration is TODO-033 (deferred to F2).

The 3 tabs use `<Tabs count={...}>` from DS_LIFT D5 — Audit tab gets `count` prop showing number of audit entries, Properties has none.

### 3.6 `+ Add Phase` button

Top-right of canvas, prominent button.
- On click: opens `<Drawer width={480}>` from `@mes/ui` (NOT `width={720}` — this is short-form data entry).
- Drawer title: "Nuova Fase".
- Form fields (use `react-hook-form` + Zod):
  - Name (text input, required, e.g., "Final Assembly")
  - Category (select, required): `inbound | setup | production | quality_control | outbound | teardown` (Italian labels)
  - Cycle-based (toggle, default off): "La fase si ripete per ogni pezzo"
  - Tags (optional, comma-separated input)
- Drawer footer: `[Annulla]` `[Aggiungi Fase]` (primary)
- On Add: phase appears in canvas as new column on right (animated slide-in 200ms). Drawer closes. Toast `Toast({ message: "Fase '{name}' aggiunta" })`.

### 3.7 `+ Add Group` modal

On right-click of a Phase node (or `+` button in Phase column header):
- `<Modal>` from `@mes/ui` (NOT Drawer, this is form-only no rich UX).
- Title: "Nuovo Gruppo".
- Form fields:
  - Name (required)
  - Category (select, required, filtered by phase per § 7.5 of MASTER_SPEC)
  - Supports parallel (toggle, only enabled for `device_execution` category)
  - Supports recovery (toggle, only enabled for `device_execution` and `qc` categories)
- Footer `[Annulla]` `[Aggiungi Gruppo]`. Toast confirm on add.

### 3.8 Add Step configurator (shell)

**This PROMPT (3d)**: implement the **shell** with empty Resource and Action panes.
**PROMPT_PNE_1**: implement the full Resource Selection (6 tabs) and Action Configuration content.

Shell scope for PROMPT_3d:
- Triggered by right-click on a Group → "Aggiungi Step", or by drag-drop Step Kind onto Group.
- Full-screen overlay (use a `<Modal>` with `wide` prop or new pattern; avoid Drawer for this — too cramped).
- Layout 3 columns:
  - Left (~260px): selected Step Kind from palette (pre-selected if drag-drop), or selector if right-click invoked. Read-only display + ability to change.
  - Center (~flexible): "RESOURCE SELECTION" title + tabs row (Materials | Tools | Devices | Skills | Recipes | Attention Points) — render tabs as `<Tabs>` from `@mes/ui` BUT with placeholder content `<EmptyState kind="data" title="Selezione risorse — vedi PROMPT_PNE_1" compact />`. To be filled in PNE_1.
  - Right (~340px): "ACTION CONFIGURATION" title + form fields per Step Kind (Manual: instructions + std/max duration + IT/EN labels; Automatic: device select + recipe select + cycle time placeholder; Guided: instructions + tool select; Parallel: parent step ref + part reference + duration; Sub-flow: link to sub-flow). PROMPT_3d: render the form structure; `select` options can be empty placeholders unless data is trivial to wire (devices and recipes will populate from existing API).
- Footer: `[Annulla]` `[Salva Step]`. Save button validates (name required + at least the Action Config minimum) and creates Step.
- On Save: step appears in tree + canvas. Drag-source dimmed in palette (used). Toast confirm.

### 3.9 Validate button

Top-right toolbar (already exists). Refactor to use new `<Drawer width={360} side="right">` instead of inline panel:
- On click: drawer opens with validation results.
- Validation rules: same as existing (at least 1 phase, each phase at least 1 group, each group at least 1 step OR auto-gen, etc.).
- Drawer body: list of issues with severity (error/warning) + click-to-navigate to the offending node.
- Empty state if zero issues: `<EmptyState kind="success" title="Workflow valido" body="Pronto per la pubblicazione" />` (note: add an `kind="success"` variant to EmptyState if not already; check if D2 covered all 4 kinds).

### 3.10 Diff vs / Simulate / Export / Publish buttons

**Top-bar of editor**: currently the editor has limited actions. Mockup shows: `Diff vs v3 | Validate | Simulate | Export | Publish v4` (where v3 is current published, v4 is draft).

For PROMPT_3d:
- `Validate`: refactor as per 3.9 (drawer).
- `Diff vs v{n}`, `Simulate`, `Export`: render as buttons but **wire as TODOs**. On click, show toast `"In sviluppo — disponibile in F2"`. Do NOT implement diff/simulate/export logic in PROMPT_3d.
- `Publish v{n+1}`: keep existing publish flow logic (already implemented in PROMPT_3b_FULL). UI button now matches mockup styling.

---

## 4. Pre-flight checks

Before starting D1, run these read-only checks. Do NOT modify code:

```bash
# 1. Verify branch base
git status                          # expect: clean main, post DS_LIFT merge
git log --oneline -3                # expect: e35fbb5 (D6) at HEAD

# 2. Test count baseline
pnpm --filter @mes/api test --run 2>&1 | tail -5
pnpm --filter @mes/domain test --run 2>&1 | tail -5
pnpm --filter @mes/ui test --run 2>&1 | tail -5
# expect: 587 cumulative (or close, accounting for Windows tmp bug variance)

# 3. Identify existing files to refactor
ls apps/web/src/app/\(workflows\)/workflows/
ls apps/web/src/components/workflows/
grep -rn "WorkflowPalette\|WorkflowCanvas\|WorkflowInspector\|WorkflowConfigurator" apps/web/src --include="*.tsx" -l

# 4. Check existing test workflow exists
# (only needed if you want to mass-validate backward-compat at end)

# 5. Verify @mes/ui patterns are available from DS_LIFT
grep -E "Tabs|Drawer|Modal|Toast|EmptyState|CanvasGrid|GenericNode|CanvasEdge" packages/ui/src/index.ts | head -10
# expect: all listed patterns should be exported
```

If any pre-flight gives unexpected output, **stop and report**. Do not start D1.

---

## 5. Increments

### D1 — Palette refactor (ungate + STEP CATEGORIES + STEP KINDS)

**Scope**: palette restructure only. No canvas/inspector/drag-drop yet.

**Files**:
- `apps/web/src/components/workflows/WorkflowPalette.tsx` (rewrite)
- `apps/web/src/components/workflows/PaletteItem.tsx` (new — generic draggable item)
- `apps/web/src/lib/workflow-palette-data.ts` (new — static data for STEP CATEGORIES + STEP KINDS labels + icons)

**Tasks**:
- Remove FASI / GRUPPI / STEP gated sections.
- Render STEP CATEGORIES (7 items) with category icons (use lucide-react: `ScanLine, Cog, ClipboardCheck, Truck, Wrench, Shield, FileText` mapping to the 7 categories).
- Render STEP KINDS (5 items) with kind icons (`Hand, Cpu, HelpCircle, Pause, GitBranch`).
- Each PaletteItem is keyboard-focusable and has `draggable={true}` attribute (drag handlers wired in D2).
- Italian labels for both sections (see § 3.1 for label mapping).

**Tests** (target +4 in @mes/web new test file `WorkflowPalette.test.tsx`):
- Renders 7 step categories
- Renders 5 step kinds
- Categories and kinds have icons (assertion on rendered SVG presence)
- Items are focusable

**Gates D1**:
- `pnpm --filter @mes/web type-check` clean
- `pnpm --filter @mes/web build` clean
- `pnpm --filter @mes/web test --run` passes (+4 new)
- `pnpm lint` 0 new warnings
- Test cumul: 587 → ~591

**Commit message**:
```
feat(workflow-editor): palette refactor to ungated step categories + kinds (PROMPT_3d D1)
```

### D2 — Drag-drop wiring + drop targets + Add Step shell

**Scope**: enable drag from palette, configure drop zones on Group nodes (existing GenericNode in canvas), invoke Add Step shell on drop.

**Files**:
- `apps/web/src/components/workflows/WorkflowCanvas.tsx` (modify Group node component to accept drop)
- `apps/web/src/components/workflows/AddStepDialog.tsx` (new — full-screen modal shell)
- `apps/web/src/components/workflows/WorkflowPalette.tsx` (add HTML5 drag handlers OR @xyflow/react drag — pick simpler)
- `apps/web/src/lib/workflow-compatibility.ts` (new — compatibility matrix Group × Step Category from MASTER_SPEC § 7.6)

**Tasks**:
- On drag start: highlight eligible Group nodes (CSS class `pulse-accent`).
- On drop: open AddStepDialog with pre-selected Step Kind/Category and the target Group ID.
- AddStepDialog implements the SHELL only (3-column layout, placeholder Resource/Action). On submit: minimal validation (name required), creates Step via existing API mutation, closes dialog, toast.
- Right-click context menu on Group → "Aggiungi Step" also opens AddStepDialog (without pre-selection).

**Tests** (target +5):
- Compatibility matrix: function returns correct allowed step categories per group category (5 cases)

**Gates D2**:
- type-check + build + lint clean
- Test cumul: ~591 → ~596

**Commit**: `feat(workflow-editor): drag-drop palette to group + AddStepDialog shell (PROMPT_3d D2)`

### D3 — Canvas refactor (phase columns horizontal)

**Scope**: replace vertical tree layout with phase columns horizontal.

**Files**:
- `apps/web/src/components/workflows/WorkflowCanvas.tsx` (rewrite layout — keep React Flow internals, change node positioning algorithm)
- `apps/web/src/components/workflows/PhaseColumn.tsx` (new — column container)
- `apps/web/src/components/workflows/GroupNode.tsx` (modify — fit inside phase column)
- `apps/web/src/components/workflows/StepNode.tsx` (modify — fit inside group node)
- `apps/web/src/lib/workflow-layout.ts` (new — algorithm that takes Phase[] and computes x,y for each Phase column / Group node / Step node)

**Tasks**:
- Layout algorithm: for each Phase, x = phaseIndex * (columnWidth + gap), y = 0. For each Group inside, y stacks vertically. For each Step inside, y stacks under group header.
- Use `@mes/ui` `<CanvasGrid>` as background, `<CanvasToolbar>` top-left (Pan / Select / Add / Connect / Annotate buttons — initial Pan/Select wired, others as TODO toasts), `<CanvasStateBar>` top-right (dirty flag, count nodes/edges, undo/save), `<Minimap>` bottom-left, `<ZoomControls>` bottom-right.
- Edge rendering for `decision` step branches (onOk → next phase, onNok → recovery sub-flow link) using `<CanvasEdge>` from `@mes/ui` D6.
- Selection: clicking a node selects it (selected ring border). Inspector reads from selected node.

**Tests** (target +6):
- Layout algorithm: phases laid out left-to-right (3 cases)
- Layout: groups stacked vertically inside phase (1 case)
- Layout: steps stacked vertically inside group (1 case)
- Edge: decision step renders 2 edges (onOk, onNok) (1 case)

**Gates D3**:
- type-check + build + lint clean
- Backward-compat smoke (manual): existing test workflow loads with phase-column layout (no data corruption)
- Test cumul: ~596 → ~602

**Commit**: `feat(workflow-editor): canvas phase-columns horizontal layout (PROMPT_3d D3)`

### D4 — Inspector 3-tab (Properties / Metadata / Audit)

**Scope**: replace single Configuratore pane with 3-tab Inspector.

**Files**:
- `apps/web/src/components/workflows/WorkflowInspector.tsx` (rewrite as Tabs container)
- `apps/web/src/components/workflows/inspector/PropertiesTab.tsx` (extract existing form into this file)
- `apps/web/src/components/workflows/inspector/MetadataTab.tsx` (new)
- `apps/web/src/components/workflows/inspector/AuditTab.tsx` (new — uses `AuditTimeline` + stub adapter)
- `apps/web/src/lib/audit-adapter.ts` (new — TODO-033 stub adapter API row → AuditTimelineEntry; current implementation: empty adapter that returns empty array, full impl in F2)

**Tasks**:
- Use `<Tabs count={...}>` from DS_LIFT D5; Audit tab has count prop bound to (placeholder 0 for now until adapter is wired).
- PropertiesTab: lift existing form fields verbatim from current Configuratore.
- MetadataTab: render fields per § 3.5. Workflow node metadata: code, version, status, dates+by, tags (editable), defaultWorkCenters (editable). Step node metadata: stepId, sequence, parentIds, autoGenerated, dates+by (read-only).
- AuditTab: render `<AuditTimeline entries={[]} />` (stub). Empty state: `<EmptyState kind="data" title="Nessuna attività registrata" compact />`.
- Selection: 3-tab inspector swaps content based on selected node type (Workflow root / Phase / Group / Step).

**Tests** (target +5):
- Inspector renders 3 tabs (1)
- Selecting workflow shows workflow metadata fields (1)
- Selecting step shows step metadata fields (1)
- Properties tab renders form for selected step (1)
- Audit tab shows EmptyState when no entries (1)

**Gates D4**:
- type-check + build + lint clean
- Test cumul: ~602 → ~607

**Commit**: `feat(workflow-editor): inspector 3-tab Properties/Metadata/Audit (PROMPT_3d D4)`

### D5 — Add Phase drawer + Add Group modal + Validate drawer

**Scope**: phase creation, group creation, validation feedback panel.

**Files**:
- `apps/web/src/components/workflows/AddPhaseDrawer.tsx` (new)
- `apps/web/src/components/workflows/AddGroupModal.tsx` (new)
- `apps/web/src/components/workflows/ValidateDrawer.tsx` (new)
- `apps/web/src/lib/workflow-validation.ts` (refactor existing validation if needed; otherwise import as-is)

**Tasks**:
- AddPhaseDrawer per § 3.6. `+ Add Phase` button placed in canvas top-right; click opens drawer.
- AddGroupModal per § 3.7. Right-click on Phase opens context menu with `+ Add Group`; click opens modal.
- ValidateDrawer per § 3.9. `Validate` button opens drawer; lists issues with severity + click-to-navigate.
- Use existing API endpoints `POST /workflows/:id/versions/:vid/phases`, `POST .../groups`, validation runs client-side for now (already implemented).
- Add EmptyState `kind="success"` if not present (DS_LIFT D2 covered factory/search/data/error; check `EmptyState.tsx`; if `success` missing, add SVG inline + tone variant).

**Tests** (target +4):
- AddPhaseDrawer renders form and submits (1)
- AddGroupModal filters category options by phase (1)
- ValidateDrawer renders issues list (1)
- ValidateDrawer empty state when valid (1)

**Gates D5**:
- type-check + build + lint clean
- Test cumul: ~607 → ~611

**Commit**: `feat(workflow-editor): add phase drawer + add group modal + validate drawer (PROMPT_3d D5)`

### D6 — Visual/Parallel toggle + top-bar buttons + backward-compat verification

**Scope**: canvas toolbar Visual/Parallel toggle, top-bar action buttons styling, manual backward-compat smoke.

**Files**:
- `apps/web/src/components/workflows/WorkflowCanvas.tsx` (add toggle state)
- `apps/web/src/components/workflows/ParallelView.tsx` (new — read-only parallel-step preview)
- `apps/web/src/components/workflows/WorkflowTopBar.tsx` (style buttons per mockup; wire Diff/Simulate/Export as toast TODOs)
- `STATUS.md` (add section "PROMPT_3d 100% complete")

**Tasks**:
- Visual/Parallel toggle: pill tabs at top of canvas (between toolbar and canvas grid). Visual = current. Parallel = render device-execution groups with parent + parallel children side-by-side.
- ParallelView: for each `device_execution` group with `supportsParallel: true`, show device main step card (with cycle time, recipe ref) + parallel step cards on the right (with partRef + duration). Click on a card opens inspector but doesn't allow editing.
- TopBar: button styles match mockup (Draft badge, version arrow Vn → Vn+1, Diff vs / Validate / Simulate / Export / Publish). Diff/Simulate/Export: `onClick={() => toast.show("In sviluppo — disponibile in F2", "info")}`.
- STATUS.md update: section "PROMPT_3d 100% complete" with D1-D6 commit refs and final test count.

**Tests** (target +3):
- ParallelView: renders device execution group with parallel children (1)
- Visual/Parallel toggle switches view (1)
- Diff button shows in-development toast (1)

**Manual verification (backward-compat)**:
- Open existing test workflow `WF-TEST-001` (or `wf-pneumatic-12-680` if already seedeed).
- Verify: phase columns render correctly; can edit a step (changes via Inspector save successfully); can add a new step via drag-drop; existing data preserved.

**Gates D6** (FINAL):
- type-check + build + lint clean
- Test cumul: ~611 → ~614 (target floor: 587 + 18 = 605, ideal: 587 + 24 = 611. Both achieved.)
- STATUS.md updated

**Commit**: `feat(workflow-editor): visual/parallel toggle + topbar styling + close PROMPT_3d (PROMPT_3d D6)`

---

## 6. Test target ladder (cumulative)

| Increment | Test cumul | Target floor | Target ideal |
|---|---|---|---|
| Baseline (post DS_LIFT) | 587 | — | — |
| D1 | ~591 | ≥589 | ≥593 |
| D2 | ~596 | ≥594 | ≥598 |
| D3 | ~602 | ≥598 | ≥604 |
| D4 | ~607 | ≥601 | ≥609 |
| D5 | ~611 | ≥604 | ≥614 |
| D6 (FINAL) | ~614 | **≥605** | **≥611** |

If a Dn falls below floor, stop and ask. If above ideal, fine.

---

## 7. Surprise budget — when to stop and ask

Stop and ask the user (Antonella) before proceeding if:

1. Existing test workflow data appears to be lost or corrupted after D3 layout refactor (backward-compat critical)
2. React Flow integration with the new phase-columns layout produces visual glitches that can't be fixed with CSS — may indicate a deeper React Flow API mismatch
3. Audit adapter (D4) requires schema changes (it shouldn't; `audit_logs` table should already have `entityType` + `entityId` filterable columns from PROMPT_1; if missing, scope creep, deferral needed)
4. Drag-drop on Windows/touch produces unexpected behavior that conflicts with React Flow's pan/zoom
5. Test count drops below target floor at any Dn

---

## 8. Backward-compat checklist

- [ ] Existing workflows load without errors
- [ ] Existing steps (with all action types) edit correctly via new Inspector
- [ ] Existing phase categories (6) all selectable in Add Phase drawer
- [ ] Existing group categories (9) all renderable in canvas
- [ ] Existing 8 step categories all draggable from palette
- [ ] WO release with workflow snapshot still works (Spot-test with existing test WO if accessible)
- [ ] No DB migration required (verify with `pnpm --filter @mes/prisma migrate status`)

---

## 9. Exit criteria

PROMPT_3d closes when ALL of:

- 6 increments D1-D6 committed with conventional commit messages
- Test cumul ≥ 605 (floor)
- pnpm build 12/12, pnpm lint 0 new warnings
- STATUS.md updated with "PROMPT_3d 100% complete" section
- Manual backward-compat smoke (D6) passed by Claude Code on existing test workflow
- Branch pushed, ready for user merge

---

## 10. References

- Mockup: `docs/design-handoff/source/screens-1.jsx` (workflow editor view)
- DS reference (image 2 of conversation): Brake Caliper Assembly v3 layout with palette ungated + phase columns + 3-tab inspector
- DS_LIFT primitives used: `Tabs`, `Drawer`, `Modal`, `Toast`, `EmptyState`, `CanvasGrid`, `CanvasToolbar`, `CanvasStateBar`, `Minimap`, `ZoomControls`, `GenericNode`, `CanvasEdge`, `AuditTimeline`
- Domain: MASTER_SPECIFICATION.md § 4 (taxonomies), § 7 (workflow), § 14 (UX patterns)
- Backward-compat critical: existing workflows must continue to function

---

**End PROMPT_3d**

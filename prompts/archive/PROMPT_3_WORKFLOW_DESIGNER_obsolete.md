> ⚠️ **OBSOLETE — DO NOT USE**

>

> This prompt was a single 13-step monolith for the entire Workflow Designer (canvas, 8 polymorphic forms, live preview with 11 states, versioning, snapshot, performance, E2E tests). The honest estimate of effort was 32-45 hours of Claude Code work, not the 3-4 hours originally claimed.

>

> Replaced on April 29, 2026 by three smaller prompts:

> - `prompts/PROMPT_3a_CORE.md` — canvas + 4-pane + 3 step forms + CRUD (~8-10h)

> - `prompts/PROMPT_3b_ADVANCED.md` — remaining 5 forms + validation + versioning + templates (~6-8h)

> - `prompts/PROMPT_3c_SNAPSHOT_PREVIEW.md` — snapshot + live preview + performance + E2E (~8-10h, requires WO release flow first)

>

> Kept here as a reference for the original spec scope. See `STATUS.md` and `TODO.md` for current state.

>

> ---


# PROMPT 3 — WORKFLOW DESIGNER v3

> **Type**: Build prompt for Claude Code (Step 3 of 6)
> **Pre-requisite**: PROMPT_1 + PROMPT_2 completed and committed; CLAUDE.md at repo root
> **Estimated time**: 3-4 hours
> **Last updated**: 2026-04-27

\---

## 📋 PROMPT TO PASTE (copy from here)

```
TASK: Build the WORKFLOW DESIGNER for the Reflexallen MES.

(Context already loaded from CLAUDE.md at session start.)

═══════════════════════════════════════════════════════════════════════════════
GOAL
═══════════════════════════════════════════════════════════════════════════════

Build a visual Workflow Designer where Process Engineers can create, edit,
and version workflows for production. After this step:

- Process Engineers can drag-drop phases/groups/steps onto a canvas
- Each step is configurable via a 4-pane configurator
- Workflows are versioned with approval workflow (draft → approved → effective)
- Live preview shows the operator's experience for each step
- WorkflowSnapshot is created automatically when WO is released
- All edits respect ADR-001 (workflows in use are immutable)

This is the MOST COMPLEX UI in the MES — invest time getting it right.

═══════════════════════════════════════════════════════════════════════════════
PRE-REQUISITES
═══════════════════════════════════════════════════════════════════════════════

You should have already completed and committed PROMPT_2 (registries).
Verify:
✓ All 13 registries CRUD work
✓ Seed data populated (120+ entities visible)
✓ Real-time + audit log working

═══════════════════════════════════════════════════════════════════════════════
ADDITIONAL READING (do BEFORE planning)
═══════════════════════════════════════════════════════════════════════════════

Beyond CLAUDE.md context, also read:

→ docs/MASTER_SPECIFICATION.md sections 8-12 (workflow domain)
→ docs/MASTER_SPECIFICATION.md section 22 (extensions integration)
→ docs/BEST_PRACTICES.md sections about workflow service patterns
→ docs/extensions/INDUSTRIAL_OPERATIONS.md (multi-output, continuous, sample)
→ docs/extensions/CFRP_MODULE.md (cure cycle long-running steps)
→ docs/extensions/SAFETY_DEVICES_MODULE.md (aging tests, ECE compliance)
→ docs/extensions/WORKFLOW_PNEUMATIC_AIR.md (high-level reference)
→ docs/extensions/WORKFLOW_PNEUMATIC_AIR_DETAILED.md (step-by-step + branching)
→ docs/extensions/WORKFLOW_CFRP.md (high-level CFRP workflow)
→ docs/extensions/WORKFLOW_SAFETY_DEVICES.md (high-level Safety workflow)
→ docs/design-tokens.md (UI must respect tokens)

═══════════════════════════════════════════════════════════════════════════════
PHASE 1 — PLAN (NO CODE YET)
═══════════════════════════════════════════════════════════════════════════════

Read the documents above, then propose a plan covering:

1. CANVAS ARCHITECTURE
   
   1.1 React Flow setup
       - Custom node types: PhaseNode, GroupNode, StepNode
       - Custom edge types: SequentialEdge, ParallelEdge, ConditionalEdge
       - Node colors per category (use design tokens)
       - Auto-layout with dagre
       - Zoom/pan controls
       - Mini-map for large workflows
       - Snap-to-grid optional
   
   1.2 Node hierarchy
       - Workflow → Phases → Groups → Steps
       - Drag-drop to nest correctly
       - Visual indication of parent-child
       - Color coding by category (6 phase categories)
   
   1.3 Visual states
       - Selected node: highlighted border
       - Connected nodes: subtle highlight
       - Errors: red badge with tooltip
       - Warnings: yellow indicator
       - Auto-generated steps: lock icon (cannot edit)

2. 4-PANE CONFIGURATOR

   The configurator has 4 panes (resizable):
   
   2.1 PANE 1: Wizard (left, ~25% width)
       - Step-by-step flow to add new elements
       - "Add Phase", "Add Group", "Add Step", "Add Recovery Flow"
       - Smart suggestions based on context
       - Templates ("Standard production phase", "Quality phase", etc.)
   
   2.2 PANE 2: Element Palette (left-bottom, ~25% width)
       - Searchable list of: Phases, Groups, Steps, Auto-Gen Rules
       - Drag-drop onto canvas
       - Filter by category
       - Recently used items
   
   2.3 PANE 3: Canvas (center, ~50% width)
       - The main React Flow canvas
       - Selected node has visible bounding box
       - Right-click context menu (delete, duplicate, etc.)
       - Keyboard shortcuts (Del, Ctrl+D, Ctrl+Z, Ctrl+Shift+Z)
   
   2.4 PANE 4: Configurator Form (right, ~30% width)
       - Form for the SELECTED node
       - Polymorphic by step category (8 different forms)
       - Zod validation, inline errors
       - Live preview link to PANE 5

3. LIVE PREVIEW STATE-DRIVEN
   
   When configuring a step, show 11 interactive states:
   
   3.1 The 11 states to preview:
       1. PENDING (waiting to start)
       2. ACTIVE (currently doing)
       3. ACTIVE_PARALLEL (in parallel group, running)
       4. PAUSED (operator paused)
       5. SUCCESS (completed OK)
       6. FAILED (failed, no recovery yet)
       7. RECOVERY_DIAGNOSIS (in recovery, stage 1)
       8. RECOVERY_ATTEMPT_1 (recovery, stage 2)
       9. RECOVERY_ATTEMPT_2 (recovery, stage 3)
       10. SCRAP (final, scrapped)
       11. SKIPPED (operator skipped with permission)
   
   3.2 Preview UI
       - Mini HMI emulator (matches actual HMI design)
       - State selector (click to see different states)
       - Operator action buttons rendered correctly
       - Counters, attention points, recovery options visible
   
   3.3 Why this matters
       - Process Engineer sees exactly what operator sees
       - Catches design errors early
       - Validates step configurations

4. STEP CATEGORIES (8 polymorphic forms)
   
   For each category, define:
   - Specific fields needed
   - Default values
   - Validation rules
   - UI rendering hints
   
   Categories:
   4.1 SCAN (scan_qr, scan_serial, verify_id) — input requirements
   4.2 PRODUCTION (manual, device_execution) — operator actions
   4.3 QUALITY_CONTROL (visual, dimensional, functional) — checks + thresholds
   4.4 LOGISTICS (pick, place, transfer) — material movement
   4.5 SETUP (auto-gen, BOM check, tool check) — pre-production
   4.6 TEARDOWN (cleanup, reset, archive) — post-production
   4.7 PARALLEL (Device Execution Group) — concurrent steps + buffer
   4.8 RECOVERY (4-stage flow) — failure handling

5. AUTO-GENERATION INTEGRATION
   
   When a workflow uses certain step types, auto-generation rules apply:
   - Mark auto-generated steps with lock icon
   - User cannot delete auto-gen steps directly (must remove triggering condition)
   - Show explanatory tooltip ("This step is auto-generated by Rule #2: BOM Check")
   - Configuration in Workflow level (e.g., "Enable BOM check for this WO?")
   - Full auto-gen logic implementation in PROMPT_4

6. WORKFLOW VERSIONING \& APPROVAL
   
   6.1 Version states
       - DRAFT (editable, not in use)
       - APPROVED (read-only, can be effective)
       - EFFECTIVE (active in production)
       - SUPERSEDED (replaced by newer version)
       - ARCHIVED (no longer relevant)
   
   6.2 Operations
       - Save Draft (auto-save every 30 sec, manual on demand)
       - Submit for approval (locks editing)
       - Approve / Reject (with comment)
       - Publish as effective (replaces previous version)
       - Clone version (start a new draft from existing)
   
   6.3 Approval workflow
       - Process Engineer creates/edits → Draft
       - QC Manager or Plant Manager → Approve
       - Production Manager → Set effective
       - Audit log captures all transitions

7. WORKFLOWSNAPSHOT (CRITICAL — ADR-001)
   
   When a Work Order is RELEASED:
   - Copy the EFFECTIVE workflow into a WorkflowSnapshot
   - WO uses the snapshot, NOT the original workflow
   - Original workflow can be modified later (new version)
   - In-flight WOs continue with their snapshot
   - This is IMMUTABLE — verify it's enforced at DB level
   
   Implementation:
   - Triggered automatically on WO state transition (released → setup)
   - Snapshot includes ALL nested data (phases + groups + steps + configs)
   - Snapshot is fully self-contained (denormalized for traceability)
   - Snapshot has its own ID, references original workflow + version

8. WORKFLOW VALIDATION (cross-step)
   
   Validate workflow integrity before allowing approval:
   - All required phases present
   - Step dependencies satisfied
   - No orphan groups or steps
   - Recovery flows attached where needed
   - Skills required match available operators
   - Devices referenced exist
   - Recipes referenced are approved
   
   Show validation errors inline (red badges) and in a panel.

9. UI TEMPLATES \& WIZARDS
   
   To accelerate workflow creation:
   - "New Workflow from Template" (Pneumatic Air, CFRP, Safety, custom)
   - "Add standard phase" (Inbound, Setup, Production, QC, Packaging, etc.)
   - "Add device execution group" (with buffer, parallel steps wizard)
   - "Add recovery flow" (4-stage template)
   
   Templates use the seed data from MOCK_DATA_PNEUMATIC_AIR.

10. DEVICE EXECUTION GROUP (special handling)
    
    Some operations have parallel steps:
    - Main step (device cycle, e.g., 45 sec leak test)
    - Parallel steps that run during the device cycle
    - Buffer time (default 5 sec safety margin)
    - Each parallel step has a "part reference" (current/previous/next)
    
    UI representation:
    - Visual swimlane showing main step + parallel lanes
    - Drag steps into parallel lanes
    - Validate timing: sum of parallel steps < main step duration

11. RESPONSIVE \& ACCESSIBLE
    
    - Desktop primary (1920×1080 minimum)
    - Tablet supported (1024×768)
    - Keyboard navigation throughout
    - Screen reader labels on all controls
    - WCAG AA contrast minimum

12. PERFORMANCE
    
    - Canvas with 100+ nodes must render < 1 sec
    - Drag operations smooth 60fps
    - Zoom/pan smooth
    - Auto-save without freezing UI
    - Lazy load step configurations (load on click)

13. VERIFICATION STEPS
    
    - Can create new workflow from scratch
    - Can edit existing workflow
    - All 11 preview states render correctly
    - Auto-generated steps cannot be deleted
    - Approval workflow transitions work
    - WorkflowSnapshot creates correctly on WO release
    - Cross-step validation catches issues

After presenting your plan, STOP and wait for my approval.

═══════════════════════════════════════════════════════════════════════════════
PHASE 2 — BUILD (ONLY AFTER MY APPROVAL)
═══════════════════════════════════════════════════════════════════════════════

When I say "go", proceed in this order:

STEP 2.1 — Domain logic
  - packages/domain: WorkflowMachine (XState for versioning lifecycle)
  - packages/domain: Workflow validation rules (pure functions)
  - packages/domain: WorkflowSnapshot creation logic
  - Tests: 20+ tests for domain

STEP 2.2 — API layer
  - apps/api: WorkflowsModule with full CRUD
  - apps/api: WorkflowVersionsModule
  - apps/api: WorkflowSnapshotService (auto-create on WO release)
  - apps/api: ValidationService (cross-step validation)
  - Endpoints:
    GET    /api/workflows
    POST   /api/workflows
    GET    /api/workflows/:id
    PATCH  /api/workflows/:id
    POST   /api/workflows/:id/versions
    POST   /api/workflows/:id/versions/:vid/approve
    POST   /api/workflows/:id/versions/:vid/reject
    POST   /api/workflows/:id/versions/:vid/publish
    POST   /api/workflows/:id/versions/:vid/clone
    GET    /api/workflows/:id/versions/:vid/validate
  - Verify: API tests pass (15+ tests)

STEP 2.3 — Frontend: canvas foundation
  - apps/web: WorkflowDesignerPage at /workflows/\[id]
  - Install React Flow + dagre
  - Custom nodes: PhaseNode, GroupNode, StepNode
  - Custom edges: SequentialEdge, ParallelEdge
  - Auto-layout
  - Zoom/pan/minimap
  - Verify: empty canvas renders correctly

STEP 2.4 — Frontend: 4-pane layout
  - apps/web: WorkflowConfigurator component
  - Resizable panes (use react-resizable-panels)
  - Pane 1: Wizard
  - Pane 2: Palette (with seed data)
  - Pane 3: Canvas (from 2.3)
  - Pane 4: Configurator form (initially empty)
  - Verify: panes resize, canvas keeps responsive

STEP 2.5 — Frontend: drag-drop interaction
  - From Palette to Canvas: create new node
  - On Canvas: drag to reorder
  - Right-click context menu
  - Keyboard shortcuts (Del, Ctrl+D, Ctrl+Z, Ctrl+Shift+Z)
  - Save state in Zustand
  - Auto-save (debounced 30 sec)
  - Verify: full editing experience smooth

STEP 2.6 — Frontend: step configurator forms
  - 8 polymorphic forms (one per step category)
  - Zod schemas (shared with backend)
  - Inline validation
  - Live preview link
  - Verify: each category form complete

STEP 2.7 — Frontend: live preview
  - Preview component with 11 interactive states
  - Mini HMI emulator (style matches actual HMI)
  - State selector dropdown
  - Renders step-specific UI (counters, buttons, etc.)
  - Verify: all 11 states render distinctly

STEP 2.8 — Frontend: validation panel
  - Sidebar with current validation errors
  - Inline error badges on canvas nodes
  - Click error to scroll to relevant node
  - Validation runs on save + on demand
  - Verify: catches all major issues

STEP 2.9 — Frontend: versioning UI
  - Version history sidebar
  - Compare versions (diff view)
  - Approve / Reject UI (modal with comment)
  - Publish as effective UI
  - Clone version UI
  - Verify: approval flow end-to-end works

STEP 2.10 — Templates \& wizards
  - "New from Template" wizard
  - Standard phase templates
  - Device Execution Group wizard
  - Recovery Flow wizard
  - Verify: can create new workflow in < 5 min using templates

STEP 2.11 — WorkflowSnapshot integration
  - Trigger on WO state transition (released → setup)
  - Copy entire workflow tree to snapshot
  - WO references snapshot (not workflow)
  - Verify: in-flight WOs unaffected by workflow edits

STEP 2.12 — Performance optimization
  - Memoize node renders
  - Virtual scroll on palette
  - Lazy load step configs
  - Verify: 100+ nodes render < 1 sec

STEP 2.13 — Tests
  - E2E test: complete workflow creation
  - E2E test: approval flow
  - E2E test: WO release creates snapshot
  - Unit tests: validation rules (20+)
  - Verify: all pass

═══════════════════════════════════════════════════════════════════════════════
PHASE 3 — VERIFY \& REPORT
═══════════════════════════════════════════════════════════════════════════════

Generate STATUS REPORT covering:
- ✓ Canvas + 4-pane layout working
- ✓ Drag-drop smooth
- ✓ All 8 step categories configurable
- ✓ All 11 preview states render
- ✓ Validation catches errors
- ✓ Versioning + approval flow works
- ✓ WorkflowSnapshot creates correctly
- ✓ Performance: 100+ nodes OK
- ✓ Tests passing (count)
- Suggested commit message

═══════════════════════════════════════════════════════════════════════════════
ACCEPTANCE CRITERIA
═══════════════════════════════════════════════════════════════════════════════

\[ ] Canvas with 4-pane configurator works
\[ ] Process Engineer can create workflow from scratch
\[ ] All 8 step categories have polymorphic forms
\[ ] Live preview shows 11 interactive states
\[ ] Auto-generated steps shown with lock (and not editable)
\[ ] Versioning lifecycle works (draft → approved → effective)
\[ ] Validation catches structural issues
\[ ] WorkflowSnapshot created on WO release (immutable)
\[ ] Templates accelerate workflow creation
\[ ] Device Execution Group with parallel steps works
\[ ] Recovery Flow (4 stages) configurable
\[ ] Performance: 100+ nodes render < 1 sec
\[ ] All E2E tests pass
\[ ] Design tokens applied consistently

═══════════════════════════════════════════════════════════════════════════════
GO STEP-BY-STEP
═══════════════════════════════════════════════════════════════════════════════

Now:
1. Read the additional files listed above
2. Verify PROMPT_2 work is intact (registries still functional)
3. Present detailed plan
4. Wait for approval
5. Build step by step
6. Generate status report

START WITH THE PLAN.
```

(End of prompt to paste)

\---

## 📚 Notes for Antonella (NOT to paste to Claude Code)

### Why this is the most complex prompt

The Workflow Designer is the heart of the MES. It's where Process Engineers
spend hours daily. The UX must be excellent. The complexity is high because:

1. React Flow with custom nodes is non-trivial
2. 4-pane layout with sync between panes
3. 8 polymorphic forms (one per step category)
4. 11 interactive preview states
5. Versioning lifecycle with approval flow
6. WorkflowSnapshot (immutable copy on WO release)
7. Auto-generation integration
8. Validation across nodes

### Watch out for these issues

**Issue 1**: Claude Code might propose a "simpler" canvas using D3 or custom.

* Reject. Tell him: "Use React Flow. It's the standard for this use case."

**Issue 2**: Claude Code might cut corners on the 11 preview states.

* Push back. All 11 must render distinctly. They guide stakeholders.

**Issue 3**: Claude Code might forget WorkflowSnapshot.

* This is critical (ADR-001). Verify it's implemented properly.

**Issue 4**: Performance with many nodes.

* Test with 100+ nodes during build. If slow, optimize before "done".

### How long this should take

|Activity|Estimated time|
|-|-|
|Read additional specs|15-20 min|
|Plan proposal|20-30 min|
|Plan review|15 min|
|Build (~13 steps)|120-180 min|
|Verify|30 min|
|Status report|10 min|
|**Total**|**3-4.5 hours**|

This is the longest single prompt. If it takes >5 hours, split it.

### Splitting strategy

If splitting is needed:

**Split A — Canvas + basic editing** (~2 hours)

* Steps 2.1-2.6 (domain, API, canvas, panes, drag-drop, basic forms)
* Output: can create simple workflow

**Split B — Polish + advanced features** (~2 hours)

* Steps 2.7-2.13 (preview states, validation, versioning, snapshot, templates, perf, tests)
* Output: production-ready

### After this step

After PROMPT_3, Process Engineers can build workflows visually. Next step
(PROMPT_4) implements the auto-generation engine that produces setup/teardown
phases automatically based on workflow content.

\---

## 🔄 Change Log

|Version|Date|Changes|
|-|-|-|
|1.0|2026-04-27|Initial v3 prompt (created with CLAUDE.md auto-load pattern)|




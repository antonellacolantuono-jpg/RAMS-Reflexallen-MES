# PROMPT_3c — Workflow Snapshot & Live Preview (skeleton)

> **Status**: 📝 SKELETON — to be detailed after PROMPT_3a, PROMPT_3b are verified, AND a Work Order release flow exists.
> **Predecessor**: PROMPT_3b (advanced forms + versioning UI) + WO release flow (likely part of PROMPT_5).
> **Estimated Claude Code time**: 8-10 hours
> **Last updated**: 2026-04-29

---

## 🎯 Goal (preview)

Close the Workflow Designer with the two most complex pieces:

1. **WorkflowSnapshot** (ADR-001 — workflow immutability for in-flight WOs)
   - Auto-create snapshot when a Work Order is released
   - Snapshot is denormalized (self-contained, no FK to live workflow tree)
   - WO references snapshot, never the live workflow
   - Modifying the live workflow does not affect in-flight WOs

2. **Live Preview** (the 11-state mini HMI emulator)
   - Inside the configurator, a preview pane shows what the operator will see
   - 11 interactive states: PENDING, ACTIVE, ACTIVE_PARALLEL, PAUSED, SUCCESS, FAILED, RECOVERY_DIAGNOSIS, RECOVERY_ATTEMPT_1, RECOVERY_ATTEMPT_2, SCRAP, SKIPPED
   - State selector dropdown
   - UI mirrors actual HMI design (same components, same density)

3. **Performance** (production-ready)
   - Memo on node renders
   - Virtual scroll on palette
   - Lazy load step configurations
   - Target: 100+ nodes render < 1 sec

4. **E2E tests** (Playwright)
   - Complete workflow creation
   - Approval flow
   - WO release creates snapshot
   - In-flight WO unaffected by workflow edits

---

## 🚧 Hard pre-requisite

PROMPT_3c **cannot** start until a **Work Order release flow** exists in the API. As of April 29, this flow is NOT yet built.

The release flow is likely part of PROMPT_5 (Execution HMI), or a separate small prompt before 3c. The flow must:

- Allow a user to create a `WorkOrder` linked to an `Item` and a `Workflow`
- Provide a state transition (e.g. `draft` → `released`) that triggers snapshot creation
- The snapshot creation hook needs to exist in the API for 3c to wire the Workflow Designer side

---

## 📚 Pre-requisites before writing 3c

When PROMPT_3b is done AND the WO release flow exists, fill this section with:

- [ ] PROMPT_3b commit hash
- [ ] WO release flow location (which module, which endpoint, which state machine)
- [ ] Status of `WorkflowSnapshot` Prisma model (already exists, but verify field set is sufficient)
- [ ] HMI primitives that need to be reusable inside the live preview — list them

---

## 🛠 Deliverables (high-level outline)

### D1 — WorkflowSnapshot service
Hook into WO state transition. Copy entire workflow tree to snapshot. Make snapshot immutable at DB level (no UPDATE allowed).

### D2 — In-flight WO uses snapshot
Update WO services to read from snapshot, not live workflow. Verify with integration tests.

### D3 — Live preview component
Mini HMI emulator inside configurator. Renders all 11 states. State selector.

### D4 — Performance optimization
Memo, virtual scroll, lazy load. Benchmark with 100+ nodes.

### D5 — E2E tests
Playwright suite covering the 4 critical flows.

### D6 — STATUS.md + TODO.md updated

---

## 🧪 Definition of Done

Will use the same DOD_TEMPLATE as 3a/3b, with E2E performance benchmarks added.

---

## ⏭️ When to start writing this prompt in detail

After:
1. PROMPT_3b is verified done (full Workflow Designer except snapshot/preview)
2. A Work Order release flow exists (may be a prerequisite mini-PROMPT_4.5 or part of PROMPT_5)
3. The user explicitly decides to tackle this — PROMPT_3c is large enough to deserve its own dedicated session.

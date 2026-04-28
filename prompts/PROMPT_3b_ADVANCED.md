# PROMPT_3b — Workflow Designer Advanced (skeleton)

> **Status**: 📝 SKELETON — to be detailed after PROMPT_3a is verified done
> **Predecessor**: PROMPT_3a (canvas + 4-pane + 3 forms + CRUD)
> **Successor**: PROMPT_3c (snapshot + live preview)
> **Estimated Claude Code time**: 6-8 hours
> **Last updated**: 2026-04-29

---

## 🎯 Goal (preview)

Take the Workflow Designer Core (3a) and extend it to a full-featured designer with:

- The remaining 5 step category forms (LOGISTICS, SETUP, TEARDOWN, PARALLEL, RECOVERY)
- Validation panel with cross-step rules
- Versioning UI (draft / approved / effective lifecycle with approval modals)
- "New from Template" wizard with Pneumatic Air seed
- Right-click context menu, keyboard shortcuts, undo/redo on canvas
- Reorder by dragging within canvas

**NOT** in 3b scope:
- WorkflowSnapshot (3c)
- Live preview of step in 11 states (3c)
- CFRP and Safety Devices templates (TODO-005, TODO-006)
- Performance tuning (3c)

---

## 📚 Pre-requisites before writing 3b

When PROMPT_3a is verified done, fill this section with:

- [ ] State of `main` after 3a (commit hash)
- [ ] List of files added in 3a (use as scaffolding for 3b)
- [ ] Lessons learned from 3a (what went well, what to avoid)
- [ ] Any TODO items uncovered during 3a that should be tackled in 3b vs deferred

---

## 🛠 Deliverables (high-level outline)

### D1 — Complete the 8 step category forms
Add: LogisticsStepForm, SetupStepForm, TeardownStepForm, ParallelStepForm, RecoveryStepForm.

### D2 — Validation panel (cross-step)
Inline error badges on canvas + sidebar panel with click-to-jump.

### D3 — Versioning UI
Approve / Reject / Publish modals. Version history sidebar. Status indicators.

### D4 — Templates wizard
"New from Template" flow with Pneumatic Air template (3 templates: extrusion, crimping, leak test).

### D5 — Canvas interaction polish
Right-click menu, Del / Ctrl+D / Ctrl+Z / Ctrl+Shift+Z shortcuts, drag-to-reorder.

### D6 — STATUS.md + TODO.md updated

---

## 🧪 Definition of Done

Will use the same DOD_TEMPLATE as 3a, with adapted commands.

---

## ⏭️ When to start writing this prompt in detail

After PROMPT_3a's Phase 3 (DoD) is verified by the user. The exact deliverables of 3b depend on what 3a actually produced.

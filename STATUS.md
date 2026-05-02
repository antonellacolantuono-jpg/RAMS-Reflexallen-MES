# RAMS-Reflexallen-MES — Project Status

> **Last update**: May 1, 2026, very late evening (PROMPT_3b_FULL Session A merged)
> **Repository**: https://github.com/antonellacolantuono-jpg/RAMS-Reflexallen-MES
> **Stack**: NestJS + Next.js 14 + Prisma SQLite + pnpm Turborepo + shadcn-style + Reflexallen design system

---

## 📜 Project history (timeline)

- **April 27** — PROMPT_1 Foundation drafted
- **April 28** — PROMPT_2 Registries audited + recovered. PROMPT_3a D1-D3 merged
- **April 29** — PC migration. PROMPT_3a D4-D6 merged. PROMPT_3a complete
- **April 30 morning** — PROMPT_3b_REDUCED merged
- **April 30 afternoon** — PROMPT_5_LITE merged. `finalize-prompt.ps1` added
- **April 30 evening** — PROMPT_5_FULL D1+D2 merged
- **April 30 late evening** — PROMPT_5_FULL D3 merged
- **May 1 morning** — PROMPT_5_FULL D4 merged
- **May 1 afternoon** — PROMPT_5_FULL D5 merged
- **May 1 evening** — PROMPT_5_FULL D6 merged. PROMPT_5_FULL 100% complete
- **May 1 late evening** — PROMPT_4 merged (45 min execution time)
- **May 1 very late evening** — **PROMPT_3b_FULL Session A merged** (3 step forms + Phase/Group configurators + canvas badges)

---

## ✅ Current state (verified May 1 very late evening — Session A merged)

### Completed PROMPTs (6/8 at 100%, +1 partial)
- PROMPT_1, 2, 3a, 5_LITE — all 100%
- PROMPT_3b_REDUCED — 100%
- PROMPT_5_FULL (D1-D6) — 100%
- PROMPT_4 (AutoGenEngine + 7 resolvers) — 100%
- **PROMPT_3b_FULL Session A** — 50% of PROMPT_3b_FULL done (Session B remaining)

### PROMPT_3b_FULL Session A — 9/9 step categories + canvas badges (NEW May 1 very late evening)

**Plan reinterpretation**: original spec assumed PARALLEL was a missing StepCategory. Actually PARALLEL is a `StepDeviceCategory` flag (sub-flag for parallel-ops on Step.deviceCategory, added in PROMPT_5 D4). The truly missing step categories are DECISION, INFORMATION, TEARDOWN. Session A delivers full 9/9 step coverage.

**Forms shipped (3 new, mirror SetupStepForm pattern)**:
- ✅ `apps/web/src/components/workflow/forms/DecisionStepForm.tsx` (155 lines) — fields: name, instructions, decisionType (auto_branch | manual_choice | condition_check), causeCodeId
- ✅ `apps/web/src/components/workflow/forms/InformationStepForm.tsx` (138 lines) — fields: name, instructions, informationType (read_sop | safety_briefing | view_video | view_drawing), attachmentUrl
- ✅ `apps/web/src/components/workflow/forms/TeardownStepForm.tsx` (151 lines) — fields: name, instructions, teardownType (cleanup | unload_recipe | last_piece), toolId

**Production form extension**:
- ✅ `apps/web/src/components/workflow/forms/ProductionStepForm.tsx` — added `deviceCategory` selector (4 enum: pre | device_main | parallel | post). Closes parallel-ops data loop with PROMPT_5 D4 swimlane rendering.

**Phase + Group configurators (new)**:
- ✅ `PhaseConfigurator.tsx` (116 lines) — fields: name, category (6 PhaseCategory), isCycleBased
- ✅ `GroupConfigurator.tsx` (140 lines) — fields: name, category (9 GroupCategory), supportsParallel, supportsRecovery

**Validation badges on canvas nodes**:
- ✅ Refactored `ValidationPanel.tsx` to share validation logic via new `useWorkflowValidation()` hook
- ✅ `validation-context.tsx` provides errorNodeIds Set across canvas + sidebar
- ✅ `useWorkflowValidation.ts` (97 lines) extracts buildValidationStructure
- ✅ `nodes/NodeErrorBadge.tsx` — red ▲ badge with native title tooltip (no new dep)
- ✅ Wired into StepNode, PhaseNode, GroupNode

**Domain rule helpers (new pure functions, +12 tests)**:
- ✅ `extractErrorNodeIds(errors)` — derives Set<string> of node IDs with errors
- ✅ `groupErrorsByNodeId(errors)` — groups validation errors by node for tooltip display

**Opportunistic fixes**:
- ✅ `WorkflowCanvas.buildSavePayload` — now reads `isCycleBased`, `supportsParallel`, `supportsRecovery` from node.data (was hardcoded `false`)
- ✅ `WorkflowPalette.STEP_ITEMS` extended with decision, information, teardown
- ✅ `WorkflowCanvas.DEFAULT_ACTION_TYPE` extended for decision (manual_choice), information (read_sop), teardown (cleanup)

**Verification (May 1 very late evening)**:
- ✅ `pnpm install`: clean
- ✅ `pnpm build`: 12/12 successful, 0 errors (33s)
- ✅ `pnpm lint`: 3/3 clean (only pre-existing img warnings)
- ✅ `pnpm test`: **443 tests passed across 40 files** (was 431, +12 domain tests). Below ≥460 target — gap honest: apps/web has no test runner, 5 React forms + 2 configurators + context hook can't be unit-tested in this session.
- ✅ `pnpm dev`: 3 apps boot, /api/health 200, web 200, hmi 200, /workflows 200

**Test breakdown delta (vs PROMPT_4 baseline 431)**:
| Package | Pre | Post | Delta |
|---|---|---|---|
| `@mes/api` | 219 | 219 | 0 |
| `@mes/domain` | 164 | 176 | **+12** |
| `@mes/schemas` | 29 | 29 | 0 |
| Other | 19 | 19 | 0 |
| **Total** | **431** | **443** | **+12** |

---

## 🟡 Known issues (TODO list)

20 entries currently tracked. Session A closed TODO-008, TODO-013, TODO-014.

**HIGH severity (open)**:
- TODO-010 — Versioning UI (Session B — Option A: 2 modals on existing 3-state machine)
- TODO-017 — Refresh token rotation (D1+D2 partial)

**MEDIUM severity (open)**:
- TODO-001..007, 009, 015, 016 (registry/cosmetic/scope-deferred items)
- TODO-011 — Templates wizard (Session B)
- TODO-012 — Canvas polish: right-click + keyboard shortcuts (Session B)
- TODO-024 — Change-of-shift / hand-off flow (post-MVP)
- TODO-026 — Per-stage StepExecution model deferral
- TODO-027 — PROMPT_4_PHASE_2: wire AutoGenEngine to entity creation flows (post-MVP)
- TODO-028 — Pointer to archived workflow-step rules spec (potential PROMPT_4b)

**LOW severity**:
- TODO-025 — HMI logo cross-reference

**Closed by Session A**:
- TODO-008 — ✅ closed (reinterpreted as DECISION+INFORMATION+TEARDOWN forms + deviceCategory selector for parallel-ops data side)
- TODO-013 — ✅ closed (inline canvas badges via shared validation context)
- TODO-014 — ✅ closed (Phase + Group configurator forms shipped)

**To create in Session B**:
- TODO-029 — Canvas drag-to-reorder steps within group (dropped from PROMPT_3b_FULL scope, low priority)
- Session B will also correct TODO-010 wording (the original mentioned 5-state lifecycle which doesn't exist — actual schema is 3-state draft → approved → deprecated)

---

## 🚀 Roadmap — re-baselined May 1 very late evening

| Phase | Scope | Status | Time estimate |
|---|---|---|---|
| PROMPT_1 | Foundation | ✅ Done | — |
| PROMPT_2 | 13 Registries | ✅ Done | — |
| PROMPT_3a | Workflow Designer Core | ✅ Done | — |
| PROMPT_3b_REDUCED | Advanced (3 forms + Validation) | ✅ Done | — |
| PROMPT_5_LITE | HMI Execution (mock) | ✅ Done | — |
| PROMPT_5_FULL | Production-grade HMI (D1-D6) | ✅ Done | — |
| PROMPT_4 | Auto-Generation Engine | ✅ Done | — |
| **PROMPT_3b_FULL Session A** | **3 forms + configurators + badges** | **✅ Done (May 1)** | — |
| PROMPT_3b_FULL Session B | Versioning UI + templates wizard + canvas polish | ⏭️ Next | 4-5h |
| PROMPT_6 | Dashboard & Reporting (handoff Claude Design) | ⏭️ Planned | 5-7h |
| PROMPT_3c | WorkflowSnapshot live preview + perf + E2E | ⏭️ Planned | 8-10h |

**Realistic MVP target**: 8-12 May. Session B + PROMPT_6 + PROMPT_3c = ~17-22h Claude Code residue.

---

## 📋 Conventions (unchanged)

### Technical
- Stack: pnpm workspaces + Turborepo, React 18, Next.js 14, NestJS 10, TypeScript strict
- DB: SQLite local
- Auth: ✅ Argon2id implemented for PIN. JWT in HttpOnly cookie
- State machines: XState v5 — 6 machines
- Validation: Zod (FE+BE shared via `@mes/schemas`)
- Real-time: Socket.IO (server emit + HMI listener)
- Workflow Designer: `@xyflow/react` + `@dagrejs/dagre` + Zustand + react-hook-form + Zod. **9/9 step categories** + Phase/Group configurators + inline validation badges (Session A)
- HMI: Zustand + `@tanstack/react-query` + `@xstate/react` + `socket.io-client`
- RBAC: skill-based via `OperatorSkill` join (QC, MANAGER)
- Code generation: AutoGenEngine pattern with 7 resolvers

### Compliance
- IATF 16949 → audit log 15+ years
- GDPR → operator data minimization
- ECE-R104 (Safety Devices)
- 21 CFR Part 11 → electronic signatures
- PIN auth: Argon2id — OWASP 2024 compliant
- WorkflowSnapshot immutability: ADR-001

---

## ⚠️ Lessons learned (consolidated, +6 from Session A)

### Original (April 28-29) — 12 lessons
### April 30 (D1-D5) — 24 lessons
### May 1 (D6 + PROMPT_4) — 12 lessons

### Session A — 6 new

49. **PARALLEL is a deviceCategory flag, not a StepCategory**: original kickoff confused these. Discovery during PHASE 1 reading saved hours of dead-end work. Lesson: always cross-check enum semantics against the actual schema/types files before coding.

50. **Test gap honesty**: target was ≥460 tests, achieved 443. Apps/web has no vitest runner — React forms can't be unit-tested in this session. Better to be honest than gonfiare with low-value tests. Lesson: when target unreachable for environmental reasons, document and explain rather than padding.

51. **WorkflowValidationProvider context pattern**: shared validation state between canvas (badges) and sidebar (ValidationPanel) via React Context. Avoids store mutation, no duplication, single source of truth. Reusable for future cross-component derived state.

52. **buildSavePayload opportunistic fix**: while extending payload for new step types, noticed isCycleBased/supportsParallel/supportsRecovery were hardcoded `false` (legacy). Read from node.data instead. Phase/Group configurators now actually persist their toggles. Pattern: when touching serialization code, audit other related fields for hidden hardcoded defaults.

53. **Worktree .env quirk for apps/api dev smoke**: NestConfigModule resolves envFilePath relative to package cwd, not project root. Worktree needs .env copies in root, packages/prisma, AND apps/api. Operational note for future Session B and beyond — relevant for dev smoke but not for build/test/lint gates.

54. **Vitest 2.1.x parallel runner Windows flake**: `pnpm test` sometimes hits temp-file races (UNKNOWN error opening AppData\Local\Temp\…). Workaround: run with `--concurrency=1` or per-package serial. Test results are correct in both modes — only the parallel runner has the race. Worth noting for CI considerations.

---

## 🗂️ Repo structure (post Session A)

```
apps/web/src/components/workflow/
├── forms/
│   ├── ProductionStepForm.tsx       (extended with deviceCategory)
│   ├── QualityControlStepForm.tsx
│   ├── ScanStepForm.tsx (IDENTIFICATION)
│   ├── LogisticsStepForm.tsx
│   ├── SetupStepForm.tsx
│   ├── RecoveryStepForm.tsx
│   ├── DecisionStepForm.tsx         ← NEW Session A
│   ├── InformationStepForm.tsx      ← NEW Session A
│   ├── TeardownStepForm.tsx         ← NEW Session A
│   ├── PhaseConfigurator.tsx        ← NEW Session A
│   ├── GroupConfigurator.tsx        ← NEW Session A
│   └── StepConfigurator.tsx         (router for 9 step + 2 node types)
├── nodes/
│   ├── StepNode.tsx                 (with NodeErrorBadge)
│   ├── PhaseNode.tsx                (with NodeErrorBadge)
│   ├── GroupNode.tsx                (with NodeErrorBadge)
│   └── NodeErrorBadge.tsx           ← NEW Session A
├── validation-context.tsx           ← NEW Session A
├── useWorkflowValidation.ts         ← NEW Session A
├── ValidationPanel.tsx              (refactored to use shared hook)
├── WorkflowCanvas.tsx               (palette extended, save payload fixed)
├── WorkflowPalette.tsx              (3 new step items)
└── store.ts
```

9/9 step categories covered. Phase + Group configurators wired. Inline badges on every node type.

---

## 🎯 Next concrete action

**PROMPT_3b_FULL Session B** (~4-5h) — completes PROMPT_3b_FULL.

Scope:
- 2.5 Versioning UI Option A: 2 modals (Approve, Deprecate) on existing 3-state machine + sidebar history
- 2.6 Templates wizard: seed 3 Pneumatic Air templates as Workflows with code prefix `TPL_PNEU_*` + filter wizard on prefix
- 2.7 Canvas polish: right-click context menu (delete/duplicate/disable), keyboard shortcuts (Del, Ctrl+D, Ctrl+Z, Ctrl+Shift+Z) — drag-to-reorder dropped to TODO-029
- 2.8 Final DoD + atomic commit

After Session B, PROMPT_3b_FULL is 100% complete and 7/8 PROMPT done.

---

## 📊 Progress dashboard

```
PROMPT_1   ████████████ 100% Foundation
PROMPT_2   ████████████ 100% Registries
PROMPT_3a  ████████████ 100% Workflow Core
PROMPT_3b  ██████████░░  80% (REDUCED + Session A done; Session B 4-5h)
PROMPT_4   ████████████ 100% Auto-gen
PROMPT_5   ████████████ 100% Production-grade HMI
PROMPT_3c  ░░░░░░░░░░░░   0% (unblocked)
PROMPT_6   ░░░░░░░░░░░░   0% (handoff Claude Design ready)
─────────────────────────────────────
~78% MVP done | Tests 443 (+249% from baseline 127) | Build 12/12 | TODOs 20 | 6.5/8 PROMPT done
```

**MVP target 8-12 May confirmed realistic.**


## Smoke verifications

- 2026-05-02 13:30: smoke /items canary verified by user (Antonella). 6 type tabs visible (Tutti/PF/Semi/MP/Comp/Cons), layout correct, search/sort/multi-select rendering OK. /operators and /equipment legacy paths render correctly without tabs (backward-compat preserved). PROMPT_DS_LIFT D3 confirmed runtime-stable on Windows + Chrome.


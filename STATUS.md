# RAMS-Reflexallen-MES — Project Status

> **Last update**: April 30, 2026, late afternoon (PROMPT_3b_REDUCED + PROMPT_5_LITE merged)
> **Repository**: https://github.com/antonellacolantuono-jpg/RAMS-Reflexallen-MES
> **Stack**: NestJS + Next.js 14 + Prisma SQLite + pnpm Turborepo + shadcn-style + Reflexallen design system

---

## 📜 Project history (timeline)

- **April 27** — PROMPT_1 (Foundation) drafted and partially executed
- **April 28 morning** — Audit revealed PROMPT_2 was reported done but never committed; recovered from worktree, merged
- **April 28 afternoon** — Started PROMPT_3a (Workflow Designer Core); D1, D2, D3 merged
- **April 29 morning** — PC migration (new corporate laptop). Repo re-cloned, dev environment rebuilt from scratch. D4, D5 merged
- **April 29 evening** — D6 merged. **PROMPT_3a complete**, DOD_TEMPLATE v1.1 published
- **April 30 morning** — PROMPT_3b_REDUCED merged (3 step forms + ValidationPanel + 8 TODOs)
- **April 30 afternoon** — PROMPT_5_LITE merged (HMI login + dashboard + WO execution + done + 9 TODOs). `finalize-prompt.ps1` automation script added.

---

## ✅ Current state (verified April 30 evening)

### PROMPT_1 — Foundation
- Monorepo: pnpm workspaces + Turborepo, 14 packages
- Apps boot: api (3000), web (3001), hmi (3002)
- 4 XState v5 machines (Box, Equipment, WorkOrder, Workflow)
- 63 Prisma models + AuditLog + DomainEvent
- Reflexallen design system (tokens, fonts Avenir, primitives)

### PROMPT_2 — 13 Registries CRUD
- 13 NestJS modules with full CRUD + soft-delete + audit + restore
- 18 web admin routes under `(registries)` group
- HMI login mockup
- Seed `MOCK_DATA_PNEUMATIC_AIR` loaded

### PROMPT_3a — Workflow Designer Core (D1-D6)
- Workflow XState machine + rules + 38 tests
- Workflow API: 12 endpoints, version sub-resources, audit
- Web pages: list + new + 4-pane editor with `react-resizable-panels`
- xyflow canvas + dagre layout + Zustand store + 3 custom node types
- Drag-drop palette + 30s debounced auto-save
- 3 step configurator forms (PRODUCTION, QUALITY_CONTROL, IDENTIFICATION/SCAN) with react-hook-form + Zod

### PROMPT_3b_REDUCED — Workflow Designer Advanced
- 3 additional step forms (LOGISTICS, SETUP, RECOVERY) — coverage 6/8 categories
- StepCategory.RECOVERY added (TS-only enum, no Prisma change)
- Action types mapped to existing values (move, verify_material, load_recipe, rework)
- ValidationPanel sidebar with clickable errors → scrollToNode animation
- @mes/domain added as direct dep of apps/web (workspace hygiene)
- 8 TODOs added (TODO-008, 010..016) for PROMPT_3b_FULL

### PROMPT_5_LITE — HMI Execution
- PIN keypad login (4 mock operators aligned to seed: Marco Rossi, Laura Ferrari, Giovanni Bianchi, Sara Conti)
- Operator dashboard with assigned WO list, hydration-safe protected route
- Workflow execution screen: vertical step timeline, OK/NOK actions, NOK modal with textarea
- Done screen with stats grid (time/OK/NOK)
- Zustand operator store + sessionStorage persistence
- 4 routes added: `/`, `/dashboard`, `/wo/[id]`, `/wo/[id]/done`
- 9 TODOs added (TODO-017..025) for PROMPT_5_FULL

### Verification evidence (April 30 evening)

- ✅ `pnpm install`: 640+ packages, no errors
- ✅ `pnpm build` (force): 12 successful / 12 total
- ✅ `pnpm test` (forced fresh): **182 tests passed across 17 files**, 0 failed (baseline preserved across PROMPT_3b_REDUCED + PROMPT_5_LITE)
- ✅ `prisma migrate` + seed: DB populated with all expected counts
- ✅ `pnpm dev`: all 3 apps boot, web admin and HMI render correctly
- ✅ Demo flow navigable end-to-end:
  - **Manager** → `localhost:3001/workflows/<id>` → 4-pane workflow designer with 6/8 categories + ValidationPanel
  - **Operator** → `localhost:3002` → login OP-001/1234 → dashboard → execute WO → done

### Test breakdown (April 30, after PROMPT_5_LITE)

| Package | Test files | Tests passed |
|---|---|---|
| `@mes/api` | 6 | 67 |
| `@mes/domain` | 5 | 67 |
| `@mes/schemas` | 3 | 29 |
| `@mes/cache` | 1 | 8 |
| `@mes/storage` | 1 | 6 |
| `@mes/queue` | 1 | 5 |
| **Total** | **17** | **182** |

PROMPT_3b_REDUCED + PROMPT_5_LITE added no automated tests (LITE scope; tests deferred to FULL versions).

---

## 🟡 Known issues (TODO list)

25 entries currently tracked. See `TODO.md` for full details. Quick summary:

**HIGH severity**:
- TODO-008 — PARALLEL + TEARDOWN step forms (PROMPT_3b_FULL)
- TODO-010 — Versioning UI lifecycle modals (PROMPT_3b_FULL)
- TODO-017 — Real Argon2id PIN auth + JWT cookies (PROMPT_5_FULL)
- TODO-018 — Full 11-state step machine (PROMPT_5_FULL)
- TODO-019 — Parallel ops with Device Execution Group (PROMPT_5_FULL)
- TODO-020 — 4-stage recovery flow (PROMPT_5_FULL)
- TODO-021 — WO release flow (also unblocks PROMPT_3c)

**MEDIUM severity**:
- TODO-001 — Seed creates ~35 soft-deleted records (cosmetic)
- TODO-002 — HMI logo broken (asset path) — re-verify after PROMPT_5_LITE per TODO-025
- TODO-003 — 3 turbo warnings for placeholder packages (cosmetic, expected)
- TODO-004 — Argon2id PIN hashing not exercised at integration level (TODO-017 supersedes)
- TODO-005 — CFRP workflow templates (post-MVP)
- TODO-006 — Safety Devices workflow templates (post-MVP)
- TODO-007 — qcThresholds and scanExpectedPattern session-only persistence
- TODO-009 — `/workflows/new` Salva button silently fails
- TODO-011 — Templates wizard (PROMPT_3b_FULL)
- TODO-012 — Canvas polish: right-click, keyboard shortcuts, drag-to-reorder (PROMPT_3b_FULL)
- TODO-013 — Inline validation badges on canvas nodes (PROMPT_3b_FULL)
- TODO-014 — Phase and Group configurator forms (PROMPT_3b_FULL)
- TODO-015 — Recovery flow simplification (PROMPT_3b_FULL)
- TODO-016 — Consolidated session-only fields gap (logisticsType, setupType, recoveryStage, boxTypeId, causeCodeId, targetLocation)
- TODO-022 — StepExecution real persistence (PROMPT_5_FULL)
- TODO-023 — Socket.IO real-time updates (PROMPT_5_FULL)
- TODO-024 — Change-of-shift / hand-off flow

**LOW severity**:
- TODO-025 — HMI logo cross-reference to TODO-002 (re-verify after PROMPT_5_LITE)

---

## 🚀 Roadmap — re-baselined April 30 evening

| Phase | Scope | Status | Time estimate |
|---|---|---|---|
| PROMPT_1 | Foundation | ✅ Done | — |
| PROMPT_2 | 13 Registries | ✅ Done | — |
| PROMPT_3a | Workflow Designer Core | ✅ Done | — |
| **PROMPT_3b_REDUCED** | **Advanced (3 forms + Validation)** | **✅ Done (April 30)** | — |
| **PROMPT_5_LITE** | **HMI Execution (login + WO + done)** | **✅ Done (April 30)** | — |
| PROMPT_4 | Auto-Generation Engine (7 rules) | ⏭️ Next | 3-4h |
| PROMPT_3b_FULL | PARALLEL/TEARDOWN forms + versioning UI + templates + canvas polish + badges | ⏭️ Planned | 6-8h |
| PROMPT_5_FULL | Real Argon2 + 11-state + parallel ops + recovery + WO release + persistence | ⏭️ Planned | 8-10h |
| PROMPT_3c | WorkflowSnapshot + Live Preview 11 states + performance + E2E | ⏭️ Planned (after PROMPT_5_FULL) | 8-10h |
| PROMPT_6 | Dashboard & Reporting (OEE, Andon, KPI, export) | ⏭️ Planned | 3-4h |

**Realistic MVP target**: end of week 2 (May 9-10). Every PROMPT uses DOD_TEMPLATE.md v1.1 with build + runtime smoke gates. From PROMPT_4 onward, `scripts/finalize-prompt.ps1` automates merge + cleanup.

---

## 📋 Conventions (unchanged)

### Technical

- **Stack**: pnpm workspaces + Turborepo, React 18, Next.js 14, NestJS 10, TypeScript strict
- **DB**: SQLite local (NOT PostgreSQL), in-memory cache, sync queue, local filesystem
- **Auth**: Argon2id for PIN/password, **NEVER bcrypt**
- **State machines**: XState v5 (or `useReducer` for simple cases — see PROMPT_5_LITE D3)
- **Validation**: Zod (FE+BE shared schemas)
- **Real-time**: Socket.IO (event gateway)
- **Workflow Designer**: `@xyflow/react` + `@dagrejs/dagre` + Zustand + react-hook-form + Zod
- **HMI**: `@xyflow/react` not used (no canvas), Zustand + sessionStorage for operator state, `useReducer` for execution state

### Compliance

- IATF 16949 → audit log 15+ years, lot genealogy bidirectional
- GDPR → operator data minimization, soft delete only
- ECE-R104 (Safety Devices) → reflectance thresholds, homologation cert validity
- 21 CFR Part 11 → electronic signatures (planned for PROMPT_5_FULL)

### Tone & format (for Claude)

- Direct and pragmatic, no long preambles
- Explicit recommendations, not just option lists
- Stack-aligned (no Material UI, no Bootstrap, no styled-components)
- Italian for explanations, English for code and comments
- For manufacturing compliance, flag relevant requirements

---

## ⚠️ Lessons learned (consolidated)

### Original (from April 28-29)
1. Trust the filesystem, not the agent's narrative.
2. No PROMPT is "done" without DoD compliance.
3. Worktrees must be inspected before each session.
4. Server processes outlive sessions.
5. `.env` is project-local secret (root + `packages/prisma/`).
6. `pnpm test` is not enough — `tsc` and `ts-node` are stricter.
7. `prisma generate` is per-worktree.
8. Internal workspace imports must NOT use `.js` extensions.
9. Workspace package consumers depend on built `dist/`.
10. Windows PATH is fragile (Group Policy / IT may reset).
11. corepack 5.x has signature verification bugs (use `npm install -g pnpm`).
12. Pre-flight check at every session start (5 commands).

### New (from April 30)
13. **Plan-mode in Claude Code Desktop blocks `git push`** — this is by design, but be aware that you'll need to push manually from your shell when the session is in plan-mode and ExitPlanMode hasn't been triggered. Use `git push origin <local-branch>:<remote-branch>` from main worktree.
14. **Worktree files locked by Claude Code Desktop**: rmdir fails with "process cannot access" until Claude Code is fully closed. Always close Claude Code Desktop before running `cmd /c "rmdir /s /q .claude\worktrees\..."`.
15. **`useReducer` vs XState**: for simple state machines (≤4 states × ≤6 events), `useReducer` is preferred for clarity. XState is overkill at that scale (PROMPT_5_LITE D3 lesson).
16. **Hydration-safe protected routes**: when reading from `sessionStorage` in Next.js 14, use `useState + useEffect` pattern to avoid SSR mismatch (PROMPT_5_LITE D2).
17. **Reuse existing primitives**: PROMPT_5_LITE D1 reused `apps/hmi/src/components/PinKeypad.tsx` from PROMPT_2 unchanged. Always check what exists before creating.
18. **TS strict regression catch**: PROMPT_5_LITE D3 caught a `exactOptionalPropertyTypes` violation in `StepCard.blockedNote` during build. The DoD-mandated `pnpm build` gate prevented it from reaching main.

---

## 🗂️ Repo structure (verified post-PROMPT_5_LITE)

```
RAMS-Reflexallen-MES/
├── apps/
│   ├── api/          ✅ 13 registry modules + audit-log + events + workflows
│   ├── web/          ✅ 21 routes (registries + workflow editor + new + trash + home)
│   │                 ✅ 4-pane editor with palette + canvas + 6/8 step forms + ValidationPanel
│   └── hmi/          ✅ 4 routes (/, /dashboard, /wo/[id], /wo/[id]/done)
│                     ✅ Mock auth + WO list + execution timeline + done screen
├── packages/
│   ├── domain/       ✅ 4 XState machines + rules + 67 tests
│   ├── prisma/       ✅ 63 models, dev.db seeded
│   ├── schemas/      ✅ 13 registry schemas + workflow schema
│   ├── sdk/          ✅ base-registry client + 13 registry clients + workflows client
│   ├── types/        ✅ 11 enum files (StepCategory now includes RECOVERY)
│   ├── ui/           ✅ 16 base + 8 Tier-2 primitives
│   ├── cache/        ✅ in-memory placeholder + 8 tests + echo no-op build
│   ├── queue/        ✅ sync placeholder + 5 tests + echo no-op build
│   └── storage/      ✅ local fs placeholder + 6 tests + echo no-op build
├── design-system/    (Reflexallen handoff bundle, brand SVGs, fonts)
├── docs/             (specs + extensions)
├── prompts/          (PROMPT_1, PROMPT_2, PROMPT_3a, PROMPT_3b_REDUCED, PROMPT_5_LITE, PROMPT_4, PROMPT_3c, PROMPT_6, DOD_TEMPLATE v1.1, archive)
└── scripts/          ✅ finalize-prompt.ps1 (automate merge + cleanup + tests)
```

---

## 🎯 Next concrete action

**PROMPT_4 (Auto-Generation Engine)** — to be detailed and launched in next session.

Scope outline:
- 7 generation rules: BOM check on Setup, sample on Production start, calibration interval check, tool wear projection, attention point auto-resolve, batch QC sample, end-of-shift cleanup
- AutoGenRulesService logic (already has stub from PROMPT_2)
- Triggers: workflow snapshot creation, WO release (this is in PROMPT_5_FULL)
- UI: rules list + edit form + dry-run preview

Estimated time: 3-4h Claude Code. Use `scripts/finalize-prompt.ps1` for closure automation.

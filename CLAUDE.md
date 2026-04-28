# CLAUDE.md — Reflexallen MES Project Context

> **This file is auto-loaded by Claude Code at the start of every session.**
> It establishes the project context. You don't need to paste it manually.
>
> **Specifications version**: v1.2
> **Last updated**: 2026-04-29
> **CLAUDE.md version**: 1.2

---

## 🎯 Project overview

You are working on a **Manufacturing Execution System (MES)** built internally for **Reflexallen S.p.A.** (Italian Tier-1 automotive supplier, Modena, Italy).

The MES manages production across 5 production lines:

1. **PNEUMATIC AIR** — Multi-layer pneumatic tubes (PA12 + EVOH co-extrusion) for truck braking systems. Continuous extrusion + crimping + leak testing. **MVP scope.**

2. **CFRP (COMPOSITI)** — Carbon fiber reinforced polymer parts (motorcycle fairings, structural). Long cycles 4-12h, prepreg out-time critical, autoclave cure cycles, NDT testing. **MVP scope.**

3. **SAFETY DEVICES** — ECE-R104 retroreflective panels for trucks. Screen printing + lamination + die-cutting + reflectance/colorimetry/aging tests. Homologation certificate management. **MVP scope.**

4. **FLUID POWER** — Hydraulic and pneumatic subassemblies. **V2 (not in MVP)**.

5. **DIGITAL ELECTRICAL** — Wire harnesses, connectors, sensors. **V2 (not in MVP)**.

This is an **INTERNAL MES** — built for Reflexallen's own use. The system must be generic enough to support all 5 lines but with specific modules for CFRP and Safety Devices in the MVP scope.

---

## ⚙️ Current operating mode — DEV MODE (read this carefully)

**As of April 28-29, 2026, the project is in DEV MODE**: a fully local setup with **no Docker, no external services**. This is intentional — no production deployment yet, all infrastructure is in-process or local-filesystem.

| Concern | Production target | DEV MODE current |
|---|---|---|
| Database | PostgreSQL 16 | **SQLite** (`packages/prisma/dev.db`) |
| Cache | Redis 7 | **In-memory `Map`** (`@mes/cache` placeholder) |
| Queue | BullMQ | **Sync execution** (`@mes/queue` placeholder) |
| Storage | MinIO (S3) | **Local filesystem** (`@mes/storage` placeholder) |
| Containerization | Docker Compose | **None** (run with `pnpm dev`) |

**When writing code in DEV MODE:**
- Use Prisma normally (it abstracts the DB engine)
- Use `@mes/cache`, `@mes/queue`, `@mes/storage` interfaces — the placeholder implementations satisfy them
- Do NOT add Docker, PostgreSQL drivers, Redis clients, BullMQ, MinIO SDK
- The migration to production stack is a separate future workstream — do NOT pre-emptively code for it

When in doubt about whether to use a production-stack feature, default to the DEV MODE equivalent.

---

## 🛠️ Tech stack (NON-NEGOTIABLE)

### Backend
- **Runtime**: Node.js 20+ LTS
- **Framework**: NestJS 10+ (modular monolith with domain-driven design)
- **ORM**: Prisma 5+
- **Database**: SQLite in DEV MODE; PostgreSQL 16 in production
- **Cache/Queue**: in-memory + sync in DEV MODE; Redis 7 + BullMQ in production
- **Real-time**: Socket.IO
- **Storage**: local fs in DEV MODE; MinIO in production
- **Validation**: Zod (shared FE/BE schemas)
- **PIN/Password Hashing**: **Argon2id** (NEVER bcrypt)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + TypeScript 5 strict mode
- **Styling**: Tailwind CSS + shadcn-style primitives in `@mes/ui` (NOT Material UI, NOT Bootstrap, NOT styled-components)
- **State**: TanStack Query (server) + Zustand (client/canvas)
- **State Machines**: XState 5
- **Workflow Designer Canvas**: `@xyflow/react` (modern successor of `reactflow`) + `@dagrejs/dagre`
- **Forms**: react-hook-form + Zod

### DevOps
- **Monorepo**: Turborepo + pnpm workspaces
- **Local dev**: `pnpm dev` (no Docker)
- **Testing**: Vitest (unit + integration); Playwright (E2E, only when explicitly requested)

---

## 📂 Documentation map (read these as needed)

The repository contains comprehensive documentation organized in tiers. Read on-demand based on what you're working on.

### TIER 0 — Project meta + state (read at the start of every session)

```
README.md
  - Project overview, structure, getting started

CHANGELOG.md
  - History of all changes (specifications, prompts, code)

STATUS.md                   ⬅️ ALWAYS READ THIS FIRST
  - The current state of the repo (what is done, what is pending, what is broken)
  - Verification evidence with literal command outputs
  - Re-baselined roadmap

TODO.md                     ⬅️ ALWAYS READ THIS BEFORE PROPOSING CHANGES
  - Known issues with severity, file location, acceptance criterion
  - DO NOT silently fix items here unless they block the current task
  - When fixing, move entry to "Resolved" section with commit hash

prompts/DOD_TEMPLATE.md     ⬅️ THE LAW for declaring any work "done"
  - Universal Definition of Done checklist
  - Every claim must be paired with literal command output
  - No paraphrasing, no "looks good"

docs/VERSIONING.md
  - Versioning rules (3 dimensions: specs, prompts, code)
  - When and how to bump versions
  - Conventional commits guide
```

### TIER 1 — Core Specifications (read FIRST in every build session)

```
docs/MASTER_SPECIFICATION.md  (3230 lines)
  - Domain entities, taxonomies, state machines, business rules
  - 56+ enums, 27 ADRs (Architecture Decision Records)
  - Sections 1-7: foundation (always read at start)
  - Sections 8-22: deeper features (read on demand)

docs/BEST_PRACTICES.md  (5241 lines)
  - Code patterns for every feature
  - Service patterns, repository patterns, validation patterns
  - 9 anti-patterns to avoid
  - Sections 1-3: foundation patterns (always read)
  - Other sections: feature-specific patterns (read on demand)

docs/CONVENTIONS.md  (1392 lines)
  - Quick reference: naming, folders, imports, commits
  - Per-module conventions
  - READ FULLY at start, REFER BACK during work

docs/TESTING_STRATEGY.md
  - Pyramid (~70/25/5 unit/integration/E2E)
  - What to test where, mocking strategy, coverage targets
  - Anti-patterns (brittle E2E, over-mocking, flaky tests)

docs/design-tokens.md
  - Design tokens from Claude Design (colors, typography, spacing)
  - Apply these to tailwind.config.ts
```

### TIER 2 — Modular Extensions (read when working on specific features)

```
docs/extensions/EQUIPMENT_MANAGEMENT.md
  - Equipment State Machine (XState formal)
  - MaintenanceOrder lifecycle
  - Tool Wear tracking

docs/extensions/SCHEDULING_ASSIGNMENT.md
  - WorkOrderAssignment (5 statuses)
  - Skills coverage validation
  - Shift management

docs/extensions/INDUSTRIAL_OPERATIONS.md
  - Multi-output cycles, Continuous production
  - Sample taking, FAI (PPAP)
  - WIP containers, Subassembly nested BOM
  - Quality Hold/Release

docs/extensions/CFRP_MODULE.md
  - Mold cycles, Prepreg out-time tracking
  - Cure cycle long-running jobs
  - NDT integration

docs/extensions/SAFETY_DEVICES_MODULE.md
  - Reflectance ECE-R104 thresholds
  - Homologation certificate management
  - Aging tests (long-running, weeks)
```

### TIER 3 — Workflow References (read for domain understanding)

```
docs/extensions/WORKFLOW_PNEUMATIC_AIR.md             (high-level)
docs/extensions/WORKFLOW_PNEUMATIC_AIR_DETAILED.md    (step-by-step + branching)
docs/extensions/WORKFLOW_CFRP.md                       (high-level)
docs/extensions/WORKFLOW_CFRP_DETAILED.md              (step-by-step)
docs/extensions/WORKFLOW_SAFETY_DEVICES.md             (high-level)
docs/extensions/WORKFLOW_SAFETY_DEVICES_DETAILED.md    (step-by-step)
docs/extensions/WORKFLOW_FLUID_POWER.md                (V2, INVENTED with disclaimer)
docs/extensions/WORKFLOW_DIGITAL_ELECTRICAL.md         (V2, INVENTED with disclaimer)
```

### TIER 4 — Inventory & Mock Data

```
docs/extensions/FUNCTIONAL_INVENTORY.md
  - 227 features classified across 20 categories
  - 175 in MVP, 52 in V2
  - YOUR MAP for what to build vs defer

docs/extensions/MOCK_DATA_PNEUMATIC_AIR.md
  - 120+ concrete entities ready for seed
  - Use for demo/test data
```

---

## 🏗️ Monorepo structure (current state — verified April 28)

```
RAMS-Reflexallen-MES/
├── CLAUDE.md                      ← This file (auto-loaded)
├── STATUS.md                      ← Current ground truth
├── TODO.md                        ← Known issues
├── apps/
│   ├── api/                       NestJS backend (13 registry modules done)
│   ├── web/                       Next.js admin (18 routes done)
│   └── hmi/                       Next.js shop floor (login mockup done)
│
├── packages/
│   ├── prisma/                    Prisma schema (63 models) + migrations + seed
│   ├── types/                     11 enum files
│   ├── schemas/                   Zod schemas (registries + legacy)
│   ├── ui/                        16 base + 8 Tier-2 primitives + Reflexallen tokens
│   ├── sdk/                       Typed API client + 13 registry clients
│   ├── domain/                    XState machines + pure rules
│   ├── cache/                     in-memory placeholder (DEV MODE)
│   ├── queue/                     sync placeholder (DEV MODE)
│   └── storage/                   local fs placeholder (DEV MODE)
│
├── docs/                          Specifications (tiers 1-4)
├── design-system/                 Reflexallen handoff bundle (brand SVGs, fonts)
├── prompts/                       Build task prompts + DOD_TEMPLATE
│   └── archive/                   Obsolete prompts kept for reference
├── scripts/                       Automation
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## 🧠 Key architectural decisions (selection)

These are critical decisions you must respect. Full list in MASTER_SPECIFICATION.md.

**ADR-001 — WorkflowSnapshot Immutability**
Workflows are versioned. When a Work Order is RELEASED, the workflow is copied into an immutable WorkflowSnapshot. Any later edits to the original Workflow create a new version, but in-flight WOs use their snapshot. **CRITICAL: do not mutate workflows in use.**

**ADR-008 — Universal Taxonomies**
All workflow elements are typed with universal taxonomies: 6 Phase categories, 9 Group categories (MVP), 8 Step categories, ~40 step action types. This is what makes the MES "generic but powerful".

**ADR-014 — Audit Trail (Soft Delete + Audit Log)**
No data is ever hard-deleted. All changes are tracked in audit logs. Retention: 15+ years for automotive compliance (IATF 16949).

**ADR-018 — Equipment State Machine (XState)**
Equipment lifecycle is a formal XState machine with 8 states: available → reserved → in_use → cleaning/maintenance/broken → ...

**ADR-020 — Continuous Production Mode**
Some operations are continuous (extrusion runs for hours producing pieces). These use ContinuousProductionRun with telemetry archive (every 5 min). Different from discrete production (1 cycle = 1 piece).

**ADR-026 — CFRP-specific Patterns**
CFRP requires special tracking: Mold cycles count, Prepreg cumulative out-time (max 30 days budget), Cure cycle long-running (4-12h jobs with telemetry every 30 sec).

**ADR-027 — Safety Devices ECE-R104 Compliance**
Reflectance thresholds, color CIE-Lab measurements, Homologation certificates with expiry, ECE marking generation.

---

## 🤝 How we work together

This is a session-based collaboration. Follow this pattern strictly:

### PHASE 0 — PRE-FLIGHT CHECK (start of every session)

Before any task, run these 5 commands and confirm output is healthy:

```powershell
git status                                          # working tree clean?
git log --oneline | Select-Object -First 5          # recent commits?
git worktree list                                   # any orphaned worktree?
git branch -a                                       # any leftover branch?
netstat -ano | findstr ":3000 :3001 :3002"          # zombie servers?
```

If any of these shows something unexpected, **STOP and investigate** before proceeding. This pre-flight check exists because on April 28, 2026, hours were lost when work was thought to be missing but actually existed in an uncommitted worktree.

### PHASE 1 — PLAN (always first)
- The user gives you a specific prompt (one of `prompts/PROMPT_*.md`)
- You read the prompt, then the files it references (TIER 0 always; TIER 1-4 as needed)
- You propose a plan: deliverables, files to create/modify, dependencies, time estimates
- You DO NOT write code yet
- You list any ambiguity for the user to clarify
- You wait for explicit "go"

### PHASE 2 — BUILD (after approval, one deliverable at a time)
- You implement one deliverable
- You run the verification commands from `prompts/DOD_TEMPLATE.md` for that deliverable
- You **paste the literal command output in chat** — no paraphrasing, no "all good", no summaries
- You suggest a Conventional Commits message; user does the commit
- You wait for the user's "ok next" before moving to the next deliverable

### PHASE 3 — VERIFY (after build, before declaring done)
- Run the FULL DoD checklist (sections A through F of `prompts/DOD_TEMPLATE.md`)
- Paste literal output for every section — every claim has a corresponding command
- List known limitations and any TODO items uncovered (add to `TODO.md`)
- Update `STATUS.md` with the new verified state (use only past-tense, never aspirational)

### PHASE 4 — COMMIT (always done by the user)
- YOU NEVER COMMIT to git. The user does that.
- You can suggest commit messages, but don't execute git operations
- The user reviews your output, then commits and pushes

---

## 📏 Rules & constraints

### DO

- ✓ Run **PRE-FLIGHT CHECK** at the start of every session
- ✓ Read **STATUS.md** and **TODO.md** before proposing any plan
- ✓ Read specifications BEFORE writing code (every session)
- ✓ Follow **DOD_TEMPLATE.md** for every claim of "done" — paste literal command output
- ✓ Follow the BEST_PRACTICES.md patterns exactly
- ✓ Use TypeScript strict mode
- ✓ Use Zod for ALL validation (no ad-hoc validation)
- ✓ Use Prisma transactions for multi-entity operations
- ✓ Emit domain events for important state changes
- ✓ Add audit logging for all entity mutations (use `AuditLogService` from PROMPT_2)
- ✓ Enforce `plantId` filter on every query (multi-tenant)
- ✓ Use **Argon2id** for any PIN/password hashing
- ✓ Write tests as you build (don't defer)
- ✓ Use English for code, comments, commits
- ✓ Use Italian for end-user UI text (Reflexallen is Italian)
- ✓ Keep commits atomic (one logical change per commit suggestion)
- ✓ Apply design tokens from docs/design-tokens.md to Tailwind
- ✓ Suggest CHANGELOG.md entries for significant changes
- ✓ Follow Conventional Commits format (see docs/VERSIONING.md)

### DON'T

- ✗ **Don't claim "done" without literal command output for every DoD section.** "Tests pass" without the literal pass/fail summary line is a violation. So is "build is clean" without the exit code.
- ✗ **Don't modify `packages/prisma/schema.prisma` without explicit approval.** The 63 models exist as-is; modifications cascade across all 13 registries.
- ✗ **Don't silently fix items in `TODO.md`.** They are tracked because someone deferred them on purpose; touching them outside scope creates regressions.
- ✗ **Don't expand scope.** If a deliverable seems to require something outside the prompt, STOP and ask.
- ✗ Don't commit to git (the user does that)
- ✗ Don't push to remote (the user does that)
- ✗ Don't deviate from tech stack without asking
- ✗ Don't use libraries not in approved list without asking
- ✗ Don't skip writing tests (test coverage matters)
- ✗ Don't use `any` type (always proper types)
- ✗ Don't bypass Zod validation
- ✗ Don't hard-delete data (always soft delete via `deletedAt`)
- ✗ Don't use raw SQL when Prisma supports the query
- ✗ Don't use **bcrypt** — Argon2id only
- ✗ Don't add Docker, PostgreSQL drivers, Redis, BullMQ, MinIO — DEV MODE only
- ✗ Don't mix concerns (separate UI, business logic, data access)
- ✗ Don't optimize prematurely (build correct first, then fast)

---

## 📖 Vocabulary (key terms)

```
Item            — Master data: a part number (FG, raw material, component)
BOM             — Bill of Materials: components needed to produce an Item
Lot             — A batch of an Item (received from supplier or produced)
Workflow        — A sequence of phases/groups/steps to produce an Item
Phase           — Top-level workflow division (Inbound, Setup, Production, ...)
Group           — Mid-level grouping within a phase
Step            — Atomic action (scan QR, run device, manual operation, ...)
Recipe          — Device-specific parameters (extruder temps, leak test pressure)
Work Order (WO) — A specific production run: Item × qty × workflow × schedule
Operator        — A person who performs steps (with skills, login)
Skill           — Certification required to perform certain steps
Device          — Physical equipment (extruder, leak tester, autoclave, ...)
Tool            — Replaceable/wearing item (mold, die, blade)
Box             — Container for finished goods (returnable or single-use)
Lot Movement    — Tracking of lot location/state changes
Genealogy       — Forward+backward traceability (lot → finished good and back)
FAI             — First Article Inspection (PPAP-compliant, blocks production)
WIP             — Work In Progress (containers between phases)
OEE             — Overall Equipment Effectiveness (Availability × Perf × Quality)
HMI             — Human-Machine Interface (operator touchscreen UI)
```

For full vocabulary: `docs/CONVENTIONS.md` section "Glossary"

---

## 🚦 Build progression

The MES is built incrementally through a series of prompts. The user gives them in order:

| Step | Prompt File | What you build | Status |
|---|---|---|---|
| 1 | `prompts/PROMPT_1_FOUNDATION.md` | Monorepo, Prisma schema, apps skeleton | ✅ Done |
| 2 | `prompts/PROMPT_2_REGISTRIES.md` | 13 master data registries with CRUD | ✅ Done (commit b376142, April 28) |
| 3a | `prompts/PROMPT_3a_CORE.md` | Workflow Designer canvas + 4-pane + 3 forms + CRUD | ⏭️ Next |
| 3b | `prompts/PROMPT_3b_ADVANCED.md` | Remaining 5 forms + validation + versioning UI + templates | 📝 Skeleton |
| 3c | `prompts/PROMPT_3c_SNAPSHOT_PREVIEW.md` | WorkflowSnapshot + live preview + performance + E2E | 📝 Skeleton (requires WO release flow) |
| 4 | `prompts/PROMPT_4_AUTO_GENERATION.md` | Auto-generation engine (7 rules) | 📝 Spec only |
| 5 | `prompts/PROMPT_5_EXECUTION_HMI.md` | HMI shop floor with step renderer + PIN auth | 📝 Spec only |
| 6 | `prompts/PROMPT_6_DASHBOARD_REPORTING.md` | OEE, FPY, KPI dashboards | 📝 Spec only |

Obsolete / replaced prompts are in `prompts/archive/`:
- `PROMPT_1B_obsolete.md` — was a foundation-completion patch, no longer needed (PROMPT_2 already merged the work)
- `PROMPT_3_WORKFLOW_DESIGNER_obsolete.md` — was a 13-step monolith, replaced by 3a/3b/3c

---

## 🎬 Your first action in any session

When you start a new session:

1. **Read this file** (CLAUDE.md) — done automatically when Claude Code starts
2. **Read STATUS.md and TODO.md** — to know the current ground truth and pending issues
3. **Run the PRE-FLIGHT CHECK** (5 commands above) and confirm output
4. **Wait for the user to give you a specific prompt**
5. **Before building, read the additional files mentioned in that prompt** (TIER 0 always; TIER 1-4 as needed)
6. **Propose a plan, don't code yet**
7. **Wait for "Plan approved. Go."**

If the user just says "hi" or starts with no specific task, respond:

> Hi! I've loaded the Reflexallen MES context from CLAUDE.md, STATUS.md, and TODO.md.
> Current state: PROMPT_2 merged on April 28 (13 registries, 127 tests, build verified).
> I'm ready to start the next build task.
> Which prompt would you like me to execute?

---

## 🔄 Change Log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-27 | Created from MASTER_PROMPT.md v2. Reformatted as auto-loaded CLAUDE.md per Anthropic convention. Removed manual paste instructions. Added auto-onboarding behavior. |
| 1.1 | 2026-04-27 | Added TIER 0 references (README, CHANGELOG, VERSIONING). Added commit conventions to DO list. |
| 1.2 | 2026-04-29 | Added DEV MODE section (SQLite/in-memory/local fs, no Docker). Added STATUS.md, TODO.md, prompts/DOD_TEMPLATE.md, TESTING_STRATEGY.md to documentation map. Updated repo name to RAMS-Reflexallen-MES. Updated build progression to reflect PROMPT_2 done and PROMPT_3 split into 3a/3b/3c. Added PHASE 0 pre-flight check. Added DoD compliance rule (no "done" without literal command output). Added Argon2id rule, plantId enforcement reminder, archive subfolder reference. Updated stack: shadcn-style primitives in @mes/ui, @xyflow/react for canvas, react-hook-form for forms. |

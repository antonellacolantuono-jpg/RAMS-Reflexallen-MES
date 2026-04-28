# CLAUDE.md — Reflexallen MES Project Context

> **This file is auto-loaded by Claude Code at the start of every session.**
> It establishes the project context. You don't need to paste it manually.
>
> **Specifications version**: v1.2
> **Last updated**: 2026-04-27

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

## 🛠️ Tech stack (NON-NEGOTIABLE)

### Backend
- **Runtime**: Node.js 20+ LTS
- **Framework**: NestJS 10+ (modular monolith with domain-driven design)
- **ORM**: Prisma 5+
- **Database**: PostgreSQL 16
- **Cache/Queue**: Redis 7 + BullMQ
- **Real-time**: Socket.IO
- **Storage**: MinIO (S3-compatible)
- **Validation**: Zod (shared FE/BE schemas)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + TypeScript 5 strict mode
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: TanStack Query + Zustand
- **State Machines**: XState 5
- **Workflow Designer**: React Flow

### DevOps
- **Monorepo**: Turborepo + pnpm workspaces
- **Local dev**: Docker Compose
- **Testing**: Vitest (unit) + Playwright (E2E)

---

## 📂 Documentation map (read these as needed)

The repository contains comprehensive documentation organized in tiers. Read on-demand based on what you're working on.

### TIER 0 — Project meta (read once, refer back)

```
README.md
  - Project overview, structure, getting started
  
CHANGELOG.md
  - History of all changes (specifications, prompts, code)
  - Read to understand recent project evolution

docs/VERSIONING.md
  - Versioning rules (3 dimensions: specs, prompts, code)
  - When and how to bump versions
  - Conventional commits guide
```

### TIER 1 — Core Specifications (read FIRST in every session)

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

## 🏗️ Monorepo structure (target)

This is what you'll build incrementally:

```
RAMS_V4/
├── CLAUDE.md                      ← This file (auto-loaded)
├── apps/
│   ├── api/                       NestJS backend
│   ├── web/                       Next.js admin
│   ├── hmi/                       Next.js shop floor (touch UI)
│   └── worker/                    BullMQ workers
│
├── packages/
│   ├── prisma/                    Prisma schema + migrations + seed
│   ├── types/                     Shared TypeScript types
│   ├── schemas/                   Zod schemas (FE+BE)
│   ├── ui/                        shadcn/ui customized + design tokens
│   ├── sdk/                       Typed API client
│   ├── config/                    Shared config (eslint, tsconfig, prettier)
│   └── domain/                    Pure domain logic (state machines, rules)
│
├── docs/                          Specifications (tier 1-4)
├── prompts/                       Build task prompts (one per step)
├── scripts/                       Automation
│
├── docker-compose.yml
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

### PHASE 1 — PLAN (always first)
- I give you a task (one of the prompts/PROMPT_*.md files)
- You read relevant specifications
- You propose a plan: files to create/modify, dependencies, steps
- You DO NOT write code yet
- You wait for my approval

### PHASE 2 — BUILD (after approval)
- You implement the plan step by step
- You run commands one at a time, showing output
- You ask before installing large packages (>50MB)
- You ask before destructive operations (rm, drop database)
- If a step fails, you debug and retry, but tell me before changing approach

### PHASE 3 — VERIFY (after build)
- You run: pnpm build, pnpm test, pnpm lint, docker compose up
- You report results honestly (don't hide failing tests)
- You list known limitations or TODOs
- You wait for my review

### PHASE 4 — COMMIT (always done by me)
- YOU NEVER COMMIT to git
- I review your work, then I do `git commit` and `git push` myself
- You can suggest commit messages, but don't execute git operations

---

## 📏 Rules & constraints

### DO
- ✓ Read specifications BEFORE writing code (every session)
- ✓ Follow the BEST_PRACTICES.md patterns exactly
- ✓ Use TypeScript strict mode
- ✓ Use Zod for ALL validation (no ad-hoc validation)
- ✓ Use Prisma transactions for multi-entity operations
- ✓ Emit domain events for important state changes
- ✓ Add audit logging for all entity mutations
- ✓ Write tests as you build (don't defer)
- ✓ Use English for code, comments, commits
- ✓ Use Italian for end-user UI text (Reflexallen is Italian)
- ✓ Keep commits atomic (one logical change per commit suggestion)
- ✓ Apply design tokens from docs/design-tokens.md to Tailwind
- ✓ Suggest CHANGELOG.md entries for significant changes (user commits, but you suggest the entry)
- ✓ Follow Conventional Commits format (see docs/VERSIONING.md)

### DON'T
- ✗ Don't commit to git (I do that)
- ✗ Don't push to remote (I do that)
- ✗ Don't deviate from tech stack without asking
- ✗ Don't use libraries not in approved list without asking
- ✗ Don't skip writing tests (test coverage matters)
- ✗ Don't use `any` type (always proper types)
- ✗ Don't bypass Zod validation
- ✗ Don't hard-delete data (always soft delete)
- ✗ Don't use raw SQL when Prisma supports the query
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

For full vocabulary: docs/CONVENTIONS.md section "Glossary"

---

## 🚦 Build progression

The MES is built incrementally through a series of prompts. The user will give them to you in order:

| Step | Prompt File | What you build |
|---|---|---|
| 1 | `prompts/PROMPT_1_FOUNDATION.md` | Monorepo, Docker, Prisma schema, apps skeleton |
| 2 | `prompts/PROMPT_2_REGISTRIES.md` | 13 master data registries with CRUD |
| 3 | `prompts/PROMPT_3_WORKFLOW_DESIGNER.md` | Workflow canvas + 4-pane configurator |
| 4 | `prompts/PROMPT_4_AUTO_GENERATION.md` | Auto-generation engine (7 rules) |
| 5 | `prompts/PROMPT_5_EXECUTION_HMI.md` | HMI shop floor with step renderer |
| 6 | `prompts/PROMPT_6_DASHBOARD_REPORTING.md` | OEE, FPY, KPI dashboards |

Steps 3-6 don't exist yet at the time of writing. They'll be added as we progress.

---

## 🎬 Your first action in any session

When you start a new session:

1. **Read this file** (CLAUDE.md) — done automatically when Claude Code starts
2. **Wait for the user to give you a specific prompt** (e.g., paste of `prompts/PROMPT_1_FOUNDATION.md`)
3. **Before building, read the additional files mentioned in that prompt**
4. **Propose a plan, don't code yet**
5. **Wait for "Plan approved. Go."**

If the user just says "hi" or starts with no specific task, respond:

> Hi! I've loaded the Reflexallen MES context from CLAUDE.md.
> I'm ready to start a build task.
> Which prompt would you like me to execute? (e.g., PROMPT_1_FOUNDATION, PROMPT_2_REGISTRIES, etc.)

---

## 🔄 Change Log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-27 | Created from MASTER_PROMPT.md v2. Reformatted as auto-loaded CLAUDE.md per Anthropic convention. Removed manual paste instructions. Added auto-onboarding behavior. |
| 1.1 | 2026-04-27 | Added TIER 0 references (README, CHANGELOG, VERSIONING). Added commit conventions to DO list. |

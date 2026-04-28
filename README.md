# RAMS V4 — Reflexallen MES (Manufacturing Execution System)

> **Project**: Internal MES for Reflexallen S.p.A.
> **Status**: Specification phase complete, build phase ready to start
> **Owner**: Antonella Colantuono
> **Last updated**: 2026-04-27

---

## What is this project?

A **Manufacturing Execution System (MES)** built internally for Reflexallen 
S.p.A. (Italian Tier-1 automotive supplier, Modena, Italy).

The MES manages production across 5 production lines:
1. **Pneumatic Air** — Multi-layer pneumatic tubes for truck braking systems
2. **CFRP (Compositi)** — Carbon fiber reinforced polymer parts (motorcycle, structural)
3. **Safety Devices** — ECE-R104 retroreflective panels for trucks
4. **Fluid Power** — Hydraulic and pneumatic subassemblies (V2)
5. **Digital Electrical** — Wire harnesses, connectors (V2)

The system is **generic enough** to support all 5 lines but with **specific 
modules** for CFRP and Safety Devices (which have unique requirements like 
prepreg out-time tracking, ECE-R104 reflectance compliance, etc.).

---

## Repository structure

```
RAMS_V4/
├── README.md                          ← You are here
├── CHANGELOG.md                       ← Project history
├── CLAUDE.md                          ← Auto-loaded context for Claude Code
├── docs/                              ← Tier 1: Core specifications
│   ├── MASTER_SPECIFICATION.md        ← Domain entities, ADRs, taxonomies
│   ├── BEST_PRACTICES.md              ← Code patterns
│   ├── CONVENTIONS.md                 ← Quick reference
│   ├── VERSIONING.md                  ← Versioning rules (3 dimensions)
│   ├── design-tokens.md               ← Design system from Claude Design
│   │
│   └── extensions/                    ← Tier 2-4: Modular extensions
│       ├── EQUIPMENT_MANAGEMENT.md
│       ├── SCHEDULING_ASSIGNMENT.md
│       ├── INDUSTRIAL_OPERATIONS.md
│       ├── CFRP_MODULE.md
│       ├── SAFETY_DEVICES_MODULE.md
│       │
│       ├── WORKFLOW_PNEUMATIC_AIR.md           ← High-level workflow
│       ├── WORKFLOW_PNEUMATIC_AIR_DETAILED.md  ← Step-by-step + branching
│       ├── WORKFLOW_CFRP.md                    ← (idem for CFRP)
│       ├── WORKFLOW_CFRP_DETAILED.md
│       ├── WORKFLOW_SAFETY_DEVICES.md          ← (idem for Safety Devices)
│       ├── WORKFLOW_SAFETY_DEVICES_DETAILED.md
│       ├── WORKFLOW_FLUID_POWER.md             ← V2, INVENTED
│       ├── WORKFLOW_DIGITAL_ELECTRICAL.md      ← V2, INVENTED
│       │
│       ├── FUNCTIONAL_INVENTORY.md             ← 227 features classified
│       └── MOCK_DATA_PNEUMATIC_AIR.md          ← Concrete seed data
│
├── prompts/                           ← Build prompts for Claude Code
│   ├── MASTER_PROMPT.md               ← Onboarding context
│   ├── PROMPT_1_FOUNDATION.md         ← Step 1: monorepo + Prisma
│   ├── PROMPT_2_REGISTRIES.md         ← Step 2: 13 registries
│   ├── PROMPT_3_WORKFLOW_DESIGNER.md  ← (TBD) Step 3
│   ├── PROMPT_4_AUTO_GENERATION.md    ← (TBD) Step 4
│   ├── PROMPT_5_EXECUTION_HMI.md      ← (TBD) Step 5
│   └── PROMPT_6_DASHBOARD_REPORTING.md ← (TBD) Step 6
│
├── scripts/                           ← Automation
│   ├── setup-environment.ps1          ← One-time environment setup
│   ├── update-docs.ps1                ← Daily docs sync from Downloads
│   └── README.md                      ← Scripts documentation
│
└── (build artifacts will appear here after PROMPT_1)
    ├── apps/
    │   ├── api/                       ← NestJS backend
    │   ├── web/                       ← Next.js admin
    │   ├── hmi/                       ← Next.js shop floor
    │   └── worker/                    ← BullMQ workers
    ├── packages/
    │   ├── prisma/
    │   ├── types/
    │   ├── schemas/
    │   ├── ui/
    │   ├── sdk/
    │   ├── domain/
    │   └── config/
    ├── docker-compose.yml
    ├── turbo.json
    └── package.json
```

---

## Tech Stack

### Backend
- **Runtime**: Node.js 20+ LTS
- **Framework**: NestJS 10+ (modular monolith)
- **ORM**: Prisma 5+
- **Database**: PostgreSQL 16
- **Cache/Queue**: Redis 7 + BullMQ
- **Real-time**: Socket.IO
- **Storage**: MinIO (S3-compatible)
- **Validation**: Zod (shared FE/BE)

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

## Current Status

### ✅ Phase 1: Specifications (COMPLETE)
- 21 documentation files (~26,000 lines)
- Core specs v1.2 with 27 ADRs
- 5 modular extensions
- 8 workflow references
- Functional inventory (227 features)
- Mock data fixture for Pneumatic Air

### ✅ Phase 2: Build Prompts (3 of 7)
- MASTER_PROMPT v2 ✅
- PROMPT_1_FOUNDATION v2 ✅
- PROMPT_2_REGISTRIES v2 ✅
- PROMPT_3_WORKFLOW_DESIGNER ⏳
- PROMPT_4_AUTO_GENERATION ⏳
- PROMPT_5_EXECUTION_HMI ⏳
- PROMPT_6_DASHBOARD_REPORTING ⏳

### 🚧 Phase 3: Build with Claude Code (NOT STARTED)
- Step 1: Foundation (~1.5-2h)
- Step 2: Registries (~2-3h)
- Step 3-6: TBD

### 🔵 Phase 4: V2 (FUTURE)
- Fluid Power module
- Digital Electrical module
- Multi-language EN
- Advanced scheduling
- Predictive maintenance
- IIoT integration

---

## Getting Started

### Prerequisites

- **Node.js** 20+ (use [nvm-windows](https://github.com/coreybutler/nvm-windows))
- **pnpm** 8+ (`npm install -g pnpm`)
- **Docker Desktop** for Windows
- **Git** + GitHub access
- **VS Code** (recommended) with extensions list (auto-suggested)
- **PowerShell** 5.1+ (built into Windows)

### First-time setup

1. **Clone the repository**:
   ```powershell
   git clone https://github.com/antonellacolantuono-jpg/RAMS-V.4.git
   cd RAMS-V.4
   ```

2. **Run environment setup**:
   ```powershell
   .\scripts\setup-environment.ps1
   ```
   This creates folders, configures git aliases, sets up VS Code extensions.

3. **Verify documentation is in place**:
   ```powershell
   ls docs
   ls docs\extensions
   ls prompts
   ```
   You should see the files documented in this README.

### Daily workflow

When you receive new documentation files from Claude chat:

1. Files download to `~\Downloads`
2. Run sync script:
   ```powershell
   .\scripts\update-docs.ps1
   ```
3. Files auto-route to correct folders
4. Confirm prompts → commit → push

### Starting the build with Claude Code

**Pre-requisite**: Install Claude Code CLI (Anthropic's tool):
- [Installation guide](https://docs.claude.com/claude-code)

**Build process**:

1. Open Claude Code in repo root:
   ```powershell
   cd C:\Users\antonella.colantuono.REFLEXALLEN\Desktop\RAMS_V4
   claude
   ```

2. Paste **MASTER_PROMPT.md** content (from `prompts/MASTER_PROMPT.md`)

3. Wait for Claude Code to read specs and provide a summary

4. Paste **PROMPT_1_FOUNDATION.md** content

5. Review the plan, approve, then say "go"

6. Wait for Claude Code to build (~1.5-2 hours)

7. Verify locally, then YOU (not Claude Code) commit:
   ```powershell
   pnpm install
   docker compose up -d
   pnpm prisma migrate dev
   pnpm build
   git add .
   git commit -m "feat(foundation): monorepo + prisma v1.2 schema"
   git push
   ```

8. Open new Claude Code session, repeat with **PROMPT_2_REGISTRIES.md**

9. Continue with PROMPT_3-6 as they become available

---

## Documentation conventions

### How to read the docs

The docs follow a **3-tier structure**:

- **Tier 1** (`docs/`): Always read FIRST. Foundation knowledge.
- **Tier 2** (`docs/extensions/`): Read WHEN working on related feature.
- **Tier 3+4** (`docs/extensions/`): Reference material.

### When to update docs

Documentation is **versioned in git** with the code. Update when:
- Specs change → update `MASTER_SPECIFICATION.md`
- New patterns discovered → update `BEST_PRACTICES.md`
- Conventions evolve → update `CONVENTIONS.md`
- New modules added → create new `*_MODULE.md` in extensions
- New workflows defined → create `WORKFLOW_*.md` files

### Versioning

This project uses a **3-dimensional versioning scheme**:

1. **Specifications** — `vMAJOR.MINOR` (e.g., `v1.2`)
2. **Build Prompts** — `vN` (e.g., `v3`)
3. **Application Code** — `vMAJOR.MINOR.PATCH` (Semantic Versioning)

See [docs/VERSIONING.md](./docs/VERSIONING.md) for complete rules.

All notable changes are tracked in [CHANGELOG.md](./CHANGELOG.md).

Major doc versions:
- **v1.0** — Initial spec (Pneumatic Air only)
- **v1.1** — Added Box Management
- **v1.2** — Added Equipment Mgmt, Scheduling, Industrial Ops, CFRP, Safety Devices ⬅ current
- **v2.0** — Future: after Fluid Power + Digital Electrical added

---

## Development principles

### Architectural

- **DDD**: Domain-Driven Design with bounded contexts
- **CQRS-light**: Read/write separation where it adds value
- **Event-driven**: Domain events for cross-cutting concerns
- **Audit-first**: Every mutation logs (15+ year retention)
- **Soft delete**: No data ever hard-deleted

### Coding

- **TypeScript strict mode** everywhere
- **Zod for ALL validation** (FE + BE share schemas)
- **Prisma transactions** for multi-entity operations
- **Test as you build** (don't defer testing)
- **English code, Italian UI** (Reflexallen is Italian)

### Process

- **Plan → Build → Verify → Commit** (with Claude Code)
- **Sessions short and focused** (1 task per session, max 2h)
- **Manual commits** (you, not Claude Code)
- **Atomic commits** (one logical change per commit)
- **Reference docs in commit messages** (e.g., "per MASTER_SPEC sec 4.32")

---

## Useful commands

```powershell
# Project status
git st                   # Compact status
git lg                   # Pretty log graph

# Documentation sync
.\scripts\update-docs.ps1                # Sync from Downloads
.\scripts\update-docs.ps1 -DryRun        # Preview only
.\scripts\update-docs.ps1 -AutoCommit    # No prompts

# Quick docs commit
git docupdate            # Stage docs/ + prompts/, commit, push

# Build (after PROMPT_1 completes)
pnpm install             # Install all deps
pnpm build               # Build all packages
pnpm test                # Run all tests
pnpm dev                 # Start all apps in dev mode
docker compose up -d     # Start postgres, redis, minio
docker compose down      # Stop services

# Prisma
pnpm prisma migrate dev  # Apply migrations
pnpm prisma generate     # Regenerate Prisma client
pnpm prisma studio       # Open DB GUI

# Specific apps
pnpm --filter api dev    # Backend API
pnpm --filter web dev    # Admin web
pnpm --filter hmi dev    # Shop floor HMI
pnpm --filter worker dev # Background workers
```

---

## Contact & Contribution

**Owner**: Antonella Colantuono ([antonella.colantuono@reflexallen.it](mailto:antonella.colantuono@reflexallen.it))

**Repository**: https://github.com/antonellacolantuono-jpg/RAMS-V.4

This is an **internal project** for Reflexallen S.p.A. Not open for external 
contributions at this stage.

---

## License

Proprietary — Reflexallen S.p.A. internal use only.

---

## Acknowledgments

- **Specifications development**: Claude (Anthropic) via Claude.ai chat sessions
- **Build implementation**: Claude Code (Anthropic) via terminal sessions
- **Domain expertise**: Reflexallen Process Engineers, QC team, Production team

---

## Change log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-27 | Initial README documenting v1.2 spec phase complete |

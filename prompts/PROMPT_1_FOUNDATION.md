# PROMPT 1 — FOUNDATION v3

> **Type**: Build prompt for Claude Code (Step 1 of 6)
> **Pre-requisite**: CLAUDE.md must be at repo root (auto-loaded by Claude Code)
> **Estimated time**: 1.5-2 hours
> **Last updated**: 2026-04-27
>
> **How to use**:
> 1. Open Claude Code in the repo root (CLAUDE.md is auto-loaded)
> 2. Copy the entire content of "PROMPT TO PASTE" section below
> 3. Paste in Claude Code
> 4. Wait for plan → approve → wait for build → verify → YOU commit (Claude Code doesn't)

---

## 📋 PROMPT TO PASTE (copy from here)

```
TASK: Build the FOUNDATION layer of the Reflexallen MES.

(Context already loaded from CLAUDE.md at session start.)

═══════════════════════════════════════════════════════════════════════════════
GOAL
═══════════════════════════════════════════════════════════════════════════════

Create the monorepo structure with:
- Turborepo + pnpm workspaces configured
- Docker Compose with all services running locally
- Prisma schema with all v1.2 entities (full domain model)
- NestJS API skeleton with module structure
- Next.js apps skeletons (web admin, hmi shop floor)
- Shared packages (types, schemas, ui, sdk, config, domain)
- Working dev environment that compiles and runs

After this step, the team can install dependencies, run docker compose, and 
have a working (empty) MES ready to receive features in subsequent steps.

═══════════════════════════════════════════════════════════════════════════════
ADDITIONAL READING (do BEFORE planning)
═══════════════════════════════════════════════════════════════════════════════

You should already have CLAUDE.md context. Now ALSO read:

→ docs/MASTER_SPECIFICATION.md sections 4-22 (entity definitions)
→ docs/BEST_PRACTICES.md sections 1-3 (foundation patterns)
→ docs/extensions/EQUIPMENT_MANAGEMENT.md (state machine entities)
→ docs/extensions/SCHEDULING_ASSIGNMENT.md (assignment entities)
→ docs/extensions/INDUSTRIAL_OPERATIONS.md (sample, FAI, WIP, hold entities)
→ docs/extensions/CFRP_MODULE.md (mold, prepreg, cure cycle entities)
→ docs/extensions/SAFETY_DEVICES_MODULE.md (reflectance, homologation, aging)
→ docs/design-tokens.md (Tailwind config will use these)

═══════════════════════════════════════════════════════════════════════════════
PHASE 1 — PLAN (DO THIS FIRST, NO CODE YET)
═══════════════════════════════════════════════════════════════════════════════

After reading, propose a plan covering:

1. MONOREPO INITIALIZATION
   - pnpm + Turborepo setup
   - Workspace layout (apps/, packages/)
   - Root package.json + tsconfig.json + .gitignore
   - turbo.json with pipelines (build, dev, test, lint)

2. DOCKER COMPOSE
   - postgres:16 (port 5432, named volume)
   - redis:7 (port 6379, named volume)
   - minio (ports 9000+9001, named volume)
   - Health checks on all services
   - .env.example with default credentials

3. SHARED PACKAGES
   - packages/config — shared eslint, tsconfig, prettier
   - packages/types — TypeScript types (entity types, enums)
   - packages/schemas — Zod schemas (shared FE+BE validation)
   - packages/prisma — Prisma client + schema + migrations
   - packages/ui — shadcn/ui customized with design tokens
   - packages/sdk — typed API client (will be auto-generated later)
   - packages/domain — pure domain logic, state machines

4. PRISMA SCHEMA (v1.2 COMPLETE)
   List ALL entities you will create. They should include:
   
   FOUNDATION (sections 4-7):
   - Plant
   - User, Operator, Skill, OperatorSkill
   - Item (polymorphic: FG, raw, component, consumable)
   - BOM, BOMLine
   - EquipmentHierarchyNode (Site → Area → WorkCenter)
   - Device, Tool
   - Recipe, RecipeVersion
   - BoxType, Box
   - AttentionPoint
   - CauseCode
   - Lot, LotMovement
   
   WORKFLOW & WORK ORDER:
   - Workflow, WorkflowVersion
   - Phase, Group, Step (polymorphic by category)
   - StepActionType (~40 types)
   - WorkflowSnapshot (immutable)
   - WorkOrder (8 statuses)
   - ProductionRecord (per piece)
   - StepExecution
   - DowntimeEvent
   
   v1.2 ENTITIES — Equipment Management:
   - MaintenanceOrder (lifecycle 4 statuses, 4 types)
   - MaintenanceLog
   - ToolWearRecord (5 statuses)
   - ToolReplacement
   
   v1.2 ENTITIES — Scheduling & Assignment:
   - WorkOrderAssignment (5 statuses)
   - SkillsCoverageOverride (audit)
   - Shift, ShiftAssignment
   
   v1.2 ENTITIES — Industrial Operations:
   - ContinuousProductionRun
   - Sample, SampleResult
   - FAIReport (PPAP)
   - WIPContainer
   - Subassembly
   - LotHold, LotHoldAction
   
   v1.2 ENTITIES — CFRP Module:
   - Mold, MoldCycle
   - PrepregRoll, PrepregOutTimeRecord
   - CureCycleRun, CureCycleTelemetry
   - LayupLog
   - VacuumBagTest
   - NDTResult
   
   v1.2 ENTITIES — Safety Devices Module:
   - ReflectiveFilmRoll
   - HomologationCertificate
   - ReflectanceTest
   - ColorimetryTest
   - LaminationRecord
   - CrossCutAdhesionTest
   - AgingTestSpecimen, AgingTestMeasurement
   
   AUDIT & EVENTS:
   - AuditLog (every entity change)
   - DomainEvent (event sourcing for key state changes)
   
   For each entity, briefly note:
   - Primary identifier (cuid)
   - Key fields
   - Important relations
   - Special behaviors (soft delete, optimistic lock, polymorphism)

5. APPS SKELETONS
   - apps/api (NestJS): main.ts, app.module.ts, base config, health endpoint
   - apps/web (Next.js 14 App Router): layout, basic landing
   - apps/hmi (Next.js 14 App Router): layout optimized for touch
   - apps/worker (NestJS standalone): BullMQ worker setup

6. TAILWIND DESIGN TOKENS INTEGRATION
   - Read docs/design-tokens.md
   - Apply tokens (colors, typography, spacing, border-radius) to tailwind.config.ts
   - Configure shadcn/ui theme to use these tokens
   - Export theme via packages/ui

7. VERIFICATION STEPS
   - pnpm install (no errors)
   - docker compose up -d (all services healthy)
   - pnpm prisma migrate dev --name init (schema applied)
   - pnpm prisma generate (client generated)
   - pnpm build (all packages compile)
   - apps/api responds on http://localhost:3000/health
   - apps/web loads on http://localhost:3001
   - apps/hmi loads on http://localhost:3002

After presenting your plan, STOP and wait for my approval.
Do NOT write any code yet.

═══════════════════════════════════════════════════════════════════════════════
PHASE 2 — BUILD (ONLY AFTER MY APPROVAL)
═══════════════════════════════════════════════════════════════════════════════

When I say "go", proceed step by step:

STEP 2.1 — Monorepo skeleton
  - Initialize pnpm workspace
  - Create turbo.json
  - Create root tsconfig.json
  - Create .gitignore (Node, Next.js, Prisma, .env, OS files)
  - Create .editorconfig
  - Create .nvmrc (Node 20)
  - Verify: pnpm install runs without errors

STEP 2.2 — Docker Compose
  - Create docker-compose.yml with postgres + redis + minio
  - Create .env.example with all variables
  - Verify: docker compose up -d, then docker compose ps shows all healthy

STEP 2.3 — Shared package: config
  - packages/config/eslint-config (base + nest + react variants)
  - packages/config/tsconfig (base + react variants)
  - packages/config/prettier
  - Verify: packages/config builds

STEP 2.4 — Shared package: types
  - Generate enums (all 56+ from MASTER_SPEC section 4)
  - Define base types (BaseEntity, AuditFields, SoftDeleteFields)
  - Verify: pnpm --filter types build

STEP 2.5 — Shared package: schemas
  - Zod schemas for all entities (mirror types)
  - Refinements for cross-field validation
  - Verify: pnpm --filter schemas test (write at least 5 sample tests)

STEP 2.6 — Shared package: prisma
  - Create schema.prisma with ALL entities listed in your plan
  - Configure datasource (postgres) and generator (Prisma Client)
  - Add common patterns: id (cuid), createdAt, updatedAt, deletedAt, version
  - Run prisma migrate dev --name init
  - Run prisma generate
  - Create seed.ts skeleton (will be filled in PROMPT_2)
  - Verify: connection works, migration applied, client generated

STEP 2.7 — Shared package: domain
  - Pure logic only (no DB, no HTTP)
  - Equipment state machine (XState 5 syntax)
  - Box state machine
  - WorkOrder state machine
  - Workflow validation rules
  - Verify: pnpm --filter domain test (at least 10 tests)

STEP 2.8 — Shared package: ui
  - shadcn/ui initialization
  - Apply design tokens from docs/design-tokens.md to Tailwind config
  - Base components: Button, Input, Card, Dialog, Badge, Toast
  - Theme provider (light/dark)
  - Verify: components export properly with correct theming

STEP 2.9 — Shared package: sdk
  - Skeleton only (will be filled when API endpoints are defined)
  - Configure typed-fetch or axios with base URL
  - Verify: builds cleanly

STEP 2.10 — App: api (NestJS)
  - Initialize with @nestjs/cli
  - Module structure: AppModule, HealthModule, ConfigModule, PrismaModule
  - Health endpoint: GET /health (returns { status, db, redis, minio })
  - CORS configured
  - Validation pipe global (with Zod adapter)
  - Verify: pnpm --filter api start:dev, then curl http://localhost:3000/health

STEP 2.11 — App: web (Next.js)
  - Initialize Next.js 14 App Router
  - Tailwind + shadcn/ui linked
  - Basic layout with navigation skeleton
  - Login page (UI only)
  - Verify: pnpm --filter web dev, browser at http://localhost:3001

STEP 2.12 — App: hmi (Next.js)
  - Initialize Next.js 14 App Router
  - Tailwind + shadcn/ui linked
  - Touch-optimized base layout (large buttons, no hover states)
  - Login screen with badge/PIN input
  - Verify: pnpm --filter hmi dev, browser at http://localhost:3002

STEP 2.13 — App: worker (NestJS standalone)
  - Initialize as Nest standalone (no HTTP)
  - BullMQ connection to Redis
  - Sample worker (just logs received jobs)
  - Verify: pnpm --filter worker start:dev, no errors

STEP 2.14 — Final integration verification
  - Run docker compose up -d
  - Run pnpm install
  - Run pnpm prisma migrate dev
  - Run pnpm build (all packages + apps)
  - Run pnpm test (all packages)
  - Run pnpm lint (all packages)
  - Start each app in separate terminals (or use turbo dev)
  - Verify all endpoints/UIs respond

═══════════════════════════════════════════════════════════════════════════════
PHASE 3 — VERIFY & REPORT
═══════════════════════════════════════════════════════════════════════════════

After build, generate a STATUS REPORT covering:

✓ What works
✓ What's stubbed (placeholder for later)
✓ What's deferred to next prompts
✓ Test coverage
✓ Build times
✓ Any deviations from plan (with justification)
✓ Known issues or warnings
✓ Suggested commit message (you suggest, I commit)

═══════════════════════════════════════════════════════════════════════════════
ACCEPTANCE CRITERIA
═══════════════════════════════════════════════════════════════════════════════

This prompt is COMPLETE when:

[ ] pnpm install runs without errors
[ ] docker compose up -d shows all services healthy
[ ] pnpm prisma migrate dev creates the database schema
[ ] pnpm build builds all packages and apps without errors
[ ] pnpm test runs all tests and they pass
[ ] pnpm lint shows no errors
[ ] curl http://localhost:3000/health returns 200 with valid JSON
[ ] http://localhost:3001 shows web admin landing page
[ ] http://localhost:3002 shows HMI login screen
[ ] Worker process starts without errors
[ ] Prisma Studio (pnpm prisma studio) shows all v1.2 tables
[ ] Tailwind config uses design tokens from docs/design-tokens.md
[ ] Status report generated (Phase 3)

═══════════════════════════════════════════════════════════════════════════════
GO STEP-BY-STEP
═══════════════════════════════════════════════════════════════════════════════

Now:
1. Read the additional files listed above
2. Present your detailed plan (no code yet)
3. Wait for my approval
4. After approval, build step by step
5. After build, generate status report

START WITH THE PLAN.
```

(End of prompt to paste)

---

## 📚 Notes for Antonella (NOT to paste to Claude Code)

### What changed from v2 to v3

- **Removed onboarding section** (now in CLAUDE.md, auto-loaded)
- **Added explicit reading list** for additional files needed for THIS task
- **Streamlined acceptance criteria**
- **Added design tokens integration** explicit step (8)

### Common issues to watch for

**Issue 1**: Claude Code might propose using `npm` instead of `pnpm`.
- Reject. Tell him: "Stick to pnpm. The whole monorepo is built around pnpm workspaces."

**Issue 2**: Claude Code might propose using `t3-stack` or other "starters".
- Reject. Tell him: "Build from scratch. We need full control over structure."

**Issue 3**: Claude Code might want to skip some v1.2 entities "for later".
- Push back. The schema must be COMPLETE in this step. Adding entities later triggers migrations that break existing data.

**Issue 4**: Claude Code might use UUID for IDs.
- Reject. Tell him: "Use cuid() for all IDs. See ADR in MASTER_SPEC."

**Issue 5**: Claude Code might use Mongo or another DB.
- Reject. Tell him: "Postgres only. Tech stack is non-negotiable."

### How long this should take

| Activity | Estimated time |
|---|---|
| Reading additional specs | 10-15 min |
| Plan proposal | 10-15 min |
| Plan review (you) | 5-10 min |
| Build (~14 steps) | 60-90 min |
| Verify | 10-15 min |
| Status report | 5-10 min |
| **Total** | **1.5-2.5 hours** |

If it takes >3 hours, something is wrong. Stop and reassess.

### What NOT to expect from this step

After this prompt, you'll have:
- ✓ A monorepo that builds
- ✓ Empty database with all tables
- ✓ Apps that start and show login screens
- ✓ Worker that connects to BullMQ

You will NOT have:
- ✗ Working forms or CRUD operations (PROMPT_2)
- ✗ Workflow designer (PROMPT_3)
- ✗ Auto-generation logic (PROMPT_4)
- ✗ HMI step renderers (PROMPT_5)
- ✗ Dashboards (PROMPT_6)

### After this step

After this prompt succeeds and you commit, proceed with PROMPT_2_REGISTRIES.md in a new Claude Code session.

---

## 🔄 Change Log

| Version | Date | Changes |
|---|---|---|
| 1.0 | (earlier) | Initial foundation prompt (v1.0 entities only) |
| 2.0 | 2026-04-27 | v1.2 complete schema (all v1.2 entities) |
| 3.0 | 2026-04-27 | Removed onboarding (now in CLAUDE.md auto-load). Added explicit reading list. Streamlined for cleaner pattern. |

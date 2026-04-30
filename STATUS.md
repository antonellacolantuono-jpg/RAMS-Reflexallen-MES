# RAMS-Reflexallen-MES — Project Status

> **Last update**: April 29, 2026, evening (PROMPT_3a complete)
> **Repository**: https://github.com/antonellacolantuono-jpg/RAMS-Reflexallen-MES
> **Stack**: NestJS + Next.js 14 + Prisma SQLite + pnpm Turborepo + shadcn-style + Reflexallen design system

---

## 📜 Project history (timeline)

- **April 27** — PROMPT_1 (Foundation) drafted and partially executed
- **April 28 morning** — Audit revealed PROMPT_2 was reported done but never committed; recovered from worktree, merged
- **April 28 afternoon** — Started PROMPT_3a (Workflow Designer Core); D1, D2 merged
- **April 28 evening** — D3 merged
- **April 29 morning** — PC migration (new corporate laptop). Repo re-cloned, dev environment rebuilt from scratch. D4, D5 merged
- **April 29 evening** — D6 merged. **PROMPT_3a complete.**

---

## ✅ Current state (verified April 29 evening)

### PROMPT_1 — Foundation (1 commit on main)

- ✅ Monorepo: pnpm workspaces + Turborepo, 14 packages in scope
- ✅ Apps boot: `apps/api` (NestJS, port 3000), `apps/web` (Next.js 14, port 3001), `apps/hmi` (Next.js 14, port 3002)
- ✅ `packages/types`: 11 enum files
- ✅ `packages/ui`: 16 base + 8 Tier-2 primitives (after PROMPT_2)
- ✅ `packages/domain`: 4 XState v5 machines (Box, Equipment, WorkOrder, Workflow) + 4 rule files + 67 tests
- ✅ `packages/prisma`: 63 models including v1.2 modules (Equipment Mgmt, Maintenance, Tool Wear, Multi-output, Sample, FAI, WIP, Subassembly, Quality Hold, CFRP, Safety Devices), `AuditLog`, `DomainEvent`
- ✅ Placeholder packages: `@mes/cache` (8 ✓), `@mes/queue` (5 ✓), `@mes/storage` (6 ✓)

### PROMPT_2 — Registries (merged April 28, commits b376142 + later fixes)

- ✅ 13 NestJS modules with full CRUD
- ✅ Pattern per registry: `GET / POST / PATCH / DELETE /:id /trash /:id/restore /:id/audit`
- ✅ `BaseRegistryService` + `BaseRegistryController` (DRY)
- ✅ 18 web admin routes under `(registries)` group
- ✅ Sidebar navigation + FavoritesBar + RecentlyViewed + RegistrySyncProvider
- ✅ Hooks + SDK wrapper
- ✅ HMI login mockup
- ✅ Seed `MOCK_DATA_PNEUMATIC_AIR` loaded (1 plant, 11 items, 8 equipment, 7 skills, 4 operators, 3 tools, 3 recipes, 1 box-type, 6 attention-points, 8 cause-codes)

### PROMPT_3a — Workflow Designer Core (merged April 28-29, commits df41852..a836979)

**D1 — Domain logic** (commit `df41852`)
- ✅ `packages/domain/src/machines/workflow.machine.ts` — XState v5 machine, 3 states matching schema (`draft → approved → deprecated`)
- ✅ `packages/domain/src/rules/workflow.rules.ts` — `validateWorkflowStructure`, `canEdit`, `canTransition`
- ✅ +38 tests (14 machine + 24 rules)

**D2 — Workflow API** (commit `599fe05`)
- ✅ `apps/api/src/modules/workflows/` — module + repository + service + controller
- ✅ 12 REST endpoints: `GET/POST /api/workflows`, version sub-resources, soft-delete, audit, restore
- ✅ +17 service tests

**D3 — Web pages shell** (commit `25b50d0`)
- ✅ `apps/web/src/app/(registries)/workflows/page.tsx` — list page using RegistryListPage
- ✅ `apps/web/src/app/(registries)/workflows/new/page.tsx` — creation form (currently has TODO-009: Salva button silently fails)
- ✅ `apps/web/src/app/(registries)/workflows/[id]/page.tsx` — 4-pane editor shell with `react-resizable-panels`
- ✅ Sidebar entry "Flussi di lavoro"
- ✅ `WorkflowsClient` SDK + Zod schemas

**D4 — React Flow canvas** (commit `5663a07`)
- ✅ `@xyflow/react` + `@dagrejs/dagre` + `zustand` integrated
- ✅ Custom node types: `PhaseNode`, `GroupNode`, `StepNode` (color-coded by category, lock icon for `auto_generated`)
- ✅ Custom edge: `SequentialEdge`
- ✅ `WorkflowCanvas` with pan/zoom/minimap/controls
- ✅ Zustand store for nodes/edges/selectedNodeId
- ✅ Dagre auto-layout

**D5 — Palette + drag-drop + auto-save** (commit `1fc272a`)
- ✅ `WorkflowPalette` with draggable templates (6 Phase categories, Group, 3 Step categories)
- ✅ HTML5 drag-and-drop, creates new node in store on drop
- ✅ 30s debounced auto-save (`PATCH /api/workflows/:id/versions/:vid`)
- ✅ Visual feedback "Saving..." / "Saved at HH:mm"

**D6 — Step configurator forms** (commit `4f44f60`)
- ✅ 4 form components in `apps/web/src/components/workflow/forms/`:
  - `StepConfigurator.tsx` — router by step.category
  - `ProductionStepForm.tsx` — name, instructions, skillId, deviceId, standardTimeSec, isRequired
  - `QualityControlStepForm.tsx` — name, instructions, qcType (visual/dimensional/functional), thresholds
  - `ScanStepForm.tsx` — name, instructions, scanType (qr/serial/id), expectedPattern
- ✅ react-hook-form + Zod, inline validation
- ✅ Auto-save wiring (OPTION B: store callbacks + setNodes sync)
- ✅ Empty state for non-Step nodes
- ✅ `zod` added as direct dep of `apps/web`

### Verification evidence (April 29 evening)

- ✅ `pnpm install` — 640 packages added, 0 errors
- ✅ `pnpm build` (force, no cache) — 12 successful / 12 total
- ✅ `pnpm test` — **182 tests passed across 17 test files**, 0 failed (was 127 in PROMPT_2; +55 net from PROMPT_3a)
- ✅ `prisma migrate` — DB created, migration applied
- ✅ `pnpm seed` — all expected counts loaded
- ✅ `pnpm dev` — all 3 apps boot, web admin renders correctly
- ✅ `GET /api/items` — returns 11 items with full payload
- ✅ `localhost:3001/workflows` — list page renders
- ✅ `localhost:3001/workflows/[id]` — 4-pane layout, canvas xyflow visible, palette working
- ✅ `/workflows/[id]` bundle: **110 kB** (was 13.6 kB pre-canvas)

### Test breakdown (April 29)

| Package | Test files | Tests passed |
|---|---|---|
| `@mes/api` | 6 | 67 |
| `@mes/domain` | 5 | 67 |
| `@mes/schemas` | 3 | 29 |
| `@mes/cache` | 1 | 8 |
| `@mes/storage` | 1 | 6 |
| `@mes/queue` | 1 | 5 |
| **Total** | **17** | **182** |

API test files: pagination, items.service, operators.service, audit-log.service, auto-gen-rules.service, workflows.service.

Domain test files: box.machine, equipment.machine, work-order.machine, workflow.machine, workflow.rules.

---

## 🟡 Known issues (TODO list current)

See `TODO.md` for full details. Quick summary:

- **TODO-001** — Seed creates ~35 soft-deleted records (cosmetic)
- **TODO-002** — HMI logo broken in browser (cosmetic, asset path)
- **TODO-003** — 3 turbo warnings for placeholder packages (now expected: `echo no-op` build)
- **TODO-004** — Argon2id PIN hashing not exercised at integration level (deferred to PROMPT_5)
- **TODO-005** — Add CFRP workflow templates (post-MVP)
- **TODO-006** — Add Safety Devices workflow templates (post-MVP)
- **TODO-007** — D6 step forms accept qcThresholds and scanExpectedPattern but persist them only in node.data session state (Prisma model lacks a `config Json?` field; future work)
- **TODO-009** — `/workflows/new` Salva button silently fails (form submit not triggering mutation)

---

## 🚀 Roadmap — re-baselined April 29 evening

| Phase | Scope | Status | Time estimate |
|---|---|---|---|
| PROMPT_1 | Foundation | ✅ Done | — |
| PROMPT_2 | Registries (13 + audit + events + UI shell) | ✅ Done | — |
| **PROMPT_3a** | **Workflow Designer Core (canvas + 4-pane + 3 step forms)** | **✅ Done (April 29)** | — |
| PROMPT_3b | Advanced: 5 remaining step forms + validation panel + versioning UI + templates wizard + canvas polish | ⏭️ Next | 6-8h |
| PROMPT_4 | Auto-Generation Engine (7 rules) | ⏭️ Planned | 3-4h |
| PROMPT_5 | Execution HMI (PIN auth Argon2 + step renderer + parallel ops + recovery) | ⏭️ Planned | 4-5h |
| PROMPT_3c | WorkflowSnapshot + Live Preview 11 states + performance + E2E | ⏭️ Planned (after PROMPT_5) | 8-10h |
| PROMPT_6 | Dashboard & Reporting (OEE, Andon, KPI, export) | ⏭️ Planned | 3-4h |

**Realistic MVP target**: end of next week (May 8-9). Every PROMPT from now on uses the Definition of Done checklist (`prompts/DOD_TEMPLATE.md`) and is verified end-to-end with literal command output before being declared complete.

---

## 📋 Conventions (unchanged)

### Technical

- **Stack**: pnpm workspaces + Turborepo, React 18, Next.js 14, NestJS 10, TypeScript strict
- **DB**: SQLite local (NOT PostgreSQL), in-memory cache, sync queue, local filesystem
- **Auth**: Argon2id for PIN/password, **NEVER bcrypt**
- **State machines**: XState v5
- **Validation**: Zod (FE+BE shared schemas)
- **Real-time**: Socket.IO (event gateway)
- **Workflow Designer**: `@xyflow/react` + `@dagrejs/dagre` + Zustand + react-hook-form + Zod

### Compliance

- IATF 16949 → audit log 15+ years, lot genealogy bidirectional
- GDPR → operator data minimization, soft delete only
- ECE-R104 (Safety Devices) → reflectance thresholds, homologation cert validity
- 21 CFR Part 11 → electronic signatures (planned for HMI execution in PROMPT_5)

### Tone & format (for Claude)

- Direct and pragmatic, no long preambles
- Explicit recommendations, not just option lists
- Stack-aligned (no Material UI, no Bootstrap, no styled-components)
- Italian for explanations, English for code and comments
- For manufacturing compliance, flag relevant requirements (FDA 21 CFR Part 11, GMP, IATF, ECE)

---

## ⚠️ Lessons learned (consolidated)

### From April 28 (PROMPT_2 recovery)

1. **Trust the filesystem, not the agent's narrative.** Always verify with `git log`, `pnpm test`, `curl /api/<endpoint>`.
2. **No PROMPT is "done" without DoD compliance.** Every claim paired with literal command output.
3. **Worktrees must be inspected before each session.** `git status` from inside any worktree before declaring "nothing was done".
4. **Server processes outlive sessions.** Pre-flight check `netstat -ano` mandatory.
5. **`.env` is project-local secret.** Both root `.env` and `packages/prisma/.env` required.

### From April 28-29 (PROMPT_3a fixes)

6. **`pnpm test` is not enough.** vitest tolerates patterns that `tsc` and `ts-node` reject. The DoD now requires `pnpm build` + `pnpm dev` smoke as mandatory gates (see DOD_TEMPLATE.md).
7. **`prisma generate` is per-worktree.** Each pnpm worktree has its own `.pnpm` store; the Prisma client must be regenerated independently in each.
8. **Internal workspace imports must NOT use `.js` extensions.** ts-node CommonJS does not rewrite `.js → .ts` at resolution time. Tooling that does (vitest+esbuild, tsc) tolerates; ts-node does not.
9. **Workspace package consumers depend on built `dist/`.** When a package's `package.json` declares `"main": "./dist/index.js"`, the consumer (e.g., `apps/api`) requires that the package be built first. `pnpm build` from root usually handles this via Turbo dependency graph, but per-package builds may need explicit ordering.

### From April 29 (PC migration)

10. **PATH state is fragile on Windows.** Group policy / IT tools may reset PATH on login. Re-applying `$env:Path = ... User + Machine` is sometimes needed at session start.
11. **`corepack` shipped with Node 20.18 has known signature verification bugs.** Bypass: `npm install -g pnpm@9.15.9` directly.
12. **Pre-flight check** for every new session:
   ```powershell
   git status
   git log --oneline | Select-Object -First 5
   git worktree list
   git branch -a
   netstat -ano | findstr ":3000 :3001 :3002"
   ```

---

## 🗂️ Repo structure (verified post-PROMPT_3a)

```
RAMS-Reflexallen-MES/
├── apps/
│   ├── api/          ✅ 13 registry modules + audit-log + events + workflows
│   ├── web/          ✅ 21 routes (13 registries + workflow editor + new + trash + home)
│   └── hmi/          ✅ login mockup
├── packages/
│   ├── domain/       ✅ 4 XState machines + rules + 67 tests
│   ├── prisma/       ✅ 63 models, migration applied, dev.db seeded
│   ├── schemas/      ✅ 13 registry schemas + workflow schema
│   ├── sdk/          ✅ base-registry client + 13 registry clients + workflows client
│   ├── types/        ✅ 11 enum files
│   ├── ui/           ✅ 16 base + 8 Tier-2 primitives
│   ├── cache/        ✅ in-memory placeholder + 8 tests + echo no-op build
│   ├── queue/        ✅ sync placeholder + 5 tests + echo no-op build
│   └── storage/      ✅ local fs placeholder + 6 tests + echo no-op build
├── design-system/    (Reflexallen handoff bundle, brand SVGs, fonts)
├── docs/             (specs + extensions)
├── prompts/          (PROMPT_1 + PROMPT_2 + PROMPT_3a + PROMPT_3b skeleton + PROMPT_3c skeleton + PROMPT_4-6 + DOD_TEMPLATE + archive)
└── scripts/          (PowerShell setup)
```

---

## 🎯 Next concrete action

**PROMPT_3b (Workflow Designer Advanced)** — to be detailed and launched in next session. See `prompts/PROMPT_3b_ADVANCED.md` (currently a skeleton, needs detailing based on actual D6 implementation patterns).

Scope outline:
- 5 remaining step category forms (LOGISTICS, SETUP, TEARDOWN, PARALLEL, RECOVERY)
- Validation panel with cross-step rules
- Versioning UI lifecycle (submit/approve/reject/publish modals)
- Templates wizard with Pneumatic Air seed
- Canvas polish (right-click menu, keyboard shortcuts, drag-to-reorder)

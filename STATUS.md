# RAMS-Reflexallen-MES — Project Status

> **Last update**: April 28, 2026, afternoon (post PROMPT_2 merge)
> **Repository**: https://github.com/antonellacolantuono-jpg/RAMS-Reflexallen-MES
> **Stack**: NestJS + Next.js 14 + Prisma SQLite + pnpm Turborepo + shadcn-style + Reflexallen design system

---

## 📜 Project history (April 28)

This project went through a confusing morning where a previous Claude Code session claimed PROMPT_2 was complete, but `git log` on `main` showed only the foundation commit. After investigation, the work was found uncommitted in a worktree (`claude/silly-keller-6e625c`). It was recovered, verified end-to-end, and merged into `main` in the afternoon. Lessons captured at the bottom of this document.

---

## ✅ Current state (verified April 28 afternoon)

### PROMPT_1 — Foundation (1 commit on main)

- ✅ Monorepo: pnpm workspaces + Turborepo, 13 packages in scope
- ✅ Apps boot: `apps/api` (NestJS, port 3000), `apps/web` (Next.js 14, port 3001), `apps/hmi` (Next.js 14, port 3002)
- ✅ `packages/types`: 11 enum files
- ✅ `packages/ui`: 16 base primitives (Badge, Button, Card, Dot, Drawer, Field, Input, KPI, Modal, PhaseBadge, Progress, Select, Skeleton, StatusBadge, Tabs, Toast)
- ✅ `packages/domain`: 3 XState v5 machines (Box, Equipment, WorkOrder) + 3 rule files + tests
- ✅ `packages/prisma`: 63 models including v1.2 modules (Equipment Mgmt, Maintenance, Tool Wear, Multi-output, Sample, FAI, WIP, Subassembly, Quality Hold, CFRP, Safety Devices), `AuditLog`, `DomainEvent`
- ✅ Placeholder packages: `@mes/cache` (8 ✓), `@mes/queue` (5 ✓), `@mes/storage` (6 ✓)

### PROMPT_2 — Registries (merged April 28 afternoon, commit b376142)

**API (apps/api)** — 13 NestJS modules with full CRUD:

- `items`, `equipment`, `operators`, `recipes`, `skills`, `cause-codes`, `attention-points`, `tools`, `box-types`, `boxes`, `bom`, `auto-gen-rules`
- Plus infrastructure modules: `audit-log`, `events` (Socket.IO gateway)
- `base-registry.controller.ts` + `base-registry.service.ts` (DRY pattern)
- Common pagination types + tests
- Pattern per registry: `GET / POST / PATCH / DELETE /:id /trash /:id/restore /:id/audit`

**Web admin (apps/web)** — 18 Next.js routes:

- 13 list pages under route group `(registries)`
- Items detail/edit/new sub-routes
- Trash page
- Sidebar navigation, FavoritesBar, RecentlyViewed, RegistrySyncProvider, QueryProvider
- Hooks: `useFavorites`, `useRecentlyViewed`, `useRegistrySync`, `useSavedFilters`
- SDK wrapper in `lib/sdk.ts`

**HMI (apps/hmi)**:

- Login mockup screen (`/`) with operator badge field

**Design system (packages/ui)** — 8 new Tier-2 primitives:

- `DataTable`, `EntityForm`, `EntityDetail`, `PageHeader`, `SearchBar`, `ActivityFeed`, `BulkActionBar`, `TrashBannerBar`
- Plus updates to existing primitives (Drawer, Modal, Field, Select, StatusBadge, Toast)

**Schemas (packages/schemas)** — Zod schemas under `registries/`:

- 13 schemas: `attention-point`, `auto-gen-rule`, `bom`, `box-type`, `box`, `cause-code`, `equipment`, `item`, `operator`, `recipe`, `skill`, `tool`, plus `common.ts`
- 1 test file (`item.schema.test.ts`)

**SDK (packages/sdk)**:

- `base-registry.client.ts` + `registry-clients.ts` for type-safe API consumption from frontend

**Seed (packages/prisma/seed.ts)** — `MOCK_DATA_PNEUMATIC_AIR` loaded:

- 1 Plant (PLT-RFA-MO-001)
- 7 Skills (EXT, ASSY, QC, TEST, PACK, FORKLIFT, WAREHOUSE)
- 4 Operators (OP-001 to OP-004)
- 11 Items (CONS-, COMP-, RM-, FG- prefixes per MOCK_DATA spec)
- 1 BOM with 5 lines for FG-PNEU-5M-8MM
- 8 Equipment nodes (AREA-PNEU, WC-EXT-01, WC-CRIMP-01, WC-LEAK-01, EQ-EXT-01A/B, EQ-CRIMP-01A, EQ-LEAK-01A)
- 3 Tools, 3 Recipes, 1 BoxType, 6 AttentionPoints, 8 CauseCodes

### Verification evidence (April 28 afternoon)

- ✅ `pnpm install` — 294 packages added, 0 errors
- ✅ `pnpm build` (force, no cache) — 12 successful / 12 total in 42.984s
- ✅ `prisma migrate dev --name init` — DB created at `packages/prisma/dev.db`, migration `20260427203303_init` applied, Prisma Client generated
- ✅ `pnpm --filter @mes/prisma run db:seed` — all expected counts loaded (1 Plant, 7 Skills, 4 Operators, 11 Items, ...)
- ✅ `pnpm dev` — all 3 apps start without errors, API logs show all 13 controllers mounted with full CRUD routes
- ✅ `GET http://localhost:3000/api/items` — returns `{"data":[...11 items...],"total":11,"page":1,"limit":25,"totalPages":1}` with full payload (itemType, trackingMode, uom, plantId, audit fields)
- ✅ `http://localhost:3001/tools` — sidebar navigation works, design system applied, OKLCH tokens, Avenir Next Cyr font, accent violet
- ✅ `http://localhost:3002` — HMI login mockup renders with operator badge field

---

## 🟡 Known issues to address post-merge

1. **Seed creates ~35 soft-deleted records as side effect.** Tools/Recipes/BOM/Equipment nodes appear empty in their list pages but visible in `/trash`. The seed script seems to insert some records with a non-null `deletedAt`. Cosmetic but confusing. **Owner**: small fix patch (PROMPT_2.5).

2. **Test count not yet verified against STATUS.md original claim of 90.** Real `pnpm test` execution post-merge to be measured, with real numbers replacing aspirational ones.

3. **HMI logo image is a broken link** (alt text "Reflexallen" visible). Asset path mismatch in `apps/hmi/app/page.tsx`. Trivial fix.

4. **3 turbo warnings** for `@mes/cache`, `@mes/queue`, `@mes/storage` packages: "no output files found for task". Missing `outputs` key in `turbo.json` for these placeholder packages. Cosmetic.

5. **Argon2id PIN hashing for operators is declared but not yet exercised** at integration level. Operator PINs in seed are likely placeholder strings. Verify on first real auth flow (PROMPT_5 HMI execution).

6. **prompts/PROMPT_1B.md is now obsolete.** It was created in the morning to "rebuild PROMPT_2 from scratch" before the worktree work was discovered. To be archived or repurposed as a reference for future foundation patches.

---

## 🚀 Roadmap — re-baselined

| Phase | Scope | Status | Time estimate |
|---|---|---|---|
| PROMPT_1 | Foundation | ✅ Done | — |
| PROMPT_2 | Registries (13 + audit + events + UI shell) | ✅ Done (April 28 afternoon) | — |
| PROMPT_2.5 | Cleanup: fix seed soft-delete bug, HMI logo, turbo warnings, real test count | ⏭️ Next | 1-2h |
| PROMPT_3 | Workflow Designer (visual editor drag&drop) | ⏭️ Planned | 4-6h |
| PROMPT_4 | Auto-Gen Engine (rules → concrete steps) | ⏭️ Planned | 3-4h |
| PROMPT_5 | Execution HMI (timer-driven steps, PIN auth, parallel ops) | ⏭️ Planned | 4-5h |
| PROMPT_6 | Dashboard & Reporting | ⏭️ Planned | 3-4h |

**Realistic MVP target**: end of next week (May 8-9). Every PROMPT from now on must use the Definition of Done checklist (`prompts/DOD_TEMPLATE.md`) and be verified end-to-end with literal command output before being declared complete.

---

## 📋 Conventions (unchanged)

### Technical

- **Stack**: pnpm workspaces + Turborepo, React 18, Next.js 14, NestJS 10, TypeScript strict
- **DB**: SQLite local (NOT PostgreSQL), in-memory cache, sync queue, local filesystem
- **Auth**: Argon2id for PIN/password, **NEVER bcrypt**
- **State machines**: XState v5
- **Validation**: Zod (FE+BE shared schemas)
- **Real-time**: Socket.IO (event gateway in `apps/api/src/modules/events/registry.gateway.ts`)

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

## ⚠️ Critical lessons learned (April 28)

1. **Trust the filesystem, not the agent's narrative.** A previous Claude Code session reported PROMPT_2 complete with 12 milestones, 90 passing tests, and 13 CRUD modules. Reality on `main` was 0 commits, 0 modules. The work existed in a worktree (`.claude/worktrees/silly-keller-6e625c/`) but was never committed. Always verify with: `git log --oneline | Measure-Object -Line`, `pnpm test` (capture real count), `curl /api/<endpoint>` (verify routes respond).

2. **No PROMPT is "done" without DoD compliance.** See `prompts/DOD_TEMPLATE.md`. Every claim must be paired with a literal command and its output. No paraphrasing. This rule is now active for PROMPT_3 and onward.

3. **Worktrees must be inspected before each session.** Claude Code Desktop creates `.claude/worktrees/*` and operates inside them. Work performed there does not appear on `main` unless explicitly committed and merged. Future audits should always check `git status` from inside any worktree before declaring "nothing was done".

4. **Server processes outlive sessions.** Always check `netstat -ano | findstr ":3000 :3001 :3002"` before starting `pnpm dev`. Stale processes were the original symptom that masked the bigger problem on April 28 morning.

5. **Run the right shell from the right directory.** PowerShell prompt always shows the current path — confirm before every multi-command block. Approximately 15 minutes were wasted on April 28 morning because the audit was run from the home directory instead of the repo root.

6. **`.env` is project-local secret.** Both root `.env` and `packages/prisma/.env` are required (Prisma CLI looks for `.env` next to `schema.prisma`). Both are gitignored. `.env.example` is committed as template.

---

## 🗂️ Repo structure (verified post-merge)

```
RAMS-Reflexallen-MES/
├── apps/
│   ├── api/          ✅ NestJS, 13 registry modules + audit-log + events
│   ├── web/          ✅ Next.js 14, 18 routes, sidebar shell, hooks, SDK wrapper
│   └── hmi/          ✅ Next.js 14, login mockup
├── packages/
│   ├── domain/       ✅ 3 XState machines + rules + tests
│   ├── prisma/       ✅ 63 models, migration applied, dev.db seeded
│   ├── schemas/      ✅ 13 registry schemas + common
│   ├── sdk/          ✅ base-registry client + 13 registry clients
│   ├── types/        ✅ 11 enum files
│   ├── ui/           ✅ 16 base + 8 Tier-2 primitives
│   ├── cache/        ✅ in-memory placeholder + 8 tests
│   ├── queue/        ✅ sync placeholder + 5 tests
│   └── storage/      ✅ local fs placeholder + 6 tests
├── design-system/    (Reflexallen handoff bundle)
├── docs/             (specs + extensions)
├── prompts/          (PROMPT_1-6 + patches + PROMPT_1B (obsolete) + DOD_TEMPLATE)
└── scripts/          (PowerShell setup)
```

---

## 🎯 Next concrete action

PROMPT_2.5 (cleanup) or directly PROMPT_3 (Workflow Designer). To be decided in next session.

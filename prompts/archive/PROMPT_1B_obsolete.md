> ⚠️ **OBSOLETE — DO NOT USE**

>

> This prompt was created on April 28, 2026 morning to "rebuild PROMPT_2 from scratch" because PROMPT_2 was believed to not exist. Later that afternoon, the actual PROMPT_2 work was found in worktree `claude/silly-keller-6e625c` (uncommitted) and merged into main as commit `b376142`.

>

> The 13 registries with CRUD, the 8 Tier-2 UI primitives, the seed, and the API endpoints described as "to be built" in this prompt **already exist** on main. Running this prompt would duplicate or conflict with existing work.

>

> Kept in `prompts/archive/` as a reference for future "foundation completion" patches and as a record of the morning of April 28 incident. See `STATUS.md` for the full lessons learned.

>

> ---



# PROMPT_1B — Foundation Completion \& Truth

> \\*\\*Predecessor\\*\\*: PROMPT\\_1 (initial foundation — partial)
> \\*\\*Goal\\*\\*: Close the gaps in PROMPT\\_1 so the foundation is verifiably complete and ready for PROMPT\\_2.
> \\*\\*Scope\\*\\*: Surgical. Do NOT introduce new features.
> \\*\\*Time budget\\*\\*: 1.5–2 hours
> \\*\\*Definition of Done\\*\\*: see `prompts/DOD\\_TEMPLATE.md`. All checks must pass before this prompt is closed.

\---

## Context (mandatory reading before starting)

After an audit on April 28, 2026, it was discovered that PROMPT_1 only partially delivered. Foundational packages (`types`, `ui`, `domain`, `prisma`, partial `schemas`) are present and solid, but the apps `apps/web` and `apps/hmi` have **no routes** (no `page.tsx`), and the schemas package has gaps. Read `STATUS.md` for the full reality check before starting.

A previous attempt at PROMPT_2 was reported complete in narrative but never written to disk — the entire `apps/api/src/modules/` folder contains only `config`, `health`, `prisma`. Do **not** recreate PROMPT_2 here. PROMPT_1B is strictly a foundation-completion patch.

\---

## Required deliverables

### D1 — Web admin minimum (`apps/web`)

**Goal**: turn the empty Next.js shell into a usable design-system showcase, ready to host registry pages in PROMPT_2.

* Verify `apps/web/app/layout.tsx` exists. If missing or scaffold-only, populate it with: HTML lang="it", `@mes/ui` Avenir Next Cyr font import, Tailwind base, and a slot for sidebar.
* Create `apps/web/app/page.tsx` as a **design system showcase**. Render every primitive from `@mes/ui` (16 components) with all relevant variants. Group by category (display, input, feedback, layout). Use Reflexallen OKLCH tokens. Heading: "Reflexallen RAMS — Design System".
* Create `apps/web/app/\\_components/Sidebar.tsx` with placeholder nav entries for the future registries (Items, Equipment, Operators, Recipes, Cause Codes — only these 5 for now). Each entry is disabled with a tooltip "available in PROMPT_2".
* Do **not** create `/items`, `/equipment`, etc. routes — PROMPT_2 scope.

**Verification at end of D1**:

* `curl -I http://localhost:3001` returns `200`.
* Visiting `localhost:3001` renders the showcase.

### D2 — HMI minimum (`apps/hmi`)

**Goal**: turn the empty Next.js shell into a touch-ready mockup login screen.

* Verify/create `apps/hmi/app/layout.tsx` with HMI-specific density (touch ≥44px, larger base font).
* Create `apps/hmi/app/page.tsx` as a **login mockup** — UI only, no auth logic:

  * Centered card, max-w-md
  * Title: "Reflexallen HMI"
  * PIN keypad (digits 0-9 + clear + enter), all buttons ≥56px (touch + gloves)
  * PIN field shows masked dots, no actual validation
  * Use `@mes/ui` primitives only
* Do **not** wire to API. Do **not** implement auth. Just the visual mockup.

**Verification at end of D2**:

* `curl -I http://localhost:3002` returns `200`.
* Visiting `localhost:3002` renders the keypad.
* All buttons measure ≥56px in DevTools.

### D3 — Schema completion (`packages/schemas`)

**Goal**: align the Zod schemas with the existing 63-model Prisma schema for the entities that PROMPT_2 will need.

Add the following schemas, mapped 1:1 to corresponding Prisma models, exported from `packages/schemas/src/index.ts`:

* `bom.schema.ts` (BOM + BOMLine)
* `recipe.schema.ts` (Recipe + RecipeVersion)
* `skill.schema.ts`
* `operator.schema.ts` (with PIN field validation: 4-8 digits, never the plain PIN — store hash only at the Prisma layer)
* `attention-point.schema.ts` (with i18n IT/EN fields)
* `cause-code.schema.ts`
* `tool.schema.ts`

Add a `.test.ts` next to each new schema that exercises:

* valid input passes
* missing required field fails
* invalid enum value fails (where applicable)
* `plantId` is required (multi-tenant enforcement at schema layer)

Do **not** add `bom`, `box-type`, `box`, `workflow`, `step` schemas yet — those are larger and belong in PROMPT_2/PROMPT_3.

**Verification at end of D3**:

* `pnpm --filter @mes/schemas test` passes all new tests.

### D4 — Prisma migration applied \& seed runnable

**Goal**: ensure the SQLite DB matches the 63-model schema and the seed runs.

1. Run `pnpm --filter @mes/prisma exec prisma migrate status`. If not in sync, generate and apply with `prisma migrate dev --name init`.
2. Locate or create the seed script per `MOCK\\_DATA\\_PNEUMATIC\\_AIR.md`. Wire it as `pnpm seed` in root `package.json`. Seed must be **idempotent** (use `prisma.<model>.upsert` keyed on stable business IDs, never on auto-increment ID).
3. Run the seed. Then verify counts:

   * 1 Plant
   * 7 Skills
   * 4 Operators
   * 11 Items
   * 8 EquipmentNodes
   * 3 Tools
   * 3 Recipes
   * 1 BoxType
   * 6 AttentionPoints
   * 8 CauseCodes

**Verification at end of D4**: a script or commands that count rows per table and report pass/fail. See DoD section D for exact commands.

### D5 — API smoke test

**Goal**: prevent the "AppModule has no modules wired" regression that happened with the fake PROMPT_2.

* Add `apps/api/test/app.bootstrap.spec.ts` (use whichever test framework is configured — if Jest is in `apps/api`, use Jest; if Vitest, use Vitest):

  * Bootstraps the **full** `AppModule` via `Test.createTestingModule({ imports: \\\[AppModule] }).compile()`
  * Calls `app.init()` and then `request(app.getHttpServer()).get('/health').expect(200)`
  * Asserts response body has `status: 'ok'`
* This test must run as part of `pnpm test`.

**Verification at end of D5**: `pnpm --filter @mes/api test` shows the new test passing.

### D6 — STATUS.md kept honest

After each deliverable D1-D5, update `STATUS.md` with the real outcome — not the plan. Each claim must reference the literal command + output that proves it. No aspirational tense ("will", "should be", "expected to").

\---

## Out of scope (do NOT do any of these in PROMPT_1B)

* ❌ Any NestJS module for registries (Items, Equipment, etc.) — that's PROMPT_2.
* ❌ Any CRUD endpoints, any API routes beyond `/health`.
* ❌ Real authentication, JWT, sessions, PIN verification logic.
* ❌ Socket.IO, audit logging service (the Prisma model alone is fine for now).
* ❌ New Prisma models — the 63 existing ones are enough.
* ❌ Design system tokens / typography changes — they're already correct.
* ❌ Any work in `apps/api/src/modules/` other than the smoke test in D5.

If the prompt seems to require something outside this list to "feel complete", **stop and ask** rather than expanding scope.

\---

## Definition of Done — paste output literally

Before claiming PROMPT_1B complete, run each command below and **paste the output verbatim** into the chat reply. No paraphrasing, no summarization. If any check fails, the prompt is not done.

### Build \& test

```powershell
pnpm build 2>\\\&1 | Select-Object -Last 15
pnpm lint 2>\\\&1 | Select-Object -Last 15
pnpm test 2>\\\&1 | Select-Object -Last 30
```

Capture: exit codes, last lines, total test count summary.

### Runtime (start `pnpm dev` in another terminal first, wait 30s)

```powershell
curl http://localhost:3000/health
curl -I http://localhost:3001
curl -I http://localhost:3002
```

All three must return 200.

### Data

```powershell
pnpm --filter @mes/prisma exec prisma migrate status
pnpm seed
```

Then count rows. If `sqlite3` CLI is not installed, use a small Node script or `prisma db execute --stdin`. Whatever method is used, paste the output showing counts for: `Plant`, `Skill`, `Operator`, `Item`, `EquipmentNode`, `Tool`, `Recipe`, `BoxType`, `AttentionPoint`, `CauseCode`.

### Git

```powershell
git status
git log --oneline
```

Status must be clean. Log must show D1-D6 commits in Conventional Commits format on top of the initial `656f369` commit.

\---

## Commit strategy

One commit per deliverable, atomic, on `main` (no PR for solo work):

* `feat(web): add design system showcase page and sidebar (D1)`
* `feat(hmi): add login mockup with PIN keypad (D2)`
* `feat(schemas): add 7 missing Zod schemas with tests (D3)`
* `feat(prisma): apply migration and wire idempotent seed (D4)`
* `test(api): add e2e smoke test bootstrapping AppModule (D5)`
* `docs: realign STATUS.md after PROMPT\\_1B (D6)`

Push at the end, after the DoD checks pass.

\---

## Final check before declaring done

* \[ ] STATUS.md reflects what was actually done, with literal command outputs in the prompt reply.
* \[ ] `git log --oneline` shows 7 commits total (initial + D1-D6).
* \[ ] `pnpm test` shows ≥40 tests passing across all packages.
* \[ ] `localhost:3001` and `localhost:3002` both render visible content.
* \[ ] No `apps/api/src/modules/<registry>` folders created (out of scope).

If any of the above is false, the prompt is **not done**.


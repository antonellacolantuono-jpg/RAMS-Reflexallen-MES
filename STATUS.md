# RAMS-Reflexallen-MES — Project Status

> **Last update**: April 28, 2026, afternoon (post-audit realignment)
> **Repository**: https://github.com/antonellacolantuono-jpg/RAMS-Reflexallen-MES
> **Stack**: NestJS + Next.js 14 + Prisma SQLite + pnpm Turborepo + shadcn-style + Reflexallen design system

---

## ⚠️ Status correction (April 28 afternoon)

The previous version of this document claimed PROMPT_2 was complete with 13 registries, 90 passing tests, and 12 milestones committed. **This was inaccurate.** A real audit on April 28 (`git log`, filesystem inspection, `pnpm test`) revealed:

- **1 commit** on `main`, not 12-13. Only the initial v1.2 foundation: `656f369 feat: initial v1.2 foundation`.
- **0 registries** built — none of the 13 NestJS modules exist on disk.
- **AppModule** imports only `ConfigModule`, `PrismaModule`, `HealthModule`. No registry modules wired up.
- **No `page.tsx`** in either `apps/web/app` or `apps/hmi/app` — apps bootstrap but render Next.js 404 on every URL.
- **Real test count** was not 90. Run on April 28 failed mid-way on a Prisma DLL lock; baseline once the lock is released is approximately 30-35 tests across `cache`, `queue`, `storage`, `domain`, `schemas`. Re-verification pending after PROMPT_1B.

This document is now realigned to ground truth. The project is at **end of PROMPT_1 (foundation, partial)**, not beginning of PROMPT_3.

---

## ✅ What actually exists on disk (verified April 28 audit)

### Solid

- ✅ Monorepo: pnpm workspaces + Turborepo, 13 packages in scope
- ✅ Apps boot: `apps/api` (NestJS, port 3000), `apps/web` (Next.js 14, port 3001), `apps/hmi` (Next.js 14, port 3002)
- ✅ `/health` endpoint returns `{"status":"ok","db":"sqlite",...}`
- ✅ `packages/types`: 11 enum files (`base`, `equipment`, `group`, `hold`, `item`, `lot`, `phase`, `recipe`, `step`, `user`, `work-order`)
- ✅ `packages/ui`: 16 primitives (`Badge`, `Button`, `Card`, `Dot`, `Drawer`, `Field`, `Input`, `KPI`, `Modal`, `PhaseBadge`, `Progress`, `Select`, `Skeleton`, `StatusBadge`, `Tabs`, `Toast`)
- ✅ `packages/domain`: 3 XState v5 machines (`box.machine`, `equipment.machine`, `work-order.machine`) + 3 rule files (`box.rules`, `lot.rules`, `work-order.rules`) + corresponding `.test.ts` files
- ✅ `packages/prisma`: 63 models including v1.2 modules (Equipment Mgmt, Maintenance, Tool Wear, Multi-output, Sample, FAI, WIP, Subassembly, Quality Hold, CFRP Mold/Cure/NDT, Safety Devices Reflectance/Homologation/Lamination), `AuditLog`, `DomainEvent`
- ✅ Placeholder packages with passing tests: `@mes/cache` (8 ✓), `@mes/queue` (5 ✓), `@mes/storage` (6 ✓)

### Partial

- 🟡 `packages/schemas`: 6 of expected ~15 schemas (`equipment`, `item`, `lot`, `plant`, `user`, `work-order`); only 2 have tests (`item`, `plant`)
- 🟡 `packages/domain`: state machine tests exist; pass count needs re-verification with a clean `pnpm test` after Prisma DLL lock is released
- 🟡 `packages/prisma`: schema defined; **migration status unverified** — SQLite `dev.db` may or may not be in sync with the 63-model schema

### Missing (PROMPT_1 declared but didn't deliver)

- ❌ `apps/web/app/page.tsx` — no homepage, no design system showcase
- ❌ `apps/web/app/layout.tsx` — likely missing or scaffold-only
- ❌ Sidebar navigation in web admin
- ❌ `apps/hmi/app/page.tsx` — no login screen
- ❌ Seed data execution — `MOCK_DATA_PNEUMATIC_AIR` script may exist but not verified runnable, and DB likely empty
- ❌ End-to-end smoke test that bootstraps `AppModule` (would have caught the mass-404 issue automatically)

---

## 🎯 Today's plan (April 28 afternoon)

### Phase A — STATUS truth (now, ~15 min)
- [x] Audit completed
- [ ] Replace STATUS.md with this honest version
- [ ] Commit `docs: realign STATUS.md to ground truth after audit`
- [ ] Push to origin

### Phase B — PROMPT_1B (1.5-2 hours in Claude Code Desktop)
Close the foundation gaps so PROMPT_2 can land on a verified base. See `prompts/PROMPT_1B.md`. Scope is surgical — no new features, only completion of what PROMPT_1 declared but didn't deliver.

### Phase C — Stop. Verify. Then PROMPT_2.
Before PROMPT_2 starts, validate Phase B against the Definition of Done checklist (`prompts/DOD_TEMPLATE.md`). Do not proceed unless every check passes with literal command output.

---

## 🚫 Roadmap — re-baselined honestly

The original "MVP entro fine settimana" target is **not realistic** given the gap between claimed and actual progress. Honest re-baseline:

| Phase | Scope | Time |
|---|---|---|
| PROMPT_1B | Foundation completion + truth | 1.5-2h |
| PROMPT_2 | Registries — **reduced scope: 5 critical** (Items, Equipment, Operators, Recipes, Cause Codes) instead of 13 | 4-5h |
| PROMPT_3 | Workflow Designer | 4-5h |
| PROMPT_4 | Auto-Gen Engine | 3h |
| PROMPT_5 | Execution HMI | 4h |
| PROMPT_6 | Dashboard & Reporting | 3h |

**Realistic MVP target**: end of next week (May 8-9) with reduced per-registry scope. Remaining 8 registries (BOM, Skills, Attention Points, Tools, Box Types, Boxes, Auto-Gen Rules, Workstations) shifted to post-MVP iteration.

Every PROMPT from now on must use the new Definition of Done and be verified end-to-end before claiming complete.

---

## 📋 Conventions (unchanged)

### Technical
- **Stack**: pnpm workspaces + Turborepo, React 18 + Vite + TS, Tailwind, shadcn-style primitives
- **DB**: SQLite local (NOT PostgreSQL), in-memory cache, sync queue, local filesystem
- **Auth**: Argon2id for PIN/password, **NEVER bcrypt**
- **State machines**: XState v5
- **Validation**: Zod (FE+BE shared schemas)
- **Real-time**: Socket.IO (planned, not yet built)

### Compliance
- IATF 16949 → audit log 15+ years, lot genealogy bidirectional
- GDPR → operator data minimization, soft delete only
- ECE-R104 (Safety Devices) → reflectance thresholds, homologation cert validity
- 21 CFR Part 11 → electronic signatures (planned for HMI execution)

### Tone & format (for Claude)
- Direct and pragmatic, no long preambles
- Explicit recommendations, not just option lists
- Stack-aligned (no Material UI, no Bootstrap, no styled-components)
- Italian for explanations, English for code and comments
- For manufacturing compliance, flag relevant requirements (FDA 21 CFR Part 11, GMP, IATF, ECE)

---

## ⚠️ Critical lessons learned (April 28)

1. **Trust the filesystem, not the agent's narrative.** Claude Code Desktop reported PROMPT_2 complete with 12 milestones; reality was 0 milestones. Always verify with: `git log --oneline | Measure-Object -Line`, `pnpm test` (capture real count), `curl /api/<endpoint>` (verify routes respond).

2. **No PROMPT is "done" without DoD compliance.** See `prompts/DOD_TEMPLATE.md`. Every claim must be paired with a literal command and its output. No paraphrasing.

3. **Server processes outlive sessions.** Always check `netstat -ano | findstr ":3000 :3001 :3002"` before starting `pnpm dev`. Stale processes were the original symptom that masked the bigger problem this morning.

4. **Run the right shell from the right directory.** Today wasted ~15 minutes because audit was run from the home directory (`C:\Users\antonella.colantuono.REFLEXALLEN`) instead of the repo root. PowerShell prompt always shows the current path — confirm before every multi-command block.

5. **Investigate suspicious git histories.** The audit revealed an unrelated git repo in the home directory with old RAMS commits. To investigate later — could contain salvageable work or could be a stale clone of a prior attempt.

---

## 🗂️ Repo structure (verified)

```
RAMS-Reflexallen-MES/
├── apps/
│   ├── api/          (NestJS, port 3000) — only Health module wired
│   ├── web/          (Next.js 14, port 3001) — NO routes yet
│   └── hmi/          (Next.js 14, port 3002) — NO routes yet
├── packages/
│   ├── domain/       ✅ 3 XState machines + rules + tests
│   ├── prisma/       ✅ 63 models, migration unverified
│   ├── schemas/      🟡 6 of ~15 Zod schemas
│   ├── sdk/          ⚠️ presence verified, content not audited
│   ├── types/        ✅ 11 enum files
│   ├── ui/           ✅ 16 primitives
│   ├── cache/        ✅ in-memory placeholder + tests
│   ├── queue/        ✅ sync placeholder + tests
│   └── storage/      ✅ local fs placeholder + tests
├── design-system/    (Reflexallen handoff bundle)
├── docs/             (specs + extensions)
├── prompts/          (PROMPT_1-6 + patches; PROMPT_1B and DOD_TEMPLATE to be added)
└── scripts/          (PowerShell setup)
```

---

**Next concrete action**: replace this file in repo, commit, push, then start PROMPT_1B in Claude Code Desktop.

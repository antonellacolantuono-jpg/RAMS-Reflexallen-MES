# TODO — RAMS-Reflexallen-MES

> **Purpose**: Track known issues and technical debt that cannot be fixed in the current session but must not be forgotten.
> **Owner**: Antonella
> **Last updated**: 2026-04-28

---

## How to use this file

- Each entry has a unique ID, severity, and a clear acceptance criterion.
- When fixing an entry, link the commit/PR that closes it and move it to the "Resolved" section.
- Add new entries at the top of the relevant severity bucket.
- Review this file before starting any new PROMPT session (part of pre-flight check).

---

## 🟠 High priority (should fix before MVP — May 8-9)

### TODO-001 — Seed creates ~35 soft-deleted records as side effect

**Discovered**: 2026-04-28 (afternoon, during PROMPT_2 verification)
**File**: `packages/prisma/seed.ts`
**Symptom**: After `pnpm --filter @mes/prisma run db:seed`, navigating to `localhost:3001/tools` (and `/recipes`, `/bom`, etc.) shows "Nessun elemento trovato" with a banner "X elementi eliminati". The cestino (`/trash`) shows ~35 records soft-deleted at the same timestamp as the seed.
**Hypothesis**: The seed script likely sets `deletedAt: <date>` on some records, or has a cleanup step that soft-deletes after creation. Needs reading.
**Acceptance criterion**:
- After fresh seed, every registry list page (`/tools`, `/recipes`, `/bom`, `/equipment`, `/operators`, `/skills`, `/cause-codes`, `/attention-points`, `/items`) shows the expected count from `MOCK_DATA_PNEUMATIC_AIR.md` with **zero** records in trash.
- Re-running seed is still idempotent (counts don't increase).
**Estimated effort**: 30-60 min (depends on root cause)
**Blocker for**: nothing currently (cosmetic). Could be relevant if PROMPT_3 needs to test workflows that consume tools/recipes — in that case fix first.

---

### TODO-002 — HMI logo broken in browser

**Discovered**: 2026-04-28 (afternoon, during PROMPT_2 verification)
**File**: `apps/hmi/src/app/page.tsx` (or wherever the login mockup renders the logo)
**Symptom**: On `localhost:3002`, the brand logo is shown as a broken image with alt text "Reflexallen" visible.
**Root cause confirmed**: Asset path mismatch. The SVG files exist correctly in `apps/hmi/public/brand/` (verified: 10 SVGs including `reflexallen-logomark-light.svg`, `rams-logo-light.svg`, etc.), but the `<img src="...">` in the page references a wrong path.
**Acceptance criterion**:
- Visiting `localhost:3002` shows the Reflexallen logo correctly rendered (not broken image icon).
- DevTools network tab shows 200 for the logo asset.
**Estimated effort**: 5-10 min (find the offending line, update the path)
**Blocker for**: nothing (cosmetic). Demo polish.

---

## 🟡 Medium priority (good to have)

### TODO-003 — Turbo warnings for placeholder packages

**Discovered**: 2026-04-28 (during `pnpm build`)
**File**: `turbo.json`
**Symptom**: `pnpm build` ends with 3 WARNING lines:
```
WARNING  no output files found for task @mes/cache#build. Please check your `outputs` key in `turbo.json`
WARNING  no output files found for task @mes/queue#build. Please check your `outputs` key in `turbo.json`
WARNING  no output files found for task @mes/storage#build. Please check your `outputs` key in `turbo.json`
```
**Root cause**: These three packages are placeholders (in-memory implementations) without a real build output. `turbo.json` declares a generic `build` task with `outputs` expectations that they don't satisfy.
**Acceptance criterion**:
- `pnpm build` ends with 0 warnings.
- Either: (a) the three packages produce a real build output (e.g., compiled JS); or (b) `turbo.json` exempts them from the `outputs` requirement via per-package config.
**Estimated effort**: 10-20 min
**Blocker for**: nothing (cosmetic).

---

### TODO-004 — Argon2id PIN hashing not exercised at integration level

**Discovered**: 2026-04-28 (during PROMPT_2 verification)
**File**: `packages/prisma/seed.ts` + future `apps/api/src/modules/auth/`
**Symptom**: Operators are seeded with PIN values (likely placeholder or plaintext). The `argon2` package is installed and declared as a dependency, but no actual hashing has been verified to work end-to-end.
**Acceptance criterion** (deferred to PROMPT_5):
- Seed stores Argon2id hash in DB, never plain PIN.
- Login flow (HMI) verifies PIN against hash with `argon2.verify()`.
- A unit test exercises `argon2.hash` + `argon2.verify` round-trip.
**Estimated effort**: implicit in PROMPT_5 scope
**Blocker for**: HMI auth flow (PROMPT_5).

---

### TODO-005 — Add CFRP workflow templates to Workflow Designer

**Discovered**: 2026-04-29 (planning PROMPT_3)
**File**: `packages/prisma/seed.ts` + future Workflow Designer templates
**Spec source**: `docs/extensions/CFRP_MODULE.md`, `docs/extensions/WORKFLOW_CFRP.md`, `docs/extensions/WORKFLOW_CFRP_DETAILED.md`
**Symptom**: PROMPT_3a (Workflow Designer Core) ships with templates and seed data only for Pneumatic Air. CFRP-specific workflows (Mold management, Out-time tracking, Cure Cycles, NDT, prepreg roll lifecycle) are not yet usable in the designer.
**Acceptance criterion**:
- Seed adds at least one mock CFRP item (e.g., `MC-FAIRING-001`), one mock Mold, one Cure Cycle Recipe.
- Workflow Designer "New from Template" wizard offers "CFRP — Standard Lamination" template.
- Process Engineer can create a CFRP workflow that includes: prepreg checkout → layup → vacuum bag → autoclave cure → NDT.
- All ECE/IATF compliance fields (out-time tracking, cure cycle telemetry references) are configurable per step.
**Estimated effort**: 4-6 hours (likely PROMPT_3b or a separate PROMPT_3.5)
**Blocker for**: full MVP coverage of CFRP production line.

---

### TODO-006 — Add Safety Devices workflow templates to Workflow Designer

**Discovered**: 2026-04-29 (planning PROMPT_3)
**File**: `packages/prisma/seed.ts` + future Workflow Designer templates
**Spec source**: `docs/extensions/SAFETY_DEVICES_MODULE.md`, `docs/extensions/WORKFLOW_SAFETY_DEVICES.md`, `docs/extensions/WORKFLOW_SAFETY_DEVICES_DETAILED.md`
**Symptom**: PROMPT_3a (Workflow Designer Core) ships with templates and seed data only for Pneumatic Air. Safety Devices workflows (reflective film lamination, reflectance testing, homologation cert checks, aging tests, ECE-R104 compliance) are not yet usable in the designer.
**Acceptance criterion**:
- Seed adds at least one Safety Device item, one Reflective Film Roll, one Homologation Certificate, one Reflectance Test record.
- Workflow Designer "New from Template" wizard offers "Safety Device — Reflective Lamination" template.
- Process Engineer can create a Safety Device workflow that includes: film checkout → lamination → reflectance test → cross-cut adhesion test → ECE certification.
- ECE-R104 reflectance threshold values are wired into the QC step configuration.
**Estimated effort**: 4-6 hours (likely PROMPT_3b or a separate PROMPT_3.5)
**Blocker for**: full MVP coverage of Safety Devices production line.

---

## 🟢 Low priority (nice to have)

_No entries yet._

---

## ✅ Resolved

_No entries yet._

---

## 📋 Process

When fixing a TODO entry:

1. Implement the fix on a feature branch (or directly on main for solo dev).
2. Verify the acceptance criterion with the literal commands listed.
3. Move the entry from its priority bucket to `## ✅ Resolved`, adding:
   - Resolution date
   - Commit hash that closed it
   - Brief note on root cause (if useful for the future)
4. Commit `chore: resolve TODO-XXX` (or include as part of a larger commit if related to a feature).

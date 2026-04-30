# Definition of Done — Universal Template

> **Use**: Attach this document to every PROMPT_X you give to Claude Code Desktop (or any agent). The prompt is "done" only when **all** the checks below are TRUE and the output is **pasted literally** into the chat reply.
> **Why this exists**: On April 28, 2026, PROMPT_2 was reported as complete with 12 milestones, 90 passing tests, and 13 CRUD modules — when in reality 0 commits and 0 modules existed on disk. Then on April 28-29, a series of "vitest tolerated, tsc/ts-node did not" regressions surfaced one by one. The only defense is mechanical, output-grounded verification on multiple build/runtime gates.
> **Last updated**: 2026-04-29 (post-PROMPT_3a)

---

## Core principle

**Every claim must be paired with a literal command and its output.** No paraphrasing, no summarization, no "looks good", no "all tests pass". If you cannot back a claim with a command output pasted verbatim, the claim is not allowed.

This applies equally to the agent that does the work and to the human who reviews it.

---

## How to use this checklist

1. Run each command in the listed order.
2. Paste the **literal output** (not a summary) into the chat reply or session log.
3. Tick the box only if the output matches the expected pattern.
4. If any box cannot be ticked honestly, the prompt is not done — stop, report, and fix.

---

## A. Test reality

```powershell
pnpm test 2>&1 | Select-Object -Last 30
```

- [ ] All packages report success (no `Failed:` lines, no `ELIFECYCLE` errors).
- [ ] Total test count matches expectation: **____** tests pass. (Paste the summary line, e.g. `Tests: 145 passed (145)`)
- [ ] Test count is at least equal to the previous baseline (no test was silently removed).
- [ ] No skipped tests:
  ```powershell
  Select-String -Path packages,apps -Pattern "it\.skip|describe\.skip|xit\(|xdescribe\(" -Recurse
  ```
  Must return nothing (or only matches in `node_modules`, which can be excluded).

For domain logic specifically (per `TESTING_STRATEGY.md`, target ≥95% coverage):
```powershell
pnpm --filter @mes/domain test --coverage 2>&1 | Select-Object -Last 20
```
- [ ] Domain coverage ≥ 95%.

---

## B. Build reality (vitest is not enough — tsc must pass too)

⚠️ **Why this gate matters**: vitest uses esbuild which tolerates many TypeScript strict violations that `tsc` (used by `pnpm build`) and `ts-node` (used by `pnpm dev`) reject. Several regressions in PROMPT_3a surfaced only at this gate (TS4114 missing override, TS2379 exactOptionalPropertyTypes, TS2532 possibly undefined, TS2307 cannot find module).

```powershell
pnpm build 2>&1 | Select-Object -Last 15
pnpm lint 2>&1 | Select-Object -Last 15
```

- [ ] `pnpm build` exits with code 0.
- [ ] `pnpm lint` exits with code 0.
- [ ] All workspace packages built (any `Failed: @mes/...` line is a violation).

For each workspace package modified in this prompt (replace `<package>`):
```powershell
pnpm --filter @mes/<package> build 2>&1 | Select-Object -Last 10
```
- [ ] No `error TS` in output.
- [ ] No build artifacts missing (no `WARNING no output files found` if the package is supposed to emit a `dist/`).

```powershell
git diff origin/main --stat
```

- [ ] No new `// @ts-ignore`, `// eslint-disable`, or `as any` introduced in production code.
- [ ] No new `TODO` comments without an associated GitHub issue or `XXX` markers.

---

## C. Runtime reality (`pnpm dev` smoke is mandatory)

⚠️ **Why this gate matters**: `pnpm dev` uses ts-node (for the API) and Next.js dev server (for web/hmi). ts-node compiles TypeScript on the fly and is **stricter** than vitest in some specific ways (e.g., it does not rewrite `.js` → `.ts` at module resolution; it enforces `noImplicitOverride`). Several regressions in PROMPT_3a surfaced only at this gate.

Start the dev environment in a separate shell:
```powershell
pnpm dev
```

Wait ~30-60 seconds for all three apps to be ready. The expected log lines are:
- `API running on http://localhost:3000` (NestJS)
- `✓ Ready in Xs` for both web (3001) and hmi (3002)

- [ ] All 3 apps log "ready" without TypeScript errors during boot.
- [ ] No `TSError` or `Cannot find module` in the API startup log.
- [ ] No `Build failed` in the web/hmi startup logs.

Then in another shell:
```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-WebRequest -UseBasicParsing http://localhost:3001 | Select-Object StatusCode
Invoke-WebRequest -UseBasicParsing http://localhost:3002 | Select-Object StatusCode
```

- [ ] `/api/health` returns valid JSON containing `"status":"ok"`.
- [ ] Web (3001) returns HTTP 200.
- [ ] HMI (3002) returns HTTP 200.

For **every new API resource** introduced in this prompt (replace `<resource>`):
```powershell
Invoke-RestMethod http://localhost:3000/api/<resource>
```
- [ ] Returns expected JSON shape — paste it.
- [ ] Returns expected count — paste it.

For **every new web/HMI route** introduced:
```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:3001/<route> | Select-Object StatusCode
Invoke-WebRequest -UseBasicParsing http://localhost:3002/<route> | Select-Object StatusCode
```
- [ ] Returns 200 (not 404).

---

## D. Data reality

```powershell
pnpm --filter @mes/prisma exec prisma migrate status
```
- [ ] Schema is in sync with migrations. No "drift detected" message.

```powershell
pnpm --filter @mes/prisma exec prisma generate
```
- [ ] Prisma Client regenerated cleanly (no errors).
- [ ] **Note**: must be run **per worktree** in pnpm setups — each worktree has its own `.pnpm` store. Running `prisma generate` from main does NOT affect a worktree's client.

For **every entity touched by seed/test data** in this prompt:

If `sqlite3` CLI is available:
```powershell
sqlite3 packages/prisma/prisma/dev.db "SELECT COUNT(*) FROM <Table>;"
```

Otherwise, use a small Node script or:
```powershell
pnpm --filter @mes/prisma exec prisma db execute --stdin
# then paste: SELECT COUNT(*) FROM "<Table>";
```

- [ ] Each count matches expected value (paste expected vs actual side-by-side).
- [ ] Re-running `pnpm seed` is idempotent — counts do not increase on second run.

---

## E. Git reality

```powershell
git status
git log --oneline | Select-Object -First 25
```

- [ ] Working tree clean (no untracked, no modified, no staged).
- [ ] Each milestone has its own atomic commit (one feature/deliverable = one commit).
- [ ] Commit messages follow Conventional Commits prefix: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`, `perf:`, `style:`.
- [ ] Branch pushed to `origin`:
  ```powershell
  git status -sb
  ```
  Must show `## main...origin/main` with no `[ahead N]`.

```powershell
git diff --stat origin/main..HEAD
```
- [ ] Only files within the prompt's declared scope appear in the diff.
- [ ] No `schema.prisma` modifications unless explicitly approved.
- [ ] No "scope creep" files (other registry modules, unrelated config files) — if any extra file appears, the agent must justify before commit.

---

## F. Documentation reality

- [ ] `STATUS.md` updated with the **real** state, no aspirational language. Banned phrases: "will", "should be", "expected to", "planned for this prompt". Allowed: "is", "is not", "did", "did not".
- [ ] Each claim in `STATUS.md` has a corresponding command + output in the prompt session log.
- [ ] No claim is made about a feature that wasn't built and verified.
- [ ] If the prompt scope changed mid-session, the change is documented (what was added/removed and why).
- [ ] `TODO.md` updated: any new known issue discovered during this prompt is added; nothing removed unless that exact issue was resolved (and then moved to "Resolved" with commit hash).

---

## Anti-patterns that automatically invalidate the DoD

These are red flags. If you see them in the agent's reply or in your own work, the DoD is **not** met:

- ❌ "All registry CRUD endpoints work" without a `curl` per endpoint.
- ❌ "Tests pass" without the literal pass/fail summary line from the test runner.
- ❌ "Build is clean" without `pnpm build` exit code shown.
- ❌ "Seed data loaded" without a `SELECT COUNT(*)` per affected table.
- ❌ "App renders correctly" without an HTTP status code or screenshot.
- ❌ "I think it works" — feelings are not evidence.
- ❌ Editing `STATUS.md` to describe deliverables in past tense before they're committed.
- ❌ Claims about test counts without running tests in the same session.
- ❌ "Out of scope" used to justify skipping a deliverable that was in the prompt.
- ❌ Using vitest as the only build verification — must include `pnpm build` AND `pnpm dev` start.
- ❌ Claiming `pnpm dev` is fine because `pnpm build` passes — they have different compile paths (esbuild vs tsc vs ts-node) and one can pass while another fails.

---

## Pre-flight check (mandatory at start of every session)

Before any task on the project, run these 5 commands and confirm output is healthy:

```powershell
git status                                           # working tree clean?
git log --oneline | Select-Object -First 5           # recent commits?
git worktree list                                    # any orphaned worktree?
git branch -a                                        # any leftover branch?
netstat -ano | findstr ":3000 :3001 :3002"           # zombie servers?
```

If any of these shows something unexpected, **STOP and investigate** before proceeding. This pre-flight check exists because on April 28, 2026, hours were lost when work was thought to be missing but actually existed in an uncommitted worktree.

For a fresh PC setup or a long-paused project, also run:
```powershell
node --version    # expected v20.x LTS
pnpm --version   # expected 9.15.9 (or as pinned in repo)
git --version
```

If `node`/`pnpm`/`git` is "not recognized", the PATH may need re-loading:
```powershell
$env:Path = [Environment]::GetEnvironmentVariable("Path", "User") + ";" + [Environment]::GetEnvironmentVariable("Path", "Machine")
```

---

## Final gate (human review)

Before merging or pushing, the human reviewer (Antonella) independently verifies at least these:

1. Read the literal command outputs in the chat reply.
2. Cross-reference against the deliverable list in the prompt.
3. Run `git log --oneline` and `pnpm test` herself, in her own terminal.
4. For at least one new endpoint or page, run `curl` (or `Invoke-RestMethod`) herself.
5. **Run `pnpm build` herself, on main after merge, to catch the "vitest tolerated, tsc rejected" pattern.**
6. **Briefly run `pnpm dev` (30 seconds) to confirm the API starts cleanly.**

Only if all six checks pass is the prompt accepted as done. If the chat reply does not include literal command outputs for every section, the prompt is **not done**, regardless of what the agent claims.

---

## Why this is non-negotiable

- A "false complete" wastes more time than a "real incomplete". On April 28, 2 hours were spent debugging a non-existent PROMPT_2 because the previous agent claimed completion without verification.
- Then on April 28-29, an additional ~6 hours were spent fixing a chain of "vitest tolerated, tsc/ts-node rejected" regressions (TS4114 override, TS2379 exactOptional, TS2307 cannot find module, .js extensions). Each one passed `pnpm test` but failed `pnpm build` or `pnpm dev`.
- Manufacturing software (per IATF 16949, FDA 21 CFR Part 11, ECE-R104) requires **demonstrable evidence** of every claim. The DoD is a microcosm of that requirement at the build-time level.
- The cost of running the DoD is ~10-15 minutes per prompt. The cost of skipping it is hours of misaligned work and trust erosion.

---

## Change log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-28 | Initial template — created after PROMPT_2 false-completion incident. |
| 1.1 | 2026-04-29 | Added section B (`pnpm build`) + section C (`pnpm dev` runtime smoke) as mandatory gates. Added per-worktree `prisma generate` reminder. Expanded anti-patterns. Added pre-flight check section. Added "Why this gate matters" notes for B and C. Updated final human review to 6 steps (added build + dev smoke on main post-merge). Added lessons from PROMPT_3a regression chain. |

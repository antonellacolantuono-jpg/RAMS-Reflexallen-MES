# Definition of Done — Universal Template

> **Use**: Attach this document to every PROMPT_X you give to Claude Code Desktop (or any agent). The prompt is "done" only when **all** the checks below are TRUE and the output is **pasted literally** into the chat reply.
> **Why this exists**: On April 28, 2026, PROMPT_2 was reported as complete with 12 milestones, 90 passing tests, and 13 CRUD modules — when in reality 0 commits and 0 modules existed on disk. The only defense is mechanical, output-grounded verification.

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

## B. Build reality

```powershell
pnpm build 2>&1 | Select-Object -Last 10
pnpm lint 2>&1 | Select-Object -Last 10
```

- [ ] `pnpm build` exits with code 0.
- [ ] `pnpm lint` exits with code 0.

```powershell
git diff origin/main --stat
```

- [ ] No new `// @ts-ignore`, `// eslint-disable`, or `as any` introduced in production code.
- [ ] No new `TODO` comments without an associated GitHub issue or `XXX` markers.

---

## C. Runtime reality

Start the dev environment in a separate shell:
```powershell
pnpm dev
```

Wait ~30 seconds for all three apps to be ready. Then in another shell:

```powershell
curl http://localhost:3000/health
curl -I http://localhost:3001
curl -I http://localhost:3002
```

- [ ] `/health` returns valid JSON containing `"status":"ok"`.
- [ ] Web (3001) returns HTTP 200.
- [ ] HMI (3002) returns HTTP 200.

For **every new API resource** introduced in this prompt (replace `<resource>`):
```powershell
curl http://localhost:3000/api/<resource>
```
- [ ] Returns expected JSON shape — paste it.
- [ ] Returns expected count — paste it.

For **every new web/HMI route** introduced:
```powershell
curl -I http://localhost:3001/<route>
curl -I http://localhost:3002/<route>
```
- [ ] Returns 200 (not 404).

---

## D. Data reality

```powershell
pnpm --filter @mes/prisma exec prisma migrate status
```
- [ ] Schema is in sync with migrations. No "drift detected" message.

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

---

## F. Documentation reality

- [ ] `STATUS.md` updated with the **real** state, no aspirational language. Banned phrases: "will", "should be", "expected to", "planned for this prompt". Allowed: "is", "is not", "did", "did not".
- [ ] Each claim in `STATUS.md` has a corresponding command + output in the prompt session log.
- [ ] No claim is made about a feature that wasn't built and verified.
- [ ] If the prompt scope changed mid-session, the change is documented (what was added/removed and why).

---

## Anti-patterns that automatically invalidate the DoD

These are red flags. If you see them in the agent's reply or in your own work, the DoD is **not** met:

- ❌ "All registry CRUD endpoints work" without a `curl` per endpoint.
- ❌ "Tests pass" without the literal pass/fail summary line from the test runner.
- ❌ "Seed data loaded" without a `SELECT COUNT(*)` per affected table.
- ❌ "App renders correctly" without an HTTP status code or screenshot.
- ❌ "Build is clean" without `pnpm build` exit code shown.
- ❌ Editing `STATUS.md` to describe deliverables in past tense before they're committed.
- ❌ Claims about test counts without running tests in the same session.
- ❌ "Out of scope" used to justify skipping a deliverable that was in the prompt.

---

## Final gate (human review)

Before merging or pushing, the human reviewer (Antonella) independently verifies at least these:

1. Read the literal command outputs in the chat reply.
2. Cross-reference against the deliverable list in the prompt.
3. Run `git log --oneline` and `pnpm test` herself, in her own terminal.
4. For at least one new endpoint or page, run `curl` herself.

Only if all four checks pass is the prompt accepted as done. If the chat reply does not include literal command outputs for every section, the prompt is **not done**, regardless of what the agent claims.

---

## Why this is non-negotiable

- A "false complete" wastes more time than a "real incomplete". On April 28, 2 hours were spent debugging a non-existent PROMPT_2 because the previous agent claimed completion without verification.
- Manufacturing software (per IATF 16949, FDA 21 CFR Part 11, ECE-R104) requires **demonstrable evidence** of every claim. The DoD is a microcosm of that requirement at the build-time level.
- The cost of running the DoD is ~10 minutes per prompt. The cost of skipping it is hours of misaligned work and trust erosion.

---

## Change log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-28 | Initial template — created after PROMPT_2 false-completion incident. |

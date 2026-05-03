# RAMS-Reflexallen-MES — Project Status

> **Last update**: May 3, 2026 (PROMPT_PNE_SEED_CLEANUP applied — post F1 hotfix, 744 tests)
> **Repository**: https://github.com/antonellacolantuono-jpg/RAMS-Reflexallen-MES
> **Stack**: NestJS + Next.js 14 + Prisma SQLite + pnpm Turborepo + shadcn-style + Reflexallen design system

---

## 🩹 Hotfix — PROMPT_PNE_SEED_CLEANUP (post F1 close, May 3, 2026)

Re-designed `wf-pneumatic-air-680-v1` seed to align the operator-facing flow with the D5 RecoveryFlow / D4.2 HMIScrapForm runtime. The original PNE_2 seed modelled recovery as inline `[REC-LEAK-*]` / `[REC-CAM-*]` step rows in the linear workflow — once D4 shipped the inline recovery panel + scrap modal, the seeded steps started competing with the modal flow and confusing the operator (HMI showed `[STEP-LEAK-003]` blocked then auto-advanced to `[REC-LEAK-ATT-2]` instead of opening the recovery panel).

### Scope (revised vs spec)

The original spec aimed at a full Production phase restructure (Setup / Production / Outbound / Teardown auto-gen) with `recoveryConfig` persisted on the seed. Three pre-flight surprises forced a smaller, honest scope (decisions D-A through D-D documented mid-session):

- **D-A** Drop `recoveryConfig` persistence from seed entirely. The `Step` schema has no JSON column, and the HMI runtime never reads `recoveryConfig` (it's a workflow-editor-only convention from D4.1). Persistence + DTO projection + runtime read + pre-retry execution all deferred to PROMPT_7 (TODO-040 extended below).
- **D-B** Keep the existing 4-phase split (Final Assembly / Leak Test / Camera Test / Imballaggio). No restructure to Setup/Production/Outbound/Teardown — too risky for the demo.
- **D-C** Accept that pre-retry step ref execution at "Riprova" click is NOT implemented. Refs appear in the workflow editor for the process engineer; runtime falls back to direct device cycle re-launch.
- **D-D** Use `name.match(/Recovery/i)` as the HMI page filter signal — same convention `PNE_WORKFLOW_V1_COUNTS.recoveryGroups` already uses.

### Changes

- **Seed** `packages/prisma/seed/pneumatic-data/workflow-v1.ts`:
  - Removed 8 inline recovery steps: REC-LEAK-DIAG, REC-LEAK-ATT-1, REC-LEAK-ATT-2, REC-LEAK-SCRAP, REC-CAM-DIAG, REC-CAM-ATT-1, REC-CAM-ATT-2, REC-CAM-SCRAP.
  - Replaced with 2 dedicated "refs only" groups holding 3 hidden steps (category=`recovery`):
    - B2 — Leak Recovery (refs): STEP-LEAK-RECOVERY-CHECK + STEP-LEAK-RECOVERY-CLEAN
    - C2 — Camera Recovery (refs): STEP-CAM-RECOVERY-CLEAN
  - Added new group C3 — Conformity Check with STEP-CONFORMITY-001 (binary manual_choice: Conforme / Non conforme).
  - Updated STEP-LEAK-007 + [3.3] decision step instructions to reference the D5 RecoveryFlow inline panel + D4.2 HMIScrapForm modal (no longer reference inline B2/C2 sub-flow).
  - Counts: 4 phases / **7 groups (was 6)** / **30 steps (was 34)** / 2 recovery-refs groups.
- **HMI** `apps/hmi/src/app/wo/[id]/page.tsx`:
  - Added `RECOVERY_GROUP_PATTERN = /Recovery/i` + `isRecoveryRefStep(step)` predicate.
  - Derived `visibleSteps` memo filters out recovery-refs steps from: linear render, active step pick, allTerminal computation, auto-start parallel effect, progress bar counters.
  - Hidden ref steps remain in the underlying `steps` array for ID-based lookups (NOK / scrap) but never reach the operator surface.
- **Tests**:
  - `__tests__/inline-recovery.test.ts` rewritten: asserts 0 inline REC-* names + 3 hidden recovery-refs in 2 dedicated groups + decision step instructions reference RecoveryFlow + C3 Conformity Check shape.
  - `__tests__/workflow-v1.test.ts` counts rebaselined: groups 6→7, steps 34→30, groupsPerPhase [1,2,2,1]→[1,2,3,1], stepCounts [8,9,4,4,4,5]→[8,9,2,4,1,1,5]. Added `recovery` to validStepCategories.
  - `__tests__/workflow-v0.test.ts` count assertion bumped 34→30.
  - New `apps/hmi/src/app/wo/[id]/components/recovery-refs-filter.test.ts` (6 tests) pins the `isRecoveryRefStep` rule against future regression.

### Verification (May 3, 2026)

- ✅ Build 13/13 successful (`pnpm build`)
- ✅ Lint clean (only pre-existing PNE_3 hmi `<img>` warnings, unchanged)
- ✅ All **744 tests pass** (was 734, **+10 net**: prisma 18→22 from rewritten inline-recovery suite, hmi 30→36 from new filter test):
  - api 284 / domain 197 / ui 119 / web 38 / hmi **36** / schemas 29 / prisma **22** / cache 8 / storage 6 / queue 5
- ⏳ Manual `pnpm dev` smoke (recovery modal flow end-to-end after re-seed) — pending operator sign-off before commit per workflow rules.

### Lessons learned (Lesson 58)

- **Lesson 58 (SEED_CLEANUP pre-flight)**: shipping a full UI surface (D4.1 recoveryConfig section + D4.2 ScrapForm + D5 RecoveryFlow inline panel) does not by itself produce a working runtime feature. The recoveryConfig field flows through the editor but never reaches the runtime: no schema column, no DTO projection, no HMI read. Pre-flight on the SEED_CLEANUP hotfix surfaced the gap before touching code; without that step we'd have shipped a seed that documents pre-retry refs that the runtime can't execute. Practical guideline: when a hotfix promises behaviour that depends on cross-layer plumbing (editor → DB → DTO → HMI runtime), trace the read path explicitly during pre-flight, not just the write path.

### Files changed

```
packages/prisma/seed/pneumatic-data/workflow-v1.ts
packages/prisma/seed/pneumatic-data/__tests__/workflow-v1.test.ts
packages/prisma/seed/pneumatic-data/__tests__/workflow-v0.test.ts
packages/prisma/seed/pneumatic-data/__tests__/inline-recovery.test.ts          (rewritten)
apps/hmi/src/app/wo/[id]/page.tsx
apps/hmi/src/app/wo/[id]/components/recovery-refs-filter.test.ts                (new)
TODO.md                                                                          (TODO-040 extended)
STATUS.md                                                                        (this entry)
```

---

## 🎉 F1 (Pneumatic First) — 100% complete (May 3, 2026)

Pneumatic Air vertical demo path is end-to-end functional: workflow editor with Action Type catalog + autofill + photo upload (D1) → HMI Step Generic with device cycle dispatch (TODO-043 closed in D2 at runtime) → parallel slots split layout during the leak cycle (D3) → page.tsx wiring + recovery configurable + scrap form with cause code & photo (D4).

### F1 closure summary

| PROMPT | Closed | Commits | Tests added | Cumul | Key deliverable |
|---|---|---|---|---|---|
| F1.1 DS_LIFT | 2026-05-02 | 14 patterns lifted to `@mes/ui` | — | — | foundation primitives |
| F1.2 PROMPT_3d | 2026-05-02 | palette ungated, phase-columns canvas, 3-tab inspector | — | — | workflow editor mockup-faithful |
| F1.3 PROMPT_PNE_1 | 2026-05-02 | step configurator with 6 resource tabs + 8 action forms | — | — | step builder UX |
| F1.4 PROMPT_PNE_2 | 2026-05-02 | 4 D increments | +18 | 655 | Pneumatic seed (workflows v0/v1, 34 steps, 3 recipes) |
| F1.5 PROMPT_PNE_3 | 2026-05-02 | 4 D increments + 2 hotfixes | +37 | 692 | mock simulators + DemoToggle + FastForward |
| F1.6 PROMPT_PNE_4_FOCUSED | 2026-05-03 | 4 D increments | **+42** | **734** | Action Type + photo, HMI device cycle, parallel slots, recovery + scrap, F1 closure |
| **Total residual F1 tests** | | | **+97** | **734** | |

### Lessons accumulated through F1

- **Lesson 54**: Vitest 2.1 + Windows multi-worker temp-dir race. Mitigated per-package via `--no-file-parallelism` (api / domain) or `fileParallelism: false` baked into `vitest.config.ts` (web / hmi added in PNE_4).
- **Lesson 55**: TypeScript constructor params with function default values trigger Nest DI Function-resolution. Use `@Optional()` proactively (PNE_3 D4 hotfix #1).
- **Lesson 56**: NestJS auth guards run before method handlers. Use `@Public` (or no guards) for debug-only `/api/internal/*` routes; rely on env-var fallback (`DEMO_USER_ID`, `DEMO_PLANT_ID`) when no JWT context. Always run `pnpm dev` post-Dn to catch DI/auth runtime issues — not just `pnpm test` (PNE_3 D4 hotfix #2 + PNE_4 D2 boot smoke confirmed dispatcher path live end-to-end).
- **Lesson 57 (PNE_4 D4.0)**: shipping new HMI components doesn't make them visible — host pages must mount them. The PNE_4 D2 work shipped `StepGeneric` + `DeviceCycleView` but the existing `apps/hmi/src/app/wo/[id]/page.tsx` continued rendering `StepCard` for every step. Caught during user-side smoke after D2 commit; fixed in D4.0 by routing the active `device_run` device_main group to `<DeviceCycleWithParallels />` directly. Pinned by a regression test on the `isDeviceCycleStep` detection rule.

### Demo-ready confirmation (May 3, 2026)

- ✅ All 13 packages build clean (`pnpm build`)
- ✅ `pnpm lint` clean (only pre-existing PNE_3 hmi `<img>` warnings, no errors)
- ✅ All 734 tests pass: api 284 / domain 197 / ui 119 / web 38 / hmi 30 / schemas 29 / prisma 18 / cache 8 / storage 6 / queue 5
- ✅ Lesson 56 boot smoke (PNE_4 D2): API + DI graph clean, dispatcher end-to-end runtime verified (Mario Rossi START on STEP-LEAK-003 → 45s simulator → step status `done` result `ok`)
- ✅ Env templates committed: `apps/api/.env.example`, `apps/web/.env.local.example`, `apps/hmi/.env.local.example`
- ✅ CLAUDE.md "Demo mode setup" section added

### F2 (post-demo, 21 May+)

F2 begins after the Reflex Allen demo. PROMPT_6 (Andon + Plant Overview) is first; refer to `ROADMAP.md` § 2 F2.

---

## ✅ PROMPT_PNE_3 — Mock device simulator + Demo Toggle Panel — 100% complete (May 2, 2026)

F1.5 of ROADMAP v2 (Pneumatic First). Three demo-grade device simulators (LeakTester / CameraTester / CrimpPress) with deterministic outcome bands keyed off the PROMPT_PNE_2 seeded recipes; WS broadcast of `device:cycle:started/progress/complete` on the existing `WorkOrderEventsGateway`; REST controls under `/api/internal/mock-devices/*`; `/api/internal/fast-forward/:woId/complete-step` debug endpoint; back-office Demo Toggle Panel at `/demo` (server-gated `notFound()` + client polling 2s + Italian Toast feedback). Every surface gated on `DEMO_MODE=true`; production builds refuse to boot if `DEMO_MODE` is unset.

### Test count

- **Baseline (post PROMPT_PNE_2 D4)**: 655
- **Final**: **692** (api 281 / domain 197 / ui 119 / schemas 29 / cache 8 / queue 5 / storage 6 / web 29 / prisma 18)
- **Delta**: **+37 tests** (target floor +12 → ≥667, ideal +18 → ≥673; achieved with +19 buffer over ideal)

### D1-D4 breakdown

| Increment | Scope | Test delta | Cumul | Commit |
|---|---|---|---|---|
| D1 | MockDevicesModule + types + DemoControllerService + MockLeakTesterService + REST controller (gated DEMO_MODE) + WorkOrderEventsGateway emitDeviceCycle{Started,Progress,Complete} broadcasts + main.ts boot guard + .env.example DEMO_MODE | +17 | 672 | `53347fa` |
| D2 | MockCameraTesterService (4 ROIs/PASS-FAIL) + MockCrimpPressService (25kN ±1/PASS-FAIL) + controller route refactor `/api/internal/mock-devices/*` (`override-next` / `start-cycle`) + `/demo` page scaffolding + DeviceCard primitive | +12 | 684 | `a3e5f4e` |
| D3 | `MockDeviceStatus.lastOutcome` (set on complete, cleared on next start) on all 3 simulators + `/demo` server/client split (server gate + client polling 2s + Toast IT) + override + start handlers + DeviceCard `lastOutcome` badge + override-scheduled message + TODO-044 (WS deferral) | +3 | 687 | `f9cb037` |
| D4 | FastForwardController (`/api/internal/fast-forward/:woId/complete-step` mapping PASS/FAIL/SCRAP → COMPLETE_OK/COMPLETE_NOK/MARK_SCRAPPED via existing StepExecutionService.applyTransition) + WorkOrdersModule import + STATUS / ROADMAP / TODO closure | +5 | **692** | _this commit_ |

### Architectural decisions (kept after D4)

1. **Deferred device-execution integration (Issue 3 / TODO-043 / Option 3b)**: PROMPT_PNE_3 § 3.4 assumed `apps/api/src/modules/work-orders/step-execution/device-step-executor.ts` already existed (presumed-shipped by PROMPT_5_FULL D3). It does NOT — the actual `step-execution.service.ts` is purely XState-driven and never calls a "device client". Creating the device-execution dispatch branch from scratch is out of PROMPT_PNE_3's 8-12h budget per § 8 surprise budget. Resolution: ship standalone simulators reachable via `/api/internal/mock-devices/*` + DemoToggle UI + FastForward (which drives the existing state machine API directly, no new dispatch branch). Wiring the `SimulatorRegistry` into step-execution dispatch when an HMI operator advances a `device_run` step is owned by **PROMPT_PNE_4 D1** (HMI Leak/Camera specialized work) — tracked by TODO-043 with full acceptance criteria.

2. **MARGINAL outcome scoped to LeakTester only**: leak rate has a real grey zone (0.5..1.0 mbar/min — passing under spec but flagged for retest). Camera ROI similarity and crimp force tolerance are binary tolerance checks — values either pass or fail, no MARGINAL. `MockDevice.supportedOutcomes` declares this per-device and the controller's `parseOutcomeBody` rejects MARGINAL on camera/crimp with BadRequest. DeviceCard hides the MARGINAL button when not supported.

3. **2s polling vs WebSocket (TODO-044, deferred)**: simulators broadcast `device:cycle:started/progress/complete` on `WorkOrderEventsGateway` since D1, but apps/web `DemoPanel` uses a `setInterval(2000ms)` polling loop on `listMockDevices()` instead. Polling is sufficient for the demo (3 devices, low traffic) but adds ~30 req/min/tab and aliases sub-second crimp telemetry to 2s ticks. Replacement with `useDeviceEventsSubscription` hook + `socket.io-client` tracked in TODO-044 (Medium, 1-2h, owner F2 PROMPT_7 or earlier if demo prep flags lag).

4. **`/api/internal/*` namespace for debug-only surfaces**: PROMPT_PNE_3 § 3.3 said `/api/mock-devices/*`. Per the user's D2 instruction, all debug routes live under `/api/internal/*` (mock-devices + fast-forward) to give ops a clear "this isn't part of the production API surface" signal. Combined with the `DEMO_MODE` controller gate + main.ts boot guard, that's three layers of safety against accidental production exposure.

5. **`/demo` server/client split (Next.js 14 pattern)**: `app/demo/page.tsx` stays as a server component that calls `notFound()` if `NEXT_PUBLIC_DEMO_MODE != 'true'` (so non-demo deployments don't ship the JS bundle at all); the interactive `<DemoPanel>` is the only `'use client'` component on the route. Mirrors the dynamic-import idiom but works at the route level. The `ToastProvider` is wrapped inside `DemoPanel` because the `/demo` route has no parent `(registries)` layout (no shared sidebar / chrome).

### TODOs closed by PROMPT_PNE_3

- _none directly closed_ — PROMPT_PNE_3 was greenfield.

### TODOs opened by PROMPT_PNE_3

- **TODO-043** — Wire SimulatorRegistry into step-execution dispatch (deferred). Owner: **PROMPT_PNE_4 D1**. HIGH priority. PNE_3 ships standalone simulators + DemoToggle + FastForward as the reachable surfaces; step-execution auto-dispatch when an operator advances a `device_run` step is the natural extension.
- **TODO-044** — DemoToggle Panel: replace 2s polling with WebSocket subscription. Owner: **F2 PROMPT_7** (or earlier if demo prep flags polling lag on crimp's 100ms telemetry). MEDIUM priority. Simulator broadcasts already exist (D1) — only the apps/web subscription is missing.

### Verification commands (final)

```
pnpm install                                            # already installed, no-op (729 pkgs)
pnpm --filter @mes/prisma generate                      # already generated by turbo prisma:generate task
pnpm build                                              # 13/13 successful
pnpm lint                                               # 3/3 (apps/web ESLint clean; apps/api type-check clean)
pnpm --filter @mes/api      exec vitest run --no-file-parallelism   # 281/281 pass (24 + 6 mock-devices test files)
pnpm --filter @mes/domain   exec vitest run --no-file-parallelism   # 197/197 pass
pnpm --filter @mes/ui       test                                    # 119/119 pass
pnpm --filter @mes/schemas  test                                    # 29/29 pass
pnpm --filter @mes/cache    test                                    # 8/8 pass
pnpm --filter @mes/queue    test                                    # 5/5 pass
pnpm --filter @mes/storage  test                                    # 6/6 pass
pnpm --filter @mes/web      exec vitest run --no-file-parallelism   # 29/29 pass (24 baseline + 3 DeviceCard + 2 DemoPanel)
pnpm --filter @mes/prisma   test                                    # 18/18 pass
```

Note: per-package serial run (`--no-file-parallelism`) used for `@mes/api`, `@mes/domain`, `@mes/web` to dodge the documented Vitest 2.1.x + Windows temp-dir race (Lesson #54 from STATUS history).

Runtime smoke deferred to user pre-merge per CLAUDE.md PHASE 4. Suggested checks (assumes `.env` populated with `DEMO_MODE=true` + `NEXT_PUBLIC_DEMO_MODE=true` and dev DB seeded via `pnpm --filter @mes/prisma seed:pneumatic`):

1. `pnpm dev` — API on 3000, web on 3001, hmi on 3002.
2. Open http://localhost:3001/demo (back-office, port 3001).
3. Verify 3 device cards (DEV-LEAK-001 / DEV-CAMERA-001 / DEV-CRIMP-001) — each with default PASS, idle status, expected duration (45s / 8s / 8s).
4. Click "Force FAIL" on DEV-LEAK-001 → toast "Override programmato su DEV-LEAK-001: FAIL ...". Card body shows "Override programmato: FAIL".
5. Click "Start cycle" on DEV-LEAK-001 → toast "Ciclo avviato su DEV-LEAK-001". Card transitions to RUNNING badge; buttons disabled.
6. Wait ~45 seconds (or polling tick at 2s). Card returns to IDLE with `Ultimo: FAIL` badge in the header.
7. FastForward smoke (curl):
   ```
   curl -X POST http://localhost:3000/api/internal/fast-forward/<woId>/complete-step \
     -H 'Content-Type: application/json' -H 'Cookie: <login JWT cookie>' \
     -d '{"stepExecutionId":"<seId>","outcome":"PASS"}'
   ```
   Should return 200 with `{ result: { fromStatus: 'running', toStatus: 'done', event: 'COMPLETE_OK', ... } }`.
8. With `DEMO_MODE=false`: `/api/internal/mock-devices` and `/api/internal/fast-forward/...` both return 404; `/demo` page returns 404.

---

## ✅ PROMPT_PNE_2 — Pneumatic Air seed (double workflow + WO) — 100% complete (May 2, 2026)

F1.4 of ROADMAP v2 (Pneumatic First). Seeds the dev SQLite DB with the Pneumatic Air production reality so demo path is one-command-ready (`pnpm --filter @mes/prisma seed:pneumatic`). Idempotent. Coexists with the baseline seed (`pnpm db:seed`) — different unique codes throughout.

### Test count

- **Baseline (post PROMPT_PNE_1 D4)**: 637
- **Final**: **655** (api 249 / domain 197 / ui 119 / **prisma 18** / schemas 29 / cache 8 / queue 5 / storage 6 / web 24)
- **Delta**: **+18 tests** (target floor +12 → ≥649, ideal +16 → ≥653; achieved +18 = +6 above floor, +2 above ideal)

### D1-D4 breakdown

| Increment | Scope | Test delta | Cumul | Commit |
|---|---|---|---|---|
| D1 | Plant hierarchy (1 area / 4 WCs / 4 WSs / 3 devices) + 5 items + 1 BoxType + 3 recipes (4 versions) + 4 skills + 2 operators (Mario Rossi 1234, Anna Verdi 5678 — argon2id) + vitest setup for `@mes/prisma` | +5 | 642 | `57b40e1` |
| D2 | 6 cause codes + 10 fault codes (CauseCode workaround S1) + 3 attention points + WO-2026-PNE-0042 draft (Mario Rossi proposed) | +4 | 646 | `6529541` |
| D3 | Workflow v1 (4 phases / 6 groups / 34 steps incl. inline recovery B2 + C2) + WO release transition (draft → released, assignment → accepted, snapshot 18958 chars JSON, 34 StepExecution rows) | +6 | 652 | `94d9ab2` |
| D4 | Workflow v0 (Empty) scaffold + status enum mapping helper + TODO-031 turbo fix + STATUS / ROADMAP / TODO closure | +3 | **655** | _this commit_ |

### Architectural decisions (kept after D4)

1. **S1 — FaultCode model is MISSING from `packages/prisma/schema.prisma`** (§ 5 STOP discovered in D1 pre-flight, user-confirmed workaround):
   - 10 fault codes seeded as `CauseCode` rows with `category='recovery_fault'`.
   - Phase scope (`leak`/`camera`) encoded BOTH in `phase` column AND in `LK-*`/`CM-*` code prefix (redundant for HMI Recovery dropdown lookup).
   - Severity (absent in CauseCode schema) encoded in description text as `Severity: high|medium|low`.
   - Recovery diagnosis steps reference fault codes by code-string in `instructions` text (no `Step.recoveryFaultCodes[]` FK).
   - Tracked by **TODO-041** (split FaultCode into first-class model in F2 / PROMPT_7). Future fault codes for other phases (PACK/ASSY/etc.) would need to extend the phase enum AND prefix vocabulary — decide explicitly when promoting.

2. **S2 — Recovery sub-flows modeled as INLINE groups** (existing TODO-036, user-confirmed):
   - PROMPT_PNE_2 § 3.2 specified `wf-leak-recovery-pne` and `wf-camera-recovery-pne` as separate Workflows linked from decision steps; the schema lacks `Step.onNokTargetWorkflowId` so this is impossible without migration (out of scope per § 4).
   - Workaround: Group **B2 — Leak Recovery (inline)** under Phase 2 + Group **C2 — Camera Recovery (inline)** under Phase 3, both with `supportsRecovery=true` and 4 steps (diagnosis → 2 retries → scrap).
   - Decision steps (`STEP-LEAK-007` and `[3.3]`) reference the recovery group by name in their `instructions` text (text-based loose-coupling).
   - Final shape: 4 phases / **6 groups** (4 main + 2 inline recovery) / **34 step rows** (8 + 9 + 4 + 4 + 4 + 5).

3. **S3 — `parallelStepsBufferSec` field MISSING on Group/Step** (user-confirmed):
   - PROMPT § 3.2 specifies `parallelStepsBufferSec: 5` for Group B1's device-execution; the schema has no such column.
   - Workaround: encode `parallelStepsBufferSec: 5` in `STEP-LEAK-003.instructions` text. Tracked by existing **TODO-040** dependency (workflow step `config Json?` column).

4. **S4 — `WorkOrderAssignment` schema has no workstation FK**:
   - PROMPT § 3.2 says WO is "assigned to WS-LEAK-01 + WS-ASSY-01 + WS-CAMERA-01 + WS-PACK-01"; schema only has `(workOrderId, operatorId)` per assignment row.
   - Workaround: workstation context is implicit via the workflow's step→deviceId chain (each step's device's equipmentNode ancestry resolves to a workstation). Single `WorkOrderAssignment` row created for Mario Rossi (operator). Anna Verdi seeded as a usable login but not assigned to this WO (PROMPT spec lists only Mario in `assignedOperators`).

5. **PROMPT § 1 "19 steps" undercount vs § 3.2 enumeration of 26+8=34**:
   - Trust the per-step enumeration in § 3.2 (informal undercount in § 1 summary). Documented for future PROMPT spec rewrites — see **TODO-042** doc-hygiene entry.

6. **WorkflowSnapshot creation bypasses release service** (mirrors baseline `WF-PNEU-CURE-DEMO` pattern in `seed.ts:498-696`):
   - Release service (`apps/api/src/modules/work-orders/release.service.ts`) requires API request context (operator session, audit user) unavailable in a seed.
   - Seed manually clones the WorkflowVersion tree via `cloneWorkflowTree` from `@mes/domain` (added as workspace dep on `@mes/prisma`), JSON-serializes to `WorkflowSnapshot.snapshotData`, creates 34 `StepExecution` rows with `status=pending` + `startedAt=releasedAt`. Idempotent: snapshot is `@unique` on workOrderId; per-step executions checked via `findFirst`.

7. **Vitest 2.1.x Windows parallel-runner flake — per-package strategies are NOT uniform** (expansion of STATUS lesson 54 originally documented as @mes/ui-only):
   - Discovered during PROMPT_PNE_2 D1 + D3 that the flake also affects `@mes/domain` (drops 2-3 of 15 test files randomly) and `@mes/ui` (drops 2 of 29 randomly — confirmed run 1 = 119/29, run 2 = 107/27).
   - Per-package mitigation table:
     | Package | Strategy | Notes |
     |---|---|---|
     | `@mes/prisma` | `pool=forks` + `singleFork=true` | Pure Node, no DOM. Set in vitest.config.ts |
     | `@mes/ui` | Default parallel runner; re-run on flake | `singleFork` BREAKS jsdom DOM cleanup between tests |
     | `@mes/domain` | `singleFork` works; default also works most runs but flakes 2-3 files randomly | No DOM |
     | `@mes/web` | Default works because `afterEach(cleanup)` was added in PROMPT_PNE_1 D4 | jsdom cleanup workaround |
     | `@mes/api`, `@mes/schemas`, `@mes/cache`, `@mes/queue`, `@mes/storage` | Default works | Stable on these |
   - Standardizing across all packages estimated 1-2h backend (F2 polish opportunity, not in PROMPT_PNE_2 scope).

8. **Skill code prefix corrected vs initial plan**: plan agent claimed baseline used `SKILL-` prefix; verification of `seed.ts:33-42` showed BARE codes (`EXT, ASSY, QC, TEST, ...`). PNE_2 seed uses bare codes too — `IDENTIFICATION` is the only net-new (3 baseline-shared: ASSY, QC, TEST).

9. **Operator-name conflict spurious**: plan agent claimed existing seed had Mario Rossi / Anna Verdi at OP-002/OP-003. Verification showed Marco Rossi / Laura Ferrari / Giovanni Bianchi / Sara Conti. Net-new badges (1234/5678) + net-new names → no conflict, no name suffix needed.

### TODOs closed by PROMPT_PNE_2

- **TODO-031** — Turbo dependsOn fix for Prisma client cache gap. Closed (validated below).

### TODOs opened by PROMPT_PNE_2

- **TODO-041** — Split FaultCode from CauseCode (currently colocated under category='recovery_fault'). Owner: F2 / PROMPT_7 (or earlier if HMI Recovery PROMPT_PNE_4 needs proper FK semantics).
- **TODO-042** — PROMPT_PNE_2 § 1 summary said "19 steps" but enumeration totals 34 step rows. Documentation hygiene only — no code action.

### TODO-031 fix — validation evidence

```
turbo.json @mes/prisma#generate task added (cache: false, inputs: schema.prisma)
build pipeline gains dependsOn ["@mes/prisma#generate"]

Simulated clean state procedure (per user instructions):
  1. mv node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma → .prisma.backup
  2. pnpm build → "Tasks: 13 successful, 13 total | Cached: 12 cached, 13 total" (generate runs fresh, downstreams cached)
  3. ls .prisma → client/ ✓ regenerated
  4. pnpm --filter @mes/prisma seed:pneumatic → ✓ runs end-to-end (proves runtime client works)
  5. rm -rf .prisma.backup → cleaned
```

All 4 acceptance criteria met. TODO-031 closed.

### Verification commands (final, May 2 2026)

```
pnpm install                              # clean (729 packages, 25.4s)
pnpm --filter @mes/prisma db:reset / db:push  # fresh SQLite
pnpm --filter @mes/prisma db:seed         # baseline (5 WOs, 3 templates, demo workflow)
pnpm --filter @mes/prisma seed:pneumatic  # 1st run — creates all PNE entities + 34 step executions
pnpm --filter @mes/prisma seed:pneumatic  # 2nd run — idempotent, 0 new step executions
pnpm build                                # 13/13 successful (was 12 — generate is the new task)
pnpm lint                                 # 3/3 (0 warnings, FULL TURBO cache)
pnpm --filter @mes/api      test          # 249/249 pass
pnpm --filter @mes/domain   test          # 197/197 pass (default config; flake mitigated by re-run if hit)
pnpm --filter @mes/ui       test          # 119/119 pass (default; flake confirmed — re-run on miss)
pnpm --filter @mes/prisma   test          # 18/18 pass (15 files; singleFork bypasses Windows tmp-race)
pnpm --filter @mes/schemas  test          # 29/29
pnpm --filter @mes/cache    test          # 8/8
pnpm --filter @mes/queue    test          # 5/5
pnpm --filter @mes/storage  test          # 6/6
pnpm --filter @mes/web      test          # 24/24
```

### Manual smoke (DoD § A-F)

Verified end-to-end on May 2, 2026:

- ✅ A — Fresh DB: `rm dev.db && db:push` → schema applied
- ✅ B — Baseline seed: `db:seed` → MOCK_DATA_PNEUMATIC_AIR loaded (Plant + 4 baseline ops + 5 WOs + WF-PNEU-CURE-DEMO + 3 templates)
- ✅ C — PNE seed 1st run: 1 area / 4 WCs / 4 WSs / 3 devices / 5 items / 1 BoxType / 3 recipes (4 versions) / 4 skills / 2 operators / 6 cause codes / 10 fault codes / 3 APs / 1 WO (released) / 1 workflow v1 (4 phases / 6 groups / 34 steps) / 1 workflow v0 (empty) / 1 snapshot / 34 step executions
- ✅ D — PNE seed 2nd run: idempotent, 0 new step executions, snapshot reused, all upserts no-op
- ✅ E — TODO-031 turbo fix validated: `.prisma/client` removed → `pnpm build` → regenerated transparently → seed runs
- ⏭️ F — UI smoke deferred to user pre-merge per CLAUDE.md PHASE 4. Suggested checks per ROADMAP § 4.6:
  - `Remove-Item -Recurse -Force apps\web\.next; pnpm dev`
  - `localhost:3001/workflows` → verify `wf-pneumatic-air-680-v1` (Active/approved) + `wf-pneumatic-air-680-v0` (Draft) appear in list
  - Open v1 detail → 4 phases + 6 groups + 34 steps render
  - Open v0 detail → empty canvas with palette ungated (PROMPT_3d palette behavior)
  - `localhost:3001/work-orders` → `WO-2026-PNE-0042` in `released` state, qty 100, Mario Rossi (badge 1234) assigned

---

## ✅ PROMPT_PNE_1 — Resource Selection complete (Step Configurator) — 100% complete (May 2, 2026)

F1.3 of ROADMAP v2 (Pneumatic First). Fills the AddStepDialog SHELL that PROMPT_3d D2 created with: 6 Resource tabs (Materials/Tools/Devices/Skills/Recipes/Attention Points), Recipe-Device coupling (client-side filter on `recipe.deviceId IN [selectedDeviceIds]`), Action Configuration per step kind/category (8 forms), and the Save flow wired into the existing canvas auto-save pipeline.

### Test count

- **Baseline (post PROMPT_3d D6)**: 619
- **Final**: **637** (api 249 / domain 197 / ui 119 / schemas 29 / cache 8 / queue 5 / storage 6 / **web 24**)
- **Delta**: **+18 tests** (target floor +12 → ≥631, ideal +18 → ≥637; achieved ideal exactly)

### D1-D4 breakdown

| Increment | Scope | Test delta | Cumul | Commit |
|---|---|---|---|---|
| D1 | Resource tabs scaffold (Materials/Tools/Devices) + ResourceList primitive + AddStepDialog state lift | +5 | 624 | `91a15b2` |
| D2 | Skills + Recipes (device-coupled) + Attention Points tabs | +4 | 628 | `0c83c6e` |
| D3 | 8 Action Config forms + ActionConfig switch + 8 Zod schemas + AddStepDialog wire | +5 | 633 | `62033f9` |
| D4 | Save flow with Zod validation + extended store payload + buildSavePayload toolId/recipeId + STATUS / ROADMAP / TODO | +4 | **637** | _this commit_ |

### Architectural decisions (kept after D4)

1. **Session-only persistence for multi-select arrays + per-form Action Config** (TODO-040): single-FK ids (`skillId`, `deviceId`, `recipeId`, `toolId`) bake into `node.data` and persist via the existing `WorkflowStepInputSchema`; multi-select arrays (`materialIds[]`, `attentionPointIds[]`) and the kind-specific `actionConfig` blob live in `node.data` only — lossy on reload. Decision rationale: stays inside § 7 surprise budget (no DB migration); fits 8-12h effort budget; PROMPT_PNE_2 will seed `WF-PNEU-680-V1-DEMO` with all resources pre-wired so the demo path doesn't suffer the lossy contract. Tracked by **TODO-040** for F2 / PROMPT_7 (`Step.config Json?` column + `step_materials` / `step_attention_points` M:N tables).

2. **Two parallel form ecosystems — explicit decision, not technical debt**: the existing 9-form ecosystem in `apps/web/src/components/workflow/forms/*` (ProductionStepForm, QualityControlStepForm, …, PhaseConfigurator, GroupConfigurator) drives the **edit** path via `PropertiesTab` for already-existing steps. The new 8-form ecosystem in `apps/web/src/components/workflow/configurator/action-forms/*` drives the **create** path inside `AddStepDialog` with a single shared `actionConfig` state object. Both ecosystems coexist intentionally; merging them requires backend persistence parity (TODO-040 dependency).

3. **Client-side recipe-device filter (no API extension)**: `Recipe.deviceId` is a single FK; PROMPT_PNE_1 § 3.2's `compatibleDevices` array does not exist in the schema. RecipesTab fetches `sdk.recipes.list({ limit: 200 })` once and filters client-side via `recipes.filter(r => selectedDeviceIds.includes(r.deviceId))`. Mirrors `ProductionStepForm`'s pattern. Backend `?compatibleDeviceIds=` extension deferred to F2 / PROMPT_7 if a recipe set ever exceeds the 200-item paginated cap.

4. **Mixed test strategy continued**: pure logic in `@mes/domain` + presentational primitives in `@mes/ui` covered most of DS_LIFT and PROMPT_3d. PROMPT_PNE_1 land entirely in `apps/web` because the configurator forms are intrinsically tied to TanStack Query + react-hook-form + zustand — not mockable as pure functions. apps/web web test count grew from 6 (post-PROMPT_3d) to **24** (+18 from D1-D4). New test infrastructure: `afterEach(cleanup)` registered in `apps/web/src/test-setup.ts` to fix DOM pollution between tests on Windows + Vitest 2.1.x (auto-cleanup is unreliable in this combo per documented escape hatch).

5. **Backward-compat preserved**: schema unchanged (zero migrations); `buildSavePayload` extended additively to also emit `recipeId` + `toolId` from `node.data` (was missing — latent bug pre-existed D4); `addStepNodeToGroup` now writes `standardTimeSec` (canonical key consumed by `buildSavePayload`) alongside `durationSec` for inspector-form compat — closes the previously-broken duration round-trip from dialog-created steps. Both fixes are additive and do not affect existing seeded test workflows.

### TODOs closed by PROMPT_PNE_1

- **TODO-034** — Add Step full configurator (6 resource tabs Materials/Tools/Devices/Skills/Recipes/AttentionPoints) — done across D1+D2.

### TODOs opened by PROMPT_PNE_1

- **TODO-040** — Multi-select resources (materialIds, attentionPointIds) + kind/category-specific Action Config in AddStepDialog are session-only / lossy on reload. Owner: F2 / PROMPT_7 (registry detail polish + schema migration). Scope: add `Step.config Json?` column + `step_materials` + `step_attention_points` M:N tables, hydrate on GET, persist on save. Estimate 6-10h backend + 2-4h frontend.

### Verification commands (final)

```
pnpm install                        # clean (729 packages, 17.8s)
pnpm --filter @mes/prisma generate  # TODO-031 workaround
pnpm build                          # 12/12 successful (24.5s — most cached)
pnpm lint                           # 3/3 (apps/web clean; pre-existing TODO-002 hmi <img> warnings)
pnpm --filter @mes/web      type-check   # tsc --noEmit clean
pnpm --filter @mes/api      test    # 249/249 pass
pnpm --filter @mes/domain   test    # 197/197 pass
pnpm --filter @mes/ui       test    # 119/119 pass
pnpm --filter @mes/schemas  test    # 29/29 pass
pnpm --filter @mes/cache    test    # 8/8 pass
pnpm --filter @mes/queue    test    # 5/5 pass
pnpm --filter @mes/storage  test    # 6/6 pass
pnpm --filter @mes/web      test    # 24/24 pass (was 6 baseline; +18 from D1-D4)
```

Runtime smoke deferred to user pre-merge per CLAUDE.md PHASE 4. Suggested checks (per ROADMAP § 4.6 `.next` cache reminder):
- `Remove-Item -Recurse -Force apps\web\.next -ErrorAction SilentlyContinue ; pnpm dev`
- Open `/workflows/<wf-test-001-id>`, drag a `manual` step kind onto an existing group.
- Fill name + Manual instructions + open Materials tab, select 2 items + open Tools tab, select 1 tool.
- Save → step appears in canvas, name visible, single-FK fields persist across browser reload (multi-select arrays + actionConfig session-only by design — TODO-040).

---

## ✅ PROMPT_3d — Workflow Editor UX-lift — 100% complete (May 2, 2026)

Refactor of the workflow editor to mockup-faithful layout (F1.2 in ROADMAP v2 Pneumatic First). The editor was the demo-blocking customer-facing surface for Reflex Allen — palette ungated, canvas phase-columns horizontal, inspector 3-tab Properties/Metadata/Audit, dialogs for phase/group/step/validate, Visual/Parallel toggle.

### Test count

- **Baseline (post DS_LIFT)**: 587
- **Final**: **619** (api 249 / domain 197 / ui 119 / schemas 29 / cache 8 / queue 5 / storage 6 / **web 6**)
- **Delta**: **+32 tests** (target floor +18 → ≥605, ideal +24 → ≥611; achieved with +8 buffer over ideal)

### D1-D6 breakdown

| Increment | Scope | Test delta | Cumul | Commit |
|---|---|---|---|---|
| D1 | Palette refactor to ungated STEP CATEGORIES + STEP KINDS; apps/web vitest setup | +5 | 592 | `a388f46` |
| D2 | Drag-drop wiring + AddStepDialog shell + Modal.fullScreen prop | +8 | 600 | `c668dec` |
| D3 | Canvas refactor — horizontal phase columns + DS_LIFT chrome (Toolbar/StateBar/Zoom) | +7 | 607 | `25505b8` |
| D4 | Inspector 3-tab Properties/Metadata/Audit + audit-adapter stub (TODO-033) | +1 | 608 | `7aece39` |
| D5 | AddPhaseDrawer + AddGroupModal + ValidateDrawer + EmptyState success | +4 | 612 | `b52ab67` |
| D5 hotfix | Primary submit button visibility (`bg-accent` token; Drawer flex footer) | +3 | 615 | `89ed752` |
| D6 | Visual/Parallel toggle + ParallelView + WorkflowTopBar + STATUS / ROADMAP / TODO | +4 | **619** | _this commit_ |

### Architectural decisions (kept after D6)

1. **Mixed test strategy** (decided in PHASE 1 of plan): pure logic extracted to `@mes/domain` (palette descriptors, compatibility matrix, layout algorithm, parallel-view selectors, validation issue navigator) + presentational primitives extended in `@mes/ui` (Modal `fullScreen`, EmptyState `success`, Drawer flex footer) covered most of the test budget. apps/web gained a minimal vitest setup (vitest + jsdom + @testing-library) timeboxed at ≤2h — finished within budget and now hosts 6 component smokes. **Apps/web now has new devDeps** (vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom). Contributors must run `pnpm install` after pulling this branch on local Windows, otherwise smoke tests fail with module-not-found (same lesson as DS_LIFT lucide-react episode).

2. **`EmptyState.kind="success"` extension** (D5): added the missing success variant with CheckCircle illust in `var(--ok)` tone. Backward-compatible — pre-existing 4 kinds untouched. Used by ValidateDrawer's "Workflow valido" empty state.

3. **`Modal.fullScreen` prop extension** (D2): additive `fullScreen?: boolean` (default false). When true: `h-screen w-screen rounded-none`, no width style. Used by AddStepDialog. Pre-existing centered behavior unchanged. Tracked in `Modal.test.tsx` regressions.

4. **`Drawer` footer flex layout fix** (D5 hotfix): `@mes/ui` Drawer footer container previously rendered `<div className="border-t … px-5 py-4">` with no flex layout — when callsites passed a Fragment with two buttons (Annulla + primary submit) they did not align right. D5 hotfix harmonized with Modal: `flex justify-end gap-2`. Audited all callsites — fragment / array / single child all compose correctly. Drawer test asserts the layout shape so future regressions are caught.

5. **Custom column layout (not dagre LR)** (D3): the new `layoutPhaseColumns` pure function in `@mes/domain` is deterministic and configurable (column width / gap / header height / step indent). Easier to reason about, easier to test, mockup-aligned. `applyDagreLayout` retained as named export for fallback / Parallel view future expansion.

6. **Dialog primary buttons use `bg-accent` token** (D5 hotfix): apps/web tailwind config defines `accent` / `ok` / `bad` / `warn` / `info` semantic tokens but does NOT define a `primary` color SCALE. Classes like `bg-primary-600` generate zero CSS → invisible buttons. PROMPT_3d's 4 dialogs (AddPhase / AddGroup / AddStep / topbar Aggiungi Fase) use `bg-accent` + `hover:bg-accent-2` (matches `Button.tsx` primary variant). Pre-existing pages with the same antipattern tracked separately as **TODO-039**.

7. **Backward-compat preserved**: schema unchanged (zero migrations); `buildSavePayload` format unchanged; both drag-drop dataTransfer formats (`application/workflow-palette` new, `application/workflow-node` legacy) honored side-by-side; existing 9 step forms + Phase + Group configurators reused verbatim inside `PropertiesTab`.

### TODOs closed by PROMPT_3d

- Workflow editor mockup-fidelity refactor (PROMPT_3d full scope) — done across D1-D6.

### TODOs opened by PROMPT_3d

- **TODO-034** — Add Step full configurator (6 resource tabs) — owned by **PROMPT_PNE_1**.
- **TODO-035** — Parallel view editing (currently read-only) — owned by **F2**.
- **TODO-036** — Decision-step `onOk`/`onNok` schema fields missing — owned by **F2** (or earlier if PNE_2 needs decision branches for recovery flows).
- **TODO-037** — `@mes/ui` CanvasEdge / React Flow EdgeProps API asymmetry — owned by **F2** (recommend Option B = document).
- **TODO-038** — Workflow-root metadata editing (tags + defaultWorkCenters) — owned by **F2 / PROMPT_7** (registry detail polish).
- **TODO-039** — Design token migration (`bg-primary-*` / `bg-success-*` / `text-primary-*` unmapped in apps/web) — owned by **F2 / PROMPT_7**. Recommend extending tailwind config (option A) rather than blanket migration.

### Verification commands (final)

```
pnpm install
pnpm build                              # 12/12 successful
pnpm lint                               # 3/3 (apps/web clean; pre-existing hmi <img> warning per TODO-002)
pnpm --filter @mes/domain test          # 197/197 pass
pnpm --filter @mes/ui     test          # 119/119 pass
pnpm --filter @mes/web    test          # 6/6 pass
pnpm --filter @mes/api    test          # 249/249 pass
pnpm --filter @mes/schemas test         # 29/29 pass
pnpm --filter @mes/cache  test          # 8/8 pass
pnpm --filter @mes/queue  test          # 5/5 pass
pnpm --filter @mes/storage test         # 6/6 pass
```

Runtime smoke deferred to user pre-merge (per CLAUDE.md PHASE 4). End-to-end flow verified on `WF-TEST-001` after D5 hotfix (re-smoke 2026-05-02 confirmed 16 functional points all green: phase create, group create, step drag-drop, AddStepDialog full-screen, reload-persistence, validate drawer, all dialog primaries visible).

---

## ✅ PROMPT_DS_LIFT — 100% complete (May 2, 2026)

Lift the Reflexallen design-handoff bundle (`docs/design-handoff/source/*.jsx`)
into typed @mes/ui primitives. Foundation for F1.2 (PROMPT_6 Andon / Plant
Overview), F1.3 (PROMPT_7 Registry detail + WO Detail BO), F1.4 (PROMPT_3c
Live Preview).

### Test count

- **Baseline**: 473 (Session B commit message — the 385 observed in pre-flight was flaky due to the Windows vitest tmp dir bug `ANTONE~1.COL` dropping 3 @mes/api test files; counted correctly from D1 onward).
- **Final**: **587** tests across 7 packages (api 249, domain 176, schemas 29, cache 8, queue 5, storage 6, **ui 114**).
- **Delta**: **+114 tests** (target was ≥+25 minimum / +87 ideal; achieved with +27 buffer over ideal).

### D1-D6 breakdown

| Increment | Components added | Test delta | Cumul total | Commit |
|---|---|---|---|---|
| D1 | Drawer audit + Modal audit + Toast (full impl from no-op stub) + PriorityBadge | +20 | 493 | `8991925` |
| D2 | TreeNode + EmptyState + ViewSwitcher + SplitView + lucide-react dep | +19 | 512 | `ec1a3fb` |
| D3 | Operational Table v0.7 (8 sub-components + composer) + RegistryListPage `useOperationalTable` flag + Items canary | +24 | 536 | `51422e1` |
| D4 | RegistryTile + KpiHero + PhaseChip + WCCard + AlertBanner + LiveAlert | +23 | 559 | `2398be9` |
| D5 | DetailHeader + DetailBody + AuditTimeline + Tabs extensions (count/dot/kbd) | +15 | 574 | `dfc7281` |
| D6 | PlantNode + PlantMap + Canvas suite (CanvasGrid/ZoomControls/Minimap/CanvasToolbar/CanvasStateBar/GenericNode/Edge/ArrowDefs) + showcase 3 new tabs | +13 | 587 | _this commit_ |
| **Total** | **~32 new primitives + 1 extended (Tabs)** | **+114** | **587** | |

### Architectural decisions (kept after D6)

- **Test baseline correction**: 473 confirmed; pre-flight 385 was flaky.
- **RegistryListPage feature-flag (D3)**: opt-in `useOperationalTable=true`; the 10 standard callsites stay on the legacy DataTable path. Items is the only canary on the new path (migrated directly inline because Items has bespoke type-tab logic). The flag's API surface is in place so the 10 standard pages can opt in incrementally.
- **Toast.tsx was a no-op stub before D1**: D1 wired up the real implementation. Existing `useToast().show()` callers now produce visible top-right toasts. UX delta tracked by TODO-032 (audit callsites for tone/duration tuning).
- **AuditTimeline naming (D5)**: `AuditTimelineEntry`, NOT `AuditEntry` — the latter is exported from the legacy `ActivityFeed.tsx` with a different shape (`{changedBy, createdAt}`) consumed by `items/[id]/page.tsx`. Both types coexist intentionally; adapter from API audit_log row → `AuditTimelineEntry` tracked by TODO-033 for P7/P9.
- **Drawer width default 480 (D1)**: kept the existing default to avoid breaking 8 existing callsites. Bundle spec is 720; downstream consumers (WO Detail in P7, Equipment 7-tab in P9) should pass `width={720}` explicitly.
- **lucide-react** (D2): added to `packages/ui/package.json` as a regular dependency (^0.453.0); also added to `apps/web/package.json` as a direct dep (Next.js production build needs the explicit reference; transitive resolution is enough only for type-checking).
- **Canvas suite is standalone** (D6): NOT a replacement for `@xyflow/react` in the workflow editor. The suite is for one-off mini-flow renders (e.g. dashboard widgets). React Flow replacement is scope of P3c.
- **Prisma client cache gap** (TODO-031, discovered in pre-flight): turbo restores `@mes/prisma` `dist/` but not the generated client at `node_modules/.pnpm/@prisma+client@*/`. Manual workaround `pnpm --filter @mes/prisma generate` until TODO-031 is fixed (recommended approach: turbo `dependsOn` split, NOT a postinstall hook).

### TODOs closed by PROMPT_DS_LIFT

- **Operational Table v0.7 lift** → done in D3 (commit `51422e1`).
- **Drawer / Modal / Toast in @mes/ui** → done in D1 (commit `8991925`); Toast was a no-op stub, now full impl.
- **AuditTrail UI viewer (§16.2)** → primitive done in D5 (commit `dfc7281`); backend integration tracked by TODO-033 for P7/P9.
- **Plant Map primitives** → done in D6 (this commit); integration with live data tracked by P6 Andon / Plant Overview.

### TODOs opened by PROMPT_DS_LIFT

- **TODO-031** — Prisma client cache gap (recommended fix: turbo `dependsOn`).
- **TODO-032** — Audit existing `useToast()` callsites after Toast no-op stub fix.
- **TODO-033** — Adapter audit-log API row shape → `AuditTimelineEntry`; do not delete ActivityFeed callsites until adapter is wired.

### Verification commands (final)

```
pnpm install
pnpm build                           # 12/12 successful
pnpm lint                            # 3/3 (0 new warnings; 2 baseline @mes/hmi <img> warnings tracked by TODO-002)
pnpm --filter @mes/ui test           # 114/114 pass (29 files)
pnpm --filter @mes/api test          # 249/249 pass
pnpm --filter @mes/domain test       # 176/176 pass
pnpm --filter @mes/schemas test      # 29/29 pass
pnpm --filter @mes/cache test        # 8/8 pass
pnpm --filter @mes/queue test        # 5/5 pass
pnpm --filter @mes/storage test      # 6/6 pass
```

Runtime smoke deferred to user pre-merge (no Playwright / Vitest browser-mode
infrastructure in repo). Suggested checks:
- `/items` (canary) — 6 SavedViews tabs, search, sort, multi-select, BulkBar
- `/operators`, `/equipment` (any 2 of 10 RegistryListPage callsites) — render
  identically to pre-D3 (legacy path)
- `/` showcase — 6 tabs (Components / Patterns / Detail / Dashboard / Colors /
  Typography) navigate; Drawer/Modal/Toast/PlantMap/Canvas demos render

---

## 📜 Project history (timeline)

- **April 27** — PROMPT_1 Foundation drafted
- **April 28** — PROMPT_2 Registries audited + recovered. PROMPT_3a D1-D3 merged
- **April 29** — PC migration. PROMPT_3a D4-D6 merged. PROMPT_3a complete
- **April 30 morning** — PROMPT_3b_REDUCED merged
- **April 30 afternoon** — PROMPT_5_LITE merged. `finalize-prompt.ps1` added
- **April 30 evening** — PROMPT_5_FULL D1+D2 merged
- **April 30 late evening** — PROMPT_5_FULL D3 merged
- **May 1 morning** — PROMPT_5_FULL D4 merged
- **May 1 afternoon** — PROMPT_5_FULL D5 merged
- **May 1 evening** — PROMPT_5_FULL D6 merged. PROMPT_5_FULL 100% complete
- **May 1 late evening** — PROMPT_4 merged (45 min execution time)
- **May 1 very late evening** — **PROMPT_3b_FULL Session A merged** (3 step forms + Phase/Group configurators + canvas badges)

---

## ✅ Current state (verified May 1 very late evening — Session A merged)

### Completed PROMPTs (6/8 at 100%, +1 partial)
- PROMPT_1, 2, 3a, 5_LITE — all 100%
- PROMPT_3b_REDUCED — 100%
- PROMPT_5_FULL (D1-D6) — 100%
- PROMPT_4 (AutoGenEngine + 7 resolvers) — 100%
- **PROMPT_3b_FULL Session A** — 50% of PROMPT_3b_FULL done (Session B remaining)

### PROMPT_3b_FULL Session A — 9/9 step categories + canvas badges (NEW May 1 very late evening)

**Plan reinterpretation**: original spec assumed PARALLEL was a missing StepCategory. Actually PARALLEL is a `StepDeviceCategory` flag (sub-flag for parallel-ops on Step.deviceCategory, added in PROMPT_5 D4). The truly missing step categories are DECISION, INFORMATION, TEARDOWN. Session A delivers full 9/9 step coverage.

**Forms shipped (3 new, mirror SetupStepForm pattern)**:
- ✅ `apps/web/src/components/workflow/forms/DecisionStepForm.tsx` (155 lines) — fields: name, instructions, decisionType (auto_branch | manual_choice | condition_check), causeCodeId
- ✅ `apps/web/src/components/workflow/forms/InformationStepForm.tsx` (138 lines) — fields: name, instructions, informationType (read_sop | safety_briefing | view_video | view_drawing), attachmentUrl
- ✅ `apps/web/src/components/workflow/forms/TeardownStepForm.tsx` (151 lines) — fields: name, instructions, teardownType (cleanup | unload_recipe | last_piece), toolId

**Production form extension**:
- ✅ `apps/web/src/components/workflow/forms/ProductionStepForm.tsx` — added `deviceCategory` selector (4 enum: pre | device_main | parallel | post). Closes parallel-ops data loop with PROMPT_5 D4 swimlane rendering.

**Phase + Group configurators (new)**:
- ✅ `PhaseConfigurator.tsx` (116 lines) — fields: name, category (6 PhaseCategory), isCycleBased
- ✅ `GroupConfigurator.tsx` (140 lines) — fields: name, category (9 GroupCategory), supportsParallel, supportsRecovery

**Validation badges on canvas nodes**:
- ✅ Refactored `ValidationPanel.tsx` to share validation logic via new `useWorkflowValidation()` hook
- ✅ `validation-context.tsx` provides errorNodeIds Set across canvas + sidebar
- ✅ `useWorkflowValidation.ts` (97 lines) extracts buildValidationStructure
- ✅ `nodes/NodeErrorBadge.tsx` — red ▲ badge with native title tooltip (no new dep)
- ✅ Wired into StepNode, PhaseNode, GroupNode

**Domain rule helpers (new pure functions, +12 tests)**:
- ✅ `extractErrorNodeIds(errors)` — derives Set<string> of node IDs with errors
- ✅ `groupErrorsByNodeId(errors)` — groups validation errors by node for tooltip display

**Opportunistic fixes**:
- ✅ `WorkflowCanvas.buildSavePayload` — now reads `isCycleBased`, `supportsParallel`, `supportsRecovery` from node.data (was hardcoded `false`)
- ✅ `WorkflowPalette.STEP_ITEMS` extended with decision, information, teardown
- ✅ `WorkflowCanvas.DEFAULT_ACTION_TYPE` extended for decision (manual_choice), information (read_sop), teardown (cleanup)

**Verification (May 1 very late evening)**:
- ✅ `pnpm install`: clean
- ✅ `pnpm build`: 12/12 successful, 0 errors (33s)
- ✅ `pnpm lint`: 3/3 clean (only pre-existing img warnings)
- ✅ `pnpm test`: **443 tests passed across 40 files** (was 431, +12 domain tests). Below ≥460 target — gap honest: apps/web has no test runner, 5 React forms + 2 configurators + context hook can't be unit-tested in this session.
- ✅ `pnpm dev`: 3 apps boot, /api/health 200, web 200, hmi 200, /workflows 200

**Test breakdown delta (vs PROMPT_4 baseline 431)**:
| Package | Pre | Post | Delta |
|---|---|---|---|
| `@mes/api` | 219 | 219 | 0 |
| `@mes/domain` | 164 | 176 | **+12** |
| `@mes/schemas` | 29 | 29 | 0 |
| Other | 19 | 19 | 0 |
| **Total** | **431** | **443** | **+12** |

---

## 🟡 Known issues (TODO list)

20 entries currently tracked. Session A closed TODO-008, TODO-013, TODO-014.

**HIGH severity (open)**:
- TODO-010 — Versioning UI (Session B — Option A: 2 modals on existing 3-state machine)
- TODO-017 — Refresh token rotation (D1+D2 partial)

**MEDIUM severity (open)**:
- TODO-001..007, 009, 015, 016 (registry/cosmetic/scope-deferred items)
- TODO-011 — Templates wizard (Session B)
- TODO-012 — Canvas polish: right-click + keyboard shortcuts (Session B)
- TODO-024 — Change-of-shift / hand-off flow (post-MVP)
- TODO-026 — Per-stage StepExecution model deferral
- TODO-027 — PROMPT_4_PHASE_2: wire AutoGenEngine to entity creation flows (post-MVP)
- TODO-028 — Pointer to archived workflow-step rules spec (potential PROMPT_4b)

**LOW severity**:
- TODO-025 — HMI logo cross-reference

**Closed by Session A**:
- TODO-008 — ✅ closed (reinterpreted as DECISION+INFORMATION+TEARDOWN forms + deviceCategory selector for parallel-ops data side)
- TODO-013 — ✅ closed (inline canvas badges via shared validation context)
- TODO-014 — ✅ closed (Phase + Group configurator forms shipped)

**To create in Session B**:
- TODO-029 — Canvas drag-to-reorder steps within group (dropped from PROMPT_3b_FULL scope, low priority)
- Session B will also correct TODO-010 wording (the original mentioned 5-state lifecycle which doesn't exist — actual schema is 3-state draft → approved → deprecated)

---

## 🚀 Roadmap — re-baselined May 1 very late evening

| Phase | Scope | Status | Time estimate |
|---|---|---|---|
| PROMPT_1 | Foundation | ✅ Done | — |
| PROMPT_2 | 13 Registries | ✅ Done | — |
| PROMPT_3a | Workflow Designer Core | ✅ Done | — |
| PROMPT_3b_REDUCED | Advanced (3 forms + Validation) | ✅ Done | — |
| PROMPT_5_LITE | HMI Execution (mock) | ✅ Done | — |
| PROMPT_5_FULL | Production-grade HMI (D1-D6) | ✅ Done | — |
| PROMPT_4 | Auto-Generation Engine | ✅ Done | — |
| **PROMPT_3b_FULL Session A** | **3 forms + configurators + badges** | **✅ Done (May 1)** | — |
| PROMPT_3b_FULL Session B | Versioning UI + templates wizard + canvas polish | ⏭️ Next | 4-5h |
| PROMPT_6 | Dashboard & Reporting (handoff Claude Design) | ⏭️ Planned | 5-7h |
| PROMPT_3c | WorkflowSnapshot live preview + perf + E2E | ⏭️ Planned | 8-10h |

**Realistic MVP target**: 8-12 May. Session B + PROMPT_6 + PROMPT_3c = ~17-22h Claude Code residue.

---

## 📋 Conventions (unchanged)

### Technical
- Stack: pnpm workspaces + Turborepo, React 18, Next.js 14, NestJS 10, TypeScript strict
- DB: SQLite local
- Auth: ✅ Argon2id implemented for PIN. JWT in HttpOnly cookie
- State machines: XState v5 — 6 machines
- Validation: Zod (FE+BE shared via `@mes/schemas`)
- Real-time: Socket.IO (server emit + HMI listener)
- Workflow Designer: `@xyflow/react` + `@dagrejs/dagre` + Zustand + react-hook-form + Zod. **9/9 step categories** + Phase/Group configurators + inline validation badges (Session A)
- HMI: Zustand + `@tanstack/react-query` + `@xstate/react` + `socket.io-client`
- RBAC: skill-based via `OperatorSkill` join (QC, MANAGER)
- Code generation: AutoGenEngine pattern with 7 resolvers

### Compliance
- IATF 16949 → audit log 15+ years
- GDPR → operator data minimization
- ECE-R104 (Safety Devices)
- 21 CFR Part 11 → electronic signatures
- PIN auth: Argon2id — OWASP 2024 compliant
- WorkflowSnapshot immutability: ADR-001

---

## ⚠️ Lessons learned (consolidated, +6 from Session A)

### Original (April 28-29) — 12 lessons
### April 30 (D1-D5) — 24 lessons
### May 1 (D6 + PROMPT_4) — 12 lessons

### Session A — 6 new

49. **PARALLEL is a deviceCategory flag, not a StepCategory**: original kickoff confused these. Discovery during PHASE 1 reading saved hours of dead-end work. Lesson: always cross-check enum semantics against the actual schema/types files before coding.

50. **Test gap honesty**: target was ≥460 tests, achieved 443. Apps/web has no vitest runner — React forms can't be unit-tested in this session. Better to be honest than gonfiare with low-value tests. Lesson: when target unreachable for environmental reasons, document and explain rather than padding.

51. **WorkflowValidationProvider context pattern**: shared validation state between canvas (badges) and sidebar (ValidationPanel) via React Context. Avoids store mutation, no duplication, single source of truth. Reusable for future cross-component derived state.

52. **buildSavePayload opportunistic fix**: while extending payload for new step types, noticed isCycleBased/supportsParallel/supportsRecovery were hardcoded `false` (legacy). Read from node.data instead. Phase/Group configurators now actually persist their toggles. Pattern: when touching serialization code, audit other related fields for hidden hardcoded defaults.

53. **Worktree .env quirk for apps/api dev smoke**: NestConfigModule resolves envFilePath relative to package cwd, not project root. Worktree needs .env copies in root, packages/prisma, AND apps/api. Operational note for future Session B and beyond — relevant for dev smoke but not for build/test/lint gates.

54. **Vitest 2.1.x parallel runner Windows flake**: `pnpm test` sometimes hits temp-file races (UNKNOWN error opening AppData\Local\Temp\…). Workaround: run with `--concurrency=1` or per-package serial. Test results are correct in both modes — only the parallel runner has the race. Worth noting for CI considerations.

55. **TypeScript constructor params with function default values trigger Nest DI Function-resolution attempts**: Symptom: `Nest can't resolve dependencies of X (..., ?)` at boot, despite test-green via direct instantiation. Cause: TS emits `Function` parameter metadata for `random: () => number = Math.random`; Nest tries to resolve a `Function` provider for that index and fails. Fix: `@Optional()` decorator on the parameter so Nest skips DI and uses the default value. Detection gap: unit tests using `new ServiceX(...)` bypass the DI container entirely; only runtime smoke (`pnpm dev`) catches it. Going forward: when introducing services with function-typed default-value constructor args, either (a) add `@Optional()` proactively, or (b) add a minimal NestJS-bootstrap integration test that wires through the DI container, not just direct instantiation. (Encountered: PROMPT_PNE_3 D4 hotfix, May 3, 2026 — affected MockLeakTester / MockCameraTester / MockCrimpPress.)

56. **Auth-strategy decisions must be explicit per controller; method-level gating runs AFTER guard**: Symptom: `/api/internal/mock-devices` returned 401 instead of the expected 404-when-DEMO_MODE-off, blocking the back-office /demo page. Cause: PNE_3 added `@UseGuards(JwtAuthGuard)` at the class level on both mock controllers, but the DEMO_MODE check (which throws 404) lives inside the method body — guards always fire first, so the demo page got 401 before the method ever ran. Architectural note: this codebase has NO global JWT guard and NO `@Public()` decorator — auth is opt-in per controller via `@UseGuards`. To make a route public, simply omit the decorator. Fix: removed `@UseGuards` from both `/api/internal/*` controllers; FastForward (which uses `req.user.id`/`plantId` for audit) now falls back to `DEMO_USER_ID`/`DEMO_PLANT_ID` env vars when no session is present. Detection gap: same as Lesson 55 — unit tests instantiate controllers directly and synthesize `req.user`, so neither the guard nor the missing-user path is exercised; only HTTP-level smoke catches it. Going forward: when introducing a new controller, write a one-line comment at class declaration stating the auth posture (Public / Authenticated / Role-Based) and the rationale, so the choice is reviewable rather than implicit. (Encountered: PROMPT_PNE_3 D4 hotfix #2, May 3, 2026.)

---

## 🗂️ Repo structure (post Session A)

```
apps/web/src/components/workflow/
├── forms/
│   ├── ProductionStepForm.tsx       (extended with deviceCategory)
│   ├── QualityControlStepForm.tsx
│   ├── ScanStepForm.tsx (IDENTIFICATION)
│   ├── LogisticsStepForm.tsx
│   ├── SetupStepForm.tsx
│   ├── RecoveryStepForm.tsx
│   ├── DecisionStepForm.tsx         ← NEW Session A
│   ├── InformationStepForm.tsx      ← NEW Session A
│   ├── TeardownStepForm.tsx         ← NEW Session A
│   ├── PhaseConfigurator.tsx        ← NEW Session A
│   ├── GroupConfigurator.tsx        ← NEW Session A
│   └── StepConfigurator.tsx         (router for 9 step + 2 node types)
├── nodes/
│   ├── StepNode.tsx                 (with NodeErrorBadge)
│   ├── PhaseNode.tsx                (with NodeErrorBadge)
│   ├── GroupNode.tsx                (with NodeErrorBadge)
│   └── NodeErrorBadge.tsx           ← NEW Session A
├── validation-context.tsx           ← NEW Session A
├── useWorkflowValidation.ts         ← NEW Session A
├── ValidationPanel.tsx              (refactored to use shared hook)
├── WorkflowCanvas.tsx               (palette extended, save payload fixed)
├── WorkflowPalette.tsx              (3 new step items)
└── store.ts
```

9/9 step categories covered. Phase + Group configurators wired. Inline badges on every node type.

---

## 🎯 Next concrete action

**PROMPT_3b_FULL Session B** (~4-5h) — completes PROMPT_3b_FULL.

Scope:
- 2.5 Versioning UI Option A: 2 modals (Approve, Deprecate) on existing 3-state machine + sidebar history
- 2.6 Templates wizard: seed 3 Pneumatic Air templates as Workflows with code prefix `TPL_PNEU_*` + filter wizard on prefix
- 2.7 Canvas polish: right-click context menu (delete/duplicate/disable), keyboard shortcuts (Del, Ctrl+D, Ctrl+Z, Ctrl+Shift+Z) — drag-to-reorder dropped to TODO-029
- 2.8 Final DoD + atomic commit

After Session B, PROMPT_3b_FULL is 100% complete and 7/8 PROMPT done.

---

## 📊 Progress dashboard

```
PROMPT_1   ████████████ 100% Foundation
PROMPT_2   ████████████ 100% Registries
PROMPT_3a  ████████████ 100% Workflow Core
PROMPT_3b  ██████████░░  80% (REDUCED + Session A done; Session B 4-5h)
PROMPT_4   ████████████ 100% Auto-gen
PROMPT_5   ████████████ 100% Production-grade HMI
PROMPT_3c  ░░░░░░░░░░░░   0% (unblocked)
PROMPT_6   ░░░░░░░░░░░░   0% (handoff Claude Design ready)
─────────────────────────────────────
~78% MVP done | Tests 443 (+249% from baseline 127) | Build 12/12 | TODOs 20 | 6.5/8 PROMPT done
```

**MVP target 8-12 May confirmed realistic.**


## Smoke verifications

- 2026-05-02 13:30: smoke /items canary verified by user (Antonella). 6 type tabs visible (Tutti/PF/Semi/MP/Comp/Cons), layout correct, search/sort/multi-select rendering OK. /operators and /equipment legacy paths render correctly without tabs (backward-compat preserved). PROMPT_DS_LIFT D3 confirmed runtime-stable on Windows + Chrome.


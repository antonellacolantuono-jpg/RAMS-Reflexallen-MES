# PROMPT_PNE_4_FOCUSED — HMI execution + Action Type configurator + Configurable Recovery

> **Phase**: F1.6 — Pneumatic First (final F1 PROMPT)
> **Effort**: 15-20h (2.5-3 giornate Claude Code)
> **Calendar**: 4-7 maggio 2026
> **Demo target**: Reflex Allen S.p.A. — 18-22 maggio 2026
> **Status**: Replaces original `prompts/PROMPT_PNE_4.md` — focused scope per Antonella's decision (3 mag 2026)

---

## 1. Context

F1 (Pneumatic First) at 83%: PROMPT_3d, PNE_1, PNE_2, PNE_3 closed (cumul 692 tests). PNE_3 shipped mock device simulators + DemoToggle UI + FastForward endpoint, with 2 hotfixes for runtime DI/auth/env issues (Lessons 55+56).

This PROMPT closes F1 by adding the **operator execution surface** customer will see during demo:
- Configurator polish: Action Type explicit selector + title/description autofill from selected resources + photo upload mock
- HMI Step Generic view (1 unified component, no specialized variants per device type)
- Device cycle integration (closes TODO-043 deferred from PNE_3)
- Parallel slots split layout during device_main cycles
- Configurable recovery flow with max retry attempts + pre-retry steps
- Scrap flow with cause code + photo
- WO journey end-to-end PASS + FAIL+Recovery+Scrap

**Why this scope (not original PROMPT_PNE_4)**: customer demo journey requires (1) workflow editor with action types visible, (2) HMI with device output visible (telemetry + ROI), (3) recovery flow demonstrable. Original PROMPT_PNE_4 had specialized HMI Leak/Camera × 2 + 4-stage Recovery + label print SVG + KPI grid — too much surface, high bug risk, low marginal demo value. FOCUSED ships exactly the demo critical path with config-driven flexibility (max retry / pre-retry steps configurable per workflow rather than hardcoded 4-stage).

---

## 2. Goal

After this PROMPT closes:
- Process Engineer can configure step with explicit action type (40+ action types catalog) + title/description autofill from resources
- Operator on HMI can execute any device step with live telemetry visible (leak rate / ROI grid / crimp force)
- Operator can execute parallel steps during device cycle (split layout)
- Operator on FAIL can retry (configurable max attempts, optional pre-retry steps) or scrap (cause code + photo)
- WO journey demoable end-to-end on WO-2026-PNE-0042 (seeded by PNE_2)
- F1 100% complete, demo-ready

---

## 3. Increment plan

### D1 — Action Type selector + Title/Description autofill + Photo upload (3-4h)

**Files modified/added**:
- `apps/web/src/components/workflow/configurator/action-forms/ManualForm.tsx` (and 7 siblings) — extend with Action Type dropdown
- `apps/web/src/components/workflow/configurator/ActionConfig.tsx` — wire Action Type state
- `apps/web/src/lib/step-action-types.ts` (NEW) — catalog of 40+ action types from MASTER_SPECIFICATION § 4.5, mapping to step categories
- `apps/web/src/lib/step-title-templates.ts` (NEW) — templates for autofill (e.g., `apply_label` -> "Applica etichetta {label}")
- `apps/web/src/components/workflow/configurator/PhotoUploadField.tsx` (NEW) — drag-drop area, base64 in-memory storage, thumbnail preview, remove button
- `apps/web/src/components/workflow/AddStepDialog.tsx` — integrate Action Type + autofill behavior + photo into form

**Action types catalog (per category)** — from MASTER_SPECIFICATION § 4.5:
- `production`: assembly | process | device_run | rework
- `logistics`: move | transfer | load | unload
- `identification`: scan_barcode | scan_qr | scan_rfid | scan_datamatrix | manual_id_entry | print_label | apply_label | verify_id
- `quality_control`: visual_check | dimensional_check | functional_test | sample_take | document_defect
- `decision`: auto_branch | manual_choice | condition_check
- `information`: read_sop | safety_briefing | view_video | view_drawing
- `setup` / `teardown`: verify_workstation | verify_skill | verify_tool | verify_material | load_recipe | unload_recipe | first_piece | last_piece | cleanup
- `box` (v1.1): pack_into_box | unpack_from_box | seal_box | open_sealed_box | palletize_box | depalletize_box | inspect_box | clean_box | select_empty_box | validate_box_capacity | print_box_label

**Autofill behavior**:
- When operator selects Action Type -> suggest title prefix (e.g., `apply_label` -> "Applica etichetta")
- When operator selects resource -> append resource code to title (e.g., LBL-PNE-001 -> "Applica etichetta LBL-PNE-001")
- Description template auto-populated, operator can edit freely after autofill (no lock)
- Title/description are NOT auto-saved; operator confirms via Save Step button

**Photo upload**:
- Drag-drop OR click to upload area
- Base64 in-memory storage (NO real backend, mock per TODO-040 pattern)
- Thumbnail preview after upload (max 200x200)
- Remove button on hover
- Persisted in `node.data.photoBase64` (session-only, lossy on reload)

**Tests (target +5)**:
1. Step action types catalog filtered correctly per category
2. Title autofill triggers on Action Type change
3. Title autofill appends resource code on resource select
4. Description template populates correctly
5. PhotoUploadField renders + accepts upload + shows thumbnail

**Gates D1**: type-check + lint + build clean; cumul >=697.

**Commit**: `feat(workflow-configurator): action type selector + title autofill + photo upload (PROMPT_PNE_4_FOCUSED D1)`

---

### D2 — HMI Step Generic + Device cycle integration (4-5h) — closes TODO-043

**Files modified/added**:
- `apps/api/src/modules/work-orders/step-execution.service.ts` — add device dispatch branch:
  - When step.deviceCategory === 'device_main' AND DEMO_MODE enabled -> invoke MockSimulatorRegistry to start cycle
  - Subscribe to simulator outcome -> on cycle complete, transition state machine (COMPLETE_OK on PASS/MARGINAL, COMPLETE_NOK on FAIL)
  - Backwards-compat preserved (real device path remains as no-op for now, F2 will implement)
- `apps/hmi/src/components/HMIStepGeneric.tsx` (NEW) — universal step view:
  - Title with resources highlighted as chips
  - Description (rich text rendering)
  - Photo from step config (read-only display)
  - Resource list (materials/tools/devices/skills as chips with code+name)
  - Action button: "Avvia"/"Completa" (depends on deviceCategory)
- `apps/hmi/src/components/HMIDeviceCycle.tsx` (NEW) — device cycle subview when deviceCategory === 'device_main':
  - Countdown timer (45s leak / 8s camera / 8s crimp from recipe.cycleTimeSec)
  - 2s polling on `/api/internal/mock-devices/:id` (PNE_3 endpoint)
  - Telemetry display per device type:
    - Leak: pressureBar + leakRateMbarMin + threshold (0.5 mbar/min) — show pass/fail line
    - Camera: 4 ROI grid with score per ROI (>=95% green chip, <95% red chip)
    - Crimp: forceKn + peakForceKn + tolerance band (25kN +/-1)
  - On cycle complete: outcome badge (PASS green / MARGINAL yellow / FAIL red) using design tokens
  - "Continua" button on PASS/MARGINAL -> triggers state machine COMPLETE_OK
  - On FAIL: triggers recovery flow (D4)

**Tests (target +6)**:
1. HMIStepGeneric renders title + description + resources for non-device step
2. HMIStepGeneric for device_main step delegates to HMIDeviceCycle
3. HMIDeviceCycle polls every 2s when running
4. HMIDeviceCycle displays leak telemetry correctly
5. HMIDeviceCycle displays camera ROI grid correctly
6. step-execution.service.ts dispatches to MockSimulatorRegistry for device_main steps

**Gates D2**: type-check + lint + build + run pnpm dev manually to verify no DI/auth runtime issues (Lessons 55+56). Cumul >=703.

**Commit**: `feat(hmi): step generic view + device cycle integration + close TODO-043 (PROMPT_PNE_4_FOCUSED D2)`

---

### D3 — Parallel slots split layout (3-4h)

**Files modified/added**:
- `apps/hmi/src/components/HMIDeviceCycleWithParallels.tsx` (NEW) — extends HMIDeviceCycle when has children with deviceCategory === 'parallel':
  - Split layout: TOP device cycle (timer + telemetry from D2), BOTTOM parallel slots grid
  - Each parallel slot: title, description, "Esegui" button (manual completion)
  - Constraint: parallel slot grayed out if device.state !== 'running'
  - Counter visible: "X/Y paralleli completati"
  - All parallel completion is independent of device cycle finish
- `apps/hmi/src/components/HMIParallelSlot.tsx` (NEW) — single parallel step card
- `apps/hmi/src/lib/parallel-resolution.ts` (NEW, or extend existing parallel-ops.rules.ts in @mes/domain) — selector to find children with deviceCategory === 'parallel' for given device_main step

**Layout**:
```
+----------------------------------------------------+
|  TIMER 00:23 / 00:45                               |
|  [############------------------]  51%             |
|  Pressione: 5.8 bar                                |
|  Leak rate: 0.3 mbar/min OK (threshold 0.5)        |
+----------------------------------------------------+
|  PARALLELI 1/3                                     |
|  +----------+ +----------+ +----------+            |
|  | Apply    | | Apply    | | Prepare  |            |
|  | Label    | | Tape     | | Next     |            |
|  | DONE     | | Esegui   | | Esegui   |            |
|  +----------+ +----------+ +----------+            |
+----------------------------------------------------+
```

**Tests (target +4)**:
1. parallel-resolution selects children with deviceCategory === 'parallel'
2. HMIDeviceCycleWithParallels renders split layout when parallels exist
3. HMIParallelSlot disabled when device not running
4. Counter increments on parallel completion

**Gates D3**: type-check + lint + build clean; cumul >=707.

**Commit**: `feat(hmi): parallel slots split layout during device cycle (PROMPT_PNE_4_FOCUSED D3)`

---

### D4 — Configurable recovery + Scrap flow + WO journey + F1 closure (5-7h)

**D4 Part A — Recovery configuration in workflow editor (1.5-2h)**:

Files modified/added:
- `apps/web/src/components/workflow/configurator/action-forms/AutomaticForm.tsx` — extend with recovery section when supportsRecovery=true:
  - "Max tentativi retry" number input (default 2)
  - "Step pre-retry" multi-select from current workflow's existing steps (Option A: refs to existing step IDs, NOT new step rows)
- `apps/web/src/lib/step-validation-schemas.ts` — add recoveryConfig to AutomaticForm Zod schema
- `apps/web/src/components/workflow/store.ts` — extend addStepNodeToGroup payload with recoveryConfig
- For seeded workflow v1 from PNE_2: hardcode in seed (no UI roundtrip needed for demo) — extend `packages/prisma/seed/pneumatic-data/workflow-v1.ts` to set `recoveryConfig` in step instructions or node.data equivalent

Persistence note: recoveryConfig stored in node.data session-only (extend TODO-040). For seeded workflow, encoded in step.instructions as text marker (S3-style workaround) until F2 schema migration.

**D4 Part B — HMI Recovery flow (1.5-2h)**:

Files modified/added:
- `apps/hmi/src/components/HMIRecoveryFlow.tsx` (NEW):
  - Triggered when device cycle FAIL outcome
  - Show outcome FAIL with telemetry visible (leak rate, ROI failures, etc.)
  - Show counter "Tentativo X/Y"
  - 2 buttons: "Riprova" (enabled while attempt < max) + "Scarta" (always enabled, bg-bad)
  - Click "Riprova":
    - If pre-retry steps configured: render each as standard step using HMIStepGeneric
    - On all pre-retry complete: re-launch device cycle (calls D2 dispatch again)
  - Counter "Tentativo X/Y" increments after each retry start
- `apps/hmi/src/components/HMIScrapForm.tsx` (NEW):
  - Triggered when "Scarta" clicked OR attempts == max
  - Cause code dropdown (from `/api/cause-codes?category=recovery_fault&phase=leak|camera`)
  - Photo upload mock (reuse PhotoUploadField from D1)
  - Optional notes textarea
  - "Conferma scarto" button (bg-bad, primary)
  - On confirm: WO.qtyScrap++, WO.qtyRemaining++, audit log entry, exit recovery, continue workflow

**D4 Part C — WO journey end-to-end (1-1.5h)**:

Files modified/added:
- `apps/hmi/src/app/login/page.tsx` (NEW or extend existing) — login Mario Rossi (badge 1234, PIN 1234)
- `apps/hmi/src/app/work-orders/page.tsx` (NEW or extend existing) — list assigned WOs
- `apps/hmi/src/app/work-orders/[id]/execute/page.tsx` (NEW) — workflow rendering + step-by-step execution using HMIStepGeneric + HMIDeviceCycleWithParallels + HMIRecoveryFlow + HMIScrapForm
- WO completion: toast "WO completato" + counter visibility (qtyProduced / qtyScrap / qtyRework)

**D4 Part D — F1 closure (0.5-1h)**:

Files added (committed env templates):
- `apps/api/.env.example` — DEMO_MODE=true placeholder + DATABASE_URL example + DEMO_USER_ID/DEMO_PLANT_ID placeholders
- `apps/web/.env.local.example` — NEXT_PUBLIC_DEMO_MODE=true placeholder
- `CLAUDE.md` or `README.md` — add "Demo mode setup" section listing 3 env files needed + setup commands

Files updated:
- `STATUS.md` — F1 closure summary table (all 6 PROMPTs, total tests ~712, total commits, demo-ready state, lessons 55+56 referenced)
- `ROADMAP.md` — mark F1.6 done -> F1 100% complete; F2 begins after demo (21 May+)
- `TODO.md` — TODO-043 closed; TODO-040 extended with recoveryConfig + photo + actionType fields

**Tests D4 (target +7)**:
1. AutomaticForm renders recovery section when supportsRecovery=true
2. recoveryConfig validates with Zod schema
3. HMIRecoveryFlow renders retry button when attempt < max
4. HMIRecoveryFlow disables retry when attempt == max
5. HMIScrapForm renders cause codes filtered by phase
6. HMIScrapForm submit increments WO.qtyScrap
7. WO completion flow ends workflow correctly

**Gates D4 (FINAL)**:
- type-check + lint + build clean across all 13 packages
- pnpm --filter @mes/api test, @mes/web test, @mes/hmi test all pass
- pnpm dev manual verification (Lessons 55+56 — boot must succeed without DI/auth/env issues)
- Test cumul >=712 (floor 704, ideal 710 — both passed)
- STATUS.md + ROADMAP.md + TODO.md updated
- Manual smoke deferred to user per CLAUDE.md PHASE 4

**Manual smoke planned for user (NOT Claude Code)**:
1. Setup: pnpm dev with all 3 env files + DEMO_MODE=true
2. Workflow editor: open `wf-pneumatic-air-680-v0` (Empty), build a phase manually testing Action Type selector + title autofill
3. HMI: login Mario Rossi -> open WO-2026-PNE-0042 -> walk PASS journey
4. HMI Recovery: from `/demo` panel, force FAIL on DEV-LEAK-001 -> re-walk WO -> verify retry counter + scrap flow
5. WO completion: verify counters update correctly

**Commit**: `feat(hmi+workflow): configurable recovery + scrap flow + WO journey + close PROMPT_PNE_4_FOCUSED + F1 (PROMPT_PNE_4_FOCUSED D4)`

---

## 4. Out of scope (deferred)

- HMI Leak Test specialized DEDICATED component (covered by HMIStepGeneric + HMIDeviceCycleWithParallels generic flow)
- HMI Camera Test specialized DEDICATED component (camera ROI grid is part of HMIDeviceCycle telemetry per device type)
- Label print SVG floating fancy animation (deferred to F2 / PROMPT_7 detail polish)
- Packaging fidelity strict validation (deferred to F3 / PROMPT_10 Industrial Ops)
- WO completion KPI grid dashboard (deferred to F2 / PROMPT_6 Andon or F3 / PROMPT_13 Audit)
- Multi-device dispatch coordination (deferred to F3 / PROMPT_9 Equipment XState)
- Real device integration (DEMO_MODE only; real path no-op until F2 / F3)
- Schema migration for recoveryConfig + photo + actionType (TODO-040 extended)

---

## 5. Pre-flight checks (STOP conditions)

Before D1, verify and report STOP if any fail:

1. Branch state clean, HEAD on or after `2b3035d` (PNE_3 D4 hotfix #2)
2. Test baseline = 692 (api 281 + domain 197 + ui 119 + schemas 29 + cache 8 + queue 5 + storage 6 + web 29 + prisma 18). If different, baseline mismatch — STOP and report.
3. Worktree env setup needed:
   - pnpm install if node_modules missing
   - pnpm --filter @mes/prisma generate if Prisma client missing
   - pnpm build for workspace package dist outputs
   - apps/api/.env with DEMO_MODE=true + DATABASE_URL=file:../../packages/prisma/dev.db
   - apps/web/.env.local with NEXT_PUBLIC_DEMO_MODE=true
4. Pneumatic seed loaded: pnpm --filter @mes/prisma seed:pneumatic (idempotent, safe to re-run). Verify seed:
   - Workflow `wf-pneumatic-air-680-v1` exists with 4 phases / 6 groups / 34 steps
   - WO-2026-PNE-0042 in `released` status
   - 3 devices DEV-LEAK-001 / DEV-CAMERA-001 / DEV-CRIMP-001
   - 3 recipes RCP-LEAK-PNE-12-001 (v2) / RCP-CRIMP-12-001 / RCP-CAMERA-PNE-001
   - 10 fault codes (5 LK-* + 5 CM-*) as CauseCode rows with category='recovery_fault'
5. Pre-existing simulator infrastructure from PNE_3:
   - apps/api/src/modules/mock-devices/{leak,camera,crimp}-tester.service.ts exist
   - /api/internal/mock-devices/* endpoints respond (no auth required)
   - DEMO_MODE boot guard active in apps/api/src/main.ts
6. TODO-043 still open in TODO.md (target for closure in D2)

If any pre-flight fails, STOP and report which check failed + observed state.

---

## 6. Critical files (read or modify)

**Modify**:
- `apps/api/src/modules/work-orders/step-execution.service.ts` (D2 — device dispatch)
- `apps/web/src/components/workflow/AddStepDialog.tsx` (D1 — Action Type + autofill + photo)
- `apps/web/src/components/workflow/configurator/ActionConfig.tsx` (D1)
- `apps/web/src/components/workflow/configurator/action-forms/*.tsx` (D1, D4 — recovery config in AutomaticForm)
- `apps/web/src/lib/step-validation-schemas.ts` (D1 + D4)
- `apps/web/src/components/workflow/store.ts` (D1 + D4 — extend payload)
- `packages/prisma/seed/pneumatic-data/workflow-v1.ts` (D4 — hardcode recoveryConfig)
- `STATUS.md`, `ROADMAP.md`, `TODO.md`, `CLAUDE.md` or `README.md` (D4 closure)

**Add**:
- `apps/web/src/lib/step-action-types.ts` (D1)
- `apps/web/src/lib/step-title-templates.ts` (D1)
- `apps/web/src/components/workflow/configurator/PhotoUploadField.tsx` (D1)
- `apps/hmi/src/components/HMIStepGeneric.tsx` (D2)
- `apps/hmi/src/components/HMIDeviceCycle.tsx` (D2)
- `apps/hmi/src/components/HMIDeviceCycleWithParallels.tsx` (D3)
- `apps/hmi/src/components/HMIParallelSlot.tsx` (D3)
- `apps/hmi/src/lib/parallel-resolution.ts` or extend `@mes/domain` (D3)
- `apps/hmi/src/components/HMIRecoveryFlow.tsx` (D4)
- `apps/hmi/src/components/HMIScrapForm.tsx` (D4)
- `apps/hmi/src/app/login/page.tsx` (D4 if missing)
- `apps/hmi/src/app/work-orders/page.tsx` (D4 if missing)
- `apps/hmi/src/app/work-orders/[id]/execute/page.tsx` (D4)
- `apps/api/.env.example` (D4)
- `apps/web/.env.local.example` (D4)

**Read (no modification expected)**:
- `docs/MASTER_SPECIFICATION.md` § 4.5 (Action Types catalog), § 4.7 (Step Device Category), § 4.9 (Part Reference for parallel)
- `docs/WORKFLOW_PNEUMATIC_AIR_DETAILED.md` § 7.1-7.3 (Leak Test phase + recovery flow detail)
- `docs/MOCK_DATA_PNEUMATIC_AIR.md` § 14.7 (leak parallel structure)
- `prompts/PROMPT_3d.md` (workflow editor patterns)
- `prompts/PROMPT_PNE_3.md` (simulator + DemoToggle patterns to reuse)
- `apps/api/src/modules/mock-devices/*` (PNE_3 simulator services)
- `apps/web/src/app/demo/DemoPanel.tsx` (PNE_3 polling pattern reference)

---

## 7. Test ladder

Baseline 692 (post-PNE_3 D4 + 2 hotfix). Floor +12 = >=704. Ideal +18 = >=710.

| Increment | New tests | Cumul | Floor cumulative | Margin floor |
|---|---|---|---|---|
| Baseline | — | 692 | — | — |
| D1 (Action Type + autofill + photo) | +5 | 697 | 695 | +2 |
| D2 (HMI Generic + device cycle + TODO-043) | +6 | 703 | 698 | +5 |
| D3 (parallel slots) | +4 | 707 | 700 | +7 |
| D4 (recovery configurable + scrap + journey) | +7 | 714 | 704 | +10 |

Plan delivers 714 tests = +22 from baseline (above ideal +18 = 710 by +4).

If any Dn falls below floor, STOP and report.

---

## 8. Surprise budget triggers

Stop and request user decision if encountered during implementation:

- **S1 — Real-device path in step-execution**: if step-execution.service.ts has hard-wired real device path that breaks if mock dispatch added -> coordinate
- **S2 — recoveryConfig storage**: if node.data.recoveryConfig pattern conflicts with existing payload shape -> fall back to step.instructions text marker (S3-style)
- **S3 — Camera ROI data shape**: if PNE_3 CameraTester telemetry doesn't expose 4 ROI scores in JSON -> extend simulator (~30 min) OR fallback to overall outcome only
- **S4 — Pre-retry steps as refs**: if Option A (refs to existing step IDs) causes infinite loop risk in HMI execution flow -> switch to Option B (new dedicated recovery step rows)
- **S5 — Login flow missing**: if apps/hmi has no existing login page (not just badge auth scaffold) -> either create minimal one or skip and assume auth provided
- **S6 — WO journey orchestration**: if step ordering through phases/groups requires non-trivial state machine -> focus on linear PASS path for demo, defer complex orchestration to F2

For all surprises: document workaround in STATUS closure, open TODO if deferred.

---

## 9. Opportunistic targets

- **TODO-043 closure**: device-execution dispatch wired in D2. Acceptance criteria: SimulatorRegistry invoked for device_main steps under DEMO_MODE, outcome dispatches state machine transitions, real-device path no-op preserved.
- **Lesson 55+56 prevention**: run `pnpm dev` manually after each Dn to verify no DI/auth/env runtime issues (not just `pnpm test`). Add this to PHASE 3 gates per increment.
- **Env templates committed**: D4 closure adds `apps/api/.env.example` + `apps/web/.env.local.example` so future contributors don't repeat the env discovery process. Document in CLAUDE.md.

---

## 10. Closure deliverables (D4)

**Code changes**:
- TODO-043 closed (device-execution dispatch wired)
- Action Type selector in AddStepDialog + autofill + photo
- HMI Step Generic + Device Cycle + Parallels + Recovery + Scrap
- WO journey end-to-end PASS + FAIL+Recovery+Scrap

**Documentation**:
- STATUS.md: F1 closure section with all 6 PROMPTs summary, total tests ~714, total commits, lessons 55+56, demo-ready confirmation
- ROADMAP.md: F1.6 marked done -> F1 100% complete
- TODO.md: TODO-043 closed; TODO-040 extended with recoveryConfig + photo + actionType + recoveryAttempts session-only fields
- CLAUDE.md or README.md: "Demo mode setup" section with 3 env files + DEMO_USER_ID/DEMO_PLANT_ID for FastForward

**Env templates committed**:
- `apps/api/.env.example`
- `apps/web/.env.local.example`

**Suggested commit message** (D4 final):
```
feat(hmi+workflow): configurable recovery + scrap flow + WO journey + close PROMPT_PNE_4_FOCUSED + F1 (PROMPT_PNE_4_FOCUSED D4)

- Recovery configuration in AutomaticForm: max retry attempts +
  pre-retry step refs (Option A: refs to existing step IDs)
- HMIRecoveryFlow: retry button (configurable max), counter,
  pre-retry steps execution, scrap fallback
- HMIScrapForm: cause code dropdown (CauseCode category=recovery_fault
  filtered by phase), photo upload mock, notes, confirm
- WO journey end-to-end: login Mario Rossi -> open WO-2026-PNE-0042
  -> step-by-step execution -> completion
- F1 closure: STATUS, ROADMAP, TODO, CLAUDE.md/README updates
- Env templates committed: apps/api/.env.example +
  apps/web/.env.local.example
- Tests: 707 -> 714 (+7)
- TODO-043 closed (device-execution dispatch from D2)

Closes F1 100%. Demo-ready for Reflex Allen 18-22 May.
```

After D4 commit + push: do NOT auto-start anything else. F2 begins after demo (21 May+).

---

## 11. Workflow rules (per Antonella)

- Run pre-flight per § 5 before D1; stop and report if anything unexpected
- For each Dn: implement -> run gates -> 1-3 line report -> wait for user "ok" before commit
- Use conventional commit messages with `(PROMPT_PNE_4_FOCUSED Dn)` suffix
- Stop and ask for any surprise outside § 8 surprise budget
- Test floor MUST be respected at each Dn — if undershoot, stop
- Mockup fidelity HIGH — this PROMPT ships customer-facing demo HMI
- After D4 close, NO auto-start — wait for user

---

## 12. Lessons learned to avoid (from PNE_3)

- **Lesson 55**: TypeScript constructor params with function default values trigger Nest DI Function-resolution. Use @Optional() decorator proactively.
- **Lesson 56**: NestJS auth guards run BEFORE method handlers. Use the codebase's public-route pattern (or no @UseGuards) for debug-only endpoints under /api/internal/*. Always run `pnpm dev` manually post-Dn to catch runtime DI/auth/env issues, not just `pnpm test`.
- **Env propagation**: Next.js apps don't read root `.env`; they need `apps/<name>/.env.local` (web) or `apps/<name>/.env` (api). D4 closure delivers committed `.env.example` files to make this discoverable.

---

End of PROMPT_PNE_4_FOCUSED specification.

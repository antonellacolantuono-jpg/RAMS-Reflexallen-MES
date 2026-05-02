# PROMPT_PNE_4 — HMI Leak Test + Camera Test specialized + Scrap & Label fidelity

> **Version**: 1.0
> **Author**: Antonella Colantuono (via Claude chat)
> **Date**: 2026-05-02
> **Branch base**: `main` (post PROMPT_PNE_3 merge)
> **Estimated effort**: 12-16h (across 6 increments — biggest of the PNE series)
> **Test budget**: floor +18, ideal +26
> **Mockup fidelity**: NON-NEGOTIABLE — these are the demo "wow moment" screens

---

## 1. Goal

Build the HMI specialized screens that operators will see during the Pneumatic Air WO execution. These are the **customer-facing demo screens** at the heart of the demo. Mockup fidelity is non-negotiable.

Specifically:
- HMI Leak Test specialized: split layout TOP device timer (countdown 45s + recipe + pressure live) / BOTTOM 3 parallel slots side-by-side (apply label / apply tape / prepare next tube)
- HMI Camera Test specialized: simpler 8s cycle with 4 ROI cards
- HMI Recovery flow: stage 1-4 visualization, fault code dropdown, retest mini-screen, forced scrap with cause code + photo mock
- Label print mock: toast + floating SVG preview 3 sec
- Verify Packaging screen fidelity (already exists from PROMPT_5_FULL, ensure mockup-aligned)

This PROMPT closes F1. After D6, the user (Antonella) can run the full Pneumatic Air demo end-to-end in code reality.

---

## 2. Demo journey context

Before this PROMPT, the user can already do steps 1-3 of the demo journey:
1. Open workflow editor on `wf-pneumatic-air-680-v1` (post PROMPT_PNE_2) ✓
2. (Optional) Construct workflow on `wf-pneumatic-air-680-v0` to validate UX (post PROMPT_3d + PNE_1) ✓
3. Switch to HMI, login Mario Rossi (post PROMPT_5_FULL existing) ✓

PROMPT_PNE_4 enables steps 4-11:
4. Pick WO-2026-PNE-0042 from dispatch ✓ (existing from PROMPT_5_FULL, just verify it works with new WO)
5. BOM check screen → confirm ✓ (existing)
6. Final Assembly steps → routed via existing step renderer (manual/guided steps work today; crimp goes to existing automatic device path which now uses mock — works thanks to PNE_3 D3) ✓
7. Leak Test screen → **NEW specialized screen, this PROMPT D1-D2**
8. (FAIL path) Recovery screen → **NEW visualized recovery, this PROMPT D3**
9. Camera Test screen → **NEW specialized screen, this PROMPT D4**
10. Packaging screen → **verify fidelity, this PROMPT D5**
11. WO completion summary screen → **enhance, this PROMPT D5**

Throughout: label print mock toasts on label steps → **this PROMPT D5**.

---

## 3. What changes

### 3.1 HMI Leak Test specialized screen

Route: `apps/hmi/src/app/wo/[id]/leak-test/page.tsx` (new)

The existing generic step renderer (`apps/hmi/src/app/wo/[id]/page.tsx` from PROMPT_5_FULL) routes to this specialized screen when current step has:
- `actionType: device_run` AND
- `device.code === 'DEV-LEAK-001'` AND
- `parallelSteps.length > 0`

**Layout (mobile-first, target tablet 1024×768 landscape)**:

```
┌──────────────────────────────────────────────────────────┐
│  TopBar: Site · Shift · Operator · Clock · Battery       │
├──────────────────────────────────────────────────────────┤
│  PhaseProgressBar: Final Assembly ✓ · Leak Test (active) │
│                    · Camera Test · Packaging            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  TOP PANE (60% height, ~440px)                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │  [DEV-LEAK-001 — RUNNING]                          │ │
│  │                                                    │ │
│  │  Recipe: RCP-LEAK-PNE-12-001 v2                    │ │
│  │                                                    │ │
│  │  ╔════════════════════════════════════╗            │ │
│  │  ║  COUNTDOWN: 32 sec                 ║            │ │
│  │  ║  ████████████░░░░░░░░░░░  62%      ║            │ │
│  │  ╚════════════════════════════════════╝            │ │
│  │                                                    │ │
│  │  Pressure: 6.02 bar (target 6.0 ± 0.1)             │ │
│  │  [pressure mini-chart 5.9-6.1 oscillating]         │ │
│  │                                                    │ │
│  │  Phase: hold-and-measure                           │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  BOTTOM PANE (40% height, ~280px)                        │
│  3 swimlane cards side-by-side (each ~33% width):       │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ APPLY    │  │ APPLY    │  │ PREPARE  │               │
│  │ LABEL    │  │ TAPE     │  │ NEXT     │               │
│  │          │  │          │  │ TUBE     │               │
│  │ part #22 │  │ part #22 │  │ part #24 │               │
│  │ (prev)   │  │ (prev)   │  │ (next)   │               │
│  │          │  │          │  │          │               │
│  │ 12s      │  │ 10s      │  │ 20s      │               │
│  │ [START]  │  │ [START]  │  │ [START]  │               │
│  └──────────┘  └──────────┘  └──────────┘               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Behavior**:
- TOP pane subscribes to WS events `device:cycle:*` for DEV-LEAK-001.
- Countdown timer counts DOWN from cycleTime to 0, updated every 250ms based on `elapsedSec` from progress events.
- Pressure chart: simple inline SVG line of recent pressure values (last 30 sec rolling window, smooth animation 200ms transition).
- Each parallel slot card is independent:
  - State machine per card: `idle → running → done` (operator-controlled, NOT device-driven).
  - START button: card transitions to running, timer counts UP from 0 to slot.duration, then transitions to done.
  - During running: card border pulse-accent, COMPLETE button visible.
  - When done: card has check icon, dim, no actions.
- When device reaches 0 AND all 3 slots are `done`: move to step 2.7 "Read leak result".
- If device reaches 0 BUT not all slots done: device waits in "complete pending parallel" state, prompts operator to finish remaining slots.
- If operator triggers a slot late (after device done): warning toast "Step parallelo iniziato dopo termine dispositivo — sarà conteggiato come fuori-tempo".

**Result reading sub-screen (when device done + all parallels done)**:

Card overlay with:
- Big result label: PASS / MARGINAL / FAIL (color-coded)
- Leak rate measured: e.g., "0.32 mbar/min"
- Buttons: PASS → [Continua al prossimo pezzo], MARGINAL → [Re-test] | [Approva con QC manager], FAIL → [Avvia recovery]

Use `<KpiHero tone={passToneMap}>` for the big result number.

### 3.2 HMI Camera Test specialized screen

Route: `apps/hmi/src/app/wo/[id]/camera-test/page.tsx` (new)

Triggered when current step has:
- `actionType: device_run` AND
- `device.code === 'DEV-CAMERA-001'`

**Layout**:

```
┌──────────────────────────────────────────────────────────┐
│  Top: phase progress, WO header                          │
├──────────────────────────────────────────────────────────┤
│  Device card: DEV-CAMERA-001                             │
│  Recipe: RCP-CAMERA-PNE-001 v1                           │
│  Countdown: 6 sec (8 → 0)                                │
│  Phase: analyze                                          │
├──────────────────────────────────────────────────────────┤
│  4 ROI cards in 2x2 grid:                                │
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │ Raccordo A      │  │ Raccordo B      │               │
│  │ similarity 97%  │  │ similarity 96%  │               │
│  │ [progress bar]  │  │ [progress bar]  │               │
│  └─────────────────┘  └─────────────────┘               │
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │ Label position  │  │ Tape position   │               │
│  │ similarity 95%  │  │ similarity 98%  │               │
│  │ [progress bar]  │  │ [progress bar]  │               │
│  └─────────────────┘  └─────────────────┘               │
└──────────────────────────────────────────────────────────┘
```

ROI cards update from WS events `device:cycle:progress` with rois array. Threshold line on progress bar at 95% (visual indicator).

Result card on completion: PASS (all ≥95) or FAIL (at least one <95).

### 3.3 HMI Recovery flow visualization

Route: `apps/hmi/src/app/wo/[id]/recovery/page.tsx` (modify existing from PROMPT_5_FULL or new specialized variant)

This builds on the existing recovery state machine (PROMPT_5_FULL D5 has `recovery.machine.ts`). The PROMPT_PNE_4 task is to **make the UI mockup-faithful** for the 4 stages.

**Stage indicator** (top of screen, breadcrumb):
```
 [✓ DIAGNOSI] → [Tentativo 1/3] → [ Tentativo 2/3 ] → [ Tentativo 3/3 ] → [ SCRAP ]
```
Active stage highlighted, completed checked, future grayed.

**Stage 1 — Diagnosis**:
- Big card "Seleziona codice guasto"
- Dropdown with 5 options for leak (LK-HOSE-LOOSE, LK-SEAL-CONTAM, LK-REAL-DEFECT, LK-CRIMP-LEAK, LK-OTHER) or 5 for camera
- "Conferma diagnosi" button → transitions to Stage 2

**Stage 2 — First Retry (Tentativo 1/3)**:
- Card: "Correzione suggerita"
- Body: text per fault code (e.g., for LK-HOSE-LOOSE: "Ricontrollare collegamenti raccordi e ri-testare")
- Toggle: "Ho applicato la correzione" (must check to enable Re-test button)
- Re-test button → opens mini Leak Test specialized screen (re-uses the component from § 3.1) with badge "Tentativo 2 di 3"
- After re-test: if PASS → exit recovery with `qtyRework++`, toast "Pezzo recuperato". If FAIL → Stage 3.

**Stage 3 — Second Retry (Tentativo 2/3)**:
- Same as Stage 2 but with "alternative correction" text per fault.
- After re-test: if PASS → exit. If FAIL → Stage 4 (forced scrap).

**Stage 4 — Forced Scrap**:
- Card: "Scrap obbligatorio"
- Cause code dropdown (mandatory, options from cause codes seeded in PNE_2): material_defect, process_error, tool_wear, crimp_leak, camera_calibration, other
- Photo upload mock: dashed-border drop area with "Clicca per caricare foto"
  - On click: opens fake file picker (or uses HTML5 input file accept="image/*")
  - On selection: stores in form state as base64 (no real upload, no S3 — pure in-memory mock)
  - Shows thumbnail preview with X to remove
- Notes textarea (optional)
- "Conferma Scrap" button (disabled until cause code selected AND photo present):
  - On click: API call `POST /api/work-orders/:id/scrap` (existing from PROMPT_5_FULL D5) with payload {causeCodeId, photoMockBase64, notes, attemptCount: 3}
  - On success: counters update (qtyScrap++, qtyRemaining-- compensated to keep target), toast "QC supervisor notificato", redirect to next piece on HMI dashboard.

### 3.4 Label print mock

Existing step kinds with `actionType: print_label | apply_label`: when reached at runtime, the existing step renderer should now:

1. Show a brief "Stampa etichetta in corso..." spinner state (1.5 sec).
2. Trigger the mock:
   - Call `POST /api/labels/print-mock` (new endpoint, gated by `DEMO_MODE`) which logs to console and returns mock label data.
   - Show `Toast({ message: "Etichetta LBL-PNE-001 stampata", variant: "ok" })`.
   - Show floating SVG preview overlay for 3 seconds: bordered card with label content rendered as SVG (item code, lot, date, ECE marking placeholder, customer ref). Auto-dismisses or click-to-dismiss.
3. Move to next step.

**Label content (Italian)**:
```
PNE-TUBE-12-680
Lotto: 26W18-001
Data: 02/05/2026
Cliente: IVECO/VOLVO
ECE-R110
ISO 7628 / DIN 73378
```

(For MVP, lot/date can be hardcoded or current-time-based; demo doesn't depend on lot management which is V2.)

New file: `apps/hmi/src/components/LabelPrintMock.tsx` (overlay + SVG renderer)

### 3.5 Packaging screen fidelity verification

**Existing**: PROMPT_5_FULL D6 implemented packaging step. Route: `apps/hmi/src/app/wo/[id]/packaging/page.tsx` (or whatever path was chosen).

**Task**: open the existing screen, compare to mockup. Adjust styling if needed:
- Layout: left current box card, center scan input, right packed list
- Counter: "Box 1: 23/50 — Box 2: 0/50"
- Scan input simulates barcode scanner (auto-focus, beep on enter, increment counter)
- Seal box action when capacity reached → calls existing API
- Print box label → uses LabelPrintMock from § 3.4

If existing screen substantially diverges from mockup, refactor; otherwise small CSS adjustments.

### 3.6 WO completion summary

**Existing**: PROMPT_5_FULL probably has a basic completion screen.

**Task**: enhance to mockup fidelity. Layout:

```
┌──────────────────────────────────────────────┐
│  WO-2026-PNE-0042 — Completato               │
│  Pneumatic Air M12 680mm                     │
├──────────────────────────────────────────────┤
│  KpiHero grid (2x3):                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Prodotti │  │ Rework   │  │ Scrap    │   │
│  │   97     │  │   2      │  │   3      │   │
│  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Tempo    │  │ Avg/Pz   │  │ OEE      │   │
│  │ tot.     │  │          │  │          │   │
│  │ 3h 24m   │  │ 2m 04s   │  │ 87%      │   │
│  └──────────┘  └──────────┘  └──────────┘   │
├──────────────────────────────────────────────┤
│  PhaseChip bar: Final Assembly ✓ ·           │
│   Leak Test ✓ · Camera Test ✓ · Pack ✓       │
├──────────────────────────────────────────────┤
│  Pass Rate First-Time: 95% (2 rework / 100)  │
│                                              │
│  [Chiudi WO]    [Esporta report]             │
└──────────────────────────────────────────────┘
```

Use `<KpiHero>` patterns from DS_LIFT D4. PhaseChip bar from D4. AlertBanner if any KPI is bad (e.g., scrap > threshold).

---

## 4. What stays unchanged

- WO state machine, recovery state machine: untouched (just rendering changes).
- Step execution engine core: untouched.
- Existing manual/guided step renderer (for non-specialized steps in Final Assembly): untouched.
- Mock device services: untouched (just consumed by HMI specialized screens).
- Database: no migrations.

---

## 5. Pre-flight checks

```bash
git status                          # clean main, post PROMPT_PNE_3 merge
pnpm test --run 2>&1 | tail -5      # cumul ~663

# Verify HMI app structure
ls apps/hmi/src/app/wo/

# Verify existing step renderer
cat apps/hmi/src/app/wo/[id]/page.tsx | head -30

# Verify recovery machine exists from PROMPT_5_FULL
ls apps/hmi/src/lib/recovery/ || ls apps/hmi/src/state/recovery/
grep -rn "recovery.machine" apps/hmi/src --include="*.ts" -l

# Verify mock devices module exists from PROMPT_PNE_3
ls apps/api/src/modules/mock-devices/
```

If any structural prereq missing, stop and report.

---

## 6. Increments

### D1 — HMI Leak Test specialized: top pane (device timer + pressure)

**Scope**: top half of the leak test screen — device timer countdown, pressure live, recipe info.

**Files**:
- `apps/hmi/src/app/wo/[id]/leak-test/page.tsx` (new)
- `apps/hmi/src/components/leak-test/DevicePane.tsx` (new — top pane)
- `apps/hmi/src/components/leak-test/PressureChart.tsx` (new — inline SVG mini-chart)
- `apps/hmi/src/lib/use-device-cycle.ts` (new — hook subscribing to WS device events)
- `apps/hmi/src/app/wo/[id]/page.tsx` (modify — route to specialized when device matches)

**Tasks**:
- DevicePane subscribes via `useDeviceCycle('DEV-LEAK-001')` hook.
- Hook returns `{status, elapsedSec, phase, pressureBar, pressureHistory}` from WS subscription.
- Countdown: `cycleTime - elapsedSec`. Progress bar uses `<KpiHero>` styling for the count + simple progress bar component.
- PressureChart: SVG line of `pressureHistory` (last 30 points). Smooth transition.
- Routing in step renderer: read current step + check device match, render specialized component instead of generic.

**Tests** (target +5):
- DevicePane renders with idle status (1)
- Countdown updates from elapsedSec (1)
- Pressure chart renders points (1)
- useDeviceCycle subscribes/unsubscribes correctly (1)
- Step renderer routes to leak-test specialized when device matches (1)

**Gates D1**:
- type-check + build + lint clean
- Cumul: ~663 → ~668

**Commit**: `feat(hmi-leak-test): device pane top with timer + pressure live (PROMPT_PNE_4 D1)`

### D2 — HMI Leak Test specialized: bottom pane (3 parallel slots)

**Scope**: bottom half — 3 swimlane cards side-by-side with independent state machines.

**Files**:
- `apps/hmi/src/components/leak-test/ParallelSlotsPane.tsx` (new)
- `apps/hmi/src/components/leak-test/SlotCard.tsx` (new — single slot with idle/running/done state machine)
- `apps/hmi/src/components/leak-test/ResultCard.tsx` (new — overlay shown when device done + all slots done)

**Tasks**:
- ParallelSlotsPane reads parallelSteps from current step config (3 slots: apply label, apply tape, prepare next tube).
- SlotCard internal state machine (useReducer): idle → running → done.
- Each slot has its own count-up timer based on slot duration.
- When device done + all slots done: trigger ResultCard overlay.
- ResultCard shows outcome from WS `cycle:complete` event. Buttons per outcome (PASS → continue, FAIL → recovery, MARGINAL → choice).

**Tests** (target +5):
- SlotCard transitions idle → running → done (1)
- ParallelSlotsPane renders 3 slots (1)
- ResultCard shows PASS state (1)
- ResultCard shows FAIL state (1)
- ResultCard PASS button advances to next step (1)

**Gates D2**:
- Manual smoke (HMI tablet emulator if available, otherwise browser): start a leak test cycle (force PASS via demo toggle), see device timer countdown, click START on each slot, see them run, watch result card appear.
- Cumul: ~668 → ~673

**Commit**: `feat(hmi-leak-test): parallel slots bottom pane + result card (PROMPT_PNE_4 D2)`

### D3 — HMI Recovery flow visualization (4 stages)

**Scope**: recovery UI per § 3.3.

**Files**:
- `apps/hmi/src/app/wo/[id]/recovery/page.tsx` (modify or new specialized — depends on PROMPT_5_FULL scope)
- `apps/hmi/src/components/recovery/StageIndicator.tsx` (new — breadcrumb)
- `apps/hmi/src/components/recovery/DiagnosisStage.tsx` (new — Stage 1)
- `apps/hmi/src/components/recovery/RetryStage.tsx` (new — Stages 2, 3)
- `apps/hmi/src/components/recovery/ScrapStage.tsx` (new — Stage 4)
- `apps/hmi/src/components/recovery/PhotoUploadMock.tsx` (new — fake file picker + preview)

**Tasks**:
- StageIndicator: 4 chips with active/completed states (use `<PhaseChip>` pattern from DS_LIFT D4).
- DiagnosisStage: dropdown of fault codes (filter by source: leak vs camera based on URL or step context), confirm button.
- RetryStage: shows correction text (lookup from fault code suggested action), checkbox for confirmation, re-test button.
- Re-test re-uses LeakTest or CameraTest specialized screen as a child component with `attempt={N}` badge.
- ScrapStage: cause code dropdown, PhotoUploadMock, notes, confirm button. Validation: cause code + photo required.
- PhotoUploadMock: HTML input type=file, on change reads as base64, stores in form state, shows thumbnail. Remove button clears.

**Tests** (target +5):
- StageIndicator highlights active stage (1)
- DiagnosisStage requires fault selection to confirm (1)
- RetryStage requires correction acknowledgment (1)
- ScrapStage requires cause code + photo (1)
- PhotoUploadMock stores base64 (1)

**Gates D3**:
- type-check + build + lint clean
- Cumul: ~673 → ~678

**Commit**: `feat(hmi-recovery): visualize 4 stages diagnosis-retry-scrap (PROMPT_PNE_4 D3)`

### D4 — HMI Camera Test specialized

**Scope**: camera test screen per § 3.2.

**Files**:
- `apps/hmi/src/app/wo/[id]/camera-test/page.tsx` (new)
- `apps/hmi/src/components/camera-test/CameraDevicePane.tsx` (new)
- `apps/hmi/src/components/camera-test/RoiCard.tsx` (new — single ROI with progress bar + threshold line)
- `apps/hmi/src/components/camera-test/RoiGrid.tsx` (new — 2x2 grid of 4 ROI cards)
- `apps/hmi/src/app/wo/[id]/page.tsx` (modify — route to camera test specialized when device matches DEV-CAMERA-001)

**Tasks**:
- CameraDevicePane: similar to LeakTest DevicePane but 8s cycle, no pressure chart.
- RoiCard: name + similarity %, progress bar with threshold marker at 95%.
- ROIs animate similarity values upward during cycle from WS events.
- Result card on complete: PASS (all ≥95) or FAIL.

**Tests** (target +4):
- CameraDevicePane renders idle (1)
- RoiCard renders threshold marker (1)
- RoiGrid renders 4 ROI cards (1)
- Result PASS/FAIL based on ROIs (1)

**Gates D4**:
- type-check + build + lint clean
- Cumul: ~678 → ~682

**Commit**: `feat(hmi-camera-test): specialized screen with 4 ROI cards (PROMPT_PNE_4 D4)`

### D5 — Label print mock + Packaging fidelity + WO completion

**Scope**: 3 smaller items per § 3.4, 3.5, 3.6.

**Files**:
- `apps/hmi/src/components/LabelPrintMock.tsx` (new — overlay + SVG label)
- `apps/api/src/modules/labels/labels-mock.controller.ts` (new — `POST /api/labels/print-mock` gated by DEMO_MODE)
- `apps/hmi/src/app/wo/[id]/packaging/page.tsx` (review and adjust)
- `apps/hmi/src/app/wo/[id]/done/page.tsx` (review and enhance to mockup)
- `apps/hmi/src/components/wo-done/SummaryCard.tsx` (new — KpiHero grid + PhaseChip bar)

**Tasks**:
- LabelPrintMock: overlay component, props {item, lot, date, customerRef}. Renders SVG label with Italian content per § 3.4. Auto-dismiss 3 sec.
- Modify step renderer: when reaching `print_label` or `apply_label` step, show LabelPrintMock + toast.
- Mock controller endpoint: returns `{success: true, mockLabelId: 'LBL-MOCK-...'}`.
- Packaging screen review: compare layout to mockup, adjust spacing/colors/labels if needed (likely small CSS tweaks; if substantial divergence, propose scope).
- WO completion screen: enhance with KpiHero grid (6 KPIs: produced, rework, scrap, total time, avg per piece, OEE). PhaseChip bar (4 phases all done).

**Tests** (target +4):
- LabelPrintMock renders SVG with item code (1)
- LabelPrintMock auto-dismisses after 3 sec (1)
- Mock label endpoint returns success (1)
- WO completion summary renders 6 KPIs (1)

**Gates D5**:
- type-check + build + lint clean
- Cumul: ~682 → ~686

**Commit**: `feat(hmi): label mock + packaging fidelity + WO completion summary (PROMPT_PNE_4 D5)`

### D6 — End-to-end demo journey verification + STATUS final

**Scope**: walk through all demo journeys end-to-end, fix any glitches found, close PROMPT.

**Files**:
- (any small fixes uncovered during E2E)
- `STATUS.md` (PROMPT_PNE_4 closure section)
- `STATUS.md` (F1 closure section: "F1 Pneumatic First — 100% complete, demo path ready")

**Tasks**:

E2E demo journeys to walk:

**Journey 1 — Process engineer configures workflow** (route through workflow editor):
- Open `wf-pneumatic-air-680-v0` (Empty)
- Add Phase "Final Assembly" via drawer
- Add Group "Tube Preparation" via modal
- Add Step manual via drag-drop from palette
- Validate
- Manually verify: full configurator works end-to-end with new UX.

**Journey 2 — Operator runs nominal piece (PASS path)**:
- Login Mario Rossi on HMI
- Pick WO-2026-PNE-0042 (workflow v1)
- BOM check → confirm
- Final Assembly steps (skip with debug Fast Forward to piece 23 via /demo panel)
- Leak Test → demo toggle "Force PASS" → start device + 3 parallel slots → all done → result PASS → continue
- Camera Test → demo toggle "Force PASS" → result PASS → continue
- Packaging → scan 50 tubes (or use Fast Forward) → seal → label print mock toast → next box
- WO done summary → close

**Journey 3 — Operator handles leak test failure**:
- Same as Journey 2 up to Leak Test
- Demo toggle "Force FAIL" before start
- Trigger device cycle → result FAIL → recovery flow opens
- Stage 1: select "LK-HOSE-LOOSE" → confirm
- Stage 2: see correction → check applied → re-test (force PASS this time) → exit recovery
- Counters: qtyRework++, continue WO

**Journey 4 — Operator forced to scrap**:
- Same as Journey 3 but force FAIL on all 3 retest attempts
- Stage 4: cause code + photo mock → confirm scrap
- Counters: qtyScrap++, qtyRemaining-- (compensated)

**Tests added** (target +1, integration):
- E2E test (using existing test infrastructure if Playwright/Vitest browser available; otherwise leave as manual verification): WO completion path increments counters correctly.

If no Playwright, this increment may add zero tests; that's fine, total is already over floor.

**Gates D6** (FINAL):
- type-check + build + lint clean across all packages
- Cumul: ~686 → ~687 (target floor: 663 + 18 = 681; ideal: 663 + 26 = 689)
- All 4 demo journeys verifiable on `pnpm dev`
- STATUS.md updated with PROMPT_PNE_4 100% complete + F1 100% complete sections
- ROADMAP.md F1.6 row marked done

**Commit**: `feat(hmi): close PROMPT_PNE_4 + F1 Pneumatic First 100% (PROMPT_PNE_4 D6)`

---

## 7. Test target ladder

| Increment | Cumul | Floor | Ideal |
|---|---|---|---|
| Baseline | 663 | — | — |
| D1 | ~668 | ≥666 | ≥670 |
| D2 | ~673 | ≥670 | ≥675 |
| D3 | ~678 | ≥674 | ≥680 |
| D4 | ~682 | ≥677 | ≥685 |
| D5 | ~686 | ≥679 | ≥688 |
| D6 | ~687 | **≥681** | **≥689** |

---

## 8. Surprise budget

Stop and ask if:
- Existing recovery machine (PROMPT_5_FULL D5) state names don't match the 4-stage breadcrumb (may need adapter or refactor — discuss before)
- Existing packaging screen substantially diverges from mockup (decide if small fixes acceptable or full rebuild — only full rebuild after explicit approval)
- WS event payload from mock devices doesn't carry expected telemetry (verify with PNE_3 events; if mismatched, fix in PNE_3 follow-up not PNE_4 hack)
- HMI tablet UX has touch-target issues (≥44px) on parallel slot buttons — adjust styling
- Any test journey fails in unexpected way at D6 — debug before declaring complete

---

## 9. Non-goals (defer to V2)

- Real device integration: V2.
- Real label printing (ZPL/network printer): V2.
- Real photo upload to S3 / cloud storage: V2.
- Multi-operator parallel sessions on same WO: V2 (single-operator demo).
- Audit log entries for recovery actions: enabled at infrastructure level (PROMPT_5_FULL handles), full UI integration with `<AuditTimeline>` is TODO-033 in F2.

---

## 10. Exit criteria

- 6 increments committed
- Test cumul ≥ 681
- All 4 demo journeys walkable end-to-end on local `pnpm dev`
- Mockup fidelity verified by user (Antonella) on Leak Test + Camera Test + Recovery + Packaging + WO Completion screens
- STATUS.md updated with F1 100% complete
- ROADMAP.md F1 phase marked done
- Branch pushed, ready for user merge

---

## 11. Demo readiness checklist

After PROMPT_PNE_4 closure, the following must be true for Reflex Allen demo:

- [ ] `pnpm dev` starts cleanly
- [ ] DEMO_MODE=true configured
- [ ] Pneumatic seed has been run
- [ ] WO-2026-PNE-0042 in `released` status
- [ ] Demo Toggle Panel at `/demo` works
- [ ] Workflow editor opens v1 + v0 correctly
- [ ] HMI login Mario Rossi (badge 1234, PIN 1234) works
- [ ] Full demo journey (Journey 2 PASS path) completes without error in < 8 minutes wall-clock with Fast Forward
- [ ] Recovery journey (Journey 3) completes without error
- [ ] Scrap journey (Journey 4) completes with cause code + photo

---

**End PROMPT_PNE_4**

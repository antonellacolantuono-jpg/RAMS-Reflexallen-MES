# PROMPT_PNE_3 — Mock device simulator (Leak + Camera)

> **Version**: 1.0
> **Author**: Antonella Colantuono (via Claude chat)
> **Date**: 2026-05-02
> **Branch base**: `main` (post PROMPT_PNE_2 merge)
> **Estimated effort**: 8-12h (across 4 increments)
> **Test budget**: floor +14, ideal +20
> **Mockup fidelity**: low UI focus (this is mostly backend); HIGH on demo controllability

---

## 1. Goal

Implement mock device services for the Pneumatic Air line so that during demo:
- DEV-LEAK-001 simulates a 45-second leak test cycle with realistic pressure curves and a configurable PASS / MARGINAL / FAIL outcome
- DEV-CAMERA-001 simulates an 8-second camera test cycle with 4 ROI similarity scores and a configurable PASS / FAIL outcome
- DEV-CRIMP-001 simulates an 8-second crimp cycle with realistic force trace (mostly OK, occasional FAIL)
- All three devices push real-time updates via WebSocket to subscribed HMI clients

Demo controllability:
- A **Demo Toggle Panel** in the back-office (or HMI in dev mode) lets the user force the next cycle outcome to PASS / MARGINAL / FAIL on each device
- A "Fast forward" debug button lets the user advance the WO piece counter by N pieces (skip simulating cycles)

This PROMPT is **demo infrastructure**. It must be cleanly removable / disable-able for production deployment (env flag `DEMO_MODE=true`).

---

## 2. Architectural placement

The mock device simulator is a **service** on the API side. It is NOT a separate process — it runs in the existing NestJS server, gated by `DEMO_MODE` env var.

Module: `apps/api/src/modules/mock-devices/`

When a step of `actionType: device_run` is invoked at runtime (via existing step execution machinery from PROMPT_5_FULL), the system:
1. Checks if `DEMO_MODE=true` AND the device referenced is one of [DEV-LEAK-001, DEV-CAMERA-001, DEV-CRIMP-001]
2. If yes, routes to the mock simulator service (instead of attempting real device communication)
3. Mock service runs the simulated cycle, emits WebSocket events at intervals, returns the result to the step execution engine
4. Step execution engine handles result as if it came from real device (no special-casing in core logic)

In production mode (`DEMO_MODE=false`), the system attempts real device integration via the abstraction layer that PROMPT_5_FULL already established. **No regression** in production code path.

---

## 3. What changes

### 3.1 Mock device service

New module `apps/api/src/modules/mock-devices/`:

- `mock-devices.module.ts` (NestJS module, gated by config)
- `mock-leak-tester.service.ts` (DEV-LEAK-001 simulation)
- `mock-camera-tester.service.ts` (DEV-CAMERA-001 simulation)
- `mock-crimp-press.service.ts` (DEV-CRIMP-001 simulation)
- `demo-controller.service.ts` (state for next-outcome override)
- `mock-devices.controller.ts` (REST API for demo toggle controls)

Each device service exposes:

```typescript
interface MockDevice {
  start(stepExecutionId: string, recipe: Recipe): Promise<void>
  stop(stepExecutionId: string): Promise<void>
  getStatus(stepExecutionId: string): MockCycleStatus
  // Subscribe to live updates (handled internally via existing WebSocket gateway)
}
```

#### Leak Tester behavior (DEV-LEAK-001, recipe RCP-LEAK-PNE-12-001 v2)

When `start()` invoked:
1. Emit `cycle:started` WS event with stepExecutionId, recipe, expectedDurationSec=45.
2. For 45 seconds, every 500ms emit `cycle:progress` event with:
   - elapsedSec: 0..45
   - phase: "pressurize" (0-5s) → "stabilize" (5-10s) → "hold-and-measure" (10-40s) → "depressurize" (40-45s)
   - pressureBar: oscillating 5.9-6.1 in hold phase (random walk around 6.0); 0→6.0 ramp in pressurize; 6.0→0 ramp in depressurize
   - leakRateMbarMin: starts at 0, slowly rises to a target value depending on outcome
3. At t=45s, emit `cycle:complete` event with:
   - outcome: PASS / MARGINAL / FAIL (per current demo toggle for this device, default PASS)
   - leakRateMbarMin: final value (PASS: 0.10-0.45 random; MARGINAL: 0.55-0.95 random; FAIL: 1.10-2.5 random)
   - pressureBar: final 0
   - durationSec: 45
4. After complete, return to idle state.

Demo toggle override:
- `POST /api/mock-devices/dev-leak-001/next-outcome` with body `{ outcome: 'PASS' | 'MARGINAL' | 'FAIL' }` sets the next cycle outcome. After the next cycle completes, override is consumed (returns to default PASS).
- `GET /api/mock-devices/dev-leak-001/status` returns current state + next-outcome override.

#### Camera Tester behavior (DEV-CAMERA-001, recipe RCP-CAMERA-PNE-001 v1)

When `start()` invoked:
1. Emit `cycle:started` event, expectedDurationSec=8.
2. For 8 seconds, every 250ms emit `cycle:progress` event with:
   - elapsedSec: 0..8
   - phase: "capture" (0-2s) → "analyze" (2-7s) → "decide" (7-8s)
   - rois: array of 4 objects { roiId: 'raccordo_a' | 'raccordo_b' | 'label_position' | 'tape_position', similarityPct: increasing from 0 to final value }
3. At t=8s, emit `cycle:complete` with:
   - outcome: PASS (all ROIs ≥ 95) / FAIL (at least one ROI < 95)
   - rois: final similarity values (PASS: each 95-99 random; FAIL: one ROI is 70-90 random + others normal)
   - durationSec: 8

Demo toggle: same pattern, `POST /api/mock-devices/dev-camera-001/next-outcome`.

#### Crimp Press behavior (DEV-CRIMP-001, recipe RCP-CRIMP-12-001)

When `start()` invoked:
1. Emit `cycle:started` event, expectedDurationSec=8.
2. For 8 seconds, every 100ms emit `cycle:progress` event with:
   - elapsedSec: 0..8
   - phase: "approach" (0-1s) → "compress" (1-6s) → "hold" (6-7s) → "release" (7-8s)
   - forceKn: 0 → 25 ramp during compress; held at 25 ± 0.5 in hold; 25 → 0 release
3. At t=8s, emit `cycle:complete` with:
   - outcome: PASS (force in 24-26 range) / FAIL (out of tolerance)
   - peakForceKn: 25 ± random
   - durationSec: 8

Default outcome: PASS (95% of time). Demo toggle: same pattern.

### 3.2 Demo Toggle Panel UI

New page: `apps/web/src/app/demo/page.tsx`

Accessible only when `NEXT_PUBLIC_DEMO_MODE=true` (link in sidebar gated by env var).

Layout:
- 3 cards, one per device (DEV-LEAK-001, DEV-CAMERA-001, DEV-CRIMP-001).
- Each card shows:
  - Device code + name + current status (Idle / Cycle in progress / Complete)
  - Real-time mini-chart of last cycle (pressure for leak; ROI similarity bars for camera; force for crimp)
  - 3 (or 2 for crimp) outcome buttons: `Force PASS next cycle` / `Force MARGINAL next cycle` / `Force FAIL next cycle`
  - Active override indicator: chip "Next: FAIL" if override set; otherwise "Next: default (PASS)"
- "Fast Forward WO" section (separate card):
  - Select WO from dropdown (default: WO-2026-PNE-0042)
  - "Advance N pieces" input (default 49)
  - Button "Fast Forward" → calls `POST /api/work-orders/:id/debug/advance` (new endpoint, demo-only) which increments piece counters by N (only PASS counted, no rework/scrap simulation)

Use `<KpiHero>` for current cycle elapsedSec / leakRate / similarity values during running cycle. Use `<AlertBanner>` if outcome forced (info banner). Use `<Toast>` on outcome force success.

### 3.3 Demo endpoints (REST + WS)

REST endpoints (under `/api/mock-devices/*`, gated by `DEMO_MODE`):
- `GET /api/mock-devices` — list all mock devices with status
- `GET /api/mock-devices/:deviceCode/status` — device status
- `POST /api/mock-devices/:deviceCode/next-outcome` — set override
- `POST /api/mock-devices/:deviceCode/start-test` — manually trigger a cycle outside of WO context (for demo testing)

REST endpoints (gated by `DEMO_MODE`):
- `POST /api/work-orders/:id/debug/advance` — advance piece counters
- `POST /api/work-orders/:id/debug/reset` — reset counters to 0 (handy for re-demo)

WebSocket events on existing `WorkOrderEventsGateway` (PROMPT_5_FULL D4):
- `device:cycle:started` { deviceCode, stepExecutionId, expectedDurationSec, recipe }
- `device:cycle:progress` { deviceCode, stepExecutionId, elapsedSec, ...telemetry }
- `device:cycle:complete` { deviceCode, stepExecutionId, outcome, ...result }

### 3.4 Step execution engine integration

Modify `apps/api/src/modules/work-orders/step-execution/device-step-executor.ts` (the file from PROMPT_5_FULL D3 that runs `actionType: device_run` steps):

```typescript
async executeDeviceStep(stepExec: StepExecution) {
  const device = await this.equipmentService.findByCode(stepExec.deviceCode)
  
  if (process.env.DEMO_MODE === 'true' && this.mockDeviceService.supports(device.code)) {
    return this.mockDeviceService.execute(stepExec, device, recipe)
  }
  
  // Existing real-device path (untouched)
  return this.realDeviceClient.execute(stepExec, device, recipe)
}
```

Adapter contract: mock service returns the same `StepExecutionResult` shape as the real device path. Step execution engine doesn't know the difference.

### 3.5 Env var setup

Add to `.env.example`:
```
DEMO_MODE=true
NEXT_PUBLIC_DEMO_MODE=true
```

`.env.local` (developer's local) sets these to `true` by default.
Production `.env.prod` sets to `false`.

---

## 4. What stays unchanged

- Real device integration abstraction (PROMPT_5_FULL): untouched. Mock simulator is parallel path, gated by env.
- WebSocket gateway: untouched. New events added but not breaking existing ones.
- Step execution engine core: only the device-step-executor file gets a small branch added; everything else (state machine, transitions, event emission) is unchanged.
- Database schema: no migrations.
- HMI rendering of device steps: PROMPT_PNE_4 will style the HMI Leak Test specialized; this PROMPT only ensures the WS events are emitted correctly so PNE_4 can subscribe.

---

## 5. Pre-flight checks

```bash
git status                          # clean main, post PROMPT_PNE_2 merge
pnpm test --run 2>&1 | tail -5      # cumul ~644

# Verify existing device step executor exists from PROMPT_5_FULL
ls apps/api/src/modules/work-orders/step-execution/
grep -rn "device_run\|deviceStepExecutor" apps/api/src --include="*.ts" -l

# Verify WebSocket gateway exists
ls apps/api/src/modules/events/

# Verify pneumatic seed data is available (post PROMPT_PNE_2)
# (assumes seed has run)
```

If pre-flight fails (especially missing device-step-executor), stop and report.

---

## 6. Increments

### D1 — Mock device base + LeakTester service

**Scope**: foundation + first device simulator.

**Files**:
- `apps/api/src/modules/mock-devices/mock-devices.module.ts` (new)
- `apps/api/src/modules/mock-devices/types.ts` (new — MockCycleStatus, MockDevice interface)
- `apps/api/src/modules/mock-devices/demo-controller.service.ts` (new — state for next-outcome overrides, in-memory Map)
- `apps/api/src/modules/mock-devices/mock-leak-tester.service.ts` (new)
- `apps/api/src/modules/mock-devices/mock-devices.controller.ts` (new — REST endpoints, gated by `DEMO_MODE`)

**Tasks**:
- LeakTester implements MockDevice interface. Cycle simulation uses `setInterval(500ms)` to emit progress, `setTimeout(45000)` for complete.
- WS events emitted via existing gateway (inject `WorkOrderEventsGateway`).
- Demo controller endpoints respond per § 3.3.
- DEMO_MODE env gate: if false, module's REST endpoints return 404; mock-leak-tester service is unavailable.

**Tests** (target +6):
- LeakTester PASS scenario: emits 90 progress events + 1 complete (1 integration test, mocked timer)
- LeakTester FAIL scenario: complete event has leakRate > 1.0 (1)
- Outcome override: setNextOutcome('FAIL') makes next cycle FAIL (1)
- Override consumed after next cycle (1)
- DEMO_MODE=false: endpoints return 404 (1)
- DEMO_MODE=true: endpoints return 200 (1)

**Gates D1**:
- `pnpm --filter @mes/api test --run` passes
- type-check + build + lint clean
- Cumul: ~644 → ~650

**Commit**: `feat(mock-devices): leak tester simulation + demo controller (PROMPT_PNE_3 D1)`

### D2 — CameraTester + CrimpPress services

**Scope**: remaining 2 device simulators.

**Files**:
- `apps/api/src/modules/mock-devices/mock-camera-tester.service.ts` (new)
- `apps/api/src/modules/mock-devices/mock-crimp-press.service.ts` (new)

**Tasks**:
- CameraTester: 8s cycle, ROI similarity progression, PASS/FAIL outcome.
- CrimpPress: 8s cycle, force trace, PASS/FAIL outcome.
- Both use the same DemoControllerService for outcome overrides.

**Tests** (target +4):
- CameraTester PASS scenario: all ROIs ≥ 95 (1)
- CameraTester FAIL scenario: at least 1 ROI < 95 (1)
- CrimpPress PASS scenario: peak force in tolerance (1)
- CrimpPress FAIL scenario: peak force out of tolerance (1)

**Gates D2**:
- type-check + build + lint clean
- Cumul: ~650 → ~654

**Commit**: `feat(mock-devices): camera tester + crimp press simulations (PROMPT_PNE_3 D2)`

### D3 — Step executor integration + WO debug endpoints

**Scope**: wire mock services into step execution engine; add WO debug controls.

**Files**:
- `apps/api/src/modules/work-orders/step-execution/device-step-executor.ts` (modify — add DEMO_MODE branch)
- `apps/api/src/modules/work-orders/work-orders.controller.ts` (add debug endpoints, gated by `DEMO_MODE`)
- `apps/api/src/modules/work-orders/work-orders.service.ts` (add `advancePieces(woId, n)` method)

**Tasks**:
- Step executor branches per § 3.4.
- WO debug endpoints `POST /work-orders/:id/debug/advance` and `/reset` (return 404 if DEMO_MODE=false).
- AdvancePieces method: increments qtyProduced by N, decrements qtyRemaining accordingly. Emits WO update WS event.

**Tests** (target +5):
- Device step executor routes to mock when DEMO_MODE=true (1)
- Device step executor routes to real client when DEMO_MODE=false (1, mocked)
- Step executor result shape matches real device result (1)
- AdvancePieces increments counters (1)
- Reset zeros counters (1)

**Gates D3**:
- type-check + build + lint clean
- Cumul: ~654 → ~659

**Commit**: `feat(mock-devices): step executor integration + WO debug controls (PROMPT_PNE_3 D3)`

### D4 — Demo Toggle Panel UI + STATUS update

**Scope**: back-office UI for demo controllability.

**Files**:
- `apps/web/src/app/demo/page.tsx` (new — top-level page, sidebar link gated by `NEXT_PUBLIC_DEMO_MODE`)
- `apps/web/src/components/demo/DeviceCard.tsx` (new — card per device with mini-chart + outcome buttons)
- `apps/web/src/components/demo/FastForwardCard.tsx` (new — WO advance controls)
- `apps/web/src/lib/demo-api.ts` (new — TanStack Query hooks for demo endpoints)
- `STATUS.md` (closure section)

**Tasks**:
- DeviceCard subscribes to WS events for live cycle updates. Renders mini-chart using simple inline SVG (no chart library; the cycles are short and the UI is for demo eyeballing).
- Outcome buttons call the next-outcome override endpoint.
- FastForwardCard form: WO selector (autocomplete from `/api/work-orders` filtered to `released` status), pieces input, submit.

**Tests** (target +4):
- DeviceCard renders with idle status (1)
- DeviceCard updates on cycle:progress events (1)
- Outcome button click calls API with correct payload (1)
- FastForwardCard submits with selected WO and N (1)

**Manual verification**:
- Open `/demo` (with DEMO_MODE=true).
- Click "Force FAIL on DEV-LEAK-001 next cycle".
- Open HMI in another tab (or post-PNE_4 once HMI specialized exists), trigger leak test step → verify FAIL outcome.
- Verify DeviceCard shows live progress bar during cycle.

**Gates D4** (FINAL):
- type-check + build + lint clean
- Cumul: ~659 → ~663 (target floor: 644 + 14 = 658; ideal: 644 + 20 = 664)
- STATUS.md updated

**Commit**: `feat(mock-devices): demo toggle panel + close PROMPT_PNE_3 (PROMPT_PNE_3 D4)`

---

## 7. Test target ladder

| Increment | Cumul | Floor | Ideal |
|---|---|---|---|
| Baseline | 644 | — | — |
| D1 | ~650 | ≥648 | ≥651 |
| D2 | ~654 | ≥652 | ≥656 |
| D3 | ~659 | ≥655 | ≥660 |
| D4 | ~663 | **≥658** | **≥664** |

---

## 8. Surprise budget

Stop and ask if:
- Existing device-step-executor structure differs from what's described in § 3.4 (likely if PROMPT_5_FULL chose a different abstraction)
- WebSocket event shape from PROMPT_5_FULL is incompatible with the new events (consider adapter)
- Test setup for time-based cycles becomes brittle (use vitest fake timers properly; if timing tests are flaky, prefer testing logic without real timers)
- Crimp press isn't part of the workflow used during demo (it is — STEP-ASSY-006 uses DEV-CRIMP-001)

---

## 9. Exit criteria

- 4 increments committed
- Test cumul ≥ 658
- Demo Toggle Panel reachable at `/demo` with DEMO_MODE=true
- Mock simulators correctly route from device step executor in DEMO_MODE
- Existing real-device-path tests still pass (no regression)
- STATUS.md updated

---

**End PROMPT_PNE_3**

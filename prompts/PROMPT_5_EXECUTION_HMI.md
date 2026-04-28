# PROMPT 5 — EXECUTION HMI v3

> **Type**: Build prompt for Claude Code (Step 5 of 6)
> **Pre-requisite**: PROMPT_1 + PROMPT_2 + PROMPT_3 + PROMPT_4 completed
> **Estimated time**: 3-4 hours
> **Last updated**: 2026-04-27

---

## 📋 PROMPT TO PASTE (copy from here)

```
TASK: Build the EXECUTION HMI for the Reflexallen MES shop floor.

(Context already loaded from CLAUDE.md at session start.)

═══════════════════════════════════════════════════════════════════════════════
GOAL
═══════════════════════════════════════════════════════════════════════════════

Build the HMI (Human-Machine Interface) for shop floor operators. After this:

- Operators login via badge + PIN
- Select workstation
- See assigned WO with auto-generated + designer-created steps
- Execute step-by-step with polymorphic renderers (8 categories)
- See multi-level timer (3 levels: WO/Phase/Part)
- Handle parallel steps in Device Execution Groups
- Execute Recovery Flow on failures (4 stages)
- Mark scrap with cause codes
- See real-time counters
- Operate touchscreens with gloves (large buttons, no hover)

This is what operators use 8 hours a day in the factory. UX must be excellent.

═══════════════════════════════════════════════════════════════════════════════
PRE-REQUISITES
═══════════════════════════════════════════════════════════════════════════════

You should have already completed and committed PROMPT_4 (Auto-Generation).
Verify:
✓ Auto-generation triggers on WO release
✓ Auto-generated steps in WorkflowSnapshot
✓ All registries populated
✓ Workflow Designer working

═══════════════════════════════════════════════════════════════════════════════
ADDITIONAL READING (do BEFORE planning)
═══════════════════════════════════════════════════════════════════════════════

Beyond CLAUDE.md context, also read:

→ docs/MASTER_SPECIFICATION.md sections 9-14 (WO execution, recovery, HMI)
→ docs/BEST_PRACTICES.md sections about HMI patterns + state management
→ docs/extensions/INDUSTRIAL_OPERATIONS.md (multi-output, continuous, FAI execution)
→ docs/extensions/CFRP_MODULE.md (long-running cure cycle UI)
→ docs/extensions/SAFETY_DEVICES_MODULE.md (reflectance test UI)
→ docs/extensions/WORKFLOW_PNEUMATIC_AIR_DETAILED.md (operator perspective)
→ docs/extensions/WORKFLOW_CFRP_DETAILED.md (long cycles)
→ docs/extensions/WORKFLOW_SAFETY_DEVICES_DETAILED.md (compliance flow)
→ docs/extensions/MOCK_DATA_PNEUMATIC_AIR.md (concrete data for tests)
→ docs/design-tokens.md (touch UI tokens)

═══════════════════════════════════════════════════════════════════════════════
PHASE 1 — PLAN (NO CODE YET)
═══════════════════════════════════════════════════════════════════════════════

Read the documents above, then propose a plan covering:

1. AUTHENTICATION & WORKSTATION SELECTION
   
   1.1 Login screen
       - Large numeric keypad for PIN entry
       - Badge scanner integration (USB HID emulation)
       - Operator photo + name displayed after badge scan
       - Failed login: 5 attempts → temporary lock + supervisor notification
       - Touch-optimized (60px+ buttons)
   
   1.2 Workstation selection
       - List of workstations operator is assigned to
       - Filter by area/zone
       - Show currently assigned WOs
       - Lock workstation to operator (one operator per workstation)

2. WO DISPATCH LIST (operator's "TODO list")
   
   2.1 Layout
       - Card-based list (one card per WO)
       - Card shows: WO number, item, qty, status, priority
       - Sort: priority + due date
       - Filter: my assigned only / all available
       - Color coding by urgency
   
   2.2 Actions
       - "Start" → opens execution screen
       - "Resume" if previously paused
       - "Hand off" to another operator (with audit)

3. EXECUTION SCREEN (the main view)
   
   3.1 Layout
       ┌────────────────────────────────────────────────┐
       │ HEADER: WO + Item + counters                   │
       ├────────────────────────────────────────────────┤
       │ TIMERS: 3-level (WO total, phase, current part)│
       ├────────────────────────────────────────────────┤
       │                                                │
       │  CURRENT STEP (large, focal point)             │
       │  - Title                                       │
       │  - Instructions (large readable text)          │
       │  - Action buttons (BIG, touch-friendly)        │
       │  - Recipe parameters (if device step)          │
       │                                                │
       ├────────────────────────────────────────────────┤
       │ ATTENTION POINTS (collapsible warnings/info)   │
       ├────────────────────────────────────────────────┤
       │ FOOTER: Step navigation + pause + emergency    │
       └────────────────────────────────────────────────┘
   
   3.2 Step renderer (POLYMORPHIC by category — 8 renderers)
       
       Each step type has a custom UI optimized for that action:
       
       a) SCAN renderer
          - Camera/barcode input
          - Manual fallback
          - Validation feedback
          
       b) PRODUCTION renderer (manual operation)
          - Instructions with photos/videos
          - Confirmation buttons
          - Optional photo capture
          
       c) DEVICE EXECUTION renderer
          - "Start cycle" button (BIG)
          - Live progress (timer + cycle %)
          - Device telemetry (temperature, pressure)
          - Cancel option (with confirmation)
          
       d) QUALITY CONTROL renderer
          - Checklist UI
          - Pass/Fail buttons
          - Photo capture for defects
          - Measurement input fields (with units)
          
       e) LOGISTICS renderer
          - Source/destination display
          - Confirm move button
          - Quantity input
          
       f) PARALLEL renderer (Device Execution Group)
          - Main step in center
          - Parallel lanes around it (horizontal swimlanes)
          - Live status of each parallel step
          - Buffer time visualization
          
       g) SAMPLE renderer
          - "Sample taken" confirmation
          - Sample ID generation
          - Test results entry
          
       h) RECOVERY renderer
          - Diagnosis dropdown (fault codes)
          - Suggested actions per fault
          - Retry button
          - Stage indicator (1/2/3/4)

4. MULTI-LEVEL TIMER

   3 levels visible simultaneously:
   - LEVEL 1: WO total elapsed time (large, top)
   - LEVEL 2: Current phase elapsed (medium)
   - LEVEL 3: Current part elapsed (small)
   
   Behaviors:
   - Pause when operator pauses
   - Resume on next action
   - Color: green normal, yellow if exceeding estimate, red if exceeded
   - Sound notification on phase milestones (optional)

5. COUNTERS (real-time)
   
   Always visible:
   - qtyTarget (target quantity)
   - qtyProduced (good pieces)
   - qtyScrap (scrapped)
   - qtyRework (recovered)
   - qtySamples (samples taken)
   - qtyRemaining (target - produced)
   
   Visual: progress bar showing produced / target

6. ATTENTION POINTS
   
   Display attention points relevant to current step:
   - Quality (yellow icon)
   - Safety (red icon)
   - Environment (green icon)
   - Ergonomics (blue icon)
   - Info (grey icon)
   
   Collapsible: tap to expand/collapse
   Italian + English (toggle in operator profile)

7. RECOVERY FLOW EXECUTION
   
   When a step fails (operator reports failure or device returns FAIL):
   
   Stage 1 — Diagnosis
   - Operator selects fault code from dropdown
   - System displays suggested action
   - "Try again" button
   
   Stage 2 — First recovery attempt
   - Apply correction
   - Re-execute step
   - If success: counts as REWORK (not produced)
   - If fail: proceed to Stage 3
   
   Stage 3 — Second recovery attempt
   - Different correction
   - Re-execute
   - If success: REWORK
   - If fail: Stage 4
   
   Stage 4 — Final decision
   - Mark as SCRAP (mandatory)
   - Cause code mandatory
   - Photo mandatory
   - Compensation: qtyRemaining++ (need extra piece to reach target)
   - Notification to QC supervisor

8. PARALLEL STEPS (Device Execution Group)
   
   8.1 Layout when in parallel group
       - Main step prominent (center)
       - Parallel steps in lanes (left/right)
       - Each lane shows: step + part reference (current/previous/next)
   
   8.2 Operator interaction
       - Main step: device runs autonomously, operator confirms when done
       - Parallel steps: operator does each in sequence within the cycle
       - Buffer: visual countdown for safety margin
       - Validation: total parallel time < main step time

9. CONTINUOUS PRODUCTION MODE
   
   For extrusion / continuous processes:
   - Single execution covers many pieces
   - Counter updates automatically (per-piece events)
   - Periodic logging (every 5 min)
   - Sample taking triggers (every N pieces)
   - "Stop run" button (with confirmation)

10. CFRP-SPECIFIC UI (long cycles)
    
    For autoclave cure cycle (4-12h):
    - Operator can leave the workstation (not stuck watching)
    - Live status visible from any HMI
    - Real-time temperature/pressure curves
    - Mobile notification on completion
    - Can do parallel work during cycle

11. SAFETY DEVICES UI (reflectance test)
    
    For ECE-R104 reflectance testing:
    - Sample selection
    - Multi-point measurement (5 points per sample)
    - Live spec validation (yellow ≥ 175 cd/lx/m²)
    - Color CIE-Lab capture
    - Auto-classification: PASS / MARGINAL / FAIL

12. AUDIT & TRACEABILITY
    
    Every action logged:
    - Operator ID + timestamp
    - Step ID + outcome
    - Parameters used
    - Devices involved
    - Photos captured
    - Recovery attempts
    
    All traceable forward (lot → finished good) and backward.

13. OFFLINE-FIRST CAPABILITY
    
    HMI must work even if backend disconnects:
    - Cache current WO + workflow snapshot locally (IndexedDB)
    - Operations queued when offline
    - Sync when reconnected
    - Visual indicator: online / offline
    - Conflict resolution: last-write-wins with audit

14. PERFORMANCE
    
    - Step transition: < 200ms
    - Photo capture: < 1 sec
    - Counter update real-time (< 100ms latency)
    - Smooth on tablet/touchscreen hardware
    - Battery-friendly (touch screens often battery-powered)

15. ACCESSIBILITY
    
    - WCAG AA contrast minimum
    - Large fonts (operator might wear safety glasses)
    - Audio cues optional (factory noise high)
    - Color + icon (not color alone)
    - Italian primary, English available

16. VERIFICATION STEPS
    
    - Operator can complete a full WO from start to finish
    - All 8 step renderers work
    - Recovery flow handles failures
    - Counters accurate
    - Real-time sync between backend and HMI
    - Performance smooth on real device

After presenting your plan, STOP and wait for my approval.

═══════════════════════════════════════════════════════════════════════════════
PHASE 2 — BUILD (ONLY AFTER MY APPROVAL)
═══════════════════════════════════════════════════════════════════════════════

When I say "go", proceed in this order:

STEP 2.1 — Domain logic
  - packages/domain: WO execution state machine
  - packages/domain: Step execution logic
  - packages/domain: Recovery flow state machine
  - packages/domain: Counter calculation logic
  - Tests: 30+ tests

STEP 2.2 — Authentication
  - apps/hmi: LoginPage with badge + PIN
  - apps/hmi: WorkstationSelector
  - apps/api: Auth endpoints (badge scan, PIN verification)
  - Touch-optimized UI
  - Verify: login flow E2E

STEP 2.3 — WO Dispatch list
  - apps/hmi: DispatchListPage
  - Show assigned WOs
  - Card-based UI
  - Sort + filter
  - Verify: list loads with seed data

STEP 2.4 — Execution screen layout
  - apps/hmi: ExecutionPage layout
  - Header (WO info)
  - 3-level timer
  - Step area
  - Counters
  - Attention points
  - Footer (controls)
  - Verify: layout responsive

STEP 2.5 — Step renderer foundation
  - apps/hmi: StepRenderer (polymorphic)
  - Detects step category, delegates to specific renderer
  - Common controls: Confirm, Pause, Skip, Report Failure
  - Verify: switches between renderers correctly

STEP 2.6 — Renderer: SCAN
  - Camera/barcode input
  - Manual fallback
  - Validation feedback
  - Verify: scans seed data items

STEP 2.7 — Renderer: PRODUCTION
  - Instructions display
  - Confirmation buttons
  - Photo capture (optional)
  - Verify: typical manual step works

STEP 2.8 — Renderer: DEVICE EXECUTION
  - Start cycle button
  - Live progress (mock device)
  - Cancel with confirmation
  - Verify: with mock leak tester

STEP 2.9 — Renderer: QUALITY CONTROL
  - Checklist UI
  - Pass/Fail
  - Photo on defect
  - Measurement input
  - Verify: visual + dimensional check work

STEP 2.10 — Renderer: LOGISTICS
  - Source/destination
  - Confirm move
  - Quantity input
  - Verify: WIP movements work

STEP 2.11 — Renderer: PARALLEL (Device Execution Group)
  - Swimlane layout
  - Main + parallel steps
  - Buffer countdown
  - Verify: leak test scenario works

STEP 2.12 — Renderer: SAMPLE
  - Sample ID generation
  - Test results entry
  - Sample registry update
  - Verify: every-50 trigger works

STEP 2.13 — Renderer: RECOVERY (4 stages)
  - Stage 1: fault code dropdown
  - Stage 2: first attempt
  - Stage 3: second attempt
  - Stage 4: scrap with cause
  - Verify: full recovery flow E2E

STEP 2.14 — Multi-level timer
  - 3 levels (WO/phase/part)
  - Pause/resume
  - Color thresholds
  - Verify: accuracy

STEP 2.15 — Counters
  - Real-time updates via Socket.IO
  - Visual progress bar
  - Verify: matches backend state

STEP 2.16 — Continuous production support
  - Single execution → many pieces
  - Auto counter
  - Sample triggers
  - Stop run button
  - Verify: extrusion scenario works

STEP 2.17 — CFRP long cycle support
  - Background cycle status
  - Mobile notification
  - Multi-station visibility
  - Verify: cure cycle scenario

STEP 2.18 — Safety devices reflectance
  - Multi-point measurement
  - Live spec validation
  - Auto-classification
  - Verify: ECE-R104 scenario

STEP 2.19 — Offline-first
  - IndexedDB cache
  - Operation queue
  - Sync on reconnect
  - Verify: works offline 5+ min

STEP 2.20 — E2E tests
  - Full WO execution (Pneumatic Air)
  - With recovery
  - With samples
  - With parallel steps
  - With box packaging
  - Verify: all green

═══════════════════════════════════════════════════════════════════════════════
PHASE 3 — VERIFY & REPORT
═══════════════════════════════════════════════════════════════════════════════

Generate STATUS REPORT:
- All 8 renderers working
- Recovery flow functional
- Counters accurate
- Real-time sync
- Performance smooth
- Offline support
- Tests passing (count)
- Suggested commit message

═══════════════════════════════════════════════════════════════════════════════
ACCEPTANCE CRITERIA
═══════════════════════════════════════════════════════════════════════════════

[ ] Operator login (badge + PIN) works
[ ] Workstation selection works
[ ] WO dispatch list works
[ ] Execution screen layout responsive (touch-optimized)
[ ] All 8 step renderers complete
[ ] Multi-level timer (3 levels) accurate
[ ] Real-time counters
[ ] Attention points displayed correctly
[ ] Recovery flow (4 stages) works end-to-end
[ ] Parallel steps in Device Execution Group
[ ] Sample taking workflow
[ ] Continuous production mode
[ ] CFRP long cycle support
[ ] Safety devices reflectance test
[ ] Offline-first works (5+ min disconnect)
[ ] All E2E tests pass
[ ] Performance: < 200ms step transitions
[ ] Design tokens applied throughout
[ ] WCAG AA contrast verified

═══════════════════════════════════════════════════════════════════════════════
GO STEP-BY-STEP
═══════════════════════════════════════════════════════════════════════════════

Now:
1. Read additional files
2. Verify PROMPT_4 (auto-gen working)
3. Present plan
4. Wait for approval
5. Build
6. Status report

START WITH THE PLAN.
```

(End of prompt to paste)

---

## 📚 Notes for Antonella (NOT to paste to Claude Code)

### Why this is the longest single prompt

The HMI is what operators use 8 hours/day. UX bugs translate directly into:
- Production delays
- Scrap (operator misclicks)
- Quality issues (skipped checks)
- Safety incidents

So we invest more time here than anywhere else.

### Watch out for these issues

**Issue 1**: Claude Code might use hover states.
- Reject. No hover on touch UI. Operators wear gloves.

**Issue 2**: Claude Code might make buttons too small.
- Push back. Minimum 60px (gloved finger). Larger preferred.

**Issue 3**: Photo capture might be slow.
- Critical. Test on actual hardware.

**Issue 4**: Offline support skipped.
- Insist. Factories have unstable WiFi. Without offline, HMI freezes.

### How long this should take

| Activity | Estimated time |
|---|---|
| Read additional specs | 20-25 min |
| Plan proposal | 25-30 min |
| Plan review | 15 min |
| Build (~20 steps) | 150-200 min |
| Verify | 30 min |
| Status report | 10 min |
| **Total** | **3.5-4.5 hours** |

This is the longest prompt. STRONGLY consider splitting.

### Splitting strategy (recommended)

**Split A — Foundation + simple renderers** (~2 hours)
- Steps 2.1-2.10 (auth, dispatch, layout, basic 5 renderers)
- Output: operator can do simple steps

**Split B — Advanced features** (~1.5 hours)
- Steps 2.11-2.16 (parallel, sample, recovery, timer, counters, continuous)
- Output: handles complex scenarios

**Split C — Module-specific + offline** (~1 hour)
- Steps 2.17-2.20 (CFRP, Safety, offline, E2E)
- Output: production-ready

You can do A, commit, B, commit, C, commit. Each ~1.5-2 hours.

### Hardware testing tip

If possible, test on the actual touchscreen hardware Reflexallen will use.
Browser dev tools have "Device Mode" but real touch is different.
Specifically check:
- Tap accuracy with simulated gloves
- Visibility under fluorescent lights
- Performance on lower-spec hardware

### After this step

After PROMPT_5, the system can be USED in production. Operators can complete
full WOs. The next step (PROMPT_6) adds dashboards and reporting for managers.

---

## 🔄 Change Log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-27 | Initial v3 prompt (created with CLAUDE.md auto-load pattern) |

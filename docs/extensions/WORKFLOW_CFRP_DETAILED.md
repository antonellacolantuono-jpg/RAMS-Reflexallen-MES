# WORKFLOW_CFRP_DETAILED — Extension v1.0

> **Type**: Detailed Workflow Reference (Reflexallen Compositi line)
> **Parent**: `extensions/WORKFLOW_CFRP.md` (high-level)
> **Status**: Detailed reference for build seed + training + audit
> **Last updated**: 2026-04-27

---

## 1. Purpose

Step-by-step granular detail for CFRP (Carbon Fiber Reinforced Polymer) production with all branching logic. CFRP is fundamentally different from tubes:
- Long cycles (4-12 hours per part)
- Manual lay-up dominant
- Mold-dependent
- Critical out-time tracking
- NDT testing required

**Reference product**: Carena posteriore moto sportiva (ITM-FG-RFA-CFRP-001)

---

## 2. CFRP-Specific Critical Branches

CFRP has unique failure modes not seen in tube production:

| Failure | Recovery | Cost |
|---|---|---|
| Out-time prepreg exceeded | None — must scrap material | High (€500-2000/roll) |
| Vacuum bag leak | Re-do bagging from scratch | Medium |
| Cure cycle deviation | All parts in cycle quarantined | Very high (€2000-5000) |
| Mold release failure | Damage to mold + part | Very high (mold + part) |
| NDT major defect | Scrap part | High (4-12 hours work lost) |

This makes **prevention** critical — every step has stricter validations.

---

## 3. PHASE 1 — INBOUND: Refrigerated Materials (Detailed)

### 3.1 Prepreg roll reception

#### Step 3.1.1 — Truck arrival (refrigerated transport)
- **Critical**: Truck must be refrigerated (4°C minimum) or frozen (-18°C)
- **Verification**: Operator checks truck temperature log
- **Branches**:
  - ✅ Cold chain maintained → proceed
  - ❌ Cold chain broken (temp excursion documented):
    - 🔒 BLOCK reception
    - Notify supplier immediately
    - Quarantine pallet pending investigation
    - Decision tree:
      - Brief excursion (< 4h, max +10°C): may be acceptable, requires testing
      - Major excursion (> 4h or > +20°C): reject, return to supplier

#### Step 3.1.2 — Visual inspection
- **Checklist**:
  - [ ] Insulated packaging intact
  - [ ] Temperature indicators reading normal
  - [ ] No water/condensation damage
  - [ ] Roll labels intact
- **Branches**:
  - ✅ All OK → proceed
  - ❌ Visible water damage:
    - Likely insulation failure
    - Quarantine immediately
    - Test moisture content before any decision

#### Step 3.1.3 — Scan roll barcode
- **Action**: Scan QR/barcode on each roll
- **Format**: `^PREPREG-[A-Z]+-\d+-\d+$`
- **System validates**:
  - Material code matches order
  - Manufacture date present
  - Expiration date in future
- **Branches**:
  - ✅ Recognized → proceed to step 3.1.4
  - ❌ Unrecognized format:
    - Manual entry required
    - Operator + supervisor double-confirm
    - Mandatory CoA reference

#### Step 3.1.4 — Register PrepregRoll entity
- **System action** (atomic transaction):
  - Create `PrepregRoll` record
  - Set `currentStorageState: frozen` (or `refrigerated` if 4°C)
  - Set `maxFrozenLifeDate`: from supplier CoA
  - Set `maxOutTimeMinutes`: 43200 (30 days at room temp budget)
  - Set `currentOutTimeMinutes: 0`
  - Generate code `PREPREG-CF-T700-{seq}`
- **Branches**:
  - ✅ Created → proceed
  - ❌ Duplicate roll number (already registered):
    - Likely supplier error
    - Investigation required

#### Step 3.1.5 — CoA verification
- **Operator scans/uploads** CoA from supplier
- **Critical CoA fields**:
  - Lot number
  - Manufacture date
  - Storage life (frozen)
  - Out-time budget total
  - Material specs (resin content, areal weight)
  - Tg (glass transition temperature)
- **Branches**:
  - ✅ All complete → register and link
  - ⚠️ Missing optional fields:
    - Note in registration
    - May affect testing
  - ❌ Missing critical fields (lot, expiration):
    - 🔒 BLOCK
    - CoA must be obtained before storage

### 3.2 Move to refrigerated storage

#### Step 3.2.1 — Transport timer starts
- **Critical**: Material at room temp accumulates out-time
- **System auto-action**: Start `PrepregOutTimeRecord` if out of cold storage
- **Time budget**: max 30 min from receiving to freezer
- **Branches**:
  - ✅ Within 30 min → no out-time concern
  - ⚠️ 30-60 min:
    - Log: 30+ min out-time
    - Increments `currentOutTimeMinutes`
  - ❌ Over 60 min:
    - Quality alert
    - Likely production delay impact

#### Step 3.2.2 — Storage selection
- **Options**: Freezer (-18°C) or Refrigerator (4°C)
- **Decision logic**:
  - Long-term storage: Freezer
  - Imminent use (< 1 week): Refrigerator (faster availability)
- **Branches**:
  - ✅ Capacity available → store
  - ❌ Freezer full:
    - Recovery: rotate older rolls (FIFO check)
    - Or use refrigerator temporarily

#### Step 3.2.3 — Confirm storage placement
- **System action**: Update `currentLocationId`, `currentStorageState`
- **Pause** out-time accumulation if going to cold storage

---

## 4. PHASE 2 — Mold Preparation (Detailed)

### 4.1 Mold retrieval and inspection

#### Step 4.1.1 — Locate mold in storage
- **Action**: Operator goes to mold rack
- **Scan QR**: `MOLD-CARENA-YZF6-001`
- **System validates**:
  - Mold exists ✓
  - Status: `available` ✓
  - Currently not in another WO ✓
- **Branches**:
  - ✅ Available → proceed
  - ❌ Status `cleaning`:
    - Wait for cleaning completion
    - Estimated time displayed
  - ❌ Status `maintenance`:
    - Mold not usable
    - Recovery: use spare mold if available
    - Or postpone WO
  - ❌ Cycles count near limit (> 90%):
    - Warning: "Stampo prossimo a fine vita: 750/800 cicli"
    - Operator + supervisor decision: continue or replace
    - If continue: track in WO metadata, schedule replacement after

#### Step 4.1.2 — Visual mold inspection
- **Checklist**:
  - [ ] No surface scratches that would transfer to part
  - [ ] No release agent buildup (if present, clean first)
  - [ ] Thermocouple ports intact
  - [ ] Vacuum ports clean
  - [ ] Edges and corners not damaged
- **Branches**:
  - ✅ All OK → proceed to cleaning
  - ⚠️ Minor scratches (cosmetic Class B accepted):
    - Note in WO
    - Continue
  - ❌ Major damage (cracks, deep scratches):
    - 🔒 BLOCK use
    - Mold to maintenance
    - Auto-create maintenance order
    - Recovery: spare mold or postpone

### 4.2 Mold cleaning

#### Step 4.2.1 — Pre-cleaning inspection
- Check for: residual resin, dust, fibers, contamination
- Document with photo if heavy contamination

#### Step 4.2.2 — Solvent cleaning
- **Action**: Apply cleaning solvent (acetone or specific cleaner)
- **PPE required**: Mask A2P3, gloves, eye protection
- **Time**: 15-20 min
- **Branches**:
  - ✅ Clean → proceed to release agent
  - ❌ Stubborn contamination:
    - Repeat with stronger solvent
    - Or mechanical cleaning (very gentle)
    - 3 attempts before mold to maintenance

### 4.3 Release agent application

#### Step 4.3.1 — Verify last application
- **System check**: Days since last release agent
- **Branches**:
  - ✅ Recently applied (< 5 cycles) → minor touch-up only
  - ❌ Many cycles (> 25 cycles since last full app):
    - Full re-application required
    - Time: 60+ minutes

#### Step 4.3.2 — Application 1 of 4-6 layers
- **Action**: Spray or brush thin coat
- **Method-dependent**:
  - Spray: even coverage
  - Brush: detail areas
- **Wait time**: 10 min cure between coats
- **Branches**:
  - ✅ Coat applied → wait for cure
  - ❌ Pooling/excess application:
    - Wipe excess immediately
    - Re-apply

#### Step 4.3.3 — Apply layers 2-6
- Same procedure, multiple coats
- Total: 4-6 layers depending on mold criticality

#### Step 4.3.4 — Final inspection
- **Visual**: surface uniform, no missed areas
- **Touch test**: surface feels properly conditioned
- **Branches**:
  - ✅ OK → mark mold ready
  - ❌ Inconsistencies:
    - Document and re-apply problem areas

#### Step 4.3.5 — Update mold record
- **System action**:
  - `lastReleaseAgentAppliedAt`: now
  - Calculate `nextReapplyDue`: cycles count + 25
  - Status remains `available` until WO assignment

---

## 5. PHASE 3 — Prepreg Take-out (Detailed)

### 5.1 Critical pre-validation

#### Step 5.1.1 — Roll selection
- **System recommends**: Rolls with most out-time remaining (FEFO logic)
- **Operator scans roll** in freezer

#### Step 5.1.2 — Out-time validation (CRITICAL)
- **System computes**:
  - Total out-time used: `currentOutTimeMinutes`
  - Budget remaining: `maxOutTimeMinutes - currentOutTimeMinutes`
  - Estimated additional out-time for this WO: ~12 hours (720 min)
- **Branches**:
  - ✅ Sufficient budget remaining (after this WO < max):
    - Approve usage
    - Continue
  - ⚠️ Tight budget (after this WO = 90-100% of max):
    - Warning to operator + supervisor
    - Operator confirms
    - Roll flagged for "use this WO and complete"
  - ❌ Insufficient budget:
    - 🔒 BLOCK
    - Cannot use this roll
    - Recovery: select different roll
    - If no roll available: postpone WO until new material received
  - ❌ Already expired (`currentStorageState: expired`):
    - 🔒 BLOCK absolutely
    - Mark roll for scrap
    - Generate audit log

#### Step 5.1.3 — Frozen life check
- **System**: Check `maxFrozenLifeDate` not exceeded
- **Branches**:
  - ✅ In date → proceed
  - ⚠️ Within 30 days of expiration → use immediately
  - ❌ Frozen life expired → cannot use, scrap material

### 5.2 Take-out from freezer

#### Step 5.2.1 — Out-time recording starts
- **System action**:
  - Create `PrepregOutTimeRecord`
  - `tookOutAt: now()`
  - State change: `frozen → out`
- **Branches**:
  - ✅ Recorded → proceed
  - ❌ Database error:
    - Critical issue
    - Operator manually logs time
    - IT investigation needed

#### Step 5.2.2 — Physical extraction
- **Action**: Operator removes roll from freezer
- **PPE**: Cold-resistant gloves
- **Time**: 1-2 min
- **Branches**:
  - ✅ Removed → proceed
  - ❌ Roll stuck (frozen to shelf):
    - Allow gradual warming (10-15 min) at freezer entrance
    - Avoid forcing (damage risk)

#### Step 5.2.3 — Move to lay-up area
- **Time**: 5-10 min walk
- **System**: Out-time accumulates

### 5.3 Material conditioning (rinvenimento)

#### Step 5.3.1 — Conditioning timer start
- **Critical**: Prepreg must thaw before lay-up
- **Time**: 60-240 minutes at room temperature
- **Operator places** roll in conditioning area (climate-controlled)

#### Step 5.3.2 — Wait for conditioning
- **System monitors**:
  - Out-time accumulating
  - Conditioning time
- **HMI displays**: countdown to "ready for lay-up"
- **Branches**:
  - ✅ 60-180 min (sweet spot): ready
  - ⚠️ < 60 min: not ready, lay-up will fail
  - ❌ > 240 min: out-time used inefficiently
    - Plan better next time
    - Continue but flag for analysis

#### Step 5.3.3 — Pre-lay-up inspection
- **Operator checks**:
  - [ ] Roll feels appropriately tacky (not too cold, not melted)
  - [ ] No condensation visible
  - [ ] No visible damage
- **Branches**:
  - ✅ Ready → proceed to lay-up
  - ❌ Condensation visible:
    - Wait additional 30 min for evaporation
    - Or wipe with lint-free cloth (ESD-safe)

---

## 6. PHASE 4 — Prepreg Cutting (CNC Plotter, Detailed)

### 6.1 Setup CNC

#### Step 6.1.1 — Load nesting program
- **System action**: Load CAD-optimized cut layout
- **Validates**: Program matches WO and roll dimensions
- **Branches**:
  - ✅ Loaded → proceed
  - ❌ Wrong program:
    - Recovery: select correct program
    - Verify roll width matches

#### Step 6.1.2 — Mount roll on plotter
- **Operator** loads roll into CNC plotter
- **System**: Verify tension OK

### 6.2 Execute cut

#### Step 6.2.1 — Run CNC cut
- **Time**: ~20 min for full set of plies
- **Continuous monitoring**:
  - Cutter sharpness (force feedback)
  - Material movement (no slip)
- **Branches**:
  - ✅ Clean cut → proceed to step 6.2.2
  - ❌ Cutter dull mid-run:
    - Pause cut
    - Replace cutter blade
    - Resume from interrupted point
  - ❌ Material slip:
    - Stop cut
    - Reload roll with proper tension
    - Restart this section

#### Step 6.2.2 — Etichetta plies
- **For each ply** (typically 6 plies):
  - Apply temporary label with:
    - Ply number (1-6)
    - Orientation (0°, 45°, 90°)
    - Date
- **Branches**:
  - ✅ All labeled → proceed
  - ❌ Label fall off:
    - Re-label
    - Use stronger temporary adhesive

### 6.3 Stack for lay-up

- **Action**: Stack plies in correct order
- **Sequence**: Bottom to top per CAD specification
- **Verification**: Operator counts and verifies each ply present

---

## 7. PHASE 5 — Manual Lay-up (Detailed)

### 7.1 Per-ply cycle

#### Step 7.1.1 — Tack coat (first ply only)
- **Action**: Apply light adhesive coat to mold
- **Purpose**: Help first ply adhere
- **Skip**: For subsequent plies

#### Step 7.1.2 — Position ply N
- **Operator action**: Carefully place ply on mold
- **Critical orientation**: Match CAD spec (0°, 45°, 90°)
- **Time**: 5-15 min per ply (geometry-dependent)
- **Branches**:
  - ✅ Positioned correctly → proceed
  - ❌ Wrong orientation detected:
    - Lift gently and reposition
    - If sticky: warm with heat gun (carefully)
  - ❌ Tear in ply during positioning:
    - Possible: ply too cold, geometry too complex
    - Recovery:
      - If small tear: continue and overlap with next ply
      - If large tear: discard ply, re-cut

#### Step 7.1.3 — Compaction
- **Method**: Manual with spatula and roller
- **Goal**: Eliminate air bubbles, ensure adhesion
- **Time**: 3-5 min per ply
- **Branches**:
  - ✅ Smooth, no bubbles → proceed
  - ⚠️ Small bubble persistent:
    - Mark for debulking attention
    - Continue (may resolve in vacuum)
  - ❌ Major air pocket:
    - Lift section, smooth out, reapply
    - Multiple attempts

#### Step 7.1.4 — Log ply placement
- **System action**: Record `LayupLog` entry:
  - Ply number
  - Operator ID
  - Timestamp
  - Orientation
  - Notes (if any defects)

#### Step 7.1.5 — Decision: debulk now?
- **Logic**: Every 3 plies, debulking session
- **Branches**:
  - Continue lay-up → next ply
  - Time for debulking → proceed to 7.2

### 7.2 Debulking session

#### Step 7.2.1 — Apply temporary vacuum film
- **Time**: 10 min
- **Action**: Cover work-in-progress with disposable film + breather

#### Step 7.2.2 — Vacuum debulk
- **Recipe**: 1 bar vacuum, 20 minutes
- **Purpose**: Compress plies, remove trapped air
- **Branches**:
  - ✅ Achieved 1 bar steady → proceed
  - ❌ Cannot achieve full vacuum:
    - Likely leak in temp film
    - Re-seal and retry

#### Step 7.2.3 — Inspect after debulk
- **Visual**: Plies properly compressed, no major bubbles
- **Branches**:
  - ✅ Good → continue with next plies
  - ❌ Bubbles persist:
    - Investigate placement
    - Possibly lift problematic ply

### 7.3 Insert installation

#### Step 7.3.1 — Position metal inserts
- **For carena**: 4 threaded inserts M6
- **Locations**: Per CAD specification
- **Branches**:
  - ✅ Positioned correctly → proceed
  - ❌ Wrong location:
    - Lift and reposition
    - Prevent epoxy adhering

#### Step 7.3.2 — Apply structural adhesive
- **Epoxy 2K**: 5g per insert
- **Mix carefully**: Ratio specified by manufacturer
- **Time-sensitive**: Adhesive has pot-life

#### Step 7.3.3 — Apply final closing plies
- **Continue lay-up procedure** for plies 5-6
- **Adhesion**: Bond closing plies over inserts

### 7.4 Final lay-up inspection

#### Step 7.4.1 — Operator self-check
- **Visual**: Surface uniform, all plies present, inserts in place
- **Documentation**: Photo of lay-up complete

#### Step 7.4.2 — Supervisor review
- **Required for first part of lot**
- **Branches**:
  - ✅ Approved → proceed to vacuum bagging
  - ❌ Issue identified:
    - Discussion + correction
    - May require strip-down and restart (rare)

---

## 8. PHASE 6 — Vacuum Bagging (Critical)

### 8.1 Bag construction

#### Step 8.1.1 — Apply peel-ply
- **Material**: Nylon film
- **Purpose**: Sacrificial layer, removed after cure
- **Coverage**: Slightly larger than part
- **Time**: 5 min

#### Step 8.1.2 — Apply release film (perforated)
- **Purpose**: Controls resin flow
- **Hole pattern**: Per specification
- **Time**: 5 min

#### Step 8.1.3 — Apply breather/bleeder
- **Material**: Fiber glass mat (or specific bleeder)
- **Purpose**: Distributes vacuum, absorbs excess resin
- **Time**: 5 min

#### Step 8.1.4 — Install vacuum port
- **Position**: Strategic location for even vacuum
- **Branches**:
  - ✅ Secured → proceed
  - ❌ Loose connection:
    - Tighten or replace fitting

#### Step 8.1.5 — Lay bagging film
- **Larger than part** by sufficient margin (10-15 cm overlap)
- **Time**: 10 min

#### Step 8.1.6 — Apply sealant tape
- **Critical**: Continuous seal around perimeter
- **No gaps**, no breaks
- **Time**: 15-20 min
- **Branches**:
  - ✅ Visually complete → proceed to test
  - ⚠️ Minor visible gap:
    - Apply additional tape
    - Continue

### 8.2 Vacuum tightness test (CRITICAL!)

#### Step 8.2.1 — Apply vacuum
- **Connect** vacuum hose
- **Pull vacuum**: Target -1 bar (full vacuum)
- **Stabilization**: 60 sec
- **Branches**:
  - ✅ Reaches -1 bar → proceed to test
  - ❌ Cannot reach -1 bar:
    - Major leak
    - Recovery:
      - Visual inspection bag
      - Listen for hissing
      - Fix leak source
      - Retry from step 8.2.1

#### Step 8.2.2 — Measure initial pressure
- **System reads**: Sensor value
- **Record**: `initialPressureMbar`

#### Step 8.2.3 — Wait period
- **Time**: 5 minutes
- **Operator**: Cannot disturb bag during wait

#### Step 8.2.4 — Measure final pressure
- **System reads**: Sensor value
- **Compute**: `pressureDropMbar = initialPressureMbar - finalPressureMbar`

#### Step 8.2.5 — Pass/Fail decision
- **Threshold**: Drop < 50 mbar in 5 min
- **Branches**:
  - ✅ Drop < 50 mbar:
    - PASS
    - Record `VacuumBagTest` with `result: pass`
    - Proceed to autoclave
  - ⚠️ Drop 30-50 mbar:
    - Borderline pass
    - QC supervisor review
    - May proceed with monitoring
  - ❌ Drop > 50 mbar:
    - 🔒 FAIL
    - **Cannot proceed to autoclave** (entire cure cycle would fail)
    - Recovery flow:
      - Locate leak (visual + smoke test optional)
      - Strip bag back to issue area
      - Re-apply seal
      - Repeat test from 8.2.1
    - ATTEMPTS: 3 max
    - After 3 fails:
      - Strip bag entirely
      - Restart from peel-ply application
      - Or call supervisor for diagnosis

#### Step 8.2.6 — Tag for cure cycle
- **System action**: Link vacuum bag test to upcoming cure cycle
- **Identification**: Mold barcode for traceability

---

## 9. PHASE 7 — Autoclave Cure Cycle (Long-Running)

### 9.1 Loading

#### Step 9.1.1 — Transport to autoclave
- **Time**: 5-10 min via cart
- **Caution**: Don't disturb vacuum bag

#### Step 9.1.2 — Position on rack
- **Multiple parts**: Optimize batch (4 parts per cycle typical)
- **Spacing**: Air circulation requirement

#### Step 9.1.3 — Connect vacuum
- **Action**: Connect each part's vacuum to autoclave system
- **Verify**: Each part holds vacuum
- **Branches**:
  - ✅ All parts vacuum OK → proceed
  - ❌ One part loses vacuum:
    - Don't include in this cycle
    - Move part to bagging rework
    - Continue with remaining parts

#### Step 9.1.4 — Connect thermocouples
- **Critical**: 5-8 thermocouples per part
- **Position**: Critical zones (thick sections, corners)
- **Branches**:
  - ✅ All connected → proceed
  - ❌ Thermocouple fault:
    - Replace thermocouple
    - Verify signal good

#### Step 9.1.5 — Close door
- **System verification**: Door fully sealed
- **Branches**:
  - ✅ Sealed → proceed
  - ❌ Door not sealing:
    - Inspect door seal
    - Maintenance if persistent

### 9.2 Cure cycle execution

#### Step 9.2.1 — Load recipe
- **Recipe RCP-CURE-EPOXY-180-001**
- **System sends to autoclave controller**
- **Branches**:
  - ✅ Loaded → proceed to start
  - ❌ Recipe rejected:
    - Verify autoclave in correct state
    - Possible: previous cycle data not cleared

#### Step 9.2.2 — Start cycle
- **Operator confirms**: Authorization to start
- **System action**:
  - Create `CureCycleRun` entity
  - Status: `pre_vacuum`
  - Schedule background job for telemetry (every 30 sec)
  - Lock all loaded parts to this run

#### Step 9.2.3 — Phase 1: Pre-vacuum (30 min)
- **Vacuum**: 1 bar
- **Pressure**: Ambient
- **Temperature**: Ambient
- **Monitoring**: Vacuum holding, no leaks
- **Branches**:
  - ✅ Stable vacuum → proceed
  - ❌ Vacuum dropping:
    - Cannot enter heating phase
    - Abort cycle
    - Cure cycle FAILED
    - All parts in cycle quarantined for review

#### Step 9.2.4 — Phase 2: Heating ramp (90 min)
- **Rate**: 1.5°C/min
- **Pressure ramps**: 0 → 6.5 bar at midpoint
- **Target**: 180°C
- **Monitoring**: Temperature curves, all thermocouples
- **Branches**:
  - ✅ All temps tracking ramp → proceed
  - ⚠️ One thermocouple lags:
    - Monitor carefully
    - May indicate cold spot
  - ❌ Temperature deviation > 5°C from target:
    - 🔒 ALARM
    - Cycle FAILED
    - Quarantine all parts

#### Step 9.2.5 — Phase 3: Dwell (120 min)
- **Temperature**: 180°C ± 3°C
- **Pressure**: 6.5 bar
- **Vacuum**: 1 bar
- **Critical**: Most polymerization happens here
- **Continuous logging**: Every 30 sec, 8 thermocouples
- **Operator can do parallel work** during this long phase
- **Branches**:
  - ✅ Stable conditions throughout → proceed
  - ⚠️ Brief deviation (auto-corrected):
    - Logged, continue
    - Review post-cycle
  - ❌ Sustained deviation:
    - Alarm
    - Cycle compromised
    - Investigation required

#### Step 9.2.6 — Phase 4: Cooling ramp (60 min)
- **Rate**: -2°C/min
- **Until**: < 60°C
- **Branches**:
  - ✅ Smooth cooling → proceed
  - ❌ Too fast cooling:
    - Possible: thermal shock to part
    - Reduce rate

#### Step 9.2.7 — Phase 5: Depressurization (15 min)
- **Pressure**: 6.5 → 0 bar (slow)
- **Vacuum**: Released last
- **Open door**: Only when < 60°C

### 9.3 Cycle completion

#### Step 9.3.1 — System auto-completes
- **`CureCycleRun.status: completed`**
- **`actualDurationSec` recorded**
- **Telemetry archive locked**
- **Pieces linked to telemetry archive (genealogy)**

#### Step 9.3.2 — Door open and unload
- **Operator action**: Carefully remove parts
- **Mold + part still hot**: Use heat-resistant gloves

---

## 10. PHASE 8 — Demolding & Finishing

### 10.1 Bag removal

#### Step 10.1.1 — Strip bag materials
- **Order**: Bagging film → breather → release film → peel-ply
- **Caution**: Don't damage part surface

#### Step 10.1.2 — Inspect bag (post-cycle)
- **Look for**:
  - Resin distribution patterns
  - Any missed compaction
  - Telltale signs of issues
- **Document**: Photos for archive

### 10.2 Demolding

#### Step 10.2.1 — Begin separation
- **Method**: Plastic wedges, gentle prying
- **CAUTION**: 
  - Don't scratch mold
  - Don't crack part
- **Branches**:
  - ✅ Smooth release → proceed
  - ⚠️ Sticky areas:
    - More release agent needed next time
    - Use additional wedges
  - ❌ Part stuck firmly:
    - Investigate: was release agent applied recently?
    - Risk: damage to mold during forced removal
    - Recovery: gentle warming, extra patience
    - May damage part (scrap risk)

#### Step 10.2.2 — Final extraction
- **Once initiated**: Complete removal
- **Inspect part**: First visual
- **Inspect mold**: Damage check

#### Step 10.2.3 — Mold to cleaning
- **Status update**: Mold → `cleaning`
- **Cycles count**: Auto-incremented

### 10.3 Finishing operations

#### Step 10.3.1 — Edge trimming (water-jet CNC)
- **Time**: 15 min per part
- **Operator**: PPE for CFRP dust!

#### Step 10.3.2 — Drilling mounting holes
- **4 × M6 holes**
- **Special CFRP drill bits** (carbide, slow speed)
- **Branches**:
  - ✅ Clean holes → proceed
  - ❌ Delamination at hole:
    - Significant defect
    - Assess: can be patched? or scrap?

#### Step 10.3.3 — Edge smoothing
- **Manual or CNC routing**

#### Step 10.3.4 — Surface preparation
- **Sanding**: Progressive grits (P400, P800, P1200)
- **Goal**: Class A surface for visible carbon weave

---

## 11. PHASE 9 — NDT (Non-Destructive Testing)

### 11.1 Ultrasonic C-scan (mandatory for structural parts)

#### Step 11.1.1 — Position part on UT scanner
- **Equipment**: DEV-UT-001
- **Surface contact**: Couplant gel applied

#### Step 11.1.2 — Run scan
- **Time**: 15 min per part
- **Output**: Image (C-scan map)

#### Step 11.1.3 — Operator review of scan
- **Look for**:
  - Delaminations (white spots in scan)
  - Voids (similar)
  - Inclusions (foreign objects)
- **Branches**:
  - ✅ No defects → PASS
  - ⚠️ Minor defects (within tolerance):
    - Mark on scan image
    - Note in NDT result
    - PASS with notes
  - ❌ Major defects:
    - Quality manager review
    - Decision tree:
      - Cosmetic, minor: accept with deviation
      - Structural concern: SCRAP
      - Borderline: ENGINEER review

#### Step 11.1.4 — Record NDT result
- **System action**: Create `NDTResult` entity
- **Attach**: Scan image, defect map, severity classifications

### 11.2 Dimensional verification (CMM or 3D scan)

#### Step 11.2.1 — CMM measurement
- **Time**: 10 min
- **Compare to**: CAD model
- **Tolerance**: Per drawing
- **Branches**:
  - ✅ All dimensions in tolerance → PASS
  - ❌ Out of tolerance:
    - May be marginal: accept with deviation
    - Or scrap

### 11.3 Weight verification

#### Step 11.3.1 — Weigh part
- **Target**: 450g ± 20g
- **Branches**:
  - ✅ In range → PASS
  - ❌ Underweight: possibly missing plies (rare)
  - ❌ Overweight: possibly excess resin

---

## 12. PHASE 10-11 — Painting & Packaging (Detailed)

### 12.1 Painting (long-running with curing waits)

For brevity, key branching:
- Surface preparation: clean, no dust → proceed
- Primer application → curing 4h
- Clear coat layer 1 → curing 4h
- Clear coat layer 2 → curing 4h
- Surface inspection: must be Class A finish
- Branch: defect → re-sanding + re-paint (significant rework)

### 12.2 Polishing
- Light sanding (P2000) → polishing compounds → buffing → final inspection

### 12.3 Packaging
- **Custom box**: BTYPE-CARD-CFRP-001 (one piece per box, fragile)
- **EVA foam protector**: Insert before part
- **Seal**: Tamper-evident
- **Label**: Customer + ECE marking
- **Branch**: Damage during packaging → scrap

---

## 13. Cross-cutting concerns

### 13.1 Continuous out-time tracking

Throughout all CFRP phases:
- System constantly tracks prepreg out-time
- Alerts if approaching budget
- Auto-blocks future use if exceeded

### 13.2 Mold cycle count

After successful demolding:
- `mold.cyclesCount: increment by 1`
- If > 90% lifetime: warning event
- If > 100%: block mold

### 13.3 Cure cycle traceability

Every part in autoclave run linked to:
- CureCycleRun entity
- Telemetry archive
- All parts share fate (if cycle fails, all quarantined)

---

## 14. Cross-references

- High-level workflow: `extensions/WORKFLOW_CFRP.md`
- CFRP module: `extensions/CFRP_MODULE.md`
- Industrial operations: `extensions/INDUSTRIAL_OPERATIONS.md`

---

## 15. Change Log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-27 | Initial detailed CFRP workflow with branching |

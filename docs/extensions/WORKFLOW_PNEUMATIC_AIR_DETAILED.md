# WORKFLOW_PNEUMATIC_AIR_DETAILED — Extension v1.0

> **Type**: Detailed Workflow Reference (Reflexallen Pneumatic Air line)
> **Parent**: `extensions/WORKFLOW_PNEUMATIC_AIR.md` (high-level)
> **Status**: Detailed reference for build seed + training + audit
> **Last updated**: 2026-04-27

---

## 1. Purpose of this document

This document provides **step-by-step granular detail** of every operation in the Pneumatic Air production workflow, including:

- ✅ Each individual operator action
- ✅ All branching logic (decision trees)
- ✅ Recovery flows for every failure mode
- ✅ Time stamps and durations
- ✅ Validation checkpoints
- ✅ Edge cases handling
- ✅ Hand-off between phases
- ✅ Error recovery procedures

**Use cases**:
- Operator training material
- Build seed data for MES
- Process audit reference
- Stakeholder presentation

**Reference product**: Tubo pneumatico multistrato 12mm × 2m for truck braking (ITM-FG-RFA-PNE-001)

---

## 2. Workflow Branching Conventions

Throughout this document, branching is denoted as:

```
[Step] Description
  → IF condition_A: action
  → IF condition_B: action
  → ELSE: default action
  → ON ERROR: error handler
  → ATTEMPTS: 3 max, then escalate
```

**Decision symbols**:
- ✅ Success → continue
- ❌ Failure → recovery flow
- ⚠️ Warning → continue with notification
- 🔒 Block → stop and escalate

---

## 3. PHASE 1 — INBOUND LOGISTICS (Detailed)

**Objective**: Receive raw materials, verify quality, store in warehouse.
**Duration**: ~30 min
**Operators**: Magazziniere

### 3.1 Material reception at shipping dock

#### Step 3.1.1 — Truck arrival notification
- **Who**: Forklift operator
- **Action**: System receives notification (manual or via integration)
- **System action**: Open "ReceivingSession" entity
- **Expected duration**: 0 sec (notification)

#### Step 3.1.2 — Verify DDT vs purchase order
- **Action**: Operator checks delivery note (DDT) against expected order
- **System interaction**:
  - Scan DDT barcode (if available)
  - System retrieves expected items + quantities
  - Display side-by-side comparison
- **Branches**:
  - ✅ Match → proceed to step 3.1.3
  - ❌ Quantity mismatch:
    - Tolerance ≤ 5% (e.g., 95-105 instead of 100):
      - System logs discrepancy
      - Auto-approve receiving with note
      - Notify procurement
    - Tolerance > 5%:
      - 🔒 BLOCK receiving
      - Operator must contact supervisor
      - Supervisor decision: accept partial / reject delivery
      - Mandatory comment + photo of DDT
  - ❌ Item code mismatch:
    - 🔒 BLOCK
    - Likely supplier error
    - Quarantine pallet, await procurement decision
  - ❌ DDT illegible/damaged:
    - Operator manually enters reference
    - Photo documentation mandatory

#### Step 3.1.3 — Visual integrity check
- **Action**: Operator inspects packaging
- **Checklist**:
  - [ ] No tears or wet spots
  - [ ] Pallets stable, no leaning
  - [ ] Sacks/bags intact
  - [ ] Labels readable
- **Branches**:
  - ✅ All OK → proceed
  - ⚠️ Minor damage (e.g., torn outer wrap):
    - Document with photo
    - Continue receiving
    - Note in receiving log
  - ❌ Major damage (e.g., wet pallet, torn sacks):
    - Photos mandatory (multi-angle)
    - Decision tree:
      - Single sack damaged → segregate that sack to quarantine
      - Multiple sacks damaged → quarantine entire pallet
      - Forklift damage in transit → notify carrier
    - Notify supplier

### 3.2 Lot identification

#### Step 3.2.1 — Scan supplier lot QR/barcode
- **Action**: Operator scans QR code on each pallet/sack
- **System action**:
  - Validate format: `^LOT-PA12-\d{6}$`
  - Look up in registered lots
- **Branches**:
  - ✅ Lot recognized → proceed to step 3.2.2
  - ❌ Format invalid:
    - System shows error: "Codice non valido"
    - Operator can: retry / manual entry / call supervisor
    - ATTEMPTS: 3 max scan retries
    - After 3 failures: block scan, manual entry only
  - ❌ Lot not found in expected order:
    - Scenario A: Supplier sent extra/wrong lot
      - Quarantine immediately
      - Notify procurement
    - Scenario B: Lot existed but not registered yet
      - Operator can register new lot
      - Mandatory data: supplier, mfg date, CoA reference
  - ❌ Lot already received (duplicate scan):
    - Warning: "Lotto già ricevuto in data X"
    - Confirm if double-shipment or scan error
    - If error: ignore scan
    - If valid second batch: add to existing or new entry

#### Step 3.2.2 — Acquire CoA (Certificate of Analysis)
- **Action**: Operator scans/uploads CoA document
- **Required fields verified**:
  - Lot number matches
  - Material specs (MFI, moisture, etc.)
  - Manufacture date
  - Expiration date
  - Supplier signature
- **Branches**:
  - ✅ CoA complete and valid → proceed
  - ⚠️ CoA partial (missing some specs):
    - Receive provisionally
    - Status: `awaiting_documentation`
    - Cannot release for production until complete
  - ❌ CoA missing entirely:
    - 🔒 BLOCK receiving
    - Notify supplier for immediate CoA delivery
    - Hold pallet until received
  - ❌ CoA shows out-of-spec values:
    - Quarantine
    - Notify QA for review
    - Decision: reject / accept with deviation / use-as-is

### 3.3 Quality status assignment

#### Step 3.3.1 — Apply quality status
- **System auto-action**: Set `Lot.qualityStatus = QUARANTINE` (default)
- **Operator action**: Confirm/override
- **Branches**:
  - ✅ Skip-lot inspection eligible (qualified supplier):
    - Auto-status: `APPROVED`
    - No additional testing required
  - ⚠️ Standard quarantine:
    - Status: `QUARANTINE`
    - Sample test required by QC
  - ❌ Pre-known issue (recall, compliant):
    - Status: `REJECTED` directly
    - Skip storage, return to supplier

### 3.4 Storage allocation

#### Step 3.4.1 — Move to warehouse
- **Action**: Forklift transport from dock to warehouse
- **System interaction**:
  - Operator scans destination location
  - Validates: location empty, capacity sufficient
- **Branches**:
  - ✅ Location available → proceed
  - ❌ Location occupied:
    - Recovery: select alternate location
    - System suggests nearest empty
  - ❌ Capacity exceeded:
    - Split pallet across locations
    - Document split

#### Step 3.4.2 — Final registration
- **System action**: 
  - Mark `LotMovement: receiving → warehouse_mp`
  - Update inventory (Lot.currentQuantity)
  - Trigger event `lot.received`
- **Notifications sent**:
  - QA team (for sampling)
  - Procurement (delivery confirmation)
  - Production planning (material available)

### 3.5 Phase completion

- **Output**: Lot in warehouse with status `QUARANTINE` (or `APPROVED` if skip-lot)
- **Hand-off**: To QC team for sampling (if quarantine)
- **System state**: 
  - Lot entity created/updated
  - LotMovement records logged
  - Event `inboundCompleted` emitted

---

## 4. PHASE 2 — SETUP (Auto-Generated, Detailed)

**Objective**: Pre-production setup, including all 7 auto-generation rules.
**Duration**: ~45 min
**Operators**: Setup team (variable composition)

### 4.1 Skills & Login Verification (Rule #1)

#### Step 4.1.1 — Operator login HMI
- **Action**: Operator scans badge or enters PIN
- **System validation**:
  - Badge format: `^OP-\d{4}$`
  - PIN: 4-6 digits, hashed comparison
- **Branches**:
  - ✅ Login OK → load operator profile
  - ❌ Badge not recognized:
    - Error: "Operatore non trovato"
    - Retry available
    - After 3 failed: lock screen for 60 sec
    - Supervisor override available
  - ❌ PIN wrong:
    - Error: "PIN errato"
    - 5 attempts max
    - Auto-lock + notification to supervisor

#### Step 4.1.2 — Skill matrix verification
- **System action**: For each WO step requiring skill, verify operator has it active (not expired)
- **Required skills for tube production**:
  - EXT (Estrusione) — Luigi Bianchi ✓
  - ASSY (Assemblaggio) — Mario Rossi ✓
  - QC, TEST — Anna Verdi ✓
  - PACK, FORKLIFT — Piero Neri ✓
- **Branches**:
  - ✅ All operators have required skills:
    - Auto-pass step
    - Log: `skills.verified`
  - ⚠️ Skill expiring < 30 days:
    - Warning to operator + supervisor
    - Allow continuation
    - Schedule recertification
  - ❌ Skill expired:
    - 🔒 BLOCK assignment
    - Operator cannot do that specific step
    - Supervisor can override with audit reason
    - Audit trail mandatory
  - ❌ Skill missing entirely:
    - Block + suggest alternative operator
    - If no qualified operator available:
      - Stop WO release
      - Notify planner + supervisor

### 4.2 BOM Check Sequenziale (Rule #2)

#### Step 4.2.1 — System prepares BOM list
- **System action**: 
  - Explode BOM for ITM-FG-RFA-PNE-001
  - Order materials by criticality (granuli first, raccordi after)
  - Calculate quantities for WO target (100 pieces)

#### Step 4.2.2 — Sequential material verification
- **For each material in BOM**:
  
  **Material 1: Granuli PA12** (qty needed: 8.5 kg)
  - Step: Operator scans pallet/sack barcode
  - System validates:
    - Lot exists ✅
    - Lot quality status = APPROVED ✅
    - Lot has remaining qty ≥ 8.5 kg ✅
    - Lot not expired ✅
    - Lot not on hold ✅
  - **Branches**:
    - ✅ All checks pass:
      - Reserve 8.5 kg from lot
      - Update display: "PA12 OK ✓"
      - Move to next material
    - ❌ Lot in QUARANTINE:
      - Error: "Lotto in quarantena, non disponibile"
      - Recovery: select different lot of same material
      - System suggests: oldest approved lot (FIFO)
    - ❌ Lot quantity insufficient:
      - Recovery: split across lots
      - Operator scans first lot for partial qty
      - Then second lot for remainder
      - System tracks split-lot consumption
    - ❌ Lot expired:
      - 🔒 BLOCK
      - Mandatory: select different lot
      - Auto-create LotHold for expired lot (re-evaluation)
    - ❌ Lot wrong material:
      - Error: "Materiale errato. Atteso PA12, scansionato {actual}"
      - Recovery: rescan correct lot
      - 3 wrong attempts → escalate to supervisor

  **Material 2: EVOH** (qty needed: 1.2 kg)
  - Same sequence as PA12...
  
  **Material 3: PA12 + cariche** (qty needed: 7.3 kg)
  - Same sequence...
  
  **Material 4: Raccordi A** (qty needed: 100 pcs)
  - Slight variation: discrete count instead of weight
  - Operator can scan single piece or box
  
  **Material 5: Raccordi B** (qty needed: 100 pcs)
  - Same as Raccordi A

#### Step 4.2.3 — BOM verification complete
- **System action**: All materials verified
- **State change**: WO status from `released` → `setup_in_progress`
- **Notifications**: Setup team starts

### 4.3 Tooling Check (Rule #3)

#### Step 4.3.1 — Required tooling list
- For tube 12mm production:
  - Testa di co-estrusione 3 strati (TOOL-HEAD-12-3L-001)
  - Calibratore 12mm (TOOL-CAL-12-001)
  - Mors crimpatura 12mm (TOOL-CRIMP-12-001)

#### Step 4.3.2 — For each tool: scan and verify
  
  **Tool 1: Testa co-estrusione**
  - Operator scans tool QR code on storage rack
  - System validates:
    - Tool exists ✅
    - Tool status = `available` ✅
    - Tool wear < 90% lifetime ✅
    - Last calibration valid ✅
  - **Branches**:
    - ✅ All OK:
      - Reserve tool for WO
      - Display: "Testa OK ✓"
    - ❌ Tool in maintenance:
      - Error + ETA
      - Recovery: wait for maintenance / use spare / postpone WO
    - ❌ Tool wear at limit:
      - Warning: "Utensile prossimo a fine vita"
      - Operator confirms understanding
      - Track in WO metadata
      - Replacement scheduled after this WO
    - ❌ Tool wear exceeded (100%+):
      - 🔒 BLOCK use
      - Mandatory: replace tool first
      - Auto-create maintenance order
    - ❌ Calibration expired:
      - 🔒 BLOCK
      - Schedule calibration before use
      - Or use spare tool with valid calibration

#### Step 4.3.3 — Mount tooling on equipment
- **Physical action**: Setup operator mounts tools
- **System interaction**:
  - Step: "Tool mounted"
  - Operator confirms via HMI button
  - Photo optional (for audit)
- **Branches**:
  - ✅ Confirmed → proceed
  - ⚠️ Difficulty in mounting (e.g., misalignment):
    - Operator can pause and call supervisor
    - Diagnostic flow

### 4.4 Device Verify & Recipe Load (Rule #4)

#### Step 4.4.1 — Power on equipment
- **Devices to start**:
  - DEV-EXT-001 (extruder)
  - DEV-COOL-001 (cooling bath)
  - DEV-PULL-001 (caterpillar)
  - DEV-CUT-001 (saw)
  - DEV-LASER-001 (marker)
  - DEV-LEAK-001 (leak tester)
- **For each device**:
  - Operator presses power on
  - System monitors device status
  - Check: device responding ✓ / sensors operational ✓
- **Branches**:
  - ✅ Device starts normally → proceed
  - ❌ Device doesn't respond:
    - Diagnostic: check power, network, controller
    - Recovery flow:
      - Try restart
      - Check fuse/breaker
      - Call maintenance if persistent
    - ATTEMPTS: 3 restarts, then maintenance order

#### Step 4.4.2 — Recipe selection per device
- **Action**: System auto-loads correct recipe based on item being produced
- **Recipe RCP-EXT-PA12-12-001 v3** for extruder:
  - System sends recipe parameters via REST API to extruder controller
  - Wait for confirmation of recipe loaded
  - Validate: parameter values match expected (sanity check)
- **Branches**:
  - ✅ Recipe loaded → proceed
  - ❌ Recipe rejected by device:
    - Error: device parameters out of physical range
    - Likely cause: device in unexpected state
    - Recovery: device reset, retry recipe load
  - ❌ Recipe missing parameter:
    - Block: incomplete recipe
    - Process Engineer must fix recipe

#### Step 4.4.3 — Equipment warm-up
- **For extruder DEV-EXT-001**:
  - Recipe defines temperatures: 240/245/250/255/260°C
  - Heat-up time: 15-30 minutes typically
  - System monitors temperature climb
- **HMI display**: Real-time temperature chart
- **Branches**:
  - ✅ Target reached within tolerance (±5°C):
    - Auto-progress to next step
    - Log warm-up time for KPI
  - ⚠️ Slow warm-up (taking > 35 min):
    - Warning: "Riscaldamento più lento del normale"
    - Possible cause: ambient cold, insulation issue
    - Continue but flag for review
  - ❌ Cannot reach target:
    - After 60 min, alarm triggered
    - 🔒 BLOCK production start
    - Maintenance order auto-created
    - Possible causes: heater element fault, controller issue, ambient

### 4.5 First Piece Approval (Rule #5)

#### Step 4.5.1 — Run extruder transitorio
- **Action**: Start extrusion for 5 minutes (transitorio = stabilization period)
- **HMI**: Timer countdown, transitorio waste tracking
- **System action**: First few meters of tube marked as "scrap" automatically (transitorio)
- **Branches**:
  - ✅ Stabilization OK → proceed
  - ⚠️ Stable but with minor irregularities:
    - Operator notes
    - Continue with reduced confidence
  - ❌ Cannot stabilize:
    - Recovery: adjust parameters slightly
    - Or restart extruder
    - Or call Process Engineer

#### Step 4.5.2 — Cut first piece
- **Action**: Cut first stable tube (after transitorio)
- **System**: Generate first serial number (SN-2026-0142-001)
- **Mark**: `isFirstArticle: true`

#### Step 4.5.3 — Visual inspection FA piece
- **Operator checklist**:
  - [ ] No bubbles in tube wall
  - [ ] Uniform color
  - [ ] Smooth surface (no rough patches)
  - [ ] Marking visible and correct
  - [ ] No oval deformation
- **Branches**:
  - ✅ All visual OK → proceed to 4.5.4
  - ❌ Defects found:
    - Photo mandatory of each defect
    - Categorize: bubbles / oval / surface / marking
    - Process Engineer notification
    - Investigation flow:
      - Bubbles → check material drying
      - Oval → check calibrator alignment
      - Surface → check cooling temperature
      - Marking → check laser alignment
    - Restart with corrections
    - Generate new first piece

#### Step 4.5.4 — Dimensional measurement
- **Operator measurements** (manual with calipers + digital):
  - External diameter (multiple points)
  - Wall thickness (cut sample)
  - Length precision
- **Tolerance check**: ±0.1mm for diameter
- **Branches**:
  - ✅ Within tolerance → proceed
  - ⚠️ At tolerance limit (e.g., 12.09mm):
    - Pass but flag for ongoing monitoring
  - ❌ Out of tolerance:
    - Investigate calibrator
    - Restart first piece flow
    - 3 retries max before Process Engineer involvement

#### Step 4.5.5 — Test crimping (sample)
- **Action**: Crimp raccordi on first piece
- **Recipe RCP-CRIMP-12-001** loaded
- **Force monitoring**: 25 kN ± 1 kN target
- **Branches**:
  - ✅ Crimp successful → proceed
  - ❌ Crimp force out of range:
    - Adjust crimp tool
    - Test again

#### Step 4.5.6 — Leak test FA piece
- **Recipe RCP-LEAK-PNE-12-001 v2**
- **Pressure 6 bar, 30 sec hold**
- **Branches**:
  - ✅ Leak rate < 0.5 mbar/min: PASS → proceed
  - ⚠️ 0.5-1.0 mbar/min: marginal, retry
  - ❌ > 1.0 mbar/min: FAIL
    - Investigate seal, fixture, fitting installation
    - Iterate until stable pass

#### Step 4.5.7 — FAI documentation
- **System action**: Compile FAI report with:
  - Visual inspection notes
  - Dimensional measurements
  - Test results
  - Photos
  - Operator + Quality manager signatures
- **PDF generation**: PPAP-compliant template

#### Step 4.5.8 — Quality manager approval
- **Action**: Quality manager reviews FAI report on screen
- **Decision**:
  - ✅ APPROVED:
    - WO `productionBlocked` = false
    - Production unblocked
    - HMI removes "FAI in progress" banner
    - First piece marked as "production sample" (not in main count)
  - ❌ REJECTED:
    - WO stays blocked
    - Reason mandatory
    - Process correction flow:
      - Recipe adjustment
      - Tool inspection
      - Material lot change
      - Operator retraining
    - New first piece required after correction

### 4.6 Setup phase completion

- **Output**: All systems ready, FAI approved
- **WO transitions**: `setup_in_progress` → `in_progress`
- **Hand-off**: To production operator
- **Time logged**: Total setup duration for KPI

---

## 5. PHASE 3 — PRODUCTION: Estrusione (Detailed)

**Objective**: Continuous extrusion of multi-layer tube
**Duration**: ~2 hours for 100 pieces
**Production mode**: continuous
**Operator**: Luigi Bianchi (EXT skill)

### 5.1 Material loading

#### Step 5.1.1 — Load PA12 hopper
- **Action**: Operator transfers PA12 granules to extruder hopper
- **HMI**: Display target weight (8.5 kg)
- **Operator action**: Scan lot before each transfer
- **Branches**:
  - ✅ Correct lot scanned → load
  - ❌ Wrong lot scanned:
    - Error
    - Recovery: scan correct lot
  - ⚠️ Lot quantity insufficient mid-run:
    - System warns: "Materiale insufficiente per completare WO"
    - Reservation auto-allocates next lot in FIFO
    - Operator scans new lot when consumed

#### Step 5.1.2 — Load EVOH hopper
- Similar sequence
- Smaller hopper (1.2 kg)

#### Step 5.1.3 — Load PA12+cariche hopper
- Similar sequence

#### Step 5.1.4 — Verify hopper levels
- **System check**: All 3 hoppers fed
- **Sensor reading**: Material level above minimum
- **Branches**:
  - ✅ All OK → proceed
  - ❌ Hopper sensor fault:
    - Visual confirmation by operator
    - Maintenance order created
  - ⚠️ Material level low (refill alert):
    - Reminder during run
    - Alert when 30% remaining

### 5.2 Extrusion start

#### Step 5.2.1 — Verify drying status
- **PA12 must be < 0.1% moisture**
- **System check**: Reading from drier sensor
- **Branches**:
  - ✅ Moisture in spec → proceed
  - ❌ Moisture out of spec:
    - 🔒 BLOCK extrusion start
    - Cannot proceed: bubble defects guaranteed
    - Recovery: extend drying time or use different material lot
    - Document delay

#### Step 5.2.2 — Start extruder
- **Action**: Operator presses START on extruder HMI
- **System action**:
  - Sends start command to DEV-EXT-001
  - Begins continuous logging (every 5 min)
  - Generates `ContinuousProductionRun` entity
  - Status: `running`
- **Real-time monitoring**:
  - Temperature (5 zones)
  - Pressure
  - Screw speed
  - Pull speed
  - Material consumption rate
- **Branches**:
  - ✅ Smooth start → proceed
  - ❌ Pressure spike on start:
    - Common at startup
    - Self-corrects within 30 sec
    - Monitor: if persists > 60 sec, alarm
  - ❌ Motor overload:
    - Auto-stop
    - Investigation: cold start, blockage, wrong recipe
    - Recovery: warm-up more, clean filter

### 5.3 Continuous extrusion

#### Step 5.3.1 — Steady-state operation
- **Duration**: ~2 hours for 100 pieces
- **Speed**: 15 m/min, so 200m of tube needed
- **Continuous monitoring**: Every 5 min auto-log:
  - Temperatures
  - Pressure
  - Output rate (m/min)
  - Layer thickness (ultrasonic inline)
  - Diameter (laser scanner)

#### Step 5.3.2 — Inline measurements
- **Laser scanner DEV-MEAS-001**: 100 Hz reading
- **Auto-correction**: If diameter drift detected:
  - Adjust pull speed
  - Adjust screw speed
- **Branches**:
  - ✅ All within spec → continue
  - ⚠️ Drift but auto-corrected:
    - Log adjustment
    - Continue
  - ❌ Drift cannot be corrected:
    - Pause extrusion
    - Manual intervention
    - Possible causes: tool wear, calibrator issue, material variation
  - ❌ Major dimensional defect:
    - Auto-mark waste section with paint spray
    - Continue
    - Section will be cut and scrapped

#### Step 5.3.3 — Marking inline
- **DEV-LASER-001**: Continuous laser marking
- **Content**: `REFLEXALLEN | REF12X2-PA12 | LOT 260415-001 | 26/04/26`
- **Verification**: OCR reader downstream
- **Branches**:
  - ✅ Marking OK → continue
  - ❌ Marking missing/illegible:
    - Camera detects → auto-flag section
    - Pause OR continue with manual rework
    - Possible causes: laser power low, dirty lens, wrong settings

### 5.4 Cut to length

#### Step 5.4.1 — Length measurement
- **DEV-MEAS-001 encoder**: tracks linear distance
- **Target**: 2000 mm ± 5 mm
- **Trigger**: When 2000mm passed under saw

#### Step 5.4.2 — Cut execution
- **DEV-CUT-001 (flying saw)**: Moves with tube during cut
- **Cut time**: ~0.5 sec
- **System generates**: New ProductionRecord per cut
- **Multi-output cycle type**: variable (1 extrusion run = N cuts)
- **Branches**:
  - ✅ Clean cut → tube falls into bin
  - ❌ Saw blade dull (force feedback):
    - Maintenance alert
    - Continue but tracked
    - Replacement scheduled
  - ❌ Saw misalignment:
    - 🔒 STOP saw
    - Investigation
    - Possible: vibration, tool wear

#### Step 5.4.3 — Sbavatura (deburring)
- **Action**: Auto-deburr (or manual depending on equipment)
- **Quality**: No burrs internal/external
- **Branches**:
  - ✅ Clean edges → continue
  - ❌ Burrs detected:
    - Manual rework
    - Or scrap if unrecoverable

### 5.5 Sample taking (every 50 pieces)

#### Step 5.5.1 — Periodic sample trigger
- **System auto-trigger**: Every 50 cuts produced
- **Action**: Operator removes 1 piece for testing
- **System**: Decrement production count, increment sample count
- **Sample creates**: Entry in Sample registry, status `pending_test`

### 5.6 WIP management

#### Step 5.6.1 — Container filling
- **WIP container**: WIP-EXT-001 (50 pieces capacity)
- **System**: Track current count
- **When full**: Forklift moves to assembly area
- **Replacement container**: Auto-stage next empty bin

### 5.7 Phase completion

- **Trigger**: 100 pieces produced (target)
- **System action**: Stop extruder
- **Post-actions**: Continuous run finalized, telemetry archived
- **Hand-off**: WIP containers ready for assembly phase

---

## 6. PHASE 4 — PRODUCTION: Assemblaggio (Detailed)

**Objective**: Insert raccordi and crimp on each tube
**Duration**: ~50 min for 100 pieces (~30 sec per piece)
**Production mode**: discrete (1 cycle = 1 piece)
**Operator**: Mario Rossi (ASSY skill)

### 6.1 Per-piece cycle

#### Step 6.1.1 — Pick tube from WIP
- **Action**: Operator picks tube from WIP-EXT-001
- **System action**: Decrement WIP container count
- **Branches**:
  - ✅ Tube available → proceed
  - ❌ WIP empty:
    - Wait for next batch from extrusion
    - Or pause assembly

#### Step 6.1.2 — Scan tube serial
- **Action**: Scan QR/barcode on tube
- **System validation**:
  - Format: `^SN-\d{4}-\d{4}-\d{3}$`
  - Tube exists in registry
  - Status: ready for assembly
- **Branches**:
  - ✅ Recognized → proceed
  - ❌ Scan fail (3 attempts):
    - Manual entry option
    - Mandatory comment

#### Step 6.1.3 — Visual check end A
- **Operator inspects** raccordo-side end A
- **Checklist**:
  - [ ] No oval deformation
  - [ ] Clean cut (no burrs)
  - [ ] No surface damage
- **Branches**:
  - ✅ OK → proceed to 6.1.4
  - ❌ Defect:
    - Photo mandatory
    - Decision tree:
      - Minor (sbavatura) → can be reworked manually
      - Major (deformation) → scrap entire tube
    - Cause code mandatory if scrap

#### Step 6.1.4 — Pre-treatment end A
- **Sub-steps**:
  - 6.1.4.a Svasatura interna (chamfering) with tool
  - 6.1.4.b Pulizia con isopropanolo
  - 6.1.4.c Verifica visiva pulizia
- **Branches**:
  - ✅ All OK → proceed
  - ❌ Contamination resistant to cleaning:
    - Discard tube end (cut shorter and re-do)
    - Or scrap entire tube

#### Step 6.1.5 — Insert raccordo A
- **Action**: Push raccordo into tube manually
- **Force feedback**: Operator feels resistance to "battuta" (full insertion)
- **Visual confirmation**: Raccordo seated to mark line
- **Branches**:
  - ✅ Inserted to "battuta" → proceed
  - ❌ Resistance unusual (too easy or stuck):
    - Too easy: tube oversized → check dimensional
    - Too hard: tube undersized → check dimensional
    - Recovery: scrap tube if dimensional out of range
  - ❌ Raccordo rejected by tube end:
    - Re-clean
    - Re-chamfer
    - Try different raccordo (lot variation possibility)
    - 3 retries before scrap

#### Step 6.1.6 — Crimp end A
- **Recipe**: RCP-CRIMP-12-001
- **Cycle**: 8 sec
- **Force target**: 25.0 ± 1.0 kN
- **System monitors**: Force profile (curve)
- **Branches**:
  - ✅ Force in range, profile OK → proceed
  - ⚠️ Force at limit (24.0 or 26.0 kN):
    - Marginal pass
    - Track for trends (if frequent: investigate)
  - ❌ Force out of range:
    - 🔒 STOP crimp
    - Possible causes:
      - Tool wear (mors)
      - Tube wall thickness variation
      - Raccordo dimensional variation
    - Recovery:
      - Inspect crimp tool
      - Verify tube + raccordo dimensions
      - Re-attempt
    - 3 failures → scrap tube
  - ❌ Crimp profile irregular:
    - Possible: power fluctuation, mechanical issue
    - Re-do crimp on same tube (fresh raccordo)

#### Step 6.1.7 — Visual check crimp end A
- **Operator inspects**:
  - [ ] Crimp dimension correct (visual)
  - [ ] No raccordo damage
  - [ ] Tube intact at crimp area (no splits)
- **Branches**:
  - ✅ OK → proceed
  - ❌ Visible defect:
    - Photo
    - Scrap tube (cannot be reworked)

#### Step 6.1.8 — End B (repeat 6.1.4 - 6.1.7 for end B)
- Same procedure mirrored

#### Step 6.1.9 — Final visual check
- **Whole tube inspection**:
  - [ ] Both raccordi correctly oriented
  - [ ] No visible damage
  - [ ] Marking still legible
- **Branches**:
  - ✅ OK → proceed to test phase
  - ❌ Issue:
    - Recovery analysis
    - Scrap or rework as appropriate

#### Step 6.1.10 — Move to leak test station
- **Action**: Place in tray for leak test
- **WIP container**: WIP-ASSY-001
- **System update**: Tube status `assembled`, ready for test

### 6.2 Phase completion

- **Trigger**: All 100 pieces assembled
- **Hand-off**: Tubes ready for QC phase

---

## 7. PHASE 5 — QC: Leak Test (Detailed with Parallel)

**Objective**: 100% leak test on each tube
**Duration**: ~50 sec per piece + parallel work
**Production mode**: discrete
**Operator**: Anna Verdi (QC, TEST skills)

### 7.1 Per-piece cycle (with parallel steps)

#### Pre-steps (sequential, before device)

#### Step 7.1.1 — Position tube on fixture
- **Manual time**: 8 sec
- **Action**: Operator places tube horizontally in fixture
- **Branches**:
  - ✅ Position OK → proceed
  - ❌ Tube doesn't fit:
    - Possible: oversized tube
    - Recovery: re-measure, scrap if confirmed

#### Step 7.1.2 — Connect pneumatic hoses
- **Manual time**: 10 sec
- **Action**: Connect leak tester to both raccordi
- **Branches**:
  - ✅ Connected → proceed
  - ❌ Hose loose:
    - Re-attach
    - Verify seal

#### Device main step

#### Step 7.1.3 — Run leak test cycle
- **Recipe**: RCP-LEAK-PNE-12-001 v2
- **Device cycle time**: 45 sec
- **Phases**:
  - 7.1.3.a Pressurize to 6.0 bar (5 sec)
  - 7.1.3.b Stabilize (5 sec)
  - 7.1.3.c Hold and measure (30 sec)
  - 7.1.3.d Result calculation
  - 7.1.3.e Depressurize (5 sec)

#### Parallel steps (during 45 sec device cycle)

#### Step 7.1.4 [PARALLEL] — Apply label on previous tube
- **Time**: 12 sec
- **Part reference**: `previous`
- **Action**: Operator labels the previous tube (which already passed test)

#### Step 7.1.5 [PARALLEL] — Prepare next tube
- **Time**: 20 sec
- **Part reference**: `next`
- **Action**: Pick next tube, position for after this one

#### Step 7.1.6 [PARALLEL] — Fill QC checklist for previous
- **Time**: 10 sec
- **Part reference**: `previous`
- **Action**: Tablet entry: visual check, marking verified, etc.

#### Post-steps (sequential, after device)

#### Step 7.1.7 — Read leak result
- **Manual time**: 3 sec
- **Display**: System shows leak rate (mbar/min) and PASS/FAIL
- **Branches**:
  - ✅ PASS (leak rate < 0.5):
    - Tube qty++ produced
    - Move to step 7.1.8 (disconnect)
  - ⚠️ MARGINAL (0.5-1.0):
    - Operator decision: re-test (likely fixture issue) or accept with QC manager approval
  - ❌ FAIL (> 1.0):
    - Trigger Recovery Flow (see 7.2)

#### Step 7.1.8 — Disconnect hoses
- **Manual time**: 5 sec

#### Step 7.1.9 — Remove tube from fixture
- **Manual time**: 3 sec
- **Action**: Place in passed-tubes tray

### 7.2 Recovery Flow on FAIL

#### Stage 1 — Diagnosis

**Step 7.2.1 — Operator selects fault code**
- **HMI dropdown**:
  - "Hose connection loose"
  - "Sealing surface contaminated"
  - "Real defect (porosity)"
  - "Crimp leak"
  - "Other (specify)"

**Step 7.2.2 — Suggested action per fault**
- Hose loose → re-tighten and re-test
- Contamination → clean fixture and retest
- Real defect → likely scrap, but verify with second test
- Crimp leak → likely scrap, cannot rework
- Other → manual decision

#### Stage 2 — First recovery attempt

**Step 7.2.3 — Apply correction**
- Per fault code suggestion
- Operator confirms action taken

**Step 7.2.4 — Re-test (same recipe)**
- Branches:
  - ✅ PASS now: tube counts as `qtyRework` (not standard `qtyProduced`), continues
  - ❌ FAIL again: proceed to Stage 3

#### Stage 3 — Second recovery attempt

**Step 7.2.5 — Different correction**
- Try alternative fix
- E.g., if hose was suspected, now try cleaning fixture

**Step 7.2.6 — Re-test**
- Branches:
  - ✅ PASS: counts as rework
  - ❌ FAIL: proceed to Stage 4

#### Stage 4 — Final decision

**Step 7.2.7 — Outcome**
- After 3 attempts total (1 original + 2 recovery)
- Outcome:
  - 🔒 SCRAP automatically
  - Cause code mandatory: typically `material_defect` or `process_error`
  - Compensation: `qtyRemaining` increments by 1
  - Photo of defective tube
  - Notification to QC supervisor for trend analysis

### 7.3 Phase completion

- **Trigger**: All 100 pieces tested (some passed, some scrapped)
- **System tally**:
  - qtyProduced: 97 (e.g.)
  - qtyRework: 1 (recovered)
  - qtyScrap: 2
  - qtyRemaining: 5 (3 scrapped + 2 needed extra to reach 100)
- **Hand-off**: Tubes ready for marking and packaging

---

## 8. PHASE 6, 7, 8 — Marcatura, Imballaggio, Stoccaggio (Outbound)

For brevity, see WORKFLOW_PNEUMATIC_AIR.md (high-level). Detail patterns follow same approach:
- Step-by-step granular operations
- Branching for each decision point
- Recovery flows for errors
- Quality checkpoints

Key branching points:

**Phase 6 (Marcatura)**:
- Label print fail → retry → backup printer
- Label illegible after print → reprint

**Phase 7 (Packaging)**:
- Box capacity check before each pack (HARD weight, WARNING units)
- If box damaged on visual: select different box
- Seal generation: must have `requiresSeal=true` on BoxType

**Phase 8 (Stoccaggio)**:
- Storage location occupied → suggest alternate
- WMS down → manual fallback procedure

---

## 9. PHASE 9 — TEARDOWN (Auto-Generated)

**Objective**: Cleanup, recipe unload, documentation
**Duration**: ~30 min
**Operators**: Setup team (cleanup roles)

### 9.1 Device Reset

#### Step 9.1.1 — Unload extruder recipe
- System sends "unload recipe" command
- Device returns to neutral state
- Branches:
  - ✅ Confirmed → proceed
  - ❌ Device unresponsive: maintenance check needed

#### Step 9.1.2 — Purge polimero
- Run extruder with purge material (clear/transparent)
- Monitor for color change to clean
- Branches:
  - ✅ Purge complete → proceed
  - ❌ Purge incomplete after expected time:
    - Continue purging
    - Or schedule deep cleaning
    - Investigate residual material in barrel

#### Step 9.1.3 — Cool down
- Drop temperatures to standby (60°C)
- Wait time: 30-45 min
- Done in parallel with documentation

### 9.2 Cleanup

#### Step 9.2.1 — Clean stations
- Extruder area
- Assembly bench
- Test station (especially fixtures)
- Packaging area
- Visual: no debris, no spilled material

### 9.3 Documentation

#### Step 9.3.1 — Generate batch record
- System auto-compiles:
  - All process parameters logged
  - Test results
  - Sample test outcomes
  - FAI report
  - Deviations / non-conformances
- PDF generated, signed digitally by operators + QC manager

#### Step 9.3.2 — Archive
- Lot data archived (15 years for automotive)
- Genealogy preserved
- Production KPIs computed

#### Step 9.3.3 — Generate KPI summary
- OEE for this WO
- FPY, scrap rate
- Cycle time analysis
- Trends vs prior WOs

### 9.4 Tool return

#### Step 9.4.1 — Inspect tools
- Visual check for wear/damage
- Photo if any concern

#### Step 9.4.2 — Update tool wear
- Cycles count auto-incremented during production
- Manual condition score update if needed

#### Step 9.4.3 — Return to magazine
- Scan tool location
- Confirm location

### 9.5 WO closure

- Status: `in_progress` → `completed`
- Final tally locked
- Notifications to: planner, customer service, billing
- Box returnable tracked separately for shipment

---

## 10. Cross-cutting concerns

### 10.1 Real-time error handling

Throughout all phases, common error patterns:

**Communication failure (HMI ↔ backend)**:
- Detect within 5 sec
- Show offline banner
- Cache operations locally
- Sync when restored
- ATTEMPTS to reconnect: 30 sec intervals

**Device offline**:
- Detect device heartbeat lost
- Block dependent steps
- Auto-create maintenance order if persistent
- Suggest backup device if available

**Database transient errors**:
- Retry transaction (3 times with exponential backoff)
- If persistent: surface error to operator
- Escalate to admin

### 10.2 Audit trail

Every significant action logged:
- Who (user)
- What (action + entity)
- When (timestamp)
- Where (workstation, plant)
- Why (reason if applicable)
- Before/After (data state)

Retention: 15+ years for automotive.

### 10.3 Genealogy

Each piece traceable:
- Forward: from raw materials → finished good
- Backward: from finished good → raw materials
- Includes: lot numbers, operators involved, equipment used, parameters at each step, test results

---

## 11. Cross-references

- High-level workflow: `extensions/WORKFLOW_PNEUMATIC_AIR.md`
- Industrial operations: `extensions/INDUSTRIAL_OPERATIONS.md`
- Equipment management: `extensions/EQUIPMENT_MANAGEMENT.md`
- Functional inventory: `extensions/FUNCTIONAL_INVENTORY.md`

---

## 12. Change Log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-27 | Initial detailed workflow with branching logic |

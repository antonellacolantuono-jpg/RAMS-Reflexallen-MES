# WORKFLOW_SAFETY_DEVICES_DETAILED — Extension v1.0

> **Type**: Detailed Workflow Reference (Reflexallen Safety Devices line)
> **Parent**: `extensions/WORKFLOW_SAFETY_DEVICES.md` (high-level)
> **Status**: Detailed reference for build seed + training + audit
> **Last updated**: 2026-04-27

---

## 1. Purpose

Step-by-step granular detail for ECE-R104 retroreflective panels production with all branching logic.

**Reference product**: Pannello posteriore camion ECE-R104 yellow/red (ITM-FG-RFA-SAFE-001)

**Critical aspects unique to Safety Devices**:
- Continuous high-volume printing (vs CFRP one-piece)
- Optical compliance testing (reflectance, color) per ECE-R104 standard
- Homologation certificate management
- Aging tests (long-running, weeks)

---

## 2. PHASE 1 — INBOUND: Reflective Materials (Detailed)

### 2.1 Roll reception

#### Step 2.1.1 — Truck arrival (climate-controlled)
- **Critical**: Pellicole sensitive to UV and heat
- **Verification**: Truck condition during transport
- **Branches**:
  - ✅ Climate-controlled OK → proceed
  - ❌ Heat exposure documented:
    - Quarantine for testing
    - May affect adhesion or reflectance

#### Step 2.1.2 — Visual inspection
- **Checklist**:
  - [ ] Roll wrapping intact
  - [ ] No water damage
  - [ ] Roll standing vertical (not pressed)
  - [ ] Anti-static layer present
- **Branches**:
  - ✅ All OK → proceed
  - ❌ Water damage: quarantine (possible adhesive degradation)
  - ❌ Crushed roll: possible film damage, inspection required

#### Step 2.1.3 — Scan and register
- **Format**: `^FILM-[A-Z]+-\d+-\d+$`
- **System validates**:
  - Material code matches order
  - Color code matches request
  - Manufacture date in CoA range
- **Branches**:
  - ✅ Recognized → register `ReflectiveFilmRoll`
  - ❌ Wrong type/color:
    - Quarantine
    - Procurement decision

#### Step 2.1.4 — CoA verification (CRITICAL for ECE-R104)
- **Required CoA fields**:
  - Lot number
  - Manufacture date
  - Nominal reflectance values (per color, per geometry)
  - Color coordinates (CIE-Lab)
  - Thickness
  - Adhesion specification
  - Shelf life
- **Branches**:
  - ✅ Complete CoA → register
  - ❌ Missing reflectance values:
    - 🔒 BLOCK
    - Cannot use without proven specs
    - Contact supplier for missing data
  - ❌ Reflectance below ECE-R104 minimum:
    - Reject lot
    - Cannot produce ECE-R104 compliant products

### 2.2 Storage

#### Step 2.2.1 — Move to climate-controlled magazzino
- **Conditions**: 20°C ± 5°C, 50% RH ± 10%
- **Avoid**: UV exposure, vibrations
- **Time**: < 1 hour from receiving to storage

#### Step 2.2.2 — FIFO placement
- **System recommends**: Position based on FIFO (first in, first out)
- **Operator places** roll
- **Confirm location**

---

## 3. PHASE 2 — Pre-Production Setup (Detailed)

### 3.1 Skills check

#### Step 3.1.1 — Verify required operators
- **For this workflow**:
  - PRINT (Marco)
  - LAMINATE (Luca)
  - DIECUT (Anna)
  - QC_OPTICAL (Sara)
  - PRINT_PAD (Paolo for marking)
- **Branches**: Same pattern as Pneumatic Air

### 3.2 Homologation certificate verification (CRITICAL)

#### Step 3.2.1 — Find active certificate for item
- **System query**: `HomologationCertificate` for ITM-FG-RFA-SAFE-001
- **Must find**: At least 1 cert with `status: valid`
- **Branches**:
  - ✅ Active cert found:
    - Display: `ECE-104R-001234-2026`
    - Validity: until 2027-03-15
    - Days remaining: 322 days
    - Lock cert reference for this WO
  - ⚠️ Cert status `expiring_soon` (< 90 days):
    - Warning to operator + supervisor
    - May proceed but plan for renewal
    - Notification to Quality Manager
  - ❌ Cert `expired`:
    - 🔒 ABSOLUTE BLOCK
    - Cannot produce ECE-R104 marked products
    - Recovery: 
      - Verify if renewed (database sync issue)
      - Contact homologation authority
      - Postpone WO until valid cert
  - ❌ No cert found:
    - 🔒 BLOCK
    - Item not yet certified
    - Cannot produce

#### Step 3.2.2 — Verify cert covers this configuration
- **Check**: Color matches (yellow + red)
- **Check**: Film type matches (diamond_grade)
- **Check**: Item code matches
- **Branches**:
  - ✅ All match → proceed
  - ❌ Mismatch:
    - Cannot use this cert
    - Find alternative cert or postpone

### 3.3 Tooling setup

#### Step 3.3.1 — Verify retini (screens)
- **Two retini needed**: Yellow + Red
- **System check**:
  - Retini exist
  - Status: available
  - Wear cycles within limits
- **Branches**:
  - ✅ Both available → proceed
  - ❌ Retino worn out:
    - Replace before WO
    - Or use spare retino (with adjusted parameters)
  - ❌ Retino damaged:
    - Cannot use
    - Replacement required

#### Step 3.3.2 — Verify fustella (die-cutting tool)
- **Action**: Locate and verify
- **System check**: Fustella `FUST-PNL-565x180`
- **Branches**:
  - ✅ Available → proceed
  - ❌ Fustella in maintenance: postpone WO

#### Step 3.3.3 — Calibrazione retroriflettometro
- **Critical**: Instrument must have valid calibration
- **System check**: Last calibration date
- **Branches**:
  - ✅ Valid (< 12 months ago) → proceed
  - ❌ Expired:
    - 🔒 BLOCK QC phase
    - Schedule calibration before WO continues
    - Or use backup instrument

### 3.4 Device setup

#### Step 3.4.1 — Power on serigrafica multi-stazione
- **Device**: DEV-SCREEN-001
- **Stations**: 4 (yellow, UV, red, UV)
- **Warm-up**: 15 min UV lamps
- **Branches**: Standard error handling

#### Step 3.4.2 — Mount retini
- **Manual physical action**: Operator mounts yellow retino on station 1
- **Mount red retino on station 3**
- **Alignment**: Sub-millimeter precision
- **Test print**: Dummy substrate for alignment verification
- **Branches**:
  - ✅ Aligned → proceed
  - ❌ Misalignment:
    - Adjust retino position
    - Re-test
    - 3 retries before maintenance

#### Step 3.4.3 — Power on laminator + die-cutter
- **Standard startup**: Confirm responding

#### Step 3.4.4 — Calibrate water-jet (if used)
- **For curve cuts**: Water-jet alternative to fustella

### 3.5 First piece (FAI)

#### Step 3.5.1 — Run complete first piece
- Through print → cure → laminate → cut

#### Step 3.5.2 — FAI tests
- **Visual**: Print quality, alignment yellow/red
- **Reflectance**: Sample test
- **Colorimetry**: Color match to standard
- **Adhesion**: Cross-cut test
- **Marking**: Verify ECE marking applied correctly
- **Branches**:
  - ✅ All pass → quality manager approval
  - ❌ Any fail → investigation + correction

---

## 4. PHASE 3 — Continuous Screen Printing (Detailed)

### 4.1 Print run setup

#### Step 4.1.1 — Load yellow ink
- **Ink reservoir**: Station 1
- **Volume**: Sufficient for run + buffer
- **Verify**: Ink color match (visual + spectrophotometer if precise)
- **Branches**:
  - ✅ Ink loaded → proceed
  - ❌ Wrong ink color:
    - Drain station
    - Reload correct color

#### Step 4.1.2 — Load red ink
- Same procedure

#### Step 4.1.3 — Load substrate roll
- **Pellicola yellow + red mix substrate**: depends on workflow design
- **For this product**: Multi-color print on single film
- **Branches**:
  - ✅ Loaded with correct tension → proceed
  - ❌ Tension wrong: adjust before start

### 4.2 Print run execution

#### Step 4.2.1 — Start press
- **System action**: Send recipe to controller
- **Begin continuous run**
- **Speed**: 2000 pcs/h target

#### Step 4.2.2 — Continuous monitoring
- **Every 5 min**: System logs:
  - Speed (m/min)
  - Ink consumption
  - UV intensity reading
  - Web tension
- **Operator visual checks**: Every 50 pieces
  - Color saturation
  - Yellow/red alignment (registration)
  - No streaks or smudges

#### Step 4.2.3 — Common issues during print
- **Color drift** (color subtly changing):
  - Possible: ink running low (< 30%)
  - Recovery: pause press, refill ink
  - System auto-alerts at 30% remaining
- **Misregistration** (yellow/red not aligned):
  - Recovery: stop press, recalibrate
  - Continuous fix not possible
- **Streaks**:
  - Recovery: clean retino (squeegee blade)
  - Or replace retino if wear-related
- **UV not curing** (sticky output):
  - Possible: UV lamp degraded
  - Stop press
  - Replace UV lamp
- **Web tension issue**:
  - Substrate tearing or wrinkling
  - Stop, adjust tension
  - Restart

#### Step 4.2.4 — Periodic sample taking
- **Every 100 pieces**: Sample for QC
- **System decrements production count**
- **Sample status**: `pending_test`

### 4.3 Print run completion

#### Step 4.3.1 — Stop press at target quantity
- **Operator confirms**: 500 pieces (target + 5% buffer)
- **System stops device**: Recipe unload pending

#### Step 4.3.2 — Wind take-up reel
- **Final reel**: Labeled with WO + lot

#### Step 4.3.3 — Move to laminazione
- **Logistics**: Transport to next station

---

## 5. PHASE 4 — Lamination (Detailed)

### 5.1 Substrate preparation

#### Step 5.1.1 — Load alluminio coil
- **System verification**: Lot match (BOM check)
- **Operator**: Mount on laminator (input)

#### Step 5.1.2 — Substrate cleaning
- **Critical**: Adhesion depends on clean surface
- **Method**: Alcol isopropilico wipe
- **Branches**:
  - ✅ Clean → proceed
  - ❌ Contamination resistant: need stronger cleaner or replace coil

#### Step 5.1.3 — Apply primer (if required)
- **Some films require primer for adhesion**
- **Per BOM specification**

### 5.2 Lamination run

#### Step 5.2.1 — Mount printed roll
- **Position above laminator** (input from above)

#### Step 5.2.2 — Connect rolls and start
- **System sends recipe**: Temperature, pressure, speed
- **Continuous run**: ~50 min for 500 pieces

#### Step 5.2.3 — Monitor lamination
- **Visual**: No bubbles forming
- **Continuous logging**: Pressure, temperature, speed
- **Branches**:
  - ✅ Smooth lamination → proceed
  - ⚠️ Occasional small bubbles:
    - Mark area, may resolve in cure
  - ❌ Persistent bubbles:
    - Stop press
    - Recovery:
      - Check substrate cleanliness
      - Verify primer application
      - Adjust pressure (increase)
      - Restart
  - ❌ Misregistration mid-run:
    - Stop, realign, restart

#### Step 5.2.4 — Wind output
- **Laminated reel**: Now film + alluminio bonded

### 5.3 Adhesion test (sample)

#### Step 5.3.1 — Take sample from end of run
- **Cut**: ~10cm × 10cm sample

#### Step 5.3.2 — Cross-cut test (ASTM D3359)
- **Procedure**:
  1. Make 6×6 grid of cuts (1 mm spacing)
  2. Apply pressure-sensitive adhesive tape
  3. Pull tape off at 90° angle smoothly
  4. Inspect grid

- **Classification**:
  - 5B: 0% removed (ideal)
  - 4B: < 5% removed (acceptable)
  - 3B: 5-15% removed (marginal)
  - 2B: 15-35% (failed)
  - 1B: 35-65% (failed)
  - 0B: > 65% (failed)

- **Branches**:
  - ✅ 5B or 4B: PASS, proceed to die-cutting
  - ⚠️ 3B: marginal
    - Quality manager review
    - May proceed with extra QC at end
  - ❌ < 3B: 🔒 FAIL
    - Cannot proceed
    - Recovery:
      - Investigate substrate (cleanliness, primer)
      - Adjust lamination parameters (pressure, temperature)
      - Re-run laminator on test material
      - If reproducible: process correction needed

#### Step 5.3.3 — Record CrossCutAdhesionTest
- **System action**: Create entity with classification + photo

---

## 6. PHASE 5 — Die-Cutting (Detailed)

### 6.1 Setup

#### Step 6.1.1 — Mount fustella
- **Critical**: Correct fustella for dimensions (565×180mm)
- **System verifies**: Fustella ID matches recipe

#### Step 6.1.2 — Calibrate press
- **Test piece**: Cut on dummy material
- **Verify**: Dimensions correct, edges clean
- **Branches**:
  - ✅ Calibration OK → proceed
  - ❌ Misalignment: adjust fustella position

### 6.2 Cutting run

#### Step 6.2.1 — Load laminated reel
- **Mount on die-cutter** input

#### Step 6.2.2 — Run press
- **Speed**: 1 sec per piece (3600 pcs/h max)
- **Multi-output type**: fixed (1 stroke = 1 piece)
- **System counts**: Each piece tracked
- **Branches**:
  - ✅ Clean cuts → proceed
  - ❌ Burrs or rough edges:
    - Possible: dull fustella
    - Stop press
    - Inspect fustella
    - Replace if worn

#### Step 6.2.3 — Auto-eject pieces
- **System**: Pieces fall into bin
- **Operator**: Periodic visual check

#### Step 6.2.4 — Sgrossatura (manual)
- **Action**: Remove sfridi (waste material)
- **Recycling**: Alluminio scraps to recycling

#### Step 6.2.5 — Stack pieces
- **Use paper interleaving**: Prevent scratching during stacking
- **Group**: 50 per stack typical

---

## 7. PHASE 6 — Quality Control (CRITICAL ECE-R104) (Detailed)

### 7.1 Visual inspection (100%)

#### Step 7.1.1 — Per-piece visual check
- **Operator** examines each piece
- **Checklist**:
  - [ ] Yellow color uniform (no streaks)
  - [ ] Red color uniform
  - [ ] Yellow/red boundary clean
  - [ ] No bubbles in lamination
  - [ ] No surface damage
  - [ ] Edges clean (no burrs)
- **Branches**:
  - ✅ Pass → proceed
  - ❌ Defect found:
    - Categorize (color, lamination, edge)
    - Count: rate of defects matters
    - If isolated: scrap individual piece
    - If pattern (> 5% defective): stop production, investigate process

### 7.2 Reflectance testing (ECE-R104 compliance — CRITICAL)

#### Step 7.2.1 — Sample selection
- **Sampling rate**: 5% of batch (25 pieces from 500)
- **Random selection** within batch

#### Step 7.2.2 — For each sample: reflectance test
- **Equipment**: DEV-RETRO-001 (retroriflettometro Delta RetroSign 4500)
- **Procedure per sample**:
  1. Place sample on instrument
  2. Operator selects color zone (yellow or red)
  3. Multiple measurements (5 points)
  4. System calculates average
- **For yellow zone**:
  - Threshold (ECE-R104): 175 cd/lx/m² minimum at 0.33° / 5°
  - Branches:
    - ✅ Measured ≥ 175: PASS
    - ⚠️ 158-175 (90% of threshold): MARGINAL
      - Quality manager approval required
      - Mandatory comment + photo
    - ❌ < 158: 🔒 FAIL
- **For red zone**:
  - Threshold: 60 cd/lx/m²
  - Same logic

#### Step 7.2.3 — Lot decision based on samples
- **System computes**: Statistics across all samples
- **Decision logic**:
  - All 25 samples PASS → lot APPROVED
  - 1-3 marginal, rest pass → lot CONDITIONAL (QC manager review)
  - Any 1 FAIL → lot HOLD (investigation)
  - Multiple FAIL → lot REJECTED
- **Branches**:
  - ✅ APPROVED → proceed to next QC step
  - ⚠️ CONDITIONAL → quality manager decision tree:
    - Accept with deviation (record in customer documentation)
    - Reject lot
    - Re-test larger sample (e.g., 50 pieces)
  - ❌ REJECTED → 
    - 🔒 BLOCK shipping
    - Investigation: root cause analysis
    - Cannot ship under ECE-R104 marking
    - Possible salvage: re-laminate with new film

### 7.3 Colorimetry testing

#### Step 7.3.1 — Sample test (same samples as reflectance)
- **Equipment**: DEV-COLOR-001 (X-Rite eXact)
- **Procedure**:
  1. Place sample on instrument
  2. Read CIE-Lab values
  3. Compute ΔE vs reference standard

- **Pass criteria** for ΔE:
  - < 1.0: excellent
  - 1.0-3.0: acceptable
  - 3.0-5.0: marginal
  - > 5.0: failed

- **Branches**:
  - ✅ ΔE < 3.0 across samples → PASS
  - ⚠️ Some marginal:
    - Quality manager review
    - Likely accept with deviation
  - ❌ ΔE > 5.0:
    - Color drift unacceptable
    - Investigation needed
    - Possible cause: ink lot variation

### 7.4 Aging test specimens

#### Step 7.4.1 — Reserve aging specimens
- **Quantity**: 2 specimens per lot
- **Selected**: Random samples (representative)

#### Step 7.4.2 — Initial measurements
- **Reflectance**: Initial value recorded
- **Color**: Initial CIE-Lab recorded

#### Step 7.4.3 — Place in QUV chamber
- **Equipment**: DEV-QUV-001
- **Test type**: `quv_uv_exposure`
- **Duration**: 1000 hours (about 6 weeks)
- **System action**:
  - Create `AgingTestSpecimen` entity
  - Status: `in_progress`
  - Schedule periodic checks (every 168 hours / 1 week)

#### Step 7.4.4 — Periodic checks (long-running, async)
- **Cron job triggers**: Every week
- **For each specimen in QUV**:
  1. Notify QC operator
  2. Operator removes from chamber
  3. Run reflectance + colorimetry
  4. Record measurements
  5. Compare vs initial:
     - Reflectance retention: should be > 60% of initial after 1000h
     - ΔE color shift: should be < 5.0
  6. Return to chamber if not yet complete
- **Branches**:
  - ✅ Within tolerance → continue
  - ⚠️ Approaching limit:
    - Document concern
    - Likely will fail at 1000h
  - ❌ Already exceeded limit before 1000h:
    - Test ends early
    - Specimen FAIL
    - Lot may need to be recalled (if shipped) or held

#### Step 7.4.5 — Final test at 1000h
- **System triggers final check**
- **Operator runs final measurements**
- **Computes**: Reflectance retention %, ΔE color shift
- **Branches**:
  - ✅ Reflectance > 60%, ΔE < 5: PASS
  - ❌ Either failed: aging test FAIL
    - Implication: lot quality may be lower than expected
    - Customer notification?
    - Process investigation

---

## 8. PHASE 7 — ECE Marking (Detailed)

### 8.1 Marking generation

#### Step 8.1.1 — Verify cert still valid
- **Re-check**: Homologation cert at this moment
- **Critical**: May have expired during production
- **Branches**:
  - ✅ Still valid → generate marking
  - ❌ Expired during production:
    - 🔒 BLOCK marking
    - Lot cannot be sold under ECE
    - Decision tree:
      - Wait for new cert and ship later
      - Sell as non-ECE product
      - Scrap

#### Step 8.1.2 — Generate marking string
- **System computes**:
  - `E{country}-104R-{cert.number}/{year}`
  - For our case: `E3-104R-001234/2026`
- **Display on HMI** for operator verification

### 8.2 Apply marking

#### Step 8.2.1 — Pad printer setup
- **Equipment**: DEV-PAD-PRINT-001
- **Load**: Cliché with marking text
- **Verify**: Text matches expected

#### Step 8.2.2 — Apply marking on each piece
- **Time**: 2 sec per piece
- **Operator**: Place piece, trigger print
- **System counts**: Each marked piece
- **Branches**:
  - ✅ Clean print → proceed
  - ❌ Smudged marking:
    - Re-print on same piece
    - Or scrap if cannot recover

#### Step 8.2.3 — Visual verify (sample)
- **Every 25th piece**: Operator verifies marking
- **OCR optional**: Camera reads marking
- **Branches**:
  - ✅ Legible → continue
  - ❌ Issue: investigate

#### Step 8.2.4 — Apply protective film
- **Action**: Film over marking area
- **Purpose**: Prevent damage during shipping

### 8.3 Customer label

#### Step 8.3.1 — Print customer label
- **Content**: Lot, qty, date, customer ref, ECE cert ref
- **Equipment**: Zebra label printer

#### Step 8.3.2 — Apply on each piece
- **Position**: Back side, defined location

---

## 9. PHASE 8 — Packaging (Detailed)

### 9.1 Box selection

#### Step 9.1.1 — Select empty BTYPE-CARD-SAFE-001
- **System filter**: Empty boxes of correct type
- **Display**: Available locations

#### Step 9.1.2 — Verify box condition
- **Visual**: Box not damaged

### 9.2 Pack

#### Step 9.2.1 — Insert paper divider on bottom
- **Material**: Carta velina

#### Step 9.2.2 — Pack panel
- **Operator**: Place panel face-up
- **Scan serial**: Track which piece in which box
- **System**: Update box.currentUnits

#### Step 9.2.3 — Insert paper divider between panels
- **Critical**: Prevent scratching

#### Step 9.2.4 — Repeat
- **Until**: 50 panels in box

#### Step 9.2.5 — Validate capacity
- **System check**: count = 50
- **Branches**:
  - ✅ Match → proceed
  - ❌ Mismatch:
    - Recovery: recount, scan missing serials

### 9.3 Sealing

#### Step 9.3.1 — Insert top divider
- **Final paper layer**

#### Step 9.3.2 — Seal box
- **Method**: Tape across top + tamper-evident label
- **System generates**: Seal number
- **Apply**: Operator seals

### 9.4 Customer label

- **Print + apply**: Box label with all required info
- **Includes**: ECE cert reference (audit trail)

### 9.5 Palletize

#### Step 9.5.1 — Place 10 boxes on Euro pallet
- **System tracks**: Pallet entity (BTYPE-PLT-EUR80-001)

#### Step 9.5.2 — Apply stretch wrap
- **Manual or automatic**

#### Step 9.5.3 — Pallet label
- **Content**: WO, customer, total qty (500), ECE cert

---

## 10. PHASE 9 — Storage & Shipping

### 10.1 Move to magazzino PF
- **System tracks**: Pallet location
- **Climate control**: UV protection

### 10.2 Mark ready for shipping
- **System status**: Lot READY

### 10.3 Document trail
- **All required documents archived**:
  - Production records
  - QC results (reflectance, colorimetry, aging in progress)
  - Cert reference for ECE
  - Adhesion test results

---

## 11. Critical Branches Summary

### Block conditions (must be resolved before WO continues)

| Condition | Action | Resolution |
|---|---|---|
| Cert expired | Cannot mark ECE | New cert or remove ECE marking |
| Reflectance fail | Cannot ship | Investigation + scrap |
| Adhesion < 4B | Cannot continue | Process correction |
| Cal expired | Cannot test | Calibrate first |

### Warning conditions (proceed with extra care)

| Condition | Action |
|---|---|
| Cert expiring (< 90d) | Proceed but plan renewal |
| Reflectance marginal | QC manager approve |
| Adhesion 3B | Quality review + monitor |
| Out-of-spec sample (rare in this product) | Sample investigation |

---

## 12. Cross-references

- High-level workflow: `extensions/WORKFLOW_SAFETY_DEVICES.md`
- Module: `extensions/SAFETY_DEVICES_MODULE.md`
- Compliance details: `MASTER_SPECIFICATION.md` § 4.61-4.64

---

## 13. Change Log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-27 | Initial detailed Safety Devices workflow |

# WORKFLOW_DIGITAL_ELECTRICAL — Extension v1.0

> **Type**: Reference Workflow (Reflexallen Digital Electrical line)
> **Status**: ⚠️ **INVENTED based on industry standards** — to be validated with Reflexallen Process Engineers
> **Parent**: `MASTER_SPECIFICATION.md` v1.2
> **Last updated**: 2026-04-27

---

## ⚠️ DISCLAIMER

**This workflow is generated from industry-standard practices for automotive electrical connector assembly**, NOT from specific Reflexallen Digital Electrical production data. Before using this workflow:

1. **Validate** with Reflexallen Process Engineers
2. **Adapt** to actual equipment, customer specs, and processes
3. **Confirm** materials, suppliers, USCAR/IATF specifications
4. **Update** equipment names, recipe parameters, operator skills

This document serves as:
- **Architecture validation**: confirms MES design supports electrical workflows
- **V2 starting point**: when MVP is operational, this can be refined for Digital Electrical line activation

**Do not use as authoritative production guide without validation.**

---

## 1. Concept

The Digital Electrical line at Reflexallen produces **automotive electrical sub-assemblies**:
- Wire harnesses (cablaggi)
- Connector assemblies
- Sensor cables
- Custom wiring solutions
- Multi-pin connectors with crimped terminals

**Reference product (invented)**: Wire harness sensor ABS — 4-pin connector with 2m cable for automotive ABS sensor (ITM-FG-RFA-DIGEL-001)

---

## 2. Product Specifications (Reference)

```
Item: Wire Harness ABS Sensor 4-pin × 2m
Code: ITM-FG-RFA-DIGEL-001 (invented)
Type: finished_good
Customer: Automotive Tier 1 OEM (truck/automotive)

Specifications:
- 4-pin sealed connector (Deutsch DT-04 type or AMP equivalent)
- Cable: 4× 0.5 mm² (AWG 20), shielded
- Length: 2.0 m ± 5 mm
- Operating temperature: -40°C to +125°C
- IP rating: IP67 / IP6K9K
- Voltage: 12V DC nominal, 24V DC max
- Insulation resistance: > 100 MΩ at 500V
- Standard: USCAR-21 / IATF 16949 compliance
- Color coding: PIN1=red (+), PIN2=black (GND), PIN3=blue (signal+), PIN4=yellow (signal-)
```

### BOM (Invented)

```yaml
ITM-FG-RFA-DIGEL-001
├── ITM-RAW-CABLE-4x0.5-SHIELD (Cable 4-conductor 0.5mm² shielded)  — 2.05 m
├── ITM-COMP-CONN-4P-DT04-MALE (Connector housing, 4-pin male)      — 1 piece
├── ITM-COMP-TERM-PIN-DT-001 (Terminal pin, female)                 — 4 pieces
├── ITM-COMP-SEAL-DT-001 (Cable seal Deutsch)                       — 4 pieces
├── ITM-COMP-WEDGE-DT-001 (Wedge lock)                              — 1 piece
├── ITM-COMP-BOOT-DT-001 (Strain relief boot)                       — 1 piece
├── ITM-CONS-HEATSHRINK-001 (Heat shrink tube, 5cm)                 — 1 piece
└── ITM-CONS-LABEL-DIGEL-001 (Identification label)                 — 1 label
```

---

## 3. Equipment Configuration (Invented but plausible)

### Equipment hierarchy

```
Site: Stabilimento Reflexallen Modena
└── Area: Linea Digital Electrical

    ├── Work Center: Cable Preparation (WC-CABLE-PREP-001)
    │   ├── Equipment: Cable cutter automatic (DEV-CUT-CABLE-001)
    │   │   - Type: cutter
    │   │   - Cycle: 1 sec per cut
    │   │   - Length precision: ±0.5 mm
    │   ├── Equipment: Wire stripper (DEV-STRIP-001)
    │   │   - 4-conductor strip, controlled depth
    │   │   - No conductor damage
    │   └── Equipment: Cable jacket cutter (DEV-JACKET-001)
    │       - Removes outer jacket at ends
    │
    ├── Work Center: Crimping Station (WC-CRIMP-DIGEL-001)
    │   ├── Equipment: Pneumatic terminal crimper (DEV-CRIMP-TERM-001)
    │   │   - Type: terminal_crimper
    │   │   - Force: up to 5 kN
    │   │   - Servo-controlled with CFM (Crimp Force Monitoring)
    │   ├── Equipment: Crimp force monitor (DEV-CFM-001)
    │   │   - Records full crimp curve
    │   │   - Real-time pass/fail
    │   └── Tool: Crimp dies (per terminal type)
    │       - DIE-DT-PIN-001 for our terminal
    │
    ├── Work Center: Connector Assembly (WC-ASSY-CONN-001)
    │   ├── Equipment: Pin insertion fixture (DEV-PIN-INSERT-001)
    │   │   - Verifies correct pin position
    │   ├── Equipment: Connector tester (mock)
    │   └── Bench: Manual assembly with poka-yoke fixtures
    │
    ├── Work Center: Electrical Testing (WC-TEST-ELEC-001)
    │   ├── Equipment: Continuity tester (DEV-CONT-TEST-001)
    │   │   - Verifies all conductors continuous
    │   │   - Checks pin assignment correct
    │   ├── Equipment: Insulation tester (DEV-INSUL-TEST-001)
    │   │   - Hi-pot test (high voltage isolation)
    │   │   - 500V test, > 100 MΩ minimum
    │   ├── Equipment: Pull-off tester (DEV-PULL-ELEC-001)
    │   │   - Tests pin retention force in connector
    │   └── Equipment: Cable mark verifier (OCR camera)
    │
    ├── Work Center: Quality Control (WC-QC-DIGEL-001)
    │   ├── Equipment: Vision system (DEV-VISION-001)
    │   │   - Verifies connector orientation
    │   │   - Checks crimp visual quality
    │   ├── Equipment: Dimensional check (length, etc.)
    │   └── Equipment: Salt spray chamber (sampling, V2)
    │
    └── Work Center: Imballaggio (WC-PACK-DIGEL-001)
        └── Banco imballaggio
```

### Recipes (Invented)

```yaml
RCP-CUT-CABLE-2M-001 (Cut cable to 2m length)
  Device: DEV-CUT-CABLE-001
  Cycle: 1.5 sec
  Parameters:
    - Length: 2050 mm ± 5 mm (2m + 5cm allowance for stripping)
    - Cut quality: clean, no fraying

RCP-STRIP-4CON-001 (Strip 4-conductor cable, both ends)
  Device: DEV-STRIP-001
  Cycle: 4 sec
  Parameters:
    - Strip length per conductor: 5 mm ± 0.5 mm
    - Jacket strip: 30 mm
    - No conductor nicks

RCP-CRIMP-DT-PIN-001 (Crimp DT pin terminal on 0.5mm² wire)
  Device: DEV-CRIMP-TERM-001
  Cycle: 2 sec per crimp
  Parameters:
    - Force target: 1.8 kN ± 0.1 kN
    - Crimp height: 0.85 mm ± 0.03 mm
    - Crimp width: 1.5 mm ± 0.05 mm
    - Pull-off strength: > 60 N (per USCAR-21)
    - Force profile: standard symmetric curve
  Standard: USCAR-21 compliance

RCP-INSUL-TEST-500V (Insulation test 500V)
  Device: DEV-INSUL-TEST-001
  Cycle: 5 sec
  Parameters:
    - Test voltage: 500V DC
    - Hold time: 1 sec
    - Threshold: > 100 MΩ minimum
    - Duration: 1 sec stable

RCP-CONT-TEST-4PIN (Continuity test 4-pin)
  Device: DEV-CONT-TEST-001
  Cycle: 3 sec
  Parameters:
    - Test current: 100 mA
    - Each pin checked
    - Resistance threshold: < 0.1 Ω per conductor
    - Pin assignment verified (PIN1→Wire1, etc.)

RCP-PULL-OFF-PIN (Pin retention test)
  Device: DEV-PULL-ELEC-001
  Cycle: 5 sec per pin (sample only)
  Parameters:
    - Pull force: ramp 0→100 N
    - Pin must hold > 80 N (per USCAR-21)
```

### Operators (Skills required)

```yaml
OP-CABLE-PREP-001
  Skills: [CABLE_CUT, STRIP, JACKET_CUT]

OP-CRIMP-DIGEL-001
  Skills: [CRIMP_TERMINAL, CFM]

OP-ASSY-CONN-001
  Skills: [CONNECTOR_ASSY, POKA_YOKE]

OP-TEST-ELEC-001
  Skills: [CONTINUITY, HI_POT, PULL_TEST]

OP-QC-DIGEL-001
  Skills: [QC, VISION_SYSTEM]

OP-PACK-DIGEL-001
  Skills: [PACK]
```

---

## 4. Workflow — 9 Phases (Invented Standard)

### Phase 1 — INBOUND LOGISTICS

Standard pattern:
- Receive cable reels (large bulk packaging)
- Receive small components (connectors, terminals, seals) in bagged kits
- Verify lot codes and CoA
- ESD-safe storage for connectors and PCBs
- Climate-controlled (humidity matters for connectors)

### Phase 2 — SETUP (auto-generated)

Standard auto-gen rules apply:
- Skills check
- BOM check (cable + connectors + terminals + seals + wedges + boots)
- Tooling check (crimp dies)
- Device setup (crimper, testers)
- First piece approval (FAI critical for automotive)

### Phase 3 — CABLE PREPARATION

#### Step 3.1 — Mount cable reel
- **Action**: Operator mounts large cable reel on cutter
- **System verifies**: Lot match (BOM check)
- **Branches**:
  - ✅ Lot matches → proceed
  - ❌ Wrong cable type:
    - Color codes mismatch
    - Recovery: replace with correct lot

#### Step 3.2 — Cable cut to length
- **Multi-output: variable** (1 reel = many pieces)
- **Recipe RCP-CUT-CABLE-2M-001**
- **Length**: 2050 mm ± 5 mm
- **Continuous run**: ~1.5 sec per piece
- **Branches**:
  - ✅ Length OK → proceed
  - ❌ Length out of tolerance:
    - Encoder fault or feed slippage
    - Recovery: stop, recalibrate, restart
  - ❌ Cable fraying at cut:
    - Cutter blade dull
    - Replace blade
    - Verify on test piece before continue

#### Step 3.3 — Jacket stripping (both ends)
- **Equipment**: DEV-JACKET-001
- **Length**: 30 mm jacket removed at each end
- **Critical**: Conductors not damaged, shield exposed cleanly
- **Branches**:
  - ✅ Clean strip → proceed
  - ❌ Conductor nicked:
    - Visible damage to copper
    - Cannot use end (risk of breakage)
    - Cut shorter and re-strip (within length tolerance)
    - Or scrap if too short
  - ❌ Jacket residue:
    - Manual cleanup or re-strip

#### Step 3.4 — Conductor stripping (4 conductors per end)
- **Equipment**: DEV-STRIP-001
- **Recipe**: RCP-STRIP-4CON-001
- **Strip length**: 5 mm per conductor
- **Branches**:
  - ✅ Clean strip, no nicks → proceed
  - ❌ Nick on copper strand:
    - Visual inspection (microscope if needed)
    - Cut and re-strip
  - ❌ Strip length wrong:
    - Crimp would fail or be sub-optimal
    - Re-strip to spec

#### Step 3.5 — Verify stripping quality
- **Visual inspection per end**
- **Operator confirms** via HMI
- **Optional**: Vision system check
- **Branches**:
  - ✅ Both ends OK → proceed to crimping
  - ❌ One end bad:
    - Re-strip that end only
    - Or use as shorter cable

### Phase 4 — CRIMPING TERMINALS (CRITICAL)

#### Step 4.1 — Position conductor in crimp die
- **Operator action**: Insert wire into die DIE-DT-PIN-001
- **Insertion depth**: To strip mark (5 mm exposed)
- **Verify**: Wire seated correctly

#### Step 4.2 — Place terminal in die
- **Operator places** female pin terminal in die
- **Pre-positioned**: Terminal feed mechanism (or manual)
- **Branches**:
  - ✅ Positioned → proceed
  - ❌ Terminal askew:
    - Reposition before crimp

#### Step 4.3 — Run crimp cycle
- **Recipe RCP-CRIMP-DT-PIN-001**
- **Force**: 1.8 kN ± 0.1 kN
- **Cycle**: 2 sec
- **CFM (Crimp Force Monitoring)**: Records full curve
- **Branches**:
  - ✅ Force in range, curve correct → proceed
  - ⚠️ Force at limit (1.7 or 1.9 kN):
    - Marginal pass
    - Track for trends
  - ❌ Force out of range:
    - 🔒 STOP
    - Possible: die wear, wire variation, terminal lot variation
    - Recovery: inspect die, verify materials, retry
    - 3 attempts before scrap terminal+wire end
  - ❌ CFM curve abnormal:
    - Possible: contamination, insulation in crimp area, wire not fully seated
    - Investigate, retry

#### Step 4.4 — Verify crimp dimensions (sample-based)
- **Every 50th piece**: Measure crimp height (cross-section sample destructive)
- **Operator measures** with optical microscope
- **Branches**:
  - ✅ Within spec → continue production
  - ❌ Out of spec:
    - Stop production
    - Adjust crimp height (die calibration)
    - Verify on next sample

#### Step 4.5 — Pull-off test (sample, every 100th piece)
- **Equipment**: DEV-PULL-ELEC-001
- **Test**: Pull terminal axially
- **Threshold**: > 80 N (per USCAR-21)
- **Branches**:
  - ✅ Holds > 80 N → continue
  - ❌ Pulls off:
    - Critical failure
    - Stop production
    - Investigate crimping process
    - Discard 100 pieces since last successful pull-test (worst case)

#### Step 4.6 — Repeat for all 4 conductors per end (8 crimps total per piece)
- Same procedure
- All must pass

### Phase 5 — CONNECTOR ASSEMBLY

#### Step 5.1 — Insert cable seal
- **Action**: Slide rubber cable seal onto cable
- **Position**: At connector entry point
- **Critical**: Correct orientation (one direction works)
- **Branches**:
  - ✅ Inserted → proceed
  - ❌ Wrong direction:
    - Remove and re-insert correctly

#### Step 5.2 — Insert pin terminals into connector housing
- **Action**: Insert each pin into correct cavity
- **Color coding** ensures correct assignment:
  - PIN1: red wire
  - PIN2: black wire
  - PIN3: blue wire
  - PIN4: yellow wire
- **Mechanical click**: Pin locks in place
- **Branches**:
  - ✅ All 4 pins clicked → proceed
  - ❌ Pin won't insert:
    - Possible: cavity blocked, terminal damaged
    - Recovery: inspect, clean cavity, replace terminal if needed
  - ❌ Pin doesn't click (loose):
    - Possible: terminal not fully seated
    - Push deeper until click
    - If still loose: terminal damaged, replace

#### Step 5.3 — Insert wedge lock
- **Action**: Push wedge into housing to secondary-lock all pins
- **Critical**: Confirms all pins fully seated
- **Branches**:
  - ✅ Wedge fully inserted → proceed
  - ❌ Wedge won't go in:
    - Indicates a pin not fully seated
    - Reverse: remove wedge, push pins, retry

#### Step 5.4 — Verify pin position (poka-yoke)
- **Vision system** or manual check
- **Looking for**: All pins at correct depth
- **Branches**:
  - ✅ All pins correct → proceed
  - ❌ One pin under-inserted:
    - Cannot ship like this
    - Disassemble, reinsert, retest

#### Step 5.5 — Apply strain relief boot
- **Action**: Slide rubber boot over cable + connector junction
- **Position**: Per drawing
- **Branches**:
  - ✅ Positioned → proceed
  - ❌ Boot wrong size:
    - Replace with correct boot

#### Step 5.6 — Heat shrink (if specified)
- **Some products**: Heat shrink at strain relief
- **Hot air gun**: Shrinks tube around cable
- **Branches**:
  - ✅ Tight, no bubbles → proceed
  - ❌ Bubbles or loose:
    - Re-heat or replace heat shrink

### Phase 6 — ELECTRICAL TESTING (CRITICAL — 100% per USCAR-21)

#### Step 6.1 — Connect to test fixture
- **Equipment**: Connector mating fixture (counter-connector)
- **Critical**: Same mating as customer application
- **Action**: Mate the assembly into fixture

#### Step 6.2 — Continuity test
- **Recipe RCP-CONT-TEST-4PIN**
- **Equipment**: DEV-CONT-TEST-001
- **Test sequence** for each pin:
  - PIN1 ↔ Wire1: continuity, R < 0.1 Ω → expected
  - PIN1 ↔ Wire2: NO continuity → expected
  - ...all pin combinations checked
- **Cycle**: 3 sec
- **Branches**:
  - ✅ All continuities correct → proceed
  - ❌ Open circuit (one wire):
    - Possible: bad crimp, wire break
    - Recovery: visual inspection, may need to re-crimp
  - ❌ Short circuit (two pins connected):
    - Critical: wrong pin assignment or insulation breach
    - Cannot ship
    - Disassemble and rebuild, or scrap

#### Step 6.3 — Insulation resistance test (Hi-pot)
- **Recipe RCP-INSUL-TEST-500V**
- **Equipment**: DEV-INSUL-TEST-001
- **Test**: Apply 500V DC between conductors and measure leakage
- **Threshold**: > 100 MΩ
- **Cycle**: 5 sec
- **Branches**:
  - ✅ Insulation > 100 MΩ → PASS
  - ⚠️ Marginal (50-100 MΩ):
    - Possible humidity effect
    - Re-test after dehumidification
    - Or accept with note
  - ❌ FAIL (< 100 MΩ):
    - Critical: insulation breach somewhere
    - Recovery flow:
      - **Stage 1**: Visual inspection, look for damaged insulation
      - **Stage 2**: Repair (if cable damage spotted)
      - **Stage 3**: If unfixable, scrap

#### Step 6.4 — Mating force/cycle test (sample, 1% of lot)
- **Action**: Mate and unmate 10× to verify retention force
- **Threshold per USCAR-21**: 30-100 N for mating force
- **Branches**:
  - ✅ Within spec → sample passes
  - ❌ Out of spec → lot quality investigation

#### Step 6.5 — Record test results
- **System action**: Save all test data
- **Per piece**: continuity, insulation values stored
- **Linked to serial number** for traceability

### Phase 7 — QUALITY CONTROL (Visual + Dimensional)

#### Step 7.1 — Visual inspection (100%)
- **Operator** examines each piece
- **Checklist**:
  - [ ] Connector intact (no cracks)
  - [ ] All 4 pins flush with mating face
  - [ ] Cable seal properly seated
  - [ ] Strain relief boot in position
  - [ ] No insulation damage on cable
  - [ ] Color coding visible (if marked)
  - [ ] Wedge lock fully inserted

#### Step 7.2 — Length verification (sample, 5%)
- **Measure** cable length end-to-end
- **Tolerance**: ±5 mm per spec

#### Step 7.3 — Vision system check (optional, 100%)
- **Equipment**: DEV-VISION-001
- **Checks**: Crimp visual quality, pin position, marking
- **Branches**:
  - ✅ All checks pass → proceed
  - ❌ Vision flags issue:
    - Manual review
    - Decision: pass / scrap / rework

### Phase 8 — IDENTIFICATION & MARKING

#### Step 8.1 — Apply identification label
- **Content**: Item code, serial number, lot, date
- **Method**: Adhesive label or wire-marker (heat shrink with print)
- **Position**: 5cm from connector

#### Step 8.2 — Verify label
- **OCR or operator visual** check
- **Branches**:
  - ✅ Legible → proceed
  - ❌ Smudged or wrong → reprint

### Phase 9 — PACKAGING & SHIPPING

#### Step 9.1 — Cap connector
- **Plastic cap** on mating face (prevents contamination, ESD)

#### Step 9.2 — Coil cable
- **Standard coil**: ~15 cm diameter
- **Tied with cable tie** (single, removable)

#### Step 9.3 — Pack into ESD bag
- **Critical for electronics**
- **One piece per bag**

#### Step 9.4 — Pack into box
- **Standard**: 50 pieces per box
- **Box label**: customer + lot + content + ESD warning

#### Step 9.5 — Palletize and ship

---

## 5. Critical Branches Summary

| Failure Point | Recovery | Outcome |
|---|---|---|
| Cable length out of tolerance | Recalibrate, recut | Continue with corrected piece |
| Conductor nicked at strip | Cut and re-strip | Continue if length OK |
| Crimp force out of range | Inspect die, retry | Scrap terminal+end if 3 fails |
| Crimp height out of spec (sample) | Adjust die calibration | Lot may be at risk |
| Pull-off fail (sample) | Lot quality alert | Possible lot reject |
| Pin not fully seated | Reinsert and verify | Cannot ship without |
| Continuity open | Visual + re-crimp | Re-build if persistent |
| Continuity short | Disassemble or scrap | Cannot ship |
| Insulation < 100 MΩ | Repair if locatable, else scrap | Critical failure |
| Mating force out of spec | Lot quality investigation | Customer notification |

---

## 6. KPIs (Expected)

| KPI | Target | Notes |
|---|---|---|
| Cycle time per piece | ~90 sec | All phases |
| First Pass Yield | > 98% | Automotive standard |
| Crimp force CpK | > 1.67 | Critical for safety |
| Pull-off pass rate | 100% | Safety-critical |
| Insulation pass rate | > 99.5% | Customer requirement |
| Continuity pass rate | 100% | Cannot ship if fail |

---

## 7. USCAR-21 Compliance Notes (Industry Standard)

**USCAR-21** (Electrical Connector Performance Specification) is the de-facto standard for automotive connector validation. Production must include:

- **Crimp force monitoring** (CFM) on every crimp
- **Cross-section analysis** at periodic intervals
- **Pull-off testing** per defined sampling
- **Mating force testing** per defined sampling
- **Insulation resistance** at 500V minimum
- **Continuity verification** 100% of pieces
- **Environmental testing** for samples (vibration, temperature cycling, salt spray) — typically lot-based or PPAP-based

**IATF 16949** compliance also required for automotive Tier 1.

---

## 8. Validation Notes for Reflexallen

When validating this workflow with Process Engineers:

### Confirm:
- [ ] Connector types used (Deutsch? AMP? Molex? customer-specific?)
- [ ] Crimper manufacturers (Schleuniger? Komax? Gluth?)
- [ ] Specific dies and tooling
- [ ] Real cycle times
- [ ] Customer-specific test requirements (some customers more stringent than USCAR-21)
- [ ] Marking requirements (laser? print? label?)
- [ ] PPAP requirements

### Consider:
- [ ] Are there over-molded products (different process)?
- [ ] Multi-branch harnesses (more complex layouts)?
- [ ] Splice operations?
- [ ] PCB integration?
- [ ] EOL (End of Line) testing per customer specs?
- [ ] Specific environmental tests (thermal shock, immersion, etc.)?

---

## 9. Cross-references

- `MASTER_SPECIFICATION.md` — core domain
- `extensions/INDUSTRIAL_OPERATIONS.md` — sample testing patterns
- `extensions/EQUIPMENT_MANAGEMENT.md` — die wear, tool tracking

---

## 10. Change Log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-27 | Initial reference workflow (INVENTED — to be validated) |

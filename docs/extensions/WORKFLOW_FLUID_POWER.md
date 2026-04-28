# WORKFLOW_FLUID_POWER — Extension v1.0

> **Type**: Reference Workflow (Reflexallen Fluid Power line)
> **Status**: ⚠️ **INVENTED based on industry standards** — to be validated with Reflexallen Process Engineers
> **Parent**: `MASTER_SPECIFICATION.md` v1.2
> **Last updated**: 2026-04-27

---

## ⚠️ DISCLAIMER

**This workflow is generated from industry-standard practices for fluid power components manufacturing**, NOT from specific Reflexallen Fluid Power production data. Before using this workflow:

1. **Validate** with Reflexallen Process Engineers
2. **Adapt** to actual equipment and processes used at Reflexallen
3. **Confirm** material types, suppliers, and specifications
4. **Update** equipment names, recipe parameters, and operator skills

This document serves as:
- **Architecture validation**: confirms MES design supports fluid power workflows
- **V2 starting point**: when MVP is operational, this can be refined for Fluid Power line activation

**Do not use as authoritative production guide without validation.**

---

## 1. Concept

The Fluid Power line at Reflexallen produces **hydraulic and pneumatic subsystems** for industrial applications:
- High-pressure hose assemblies
- Hydraulic manifolds
- Pneumatic cylinder subassemblies
- Quick-connect couplings
- Fluid distribution blocks

**Reference product (invented)**: Hydraulic hose assembly 3/8" × 1.5m for industrial machinery (working pressure 250 bar)

---

## 2. Product Specifications (Reference)

```
Item: Hydraulic Hose Assembly 3/8" × 1.5m
Code: ITM-FG-RFA-FLUID-001 (invented)
Type: finished_good
Customer: Industrial machinery OEM

Specifications:
- Hose: 3/8" inside diameter, 1.5m length
- Inner tube: nitrile rubber (NBR)
- Reinforcement: 2 high-tensile steel wire braids
- Cover: synthetic rubber, abrasion resistant
- Working pressure: 250 bar
- Burst pressure: > 1000 bar (4× safety factor)
- Operating temperature: -40°C to +100°C
- Standard: SAE 100R2 / EN 853 2SN
```

### BOM (invented)

```yaml
ITM-FG-RFA-FLUID-001
├── ITM-RAW-HOSE-2SN-3/8 (Hose 3/8" 2SN, 1.5m)            — 1 piece
├── ITM-COMP-FITTING-3/8-A (Fitting end A: female JIC)    — 1 piece
├── ITM-COMP-FITTING-3/8-B (Fitting end B: female JIC)    — 1 piece
├── ITM-RAW-OIL-HYDRO (Hydraulic oil for testing)         — 50 ml
└── ITM-CONS-LABEL-FLUID-001 (Identification label)       — 1 label
```

---

## 3. Equipment Configuration (Invented but plausible)

### Equipment hierarchy

```
Site: Stabilimento Reflexallen Modena
└── Area: Linea Fluid Power

    ├── Work Center: Cutting & Skiving (WC-CUT-FLUID-001)
    │   ├── Equipment: Hose cutting machine (DEV-CUT-FLUID-001)
    │   │   - Type: cutter
    │   │   - Capacity: 0.5 sec per cut
    │   ├── Equipment: Skiving machine (DEV-SKIVE-001)
    │   │   - Removes outer cover at fitting ends
    │   └── Tool: Cutter blade (replaceable)
    │
    ├── Work Center: Crimping Station (WC-CRIMP-FLUID-001)
    │   ├── Equipment: Hydraulic crimping press (DEV-CRIMP-FLUID-001)
    │   │   - Type: hydraulic_crimper
    │   │   - Force: up to 600 kN
    │   │   - Servo-controlled
    │   ├── Equipment: Force monitoring system (DEV-FORCE-001)
    │   ├── Tool: Crimping dies (per fitting size)
    │   │   - DIE-3/8-2SN-001 for our product
    │
    ├── Work Center: Cleaning & Flushing (WC-CLEAN-FLUID-001)
    │   ├── Equipment: Ultrasonic cleaner (DEV-ULTRA-001)
    │   ├── Equipment: Hydraulic flush station (DEV-FLUSH-001)
    │   │   - Cleans inner hose with filtered hydraulic oil
    │   └── Equipment: Cleanliness verification (DEV-CLEAN-VERIFY-001)
    │       - NAS 1638 / ISO 4406 compliance
    │
    ├── Work Center: Pressure Testing (WC-TEST-FLUID-001)
    │   ├── Equipment: Hydraulic pressure tester (DEV-HYDRO-TEST-001)
    │   │   - Type: pressure_tester
    │   │   - Max pressure: 1500 bar
    │   │   - Multi-cycle capable
    │   └── Equipment: Burst tester (DEV-BURST-001) — for samples
    │       - Max: 3000 bar
    │
    ├── Work Center: Quality Control (WC-QC-FLUID-001)
    │   ├── Equipment: Coordinate Measuring Machine (DEV-CMM-FLUID-001)
    │   ├── Equipment: Pull-off tester (DEV-PULL-001)
    │   │   - Tests fitting retention force
    │   └── Equipment: Visual inspection station
    │
    └── Work Center: Imballaggio (WC-PACK-FLUID-001)
        └── Banco imballaggio
```

### Recipes (Invented)

```yaml
RCP-CUT-3/8-001 (Cut hose 3/8" to 1.5m)
  Device: DEV-CUT-FLUID-001
  Cycle: 0.5 sec
  Parameters:
    - Length: 1500 mm ± 2 mm
    - Cut pressure: 4 bar
    - Cut speed: 100 mm/s

RCP-CRIMP-3/8-2SN (Crimping fittings on 2SN hose)
  Device: DEV-CRIMP-FLUID-001
  Cycle: 12 sec per crimp
  Parameters:
    - Force target: 480 kN ± 10 kN
    - Crimp diameter: 14.5 mm ± 0.05 mm
    - Hold time: 3 sec
    - Force profile: linear ramp 0→480 kN in 6 sec
    - Die: DIE-3/8-2SN-001
  Standard: SAE J1273 compliance

RCP-PRESSURE-TEST-250 (Pressure test 250 bar working)
  Device: DEV-HYDRO-TEST-001
  Cycle: 60 sec
  Parameters:
    - Test pressure: 375 bar (1.5× working)
    - Hold time: 30 sec
    - Pressure decay threshold: < 5 bar/min
    - Burst hold: NO (this is proof test, not destructive)

RCP-CLEANLINESS-NAS8 (Cleanliness NAS 1638 Class 8)
  Device: DEV-CLEAN-VERIFY-001
  Cycle: 90 sec
  Parameters:
    - Particle count threshold per ISO 4406 18/16/13
    - Sample size: 100 ml flush oil
```

### Operators (Skills required)

```yaml
OP-CUT-FLUID-001
  Skills: [HOSE_CUT, SKIVE]

OP-CRIMP-FLUID-001
  Skills: [CRIMP_HYDRO, FORCE_MONITORING]

OP-TEST-FLUID-001
  Skills: [PRESSURE_TEST, HYDRAULIC_SAFETY, CLEANLINESS_TEST]

OP-QC-FLUID-001
  Skills: [QC, CMM, PULL_TEST]

OP-PACK-FLUID-001
  Skills: [PACK, FORKLIFT]
```

---

## 4. Workflow — 8 Phases (Invented Standard)

### Phase 1 — INBOUND LOGISTICS

Standard pattern (similar to Pneumatic Air):
- Receive raw hose (bulk reels)
- Receive fittings (bagged)
- Verify lots, CoA
- Storage in warehouse

### Phase 2 — SETUP (auto-generated)

Standard auto-gen rules apply:
- Skills check
- BOM check (hose + fittings)
- Tooling check (crimping dies)
- Device setup (crimper, tester)
- First piece approval

### Phase 3 — CUTTING & SKIVING

#### Step 3.1 — Hose preparation
1. Mount hose reel on cutting machine
2. Feed hose through cutting head
3. Recipe RCP-CUT-3/8-001 loaded

#### Step 3.2 — Cut to length
- **Multi-output: variable** (1 reel = many cuts)
- Recipe defines length (1500 mm ± 2 mm)
- Continuous cutting: ~0.5 sec per piece
- **Branches**:
  - ✅ Length OK → proceed
  - ❌ Length out of tolerance:
    - Likely: encoder fault or feed slippage
    - Recovery: stop, recalibrate
    - 3 retries before maintenance

#### Step 3.3 — Skiving (cover removal at ends)
- For both ends: ~10 mm cover removed
- Exposes braid for fitting assembly
- **Branches**:
  - ✅ Clean skive → proceed
  - ❌ Cover not fully removed:
    - Re-skive
    - May damage braid if too aggressive
  - ❌ Braid damaged during skive:
    - Cut shorter and re-skive
    - Or scrap piece (length tolerance exceeded)

### Phase 4 — CRIMPING (CRITICAL)

#### Step 4.1 — Insert fitting end A
- **Operator action**: Push fitting onto skived hose end
- **Insertion depth**: To pre-marked line on fitting
- **Branches**:
  - ✅ Inserted to mark → proceed
  - ❌ Resistance unusual (loose fit):
    - Possible: hose under-tolerance
    - Recovery: verify hose dimensions, may scrap

#### Step 4.2 — Position in crimp die
- Operator places fitting in die DIE-3/8-2SN-001
- Verifies seating

#### Step 4.3 — Run crimp cycle
- **Recipe RCP-CRIMP-3/8-2SN**
- Cycle: 12 sec
- **Continuous force monitoring**: Records full force-displacement curve
- **Branches**:
  - ✅ Force in range (480 ± 10 kN), curve correct → proceed
  - ⚠️ Force at limit (470 or 490 kN):
    - Marginal, may pass with note
    - Track for trends
  - ❌ Force out of range:
    - 🔒 STOP
    - Possible: die wear, hose dimensional, fitting variation
    - Recovery: inspect die, verify dimensions, retry
    - 3 attempts before scrap
  - ❌ Curve abnormal (early peak, late peak):
    - Investigate cause
    - May indicate: contamination, tool wear, equipment issue

#### Step 4.4 — Verify crimp diameter (post-crimp)
- **Manual measurement** with caliper or scanner
- **Target**: 14.5 mm ± 0.05 mm
- **Branches**:
  - ✅ In tolerance → proceed
  - ❌ Out of tolerance:
    - Cannot fix (already crimped)
    - Scrap fitting + cut hose end shorter for retry

#### Step 4.5 — Crimp end B (repeat 4.1-4.4)

#### Step 4.6 — Visual check
- Both fittings inserted correctly
- No cracks at hose-fitting interface
- **Branches**:
  - ✅ OK → proceed to cleaning
  - ❌ Visible defect → scrap or rework

### Phase 5 — CLEANING & FLUSHING (CRITICAL for fluid power)

#### Step 5.1 — Pre-flush inspection
- Visual: Inside ends should be clean
- Any visible contamination → flag for extra cleaning

#### Step 5.2 — Connect to flush station
- **Equipment**: DEV-FLUSH-001
- **Action**: Connect both ends to flush ports

#### Step 5.3 — Flush cycle
- **Process**: Filtered hydraulic oil pushed through hose
- **Time**: 30 seconds
- **Filter capture**: Particles removed and counted

#### Step 5.4 — Cleanliness verification (NAS 1638)
- **Recipe RCP-CLEANLINESS-NAS8**
- **Sample**: Flush oil sampled
- **Particle counter**: Counts particles by size
- **Standard**: ISO 4406 18/16/13 (or NAS 1638 Class 8)
- **Branches**:
  - ✅ Cleanliness within Class 8 → PASS
  - ⚠️ Class 9 (one level worse):
    - Re-flush, re-test
  - ❌ Class 10 or worse:
    - Significant contamination
    - Recovery:
      - Multi-cycle flush
      - May indicate hose contamination from manufacture
      - Possible scrap if persists

### Phase 6 — PRESSURE TESTING (CRITICAL)

#### Step 6.1 — Mount in pressure tester
- **Equipment**: DEV-HYDRO-TEST-001
- **Connect both ends** to pressure ports
- **SAFETY CRITICAL**: Plexiglass shield, no operator near during test

#### Step 6.2 — Run proof test
- **Recipe RCP-PRESSURE-TEST-250**
- **Pressure**: 375 bar (1.5× working pressure)
- **Hold**: 30 seconds
- **Monitoring**: Pressure decay
- **Branches**:
  - ✅ Holds pressure (decay < 5 bar/min) → PASS
  - ⚠️ Marginal decay (4-5 bar/min):
    - Re-test once
    - If consistent: investigate
  - ❌ FAIL (decay > 5 bar/min):
    - 🔒 Recovery flow:
      - **Stage 1**: Verify connections (often fitting-to-tester leak)
      - **Stage 2**: Re-test
      - **Stage 3**: If still fails — likely real defect (crimp failure)
        - Visual inspection
        - May cut crimped end off and re-crimp (1 attempt)
        - Or scrap entire assembly
    - **CRITICAL**: Failed pressure test = scrap or full rework

#### Step 6.3 — Depressurize and remove
- Slow decompression for safety
- Remove from tester

#### Step 6.4 — Burst test (sample only, 1% of lot)
- **Equipment**: DEV-BURST-001
- **Pressure**: Ramp until failure
- **Goal**: Verify > 1000 bar (4× working pressure)
- **DESTRUCTIVE**: Sample destroyed
- **Branches**:
  - ✅ Burst > 1000 bar → lot certified
  - ❌ Burst < 1000 bar → 🔒 CRITICAL
    - Lot quality questioned
    - Investigation
    - Possibly hold entire lot, customer notification

### Phase 7 — QUALITY CONTROL (Per piece)

#### Step 7.1 — Visual inspection (100%)
- Hose surface: no cuts, no damage
- Fittings: no scratches, threads good
- Crimp area: smooth, no bulges

#### Step 7.2 — Length verification (sample)
- 5% of lot measured
- Tolerance ±2 mm

#### Step 7.3 — Pull-off test (sample)
- **Equipment**: DEV-PULL-001
- **Action**: Pull fitting axially
- **Threshold**: > 4000 N retention force (varies by spec)
- **Branches**:
  - ✅ Holds → pass sample
  - ❌ Pulls off:
    - Critical failure
    - Investigate crimping process
    - May reject entire lot

### Phase 8 — IDENTIFICATION & PACKAGING

#### Step 8.1 — Apply identification label
- Content: Item code, lot, date, working pressure, standard reference
- Crimped band or printed label

#### Step 8.2 — Final cleaning
- Wipe exterior
- Ensure no oil residue

#### Step 8.3 — Cap fittings
- Plastic caps on both ends (prevent contamination during shipping)

#### Step 8.4 — Pack into box
- Standard: 20 hoses per box
- Label box: customer + lot + content

---

## 5. Critical Branches Summary

| Failure Point | Recovery | Outcome |
|---|---|---|
| Length out of tolerance | Recalibrate cutter, recut | Continue with corrected piece |
| Crimp force out of range | Inspect die, retry | Scrap if 3 fails |
| Cleanliness Class 10+ | Multi-cycle flush | Scrap if persists |
| Pressure test fail | Verify connections, re-test, scrap | Likely scrap |
| Pull-off test fail | Lot investigation | Possible lot reject |
| Burst pressure low | Lot quality review | Lot hold or recall |

---

## 6. KPIs (Expected)

| KPI | Target | Notes |
|---|---|---|
| Cycle time per piece | ~30 sec | Including all phases |
| First Pass Yield | > 95% | Industrial fluid power standard |
| Cleanliness pass rate | > 99% | Critical for downstream |
| Burst test pass rate | > 99.5% | Sample testing |
| Crimp force CpK | > 1.33 | Process capability |

---

## 7. Validation Notes for Reflexallen

When validating this workflow with Process Engineers:

### Confirm:
- [ ] Equipment manufacturers (Parker? Eaton? Manuli?)
- [ ] Specific dies and tooling used
- [ ] Real cycle times
- [ ] Specific standards (SAE / EN / DIN preferred)
- [ ] Specific cleaning requirements (some applications need NAS 5 not 8)
- [ ] Burst test sampling rate
- [ ] Customer-specific quality requirements

### Consider:
- [ ] Are there non-crimped products (push-on fittings)?
- [ ] Marking requirements (ECE, DOT, customer-specific)?
- [ ] Special tests for specific applications (autoclave, high-temp, etc.)?
- [ ] Subassemblies (manifolds, distribution blocks)?

---

## 8. Cross-references

- `MASTER_SPECIFICATION.md` — core domain
- `extensions/INDUSTRIAL_OPERATIONS.md` — sample testing, FAI patterns
- `extensions/EQUIPMENT_MANAGEMENT.md` — die wear tracking

---

## 9. Change Log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-27 | Initial reference workflow (INVENTED — to be validated) |

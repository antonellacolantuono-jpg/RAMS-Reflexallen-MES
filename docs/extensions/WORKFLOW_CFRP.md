# WORKFLOW_CFRP — Extension v1.0

> **Type**: Reference Workflow (Reflexallen Compositi line)
> **Parent**: `MASTER_SPECIFICATION.md` v1.2
> **Status**: Reference for seed data + demo
> **Last updated**: 2026-04-27

---

## 1. Concept

Reference workflow for Reflexallen Compositi production. The flow is fundamentally different from tubes:
- **Long process times** (4-12 hours per piece)
- **Manual lay-up** prevails over automation
- **Mold-dependent**: each part needs dedicated mold
- **Refrigerated material storage**
- **Out-time tracking** mandatory
- **NDT testing** required

Workflow modeled: **Production of carena posteriore moto sportiva (Yamaha YZF-R6 type) in carbon fiber**

---

## 2. Product Specifications

### 2.1 Product details

```
Item: Carena posteriore moto sportiva
Code: ITM-FG-RFA-CFRP-001
Type: finished_good
Customer: OEM moto / aftermarket racing

Specifications:
- Material: Carbon fiber prepreg + epoxy resin
- Layers: 6 plies (4 carbon + 2 reinforcement)
- Weight: ~450 g (target ±20 g)
- Dimensions: ~700 × 350 × 150 mm
- Cosmetic: Class A surface (visible carbon weave)
- Finish: Clear coat 2 layers
- Mounting: 4 inserti filettati M6
```

### 2.2 BOM

```yaml
ITM-FG-RFA-CFRP-001 (Carena posteriore moto)
├── ITM-RAW-PREPREG-CF-200-001 (Prepreg carbonio 200g/m² 0°/90°)  — 1.2 kg
├── ITM-RAW-PREPREG-CF-200-001 (same, 45° orientation)            — 0.5 kg
├── ITM-RAW-PEEL-PLY-001 (Peel-ply nylon)                         — 0.3 kg
├── ITM-RAW-BREATHER-001 (Breather/bleeder)                       — 0.4 kg
├── ITM-RAW-VACUUM-FILM-001 (Bagging film)                        — 0.5 m²
├── ITM-RAW-SEALANT-001 (Sealant tape)                            — 3 m
├── ITM-RAW-RELEASE-AGENT-001 (Release agent)                     — 1 application
├── ITM-COMP-INSERT-M6-001 (Inserto filettato M6)                 — 4 pieces
├── ITM-RAW-EPOXY-ADHES-001 (Epoxy adhesive 2K)                   — 5 g per insert
├── ITM-CONS-CLEAR-COAT-001 (Clear coat lacca)                    — ~80 ml
└── ITM-CONS-PRIMER-001 (Primer)                                  — ~50 ml
```

### 2.3 Mold

```yaml
MOLD-CARENA-YZF6-001 (Stampo carena moto YZF-R6)
- Type: hard_aluminum
- Item produced: ITM-FG-RFA-CFRP-001
- Maximum lifetime: 800 cycles
- Current cycles: 247
- Condition score: 85/100
- Last release agent applied: 5 cycles ago
- Re-apply every: 25 cycles
- Cost: 35,000 €
```

### 2.4 Packaging

```yaml
Primary: Custom EVA foam protective insert
Secondary: 1 piece per cardboard box BTYPE-CARD-CFRP-001
- Dimensions: 800 × 450 × 250 mm
- Material: cartone double-wall + EVA foam interno
- Single-use
- Sealed with tamper-evident label
```

---

## 3. Equipment Configuration

### 3.1 Equipment hierarchy

```
Site: Stabilimento Reflexallen Modena
└── Area: Linea Compositi

    ├── Stoccaggio refrigerato
    │   ├── Freezer industriale (-18°C) — DEV-FREEZER-001
    │   └── Frigorifero (4°C) — DEV-FRIDGE-001
    │
    ├── Work Center: Lay-up clean-room (WC-LAYUP-001)
    │   ├── Workstation: Tavolo lay-up (WS-LAYUP-01)
    │   ├── Equipment: CNC plotter taglio prepreg (DEV-PLOTTER-001)
    │   │   - Type: cnc_cutter
    │   │   - Brand: Gerber
    │   ├── Equipment: Stoccaggio stampi (storage)
    │   │   - Stampi rack dedicato
    │   └── Equipment: Sistema vuoto centralizzato (DEV-VACUUM-001)
    │
    ├── Work Center: Autoclave (WC-AUTOCLAVE-001)
    │   └── Equipment: Autoclave Italmatic (DEV-AUT-001)
    │       - Type: autoclave
    │       - Class: production
    │       - Capacity: 3 m³ chamber
    │       - Max temperature: 200°C
    │       - Max pressure: 7 bar
    │       - Thermocouples: 8 channels
    │
    ├── Work Center: Finitura (WC-FINISH-001)
    │   ├── Workstation: Cabina taglio CNC water-jet (WS-CUT-WJ-01)
    │   │   └── Equipment: Water-jet cutter (DEV-WJ-001)
    │   ├── Workstation: Banco smussatura (WS-DEBUR-01)
    │   │   - Aspirazione localizzata (CFRP dust)
    │   ├── Workstation: Foratura CNC (WS-DRILL-01)
    │   └── Workstation: Levigatura (WS-SAND-01)
    │
    ├── Work Center: Quality Control (WC-QC-CFRP-001)
    │   └── Workstation: NDT lab
    │       ├── Equipment: Ultrasonic C-scan (DEV-UT-001)
    │       │   - Brand: Olympus OmniScan
    │       │   - Type: ndt_scanner
    │       └── Equipment: CMM (DEV-CMM-001)
    │
    ├── Work Center: Verniciatura (WC-PAINT-001)
    │   ├── Cabina spray
    │   └── Forno verniciatura
    │
    └── Work Center: Imballaggio (WC-PACK-CFRP-001)
        └── Banco imballaggio custom
```

### 3.2 Recipes (Cure Cycles)

```yaml
RCP-CURE-EPOXY-180-001 (Cure cycle epossidica 180°C × 2h)
  Recipe version: v2 (approved)
  Device type: autoclave (DEV-AUT-001)
  Total duration: ~4.5 hours
  Phases:
    1. Pre-vacuum (30 min)
       - Vacuum: 1 bar
       - Pressure: ambient
       - Temperature: ambient
    2. Heating ramp (90 min)
       - Rate: 1.5°C/min
       - Vacuum: 1 bar
       - Pressure: ramp 0 → 6.5 bar at midpoint
       - Target temp: 180°C
    3. Dwell (120 min)
       - Temperature: 180°C ± 3°C
       - Pressure: 6.5 bar
       - Vacuum: 1 bar
    4. Cooling ramp (60 min)
       - Rate: -2°C/min
       - Until: < 60°C
    5. Depressurization (15 min)
       - Pressure: 6.5 → 0 bar (slow)
       - Open door
  
  Alarm conditions:
    - Temp deviation > ±5°C from target
    - Pressure deviation > ±0.3 bar
    - Vacuum loss > 50 mbar
```

### 3.3 Operators (skills required)

```yaml
OP-LAYUP-001 (Carlo Gialli)
  Skills: [LAYUP, CFRP_PREP, FORKLIFT]
  Default: WC-LAYUP-001

OP-AUTOCLAVE-001 (Marco Rossi)
  Skills: [AUTOCLAVE, CURE_CYCLE]
  Default: WC-AUTOCLAVE-001

OP-FINISH-001 (Anna Verdi)
  Skills: [FINISH_CFRP, CNC, SANDING]
  Default: WC-FINISH-001

OP-NDT-001 (Roberto Blu)
  Skills: [NDT, CMM_OPERATION, QC]
  Default: WC-QC-CFRP-001

OP-PAINT-001 (Giulia Bianchi)
  Skills: [PAINT, POLISHING]
  Default: WC-PAINT-001
```

---

## 4. Workflow — 11 Phase Complete

### Phase 1 — INBOUND: Ricezione & Stoccaggio refrigerato
```yaml
Phase: Inbound Logistics - Refrigerated
Type: inbound
Estimated duration: 30 min

Groups:
  - Group: material_reception
    Steps:
      1. [scan_qr] Scan rotolo prepreg da fornitore
      2. [verify_id] Verify CoA (Certificate of Analysis)
      3. [process] Register PrepregRoll entity
         - Set initial state: frozen
         - Set max_out_time_minutes: 43200 (30 days at room temp budget)
         - Calculate max_frozen_life_date from manufacture date
         attention_points:
           - "Verifica integrità imballaggio: nessun danno trasporto" (Quality)
      4. [logistics] Move rotolo to freezer (-18°C)
         attention_points:
           - "Mantenere catena del freddo: max 30 min fuori freezer" (Quality, critical)
      5. [scan_qr] Scan altri materiali (peel-ply, breather, etc.)
      6. [process] Register inventory
```

### Phase 2 — PRE-PRODUZIONE: Preparazione stampo
```yaml
Phase: Pre-production - Mold Preparation
Type: setup
Estimated duration: 3 hours

Groups:
  - Group: mold_setup
    Steps:
      1. [verify_tool] Locate mold MOLD-CARENA-YZF6-001 in storage
      2. [scan_qr] Scan mold barcode
      3. [verify_id] Verify mold status: available
      4. [verify_id] Check current cycles count vs lifetime
         - If > 90% lifetime: warning + supervisor approval required
         - If = 100%: BLOCK
      5. [logistics] Transport mold to lay-up area
      6. [quality_control] Visual inspection mold
         attention_points:
           - "Controllare graffi/danni superficie stampo" (Quality)
           - "Verificare integrità thermocouple ports" (Technical)
      7. [process] Pulizia profonda con solvente
      8. [process] Apply release agent (4-6 layers, with curing between)
         time_mode: manual-standard-time (60 min total)
         attention_points:
           - "Indossare DPI: maschera respiratore organico" (Safety)
           - "Applicare 4 mani con curing 10 min tra ogni applicazione" (Quality)
      9. [process] Final inspection (visual)
      10. [process] Mark mold as in_use, link to WO
```

### Phase 3 — PRE-PRODUZIONE: Picking prepreg + conditioning
```yaml
Phase: Pre-production - Prepreg Take-out
Type: setup
Estimated duration: 1 hour

Groups:
  - Group: prepreg_take_out
    Steps:
      1. [scan_qr] Scan prepreg roll in freezer
      2. [verify_id] Check out_time check
         - Validate: currentOutTimeMinutes < maxOutTimeMinutes
         - Validate: currentStorageState != 'expired'
         attention_points:
           - "Controllare out-time cumulativo prepreg" (Quality, critical)
      3. [process] Take out from freezer → record PrepregOutTimeRecord
         - State: frozen → out
         - Start timer
      4. [logistics] Move to lay-up area
      5. [process] Conditioning (rinvenimento) at room temperature
         time_mode: manual-standard-time (60-180 min)
         attention_points:
           - "Tempo rinvenimento minimo 60 min, max 240 min" (Quality)
      6. [process] Materials (peel-ply, breather, bagging) prep
      7. [logistics] Stage all materials at lay-up table
```

### Phase 4 — CORE PRODUZIONE: Taglio prepreg (CNC plotter)
```yaml
Phase: Core Production - Prepreg Cutting
Type: production
Estimated duration: 30 min

Groups:
  - Group: prepreg_cutting
    Steps:
      1. [load_recipe] Load nesting program (CAD/CAM optimized)
      2. [process] Load prepreg roll into plotter
      3. [device_run] Run CNC cutter (Gerber)
         time_mode: device-cycle-time (~20 min)
         attention_points:
           - "Verificare tracciato CNC: sequenza corretta plies" (Quality)
      4. [identification] Etichettare ogni ply tagliato
         - Number ply (1-6)
         - Orientation (0°, 45°, 90°)
      5. [logistics] Stack pliato per lay-up sequence
```

### Phase 5 — CORE PRODUZIONE: Stratificazione (lay-up manuale)
```yaml
Phase: Core Production - Lay-up
Type: production
Production mode: discrete (1 piece per cycle)
Estimated duration: 2-3 hours per piece

Groups:
  - Group: layup_manual
    Steps:
      1. [identification] Scan mold + serial number assignment
      2. [process] Apply tack coat (light adhesive)
      3. [process] Position ply 1 (carbon 0°)
         attention_points:
           - "Orientamento fibre 0° secondo ply schema" (Quality, critical)
           - "Eliminare bolle aria con spatola" (Quality)
      4. [process] Compaction ply 1
      5. [identification] Log ply 1 placement (operator + timestamp)
      6. [process] Position ply 2 (carbon 45°)
      7. [process] Compaction ply 2
      8. [identification] Log ply 2
      9. [process] Position ply 3 (carbon 90°)
      ... (continue for all 6 plies)
      
      # Debulking every 3 plies
      15. [process] Apply temporary vacuum film
      16. [device_run] Vacuum debulking (1 bar, 20 min)
      17. [process] Remove debulking film
      
      # Continue plies
      ... (plies 4-6)
      
      # Insert installation
      27. [process] Position 4 metal inserts in cavities
      28. [process] Apply epoxy adhesive on inserts
      29. [process] Position closing plies on top of inserts
      
      # Final
      30. [quality_control] Visual inspection lay-up complete
      31. [process] Sign off lay-up (operator + supervisor)
```

### Phase 6 — VACUUM BAGGING
```yaml
Phase: Vacuum Bagging
Type: setup (preparation for autoclave)
Estimated duration: 45 min

Groups:
  - Group: vacuum_bagging
    Steps:
      1. [process] Apply peel-ply layer
      2. [process] Apply release film (perforated)
      3. [process] Apply breather/bleeder
      4. [process] Apply vacuum port connector
      5. [process] Sealant tape around perimeter
      6. [process] Apply bagging film
      7. [process] Press sealant to ensure full seal
      8. [process] Connect vacuum hose
      9. [device_run] Initial vacuum pull (1 bar)
         time_mode: device-cycle-time (60 sec)
      10. [quality_control] **Vacuum tightness test (CRITICAL)**
          - Stabilize 60 sec
          - Measure initial pressure
          - Wait 5 min
          - Measure final pressure
          - Pressure drop must be < 50 mbar
          - If FAIL: rework bagging
          attention_points:
            - "Test tenuta sacco vacuum: drop < 50 mbar" (Quality, critical)
            - "Failure = scrap intero pezzo se cure cycle iniziato" (Quality)
      11. [verify_id] Confirm test pass
      12. [identification] Tag mold+part with cure cycle reference
```

### Phase 7 — AUTOCLAVE CURING
```yaml
Phase: Autoclave Cure Cycle
Type: production (long-running)
Production mode: discrete (multiple parts per cycle possible)
Estimated duration: 4.5 hours

Groups:
  - Group: autoclave_setup
    Steps:
      1. [logistics] Transport mold+part to autoclave
      2. [process] Position on rack inside autoclave
      3. [process] Connect vacuum line (autoclave system)
      4. [process] Connect thermocouples (5-8 sensors on part)
         attention_points:
           - "Posizionare termocoppie su zone critiche pezzo" (Quality)
      5. [process] Close autoclave door
      6. [verify_id] Verify door sealed
  
  - Group: cure_cycle_run
    Steps:
      1. [load_recipe] Load recipe RCP-CURE-EPOXY-180-001
      2. [device_run] Start cure cycle
         time_mode: device-cycle-time (~4.5 hours)
         continuous_logging: every 30 sec (telemetry archive)
         monitoring:
           - Air temperature
           - Part temperatures (multiple thermocouples)
           - Chamber pressure
           - Vacuum level
           - Current phase (auto-detected)
      
      # Background monitoring (autonomous)
      # System logs telemetry every 30 sec
      # Alarms trigger if deviation > thresholds
      # Pieces auto-link to telemetry archive
      
      3. [device_main] Monitor cycle progression
         # Operator can do parallel work during dwell phase
         parallel_steps_allowed: true
         time_mode: device-cycle-time
      
      # Parallel steps (during long dwell phase)
      4. [parallel] Prepare next part on staging
         duration: variable
      5. [parallel] Maintenance vacuum bagging (other parts)
         duration: variable
      
  - Group: cure_completion
    Steps:
      1. [verify_id] Wait for cycle completion alarm
      2. [process] Wait door open (cooling to <60°C)
      3. [process] Disconnect thermocouples
      4. [process] Disconnect vacuum
      5. [logistics] Remove mold+part from autoclave
      6. [process] Allow further ambient cooling (30 min)
```

### Phase 8 — DEMOLDING & FINISHING
```yaml
Phase: Demolding & Finishing
Type: production
Estimated duration: 1.5 hours

Groups:
  - Group: demolding
    Steps:
      1. [process] Remove vacuum bagging materials
      2. [process] Remove peel-ply
      3. [process] Remove bleeder/breather
      4. [process] Extract part from mold
         attention_points:
           - "Usare cunei plastica per evitare graffi stampo" (Quality)
      5. [quality_control] Initial visual inspection part
      6. [logistics] Move part to finishing area
      7. [process] Mold → status: cleaning
      
  - Group: finishing
    Steps:
      1. [scan_qr] Scan part serial number
      2. [process] Sbavatura bordi (manual)
      3. [device_run] CNC water-jet trim (final shape)
         time_mode: device-cycle-time (15 min)
         attention_points:
           - "Aspirare polvere CFRP: tossica per inalazione" (Safety)
      4. [process] Drill mounting holes (4× M6)
         attention_points:
           - "Punte specifiche CFRP: evitare delaminazione" (Quality)
      5. [process] Smussatura bordi
      6. [process] Levigatura progressive (P400 → P800 → P1200)
      7. [quality_control] Visual check finitura
```

### Phase 9 — QUALITY CONTROL: NDT
```yaml
Phase: Quality Control - NDT
Type: quality_control
Estimated duration: 30 min per part

Groups:
  - Group: ndt_testing
    Steps:
      1. [scan_qr] Scan part serial
      2. [logistics] Position on UT scanner table
      3. [device_run] Run ultrasonic C-scan
         time_mode: device-cycle-time (15 min)
         output: scan image + defect map
      4. [quality_control] Review C-scan results
      5. [process] Annotate defects (if any)
         - Type: delamination / void / inclusion
         - Location: x,y coordinates
         - Severity: minor / major / critical
      6. [verify_id] Determine outcome
         - No defects: PASS
         - Minor defects: PASS with note
         - Major: REVIEW (quality manager)
         - Critical: SCRAP
      7. [process] Record NDTResult in system
         - testType: ultrasonic_c_scan
         - measurementsJson: ...
         - defectsFoundJson: ...
         - scanImageUrls: [...]
      
  - Group: dimensional_check (parallel possible during UT)
    Steps:
      1. [device_run] Position on CMM
         time_mode: device-cycle-time (10 min)
      2. [quality_control] Compare measurements vs CAD
      3. [process] Record dimensional NDTResult
      
  - Group: weight_check
    Steps:
      1. [process] Weigh part on precision scale
      2. [verify_id] Compare vs target (450g ± 20g)
      3. [process] Record weight result
```

### Phase 10 — POST-FINISHING (verniciatura + lucidatura)
```yaml
Phase: Post-Finishing
Type: production
Estimated duration: 6 hours (with curing waits)

Groups:
  - Group: painting
    Steps:
      1. [logistics] Move to paint booth
      2. [process] Surface preparation (cleaning, masking)
      3. [device_run] Apply primer (spray)
         attention_points:
           - "Cabina ventilata: indossare maschera A2P3" (Safety)
      4. [process] Curing primer (4 hours @ ambient OR 1h @ 60°C)
      5. [device_run] Apply clear coat layer 1
      6. [process] Curing layer 1 (4h ambient)
      7. [device_run] Apply clear coat layer 2 (final)
      8. [process] Curing layer 2 (4h ambient)
      
  - Group: polishing
    Steps:
      1. [process] Light sanding (P2000)
      2. [process] Polishing compound application
      3. [process] Buffing (rotary polisher)
      4. [quality_control] Final visual inspection (Class A surface)
         attention_points:
           - "Surface deve avere effetto wet-look uniforme" (Quality, critical)
```

### Phase 11 — OUTBOUND: Imballaggio + Spedizione
```yaml
Phase: Outbound Logistics
Type: outbound
Estimated duration: 30 min per piece

Groups:
  - Group: marking
    Steps:
      1. [print_label] Print product label
         content: code, lot, serial, date, customer
      2. [apply_label] Apply on inside of part (hidden area)
      
  - Group: packaging
    Steps:
      1. [select_empty_box] Select BTYPE-CARD-CFRP-001
      2. [process] Insert custom EVA foam protector
      3. [pack_into_box] Pack carena (1 per box, scan serial)
         capacity: 1 piece per box (fragile)
      4. [seal_box] Seal box + tamper-evident label
      5. [print_box_label] Print customer shipping label
      6. [apply_label] Apply on box exterior
      
  - Group: storage
    Steps:
      1. [logistics] Move box to magazzino PF (climatizzato)
      2. [identification] Allocate position (avoid UV exposure)
```

---

## 5. Attention Points specific to CFRP

```yaml
Critical (Safety):
  - "Indossare DPI: maschera respiratore organico per release agent" (Safety)
  - "Aspirare polvere CFRP: tossica per inalazione" (Safety, critical)
  - "Non manipolare CFRP rotto a mani nude" (Safety)

Critical (Quality):
  - "Out-time cumulativo prepreg < max budget" (Quality, blocking)
  - "Test tenuta vacuum bag < 50 mbar drop" (Quality, blocking)
  - "Orientamento fibre per ply secondo schema CAD" (Quality, critical)
  - "NDT C-scan obbligatorio per parti strutturali" (Regulatory)

Process:
  - "Tempo rinvenimento prepreg: 60-240 min" (Quality)
  - "Cure cycle telemetry deve completare senza alarmi" (Quality)
  - "Mold release agent ogni 25 cicli" (Quality)
```

---

## 6. WO Example

```yaml
WO-2026-0143
Customer: Yamaha Racing Italia
Item: ITM-FG-RFA-CFRP-001 (Carena posteriore YZF-R6)
Quantity target: 4 pieces (small batch)
Priority: high
Type: production

Planning:
  Planned start: 2026-04-28 06:00
  Planned end:   2026-04-29 18:00
  Total duration: ~36 hours (multi-shift)

Resource allocation:
  - Mold: MOLD-CARENA-YZF6-001 (cycles 247→251)
  - Autoclave: DEV-AUT-001 (4 pieces in 1 cycle = batch optimization)
  - UT scanner: DEV-UT-001
  - Operatori: Carlo (LAYUP) + Marco (AUTOCLAVE) + Anna (FINISH) + Roberto (NDT)

Material reservation:
  - Prepreg CF: 2 rolls (PREPREG-CF-T700-NN)
    Out-time check: roll #1 at 12d/30d (40%), roll #2 at 5d/30d (17%)
  - Inserts: 16 (4 per piece × 4)
  - Other ancillaries

Cure cycle planning:
  - 1 cycle for all 4 pieces (efficiency)
  - Estimated cycle: 4.5h

FAI:
  - First piece will undergo FAI before mass production approval
  - Tests: dimensional + UT + weight + visual + cure cycle traceability
```

---

## 7. KPIs expected

| KPI | Target | Notes |
|---|---|---|
| Pieces per autoclave cycle | ≥ 4 | Maximize equipment utilization |
| Cure cycle success rate | > 98% | Critical |
| Vacuum bag tightness pass rate | > 95% | First-time pass |
| NDT pass rate | > 95% | Acceptable for racing-grade |
| Prepreg utilization | > 90% | CAD nesting optimization |
| Mold lifetime utilization | 800 cycles | Long-term planning |
| Out-time compliance | 100% | No expired material used |

---

## 8. Cross-references

- Module: `extensions/CFRP_MODULE.md` (mold, prepreg, cure cycle, NDT detail)
- Module: `extensions/INDUSTRIAL_OPERATIONS.md` (long-running cycles, sample, FAI)

---

## 9. Change Log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-27 | Initial reference workflow v1.2 |

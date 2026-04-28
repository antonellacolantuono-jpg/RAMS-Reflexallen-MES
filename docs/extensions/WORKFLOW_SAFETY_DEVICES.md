# WORKFLOW_SAFETY_DEVICES — Extension v1.0

> **Type**: Reference Workflow (Reflexallen Safety Devices line)
> **Parent**: `MASTER_SPECIFICATION.md` v1.2
> **Status**: Reference for seed data + demo
> **Last updated**: 2026-04-27

---

## 1. Concept

Reference workflow for Reflexallen Safety Devices production. The flow combines:
- **Continuous serigrafia stampa** (high-volume)
- **Laminazione** pellicola retroriflettente su substrato
- **Die-cutting** sagomato
- **ECE-R104 compliance testing**

Workflow modeled: **Production of pannello posteriore camion ECE-R104 (yellow/red)**

---

## 2. Product Specifications

### 2.1 Product details

```
Item: Pannello posteriore camion ECE-R104
Code: ITM-FG-RFA-SAFE-001
Type: finished_good
Customer: OEM autocarro / aftermarket

Specifications:
- External dimensions: 565 × 180 × 1 mm (L × W × thickness)
- Substrate: alluminio anodizzato 1.0 mm
- Pellicola retroriflettente: Tipo IV diamond grade
- Colors: Yellow + Red striped (alternating diagonal)
- Compliance: ECE-R104 (cert E3-104R-001234/2026)
- Mounting: 4 holes M6
- Edge: rolled / smussato
```

### 2.2 BOM

```yaml
ITM-FG-RFA-SAFE-001 (Pannello posteriore ECE-R104)
├── ITM-RAW-FILM-DG-Y-001 (Film diamond grade yellow)            — 0.06 m² per piece
├── ITM-RAW-FILM-DG-R-001 (Film diamond grade red)               — 0.06 m² per piece
├── ITM-RAW-ALU-1MM-001 (Lamiera alluminio 1mm)                  — 0.10 m² per piece
├── ITM-RAW-INK-BLACK-001 (Inchiostro serigrafico nero)          — 5 ml per piece
├── ITM-RAW-PRIMER-LAM-001 (Primer per laminazione)              — 2 ml per piece
├── ITM-CONS-MARK-INK-001 (Inchiostro marcatura ECE)             — minimal
└── ITM-CONS-PROTECT-FILM-001 (Pellicola protettiva post-prod)   — 0.10 m² per piece
```

### 2.3 Active homologation certificate

```yaml
HOMOLOGATION CERTIFICATE
Code: ECE-104R-001234-2026
Number: 001234
Country: E3 (Italy)
Regulation: 104R
Item: ITM-FG-RFA-SAFE-001
Color: Yellow + Red
Film type: diamond_grade
Issued: 2024-03-15
Valid from: 2024-03-15
Valid until: 2027-03-15  (3-year validity)
Status: valid
```

### 2.4 Packaging

```yaml
Primary: 50 pieces per box
- Box: BTYPE-CARD-SAFE-001 (cartone double-wall + divisori carta velina)
- Layer protection between pieces (no scratching)
Secondary: 10 boxes per pallet (= 500 pieces)
Pallet: BTYPE-PLT-EUR80-001 (Euro pallet generico)
```

---

## 3. Equipment Configuration

### 3.1 Equipment hierarchy

```
Site: Stabilimento Reflexallen Modena
└── Area: Linea Safety Devices

    ├── Stoccaggio MP
    │   ├── Magazzino bobine pellicola (climatizzato)
    │   ├── Magazzino lamiere alluminio
    │   └── Armadio inchiostri (ATEX)
    │
    ├── Work Center: Stampa serigrafica (WC-PRINT-001)
    │   ├── Workstation: Macchina serigrafica multi-stazione
    │   │   └── Equipment: Sakurai Maestro (DEV-SCREEN-001)
    │   │       - Type: screen_printer
    │   │       - Stations: 4 (multi-color)
    │   │       - Capacity: 2000 pcs/h
    │   ├── Equipment: Tunnel UV (DEV-UV-001)
    │   │   - For ink curing
    │   └── Storage: Retini (screens dedicated)
    │
    ├── Work Center: Laminazione (WC-LAMINATE-001)
    │   ├── Equipment: Macchina laminatrice (DEV-LAMINATE-001)
    │   │   - Type: laminator
    │   │   - Capacity: 100 m/min
    │   └── Workstation: Banco preparazione substrato
    │
    ├── Work Center: Taglio (WC-CUT-SAFE-001)
    │   ├── Equipment: Pressa die-cutting (DEV-DIE-001)
    │   │   - Type: die_cutter
    │   │   - Cycle: 1 sec
    │   ├── Equipment: Water-jet (DEV-WJ-SAFE-001)
    │   │   - For custom shapes / small batches
    │   └── Storage: Fustelle dedicate
    │
    ├── Work Center: Quality Control (WC-QC-SAFE-001)
    │   ├── Equipment: Retroriflettometro (DEV-RETRO-001)
    │   │   - Type: reflectometer
    │   │   - Brand: Delta RetroSign 4500
    │   │   - Last calibration: 15/01/2026 (12-month validity)
    │   ├── Equipment: Spettrofotometro (DEV-COLOR-001)
    │   │   - Type: spectrophotometer
    │   │   - Brand: X-Rite eXact
    │   ├── Equipment: QUV chamber aging (DEV-QUV-001)
    │   │   - Capacity: 30 specimens
    │   └── Equipment: Salt-spray chamber (DEV-SALT-001)
    │
    ├── Work Center: Marcatura ECE (WC-MARK-001)
    │   └── Equipment: Stampa marcatura (DEV-PAD-PRINT-001)
    │       - Type: pad_printer (or laser)
    │
    └── Work Center: Imballaggio (WC-PACK-SAFE-001)
        └── Banco imballaggio
```

### 3.2 Recipes

```yaml
RCP-PRINT-2COLOR-001 (Stampa Yellow + Red)
  Recipe version: v3 (approved)
  Device: DEV-SCREEN-001
  Cycle time: 1.5 sec per piece (multi-station)
  Stations:
    Station 1: Yellow ink + screen YE-001
    Station 2: UV cure 1
    Station 3: Red ink + screen RD-001
    Station 4: UV cure 2
  Parameters:
    - Squeegee pressure: 3.5 bar
    - Squeegee angle: 75°
    - Squeegee speed: 100 mm/s
    - UV intensity: 700 mJ/cm²
    - Web tension: 50 N

RCP-LAMINATE-FILM-ALU-001 (Lamination film su alluminio)
  Device: DEV-LAMINATE-001
  Cycle: continuous (10 m/min)
  Parameters:
    - Roll pressure: 3.0 bar
    - Pre-heat temperature: 40°C
    - Tension: 30 N
    - Speed: 10 m/min

RCP-DIE-CUT-PANEL-001 (Die-cutting pannello)
  Device: DEV-DIE-001
  Cycle: 1 sec per piece
  Tool: Fustella dedicata FUST-PNL-565x180
  Parameters:
    - Press force: 50 ton
    - Stroke depth: 1.2 mm (cut + slight kiss)
```

### 3.3 Operators

```yaml
OP-PRINT-001 (Marco Rossi)
  Skills: [PRINT, SCREEN_PREP, UV_OPS]
  Default: WC-PRINT-001

OP-LAMINATE-001 (Luca Bianchi)
  Skills: [LAMINATE, ADHESION_TEST]
  Default: WC-LAMINATE-001

OP-DIECUT-001 (Anna Verdi)
  Skills: [DIECUT, CNC, FORKLIFT]
  Default: WC-CUT-SAFE-001

OP-QC-OPTICAL-001 (Sara Gialli)
  Skills: [QC_OPTICAL, REFLECTANCE_TEST, COLORIMETRY, AGING_TEST]
  Default: WC-QC-SAFE-001

OP-MARK-001 (Paolo Verdi)
  Skills: [PRINT_PAD, ECE_MARKING]
  Default: WC-MARK-001
```

---

## 4. Workflow — 9 Phase Complete

### Phase 1 — INBOUND: Ricezione materiali
```yaml
Phase: Inbound Logistics
Type: inbound
Estimated duration: 30 min

Groups:
  - Group: material_reception
    Steps:
      1. [scan_qr] Scan bobina pellicola DG yellow
      2. [verify_id] Verify CoA fornitore
      3. [process] Register ReflectiveFilmRoll
         - Set initial state: stoccaggio
         - Calculate shelf life
         - Record nominal reflectance from CoA
         attention_points:
           - "Verifica integrità imballaggio bobina" (Quality)
           - "Pellicola sensibile a UV/calore eccessivo" (Quality)
      4. [scan_qr] Scan bobina pellicola DG red
      5. [verify_id] Verify red CoA
      6. [process] Register red roll
      7. [scan_qr] Scan pallet lamiere alluminio
      8. [verify_id] Verify alluminio thickness/temper
      9. [logistics] Move materiali a magazzino climatizzato
```

### Phase 2 — PRE-PRODUCTION: Setup macchine
```yaml
Phase: Setup
Type: setup
Estimated duration: 1 hour

Groups:
  - Group: skills_check
    Steps:
      - Verify operator PRINT skill
      - Verify operator LAMINATE skill
      - Verify operator QC_OPTICAL skill
      
  - Group: bom_check
    Steps:
      - Scan film yellow lotto + verify qty
      - Scan film red lotto + verify qty
      - Scan alluminio lotto + verify qty
      - Verify primer/inks available
  
  - Group: homologation_check
    Steps:
      1. [verify_id] Verify ECE certificate active for ITM-FG-RFA-SAFE-001
         - Status: valid (NOT expired/expiring_soon < 30 days)
         - If expired: BLOCK production
         attention_points:
           - "Omologazione ECE-104R deve essere valida" (Regulatory, blocking)
      2. [process] Lock certificate reference for this WO
  
  - Group: tooling_setup
    Steps:
      1. [verify_tool] Verify retini serigrafici (yellow + red)
         - If wear limit: replace before WO
      2. [verify_tool] Verify fustella (die-cutter tool)
      3. [process] Mount retini on screen printer
      4. [process] Mount fustella on press
      5. [process] Test alignment con dummy piece
  
  - Group: device_setup
    Steps:
      1. [load_recipe] Load print recipe RCP-PRINT-2COLOR-001
      2. [load_recipe] Load lamination recipe
      3. [load_recipe] Load die-cut recipe
      4. [device_run] Power on UV tunnel + warmup
      5. [device_run] Verify retroriflettometro calibration current
         - Check last calibration < 12 months ago
         - If expired: BLOCK QC phase
  
  - Group: first_piece (FAI)
    Steps:
      1. [process] Run first complete piece
      2. [quality_control] Visual inspection
      3. [quality_control] Reflectance test (sample)
      4. [quality_control] Colorimetry test
      5. [process] FAI initiation
      6. [verify_id] Quality manager approval → unblock production
```

### Phase 3 — CORE PRODUCTION: Stampa serigrafica
```yaml
Phase: Core Production - Screen Printing
Type: production
Production mode: continuous (high-volume printing)
Estimated duration: ~3 hours for 500 pieces

Groups:
  - Group: print_batch
    Steps:
      1. [process] Load bobine on screen printer
      2. [device_run] Start continuous print run
         time_mode: continuous
         recipe: RCP-PRINT-2COLOR-001
         continuous_logging: every 5 min
         attention_points:
           - "Monitorare consumo inchiostri: rabbocco se < 30%" (Technical)
           - "Verificare allineamento yellow/red ogni 30 min" (Quality)
      3. [process] Monitor print quality during run
         - Operator visual checks every 50 pieces
      4. [process] UV curing tunnel (inline, automatic)
      5. [process] Wind printed roll to take-up reel
      6. [device_run] Stop press at planned quantity (500 pieces)
      7. [process] Cut & label printed reel
      8. [logistics] Move to laminazione station
```

### Phase 4 — LAMINATION
```yaml
Phase: Lamination
Type: production
Production mode: continuous
Estimated duration: ~50 min for 500 pieces

Groups:
  - Group: lamination
    Steps:
      1. [process] Mount alluminio coil on laminator (input)
         attention_points:
           - "Verificare pulizia alluminio: alcol isopropilico" (Quality)
      2. [process] Mount stamped roll on laminator (input)
      3. [process] Apply primer su alluminio
      4. [device_run] Start lamination run
         time_mode: continuous
         recipe: RCP-LAMINATE-FILM-ALU-001
         continuous_logging: every 1 min
         monitoring: temperature, pressure, speed, tension
      5. [process] Inspection rolls visually
         - Check for bubbles, misalignment
      6. [device_run] Stop laminator at quantity
      7. [process] Wind laminated reel
  
  - Group: adhesion_test (sample)
    Steps:
      1. [process] Cut sample from end of run
      2. [quality_control] Cross-cut test (ASTM D3359)
         - Make 6×6 grid cuts
         - Apply tape, peel off
         - Classify: 5B (best) → 0B (worst)
         attention_points:
           - "Adhesion classification ≥ 4B richiesta" (Quality, blocking)
      3. [process] Record CrossCutAdhesionTest
      4. [verify_id] Validate result before proceeding
         - If < 4B: STOP production, investigate
```

### Phase 5 — DIE-CUTTING (sagomato)
```yaml
Phase: Die-Cutting
Type: production
Production mode: discrete (fixed multi-output: 1 stroke = 1 piece)
Estimated duration: ~10 min for 500 pieces

Groups:
  - Group: die_cutting
    Steps:
      1. [process] Load laminated reel into press
      2. [device_run] Run die-cutter
         time_mode: device-cycle-time (1 sec/piece)
         multi_output_type: fixed (1:1)
         recipe: RCP-DIE-CUT-PANEL-001
         continuous_logging: counting only
      3. [process] Auto-eject pieces to bin
      4. [process] Sgrossatura sfridi (manual)
      5. [logistics] Move pieces to QC station
```

### Phase 6 — QUALITY CONTROL: Reflectance + Colorimetry
```yaml
Phase: Quality Control
Type: quality_control
Production mode: discrete (sample-based testing)
Estimated duration: ~30 min for 500 pieces

Groups:
  - Group: visual_inspection
    Steps:
      1. [quality_control] Visual check 100% pieces
         - Pellicola integrity
         - Print quality (no smudges)
         - Edge finish
         - Bubbles in lamination
  
  - Group: reflectance_sampling
    Steps:
      1. [process] Take samples (5% of batch = 25 pieces)
      2. [device_run] For each sample: reflectance test
         time_mode: device-cycle-time (30 sec each)
         recipe: ECE-R104 measurement protocol
         instrument: DEV-RETRO-001
      3. [process] Record measurements per color (yellow, red)
      4. [verify_id] Classify each result
         - pass / marginal / fail per ECE-R104 thresholds:
           - Yellow: >= 175 cd/lx/m²
           - Red: >= 60 cd/lx/m²
      5. [process] Compute lot statistics (avg, min, max, std dev)
      6. [verify_id] Validate lot
         - All samples pass: lot APPROVED
         - Marginal results: QC manager review
         - Fail results: lot held for investigation
         attention_points:
           - "Reflectance fail = lot blocked, no shipping" (Regulatory, critical)
           - "Marginal richiede approvazione QC manager" (Quality)
  
  - Group: colorimetry_sampling
    Steps:
      1. [process] Same samples (5%)
      2. [device_run] Spectrophotometer measurement
         time_mode: device-cycle-time (15 sec each)
         instrument: DEV-COLOR-001
      3. [process] Compute ΔE vs reference per color
      4. [verify_id] Validate ΔE < 3.0 acceptable
  
  - Group: aging_specimen
    Steps:
      1. [process] Take 2 specimens for aging
      2. [process] Register AgingTestSpecimen
         - testType: quv_uv_exposure
         - plannedDurationHours: 1000
      3. [logistics] Place in QUV chamber DEV-QUV-001
      4. [process] Schedule periodic checks (every 168h)
         # Test runs in background for ~6 weeks
         # Periodic checks logged separately
```

### Phase 7 — ECE Marking + Etichettatura
```yaml
Phase: ECE Marking
Type: outbound
Estimated duration: ~10 min for batch

Groups:
  - Group: marking_ece
    Steps:
      1. [verify_id] Verify ECE certificate still valid
      2. [process] Generate marking string per HomologationService
         - Format: E{country}-104R-{number}/{year}
         - Example: E3-104R-001234/2026
         attention_points:
           - "Marcatura senza certificato attivo è proibita" (Regulatory, blocking)
      3. [device_run] Pad-printer apply marking on each piece
         time_mode: device-cycle-time (2 sec/piece)
      4. [verify_id] Visual check marcatura legibility (sample)
      5. [process] Apply protective film over marking area
  
  - Group: customer_label
    Steps:
      1. [print_label] Print customer label (lot, qty, date)
      2. [apply_label] Apply on each piece (back side)
```

### Phase 8 — OUTBOUND: Imballaggio
```yaml
Phase: Outbound - Packaging
Type: outbound
Estimated duration: ~30 min for 500 pieces

Auto-generated by rule #7 (Box Packaging)

Groups:
  - Group: packaging
    Steps:
      1. [select_empty_box] Select BTYPE-CARD-SAFE-001
         filter: status='empty', type=CARD-SAFE
      2. [process] Insert paper divider on bottom
      3. [pack_into_box] Pack pannello (1 per layer)
         capacity: 50 pieces per box
         repeat: until full
         attention_points:
           - "Inserire carta velina tra pezzi" (Quality)
      4. [process] Insert top divider
      5. [validate_box_capacity] Confirm 50 pieces
      6. [seal_box] Seal box (tape + label)
      7. [print_box_label] Print box label
         content: customer, qty, ECE cert ref, lot
      8. [apply_label] Apply on top + side
      
  - Group: palletize
    Steps:
      1. [palletize_box] Stack 10 boxes on Euro pallet
      2. [process] Apply stretch wrap
      3. [print_label] Print pallet label
      4. [apply_label] Apply on pallet
```

### Phase 9 — OUTBOUND: Stoccaggio
```yaml
Phase: Outbound - Storage
Type: outbound

Groups:
  - Group: storage
    Steps:
      1. [logistics] Move pallet to magazzino PF
      2. [identification] Allocate position
         attention_points:
           - "Magazzino climatizzato: protezione UV" (Quality)
      3. [verify_id] Confirm location scan
      4. [process] Mark lot READY for shipping
```

### Phase 10 (parallel/asynchronous) — Aging Tests Tracking
```yaml
Phase: Aging Tests (long-running, background)
Type: quality_control (asynchronous)
Estimated duration: 6 weeks per QUV cycle

Groups:
  - Group: periodic_check
    Triggers: cron job every 168 hours (1 week)
    Steps:
      1. [logistics] Operator removes specimen from chamber
      2. [device_run] Reflectance measurement
      3. [device_run] Colorimetry measurement
      4. [process] Compare vs initial values
      5. [process] Update AgingTestSpecimen.periodicChecksJson
      6. [logistics] Return specimen to chamber
      7. [verify_id] Continue or complete
         - If completion criteria met: complete test
         - If unexpected degradation: alert quality manager
```

---

## 5. Attention Points specific to Safety Devices

```yaml
Critical (Regulatory):
  - "Omologazione ECE-104R deve essere valida prima di production" (Regulatory, blocking)
  - "Reflectance fail = lot blocked, no shipping" (Regulatory, blocking)
  - "Marcatura senza certificato attivo è proibita" (Regulatory, blocking)

Critical (Quality):
  - "Adhesion test ≥ 4B richiesta" (Quality, blocking)
  - "Marginal reflectance richiede approvazione QC manager" (Quality)
  - "Verificare allineamento yellow/red stampa" (Quality)

Process:
  - "Pulizia alluminio prima di laminazione: alcol isopropilico" (Quality)
  - "Cabina ventilata stampa: solventi VOC" (Safety)
  - "Magazzino PF climatizzato: protezione UV degradazione pellicole" (Quality)
```

---

## 6. WO Example

```yaml
WO-2026-0144
Customer: Iveco Italia
Item: ITM-FG-RFA-SAFE-001 (Pannello posteriore ECE-R104)
Quantity target: 500 pieces
Priority: normal
Type: production

Planning:
  Planned start: 2026-04-29 06:00
  Planned end:   2026-04-29 18:00
  Total duration: ~12 hours (single shift)

Resource allocation:
  - Screen printer: DEV-SCREEN-001
  - Laminator: DEV-LAMINATE-001
  - Die-cutter: DEV-DIE-001
  - Reflectometer: DEV-RETRO-001
  - Operatori: Marco (PRINT) + Luca (LAMINATE) + Anna (DIECUT) + Sara (QC) + Paolo (MARK)

Material reservation:
  - Film yellow: 30 m² from FILM-DG-Y-NN
  - Film red: 30 m² from FILM-DG-R-NN
  - Alluminio: 50 m² from ALU-1MM-NN
  - Inks, primers

Box reservation:
  - 10x BTYPE-CARD-SAFE-001 (50 pcs each)
  - 1x BTYPE-PLT-EUR80-001 (Euro pallet)

Homologation:
  - Active certificate: ECE-104R-001234-2026 (valid until 2027-03-15)
  - Marking format: E3-104R-001234/2026

Aging:
  - 2 specimens to QUV chamber (1000h test)
```

---

## 7. KPIs expected

| KPI | Target | Notes |
|---|---|---|
| Print throughput | 2000 pcs/h | Recipe target |
| Lamination first-pass | > 98% | Adhesion |
| Die-cut yield | > 99.5% | Mature process |
| Reflectance pass rate | > 99% | Critical |
| Colorimetry pass rate | > 99% | ΔE within spec |
| Adhesion test pass rate | > 99% | ≥ 4B |
| Aging test 1000h pass rate | > 95% | Long-term durability |
| Cert compliance | 100% | No expired markings |

---

## 8. Cross-references

- Module: `extensions/SAFETY_DEVICES_MODULE.md` (reflectance, ECE, lamination detail)
- Module: `extensions/INDUSTRIAL_OPERATIONS.md` (sample, FAI, continuous mode)

---

## 9. Change Log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-27 | Initial reference workflow v1.2 |

# WORKFLOW_PNEUMATIC_AIR — Extension v1.0

> **Type**: Reference Workflow (Reflexallen Pneumatic Air line)
> **Parent**: `MASTER_SPECIFICATION.md` v1.2
> **Status**: Reference for seed data + demo
> **Last updated**: 2026-04-27

---

## 1. Concept

This document is a **reference workflow** for Reflexallen Pneumatic Air production. It serves as:
- **Seed data** for the MES demo
- **Operational example** for how to model real production
- **Validation case** for the architecture

Workflow modeled: **Production of multi-layer pneumatic tube 12mm × 2m for truck braking system**

---

## 2. Product Specifications

### 2.1 Product details

```
Item: Tubo pneumatico multistrato 12mm × 2m
Code: ITM-FG-RFA-PNE-001
Type: finished_good
Customer: OEM autocarro (e.g., DAF, Iveco)

Specifications:
- External diameter: 12.0 ± 0.1 mm
- Internal diameter: 8.0 ± 0.1 mm
- Length: 2000 ± 5 mm
- Working pressure: 10 bar
- Burst pressure: > 30 bar
- Operating temperature: -40°C to +100°C
- Standard compliance: ISO 7628, DIN 73378
```

### 2.2 Multi-layer composition

```
Layer 1 (Internal, fluid contact):  PA12 puro                    1.0 mm
Layer 2 (Barrier):                   EVOH                        0.3 mm
Layer 3 (External, structural):      PA12 + cariche + UV stab.   0.7 mm
                                     ─────────────────────────────────
Total wall thickness:                                            2.0 mm
```

### 2.3 BOM

```yaml
ITM-FG-RFA-PNE-001 (Tubo pneumatico multistrato 12mm × 2m)
├── ITM-RAW-PA12-001 (Granuli PA12)             — 0.085 kg per piece
├── ITM-RAW-EVOH-001 (Granuli EVOH)             — 0.012 kg per piece
├── ITM-RAW-PA12CR-001 (PA12 + cariche)         — 0.073 kg per piece
├── ITM-RAW-UVSTAB-001 (Master batch UV)        — 0.005 kg per piece
├── ITM-COMP-RACC-12-A-001 (Raccordo lato A)    — 1 piece
├── ITM-COMP-RACC-12-B-001 (Raccordo lato B)    — 1 piece
└── ITM-CONS-INK-LASER-001 (Marcatura laser)    — consumable
```

### 2.4 Packaging

```
Primary: 50 pieces per box BTYPE-PLT-RFA-001 (returnable Reflexallen pallet 80×120)
Secondary: 20 boxes per pallet
Total: 1000 pieces per pallet (typical OEM order)
```

---

## 3. Equipment Configuration

### 3.1 Equipment hierarchy

```
Site: Stabilimento Reflexallen Modena
└── Area: Linea Pneumatic Air

    ├── Work Center: Linea Estrusione (WC-EXT-PNE-01)
    │   ├── Workstation: Estrusore principale
    │   │   ├── Equipment: Krauss Maffei MKE-90 (DEV-EXT-001)
    │   │   │   - Type: extruder
    │   │   │   - Class: production
    │   │   │   - Capacity: 100 kg/h max
    │   │   ├── Tool: Testa di co-estrusione 3 strati (TOOL-HEAD-12-3L-001)
    │   │   │   - Compatible items: ITM-FG-RFA-PNE-001
    │   │   │   - Max cycles: 500 hours
    │   │   └── Tool: Calibratore 12mm (TOOL-CAL-12-001)
    │   ├── Workstation: Bagno raffreddamento
    │   │   └── Equipment: Vasca raffreddamento (DEV-COOL-001)
    │   ├── Workstation: Marcatura inline
    │   │   └── Equipment: Marcatore laser (DEV-LASER-001)
    │   └── Workstation: Trazione + Taglio
    │       ├── Equipment: Cingoli trazione (DEV-PULL-001)
    │       └── Equipment: Taglierina volo (DEV-CUT-001)
    │
    ├── Work Center: Banco Assemblaggio (WC-ASSY-PNE-01)
    │   └── Workstation: Banco WS-ASSY-01
    │       ├── Equipment: Crimpatrice servo-elettrica (DEV-CRIMP-001)
    │       └── Tool: Mors crimpatura 12mm (TOOL-CRIMP-12-001)
    │
    ├── Work Center: Test funzionali (WC-TEST-PNE-01)
    │   └── Workstation: Banco leak test
    │       ├── Equipment: ATEQ Premier i (DEV-LEAK-001)
    │       │   - Type: leak_tester
    │       │   - Class: test
    │       └── Equipment: Stampante etichette Zebra (DEV-PRINT-001)
    │
    └── Work Center: Imballaggio (WC-PACK-PNE-01)
        └── Workstation: Banco imballaggio
            └── Equipment: Sigillatrice (DEV-SEAL-001)
```

### 3.2 Recipes

```yaml
RCP-EXT-PA12-12-001 (Estrusione Tubo PA12 12mm)
  Recipe version: v3 (approved)
  Device type: extruder (DEV-EXT-001)
  Cycle time: continuous
  Parameters:
    - Temp_zone1: 240°C ± 5°C (alimentazione)
    - Temp_zone2: 245°C ± 5°C (compressione)
    - Temp_zone3: 250°C ± 5°C (omogeneizzazione)
    - Temp_zone4: 255°C ± 5°C
    - Temp_head:  260°C ± 5°C
    - Screw_speed: 50 RPM
    - Pressure_max: 200 bar
    - Pull_speed: 15 m/min
    - Cooling_water_temp: 18°C ± 2°C
  Standards: PA12 nominal melt 220-260°C

RCP-CRIMP-12-001 (Crimpatura raccordi 12mm)
  Device type: crimping_machine (DEV-CRIMP-001)
  Cycle time: 8 sec
  Parameters:
    - Force_target: 25.0 ± 1.0 kN
    - Crimp_diameter: 11.5 ± 0.05 mm
    - Hold_time: 2 sec
    - Force_profile: linear ramp 0→25 kN in 2 sec

RCP-LEAK-PNE-12-001 (Leak Test 6 bar)
  Recipe version: v2 (approved)
  Device type: leak_tester (DEV-LEAK-001)
  Cycle time: 45 sec
  Parameters:
    - Pressure_test: 6.0 bar ± 0.1
    - Stabilization_time: 5 sec
    - Hold_time: 30 sec
    - Leak_threshold: 0.5 mbar/min (max 1.0)
  Standards: ECE-R110 compliant
```

### 3.3 Operators

```yaml
OP-EXT-001 (Luigi Bianchi)
  - Code: OP-001
  - Skills: [EXT, ASSY]
  - Default workstation: Estrusore
  - Shift: Morning

OP-ASSY-001 (Mario Rossi)
  - Code: OP-002
  - Skills: [ASSY, TEST]
  - Default workstation: Banco assemblaggio
  - Shift: Morning

OP-TEST-001 (Anna Verdi)
  - Code: OP-003
  - Skills: [QC, TEST, FORKLIFT]
  - Default workstation: Banco leak test
  - Shift: Morning

OP-PACK-001 (Piero Neri)
  - Code: OP-004
  - Skills: [PACK, FORKLIFT]
  - Default workstation: Banco imballaggio
  - Shift: Morning
```

---

## 4. Workflow — 9 Phase Complete

### Phase 1 — INBOUND LOGISTICS
```yaml
Phase: Inbound Logistics
Type: inbound (cycle-based: false, one-time per WO)
Estimated duration: 30 min

Groups:
  - Group: Material reception
    Steps:
      1. [scan_qr] Scan pallet PA12 da fornitore
         action_type: scan_qr
         expected_format: ^LOT-PA12-\d{6}$
      2. [verify_id] Verify lotto su sistema (CoA approvato)
         action_type: verify_id
      3. [scan_qr] Scan pallet EVOH
      4. [verify_id] Verify EVOH lotto
      5. [scan_qr] Scan box raccordi
      6. [verify_id] Verify raccordi lotto
      7. [move] Move materiali a magazzino MP
         from: shipping_dock
         to: warehouse_mp
         transport: forklift
```

### Phase 2 — SETUP (auto-generated)
```yaml
Phase: Setup
Type: setup (auto-gen)
Estimated duration: 45 min

Groups (auto-generated by rules):
  - Group: skills_check
    Auto-gen rule: rule #1 (Skills & Login Verification)
    Steps:
      - Verify operator EXT skill (Luigi)
      - Verify operator ASSY skill (Mario)
      - Verify operator QC skill (Anna)
      
  - Group: bom_check
    Auto-gen rule: rule #2 (BOM Check Sequenziale)
    Steps:
      - Scan PA12 lotto + verify qty 8.5 kg
      - Scan EVOH lotto + verify qty 1.2 kg
      - Scan PA12+cariche lotto + verify qty 7.3 kg
      - Scan UV stab + verify qty 0.5 kg
      - Scan raccordi A box + verify qty 100
      - Scan raccordi B box + verify qty 100
      
  - Group: tooling_check
    Auto-gen rule: rule #3 (Tooling Check)
    Steps:
      - Verify presence testa co-estrusione (TOOL-HEAD-12-3L-001)
      - Verify calibratore 12mm
      - Verify mors crimpatura 12mm
      
  - Group: device_setup
    Auto-gen rule: rule #4 (Device Verify & Recipe Load)
    Steps:
      - Power on extruder (DEV-EXT-001)
      - Load recipe RCP-EXT-PA12-12-001 v3
      - Verify temperature ramp-up complete (15-30 min)
      - Power on leak tester
      - Load recipe RCP-LEAK-PNE-12-001 v2
      
  - Group: first_piece (auto-gen rule #5)
    Steps:
      - Run extruder for 5 minutes (transitorio)
      - Cut first piece
      - Visual inspection
      - Dimensional check (caliper)
      - Initiate FAI
      - Test crimping su sample
      - Test leak su sample
      - Quality manager approval
```

### Phase 3 — PRODUCTION: Estrusione
```yaml
Phase: Production - Estrusione
Type: production
Production mode: continuous
Estimated duration: ~2 hours (continuous run for 100 pieces)

Groups:
  - Group: assembly (continuous extrusion)
    Steps:
      1. [process] Load PA12 hopper
         attention_points:
           - "Verifica essiccazione PA12: < 0.1% umidità" (Quality)
      2. [process] Load EVOH hopper
      3. [process] Load PA12+cariche hopper
      4. [device_run] Start co-extrusion
         time_mode: continuous
         recipe: RCP-EXT-PA12-12-001
         attention_points:
           - "Verificare temperature zone: 240/245/250/255/260°C ±5°C" (Quality)
           - "Monitor pressione estrusione" (Technical)
           - "Indossare DPI: occhiali, guanti antitaglio" (Safety)
      5. [process] Continuous monitoring (15 m/min pull speed)
         continuous_logging: every 5 min
         tracked: temperature, pressure, dimensions (laser scan)
      6. [process] Cooling bath transit (10m, 18°C water)
      7. [process] Calibrazione finale + asciugatura
      8. [identification] Marcatura laser inline
         attention_points:
           - "Marcatura leggibile: REFLEXALLEN | REF12X2-PA12 | LOT | DATA" (Quality)
      9. [process] Trazione + misurazione encoder
      10. [process] Taglio volo a 2000 ± 5 mm
          multi_output_type: variable (1 run = N tubes)
      11. [logistics] Move tubi tagliati to WIP container WC-ASSY
          transport: trolley
```

### Phase 4 — PRODUCTION: Assemblaggio
```yaml
Phase: Production - Assembly
Type: production
Production mode: discrete (1 cycle = 1 piece)
Cycle time: ~30 sec per piece

Groups:
  - Group: assembly (manual)
    Steps:
      1. [identification] Scan tubo grezzo (serial)
      2. [quality_control] Visual check estremità
      3. [process] Svasatura interna lato A
      4. [process] Pulizia estremità con isopropanolo
      5. [process] Insert raccordo lato A
         attention_points:
           - "Spinta a battuta: verifica fine corsa" (Quality)
      6. [device_run] Crimpatura lato A
         recipe: RCP-CRIMP-12-001
         time_mode: device-cycle-time (8 sec)
         attention_points:
           - "Forza target 25 kN ±1 kN" (Quality)
      7. [process] Insert raccordo lato B
      8. [device_run] Crimpatura lato B
      9. [quality_control] Visual check assembly completo
      10. [logistics] Move tubo assemblato to test station
```

### Phase 5 — QUALITY CONTROL: Leak Test (con parallel steps)
```yaml
Phase: Quality Control - Leak Test
Type: quality_control
Production mode: discrete
Cycle time: ~50 sec per piece

Groups:
  - Group: device_execution (parallel)
    Steps:
      # Pre-steps (sequential, before device)
      1. [pre] Position tubo on fixture
         time_mode: manual-standard-time (8 sec)
         attention_points:
           - "Disinnestare aria compressa prima di scollegare fixture" (Safety)
      2. [pre] Connect pneumatic hoses
         time_mode: manual-standard-time (10 sec)
      
      # Device main step
      3. [device_main] Run leak test
         action_type: device_run
         recipe: RCP-LEAK-PNE-12-001
         time_mode: device-cycle-time (45 sec)
      
      # Parallel steps (during device cycle)
      4. [parallel] Apply serial label on previous part
         time_mode: while-device-running
         part_reference: previous
         duration: 12 sec
      5. [parallel] Prepare next part on staging
         time_mode: while-device-running
         part_reference: next
         duration: 20 sec
      6. [parallel] Fill QC checklist for previous
         time_mode: while-device-running
         part_reference: previous
         duration: 10 sec
      
      # Post-steps (sequential, after device)
      7. [post] Read leak result (OK/NOK)
         time_mode: manual-standard-time (3 sec)
      8. [post] Disconnect hoses
         time_mode: manual-standard-time (5 sec)
      9. [post] Remove tubo from fixture (or trigger recovery if NOK)
         time_mode: manual-standard-time (3 sec)
    
  Recovery flow (on NOK):
    - Stage 1: Diagnosis
      - Operator selects fault code:
        - "Hose connection loose"
        - "Sealing surface contaminated"
        - "Real defect (porosity)"
    - Stage 2-3: Up to 3 attempts
      - Re-check hose connections
      - Re-test
      - If still NOK after 3 attempts → scrap
    - Outcome:
      - rework_success → qtyRework++, qtyProduced++
      - scrap → qtyScrap++ (compensation triggers +1 to remaining)
```

### Phase 6 — OUTBOUND LOGISTICS: Etichettatura
```yaml
Phase: Outbound Logistics - Marcatura
Type: outbound
Estimated duration: ~10 sec per piece

Groups:
  - Group: identification
    Steps:
      1. [print_label] Print product label
         content: code, lot, date, ECE compliance, customer ref
      2. [apply_label] Apply on tubo
      3. [verify_id] Visual check label legibility
```

### Phase 7 — OUTBOUND LOGISTICS: Imballaggio
```yaml
Phase: Outbound Logistics - Packaging
Type: outbound
Estimated duration: ~30 sec per piece (packing)

Auto-generated by rule #7 (Box Packaging)
Generated when: phase outbound + item.boxingRequired = true

Groups:
  - Group: packaging
    Steps:
      1. [select_empty_box] Select empty BTYPE-PLT-RFA-001
         filter: status='empty', type=PLT-RFA
         attention_points:
           - "Box BTYPE-PLT-RFA-001 returnable: ispezionare prima di riusare" (Quality)
      2. [pack_into_box] Pack tubo (scan serial)
         capacity_check: hard block weight, warning units
         repeat: until 50 pieces or operator stops
      3. [validate_box_capacity] Check capacity reached
      4. [seal_box] Seal box
         seal_format: SEAL-{year}-{seq}
         attention_points:
           - "Verificare sigillo applicato e fotografare" (Regulatory)
      5. [print_box_label] Print customer label
      6. [apply_label] Apply on box
      7. [logistics] Move box to magazzino PF
```

### Phase 8 — OUTBOUND LOGISTICS: Stoccaggio
```yaml
Phase: Outbound Logistics - Storage
Type: outbound

Groups:
  - Group: logistics
    Steps:
      1. [move] Move pallet to warehouse_pf
      2. [identification] Allocate storage position via WMS
      3. [verify_id] Confirm position scan
```

### Phase 9 — TEARDOWN (auto-generated)
```yaml
Phase: Teardown
Type: teardown (auto-gen)
Estimated duration: 30 min

Groups (auto-generated by rule #6):
  - Group: device_reset
    Steps:
      1. [unload_recipe] Unload extruder recipe
      2. [process] Purge polimero (run with neutral material)
      3. [process] Cool down extruder
      4. [unload_recipe] Unload leak tester recipe
      
  - Group: cleanup
    Steps:
      1. [process] Clean extruder area
      2. [process] Clean assembly station
      3. [process] Clean test station
      
  - Group: documentation
    Steps:
      1. [process] Generate batch record PDF
         attention_points:
           - "Compilare batch record entro fine turno" (Regulatory)
      2. [process] Archive lotto data (15+ years retention)
      3. [process] Generate KPI summary
      
  - Group: tool_return
    Steps:
      1. [verify_tool] Inspect testa estrusore
      2. [logistics] Return testa to tool magazine
      3. [verify_tool] Inspect mors crimpatura
      4. [logistics] Return mors to tool magazine
```

---

## 5. Attention Points per Workflow

```yaml
Common across phases:
  - "Indossare DPI: occhiali, guanti antitaglio" (Safety)
  - "Compilare batch record entro fine turno" (Regulatory)

Phase-specific:
  Setup:
    - "Verifica essiccazione PA12 < 0.1%" (Quality, ad alta priorità)
  Production - Estrusione:
    - "Verificare temperatura zone: 240/245/250/255/260°C ±5°C" (Quality)
    - "Monitor pressione estrusione" (Technical)
  Production - Assembly:
    - "Spinta a battuta raccordo: verifica fine corsa" (Quality)
    - "Forza crimpatura 25 kN ±1 kN" (Quality)
  Test:
    - "Disinnestare aria compressa prima di scollegare fixture" (Safety)
    - "Marcatura laser visibile e leggibile" (Quality)
  Packaging:
    - "Box BTYPE-PLT-RFA-001 returnable: ispezionare prima di riusare" (Quality)
    - "Verificare sigillo applicato" (Regulatory)
```

---

## 6. WO Example (typical 100-piece order)

```yaml
WO-2026-0142
Customer: DAF Trucks
Item: ITM-FG-RFA-PNE-001
Quantity target: 100 pieces
Priority: high
Type: production

Planning:
  Planned start: 2026-04-28 06:00
  Planned end:   2026-04-28 14:00
  Total duration: 8 hours

Resource allocation:
  - Estrusore: DEV-EXT-001
  - Banco assembly: WS-ASSY-01
  - Leak tester: DEV-LEAK-001
  - Operatori: Luigi (EXT) + Mario (ASSY) + Anna (QC) + Piero (PACK)

Material reservation (soft):
  - PA12: 8.5 kg from LOT-PA12-260415-001
  - EVOH: 1.2 kg from LOT-EVOH-260410-002
  - Raccordi A: 100 from LOT-RACC-260420-003
  - Raccordi B: 100 from LOT-RACC-260420-003

Box reservation:
  - 2x BTYPE-PLT-RFA-001 (50 pcs each)

Setup phase will include FAI on first piece.
```

---

## 7. KPIs expected for this workflow

| KPI | Target | Notes |
|---|---|---|
| OEE | > 75% | Class A automotive |
| Cycle time per piece (full) | ~80 sec | extrusion + assembly + test + pack |
| FPY (First Pass Yield) | > 98% | Mature process |
| Scrap rate | < 1.5% | Acceptable for automotive |
| Leak test pass rate | > 99% | Critical |
| Burst test margin | > 3x | Safety factor |

---

## 8. Cross-references

- Module: `extensions/INDUSTRIAL_OPERATIONS.md` (multi-output cycles for extrusion)
- Module: `extensions/EQUIPMENT_MANAGEMENT.md` (extruder + leak tester management)
- Core: `MASTER_SPECIFICATION.md` § 12 (Box Management for outbound)

---

## 9. Change Log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-27 | Initial reference workflow v1.2 |

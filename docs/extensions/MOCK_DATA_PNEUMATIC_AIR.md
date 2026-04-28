# MOCK_DATA_PNEUMATIC_AIR — Concrete Seed Data v1.0

> **Type**: Concrete mock data for build/seed/demo
> **Source**: Extracted from `WORKFLOW_PNEUMATIC_AIR.md` + `WORKFLOW_PNEUMATIC_AIR_DETAILED.md`
> **Purpose**: Single fixture document — Claude Code can convert to seed.ts/fixtures.json
> **Last updated**: 2026-04-27

---

## How to read this document

Each section is **self-contained** and represents a database table.
Format: YAML-like with explicit IDs, foreign keys, and types.
Sequence: dependencies first (Plant → Skills → Operators → Items → Equipment → Recipes → Tools → BoxTypes → AttentionPoints → CauseCodes → Lots → Workflow → WO).

---

## 📌 1. PLANT (root entity)

```yaml
- id: PLT-RFA-MO-001
  code: PLT-RFA-MO
  name: Stabilimento Reflexallen Modena
  address: Via Reflexallen 1, 41123 Modena, Italy
  country: IT
  timezone: Europe/Rome
  active: true
```

---

## 📌 2. SKILLS (registry)

```yaml
- id: SKILL-EXT
  code: EXT
  name: Estrusione
  description: Operatore qualificato all'estrusione
  certificationRequired: true
  expirationMonths: 24

- id: SKILL-ASSY
  code: ASSY
  name: Assemblaggio raccordi
  certificationRequired: false
  expirationMonths: null

- id: SKILL-QC
  code: QC
  name: Controllo Qualità
  certificationRequired: true
  expirationMonths: 36

- id: SKILL-TEST
  code: TEST
  name: Test funzionali (leak test)
  certificationRequired: true
  expirationMonths: 24

- id: SKILL-PACK
  code: PACK
  name: Imballaggio e movimentazione
  certificationRequired: false

- id: SKILL-FORKLIFT
  code: FORKLIFT
  name: Carrellista
  certificationRequired: true
  expirationMonths: 60

- id: SKILL-WAREHOUSE
  code: WAREHOUSE
  name: Magazzino
  certificationRequired: false
```

---

## 📌 3. OPERATORS

```yaml
- id: OP-001
  code: OP-001
  badgeCode: OP-0001
  pin: "1234"  # hashed in real seed
  firstName: Luigi
  lastName: Bianchi
  fullName: Luigi Bianchi
  email: l.bianchi@reflexallen.it
  active: true
  plantId: PLT-RFA-MO-001
  skills:
    - skillId: SKILL-EXT
      certifiedAt: 2024-03-15
      expiresAt: 2026-03-15
      active: true
    - skillId: SKILL-WAREHOUSE
      certifiedAt: 2023-01-10
      active: true

- id: OP-002
  code: OP-002
  badgeCode: OP-0002
  pin: "5678"
  firstName: Mario
  lastName: Rossi
  fullName: Mario Rossi
  email: m.rossi@reflexallen.it
  active: true
  plantId: PLT-RFA-MO-001
  skills:
    - skillId: SKILL-ASSY
      certifiedAt: 2024-06-20
      active: true
    - skillId: SKILL-QC
      certifiedAt: 2024-09-01
      expiresAt: 2027-09-01
      active: true

- id: OP-003
  code: OP-003
  badgeCode: OP-0003
  pin: "9012"
  firstName: Anna
  lastName: Verdi
  fullName: Anna Verdi
  email: a.verdi@reflexallen.it
  active: true
  plantId: PLT-RFA-MO-001
  skills:
    - skillId: SKILL-QC
      certifiedAt: 2025-01-15
      expiresAt: 2028-01-15
      active: true
    - skillId: SKILL-TEST
      certifiedAt: 2025-02-01
      expiresAt: 2027-02-01
      active: true

- id: OP-004
  code: OP-004
  badgeCode: OP-0004
  pin: "3456"
  firstName: Piero
  lastName: Neri
  fullName: Piero Neri
  email: p.neri@reflexallen.it
  active: true
  plantId: PLT-RFA-MO-001
  skills:
    - skillId: SKILL-PACK
      certifiedAt: 2023-05-10
      active: true
    - skillId: SKILL-FORKLIFT
      certifiedAt: 2024-04-12
      expiresAt: 2029-04-12
      active: true
    - skillId: SKILL-WAREHOUSE
      certifiedAt: 2023-05-10
      active: true
```

---

## 📌 4. ITEMS (master data)

### 4.1 Finished Good

```yaml
- id: ITM-FG-RFA-PNE-001
  code: ITM-FG-RFA-PNE-001
  name: Tubo pneumatico multistrato 12mm × 2m
  description: |
    Tubo per impianto frenante camion
    3 strati: PA12 / EVOH / PA12+cariche+UV
    Diametro esterno 12mm, lunghezza 2m
  type: finished_good
  unitOfMeasure: piece
  weightKg: 0.180
  customerCode: REF12X2-PA12
  customerName: TruckMaker SpA
  imageUrl: /uploads/items/itm-fg-rfa-pne-001.jpg
  active: true
  plantId: PLT-RFA-MO-001
  metadata:
    layers: 3
    layer1Material: PA12 puro
    layer1ThicknessMm: 1.0
    layer2Material: EVOH
    layer2ThicknessMm: 0.3
    layer3Material: PA12+cariche+UV
    layer3ThicknessMm: 0.7
    workingPressure: 16 bar
    burstPressure: ">64 bar"
    operatingTempMin: -40
    operatingTempMax: 100
    standard: ISO 7628 / DIN 74324
```

### 4.2 Raw Materials

```yaml
- id: ITM-RAW-PA12-001
  code: ITM-RAW-PA12-001
  name: Granuli PA12 puro (food grade)
  type: raw_material
  unitOfMeasure: kg
  storageType: dry_room_temp
  shelfLifeMonths: 24
  active: true
  plantId: PLT-RFA-MO-001
  metadata:
    grade: PA12 nominal melt 220-260°C
    moistureLimit: "< 0.1%"
    requiresDrying: true

- id: ITM-RAW-EVOH-001
  code: ITM-RAW-EVOH-001
  name: Granuli EVOH (barrier layer)
  type: raw_material
  unitOfMeasure: kg
  storageType: dry_room_temp
  shelfLifeMonths: 24
  active: true
  plantId: PLT-RFA-MO-001

- id: ITM-RAW-PA12CR-001
  code: ITM-RAW-PA12CR-001
  name: PA12 + cariche + UV stabilizer
  type: raw_material
  unitOfMeasure: kg
  storageType: dry_room_temp
  shelfLifeMonths: 24
  active: true
  plantId: PLT-RFA-MO-001

- id: ITM-RAW-UVSTAB-001
  code: ITM-RAW-UVSTAB-001
  name: Master batch UV stabilizer
  type: raw_material
  unitOfMeasure: kg
  active: true
  plantId: PLT-RFA-MO-001
```

### 4.3 Components

```yaml
- id: ITM-COMP-RACC-12-A-001
  code: ITM-COMP-RACC-12-A-001
  name: Raccordo lato A 12mm (push-in male)
  type: component
  unitOfMeasure: piece
  active: true
  plantId: PLT-RFA-MO-001
  metadata:
    diameter: 12mm
    type: male push-in
    threadType: M16x1.5

- id: ITM-COMP-RACC-12-B-001
  code: ITM-COMP-RACC-12-B-001
  name: Raccordo lato B 12mm (quick-release female)
  type: component
  unitOfMeasure: piece
  active: true
  plantId: PLT-RFA-MO-001
  metadata:
    diameter: 12mm
    type: female quick-release
```

### 4.4 Consumables

```yaml
- id: ITM-CONS-INK-LASER-001
  code: ITM-CONS-INK-LASER-001
  name: Inchiostro pad printer (alternativa laser)
  type: consumable
  unitOfMeasure: ml
  active: true
  plantId: PLT-RFA-MO-001
```

---

## 📌 5. BOM (Bill of Materials)

```yaml
- id: BOM-PNE-001
  itemId: ITM-FG-RFA-PNE-001
  version: 1
  status: active
  effectiveFrom: 2026-01-01
  approvedBy: OP-PROCESS-ENG-001
  approvedAt: 2025-12-15
  components:
    - lineNumber: 1
      itemId: ITM-RAW-PA12-001
      quantity: 0.085
      unitOfMeasure: kg
      perUnit: 1
      isCritical: true
      notes: "Internal layer (fluid contact). Drying < 0.1% moisture required"
      
    - lineNumber: 2
      itemId: ITM-RAW-EVOH-001
      quantity: 0.012
      unitOfMeasure: kg
      perUnit: 1
      isCritical: true
      notes: "Barrier layer for fuel/gas resistance"
      
    - lineNumber: 3
      itemId: ITM-RAW-PA12CR-001
      quantity: 0.073
      unitOfMeasure: kg
      perUnit: 1
      isCritical: true
      notes: "External structural layer with UV stabilizer"
      
    - lineNumber: 4
      itemId: ITM-RAW-UVSTAB-001
      quantity: 0.005
      unitOfMeasure: kg
      perUnit: 1
      isCritical: false
      notes: "Master batch added to layer 3"
      
    - lineNumber: 5
      itemId: ITM-COMP-RACC-12-A-001
      quantity: 1
      unitOfMeasure: piece
      perUnit: 1
      isCritical: true
      notes: "End A — push-in male"
      
    - lineNumber: 6
      itemId: ITM-COMP-RACC-12-B-001
      quantity: 1
      unitOfMeasure: piece
      perUnit: 1
      isCritical: true
      notes: "End B — quick-release female"
      
    - lineNumber: 7
      itemId: ITM-CONS-INK-LASER-001
      quantity: 0.001
      unitOfMeasure: ml
      perUnit: 1
      isCritical: false
      isConsumable: true
      notes: "Laser marking (alternative consumable for pad printing fallback)"
```

---

## 📌 6. EQUIPMENT HIERARCHY (ISA-95)

### 6.1 Sites & Areas

```yaml
- id: AREA-PNE-001
  code: AREA-PNE-001
  name: Linea Pneumatic Air
  type: area
  parentType: site
  parentId: PLT-RFA-MO-001
  plantId: PLT-RFA-MO-001
  active: true
```

### 6.2 Work Centers

```yaml
- id: WC-EXT-PNE-01
  code: WC-EXT-PNE-01
  name: Linea Estrusione Pneumatic
  type: work_center
  parentType: area
  parentId: AREA-PNE-001
  plantId: PLT-RFA-MO-001
  active: true

- id: WC-ASSY-PNE-01
  code: WC-ASSY-PNE-01
  name: Banco Assemblaggio Pneumatic
  type: work_center
  parentType: area
  parentId: AREA-PNE-001
  active: true

- id: WC-TEST-PNE-01
  code: WC-TEST-PNE-01
  name: Test funzionali Pneumatic
  type: work_center
  parentType: area
  parentId: AREA-PNE-001
  active: true

- id: WC-PACK-PNE-01
  code: WC-PACK-PNE-01
  name: Imballaggio Pneumatic
  type: work_center
  parentType: area
  parentId: AREA-PNE-001
  active: true
```

---

## 📌 7. DEVICES (Equipment)

```yaml
- id: DEV-EXT-001
  code: DEV-EXT-001
  name: Estrusore Krauss Maffei MKE-90
  type: extruder
  manufacturer: Krauss Maffei
  model: MKE-90
  serialNumber: KM-90-2018-1234
  workCenterId: WC-EXT-PNE-01
  state: available
  installationDate: 2018-05-15
  capabilities:
    - co_extrusion_3_layers
    - max_temp_300C
    - screw_diameter_90mm
  active: true

- id: DEV-COOL-001
  code: DEV-COOL-001
  name: Vasca raffreddamento estrusione
  type: cooling_bath
  workCenterId: WC-EXT-PNE-01
  state: available
  active: true

- id: DEV-PULL-001
  code: DEV-PULL-001
  name: Cingoli trazione
  type: caterpillar_puller
  workCenterId: WC-EXT-PNE-01
  state: available
  active: true

- id: DEV-CUT-001
  code: DEV-CUT-001
  name: Taglierina volo
  type: flying_saw
  workCenterId: WC-EXT-PNE-01
  state: available
  active: true

- id: DEV-LASER-001
  code: DEV-LASER-001
  name: Marcatore laser inline
  type: laser_marker
  workCenterId: WC-EXT-PNE-01
  state: available
  active: true

- id: DEV-MEAS-001
  code: DEV-MEAS-001
  name: Scanner laser inline (diametro)
  type: laser_scanner
  workCenterId: WC-EXT-PNE-01
  state: available
  active: true

- id: DEV-CRIMP-001
  code: DEV-CRIMP-001
  name: Crimpatrice servo-elettrica
  type: crimping_machine
  workCenterId: WC-ASSY-PNE-01
  state: available
  capabilities:
    - force_feedback
    - max_force_50kN
  active: true

- id: DEV-LEAK-001
  code: DEV-LEAK-001
  name: Leak Tester ATEQ Premier i
  type: leak_tester
  manufacturer: ATEQ
  model: Premier i
  workCenterId: WC-TEST-PNE-01
  state: available
  capabilities:
    - pressure_decay_method
    - max_pressure_10bar
  active: true

- id: DEV-PRINT-001
  code: DEV-PRINT-001
  name: Stampante etichette Zebra
  type: label_printer
  manufacturer: Zebra
  workCenterId: WC-PACK-PNE-01
  state: available
  active: true

- id: DEV-SEAL-001
  code: DEV-SEAL-001
  name: Sigillatrice
  type: sealing_machine
  workCenterId: WC-PACK-PNE-01
  state: available
  active: true
```

---

## 📌 8. TOOLS

```yaml
- id: TOOL-HEAD-12-3L-001
  code: TOOL-HEAD-12-3L-001
  name: Testa di co-estrusione 3 strati 12mm
  type: extrusion_head
  compatibleItems: [ITM-FG-RFA-PNE-001]
  storageLocation: RACK-EXT-A-01
  status: available
  cyclesCount: 1245
  cyclesLimit: 5000
  wearStatus: normal  # < 50%
  lastCalibrationDate: 2026-01-15
  nextCalibrationDate: 2026-07-15

- id: TOOL-CAL-12-001
  code: TOOL-CAL-12-001
  name: Calibratore 12mm (vacuum sizing)
  type: calibrator
  compatibleItems: [ITM-FG-RFA-PNE-001]
  storageLocation: RACK-EXT-A-02
  status: available
  cyclesCount: 423
  cyclesLimit: 3000
  wearStatus: normal

- id: TOOL-CRIMP-12-001
  code: TOOL-CRIMP-12-001
  name: Mors crimpatura 12mm
  type: crimping_die
  compatibleItems: [ITM-FG-RFA-PNE-001]
  storageLocation: RACK-ASSY-B-01
  status: available
  cyclesCount: 8421
  cyclesLimit: 50000
  wearStatus: normal
```

---

## 📌 9. RECIPES

```yaml
- id: RCP-EXT-PA12-12-001
  code: RCP-EXT-PA12-12-001
  name: Estrusione Tubo PA12 12mm
  version: 3
  deviceTypeId: extruder
  status: approved
  effectiveFrom: 2025-09-01
  approvedBy: PROCESS-ENG-001
  parameters:
    temperatures:
      zone1: 240
      zone2: 245
      zone3: 250
      zone4: 255
      zone5: 260
      unit: celsius
    pressure: 80 bar
    screwSpeed: 35 rpm
    pullSpeed: 15 m/min
    standards: PA12 nominal melt 220-260°C
    transitorioMinutes: 5

- id: RCP-CRIMP-12-001
  code: RCP-CRIMP-12-001
  name: Crimpatura raccordi 12mm
  version: 1
  deviceTypeId: crimping_machine
  status: approved
  parameters:
    forceTargetKN: 25.0
    forceTolerance: 1.0
    cycleTimeSec: 8
    holdTimeSec: 2

- id: RCP-LEAK-PNE-12-001
  code: RCP-LEAK-PNE-12-001
  name: Leak Test 6 bar / 30 sec
  version: 2
  deviceTypeId: leak_tester
  status: approved
  parameters:
    testPressureBar: 6.0
    pressureToleranceBar: 0.1
    pressurizeTimeSec: 5
    stabilizeTimeSec: 5
    holdTimeSec: 30
    leakRateThresholdMbarMin: 0.5
    depressurizeTimeSec: 5
```

---

## 📌 10. BOX TYPES

```yaml
- id: BTYPE-PLT-RFA-001
  code: BTYPE-PLT-RFA-001
  name: Pallet Reflexallen 80×120 (returnable)
  category: returnable_pallet
  capacityUnits: 50
  capacityWeightKg: 25
  dimensions:
    lengthCm: 120
    widthCm: 80
    heightCm: 80
  isReturnable: true
  requiresInspection: true
  requiresSeal: false
  active: true
```

---

## 📌 11. ATTENTION POINTS

```yaml
- id: AP-DRY-PA12
  code: AP-DRY-PA12
  category: quality
  priority: high
  textIt: "Verifica essiccazione PA12: < 0.1% umidità"
  textEn: "Verify PA12 drying: < 0.1% moisture"

- id: AP-DRY-EVOH
  code: AP-DRY-EVOH
  category: quality
  priority: medium
  textIt: "Verifica essiccazione EVOH: < 0.05% umidità"
  textEn: "Verify EVOH drying: < 0.05% moisture"

- id: AP-MARK-LASER
  code: AP-MARK-LASER
  category: quality
  priority: high
  textIt: "Marcatura leggibile: REFLEXALLEN | REF12X2-PA12 | LOT | DATA"
  textEn: "Readable marking: REFLEXALLEN | REF12X2-PA12 | LOT | DATE"

- id: AP-CRIMP-FORCE
  code: AP-CRIMP-FORCE
  category: quality
  priority: high
  textIt: "Forza crimpatura: 25 ± 1 kN"
  textEn: "Crimp force: 25 ± 1 kN"

- id: AP-BOX-RETURNABLE
  code: AP-BOX-RETURNABLE
  category: quality
  priority: medium
  textIt: "Box BTYPE-PLT-RFA-001 returnable: ispezionare prima di riusare"
  textEn: "Box BTYPE-PLT-RFA-001 returnable: inspect before reuse"

- id: AP-PPE-EXTRUSION
  code: AP-PPE-EXTRUSION
  category: safety
  priority: high
  textIt: "DPI obbligatori: occhiali, guanti termici, mascherina"
  textEn: "Mandatory PPE: goggles, thermal gloves, mask"
```

---

## 📌 12. CAUSE CODES

```yaml
- id: CC-MAT-001
  code: MAT-001
  category: scrap
  bigLossCategory: defect
  textIt: "Difetto materiale (porosità, contaminazione)"
  textEn: "Material defect (porosity, contamination)"

- id: CC-PROC-001
  code: PROC-001
  category: scrap
  bigLossCategory: defect
  textIt: "Errore di processo (parametri fuori range)"
  textEn: "Process error (parameters out of range)"

- id: CC-OP-001
  code: OP-001
  category: scrap
  bigLossCategory: defect
  textIt: "Errore operatore"
  textEn: "Operator error"

- id: CC-DEV-001
  code: DEV-001
  category: scrap
  bigLossCategory: defect
  textIt: "Malfunzionamento device"
  textEn: "Device malfunction"

- id: CC-DOWN-EQUIP-001
  code: DOWN-EQUIP-001
  category: downtime
  bigLossCategory: breakdown
  textIt: "Guasto equipment"
  textEn: "Equipment breakdown"

- id: CC-DOWN-CHANGE-001
  code: DOWN-CHANGE-001
  category: downtime
  bigLossCategory: setup_adjustment
  textIt: "Cambio formato / setup"
  textEn: "Changeover / setup"
```

---

## 📌 13. SUPPLIER LOTS (raw materials inventory)

```yaml
- id: LOT-PA12-260415-001
  code: LOT-PA12-260415-001
  itemId: ITM-RAW-PA12-001
  supplierLotCode: ARK-PA12-260415-001
  supplierName: Arkema
  initialQuantityKg: 25.0
  currentQuantityKg: 25.0
  unitOfMeasure: kg
  qualityStatus: approved
  receivedAt: 2026-04-15
  manufactureDate: 2026-03-20
  expirationDate: 2028-03-20
  storageLocationId: WAREHOUSE-MP-A1
  coaUrl: /uploads/coa/lot-pa12-260415-001.pdf
  active: true

- id: LOT-EVOH-260410-002
  code: LOT-EVOH-260410-002
  itemId: ITM-RAW-EVOH-001
  supplierLotCode: KUR-EVOH-260410-002
  supplierName: Kuraray
  initialQuantityKg: 10.0
  currentQuantityKg: 10.0
  qualityStatus: approved
  receivedAt: 2026-04-10
  manufactureDate: 2026-02-28
  expirationDate: 2028-02-28
  storageLocationId: WAREHOUSE-MP-A2
  coaUrl: /uploads/coa/lot-evoh-260410-002.pdf

- id: LOT-PA12CR-260420-001
  code: LOT-PA12CR-260420-001
  itemId: ITM-RAW-PA12CR-001
  supplierLotCode: EMS-PA12CR-260420-001
  supplierName: EMS-Grivory
  initialQuantityKg: 20.0
  currentQuantityKg: 20.0
  qualityStatus: approved
  receivedAt: 2026-04-20
  storageLocationId: WAREHOUSE-MP-A3

- id: LOT-RACC-260420-003
  code: LOT-RACC-260420-003
  itemId: ITM-COMP-RACC-12-A-001
  supplierLotCode: STAUFF-RACC-260420-003
  supplierName: Stauff
  initialQuantityPieces: 500
  currentQuantityPieces: 500
  qualityStatus: approved
  receivedAt: 2026-04-20
  storageLocationId: WAREHOUSE-COMP-B1

- id: LOT-RACC-260420-004
  code: LOT-RACC-260420-004
  itemId: ITM-COMP-RACC-12-B-001
  supplierLotCode: STAUFF-RACC-260420-004
  supplierName: Stauff
  initialQuantityPieces: 500
  currentQuantityPieces: 500
  qualityStatus: approved
  receivedAt: 2026-04-20
  storageLocationId: WAREHOUSE-COMP-B2
```

---

## 📌 14. WORKFLOW DEFINITION

### 14.1 Workflow header

```yaml
- id: WF-PNE-12X2-001
  code: WF-PNE-12X2-001
  name: Workflow Tubo Pneumatico 12mm × 2m
  itemId: ITM-FG-RFA-PNE-001
  version: 1
  status: active
  effectiveFrom: 2026-01-01
  approvedBy: PROCESS-ENG-001
  approvedAt: 2025-12-20
  estimatedDurationMinutes: 280
  productionMode: mixed  # extrusion=continuous, others=discrete
```

### 14.2 Phases (8 main phases)

```yaml
phases:
  - id: PH-INBOUND-001
    workflowId: WF-PNE-12X2-001
    sequence: 1
    code: INBOUND
    name: Logistica Inbound
    category: inbound_logistics
    estimatedDurationMin: 30
    
  - id: PH-SETUP-001
    workflowId: WF-PNE-12X2-001
    sequence: 2
    code: SETUP
    name: Setup pre-produzione
    category: setup
    autoGenerated: true
    estimatedDurationMin: 45
    
  - id: PH-EXTRUSION-001
    workflowId: WF-PNE-12X2-001
    sequence: 3
    code: EXTRUSION
    name: Estrusione tubo
    category: production
    estimatedDurationMin: 120
    productionMode: continuous
    
  - id: PH-ASSEMBLY-001
    workflowId: WF-PNE-12X2-001
    sequence: 4
    code: ASSEMBLY
    name: Assemblaggio raccordi
    category: production
    estimatedDurationMin: 50
    productionMode: discrete
    
  - id: PH-LEAKTEST-001
    workflowId: WF-PNE-12X2-001
    sequence: 5
    code: LEAKTEST
    name: Quality Control - Leak Test
    category: quality_control
    estimatedDurationMin: 50
    
  - id: PH-MARKING-001
    workflowId: WF-PNE-12X2-001
    sequence: 6
    code: MARKING
    name: Marcatura ed etichettatura
    category: production
    estimatedDurationMin: 15
    
  - id: PH-PACKAGING-001
    workflowId: WF-PNE-12X2-001
    sequence: 7
    code: PACKAGING
    name: Imballaggio
    category: packaging
    estimatedDurationMin: 20
    
  - id: PH-TEARDOWN-001
    workflowId: WF-PNE-12X2-001
    sequence: 8
    code: TEARDOWN
    name: Teardown e documentazione
    category: teardown
    autoGenerated: true
    estimatedDurationMin: 30
```

### 14.3 Steps — Phase INBOUND (excerpt)

```yaml
inbound_steps:
  - id: STEP-INBOUND-001
    phaseId: PH-INBOUND-001
    sequence: 1
    code: SCAN_DDT
    name: Scan DDT da fornitore
    category: scan_qr
    actionType: scan_qr
    parameters:
      expectedFormat: "^DDT-\\d{6}$"
      validateAgainstPO: true
    requiredSkills: [SKILL-WAREHOUSE]
    estimatedDurationSec: 30
    
  - id: STEP-INBOUND-002
    phaseId: PH-INBOUND-001
    sequence: 2
    code: SCAN_LOT_PA12
    name: Scan pallet PA12
    category: scan_qr
    actionType: scan_qr
    parameters:
      expectedFormat: "^LOT-PA12-\\d{6}$"
      validateLotExists: true
    requiredSkills: [SKILL-WAREHOUSE]
    estimatedDurationSec: 15
    
  - id: STEP-INBOUND-003
    phaseId: PH-INBOUND-001
    sequence: 3
    code: VERIFY_PA12_LOT
    name: Verify PA12 lotto
    category: verify_id
    actionType: verify_id
    parameters:
      requireCoA: true
      defaultStatus: quarantine
    estimatedDurationSec: 60
    
  # ... steps 4-10 simili per EVOH, PA12+cariche, raccordi, store warehouse
```

### 14.4 Steps — Phase SETUP (Auto-generated, excerpt)

```yaml
setup_steps:
  - id: STEP-SETUP-001
    phaseId: PH-SETUP-001
    sequence: 1
    code: OPERATOR_LOGIN
    name: Operatori login HMI
    category: skill_check
    actionType: verify_skills
    parameters:
      requiredSkills: [SKILL-EXT, SKILL-ASSY, SKILL-QC, SKILL-TEST, SKILL-PACK]
    autoGenerated: true
    estimatedDurationSec: 60
    
  - id: STEP-SETUP-002
    phaseId: PH-SETUP-001
    sequence: 2
    code: BOM_SCAN_PA12
    name: Scan e verifica PA12
    category: bom_check
    actionType: scan_lot_verify
    parameters:
      itemId: ITM-RAW-PA12-001
      requiredQty: 8.5
      unit: kg
      autoReserve: true
    autoGenerated: true
    estimatedDurationSec: 60
    
  - id: STEP-SETUP-003
    phaseId: PH-SETUP-001
    sequence: 3
    code: BOM_SCAN_EVOH
    name: Scan e verifica EVOH
    category: bom_check
    actionType: scan_lot_verify
    parameters:
      itemId: ITM-RAW-EVOH-001
      requiredQty: 1.2
      unit: kg
    autoGenerated: true
    estimatedDurationSec: 60
    
  - id: STEP-SETUP-004
    phaseId: PH-SETUP-001
    sequence: 4
    code: BOM_SCAN_PA12CR
    name: Scan e verifica PA12 + cariche
    category: bom_check
    actionType: scan_lot_verify
    parameters:
      itemId: ITM-RAW-PA12CR-001
      requiredQty: 7.3
      unit: kg
    autoGenerated: true
    
  - id: STEP-SETUP-005
    phaseId: PH-SETUP-001
    sequence: 5
    code: BOM_SCAN_RACC_A
    name: Scan e verifica Raccordi A
    category: bom_check
    actionType: scan_lot_verify
    parameters:
      itemId: ITM-COMP-RACC-12-A-001
      requiredQty: 100
      unit: piece
    autoGenerated: true
    
  - id: STEP-SETUP-006
    phaseId: PH-SETUP-001
    sequence: 6
    code: BOM_SCAN_RACC_B
    name: Scan e verifica Raccordi B
    category: bom_check
    actionType: scan_lot_verify
    parameters:
      itemId: ITM-COMP-RACC-12-B-001
      requiredQty: 100
      unit: piece
    autoGenerated: true
    
  - id: STEP-SETUP-007
    phaseId: PH-SETUP-001
    sequence: 7
    code: TOOL_VERIFY_HEAD
    name: Verifica testa co-estrusione
    category: tool_check
    actionType: scan_tool_verify
    parameters:
      toolId: TOOL-HEAD-12-3L-001
      requireWearOk: true
    autoGenerated: true
    
  - id: STEP-SETUP-008
    phaseId: PH-SETUP-001
    sequence: 8
    code: TOOL_VERIFY_CAL
    name: Verifica calibratore 12mm
    category: tool_check
    actionType: scan_tool_verify
    parameters:
      toolId: TOOL-CAL-12-001
    autoGenerated: true
    
  - id: STEP-SETUP-009
    phaseId: PH-SETUP-001
    sequence: 9
    code: TOOL_VERIFY_CRIMP
    name: Verifica mors crimpatura
    category: tool_check
    actionType: scan_tool_verify
    parameters:
      toolId: TOOL-CRIMP-12-001
    autoGenerated: true
    
  - id: STEP-SETUP-010
    phaseId: PH-SETUP-001
    sequence: 10
    code: DEVICE_LOAD_RECIPE_EXT
    name: Carica recipe estrusore
    category: device_setup
    actionType: load_recipe
    parameters:
      deviceId: DEV-EXT-001
      recipeId: RCP-EXT-PA12-12-001
      version: 3
    autoGenerated: true
    
  - id: STEP-SETUP-011
    phaseId: PH-SETUP-001
    sequence: 11
    code: DEVICE_WARMUP_EXT
    name: Warm-up estrusore
    category: device_setup
    actionType: wait_warmup
    parameters:
      deviceId: DEV-EXT-001
      targetReached: true
      timeoutMinutes: 30
    autoGenerated: true
    estimatedDurationSec: 1800
    
  - id: STEP-SETUP-012
    phaseId: PH-SETUP-001
    sequence: 12
    code: FAI_FIRST_PIECE
    name: First Article Inspection (FAI)
    category: quality_control
    actionType: first_article_inspection
    parameters:
      requiredTests:
        - visual
        - dimensional
        - leak_test
      blockProductionUntilApproved: true
    autoGenerated: true
    estimatedDurationSec: 600
```

### 14.5 Steps — Phase EXTRUSION (excerpt)

```yaml
extrusion_steps:
  - id: STEP-EXT-001
    phaseId: PH-EXTRUSION-001
    sequence: 1
    code: LOAD_PA12_HOPPER
    name: Load PA12 hopper
    category: production
    actionType: process
    parameters:
      hopperTargetWeightKg: 8.5
      itemId: ITM-RAW-PA12-001
    requiredSkills: [SKILL-EXT]
    attentionPoints: [AP-DRY-PA12]
    estimatedDurationSec: 120
    
  - id: STEP-EXT-002
    phaseId: PH-EXTRUSION-001
    sequence: 2
    code: LOAD_EVOH_HOPPER
    name: Load EVOH hopper
    category: production
    actionType: process
    parameters:
      hopperTargetWeightKg: 1.2
      itemId: ITM-RAW-EVOH-001
    attentionPoints: [AP-DRY-EVOH]
    
  - id: STEP-EXT-003
    phaseId: PH-EXTRUSION-001
    sequence: 3
    code: LOAD_PA12CR_HOPPER
    name: Load PA12+cariche hopper
    category: production
    actionType: process
    parameters:
      hopperTargetWeightKg: 7.3
      itemId: ITM-RAW-PA12CR-001
    
  - id: STEP-EXT-004
    phaseId: PH-EXTRUSION-001
    sequence: 4
    code: START_EXTRUSION
    name: Avvio estrusione
    category: production
    actionType: device_execution
    parameters:
      deviceId: DEV-EXT-001
      recipeId: RCP-EXT-PA12-12-001
      productionMode: continuous
      transitorioMinutes: 5
      logIntervalSec: 300
    estimatedDurationSec: 6000  # 100 min for ~100 pieces
    
  - id: STEP-EXT-005
    phaseId: PH-EXTRUSION-001
    sequence: 5
    code: INLINE_LASER_MARK
    name: Marcatura laser inline
    category: production
    actionType: device_execution
    parameters:
      deviceId: DEV-LASER-001
      markingText: "REFLEXALLEN | REF12X2-PA12 | LOT {lotCode} | {dateShort}"
    attentionPoints: [AP-MARK-LASER]
    
  - id: STEP-EXT-006
    phaseId: PH-EXTRUSION-001
    sequence: 6
    code: CUT_TO_LENGTH
    name: Taglio a misura 2m
    category: production
    actionType: device_execution
    parameters:
      deviceId: DEV-CUT-001
      lengthMm: 2000
      tolerance: 5
      multiOutputType: variable
    estimatedDurationSec: 0.5  # per cut
    
  - id: STEP-EXT-007
    phaseId: PH-EXTRUSION-001
    sequence: 7
    code: SAMPLE_TAKE
    name: Sample taking ogni 50 pezzi
    category: quality_control
    actionType: take_sample
    parameters:
      frequency: every_n
      everyN: 50
      separateFromCount: true
    
  - id: STEP-EXT-008
    phaseId: PH-EXTRUSION-001
    sequence: 8
    code: WIP_CONTAINER_FILL
    name: Riempimento WIP container
    category: logistics
    actionType: wip_fill
    parameters:
      containerType: WIP-EXT-001
      capacityPieces: 50
```

### 14.6 Steps — Phase ASSEMBLY (per-piece, excerpt)

```yaml
assembly_steps:
  - id: STEP-ASSY-001
    phaseId: PH-ASSEMBLY-001
    sequence: 1
    code: PICK_TUBE_WIP
    name: Pick tubo from WIP
    category: production
    actionType: pick_from_wip
    parameters:
      sourceContainer: WIP-EXT-001
    estimatedDurationSec: 5
    
  - id: STEP-ASSY-002
    phaseId: PH-ASSEMBLY-001
    sequence: 2
    code: SCAN_TUBE_SERIAL
    name: Scan tubo serial
    category: scan
    actionType: scan_serial
    parameters:
      expectedFormat: "^SN-\\d{4}-\\d{4}-\\d{3}$"
    estimatedDurationSec: 5
    
  - id: STEP-ASSY-003
    phaseId: PH-ASSEMBLY-001
    sequence: 3
    code: VISUAL_END_A
    name: Visual check end A
    category: quality_control
    actionType: visual_inspection
    parameters:
      checklist:
        - "No oval deformation"
        - "Clean cut (no burrs)"
        - "No surface damage"
    estimatedDurationSec: 10
    
  - id: STEP-ASSY-004
    phaseId: PH-ASSEMBLY-001
    sequence: 4
    code: PRETREAT_END_A
    name: Pre-treatment end A
    category: production
    actionType: process
    parameters:
      subSteps:
        - chamfer_internal
        - clean_isopropanol
        - visual_clean
    estimatedDurationSec: 30
    
  - id: STEP-ASSY-005
    phaseId: PH-ASSEMBLY-001
    sequence: 5
    code: INSERT_RACC_A
    name: Insert raccordo A
    category: production
    actionType: manual_assembly
    parameters:
      itemId: ITM-COMP-RACC-12-A-001
      requireFullSeating: true
    estimatedDurationSec: 15
    
  - id: STEP-ASSY-006
    phaseId: PH-ASSEMBLY-001
    sequence: 6
    code: CRIMP_END_A
    name: Crimp end A
    category: production
    actionType: device_execution
    parameters:
      deviceId: DEV-CRIMP-001
      recipeId: RCP-CRIMP-12-001
      forceTargetKN: 25.0
      tolerance: 1.0
    attentionPoints: [AP-CRIMP-FORCE]
    estimatedDurationSec: 8
    
  - id: STEP-ASSY-007
    phaseId: PH-ASSEMBLY-001
    sequence: 7
    code: VISUAL_CRIMP_A
    name: Visual check crimp A
    category: quality_control
    actionType: visual_inspection
    parameters:
      checklist:
        - "Crimp dimension correct"
        - "No raccordo damage"
        - "Tube intact at crimp area"
    estimatedDurationSec: 5
    
  # Steps 8-13: same for end B (mirror)
```

### 14.7 Steps — Phase LEAKTEST (with parallel execution)

```yaml
leaktest_steps:
  - id: STEP-LEAK-001
    phaseId: PH-LEAKTEST-001
    sequence: 1
    code: POSITION_FIXTURE
    name: Position tube on fixture
    category: production
    actionType: process
    estimatedDurationSec: 8
    
  - id: STEP-LEAK-002
    phaseId: PH-LEAKTEST-001
    sequence: 2
    code: CONNECT_HOSES
    name: Connect pneumatic hoses
    category: production
    actionType: process
    estimatedDurationSec: 10
    
  - id: STEP-LEAK-003
    phaseId: PH-LEAKTEST-001
    sequence: 3
    code: RUN_LEAK_TEST
    name: Run leak test cycle
    category: quality_control
    actionType: device_execution
    parameters:
      deviceId: DEV-LEAK-001
      recipeId: RCP-LEAK-PNE-12-001
      version: 2
      isDeviceExecutionGroup: true
      parallelStepsBufferSec: 5
    estimatedDurationSec: 45
    parallelSteps:
      - stepId: STEP-LEAK-PARALLEL-001
        partReference: previous
      - stepId: STEP-LEAK-PARALLEL-002
        partReference: next
      - stepId: STEP-LEAK-PARALLEL-003
        partReference: previous
    
  - id: STEP-LEAK-PARALLEL-001
    code: APPLY_LABEL_PREVIOUS
    name: Apply label on previous tube
    category: production
    actionType: process
    parallel: true
    partReference: previous
    estimatedDurationSec: 12
    
  - id: STEP-LEAK-PARALLEL-002
    code: PREPARE_NEXT_TUBE
    name: Prepare next tube
    category: production
    actionType: process
    parallel: true
    partReference: next
    estimatedDurationSec: 20
    
  - id: STEP-LEAK-PARALLEL-003
    code: FILL_QC_CHECKLIST
    name: Fill QC checklist for previous
    category: quality_control
    actionType: checklist
    parallel: true
    partReference: previous
    estimatedDurationSec: 10
    
  - id: STEP-LEAK-004
    phaseId: PH-LEAKTEST-001
    sequence: 4
    code: READ_RESULT
    name: Read leak result
    category: quality_control
    actionType: read_device_result
    parameters:
      passThresholdMbarMin: 0.5
      onFailRecoveryFlow: STEP-LEAK-RECOVERY-FLOW
    estimatedDurationSec: 3
    
  - id: STEP-LEAK-005
    phaseId: PH-LEAKTEST-001
    sequence: 5
    code: DISCONNECT_HOSES
    name: Disconnect hoses
    category: production
    actionType: process
    estimatedDurationSec: 5
    
  - id: STEP-LEAK-006
    phaseId: PH-LEAKTEST-001
    sequence: 6
    code: REMOVE_TUBE
    name: Remove tube from fixture
    category: production
    actionType: process
    estimatedDurationSec: 3
```

### 14.8 Recovery Flow definition

```yaml
recovery_flow:
  id: STEP-LEAK-RECOVERY-FLOW
  code: LEAK_TEST_RECOVERY
  type: recovery
  maxAttempts: 3
  stages:
    - stage: 1
      name: Diagnosis
      actionType: select_fault_code
      parameters:
        faultCodes:
          - "Hose connection loose"
          - "Sealing surface contaminated"
          - "Real defect (porosity)"
          - "Crimp leak"
          - "Other"
        
    - stage: 2
      name: First recovery attempt
      actionType: apply_correction_retest
      parameters:
        correctionsByFault:
          "Hose connection loose": "Re-tighten and re-test"
          "Sealing surface contaminated": "Clean fixture and re-test"
          "Real defect (porosity)": "Re-test to confirm"
          "Crimp leak": "Likely scrap, verify with re-test"
        
    - stage: 3
      name: Second recovery attempt
      actionType: apply_alternative_correction_retest
      
    - stage: 4
      name: Final decision
      onAllAttemptsExhausted:
        - mark_scrap
        - require_cause_code
        - increment_qty_remaining
        - require_photo
        - notify_qc_supervisor
```

---

## 📌 15. WORK ORDER (runtime example)

```yaml
work_order:
  id: WO-2026-0142
  code: WO-2026-0142
  itemId: ITM-FG-RFA-PNE-001
  workflowId: WF-PNE-12X2-001
  workflowVersion: 1
  workflowSnapshotId: WFSNAP-2026-0142  # immutable copy
  
  # Quantities
  qtyTarget: 100
  qtyProduced: 0
  qtyScrap: 0
  qtyRework: 0
  qtySamples: 0
  qtyRemaining: 100
  
  # State
  status: released  # draft → released → setup_in_progress → in_progress → completed
  productionBlocked: true  # FAI not yet approved
  priority: normal
  
  # Customer reference
  customerOrderNumber: PO-TRUCKMAKER-2026-0089
  customerDueDate: 2026-04-30
  
  # Reservations
  reservedLots:
    - lotId: LOT-PA12-260415-001
      quantity: 8.5
      unit: kg
    - lotId: LOT-EVOH-260410-002
      quantity: 1.2
      unit: kg
    - lotId: LOT-PA12CR-260420-001
      quantity: 7.3
      unit: kg
    - lotId: LOT-RACC-260420-003
      quantity: 100
      unit: piece
    - lotId: LOT-RACC-260420-004
      quantity: 100
      unit: piece
  
  reservedBoxes:
    - boxId: BOX-PLT-RFA-001-A
      boxTypeId: BTYPE-PLT-RFA-001
    - boxId: BOX-PLT-RFA-001-B
      boxTypeId: BTYPE-PLT-RFA-001
  
  reservedTools:
    - toolId: TOOL-HEAD-12-3L-001
    - toolId: TOOL-CAL-12-001
    - toolId: TOOL-CRIMP-12-001
  
  # Assignment (v1.2)
  assignments:
    - operatorId: OP-001  # Luigi Bianchi
      role: extrusion_operator
      assignedAt: 2026-04-26T08:00:00Z
      status: confirmed
    - operatorId: OP-002  # Mario Rossi
      role: assembly_operator
      assignedAt: 2026-04-26T08:00:00Z
      status: confirmed
    - operatorId: OP-003  # Anna Verdi
      role: qc_operator
      assignedAt: 2026-04-26T08:00:00Z
      status: confirmed
    - operatorId: OP-004  # Piero Neri
      role: packaging_operator
      assignedAt: 2026-04-26T08:00:00Z
      status: confirmed
  
  # Schedule
  scheduledStartAt: 2026-04-27T07:00:00Z
  scheduledEndAt: 2026-04-27T11:40:00Z
  
  # Audit
  createdAt: 2026-04-26T15:30:00Z
  createdBy: PLANNER-001
  releasedAt: 2026-04-26T16:00:00Z
  releasedBy: PLANNER-001
  
  plantId: PLT-RFA-MO-001
```

---

## 📌 16. SAMPLE EXECUTION DATA (post-production)

After WO completes (example state):

```yaml
final_counters:
  qtyTarget: 100
  qtyProduced: 97
  qtyScrap: 2
  qtyRework: 1
  qtySamples: 3  # taken every 50 + 1 FAI
  qtyRemaining: 0  # all 100 successfully shipped (97 + 3 from rework/extra)

production_records_summary:
  totalSerialsGenerated: 105  # 100 target + 3 samples + 2 scrapped
  serialRange:
    first: SN-2026-0142-001
    last: SN-2026-0142-105

scrap_records:
  - serialNumber: SN-2026-0142-035
    causeCodeId: CC-MAT-001
    notes: "Porosity detected on visual after extrusion"
    photoUrl: /uploads/scrap/sn-2026-0142-035.jpg
  - serialNumber: SN-2026-0142-072
    causeCodeId: CC-PROC-001
    notes: "Leak test failed after 3 recovery attempts"

rework_records:
  - serialNumber: SN-2026-0142-058
    reworkReason: "Leak test marginal, recovered on second attempt"
    finalStatus: passed

box_lifecycle:
  - boxId: BOX-PLT-RFA-001-A
    status: filled
    contents: 50 tubes (SN-2026-0142-001 to 050, except scrapped)
    sealedAt: 2026-04-27T10:30:00Z
    sealedBy: OP-004
    sealNumber: SEAL-2026-0142-A
  - boxId: BOX-PLT-RFA-001-B
    status: filled
    contents: 50 tubes (SN-2026-0142-051 to 105)
    sealedAt: 2026-04-27T11:35:00Z

oee_calculation:
  availability: 0.95  # 5% downtime
  performance: 0.92  # cycle time slightly above ideal
  quality: 0.97  # 3 scrap / 100 = 3% scrap rate
  oee: 0.848  # 84.8%
```

---

## 📌 17. SUMMARY: Total fixture entities

| Category | Count |
|---|---|
| Plant | 1 |
| Skills | 7 |
| Operators | 4 |
| Items | 7 (1 FG + 4 raw + 2 components + 1 consumable) |
| BOM lines | 7 |
| Areas | 1 |
| Work Centers | 4 |
| Devices | 10 |
| Tools | 3 |
| Recipes | 3 |
| Box Types | 1 |
| Attention Points | 6 |
| Cause Codes | 6 |
| Supplier Lots | 5 |
| Workflow phases | 8 |
| Workflow steps (sample) | ~50 (full ~80) |
| Recovery flows | 1 |
| Work Order example | 1 |

**Total entities for Pneumatic Air seed**: ~120 records.

---

## 📌 18. How to use this fixture

### For Claude Code build

Tell Claude Code:
```
Read docs/extensions/MOCK_DATA_PNEUMATIC_AIR.md and create a TypeScript 
seed file at packages/prisma/seed/pneumatic-air.seed.ts that inserts all 
entities respecting foreign key dependencies.

Order:
1. Plant
2. Skills (no FK)
3. Operators + OperatorSkills (FK to Skills)
4. Items (no FK among themselves except parentItemId for hierarchies)
5. BOM + BOMLines (FK to Items)
6. Equipment hierarchy (Site → Area → WorkCenter → Devices)
7. Tools (FK to Items via compatibleItems)
8. Recipes (FK to deviceType)
9. BoxTypes
10. AttentionPoints
11. CauseCodes
12. Supplier Lots (FK to Items)
13. Workflow + Phases + Steps + Recovery flows
14. WorkOrder example with all reservations

After insertion, run validation:
- All FKs resolve
- All required fields populated
- No orphan records
```

### For demo/testing

Use this data to:
- Populate a test database
- Run integration tests
- Demo the system to stakeholders
- Validate UI rendering

---

## 📌 19. Cross-references

- Source: `WORKFLOW_PNEUMATIC_AIR.md` (high-level)
- Source: `WORKFLOW_PNEUMATIC_AIR_DETAILED.md` (step-by-step)
- Spec: `MASTER_SPECIFICATION.md` § 4-7 (entity definitions)
- Patterns: `BEST_PRACTICES.md` (seed patterns)

---

## 20. Change Log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-27 | Initial extraction of all mock data from Pneumatic Air workflows |

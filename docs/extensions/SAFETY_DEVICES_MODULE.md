# SAFETY_DEVICES_MODULE — Extension v1.0

> **Type**: Line-Specific Module (Reflexallen Safety Devices line)
> **Parent**: `MASTER_SPECIFICATION.md` v1.2
> **Status**: MVP (full coverage)
> **Last updated**: 2026-04-27

---

## 1. Concept

The Safety Devices line at Reflexallen produces **homologated retroreflective products** (catarifrangenti) per **ECE-R104** standard:
- Pannelli posteriori camion (yellow/red)
- Nastri perimetrali laterali veicoli
- Targhe veicoli lenti
- Marcature mezzi militari/industriali

This module adds Safety Devices-specific entities focused on:
- **Reflectance measurement** (retroriflettometro)
- **Colorimetry** (CIE-Lab spectrophotometer)
- **ECE-R104 homologation** management
- **Lamination process** (pellicola + substrato)
- **Aging tests** (QUV chamber, salt spray)

---

## 2. Safety Devices Specific Concepts

### 2.1 Retroreflective film types

Different reflectance grades:
- **Type I** (engineering grade): microsfere di vetro incassate
- **Type III** (high intensity): microsfere prismatiche
- **Tipo IV-XI** (diamond grade): microprismi metallizzati

Each type has different reflectance values and price.

### 2.2 ECE-R104 Standard

**International standard** for vehicle conspicuity markings. Mandates:
- Minimum reflectance values by color
- Color coordinates (CIE-Lab)
- Aging resistance
- Mechanical properties

**Reflectance thresholds** (cd/lx/m² minimum at 0.33° observation, 5° entrance):
- White: 250
- Yellow: 175
- Red: 60

**Homologation** required: each product variant has unique ECE certificate number.

### 2.3 Production process

```
Pellicola raw → Stampa serigrafica → Essiccazione UV → 
Laminazione (su substrato alluminio/cartone) → Die-cutting → 
Quality test (riflettanza + colore + adesione) → 
Marcatura omologativa → Imballaggio
```

---

## 3. Domain Model

### 3.1 Entities

```
ReflectiveFilmRoll
  ├── code (FILM-{type}-{seq})
  ├── filmType (type_I / type_III / type_IV / diamond_grade)
  ├── color (white / yellow / red / orange / blue / green)
  ├── width (mm)
  ├── totalLength (m)
  ├── remainingLength (m)
  ├── lotNumber (supplier)
  ├── manufactureDate
  ├── shelfLifeDate
  ├── nominalReflectance (typical value)
  └── audit fields

HomologationCertificate
  ├── code (ECE-{number}-{year})
  ├── number (certificate number)
  ├── countryCode (E3 = Italy, E1 = Germany, etc.)
  ├── regulation (104R, 3R, etc.)
  ├── itemId (which item it covers)
  ├── color
  ├── filmType
  ├── issuedAt
  ├── validFrom
  ├── validUntil
  ├── status (valid / expiring_soon / expired / withdrawn)
  ├── certificateUrl (PDF)
  └── audit fields

ReflectanceTest
  ├── code (RFT-{year}-{seq})
  ├── lotId (or sampleId)
  ├── itemId
  ├── color
  ├── measuredValue (cd/lx/m²)
  ├── threshold (per ECE-R104)
  ├── observationAngle (°)
  ├── entranceAngle (°)
  ├── result (pass / marginal / fail)
  ├── instrumentSerial (retroriflettometro)
  ├── instrumentLastCalibration
  ├── recordedAt
  ├── recordedBy
  └── audit

ColorimetryTest
  ├── code (COL-{year}-{seq})
  ├── lotId
  ├── itemId
  ├── color
  ├── measuredL (CIE-Lab L value)
  ├── measuredA (a*)
  ├── measuredB (b*)
  ├── deltaE (vs reference)
  ├── result (pass / marginal / fail)
  ├── instrumentSerial (spettrofotometro)
  ├── recordedAt
  ├── recordedBy
  └── audit

LaminationRecord
  ├── workOrderId
  ├── filmRollId
  ├── substrateLotId
  ├── pieceCount
  ├── laminationParameters (temperature, pressure, speed)
  ├── adhesionTestResult
  ├── result (passed / bubbles_detected / delamination)
  ├── operatorId
  ├── recordedAt
  └── audit

AgingTestSpecimen
  ├── code (AGE-{type}-{seq})
  ├── lotId
  ├── testType (quv_uv_exposure / salt_spray / thermal_cycling / humidity / combined)
  ├── plannedDurationHours
  ├── startedAt
  ├── chamberId
  ├── periodicChecksJson (array of intermediate measurements)
  ├── completedAt
  ├── finalReflectance
  ├── finalColorimetry
  ├── result (passed / failed / inconclusive)
  └── audit

CrossCutAdhesionTest (ASTM D3359)
  ├── lotId
  ├── classification (5B / 4B / 3B / 2B / 1B / 0B)  -- 5B best
  ├── result (pass / fail)
  ├── notes
  ├── recordedAt
  └── recordedBy
```

### 3.2 Prisma schema

```prisma
// === Reflective Film Roll ===
model ReflectiveFilmRoll {
  id                  String   @id @default(uuid()) @db.Uuid
  plantId             String   @map("plant_id") @db.Uuid
  
  code                String                          // FILM-DG-W-001
  filmType            FilmType @map("film_type")
  color               FilmColor
  width               Decimal  @db.Decimal(8, 2)     // mm
  totalLength         Decimal  @map("total_length") @db.Decimal(10, 2)  // m
  remainingLength     Decimal  @map("remaining_length") @db.Decimal(10, 2)
  
  lotNumber           String   @map("lot_number")
  manufactureDate     DateTime @map("manufacture_date") @db.Date
  shelfLifeDate       DateTime @map("shelf_life_date") @db.Date
  
  nominalReflectance  Decimal? @map("nominal_reflectance") @db.Decimal(8, 2)  // cd/lx/m² typical
  
  qualityStatus       String   @default("approved") @map("quality_status")
  
  currentLocationId   String?  @map("current_location_id") @db.Uuid
  
  // Audit
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  createdBy           String   @map("created_by") @db.Uuid
  updatedAt           DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)
  deletedAt           DateTime? @map("deleted_at") @db.Timestamptz(3)
  
  plant               Plant    @relation(fields: [plantId], references: [id])
  
  @@unique([plantId, code])
  @@index([plantId, filmType, color])
  @@map("reflective_film_rolls")
}

// === Homologation Certificate ===
model HomologationCertificate {
  id                  String   @id @default(uuid()) @db.Uuid
  plantId             String   @map("plant_id") @db.Uuid
  
  code                String                          // ECE-104R-001234-2026
  number              String                          // 001234
  countryCode         String   @map("country_code")  // E3 = Italy
  regulation          String                          // 104R
  
  itemId              String   @map("item_id") @db.Uuid
  color               FilmColor
  filmType            FilmType @map("film_type")
  
  issuedAt            DateTime @map("issued_at") @db.Date
  validFrom           DateTime @map("valid_from") @db.Date
  validUntil          DateTime @map("valid_until") @db.Date
  
  status              HomologationStatus @default(valid)
  
  certificateUrl      String?  @map("certificate_url")
  notes               String?
  
  // Audit
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  createdBy           String   @map("created_by") @db.Uuid
  updatedAt           DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)
  
  plant               Plant    @relation(fields: [plantId], references: [id])
  
  @@unique([plantId, code])
  @@index([itemId, status])
  @@index([validUntil])
  @@map("homologation_certificates")
}

// === Reflectance Test ===
model ReflectanceTest {
  id                  String   @id @default(uuid()) @db.Uuid
  plantId             String   @map("plant_id") @db.Uuid
  
  code                String                          // RFT-2026-0042
  
  lotId               String?  @map("lot_id") @db.Uuid
  sampleId            String?  @map("sample_id") @db.Uuid
  itemId              String   @map("item_id") @db.Uuid
  
  color               FilmColor
  measuredValue       Decimal  @map("measured_value") @db.Decimal(8, 2)  // cd/lx/m²
  threshold           Decimal  @db.Decimal(8, 2)
  
  observationAngle    Decimal  @map("observation_angle") @db.Decimal(4, 2)  // typically 0.33°
  entranceAngle       Decimal  @map("entrance_angle") @db.Decimal(4, 2)     // typically 5°
  
  result              ReflectanceResult
  
  instrumentSerial    String   @map("instrument_serial")
  instrumentLastCalibration DateTime? @map("instrument_last_calibration") @db.Date
  
  recordedAt          DateTime @default(now()) @map("recorded_at") @db.Timestamptz(3)
  recordedBy          String   @map("recorded_by") @db.Uuid
  
  notes               String?
  
  // Audit
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  createdBy           String   @map("created_by") @db.Uuid
  
  plant               Plant    @relation(fields: [plantId], references: [id])
  
  @@unique([plantId, code])
  @@index([lotId])
  @@index([result])
  @@map("reflectance_tests")
}

// === Colorimetry Test ===
model ColorimetryTest {
  id                  String   @id @default(uuid()) @db.Uuid
  plantId             String   @map("plant_id") @db.Uuid
  
  code                String                          // COL-2026-0042
  
  lotId               String?  @map("lot_id") @db.Uuid
  itemId              String   @map("item_id") @db.Uuid
  color               FilmColor
  
  measuredL           Decimal  @map("measured_l") @db.Decimal(6, 3)
  measuredA           Decimal  @map("measured_a") @db.Decimal(6, 3)
  measuredB           Decimal  @map("measured_b") @db.Decimal(6, 3)
  deltaE              Decimal  @map("delta_e") @db.Decimal(6, 3)  // vs reference
  
  result              TestOutcome
  
  instrumentSerial    String   @map("instrument_serial")
  
  recordedAt          DateTime @default(now()) @map("recorded_at") @db.Timestamptz(3)
  recordedBy          String   @map("recorded_by") @db.Uuid
  
  notes               String?
  
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  
  plant               Plant    @relation(fields: [plantId], references: [id])
  
  @@unique([plantId, code])
  @@map("colorimetry_tests")
}

// === Lamination Record ===
model LaminationRecord {
  id                  String   @id @default(uuid()) @db.Uuid
  plantId             String   @map("plant_id") @db.Uuid
  
  workOrderId         String   @map("work_order_id") @db.Uuid
  filmRollId          String   @map("film_roll_id") @db.Uuid
  substrateLotId      String?  @map("substrate_lot_id") @db.Uuid  // alluminio o cartone
  
  pieceCount          Int      @map("piece_count")
  
  // Process parameters
  laminationParameters Json    @map("lamination_parameters")  // JSONB: {temperature, pressure, speed, rolls}
  
  // Adhesion test result (cross-cut)
  adhesionTestId      String?  @unique @map("adhesion_test_id") @db.Uuid
  
  result              LaminationResult
  
  notes               String?
  
  operatorId          String   @map("operator_id") @db.Uuid
  recordedAt          DateTime @default(now()) @map("recorded_at") @db.Timestamptz(3)
  
  // Audit
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  
  plant               Plant    @relation(fields: [plantId], references: [id])
  adhesionTest        CrossCutAdhesionTest? @relation(fields: [adhesionTestId], references: [id])
  
  @@index([workOrderId])
  @@map("lamination_records")
}

// === Cross-Cut Adhesion Test (ASTM D3359) ===
model CrossCutAdhesionTest {
  id                  String   @id @default(uuid()) @db.Uuid
  plantId             String   @map("plant_id") @db.Uuid
  
  lotId               String?  @map("lot_id") @db.Uuid
  
  classification      AdhesionClass             // 5B (best) → 0B (worst)
  result              TestOutcome
  
  notes               String?
  imageUrl            String?  @map("image_url")  // photo of cross-cut
  
  recordedAt          DateTime @default(now()) @map("recorded_at") @db.Timestamptz(3)
  recordedBy          String   @map("recorded_by") @db.Uuid
  
  laminationRecord    LaminationRecord?
  
  @@map("cross_cut_adhesion_tests")
}

// === Aging Test Specimen ===
model AgingTestSpecimen {
  id                  String   @id @default(uuid()) @db.Uuid
  plantId             String   @map("plant_id") @db.Uuid
  
  code                String                          // AGE-QUV-2026-0042
  
  lotId               String   @map("lot_id") @db.Uuid
  itemId              String   @map("item_id") @db.Uuid
  
  testType            AgingTestType @map("test_type")
  plannedDurationHours Int     @map("planned_duration_hours")
  
  chamberId           String?  @map("chamber_id") @db.Uuid  // equipment ref (QUV chamber, salt spray)
  
  status              AgingTestStatus @default(scheduled)
  
  startedAt           DateTime? @map("started_at") @db.Timestamptz(3)
  completedAt         DateTime? @map("completed_at") @db.Timestamptz(3)
  
  // Initial measurements
  initialReflectance  Decimal? @map("initial_reflectance") @db.Decimal(8, 2)
  initialColorL       Decimal? @map("initial_color_l") @db.Decimal(6, 3)
  initialColorA       Decimal? @map("initial_color_a") @db.Decimal(6, 3)
  initialColorB       Decimal? @map("initial_color_b") @db.Decimal(6, 3)
  
  // Final measurements
  finalReflectance    Decimal? @map("final_reflectance") @db.Decimal(8, 2)
  finalColorL         Decimal? @map("final_color_l") @db.Decimal(6, 3)
  finalColorA         Decimal? @map("final_color_a") @db.Decimal(6, 3)
  finalColorB         Decimal? @map("final_color_b") @db.Decimal(6, 3)
  
  // Periodic checks (during long tests)
  periodicChecksJson  Json?    @map("periodic_checks_json")  // array of {timestamp, measurements}
  
  result              TestOutcome?
  
  notes               String?
  
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  createdBy           String   @map("created_by") @db.Uuid
  
  plant               Plant    @relation(fields: [plantId], references: [id])
  
  @@unique([plantId, code])
  @@index([status, completedAt])
  @@map("aging_test_specimens")
}

// === Enums ===
enum FilmType {
  type_I
  type_III
  type_IV
  diamond_grade
  
  @@map("film_type")
}

enum FilmColor {
  white
  yellow
  red
  orange
  blue
  green
  
  @@map("film_color")
}

enum HomologationStatus {
  valid
  expiring_soon
  expired
  withdrawn
  
  @@map("homologation_status")
}

enum ReflectanceResult {
  pass
  marginal
  fail
  
  @@map("reflectance_result")
}

enum LaminationResult {
  passed
  bubbles_detected
  delamination
  
  @@map("lamination_result")
}

enum AdhesionClass {
  CLASS_5B  // 0% removed
  CLASS_4B  // < 5%
  CLASS_3B  // 5-15%
  CLASS_2B  // 15-35%
  CLASS_1B  // 35-65%
  CLASS_0B  // > 65%
  
  @@map("adhesion_class")
}

enum AgingTestType {
  quv_uv_exposure
  salt_spray
  thermal_cycling
  humidity
  combined
  
  @@map("aging_test_type")
}

enum AgingTestStatus {
  scheduled
  in_progress
  paused
  completed
  failed
  
  @@map("aging_test_status")
}
```

---

## 4. Business Rules

### 4.1 Reflectance test rules (ECE-R104)

**Threshold values (cd/lx/m² minimum at 0.33° / 5°)**:
```typescript
const ECE_R104_THRESHOLDS = {
  white:  250,
  yellow: 175,
  red:     60,
  orange: 175,  // similar to yellow
  blue:    20,
  green:   25
} as const
```

**Result classification**:
- **pass**: measured ≥ threshold
- **marginal**: 90-100% of threshold (warning, requires QC manager approval)
- **fail**: < 90% of threshold (block shipping)

**Test procedure**:
1. Sample placed in retroflectometer
2. Multiple readings (typically 5-10 points)
3. Average calculated
4. Compared to threshold
5. Result recorded with operator + instrument calibration date

**Critical rules**:
- ✅ Instrument calibration must be valid (calibrated within last 12 months)
- ✅ Only `pass` results allow shipping
- ✅ `marginal` requires explicit QC manager approval
- ✅ `fail` blocks lot from shipping

### 4.2 Colorimetry rules

**CIE-Lab measurement** vs reference:
- ΔE < 1.0: excellent (pass)
- ΔE 1.0-3.0: acceptable (pass)
- ΔE 3.0-5.0: marginal (review)
- ΔE > 5.0: fail (color out of spec)

### 4.3 Homologation rules

**Marking generation**:
```typescript
function generateMarking(cert: HomologationCertificate, year: number): string {
  // Format: E{country}-{regulation}-{number}/{year}
  // Example: E3-104R-001234/2026
  return `${cert.countryCode}-${cert.regulation}-${cert.number}/${year}`
}
```

**Validation rules**:
- ✅ Certificate must be `valid` status (not expired/withdrawn)
- ✅ Certificate must cover the specific item, color, film type
- ✅ Cannot generate marking without valid certificate
- ✅ Auto-warning when certificate < 90 days from expiration

**Certificate lifecycle**:
```typescript
@Cron('0 0 * * *')  // daily at midnight
async checkCertificateExpirations() {
  const ninetyDaysFromNow = addDays(new Date(), 90)
  const today = new Date()
  
  // Mark expiring soon
  await prisma.homologationCertificate.updateMany({
    where: {
      status: 'valid',
      validUntil: { lte: ninetyDaysFromNow, gt: today }
    },
    data: { status: 'expiring_soon' }
  })
  
  // Mark expired
  await prisma.homologationCertificate.updateMany({
    where: {
      status: { in: ['valid', 'expiring_soon'] },
      validUntil: { lte: today }
    },
    data: { status: 'expired' }
  })
  
  // Notify quality team
  // ...
}
```

### 4.4 Lamination rules

**Adhesion test (cross-cut, ASTM D3359)**:
- Must be performed on each lamination batch
- Pass criteria: classification ≥ 4B (no more than 5% removed)
- Fail: re-lamination required

**Process parameter monitoring**:
- Temperature, pressure, speed during lamination
- Out of spec: warning + require QC review

### 4.5 Aging test rules

**Test types and durations** (per ECE-R104 Annex):
- QUV UV exposure: 1000-2000 hours (40-80 days)
- Salt spray: 168-500 hours
- Thermal cycling: -40°C to +80°C, multiple cycles
- Humidity: 95% RH for 1000 hours

**Periodic checks during test** (long tests):
- Every 168 hours (1 week) measurements taken
- Specimen removed from chamber, reflectance + color measured, returned

**Pass criteria**:
- Reflectance retention: > 60% of initial value (varies by film type)
- Color shift (ΔE): < 5.0
- No visible degradation (cracks, delamination)

---

## 5. API Endpoints

### Films & Materials
```
GET    /api/v1/reflective-films               List rolls
POST   /api/v1/reflective-films               Receive new roll
GET    /api/v1/reflective-films/expiring      Approaching shelf-life
```

### Homologation
```
GET    /api/v1/homologation-certificates      List with filters
POST   /api/v1/homologation-certificates      Register new cert
GET    /api/v1/homologation-certificates/:id  Detail
PATCH  /api/v1/homologation-certificates/:id  Update (admin)
POST   /api/v1/homologation-certificates/:id/withdraw  Withdraw cert

GET    /api/v1/homologation-certificates/expiring  Expiring soon
GET    /api/v1/items/:id/active-certificate   Get valid cert for item

POST   /api/v1/homologation/generate-marking  Generate marking string
```

### Tests
```
GET    /api/v1/reflectance-tests              List
POST   /api/v1/reflectance-tests              Record test
GET    /api/v1/colorimetry-tests              List
POST   /api/v1/colorimetry-tests              Record test
GET    /api/v1/cross-cut-tests                List
POST   /api/v1/cross-cut-tests                Record test
POST   /api/v1/laminations                    Record lamination
```

### Aging
```
GET    /api/v1/aging-specimens                List
POST   /api/v1/aging-specimens                Start aging test
POST   /api/v1/aging-specimens/:id/check      Periodic check
POST   /api/v1/aging-specimens/:id/complete   Complete with final result
GET    /api/v1/aging-specimens/in-progress    Currently in chambers
```

---

## 6. UI Patterns

### 6.1 Reflectance Meter component

```
┌──────────────────────────────────────────────┐
│  Reflectance Test — Lot LOT-260415-001       │
├──────────────────────────────────────────────┤
│  Color: White                                │
│  ECE-R104 threshold: 250 cd/lx/m²            │
│                                              │
│  Measured: 285.4 cd/lx/m²                    │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │                              ★         │  │
│  │  0       100      250    285  500      │  │
│  │  ├───────┼────────┼──────┼────┤        │  │
│  │  ░░░░░░░░░░░░░░░░░╪══════╪═════════    │  │
│  │  fail    marginal│  ✅ PASS│            │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Result: 🟢 PASS                             │
│  Margin: +35 cd/lx/m² above threshold (14%)  │
│                                              │
│  Instrument: RetroSign 4500 (S/N 12345)      │
│  Last calibration: 15/01/2026 ✓              │
│                                              │
│  Operator: Anna Verdi   Recorded: 14:32      │
└──────────────────────────────────────────────┘
```

### 6.2 Homologation Dashboard

```
┌──────────────────────────────────────────────┐
│  Homologation Certificates Status            │
├──────────────────────────────────────────────┤
│  🟢 Valid (5)                                │
│  🟡 Expiring soon (2)                        │
│     • ECE-104R-001234/2024 — 45 days left    │
│     • ECE-104R-001456/2024 — 78 days left    │
│  🔴 Expired (1) — ACTION REQUIRED            │
│     • ECE-104R-000999/2021 — Production stop │
│  ⚫ Withdrawn (3)                             │
└──────────────────────────────────────────────┘
```

### 6.3 Aging Test Tracker

```
AGE-QUV-2026-0042 — IN PROGRESS
Test type: QUV UV exposure
Duration: 1000h (planned)  |  Elapsed: 432h (43%)

[████████░░░░░░░░░░░░] 43% — ~5 weeks left

Periodic checks:
| #  | Hours | Reflectance | Δ from initial | ΔE color | Status |
|----|-------|-------------|----------------|----------|--------|
| 0  | 0     | 285 cd/lx/m²| -              | -        | start  |
| 1  | 168   | 280         | -1.7%          | 0.8      | OK     |
| 2  | 336   | 271         | -4.9%          | 1.5      | OK     |
| 3  | 432   | (current)   | -              | -        | due    |

Next check: due tomorrow 09:00
```

---

## 7. KPIs

| KPI | Formula | Purpose |
|---|---|---|
| Reflectance pass rate | pass / total | Quality |
| Reflectance avg vs threshold | avg(measured / threshold) | Margin |
| Color delta E avg | avg(deltaE) per color | Color stability |
| Adhesion pass rate | classification ≥ 4B / total | Lamination quality |
| Lamination defect rate | (bubbles + delamination) / total | Process control |
| Certificate compliance | valid + expiring_soon / total | Compliance health |
| Aging test pass rate | pass / total completed | Long-term durability |

---

## 8. Permissions

| Action | Permission |
|---|---|
| Receive film roll | `film.receive` (operator) |
| Record reflectance test | `reflectance.test` (operator with QC_OPTICAL skill) |
| Approve marginal reflectance | `reflectance.approve_marginal` (quality manager) |
| Register homologation cert | `homologation.manage` (quality, admin) |
| Withdraw certificate | `homologation.withdraw` (admin) |
| Generate marking | `marking.generate` (operator with PRINT skill) |
| Start aging test | `aging.start` (quality) |
| Complete aging test | `aging.complete` (quality) |

---

## 9. Cross-references

- Core spec: `MASTER_SPECIFICATION.md` § 4.61-4.64 (Safety enums)
- Workflow ref: `extensions/WORKFLOW_SAFETY_DEVICES.md`
- Patterns: `BEST_PRACTICES.md` § 4.19 (Reflectance & Homologation services)

---

## 10. Change Log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-27 | Initial extension v1.2 release |

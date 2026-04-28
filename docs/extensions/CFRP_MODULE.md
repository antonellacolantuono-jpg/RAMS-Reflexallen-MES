# CFRP_MODULE — Extension v1.0

> **Type**: Line-Specific Module (Reflexallen Compositi line)
> **Parent**: `MASTER_SPECIFICATION.md` v1.2
> **Status**: MVP (full coverage)
> **Last updated**: 2026-04-27

---

## 1. Concept

The CFRP (Carbon Fiber Reinforced Polymer) line at Reflexallen produces **composite parts** for moto carene, automotive, nautical applications. The production process is fundamentally different from tubes:

- **Long cycle times** (4-12 hours per part vs seconds for tubes)
- **Manual lay-up** prevails over automation
- **Mold-dependent**: each part needs dedicated mold
- **Refrigerated material storage** (prepreg)
- **Out-time tracking** mandatory
- **NDT (Non-Destructive Testing)** required for structural parts

This module adds CFRP-specific entities and patterns to the core MES.

---

## 2. CFRP-Specific Concepts

### 2.1 Prepreg materials

**Prepreg** (pre-impregnated) = carbon fiber fabric pre-impregnated with epoxy resin, frozen for transport/storage.

**Critical lifecycle**:
- Frozen (-18°C): **shelf life** 6-12 months
- Refrigerated (4°C): degrades faster
- Out at room temp: **out-time** accumulates (10-30 days max cumulative)
- Out-time exceeded: **scrap** (cannot be used)

The MES must track **cumulative out-time** across multiple "out" sessions per roll.

### 2.2 Mold management

**Mold** = dedicated tool for shaping a specific part. CFRP molds:
- Are expensive (10K-100K€)
- Have limited lifetime (200-1000 cycles typically)
- Require periodic maintenance (cleaning, release agent reapplication)
- Are tracked as assets

### 2.3 Cure cycles (autoclave)

**Cure cycle** = thermal/pressure cycle in autoclave that polymerizes the resin:
- Lasts 4-8 hours
- Temperature ramps and dwells (e.g., 180°C × 2h)
- Pressure: 6-7 bar
- Multiple thermocouples on part for monitoring
- All telemetry archived per cycle (audit + traceability)

### 2.4 NDT (Non-Destructive Testing)

**Required for structural parts**:
- **Ultrasonic C-scan**: detects internal delaminations, voids, inclusions
- **Dimensional**: CMM or 3D scanner
- **Visual**: surface defects
- **Weight**: density verification

Each test linked to specific piece for traceability.

---

## 3. Domain Model

### 3.1 Entities

```
Mold
  ├── code (MOLD-{type}-{seq})
  ├── name
  ├── itemId (which item this mold produces)
  ├── moldType (hard_aluminum / hard_steel / invar / soft_silicone / cfrp_mold)
  ├── status (available / in_use / cleaning / maintenance / decommissioned)
  ├── cyclesCount (current)
  ├── maxLifetimeCycles
  ├── conditionScore (0-100)
  ├── lastInspectionAt
  ├── lastReleaseAgentAppliedAt
  ├── currentLocationId
  ├── currentWorkOrderId
  ├── unitCostEur
  └── audit fields

PrepregRoll
  ├── code (PREPREG-{material}-{seq})
  ├── lotNumber (supplier lot)
  ├── itemId (link to Item registry)
  ├── manufactureDate
  ├── maxFrozenLifeDate (shelf life expiration)
  ├── maxOutTimeMinutes (cumulative budget)
  ├── currentOutTimeMinutes (cumulative used)
  ├── currentStorageState (frozen / refrigerated / out / expired)
  ├── currentLocationId
  ├── totalLength (meters)
  ├── remainingLength
  └── audit fields

PrepregOutTimeRecord
  ├── prepregRollId
  ├── tookOutAt
  ├── tookOutBy
  ├── returnedAt
  ├── returnedBy
  ├── durationMinutes
  ├── notes
  └── related WO (optional)

CureCycleRun
  ├── code (CCR-{year}-{seq})
  ├── autoclaveId (equipment)
  ├── recipeVersionId (recipe used)
  ├── status (pre_vacuum / heating_ramp / dwell / cooling_ramp / depressurization / completed / failed)
  ├── currentPhase
  ├── startedAt, completedAt
  ├── plannedDuration
  ├── actualDuration
  ├── loadedItems (JSONB array of serial numbers)
  ├── operatorId
  └── audit fields

CureCycleTelemetry (time-series, append-only)
  ├── runId
  ├── timestamp
  ├── airTemperature
  ├── partTemperatures (JSONB: array of multiple thermocouples)
  ├── chamberPressure
  ├── vacuumLevel
  ├── currentPhase
  └── recorded by sensor or system

NDTResult
  ├── code (NDT-{type}-{seq})
  ├── serialNumber
  ├── testType (ultrasonic_c_scan / dimensional / weight / visual_inspection)
  ├── result (pass / fail / marginal)
  ├── measurementsJson
  ├── defectsFoundJson (array of defects with location)
  ├── scanImageUrls (for UT C-scan)
  ├── operatorId
  ├── recordedAt
  └── audit fields

VacuumBagTest (within autoclave preparation)
  ├── workOrderId
  ├── moldId
  ├── tightnessMbar (drop in pressure over time)
  ├── threshold (pass criteria)
  ├── result (pass / fail)
  ├── testedAt
  └── testedBy
```

### 3.2 Prisma schema

```prisma
// === Mold ===
model Mold {
  id                  String   @id @default(uuid()) @db.Uuid
  plantId             String   @map("plant_id") @db.Uuid
  
  code                String                          // MOLD-CARENA-001
  name                String
  description         String?
  itemId              String?  @map("item_id") @db.Uuid  // produces this item
  
  moldType            String   @map("mold_type")     // 'hard_aluminum', 'hard_steel', 'invar', 'soft_silicone', 'cfrp_mold'
  
  status              MoldStatus @default(available)
  
  // Lifecycle
  cyclesCount         Int      @default(0) @map("cycles_count")
  maxLifetimeCycles   Int      @map("max_lifetime_cycles")
  conditionScore      Int      @default(100) @map("condition_score")  // 0-100
  
  lastInspectionAt    DateTime? @map("last_inspection_at") @db.Timestamptz(3)
  lastReleaseAgentAppliedAt DateTime? @map("last_release_agent_applied_at") @db.Timestamptz(3)
  releaseAgentReapplyEvery Int? @map("release_agent_reapply_every")  // every N cycles
  
  currentLocationId   String?  @map("current_location_id") @db.Uuid
  currentWorkOrderId  String?  @map("current_work_order_id") @db.Uuid
  
  unitCostEur         Decimal? @map("unit_cost_eur") @db.Decimal(10, 2)
  
  // Image
  imageUrl            String?  @map("image_url")
  
  // Audit
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  createdBy           String   @map("created_by") @db.Uuid
  updatedAt           DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)
  updatedBy           String   @map("updated_by") @db.Uuid
  deletedAt           DateTime? @map("deleted_at") @db.Timestamptz(3)
  version             Int      @default(1)
  
  plant               Plant    @relation(fields: [plantId], references: [id])
  
  @@unique([plantId, code])
  @@index([plantId, status])
  @@map("molds")
}

// === Prepreg Roll ===
model PrepregRoll {
  id                  String   @id @default(uuid()) @db.Uuid
  plantId             String   @map("plant_id") @db.Uuid
  
  code                String                          // PREPREG-CF-T700-001
  lotNumber           String   @map("lot_number")
  itemId              String   @map("item_id") @db.Uuid
  
  manufactureDate     DateTime @map("manufacture_date") @db.Date
  maxFrozenLifeDate   DateTime @map("max_frozen_life_date") @db.Date
  maxOutTimeMinutes   Int      @map("max_out_time_minutes")
  currentOutTimeMinutes Int    @default(0) @map("current_out_time_minutes")
  
  currentStorageState PrepregStorageState @default(frozen) @map("current_storage_state")
  currentLocationId   String?  @map("current_location_id") @db.Uuid
  
  totalLength         Decimal  @map("total_length") @db.Decimal(10, 2)  // meters
  remainingLength     Decimal  @map("remaining_length") @db.Decimal(10, 2)
  
  // Quality
  qualityStatus       String   @default("approved") @map("quality_status")
  
  // Audit
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  createdBy           String   @map("created_by") @db.Uuid
  updatedAt           DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)
  updatedBy           String   @map("updated_by") @db.Uuid
  deletedAt           DateTime? @map("deleted_at") @db.Timestamptz(3)
  version             Int      @default(1)
  
  plant               Plant    @relation(fields: [plantId], references: [id])
  outTimeRecords      PrepregOutTimeRecord[]
  
  @@unique([plantId, code])
  @@index([plantId, currentStorageState])
  @@map("prepreg_rolls")
}

// === Prepreg Out-Time Records ===
model PrepregOutTimeRecord {
  id                  String   @id @default(uuid()) @db.Uuid
  prepregRollId       String   @map("prepreg_roll_id") @db.Uuid
  
  tookOutAt           DateTime @map("took_out_at") @db.Timestamptz(3)
  tookOutBy           String   @map("took_out_by") @db.Uuid
  returnedAt          DateTime? @map("returned_at") @db.Timestamptz(3)
  returnedBy          String?  @map("returned_by") @db.Uuid
  
  durationMinutes     Int?     @map("duration_minutes")  // computed on return
  
  workOrderId         String?  @map("work_order_id") @db.Uuid
  notes               String?
  
  prepregRoll         PrepregRoll @relation(fields: [prepregRollId], references: [id], onDelete: Cascade)
  
  @@index([prepregRollId, tookOutAt(sort: Desc)])
  @@map("prepreg_out_time_records")
}

// === Cure Cycle Run ===
model CureCycleRun {
  id                  String   @id @default(uuid()) @db.Uuid
  plantId             String   @map("plant_id") @db.Uuid
  
  code                String                          // CCR-2026-0042
  
  autoclaveId         String   @map("autoclave_id") @db.Uuid
  recipeVersionId     String?  @map("recipe_version_id") @db.Uuid
  workOrderId         String?  @map("work_order_id") @db.Uuid
  
  status              CureCycleStatus @default(pre_vacuum)
  currentPhase        CureCyclePhase? @map("current_phase")
  
  startedAt           DateTime @map("started_at") @db.Timestamptz(3)
  startedBy           String   @map("started_by") @db.Uuid
  completedAt         DateTime? @map("completed_at") @db.Timestamptz(3)
  completedBy         String?  @map("completed_by") @db.Uuid
  failedAt            DateTime? @map("failed_at") @db.Timestamptz(3)
  failureReason       String?  @map("failure_reason")
  
  plannedDurationSec  Int      @map("planned_duration_sec")
  actualDurationSec   Int?     @map("actual_duration_sec")
  
  // Loaded items (parts in cycle)
  loadedItems         Json     @map("loaded_items")  // JSONB array of {serialNumber, moldId, position}
  
  // Final summary (set at completion)
  maxTemperatureC     Decimal? @map("max_temperature_c") @db.Decimal(6, 2)
  averageTemperatureC Decimal? @map("avg_temperature_c") @db.Decimal(6, 2)
  
  notes               String?
  
  // Audit
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  createdBy           String   @map("created_by") @db.Uuid
  
  plant               Plant    @relation(fields: [plantId], references: [id])
  telemetry           CureCycleTelemetry[]
  
  @@unique([plantId, code])
  @@index([autoclaveId, status])
  @@map("cure_cycle_runs")
}

// === Cure Cycle Telemetry (time-series) ===
model CureCycleTelemetry {
  id                  String   @id @default(uuid()) @db.Uuid
  runId               String   @map("run_id") @db.Uuid
  
  timestamp           DateTime @default(now()) @db.Timestamptz(3)
  
  airTemperature      Decimal  @map("air_temperature") @db.Decimal(6, 2)
  partTemperatures    Json     @map("part_temperatures")  // JSONB: [{thermocouple: 'TC1', value: 178.5}, ...]
  chamberPressure     Decimal  @map("chamber_pressure") @db.Decimal(6, 3)  // bar
  vacuumLevel         Decimal  @map("vacuum_level") @db.Decimal(6, 3)      // bar
  currentPhase        CureCyclePhase @map("current_phase")
  
  alarms              String[] @map("alarms")  // any alarms triggered at this reading
  
  run                 CureCycleRun @relation(fields: [runId], references: [id], onDelete: Cascade)
  
  @@index([runId, timestamp])
  @@map("cure_cycle_telemetry")
}

// === NDT Result ===
model NDTResult {
  id                  String   @id @default(uuid()) @db.Uuid
  plantId             String   @map("plant_id") @db.Uuid
  
  code                String                          // NDT-UT-2026-0042
  
  serialNumber        String   @map("serial_number")
  workOrderId         String?  @map("work_order_id") @db.Uuid
  
  testType            NDTTestType @map("test_type")
  result              TestOutcome
  
  measurementsJson    Json?    @map("measurements_json")
  defectsFoundJson    Json?    @map("defects_found_json")  // array of {type, location, severity}
  scanImageUrls       String[] @map("scan_image_urls")
  
  operatorId          String   @map("operator_id") @db.Uuid
  recordedAt          DateTime @default(now()) @map("recorded_at") @db.Timestamptz(3)
  
  notes               String?
  
  // Audit
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  createdBy           String   @map("created_by") @db.Uuid
  
  plant               Plant    @relation(fields: [plantId], references: [id])
  
  @@unique([plantId, code])
  @@index([serialNumber])
  @@index([workOrderId])
  @@map("ndt_results")
}

// === Vacuum Bag Test ===
model VacuumBagTest {
  id                  String   @id @default(uuid()) @db.Uuid
  plantId             String   @map("plant_id") @db.Uuid
  
  workOrderId         String   @map("work_order_id") @db.Uuid
  moldId              String   @map("mold_id") @db.Uuid
  
  initialPressureMbar Decimal  @map("initial_pressure_mbar") @db.Decimal(8, 2)
  finalPressureMbar   Decimal  @map("final_pressure_mbar") @db.Decimal(8, 2)
  durationSec         Int      @map("duration_sec")
  pressureDropMbar    Decimal  @map("pressure_drop_mbar") @db.Decimal(8, 2)
  
  thresholdMbar       Decimal  @map("threshold_mbar") @db.Decimal(8, 2)
  result              TestOutcome
  
  testedAt            DateTime @default(now()) @map("tested_at") @db.Timestamptz(3)
  testedBy            String   @map("tested_by") @db.Uuid
  
  notes               String?
  
  @@index([workOrderId])
  @@map("vacuum_bag_tests")
}

// === Enums ===
enum MoldStatus {
  available
  in_use
  cleaning
  maintenance
  decommissioned
  
  @@map("mold_status")
}

enum PrepregStorageState {
  frozen
  refrigerated
  out
  expired
  
  @@map("prepreg_storage_state")
}

enum CureCycleStatus {
  pre_vacuum
  heating_ramp
  dwell
  cooling_ramp
  depressurization
  completed
  failed
  
  @@map("cure_cycle_status")
}

enum CureCyclePhase {
  vacuum_pre_cure
  heating_ramp
  dwell
  cooling_ramp
  depressurization
  
  @@map("cure_cycle_phase")
}

enum NDTTestType {
  ultrasonic_c_scan
  dimensional
  weight
  visual_inspection
  
  @@map("ndt_test_type")
}
```

---

## 4. State Machines

### 4.1 Mold lifecycle

```
available ──use──→ in_use ──cycle_complete──→ cleaning
                                                   │
                                                   ▼
                                                cleaned
                                                   │
              ┌──── needs maintenance? ─── yes ────┤
              │                                    │
              │                                    ▼
              │                              maintenance
              │                                    │
              │                                    ▼
              │                              available
              │
              └─── no ──→ available

decommissioned (final) ← end of lifetime
```

### 4.2 Prepreg roll state

```
frozen ──take_out──→ out ──return──→ refrigerated (or frozen)
                       │
                       │ (if total_out_time > max)
                       ▼
                    expired (final, must scrap)
```

### 4.3 Cure cycle phases

```
pre_vacuum (30 min) → heating_ramp (1-2h) → dwell (1-4h) → cooling_ramp (1-2h) → depressurization (30 min)
                                                                                        │
                                                                                        ▼
                                                                                completed
                                                                                        │
                                                                              (if alarm)
                                                                                        ▼
                                                                                  failed
```

---

## 5. Business Rules

### 5.1 Mold rules

- **Cycles count auto-increments** on `useMold()` action only
- **No manual edit** of `cyclesCount` (audit immutable)
- **End-of-life detection**: at 90% of `maxLifetimeCycles` → warning event
- **At 100%**: mold cannot be used until refurbished or replaced
- **Release agent re-application**: tracked, alerts when due
- **Cleaning cycle** required after each use (configurable)

### 5.2 Prepreg roll rules

- **Out-time tracking is cumulative** across all out periods
- **Take-out** creates `PrepregOutTimeRecord` with `tookOutAt`
- **Return** updates record with `returnedAt`, computes `durationMinutes`, increments `currentOutTimeMinutes`
- **Validation before lay-up**:
  ```typescript
  if (roll.currentStorageState === 'expired') {
    throw new ValidationException('Roll expired, cannot use')
  }
  if (roll.currentOutTimeMinutes >= roll.maxOutTimeMinutes) {
    throw new ValidationException(`Out-time exceeded: ${roll.currentOutTimeMinutes} >= ${roll.maxOutTimeMinutes}`)
  }
  ```
- **Auto-mark expired**: cron job daily checks rolls

### 5.3 Cure cycle rules

- **Telemetry every 30 seconds** via background job
- **Phase auto-detection**: based on temperature/pressure pattern
- **Alarm conditions**:
  - Temperature deviation from recipe > ±5°C
  - Pressure deviation > ±0.2 bar
  - Vacuum loss > 50 mbar
- **Alarm during cycle**: status → `failed`, all loaded items quarantined for review
- **Successful completion**: pieces linked to telemetry archive (genealogy)
- **Telemetry retention**: 15+ years (automotive)

### 5.4 NDT rules

- **Mandatory for structural CFRP parts** (configurable per item)
- **Test types** depend on item criticality
- **Defects > tolerance** → piece status `failed`, scrap or rework
- **Borderline (marginal)**: requires QC review
- **Defect map** stored as JSON for forward genealogy

### 5.5 Vacuum bag test rules

- **Mandatory before autoclave loading**
- **Test procedure**:
  1. Apply vacuum (target -1 bar)
  2. Stabilize 60 seconds
  3. Measure initial pressure
  4. Wait 5 minutes
  5. Measure final pressure
  6. Compute drop
- **Pass criteria**: drop < threshold (typically < 50 mbar)
- **Fail**: cannot proceed to autoclave, must redo bagging

---

## 6. API Endpoints

### Molds
```
GET    /api/v1/molds                    List with filters (status, type)
POST   /api/v1/molds                    Create
PATCH  /api/v1/molds/:id                Update (admin only for sensitive fields)
POST   /api/v1/molds/:id/use            Reserve for WO (auto-increment cycles)
POST   /api/v1/molds/:id/return         Mark as cleaning after use
POST   /api/v1/molds/:id/clean-done     Mark cleaning complete
POST   /api/v1/molds/:id/inspect        Update condition score
POST   /api/v1/molds/:id/decommission   End of life
GET    /api/v1/molds/at-risk            Molds approaching end-of-life
```

### Prepreg
```
GET    /api/v1/prepreg-rolls            List with filters
POST   /api/v1/prepreg-rolls            Register new roll (receiving)
POST   /api/v1/prepreg-rolls/:id/take-out  Start out-time period
POST   /api/v1/prepreg-rolls/:id/return    End out-time period
GET    /api/v1/prepreg-rolls/expiring   Rolls approaching expiration
```

### Cure cycles
```
GET    /api/v1/cure-cycles              List runs
POST   /api/v1/cure-cycles              Start new run
GET    /api/v1/cure-cycles/:id          Detail with telemetry summary
GET    /api/v1/cure-cycles/:id/telemetry   Full time-series data
POST   /api/v1/cure-cycles/:id/complete    Mark complete
POST   /api/v1/cure-cycles/:id/fail        Mark failed with reason
GET    /api/v1/autoclaves/:id/active-cycle Currently running cycle
```

### NDT
```
GET    /api/v1/ndt-results              List with filters
POST   /api/v1/ndt-results              Record result
GET    /api/v1/ndt-results/:id          Detail with images
GET    /api/v1/serials/:sn/ndt-history  All NDT for a piece
```

### Vacuum bag tests
```
POST   /api/v1/vacuum-bag-tests         Record test
GET    /api/v1/work-orders/:id/vacuum-tests   For WO
```

---

## 7. UI Patterns

### 7.1 Mold registry detail

```
Tabs:
- Info (general data, image)
- Lifecycle (cycles count progress bar, condition score)
- Usage History (all WOs that used it)
- Maintenance (release agent applications, refurbishments)
- Inspection History
```

Visual element — Mold lifecycle indicator:
```
[████████████████░░░░] 800 / 1000 cycles (80%)
Condition: 75/100 — Good
Last release agent: 5 days ago
Next due: 3 days
Status: 🟢 Available
```

### 7.2 Prepreg roll out-time tracker

```
PREPREG-CF-T700-001
Total out-time budget: 30 days
Currently used: 18 days, 4 hours (62%)
Remaining: 11 days, 20 hours

Out periods history:
| #  | Took out  | Returned  | Duration | WO            |
|----|-----------|-----------|----------|---------------|
| 1  | 01/04/26  | 02/04/26  | 18h 30m  | WO-2026-0140  |
| 2  | 10/04/26  | 12/04/26  | 36h 15m  | WO-2026-0142  |
| 3  | 25/04/26  | (out now) | 65h 30m  | WO-2026-0143  |

[████████████░░░░░░░] 62% — On track
```

### 7.3 Cure cycle live monitor

```
┌──────────────────────────────────────────────────────────┐
│  🔥 CURE CYCLE — CCR-2026-0042 — RUNNING                 │
│  Autoclave: AUT-001  |  Recipe: RCP-EPOXY-180-002        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Current phase: DWELL                                    │
│  Elapsed: 02:15:30  /  Planned: 04:00:00                 │
│  Progress: [████████░░░░░░░] 56%                         │
│                                                          │
│  ┌───────────────────────────────────────────────────┐   │
│  │  Temperature chart (last 1h)                      │   │
│  │  200°C ┤                                          │   │
│  │        │      ┌──────────                         │   │
│  │  150°C ┤      │                                   │   │
│  │        │      │                                   │   │
│  │  100°C ┤      │                                   │   │
│  │        │  ────┘                                   │   │
│  │   50°C ┤                                          │   │
│  │   0°C  └────────────────────────                  │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
│  Current readings:                                       │
│  Air: 180.2°C  |  TC1: 178.5°C  |  TC2: 179.1°C          │
│  Pressure: 6.2 bar  |  Vacuum: 0.95 bar                  │
│                                                          │
│  Loaded items (4):                                       │
│  • SN-2026-0142-001 (Carena posteriore)                  │
│  • SN-2026-0142-002 (Cupolino)                           │
│  • SN-2026-0142-003 (Carena posteriore)                  │
│  • SN-2026-0142-004 (Pannello laterale)                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 7.4 NDT viewer

For UT C-scan results:
- Image viewer with zoom
- Defect overlay (markers)
- Defect list with severity
- Side-by-side: scan + reference

---

## 8. KPIs

| KPI | Formula | Purpose |
|---|---|---|
| Mold cycle utilization | total_cycles / max_lifetime per mold | Asset utilization |
| Mold lifecycle prediction | (max_lifetime - current_cycles) / cycles_per_month | When to reorder |
| Prepreg out-time efficiency | actual_use_minutes / out_time_minutes per roll | Material handling efficiency |
| Prepreg waste | scrapped_due_to_out_time / total_rolls | Process discipline |
| Cure cycle success rate | completed / total_runs | Equipment reliability |
| Cure cycle on-time | actual_duration / planned_duration | Process control |
| NDT pass rate | pass / total_ndt | Quality |
| NDT defect rate per part | avg defects per piece | Quality |
| Autoclave OEE | per equipment KPI | Asset utilization |

---

## 9. Permissions

| Action | Permission |
|---|---|
| Create/edit mold | `mold.manage` (admin, planner) |
| Use mold | `mold.use` (operator with EXT skill) |
| Decommission mold | `mold.decommission` (supervisor) |
| Receive prepreg | `prepreg.receive` (operator) |
| Take out prepreg | `prepreg.take-out` (operator) |
| Start cure cycle | `cure.start` (operator with AUTOCLAVE skill) |
| View telemetry | `cure.read` (any production role) |
| Record NDT | `ndt.record` (operator with NDT skill) |
| Approve NDT result | `ndt.approve` (quality role) |

---

## 10. Cross-references

- Core spec: `MASTER_SPECIFICATION.md` § 4.57-4.60 (CFRP enums)
- Related: `extensions/EQUIPMENT_MANAGEMENT.md` (autoclave as equipment)
- Workflow ref: `extensions/WORKFLOW_CFRP.md` (concrete production example)
- Patterns: `BEST_PRACTICES.md` § 4.16-4.18 (Mold, Cure Cycle, NDT services)

---

## 11. Change Log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-27 | Initial extension v1.2 release |

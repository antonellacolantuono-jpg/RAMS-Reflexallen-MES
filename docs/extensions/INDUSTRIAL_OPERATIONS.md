# INDUSTRIAL_OPERATIONS — Extension v1.0

> **Type**: Core Extension (applies to all production lines)
> **Parent**: `MASTER_SPECIFICATION.md` v1.2
> **Status**: MVP
> **Last updated**: 2026-04-27

---

## 1. Concept

Real industrial production has patterns that don't fit a simple "1 cycle = 1 piece" model. This extension covers the **advanced operational patterns** required for Tier 1 automotive production:

- Multi-output cycles (1 cycle → N pieces)
- Continuous production (extrusion, lamination)
- Sample taking (separate from production count)
- First Article Inspection (FAI) per PPAP
- Containerized WIP (buffer between phases)
- Subassemblies with nested BOM
- Quality Hold / Release workflow

**Scope MVP**:
- ✅ All 7 patterns above
- ✅ Material consumption non-discrete (granuli, liquids)

**Out of scope (V2)**:
- ❌ SPC (Statistical Process Control) charts
- ❌ Predictive quality (ML)
- ❌ Customer-specific quality requirements

---

## 2. Multi-Output Cycles

### 2.1 Concept

A single device cycle may produce multiple discrete pieces:
- **Mold with 4 cavities** → 1 cycle = 4 pieces
- **Extrusion run + cuts** → 1 run = N tubes (variable)
- **Multi-cavity press** → fixed N

### 2.2 Domain model

```prisma
// Add to Phase entity:
model WorkflowPhase {
  // ... existing fields
  productionMode      ProductionMode @default(discrete) @map("production_mode")
  multiOutputType     MultiOutputType @default(none) @map("multi_output_type")
  expectedOutputsPerCycle Int? @map("expected_outputs_per_cycle")
}

model CycleExecution {
  id                  String   @id @default(uuid()) @db.Uuid
  plantId             String   @map("plant_id") @db.Uuid
  
  workOrderId         String   @map("work_order_id") @db.Uuid
  phaseId             String   @map("phase_id") @db.Uuid
  cycleNumber         Int      @map("cycle_number")
  
  status              CycleStatus @default(pending)    // pending, running, completed, failed
  
  plannedStart        DateTime? @map("planned_start") @db.Timestamptz(3)
  actualStart         DateTime? @map("actual_start") @db.Timestamptz(3)
  actualEnd           DateTime? @map("actual_end") @db.Timestamptz(3)
  
  expectedOutputCount Int      @map("expected_output_count")
  actualOutputCount   Int?     @map("actual_output_count")
  
  // Metadata
  recipeVersionId     String?  @map("recipe_version_id") @db.Uuid
  equipmentId         String?  @map("equipment_id") @db.Uuid
  operatorId          String   @map("operator_id") @db.Uuid
  
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  
  productionRecords   ProductionRecord[]
  
  @@unique([workOrderId, phaseId, cycleNumber])
  @@map("cycle_executions")
}

model ProductionRecord {
  id                  String   @id @default(uuid()) @db.Uuid
  plantId             String   @map("plant_id") @db.Uuid
  
  workOrderId         String   @map("work_order_id") @db.Uuid
  cycleId             String?  @map("cycle_id") @db.Uuid
  phaseId             String   @map("phase_id") @db.Uuid
  
  serialNumber        String?  @map("serial_number")
  outcome             ProductionOutcome              // ok, scrap, rework, sample, hold
  quantity            Decimal  @default(1) @db.Decimal(15, 4)
  
  // For tracking sub-position in multi-output cycle
  cavityIndex         Int?     @map("cavity_index")
  
  scrapCauseCodeId    String?  @map("scrap_cause_code_id") @db.Uuid
  reworkReason        String?  @map("rework_reason")
  
  recordedAt          DateTime @default(now()) @map("recorded_at") @db.Timestamptz(3)
  recordedBy          String   @map("recorded_by") @db.Uuid
  
  cycle               CycleExecution? @relation(fields: [cycleId], references: [id])
  
  @@index([workOrderId, recordedAt])
  @@index([cycleId])
  @@index([serialNumber])
  @@map("production_records")
}

enum ProductionMode {
  discrete
  continuous
  
  @@map("production_mode")
}

enum MultiOutputType {
  none
  fixed
  variable
  
  @@map("multi_output_type")
}

enum CycleStatus {
  pending
  running
  completed
  failed
  
  @@map("cycle_status")
}

enum ProductionOutcome {
  ok
  scrap
  rework
  sample
  hold
  
  @@map("production_outcome")
}
```

### 2.3 Business rules

- **Fixed multi-output**: actualOutputCount must equal expectedOutputCount, else cycle fails
- **Variable multi-output**: actualOutputCount can vary (operator declares at completion)
- **Each output is a separate ProductionRecord** for genealogy
- **Counters update atomically** in single transaction
- **Scrap compensation**: each scrap output triggers `qtyRemaining` increase

---

## 3. Continuous Production

### 3.1 Concept

For processes without discrete cycles (extrusion, lamination):
- Production runs continuously for hours
- Output measured at intervals (every X minutes)
- Material consumption is rate-based (kg/h)
- Final tally at run completion

### 3.2 Domain model

```prisma
model ContinuousProductionRun {
  id                  String   @id @default(uuid()) @db.Uuid
  plantId             String   @map("plant_id") @db.Uuid
  
  workOrderId         String   @map("work_order_id") @db.Uuid
  phaseId             String   @map("phase_id") @db.Uuid
  equipmentId         String   @map("equipment_id") @db.Uuid
  
  status              ContinuousRunStatus @default(starting)
  
  startedAt           DateTime @map("started_at") @db.Timestamptz(3)
  startedBy           String   @map("started_by") @db.Uuid
  stoppedAt           DateTime? @map("stopped_at") @db.Timestamptz(3)
  stoppedBy           String?  @map("stopped_by") @db.Uuid
  stopReason          String?  @map("stop_reason")
  
  // Planning
  plannedRunDuration  Int      @map("planned_run_duration")  // seconds
  plannedOutputCount  Int      @map("planned_output_count")
  
  // Final tally (set at stop)
  finalOutputCount    Int?     @map("final_output_count")
  
  // Rate-based metrics
  materialConsumptionRate Decimal? @map("material_consumption_rate") @db.Decimal(10, 3)  // kg/h or units/h
  
  // Audit
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  createdBy           String   @map("created_by") @db.Uuid
  
  logs                ContinuousProductionLog[]
  
  @@map("continuous_production_runs")
}

model ContinuousProductionLog {
  id                  String   @id @default(uuid()) @db.Uuid
  runId               String   @map("run_id") @db.Uuid
  
  timestamp           DateTime @default(now()) @db.Timestamptz(3)
  
  // Cumulative or rate readings
  outputUnitsCumulative   Int      @map("output_units_cumulative")
  outputUnitsThisInterval Int      @map("output_units_this_interval")
  materialConsumed        Decimal  @map("material_consumed") @db.Decimal(10, 3)
  
  // Device parameters snapshot
  deviceParameters    Json     @map("device_parameters")  // JSONB: temperatures, pressures, speeds
  
  loggedBy            String   @map("logged_by") @db.Uuid  // operator or 'system'
  
  run                 ContinuousProductionRun @relation(fields: [runId], references: [id], onDelete: Cascade)
  
  @@index([runId, timestamp])
  @@map("continuous_production_logs")
}

enum ContinuousRunStatus {
  starting
  running
  paused
  stopping
  stopped
  failed
  
  @@map("continuous_run_status")
}
```

### 3.3 Business rules

- **Periodic logging**: background job logs every N minutes (configurable, default 5)
- **Operator override**: operator can manually log readings on HMI
- **Final tally**: set at stop, reconciliation with planned
- **Variance alerts**: if actual rate < 90% planned → warning
- **Material consumption**: tracked in real-time, backflushed at run end

---

## 4. Sample Taking

### 4.1 Concept

Samples are pieces extracted from production for **offline testing** (burst test, dimensional, aging). They must be tracked separately from production count.

### 4.2 Domain model

```prisma
model Sample {
  id                  String   @id @default(uuid()) @db.Uuid
  plantId             String   @map("plant_id") @db.Uuid
  
  code                String                          // SMP-2026-0142-01
  
  workOrderId         String   @map("work_order_id") @db.Uuid
  phaseId             String?  @map("phase_id") @db.Uuid
  
  sampleType          SampleType @map("sample_type")  // first_article, periodic, lot_certification, customer_request
  serialNumber        String?  @map("serial_number")
  
  status              SampleStatus @default(pending_test)
  
  takenAt             DateTime @map("taken_at") @db.Timestamptz(3)
  takenBy             String   @map("taken_by") @db.Uuid
  
  fromProduction      Boolean  @default(true) @map("from_production")  // if true, decrement WO count
  
  plannedTests        String[] @map("planned_tests")    // ['burst', 'dimensional', 'aging']
  testCompletedAt     DateTime? @map("test_completed_at") @db.Timestamptz(3)
  
  notes               String?
  
  // Audit
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  createdBy           String   @map("created_by") @db.Uuid
  
  workOrder           WorkOrder @relation(fields: [workOrderId], references: [id])
  testResults         SampleTestResult[]
  
  @@unique([plantId, code])
  @@index([workOrderId])
  @@index([sampleType, status])
  @@map("samples")
}

model SampleTestResult {
  id                  String   @id @default(uuid()) @db.Uuid
  sampleId            String   @map("sample_id") @db.Uuid
  
  testType            String   @map("test_type")       // 'burst', 'dimensional', etc.
  outcome             TestOutcome                       // pass, fail, marginal
  measuredValuesJson  Json?    @map("measured_values_json")  // structured measurements
  notes               String?
  attachmentUrls      String[] @map("attachment_urls") // photos, lab reports
  
  recordedAt          DateTime @default(now()) @map("recorded_at") @db.Timestamptz(3)
  recordedBy          String   @map("recorded_by") @db.Uuid
  
  sample              Sample   @relation(fields: [sampleId], references: [id], onDelete: Cascade)
  
  @@index([sampleId])
  @@map("sample_test_results")
}

enum SampleType {
  first_article
  periodic
  lot_certification
  customer_request
  
  @@map("sample_type")
}

enum SampleStatus {
  pending_test
  testing
  passed
  failed
  archived
  
  @@map("sample_status")
}

enum TestOutcome {
  pass
  fail
  marginal
  
  @@map("test_outcome")
}
```

### 4.3 Business rules

- **Take sample**: decrement `qtyProduced`, increment `qtySamples` on WO
- **Sample serial**: marked status `sample` (not in production count)
- **Multiple tests per sample**: each tracked individually
- **Sample status auto-update**: based on all test results
- **Periodic sampling**: configurable per phase (every N pieces or every X minutes)

---

## 5. First Article Inspection (FAI)

### 5.1 Concept

PPAP (Production Part Approval Process) requires formal inspection of first piece(s) before production proceeds. This is **mandatory for automotive Tier 1**.

### 5.2 Domain model

```prisma
model FAI {
  id                  String   @id @default(uuid()) @db.Uuid
  plantId             String   @map("plant_id") @db.Uuid
  
  code                String                          // FAI-2026-0042
  
  workOrderId         String   @map("work_order_id") @db.Uuid
  itemId              String   @map("item_id") @db.Uuid
  
  pieceCount          Int      @default(1) @map("piece_count")  // typically 1-3 pieces
  serialNumbers       String[] @map("serial_numbers")
  
  status              FAIStatus @default(in_progress)
  
  plannedTests        String[] @map("planned_tests")  // ['dimensional', 'visual', 'pressure', ...]
  
  initiatedAt         DateTime @map("initiated_at") @db.Timestamptz(3)
  initiatedBy         String   @map("initiated_by") @db.Uuid
  
  approvedAt          DateTime? @map("approved_at") @db.Timestamptz(3)
  approvedBy          String?  @map("approved_by") @db.Uuid
  approvalNotes       String?  @map("approval_notes")
  
  rejectedAt          DateTime? @map("rejected_at") @db.Timestamptz(3)
  rejectedBy          String?  @map("rejected_by") @db.Uuid
  rejectionReason     String?  @map("rejection_reason")
  
  attachmentUrls      String[] @map("attachment_urls")  // PPAP report PDF, photos
  
  // Audit
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  createdBy           String   @map("created_by") @db.Uuid
  updatedAt           DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)
  
  workOrder           WorkOrder @relation(fields: [workOrderId], references: [id])
  results             FAIResult[]
  
  @@unique([plantId, code])
  @@index([workOrderId])
  @@map("fai")
}

model FAIResult {
  id                  String   @id @default(uuid()) @db.Uuid
  faiId               String   @map("fai_id") @db.Uuid
  
  testType            String   @map("test_type")
  outcome             TestOutcome
  measuredValuesJson  Json?    @map("measured_values_json")
  toleranceCheck      Json?    @map("tolerance_check")  // expected vs actual
  notes               String?
  attachmentUrls      String[] @map("attachment_urls")
  
  recordedAt          DateTime @default(now()) @map("recorded_at") @db.Timestamptz(3)
  recordedBy          String   @map("recorded_by") @db.Uuid
  
  fai                 FAI      @relation(fields: [faiId], references: [id], onDelete: Cascade)
  
  @@index([faiId])
  @@map("fai_results")
}

// Add to WorkOrder:
model WorkOrder {
  // ... existing fields
  productionBlocked   Boolean  @default(false) @map("production_blocked")
  blockedReason       String?  @map("blocked_reason")
  firstPieceApprovedAt DateTime? @map("first_piece_approved_at") @db.Timestamptz(3)
}

enum FAIStatus {
  in_progress
  approved
  rejected
  pending_review
  
  @@map("fai_status")
}
```

### 5.3 Business rules

- **FAI initiation** sets `WorkOrder.productionBlocked = true`
- **HMI** displays clear "FAI in progress" banner, blocks step execution after first piece
- **Approval requires `fai.approve` permission** (typically `quality` role)
- **Approval unblocks production**: `productionBlocked = false`, `firstPieceApprovedAt = now()`
- **Rejection keeps production blocked**, requires investigation
- **PPAP attachments**: PDF report archived for audit (15+ years retention)
- **Mandatory tests** per item type (configurable in item registry)

### 5.4 FAI workflow

```
Production starts → WO released → first piece(s) produced
                                        │
                                        ▼
                                FAI auto-initiated (or manual)
                                        │
                                        ▼
                            Production blocked at piece N+1
                                        │
                                        ▼
                            Tests performed on FAI piece(s)
                                        │
                                        ▼
                                Results recorded
                                        │
                          ┌─────────────┴─────────────┐
                          ▼                           ▼
                       APPROVED                    REJECTED
                          │                           │
                          ▼                           ▼
                Production unblocked           Investigation
                                                    │
                                                    ▼
                                            Process correction
                                                    │
                                                    ▼
                                            New FAI required
```

---

## 6. Containerized WIP

### 6.1 Concept

Buffer phases use physical containers (kanban bins, trolleys) to accumulate Work In Progress between production phases. The MES tracks where WIP is.

### 6.2 Domain model

```prisma
model WIPContainer {
  id                  String   @id @default(uuid()) @db.Uuid
  plantId             String   @map("plant_id") @db.Uuid
  
  code                String                          // WIP-WC1-001
  
  containerType       String   @map("container_type") // 'kanban_bin', 'trolley', 'pallet', etc.
  capacity            Int                              // max pieces
  
  currentLocationId   String?  @map("current_location_id") @db.Uuid
  currentItemId       String?  @map("current_item_id") @db.Uuid
  currentCount        Int      @default(0) @map("current_count")
  
  // Quality status (mirrored from contents)
  qualityStatus       String   @default("approved") @map("quality_status")
  
  // Lifecycle
  active              Boolean  @default(true)
  
  // Audit
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  createdBy           String   @map("created_by") @db.Uuid
  updatedAt           DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)
  updatedBy           String   @map("updated_by") @db.Uuid
  deletedAt           DateTime? @map("deleted_at") @db.Timestamptz(3)
  
  contents            WIPContainerContent[]
  movements           WIPMovement[]
  
  @@unique([plantId, code])
  @@index([currentLocationId])
  @@map("wip_containers")
}

model WIPContainerContent {
  id                  String   @id @default(uuid()) @db.Uuid
  containerId         String   @map("container_id") @db.Uuid
  
  workOrderId         String   @map("work_order_id") @db.Uuid
  serialNumber        String?  @map("serial_number")
  quantity            Decimal  @default(1) @db.Decimal(15, 4)
  
  enteredAt           DateTime @default(now()) @map("entered_at") @db.Timestamptz(3)
  enteredBy           String   @map("entered_by") @db.Uuid
  exitedAt            DateTime? @map("exited_at") @db.Timestamptz(3)
  exitedBy            String?  @map("exited_by") @db.Uuid
  
  container           WIPContainer @relation(fields: [containerId], references: [id], onDelete: Cascade)
  
  @@index([containerId, exitedAt])
  @@index([serialNumber])
  @@map("wip_container_contents")
}

model WIPMovement {
  id                  String   @id @default(uuid()) @db.Uuid
  containerId         String   @map("container_id") @db.Uuid
  
  fromLocationId      String?  @map("from_location_id") @db.Uuid
  toLocationId        String   @map("to_location_id") @db.Uuid
  
  movedAt             DateTime @default(now()) @map("moved_at") @db.Timestamptz(3)
  movedBy             String   @map("moved_by") @db.Uuid
  
  notes               String?
  
  container           WIPContainer @relation(fields: [containerId], references: [id])
  
  @@index([containerId, movedAt])
  @@map("wip_movements")
}
```

### 6.3 Business rules

- **Container capacity**: enforced (cannot add piece if full)
- **Single item type per container**: simpler tracking (avoid mix)
- **Genealogy preserved**: each piece tracked individually inside container
- **Movement audit**: every location change logged

---

## 7. Subassembly & Nested BOM

### 7.1 Concept

A product may be composed of sub-assemblies that are pre-assembled before main production. Each sub-assembly has its own BOM, workflow, and lifecycle.

### 7.2 Domain model

```prisma
// Add to Item entity
model Item {
  // ... existing fields
  isSubassembly       Boolean  @default(false) @map("is_subassembly")
  parentItemIds       String[] @map("parent_item_ids") @db.Uuid  // items that use this as sub
}

// Add to BOM entity
model Bom {
  // ... existing fields
  
  // Multi-level BOM support
  isNested            Boolean  @default(false) @map("is_nested")
  
  components          BomComponent[]
}

model BomComponent {
  // ... existing fields
  
  // If component is itself a subassembly with its own BOM
  isSubassembly       Boolean  @default(false) @map("is_subassembly")
  subassemblyBomId    String?  @map("subassembly_bom_id") @db.Uuid
  
  subassemblyBom      Bom?     @relation("SubassemblyBom", fields: [subassemblyBomId], references: [id])
}
```

### 7.3 Business rules

- **BOM explosion** is recursive (max depth 5 levels typical)
- **Sub-assemblies have own WOs** (planned independently)
- **Just-in-time vs make-to-stock**: configurable per item
- **Genealogy traversal**: track from finished good back to raw materials through subs

### 7.4 Example

```
Tubo pneumatico assemblato (FG)
├── BOM 1 level
│   ├── Tubo grezzo 12mm × 2m (SUB)
│   │   └── BOM nested
│   │       ├── Granuli PA12 (RAW)
│   │       ├── EVOH (RAW)
│   │       └── Master batch (RAW)
│   ├── Raccordo lato A (COMP)
│   └── Raccordo lato B (COMP)
```

---

## 8. Quality Hold / Release

### 8.1 Concept

When a lot has quality concerns, it must be **isolated** from production until decision is made. Hold blocks downstream consumption.

### 8.2 Domain model

```prisma
model LotHold {
  id                  String   @id @default(uuid()) @db.Uuid
  plantId             String   @map("plant_id") @db.Uuid
  
  code                String                          // HOLD-260415-001-A
  
  lotId               String   @map("lot_id") @db.Uuid
  
  reason              LotHoldReason
  description         String
  severity            String   @default("medium")    // low, medium, high, critical
  
  status              HoldStatus @default(active)
  
  appliedAt           DateTime @map("applied_at") @db.Timestamptz(3)
  appliedBy           String   @map("applied_by") @db.Uuid
  
  releasedAt          DateTime? @map("released_at") @db.Timestamptz(3)
  releasedBy          String?  @map("released_by") @db.Uuid
  releaseDecision     String?  @map("release_decision")  // approved, rejected, conditional
  releaseNotes        String?  @map("release_notes")
  
  attachmentUrls      String[] @map("attachment_urls")
  
  // Audit
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  createdBy           String   @map("created_by") @db.Uuid
  updatedAt           DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)
  
  lot                 Lot      @relation(fields: [lotId], references: [id])
  
  @@unique([plantId, code])
  @@index([lotId, status])
  @@map("lot_holds")
}

enum LotHoldReason {
  awaiting_test_results
  under_review
  customer_complaint
  documentation_pending
  quarantine
  
  @@map("lot_hold_reason")
}

enum HoldStatus {
  active
  released
  pending
  
  @@map("hold_status")
}
```

### 8.3 Business rules

- **Hold applied** → lot quality status → `quarantine`
- **Downstream blocked**: any WO trying to consume held lot is blocked
- **Notification**: affected WOs receive notifications
- **Release requires `lotHold.release` permission** (quality role)
- **Release decisions**:
  - `approved` → lot back to `approved`, downstream unblocked
  - `rejected` → lot to `rejected`, scrap or return to supplier
  - `conditional` → lot approved with conditions (logged)

---

## 9. Material Consumption Non-Discrete

### 9.1 Concept

For materials consumed continuously (granuli polimerici, liquids), tracking is **rate-based** not piece-based.

### 9.2 Approach

```typescript
// At material consumption (during continuous run):
function consumeMaterial(
  workOrderId: string,
  materialId: string,
  quantity: number,
  unit: 'kg' | 'l' | 'pieces',
  ctx: RequestContext
) {
  // Decrement lot quantity
  await prisma.lotMovement.create({
    data: {
      lotId: ctx.activeLotId,
      type: 'consume',
      quantity,
      unit,
      workOrderId,
      consumedAt: new Date(),
      consumedBy: ctx.userId
    }
  })
  
  // Update WO material consumption tracking
  await prisma.workOrderMaterialConsumption.upsert({
    where: { workOrderId_materialId: { workOrderId, materialId } },
    create: { workOrderId, materialId, totalConsumed: quantity, unit },
    update: { totalConsumed: { increment: quantity } }
  })
  
  // Auto-detect if approaching FIFO/lot exhaustion
  // ...
}
```

### 9.3 Business rules

- **Backflush**: if continuous, periodic backflush during run (every N minutes)
- **Lot tracking**: which lot was consumed when (genealogy)
- **FIFO/FEFO enforcement**: oldest lot consumed first
- **Variance alerts**: if actual rate >> planned → warning (waste, leak, calibration off)

---

## 10. KPIs

| KPI | Formula | Domain |
|---|---|---|
| Multi-output efficiency | actual_outputs / expected_outputs | Multi-output |
| Continuous run efficiency | actual_count / planned_count | Continuous |
| Sample failure rate | failed_samples / total_samples | Quality |
| FAI approval rate | approved / total_FAI | Quality |
| FAI cycle time | avg(approvedAt - initiatedAt) | Quality |
| WIP turnover | avg(exitedAt - enteredAt) | Logistics |
| WIP container utilization | avg(currentCount / capacity) | Logistics |
| Hold resolution time | avg(releasedAt - appliedAt) | Quality |
| Material consumption variance | actual / planned per lot | Production |

---

## 11. Permissions

| Action | Permission |
|---|---|
| Take sample | `sample.take` (operator, supervisor, quality) |
| Record sample test | `sample.test` (operator, quality) |
| Initiate FAI | `fai.initiate` (operator, supervisor, quality) |
| Approve FAI | `fai.approve` (quality only) |
| Reject FAI | `fai.reject` (quality only) |
| Apply lot hold | `lotHold.apply` (operator, supervisor, quality) |
| Release lot hold | `lotHold.release` (quality only) |
| Manage WIP containers | `wip.manage` (operator, supervisor) |
| Move WIP | `wip.move` (operator) |

---

## 12. Cross-references

- Core spec: `MASTER_SPECIFICATION.md` § 4.53 (Sample Type), § 4.54 (Lot Hold Reason), § 4.55 (Production Mode), § 4.56 (Multi-Output Type)
- Patterns: `BEST_PRACTICES.md` § 4.11-4.15

---

## 13. Change Log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-27 | Initial extension v1.2 release |

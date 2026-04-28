# EQUIPMENT_MANAGEMENT — Extension v1.0

> **Type**: Core Extension (applies to all production lines)
> **Parent**: `MASTER_SPECIFICATION.md` v1.2
> **Status**: MVP
> **Last updated**: 2026-04-27

---

## 1. Concept

Equipment in a MES is more than just a list of machines: it's a **lifecycle-managed asset** with state transitions, maintenance history, and tool wear tracking. This extension formalizes equipment management beyond the basic registry.

**Scope MVP**:
- ✅ Equipment State Machine (XState formal)
- ✅ Maintenance Order entity + lifecycle
- ✅ MaintenanceLog (history)
- ✅ Tool Wear Tracking (cycles + thresholds)
- ✅ Tool Changeover formal procedure
- ✅ Equipment-specific OEE breakdown

**Out of scope (V2)**:
- ❌ Predictive maintenance (ML-based)
- ❌ Spare parts inventory
- ❌ External CMMS integration
- ❌ IIoT real telemetry (OPC UA, MQTT)
- ❌ Equipment lifecycle costing (TCO)
- ❌ Equipment warranty tracking

---

## 2. Domain Model

### 2.1 Entities

```
EquipmentNode (extended from core)
  ├── status: EquipmentStatus (enhanced state machine)
  ├── currentCalibrationStatus
  ├── lastMaintenanceAt
  ├── nextMaintenanceDueAt
  ├── totalCyclesCount
  ├── totalRunHours
  └── relations:
      ├── MaintenanceOrders (1:N)
      ├── MaintenanceLogs (1:N)
      └── EquipmentStateLog (1:N)

MaintenanceOrder
  ├── code (MNT-YYYY-NNNN)
  ├── equipmentId
  ├── type (preventive/corrective/calibration/inspection)
  ├── status (scheduled/in_progress/completed/cancelled/overdue/deferred)
  ├── plannedStart, plannedEnd
  ├── actualStart, actualEnd
  ├── assignedToId (operator/technician)
  ├── priority
  ├── description
  └── relation: MaintenanceLog (1:1 when completed)

MaintenanceLog
  ├── maintenanceOrderId
  ├── equipmentId
  ├── type
  ├── actionsPerformed (JSONB array)
  ├── partsReplaced (JSONB array)
  ├── findings
  ├── recommendations
  ├── performedBy
  ├── performedAt
  └── attachments (PDFs, photos)

Tool (extended from core)
  ├── currentCyclesCount
  ├── maxCycles (lifetime)
  ├── wearStatus (new/good/worn/at_limit/replaced)
  ├── lastUsedAt
  ├── replacedAt
  ├── replacementCount
  └── relations:
      └── ToolWearHistory (1:N)

ToolWearHistory
  ├── toolId
  ├── previousCyclesCount
  ├── replacedBy
  ├── replacedAt
  ├── reason
  └── replacement attached photo

EquipmentStateLog
  ├── equipmentId
  ├── fromState
  ├── toState
  ├── transitionedAt
  ├── transitionedBy
  ├── triggeredBy (user/system/maintenance)
  └── reason
```

### 2.2 Prisma schema

```prisma
// === Maintenance Order ===
model MaintenanceOrder {
  id                  String   @id @default(uuid()) @db.Uuid
  plantId             String   @map("plant_id") @db.Uuid
  
  code                String                                // MNT-2026-0042
  equipmentId         String   @map("equipment_id") @db.Uuid
  
  type                MaintenanceType                       // preventive, corrective, calibration, inspection
  status              MaintenanceStatus @default(scheduled)
  priority            String   @default("normal")           // low, normal, high, urgent
  
  description         String
  
  plannedStart        DateTime @map("planned_start") @db.Timestamptz(3)
  plannedEnd          DateTime @map("planned_end") @db.Timestamptz(3)
  actualStart         DateTime? @map("actual_start") @db.Timestamptz(3)
  actualEnd           DateTime? @map("actual_end") @db.Timestamptz(3)
  
  assignedToId        String?  @map("assigned_to_id") @db.Uuid
  startedBy           String?  @map("started_by") @db.Uuid
  completedBy         String?  @map("completed_by") @db.Uuid
  cancelledBy         String?  @map("cancelled_by") @db.Uuid
  cancelReason        String?  @map("cancel_reason")
  
  // Audit
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  createdBy           String   @map("created_by") @db.Uuid
  updatedAt           DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)
  updatedBy           String   @map("updated_by") @db.Uuid
  deletedAt           DateTime? @map("deleted_at") @db.Timestamptz(3)
  version             Int      @default(1)
  
  plant               Plant    @relation(fields: [plantId], references: [id])
  equipment           EquipmentNode @relation(fields: [equipmentId], references: [id])
  log                 MaintenanceLog?
  
  @@unique([plantId, code])
  @@index([equipmentId, status])
  @@index([plantId, status])
  @@index([plannedStart])
  @@map("maintenance_orders")
}

// === Maintenance Log ===
model MaintenanceLog {
  id                  String   @id @default(uuid()) @db.Uuid
  maintenanceOrderId  String   @unique @map("maintenance_order_id") @db.Uuid
  equipmentId         String   @map("equipment_id") @db.Uuid
  
  type                MaintenanceType
  actionsPerformed    Json     @map("actions_performed")    // array of action descriptions
  partsReplaced       Json?    @map("parts_replaced")       // array of {partCode, qty, lotNumber}
  findings            String?
  recommendations     String?
  
  performedBy         String   @map("performed_by") @db.Uuid
  performedAt         DateTime @map("performed_at") @db.Timestamptz(3)
  
  durationMinutes     Int?     @map("duration_minutes")
  
  // Attachments stored separately
  
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  
  maintenanceOrder    MaintenanceOrder @relation(fields: [maintenanceOrderId], references: [id], onDelete: Restrict)
  equipment           EquipmentNode @relation(fields: [equipmentId], references: [id])
  
  @@index([equipmentId, performedAt(sort: Desc)])
  @@map("maintenance_logs")
}

// === Equipment State Log ===
model EquipmentStateLog {
  id                  String   @id @default(uuid()) @db.Uuid
  equipmentId         String   @map("equipment_id") @db.Uuid
  
  fromState           EquipmentStatus? @map("from_state")
  toState             EquipmentStatus  @map("to_state")
  
  transitionedAt      DateTime @default(now()) @map("transitioned_at") @db.Timestamptz(3)
  transitionedBy      String   @map("transitioned_by") @db.Uuid
  triggeredBy         String   @map("triggered_by")        // 'user' | 'system' | 'maintenance'
  reason              String?
  
  relatedEntityType   String?  @map("related_entity_type") // e.g., 'MaintenanceOrder', 'WorkOrder'
  relatedEntityId     String?  @map("related_entity_id") @db.Uuid
  
  equipment           EquipmentNode @relation(fields: [equipmentId], references: [id])
  
  @@index([equipmentId, transitionedAt(sort: Desc)])
  @@map("equipment_state_log")
}

// === Tool extensions (add to existing Tool model) ===
// Add fields to Tool entity:
//   currentCyclesCount Int @default(0) @map("current_cycles_count")
//   maxCycles          Int? @map("max_cycles")
//   wearStatus         ToolWearStatus @default(new) @map("wear_status")
//   lastUsedAt         DateTime? @map("last_used_at") @db.Timestamptz(3)
//   replacedAt         DateTime? @map("replaced_at") @db.Timestamptz(3)
//   replacementCount   Int @default(0) @map("replacement_count")

model ToolWearHistory {
  id                  String   @id @default(uuid()) @db.Uuid
  toolId              String   @map("tool_id") @db.Uuid
  
  previousCyclesCount Int      @map("previous_cycles_count")
  newCyclesCount      Int      @default(0) @map("new_cycles_count")
  
  replacedBy          String   @map("replaced_by") @db.Uuid
  replacedAt          DateTime @default(now()) @map("replaced_at") @db.Timestamptz(3)
  
  reason              String
  attachmentUrls      String[] @map("attachment_urls")
  
  tool                Tool     @relation(fields: [toolId], references: [id])
  
  @@index([toolId, replacedAt(sort: Desc)])
  @@map("tool_wear_history")
}

// === Enums ===
enum MaintenanceType {
  preventive
  corrective
  calibration
  inspection
  
  @@map("maintenance_type")
}

enum MaintenanceStatus {
  scheduled
  in_progress
  completed
  cancelled
  overdue
  deferred
  
  @@map("maintenance_status")
}

enum ToolWearStatus {
  new
  good
  worn
  at_limit
  replaced
  
  @@map("tool_wear_status")
}

// EquipmentStatus enum (already in core, but extended for v1.2):
enum EquipmentStatus {
  available
  setup_required        // NEW v1.2 — awaiting setup before use
  in_use
  paused                // NEW v1.2 — temporarily stopped
  maintenance_pending   // NEW v1.2 — maintenance scheduled
  maintenance
  broken
  offline
  
  @@map("equipment_status")
}
```

---

## 3. State Machines

### 3.1 Equipment State Machine

```typescript
// /packages/shared/machines/equipment.machine.ts
import { setup, assign } from 'xstate'

export const equipmentMachine = setup({
  types: {} as {
    context: EquipmentContext
    events: EquipmentEvent
    input: { equipmentId: string; initialStatus: EquipmentStatus }
  },
  
  guards: {
    canStartUsage: ({ context }) => 
      context.calibrationValid && context.skillsVerified,
    
    isMaintenanceDue: ({ context }) =>
      context.nextMaintenanceDueAt && new Date() >= context.nextMaintenanceDueAt,
    
    canReturnToService: ({ context, event }) =>
      event.type === 'MAINTENANCE_COMPLETE' && event.outcome === 'success'
  },
  
  actions: {
    logTransition: ({ context, event }) => {
      // Log to EquipmentStateLog
    },
    notifyOperators: ({ context }) => {
      // Notify operators when equipment becomes available
    },
    scheduleNextMaintenance: assign({
      nextMaintenanceDueAt: ({ context, event }) => 
        computeNextMaintenanceDate(context.lastMaintenanceAt, context.maintenanceInterval)
    })
  }
}).createMachine({
  id: 'equipment',
  initial: 'available',
  
  context: ({ input }) => ({
    equipmentId: input.equipmentId,
    calibrationValid: true,
    skillsVerified: false,
    nextMaintenanceDueAt: null,
    lastMaintenanceAt: null,
    maintenanceInterval: 'P3M'  // ISO 8601 duration: 3 months
  }),
  
  states: {
    available: {
      entry: ['logTransition', 'notifyOperators'],
      on: {
        ASSIGN_WO: 'setup_required',
        SCHEDULE_MAINTENANCE: 'maintenance_pending',
        REPORT_BROKEN: 'broken',
        TAKE_OFFLINE: 'offline'
      }
    },
    
    setup_required: {
      on: {
        SETUP_COMPLETE: { 
          target: 'in_use',
          guard: 'canStartUsage'
        },
        ABORT_SETUP: 'available'
      }
    },
    
    in_use: {
      on: {
        PAUSE: 'paused',
        WO_COMPLETE: 'available',
        REPORT_BROKEN: 'broken',
        EMERGENCY_STOP: 'broken'
      }
    },
    
    paused: {
      on: {
        RESUME: 'in_use',
        WO_COMPLETE: 'available',
        REPORT_BROKEN: 'broken'
      }
    },
    
    maintenance_pending: {
      on: {
        START_MAINTENANCE: 'maintenance',
        CANCEL_MAINTENANCE: 'available'
      }
    },
    
    maintenance: {
      on: {
        MAINTENANCE_COMPLETE: {
          target: 'available',
          guard: 'canReturnToService',
          actions: 'scheduleNextMaintenance'
        },
        MAINTENANCE_FAILED: 'broken'
      }
    },
    
    broken: {
      on: {
        SCHEDULE_REPAIR: 'maintenance_pending',
        DECOMMISSION: 'offline'
      }
    },
    
    offline: {
      on: {
        REACTIVATE: 'available'
      }
    }
  }
})
```

### 3.2 State transition matrix

| From State | Event | To State | Guard | Side Effect |
|---|---|---|---|---|
| available | ASSIGN_WO | setup_required | — | Lock for WO |
| available | SCHEDULE_MAINTENANCE | maintenance_pending | — | Create MaintenanceOrder |
| setup_required | SETUP_COMPLETE | in_use | canStartUsage | Lock equipment |
| setup_required | ABORT_SETUP | available | — | Release lock |
| in_use | PAUSE | paused | — | Track pause time |
| in_use | WO_COMPLETE | available | — | Release lock + log cycle count |
| in_use | REPORT_BROKEN | broken | — | Notify supervisor |
| paused | RESUME | in_use | — | — |
| maintenance_pending | START_MAINTENANCE | maintenance | — | Update MaintenanceOrder status |
| maintenance | MAINTENANCE_COMPLETE | available | canReturnToService | Schedule next maintenance |
| broken | SCHEDULE_REPAIR | maintenance_pending | — | Create corrective MaintenanceOrder |

---

## 4. Business Rules

### 4.1 Equipment status transitions

- **Only authorized roles** can transition equipment status:
  - `admin`: any transition
  - `supervisor`: most transitions including emergency stop
  - `operator`: only operational (assign WO, start usage, pause, complete)
  - `maintenance` role: maintenance-related transitions

- **Audit trail mandatory**: every transition logged in `EquipmentStateLog`

- **Concurrent WO prevention**: equipment in `in_use` cannot be assigned to another WO

### 4.2 Maintenance order rules

- Equipment must be in `available`, `in_use`, or `paused` to schedule maintenance
- Scheduling maintenance transitions equipment to `maintenance_pending` (if idle) or queued
- Once `maintenance_pending`, no new WOs can be assigned to equipment
- Starting maintenance forces equipment to `maintenance` status
- Completing maintenance returns equipment to `available` and updates `lastMaintenanceAt`

### 4.3 Maintenance scheduling

- **Preventive**: scheduled based on interval (months/cycles/hours since last maintenance)
- **Corrective**: triggered by breakdown report
- **Calibration**: scheduled per calibration certificate validity
- **Inspection**: regular visual checks

Auto-detection of overdue:
```typescript
// Background job (cron daily)
@Cron('0 0 * * *')
async detectOverdueMaintenance() {
  const overdueOrders = await this.prisma.maintenanceOrder.findMany({
    where: {
      status: 'scheduled',
      plannedStart: { lt: new Date() }
    }
  })
  
  for (const order of overdueOrders) {
    await this.prisma.maintenanceOrder.update({
      where: { id: order.id },
      data: { status: 'overdue' }
    })
    
    this.events.emit('maintenanceOrder.overdue', { order })
  }
}
```

### 4.4 Tool wear tracking rules

- **Auto-increment** on every step that uses the tool
- **No manual edit** allowed on `currentCyclesCount`
- **Alerts at thresholds**:
  - 70% (worn) → warning to operator + supervisor notification
  - 90% (at_limit) → critical alert + auto-create maintenance order
  - 100% (exceeded) → block usage until replacement
- **Replacement procedure**:
  - Records previous cycle count in history
  - Resets counter to 0
  - Increments `replacementCount`
  - Requires reason and attachment (photo of replaced tool)

### 4.5 Equipment-specific OEE breakdown

For each equipment, calculate OEE components:

```typescript
interface EquipmentOEE {
  equipmentId: string
  period: { start: Date; end: Date }
  
  // Availability
  plannedRunTime: number        // seconds
  actualRunTime: number
  downtimeBreakdown: {
    breakdown: number
    setup: number
    minorStops: number
    scheduledMaintenance: number
  }
  availability: number          // 0-1
  
  // Performance
  idealCycleTime: number
  totalCount: number
  performance: number           // 0-1
  
  // Quality
  goodCount: number
  scrapCount: number
  reworkCount: number
  quality: number               // 0-1
  
  // OEE
  oee: number                   // availability × performance × quality
  
  // 6 Big Losses breakdown
  sixBigLosses: {
    breakdown: number
    setupAdjustment: number
    minorStop: number
    reducedSpeed: number
    defectLoss: number
    startupLoss: number
  }
}
```

---

## 5. API Endpoints

### Maintenance Orders

```
GET    /api/v1/maintenance-orders                    List with filters
POST   /api/v1/maintenance-orders                    Create (planner/supervisor)
GET    /api/v1/maintenance-orders/:id                Detail with log
PATCH  /api/v1/maintenance-orders/:id                Update (only if scheduled)
POST   /api/v1/maintenance-orders/:id/start          Start (transitions equipment)
POST   /api/v1/maintenance-orders/:id/complete       Complete with log
POST   /api/v1/maintenance-orders/:id/cancel         Cancel
POST   /api/v1/maintenance-orders/:id/defer          Defer to new date

GET    /api/v1/equipment/:id/maintenance-history     All maintenance logs for equipment
GET    /api/v1/equipment/:id/state-log               State transition history
GET    /api/v1/equipment/:id/oee                     Compute OEE for period
POST   /api/v1/equipment/:id/transition              Manual state transition (admin)
```

### Tool Wear

```
GET    /api/v1/tools/:id/wear                        Current wear status + history
POST   /api/v1/tools/:id/replace                     Replace tool (reset counter)
GET    /api/v1/tools/:id/wear-history                Replacement history
GET    /api/v1/tools/at-risk                         Tools at limit or worn
```

### Calendar/Scheduling

```
GET    /api/v1/maintenance-orders/calendar           Calendar view (date range)
GET    /api/v1/equipment/maintenance-due             Equipment with maintenance due
```

---

## 6. UI Patterns

### 6.1 Equipment Detail Page

Tabs:
- **Info** — basic data, current status, image
- **State Machine** — visual graph of current state + history
- **Maintenance** — list of orders, schedule, history
- **Tools** — tools associated with this equipment
- **Performance** — OEE breakdown, 6 Big Losses chart
- **Calibration** — certificates, expiration dates
- **Documents** — manuals, certificates, warranty

### 6.2 Maintenance Calendar View

```
[Calendar grid showing maintenance orders by date]

┌────────────────────────────────────────────────────────┐
│ Apr 2026                              [< Prev] [Next >]│
├──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬───┤
│ M│ T│ W│ T│ F│ S│ S│ M│ T│ W│ T│ F│ S│ S│ M│ T│ W│ T │
├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼───┤
│  │  │  │ 1│ 2│ 3│ 4│ 5│ 6│ 7│ 8│ 9│10│11│12│13│14│15 │
│  │  │  │  │█M│  │  │  │  │██│  │  │  │  │  │  │  │   │
│  │  │  │  │MNT-001│  │  │  │  │MNT-002│  │  │  │  │   │
└──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴───┘

Legend: 🟢 Completed | 🟡 In Progress | 🔵 Scheduled | 🔴 Overdue
```

### 6.3 Tool Wear Indicator

Component `<ToolWearIndicator>`:

```tsx
<ToolWearIndicator
  current={750}
  max={1000}
  status="worn"
  showAlert={true}
/>

// Renders:
// [████████████████░░░░] 75% — 750 / 1000 cycles
// Status: Worn (warning)
// Replacement recommended within 250 cycles
```

### 6.4 Equipment State Visualizer

Show current state + recent transitions:

```
Current: 🟡 IN USE (started 14:30, by Mario Rossi)

Recent state log:
  14:30  available → in_use      (Mario Rossi)
  10:15  maintenance → available (System, MNT-2026-0042 completed)
  10:00  maintenance_pending → maintenance (Luigi Bianchi)
  09:45  available → maintenance_pending (System, scheduled MNT-0042)
```

---

## 7. KPIs

### 7.1 Maintenance KPIs

| KPI | Formula | Purpose |
|---|---|---|
| MTBF (Mean Time Between Failures) | total_run_time / failure_count | Reliability |
| MTTR (Mean Time To Repair) | sum(repair_durations) / repair_count | Maintainability |
| Maintenance Compliance | completed_on_time / total_scheduled | Process discipline |
| Overdue Maintenance Rate | overdue_count / total_scheduled | Risk indicator |
| Avg Maintenance Duration | sum(actualEnd - actualStart) / count | Efficiency |
| Preventive vs Corrective Ratio | preventive / corrective | Maintenance strategy |

### 7.2 Tool wear KPIs

| KPI | Formula |
|---|---|
| Avg Tool Lifetime | avg(cyclesCount at replacement) per tool type |
| Tool Replacement Rate | replacements / period |
| Premature Replacement Rate | replacements before 50% lifetime / total replacements |
| Tool Cost per Piece | sum(tool_costs) / total_pieces_produced |

### 7.3 Equipment OEE

Per equipment, breakdown OEE by 6 Big Losses (per MASTER_SPEC § 16.2).

---

## 8. Integration Points

### 8.1 With Work Order

- WO release validates equipment availability
- Equipment goes to `setup_required` on WO assignment
- Equipment returns to `available` on WO completion

### 8.2 With Tools

- Tool used in step → auto-increment cycles count
- Tool changeover → manual reset + audit

### 8.3 With Auto-Generation Rules

- Tooling Check rule generates tool verification steps
- Device Verify rule generates equipment status check

### 8.4 With KPI Engine

- Equipment state log feeds OEE Availability calculation
- Cycle count from production records feeds Performance
- Quality records (good/scrap/rework) feeds Quality

---

## 9. Permissions

| Action | Required Permission |
|---|---|
| Create maintenance order | `maintenance.create` (planner, supervisor) |
| Start maintenance | `maintenance.start` (operator with maintenance role, supervisor) |
| Complete maintenance | `maintenance.complete` (operator with maintenance role, supervisor) |
| Cancel maintenance | `maintenance.cancel` (planner, supervisor with reason) |
| View maintenance log | `maintenance.read` (all roles except viewer) |
| Replace tool | `tool.replace` (operator with maintenance role) |
| Manual equipment state transition | `equipment.transition` (admin only, audit required) |

---

## 10. Cross-references

- Core spec: `MASTER_SPECIFICATION.md` § 4.51 (Equipment State Machine), § 4.49 (Maintenance Status), § 4.52 (Tool Wear Status)
- Related: `extensions/SCHEDULING_ASSIGNMENT.md` (equipment-WO relationship)
- Patterns: `BEST_PRACTICES.md` § 4.9 (Maintenance Order service), § 4.10 (Tool Wear service)

---

## 11. Change Log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-27 | Initial extension v1.2 release |

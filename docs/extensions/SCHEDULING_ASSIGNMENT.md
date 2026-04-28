# SCHEDULING_ASSIGNMENT — Extension v1.0

> **Type**: Core Extension (applies to all production lines)
> **Parent**: `MASTER_SPECIFICATION.md` v1.2
> **Status**: MVP (basic scheduling; advanced Gantt/MRP V2)
> **Last updated**: 2026-04-27

---

## 1. Concept

Linking Work Orders to operators and shifts is a core MES function. This extension defines **assignment-based scheduling** for MVP:

- Planner manually assigns WO (or specific Group) to an Operator
- System validates skills coverage automatically
- Operator sees dispatch list on HMI
- Reassignment and shift management included

**Scope MVP**:
- ✅ WorkOrderAssignment entity with lifecycle
- ✅ Skills coverage automatic check
- ✅ Manual assignment (planner UI)
- ✅ Dispatch list (operator HMI)
- ✅ Reassignment with audit
- ✅ Shift entity + ShiftAssignment
- ✅ Shift handover procedure

**Out of scope (V2)**:
- ❌ Automatic scheduling (forward/backward)
- ❌ Capacity planning algorithms
- ❌ Gantt drag-drop UI
- ❌ MRP integration
- ❌ What-if scheduling
- ❌ Workload balancing
- ❌ Multi-resource conflict resolution

---

## 2. Domain Model

### 2.1 Entities

```
WorkOrderAssignment
  ├── code (WOA-{wo}-{seq})
  ├── workOrderId
  ├── groupId? (optional — for assignment of specific group)
  ├── operatorId
  ├── shiftId?
  ├── status (pending/accepted/active/completed/reassigned)
  ├── assignedBy
  ├── assignedAt
  ├── acceptedAt?
  ├── startedAt?
  ├── completedAt?
  ├── reassignedAt?
  ├── reassignReason?
  ├── reassignedToAssignmentId? (link to new assignment)
  └── audit fields

Shift
  ├── code (SHIFT-MORNING / SHIFT-AFTERNOON / SHIFT-NIGHT / SHIFT-CUSTOM-{n})
  ├── name (Italian/English)
  ├── shiftType (morning/afternoon/night/custom)
  ├── startTime (HH:MM)
  ├── endTime (HH:MM)
  ├── crossesMidnight (boolean)
  ├── daysOfWeek (array: [1,2,3,4,5] = Mon-Fri)
  ├── plantId
  └── active

ShiftAssignment
  ├── operatorId
  ├── shiftId
  ├── effectiveFrom
  ├── effectiveTo? (null = ongoing)
  ├── notes
  └── createdBy

ShiftHandover
  ├── fromOperatorId
  ├── toOperatorId
  ├── workOrderId
  ├── handoverAt
  ├── notes
  ├── pendingTasks (JSONB)
  ├── attachments (photos, documents)
  └── createdBy
```

### 2.2 Prisma schema

```prisma
// === Work Order Assignment ===
model WorkOrderAssignment {
  id                  String   @id @default(uuid()) @db.Uuid
  plantId             String   @map("plant_id") @db.Uuid
  
  code                String                          // WOA-2026-0142-01
  
  workOrderId         String   @map("work_order_id") @db.Uuid
  groupId             String?  @map("group_id") @db.Uuid       // optional: specific group
  operatorId          String   @map("operator_id") @db.Uuid
  shiftId             String?  @map("shift_id") @db.Uuid
  
  status              AssignmentStatus @default(pending)
  
  assignedBy          String   @map("assigned_by") @db.Uuid
  assignedAt          DateTime @map("assigned_at") @db.Timestamptz(3)
  
  acceptedAt          DateTime? @map("accepted_at") @db.Timestamptz(3)
  startedAt           DateTime? @map("started_at") @db.Timestamptz(3)
  completedAt         DateTime? @map("completed_at") @db.Timestamptz(3)
  
  reassignedAt        DateTime? @map("reassigned_at") @db.Timestamptz(3)
  reassignReason      String?  @map("reassign_reason")
  reassignedToAssignmentId String? @map("reassigned_to_assignment_id") @db.Uuid
  
  // Skills override (if assigned despite missing skills)
  skillsOverridden    Boolean  @default(false) @map("skills_overridden")
  skillsOverrideReason String? @map("skills_override_reason")
  
  // Audit
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  createdBy           String   @map("created_by") @db.Uuid
  updatedAt           DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)
  updatedBy           String   @map("updated_by") @db.Uuid
  deletedAt           DateTime? @map("deleted_at") @db.Timestamptz(3)
  version             Int      @default(1)
  
  plant               Plant    @relation(fields: [plantId], references: [id])
  workOrder           WorkOrder @relation(fields: [workOrderId], references: [id], onDelete: Restrict)
  operator            Operator @relation(fields: [operatorId], references: [id], onDelete: Restrict)
  shift               Shift?   @relation(fields: [shiftId], references: [id])
  
  @@unique([plantId, code])
  @@index([workOrderId, status])
  @@index([operatorId, status])
  @@index([shiftId])
  @@index([plantId, status])
  @@map("work_order_assignments")
}

// === Shift ===
model Shift {
  id                  String   @id @default(uuid()) @db.Uuid
  plantId             String   @map("plant_id") @db.Uuid
  
  code                String                          // SHIFT-MORNING
  name                String
  nameEn              String?  @map("name_en")
  shiftType           ShiftType @map("shift_type")
  
  startTime           String   @map("start_time")     // "06:00"
  endTime             String   @map("end_time")       // "14:00"
  crossesMidnight     Boolean  @default(false) @map("crosses_midnight")
  daysOfWeek          Int[]    @map("days_of_week")   // [1,2,3,4,5] = Mon-Fri
  
  active              Boolean  @default(true)
  
  // Audit
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  createdBy           String   @map("created_by") @db.Uuid
  updatedAt           DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)
  updatedBy           String   @map("updated_by") @db.Uuid
  deletedAt           DateTime? @map("deleted_at") @db.Timestamptz(3)
  
  plant               Plant    @relation(fields: [plantId], references: [id])
  shiftAssignments    ShiftAssignment[]
  
  @@unique([plantId, code])
  @@map("shifts")
}

// === Shift Assignment (Operator → Shift) ===
model ShiftAssignment {
  id                  String   @id @default(uuid()) @db.Uuid
  plantId             String   @map("plant_id") @db.Uuid
  
  operatorId          String   @map("operator_id") @db.Uuid
  shiftId             String   @map("shift_id") @db.Uuid
  
  effectiveFrom       DateTime @map("effective_from") @db.Date
  effectiveTo         DateTime? @map("effective_to") @db.Date
  
  notes               String?
  
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  createdBy           String   @map("created_by") @db.Uuid
  updatedAt           DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)
  
  operator            Operator @relation(fields: [operatorId], references: [id])
  shift               Shift    @relation(fields: [shiftId], references: [id])
  
  @@index([operatorId, effectiveFrom])
  @@index([shiftId])
  @@map("shift_assignments")
}

// === Shift Handover ===
model ShiftHandover {
  id                  String   @id @default(uuid()) @db.Uuid
  plantId             String   @map("plant_id") @db.Uuid
  
  workOrderId         String   @map("work_order_id") @db.Uuid
  fromOperatorId      String   @map("from_operator_id") @db.Uuid
  toOperatorId        String   @map("to_operator_id") @db.Uuid
  
  handoverAt          DateTime @default(now()) @map("handover_at") @db.Timestamptz(3)
  
  notes               String?
  pendingTasks        Json?    @map("pending_tasks")    // JSONB array of items
  attachmentUrls      String[] @map("attachment_urls")
  
  acknowledgedAt      DateTime? @map("acknowledged_at") @db.Timestamptz(3)
  
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  createdBy           String   @map("created_by") @db.Uuid
  
  workOrder           WorkOrder @relation(fields: [workOrderId], references: [id])
  
  @@index([workOrderId, handoverAt(sort: Desc)])
  @@map("shift_handovers")
}

// === Enums ===
enum AssignmentStatus {
  pending
  accepted
  active
  completed
  reassigned
  
  @@map("assignment_status")
}

enum ShiftType {
  morning
  afternoon
  night
  custom
  
  @@map("shift_type")
}
```

---

## 3. State Machine

### 3.1 WO Assignment lifecycle

```typescript
// /packages/shared/machines/wo-assignment.machine.ts

export const woAssignmentMachine = setup({
  types: {} as {
    context: AssignmentContext
    events: AssignmentEvent
  },
  
  guards: {
    skillsCovered: ({ context }) => 
      context.requiredSkills.every(s => context.operatorSkills.includes(s)) ||
      context.skillsOverridden
  },
  
  actions: {
    notifyOperator: ({ context }) => {
      // Send notification to operator's HMI
    },
    
    logSkillsOverride: ({ context }) => {
      // Audit log entry
    }
  }
}).createMachine({
  id: 'woAssignment',
  initial: 'pending',
  
  states: {
    pending: {
      entry: 'notifyOperator',
      on: {
        ACCEPT: {
          target: 'accepted',
          guard: 'skillsCovered'
        },
        REASSIGN: 'reassigned',
        CANCEL: 'cancelled'
      }
    },
    
    accepted: {
      on: {
        START: 'active',
        REASSIGN: 'reassigned'
      }
    },
    
    active: {
      on: {
        COMPLETE: 'completed',
        REASSIGN: 'reassigned',
        PAUSE: 'paused'
      }
    },
    
    paused: {
      on: {
        RESUME: 'active',
        REASSIGN: 'reassigned'
      }
    },
    
    completed: {
      type: 'final'
    },
    
    reassigned: {
      type: 'final',
      entry: 'logReassignment'
    },
    
    cancelled: {
      type: 'final'
    }
  }
})
```

### 3.2 State transitions

| From | Event | To | Trigger |
|---|---|---|---|
| pending | ACCEPT | accepted | Operator action on HMI |
| pending | REASSIGN | reassigned | Planner reassigns |
| pending | CANCEL | cancelled | Planner cancels (rare) |
| accepted | START | active | Operator starts work |
| active | COMPLETE | completed | All steps done |
| active | PAUSE | paused | Manual pause |
| paused | RESUME | active | Resume work |
| any (non-final) | REASSIGN | reassigned | Transfer to other operator |

---

## 4. Business Rules

### 4.1 Assignment creation

1. **Pre-conditions**:
   - WO must be in `released` or `in_progress` status
   - Operator must be active and assigned to current shift
   - Operator must not have conflicting active assignment

2. **Skills coverage check**:
   - System computes required skills (union across all WO steps or specific group)
   - Compares with operator's active (non-expired) skills
   - If missing: blocks assignment
   - Override allowed with `skills.override` permission + mandatory reason

3. **Auto-checks**:
   - Equipment availability (if WO uses specific equipment)
   - Workstation availability
   - Material availability

### 4.2 Reassignment

- Old assignment marked `reassigned` (not deleted)
- Link `reassignedToAssignmentId` connects old to new
- Reason mandatory and logged in audit
- New assignment goes through normal validation
- Operator currently active is notified

### 4.3 Multi-WO concurrent assignments

- An operator can have **multiple `pending` or `accepted`** assignments (queue)
- Only **one `active`** assignment at a time
- HMI shows queue ordered by priority

### 4.4 Dispatch list rules

```typescript
function getDispatchList(operatorId: string, ctx: RequestContext): Promise<Assignment[]> {
  return prisma.workOrderAssignment.findMany({
    where: {
      operatorId,
      plantId: ctx.plantId,
      status: { in: ['pending', 'accepted', 'active'] },
      deletedAt: null
    },
    include: {
      workOrder: { include: { item: true } }
    },
    orderBy: [
      // 1. Active first
      { status: 'desc' },  // active > accepted > pending
      // 2. By priority (high first)
      { workOrder: { priority: 'desc' } },
      // 3. By due date (earliest first)
      { workOrder: { plannedEnd: 'asc' } }
    ]
  })
}
```

### 4.5 Shift assignment rules

- Operator can have **multiple shift assignments** with different effective dates (history)
- Only **one active** shift at a given date
- Plant calendar overrides shifts (holidays, plant closures)
- Cross-midnight shifts (e.g., 22:00-06:00) handled correctly

### 4.6 Shift handover

When operator transfers WO to next shift:
1. Outgoing operator creates handover with notes + pending tasks
2. Attachments allowed (photos of work in progress, log files)
3. Incoming operator must acknowledge before starting
4. Acknowledged handover triggers reassignment automatically

---

## 5. API Endpoints

### Assignments

```
GET    /api/v1/work-order-assignments                  List with filters
POST   /api/v1/work-order-assignments                  Create (planner)
GET    /api/v1/work-order-assignments/:id              Detail
POST   /api/v1/work-order-assignments/:id/accept       Operator HMI action
POST   /api/v1/work-order-assignments/:id/start        Start work
POST   /api/v1/work-order-assignments/:id/pause        Pause
POST   /api/v1/work-order-assignments/:id/resume       Resume
POST   /api/v1/work-order-assignments/:id/complete     Complete
POST   /api/v1/work-order-assignments/:id/reassign     Reassign to other op
POST   /api/v1/work-order-assignments/:id/cancel       Cancel (planner)

GET    /api/v1/work-order-assignments/dispatch         Operator's dispatch list
GET    /api/v1/work-orders/:id/assignments             All assignments for WO
GET    /api/v1/operators/:id/assignments               All assignments for operator

GET    /api/v1/work-orders/:id/skills-coverage         Compute required skills + check operator
```

### Shifts

```
GET    /api/v1/shifts                                   List shifts
POST   /api/v1/shifts                                   Create shift
PATCH  /api/v1/shifts/:id                               Update
DELETE /api/v1/shifts/:id                               Soft delete

GET    /api/v1/shift-assignments                        List with filters
POST   /api/v1/shift-assignments                        Assign operator to shift
PATCH  /api/v1/shift-assignments/:id                    Update assignment
GET    /api/v1/operators/:id/shift                      Get operator's current shift
GET    /api/v1/shifts/:id/operators                     Get operators in shift
```

### Handovers

```
POST   /api/v1/shift-handovers                          Create handover
POST   /api/v1/shift-handovers/:id/acknowledge          Acknowledge (incoming op)
GET    /api/v1/work-orders/:id/handovers                History for WO
```

---

## 6. UI Patterns

### 6.1 Planner Dashboard — Assignment view

Layout: 3 columns (operators / shifts / WOs)

```
┌────────────────────────────────────────────────────────────┐
│  Operator Assignment Board                                 │
├──────────────┬───────────────────────┬────────────────────┤
│ OPERATORS    │ TODAY (Mon Apr 27)    │ UNASSIGNED WO      │
│              │                       │                    │
│ Mario Rossi  │ M  ┌─────────┐        │ WO-2026-0143       │
│  [ASSY,TEST] │    │WO-2026  │        │  10 pcs            │
│              │    │-0142    │        │  Priority: HIGH    │
│              │    │ active  │        │ [Assign...]        │
│              │ A  └─────────┘        │                    │
│              │                       │ WO-2026-0144       │
│ Luigi Bianchi│ M  ┌─────────┐        │  50 pcs            │
│  [EXT,ASSY]  │    │WO-2026  │        │  Priority: NORMAL  │
│              │    │-0145    │        │ [Assign...]        │
│              │    │ accepted│        │                    │
│              │ A  └─────────┘        │ ...                │
│              │ ...                   │                    │
└──────────────┴───────────────────────┴────────────────────┘
```

### 6.2 Operator HMI — Dispatch List

```
┌────────────────────────────────────────────────────────────┐
│  Mario Rossi | WC-LEAK-01 | Shift: Morning (06:00-14:00)   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  📋 ACTIVE                                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ⚙️ WO-2026-0142 — Tubo PA12 12mm × 2m              │  │
│  │ 47 / 100 pieces (47%)                              │  │
│  │ ⏱  4:32:15 / 8:00:00                                │  │
│  │ [▶ Continue]                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  📋 ACCEPTED (next)                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ⏸️ WO-2026-0143 — Carena Yamaha R6                  │  │
│  │ 0 / 1 pieces                                        │  │
│  │ Priority: HIGH                                      │  │
│  │ Due: today 14:00                                    │  │
│  │ [Start when ready]                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  📋 PENDING                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🔵 WO-2026-0144 — ECE-104 Pannello camion           │  │
│  │ 50 / 50 pieces                                      │  │
│  │ Priority: NORMAL                                    │  │
│  │ Due: tomorrow                                       │  │
│  │ [Accept] [Decline]                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### 6.3 Reassignment dialog (planner)

```
┌─────────────────────────────────────────────────┐
│  Reassign WO-2026-0143                    [×]   │
├─────────────────────────────────────────────────┤
│  Currently assigned to: Mario Rossi              │
│  Status: accepted                                │
│                                                 │
│  Reassign to: ┌────────────────────────────┐    │
│               │ Select operator...      ▼  │    │
│               └────────────────────────────┘    │
│                                                 │
│  Reason: ┌────────────────────────────────────┐ │
│          │ Type reason (required)             │ │
│          │                                    │ │
│          │                                    │ │
│          └────────────────────────────────────┘ │
│                                                 │
│  ⚠️ Skills check will be performed automatically │
│                                                 │
│  [Cancel]                       [Reassign]      │
└─────────────────────────────────────────────────┘
```

### 6.4 Shift handover dialog (operator HMI)

```
┌─────────────────────────────────────────────────┐
│  Handover WO-2026-0142                    [×]   │
├─────────────────────────────────────────────────┤
│  To operator: ┌────────────────────────────┐    │
│               │ Select operator...      ▼  │    │
│               └────────────────────────────┘    │
│                                                 │
│  Notes for next shift:                          │
│  ┌────────────────────────────────────────────┐ │
│  │ Currently at piece 47 of 100. Setup OK.   │ │
│  │ Recipe RCP-LEAK-001 v2 loaded.            │ │
│  │ Calibration due check at 12:00.            │ │
│  └────────────────────────────────────────────┘ │
│                                                 │
│  Pending tasks:                                 │
│  ☐ Verify pressure stability                    │
│  ☐ Restock raccordi (low)                       │
│  [+ Add task]                                   │
│                                                 │
│  Attachments: [📷 Photo] [📄 File]              │
│                                                 │
│  [Cancel]                       [Confirm]       │
└─────────────────────────────────────────────────┘
```

---

## 7. KPIs

### 7.1 Assignment KPIs

| KPI | Formula | Purpose |
|---|---|---|
| Avg Assignment Acceptance Time | avg(acceptedAt - assignedAt) | Operator responsiveness |
| Reassignment Rate | reassigned / total_assignments | Process stability |
| Skills Override Rate | overridden / total | Skills gap indicator |
| Avg Time From Assignment To Start | avg(startedAt - acceptedAt) | Lead time |
| Operator Utilization | active_time / shift_time | Workload |

### 7.2 Shift KPIs

| KPI | Formula |
|---|---|
| Shift Coverage | operators_assigned / required_count |
| Handover Frequency | handovers / total_shifts |
| Cross-shift WO Avg Duration | avg(wo_duration) for WOs spanning multiple shifts |

---

## 8. Integration Points

### 8.1 With Work Order

- WO release triggers possible assignment
- Assignment status affects WO state machine indirectly
- Cancellation of WO cancels related assignments

### 8.2 With Skills

- Skills coverage check on every assignment
- Expired skills exclude operator from eligibility
- Operator skill changes affect future assignments

### 8.3 With Equipment

- Assignment may reserve equipment (depends on workflow definition)
- Equipment in maintenance blocks WO assignments using it

### 8.4 With HMI

- Dispatch list is primary HMI view for operators
- Assignment status drives HMI workflow
- Handover triggered from HMI

---

## 9. Permissions

| Action | Required Permission |
|---|---|
| Create assignment | `assignment.create` (planner, supervisor) |
| Accept assignment | `assignment.accept` (assigned operator only) |
| Reassign | `assignment.reassign` (planner, supervisor) |
| Cancel assignment | `assignment.cancel` (planner with reason) |
| Override skills check | `skills.override` (supervisor with audit) |
| Manage shifts | `shift.manage` (admin, planner) |
| Assign operator to shift | `shift.assign` (planner, supervisor) |
| Create handover | `handover.create` (operator on own WO) |
| Acknowledge handover | `handover.acknowledge` (incoming operator) |

---

## 10. Cross-references

- Core spec: `MASTER_SPECIFICATION.md` § 4.47 (Assignment Status), § 4.48 (Shift Type)
- Related: `extensions/EQUIPMENT_MANAGEMENT.md` (equipment availability for assignment)
- Patterns: `BEST_PRACTICES.md` § 4.8 (WO Assignment service)

---

## 11. Change Log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-27 | Initial extension v1.2 release |

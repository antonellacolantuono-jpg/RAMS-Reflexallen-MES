# FUNCTIONAL INVENTORY

> **Master inventory** of all functionalities of the MES Reflexallen project
> 
> **Purpose**: Single source of truth for what is in MVP, what is V2, what is out-of-scope.
> 
> **Version**: 1.0
> **Last updated**: 2026-04-27
> **Maintainers**: Engineering Lead, Product Owner

---

## 🎯 How to read this document

Each functionality is classified across 4 dimensions:

### Status
- ✅ **Implemented** — Already covered in v1.2 specifications, ready for build
- 🟡 **MVP — Pending Build** — In MVP scope, awaits Claude Code build
- 🔵 **V2** — Out of MVP, planned for future
- ❌ **Out-of-scope** — Explicitly excluded

### Priority
- 🔴 **Critical** — Must-have for Reflexallen automotive Tier 1
- 🟡 **Important** — Strong value, included in MVP if reasonable cost
- 🟢 **Nice-to-have** — Lower priority
- 🔵 **Future** — V2 roadmap

### MVP Effort
Estimated additional build hours when applicable.

### Decision
- **Confirmed**: explicitly approved
- **Pending**: needs decision
- **Default**: applied without explicit decision

---

## 📊 Executive Summary

| Category | Items | MVP | V2 | Out-of-scope |
|---|---|---|---|---|
| 1. Foundation & Infrastructure | 18 | 18 | 0 | 0 |
| 2. Master Data Registries | 13 | 13 | 0 | 0 |
| 3. Workflow Designer | 14 | 14 | 0 | 0 |
| 4. Auto-Generation Engine | 7 | 7 | 0 | 0 |
| 5. Work Order Management | 12 | 12 | 0 | 0 |
| 6. Scheduling & Assignment | 11 | 5 | 6 | 0 |
| 7. Equipment & Maintenance | 11 | 4 | 7 | 0 |
| 8. Production Execution & HMI | 18 | 18 | 0 | 0 |
| 9. Industrial Operations | 15 | 9 | 6 | 0 |
| 10. Quality Control | 16 | 12 | 4 | 0 |
| 11. Box Management | 12 | 12 | 0 | 0 |
| 12. CFRP Module | 8 | 8 | 0 | 0 |
| 13. Safety Devices Module | 8 | 8 | 0 | 0 |
| 14. Fluid Power Module | 5 | 0 | 5 | 0 |
| 15. Digital Electrical Module | 5 | 0 | 5 | 0 |
| 16. Compliance & Audit | 10 | 4 | 6 | 0 |
| 17. Reporting & Analytics | 14 | 8 | 6 | 0 |
| 18. Notifications & Communication | 8 | 4 | 4 | 0 |
| 19. UI/UX & Universal Patterns | 16 | 16 | 0 | 0 |
| 20. Multi-tenancy & i18n | 6 | 3 | 3 | 0 |
| **TOTALE** | **227** | **175** | **52** | **0** |

**MVP coverage**: 77% delle funzionalità identificate.

---

## 1. Foundation & Infrastructure

| # | Functionality | Status | Priority | Decision |
|---|---|---|---|---|
| 1.1 | NestJS backend + Next.js 14 frontend | ✅ | 🔴 | Confirmed |
| 1.2 | Prisma ORM + PostgreSQL | ✅ | 🔴 | Confirmed |
| 1.3 | Turborepo monorepo + pnpm | ✅ | 🔴 | Confirmed |
| 1.4 | shadcn/ui design system + Tailwind | ✅ | 🔴 | Confirmed |
| 1.5 | TanStack Query + Zustand state management | ✅ | 🔴 | Confirmed |
| 1.6 | XState formal state machines | ✅ | 🔴 | Confirmed |
| 1.7 | Zod schemas shared FE/BE | ✅ | 🔴 | Confirmed |
| 1.8 | Socket.IO real-time sync | ✅ | 🔴 | Confirmed |
| 1.9 | BullMQ background jobs | ✅ | 🔴 | Confirmed |
| 1.10 | Redis cache + queue | ✅ | 🔴 | Confirmed |
| 1.11 | MinIO file storage (S3-compatible) | ✅ | 🔴 | Confirmed |
| 1.12 | Docker Compose dev environment | ✅ | 🔴 | Confirmed |
| 1.13 | Authentication (JWT + refresh) | ✅ | 🔴 | Confirmed |
| 1.14 | RBAC (multi-role) | ✅ | 🔴 | Confirmed |
| 1.15 | Soft delete + audit fields | ✅ | 🔴 | Confirmed |
| 1.16 | Optimistic locking (version field) | ✅ | 🔴 | Confirmed |
| 1.17 | Domain events emission | ✅ | 🔴 | Confirmed |
| 1.18 | OpenAPI documentation auto-generated | ✅ | 🟡 | Confirmed |

---

## 2. Master Data Registries

| # | Functionality | Status | Priority | Decision |
|---|---|---|---|---|
| 2.1 | Items registry with image, BOM where-used | 🟡 | 🔴 | Confirmed |
| 2.2 | BOM multi-level with versioning | 🟡 | 🔴 | Confirmed |
| 2.3 | Equipment Hierarchy ISA-95 (5 levels) editable canvas | 🟡 | 🔴 | Confirmed |
| 2.4 | Workstations | 🟡 | 🔴 | Confirmed |
| 2.5 | Recipes with versioning + approval workflow | 🟡 | 🔴 | Confirmed |
| 2.6 | Skills with expiration tracking | 🟡 | 🔴 | Confirmed |
| 2.7 | Cause Codes (downtime + scrap) with 6 Big Losses | 🟡 | 🔴 | Confirmed |
| 2.8 | Tools | 🟡 | 🟡 | Confirmed |
| 2.9 | Operators with skills, badge, PIN, photo | 🟡 | 🔴 | Confirmed |
| 2.10 | Attention Points (5 categories, IT+EN) | 🟡 | 🔴 | Confirmed |
| 2.11 | Auto-Generation Rules (view only) | 🟡 | 🟡 | Confirmed |
| 2.12 | BoxTypes (8 categories, capacity, sealing) | 🟡 | 🔴 | Confirmed |
| 2.13 | Boxes (instances) with state machine | 🟡 | 🔴 | Confirmed |

---

## 3. Workflow Designer

| # | Functionality | Status | Priority | Decision |
|---|---|---|---|---|
| 3.1 | React Flow + dagre canvas (editable) | 🟡 | 🔴 | Confirmed |
| 3.2 | 4-Pane Configurator (wizard + palette + form + preview) | 🟡 | 🔴 | Confirmed |
| 3.3 | Step polymorphic (8 categories) | 🟡 | 🔴 | Confirmed |
| 3.4 | ~40 step action types | 🟡 | 🔴 | Confirmed |
| 3.5 | Live Preview State-Driven (11 states interactive) | 🟡 | 🔴 | Confirmed |
| 3.6 | Device Execution Group with parallel steps | 🟡 | 🔴 | Confirmed |
| 3.7 | Attention Points integration in steps | 🟡 | 🔴 | Confirmed |
| 3.8 | Validation engine cross-step | 🟡 | 🔴 | Confirmed |
| 3.9 | Workflow versioning | 🟡 | 🔴 | Confirmed |
| 3.10 | WorkflowSnapshot (immutable copy on WO release) | 🟡 | 🔴 | Confirmed |
| 3.11 | Workflow templates | 🟡 | 🟡 | Confirmed |
| 3.12 | Box action types in steps (11 actions) | 🟡 | 🔴 | Confirmed (v1.1) |
| 3.13 | Visual flow editor with drag-drop | 🟡 | 🔴 | Confirmed |
| 3.14 | Step properties live-edit | 🟡 | 🔴 | Confirmed |

---

## 4. Auto-Generation Engine

7 rules per MASTER_SPEC § 8.3:

| # | Functionality | Status | Priority | Decision |
|---|---|---|---|---|
| 4.1 | Rule #1: Skills & Login Verification | 🟡 | 🔴 | Confirmed |
| 4.2 | Rule #2: BOM Check Sequenziale | 🟡 | 🔴 | Confirmed |
| 4.3 | Rule #3: Tooling Check | 🟡 | 🔴 | Confirmed |
| 4.4 | Rule #4: Device Verify & Recipe Load | 🟡 | 🔴 | Confirmed |
| 4.5 | Rule #5: First Piece Approval | 🟡 | 🔴 | Confirmed |
| 4.6 | Rule #6: Reset & Cleanup (Teardown) | 🟡 | 🔴 | Confirmed |
| 4.7 | Rule #7: Box Packaging | 🟡 | 🔴 | Confirmed (v1.1) |

---

## 5. Work Order Management

| # | Functionality | Status | Priority | Decision |
|---|---|---|---|---|
| 5.1 | WO state machine (8 states) | 🟡 | 🔴 | Confirmed |
| 5.2 | WO release with validation | 🟡 | 🔴 | Confirmed |
| 5.3 | WO release with auto-generation triggered | 🟡 | 🔴 | Confirmed |
| 5.4 | Material reservation (soft) | 🟡 | 🔴 | Confirmed |
| 5.5 | Box reservation | 🟡 | 🔴 | Confirmed |
| 5.6 | Counters (qtyTarget, qtyProduced, qtyScrap, qtyRework, qtySamples) | 🟡 | 🔴 | Confirmed |
| 5.7 | WO priority management | 🟡 | 🟡 | Confirmed |
| 5.8 | WO list with filters and views | 🟡 | 🔴 | Confirmed |
| 5.9 | WO Gantt timeline view | 🟡 | 🟡 | Confirmed |
| 5.10 | WO printing | 🟡 | 🟢 | Confirmed |
| 5.11 | WO clone | 🟡 | 🟢 | Confirmed |
| 5.12 | WO production blocking (FAI in progress) | 🟡 | 🔴 | Confirmed (v1.2) |

---

## 6. Scheduling & Assignment

| # | Functionality | Status | Priority | Decision |
|---|---|---|---|---|
| 6.1 | WorkOrderAssignment entity (5 statuses) | 🟡 | 🔴 | Confirmed (v1.2) |
| 6.2 | Skills coverage automatic check | 🟡 | 🔴 | Confirmed (v1.2) |
| 6.3 | Skills override with audit | 🟡 | 🟡 | Confirmed (v1.2) |
| 6.4 | Manual assignment (planner UI) | 🟡 | 🔴 | Confirmed (v1.2) |
| 6.5 | Dispatch list (operator HMI) | 🟡 | 🔴 | Confirmed (v1.2) |
| 6.6 | Reassignment with audit | 🟡 | 🟡 | Confirmed (v1.2) |
| 6.7 | Shift entity + ShiftAssignment | 🟡 | 🟡 | Confirmed (v1.2) |
| 6.8 | Shift handover procedure | 🟡 | 🟡 | Confirmed (v1.2) |
| 6.9 | Automatic scheduling (forward/backward) | 🔵 | 🟡 | V2 |
| 6.10 | Capacity planning algorithms | 🔵 | 🟡 | V2 |
| 6.11 | Gantt drag-drop scheduling | 🔵 | 🟡 | V2 |
| 6.12 | MRP integration | 🔵 | 🔵 | V2 |
| 6.13 | What-if scheduling | 🔵 | 🔵 | V2 |
| 6.14 | Workload balancing | 🔵 | 🟡 | V2 |
| 6.15 | Multi-resource conflict resolution | 🔵 | 🟡 | V2 |

---

## 7. Equipment & Maintenance

| # | Functionality | Status | Priority | Decision |
|---|---|---|---|---|
| 7.1 | Equipment State Machine formal (8 states XState) | 🟡 | 🟡 | Confirmed (v1.2) |
| 7.2 | MaintenanceOrder entity + lifecycle | 🟡 | 🔴 | Confirmed (v1.2) |
| 7.3 | MaintenanceLog (history) | 🟡 | 🟡 | Confirmed (v1.2) |
| 7.4 | Tool Wear Tracking | 🟡 | 🟡 | Confirmed (v1.2 + X=A) |
| 7.5 | Tool Changeover formal procedure | 🟡 | 🟡 | Confirmed (v1.2) |
| 7.6 | Equipment-specific OEE breakdown | 🟡 | 🟡 | Confirmed (v1.2) |
| 7.7 | Maintenance calendar view | 🟡 | 🟡 | Confirmed (v1.2) |
| 7.8 | Predictive maintenance (ML-based) | 🔵 | 🔵 | V2 |
| 7.9 | Spare parts inventory | 🔵 | 🟡 | V2 |
| 7.10 | External CMMS integration | 🔵 | 🔵 | V2 |
| 7.11 | IIoT real telemetry (OPC UA, MQTT) | 🔵 | 🔵 | V2 |
| 7.12 | Equipment lifecycle costing (TCO) | 🔵 | 🟢 | V2 |
| 7.13 | Equipment warranty tracking | 🔵 | 🟢 | V2 |
| 7.14 | Energy consumption tracking | 🔵 | 🟢 | V2 |

---

## 8. Production Execution & HMI

| # | Functionality | Status | Priority | Decision |
|---|---|---|---|---|
| 8.1 | HMI shop floor touch-optimized | 🟡 | 🔴 | Confirmed |
| 8.2 | Operator login (badge + PIN) | 🟡 | 🔴 | Confirmed |
| 8.3 | Workstation selection | 🟡 | 🔴 | Confirmed |
| 8.4 | Step renderer per category (8 renderers) | 🟡 | 🔴 | Confirmed |
| 8.5 | Multi-Level Timer (3 levels: WO/Phase/Part) | 🟡 | 🔴 | Confirmed |
| 8.6 | Parallel steps execution with buffer | 🟡 | 🔴 | Confirmed |
| 8.7 | Mock device simulator (REST) | 🟡 | 🔴 | Confirmed |
| 8.8 | Recovery flow (4 stages) | 🟡 | 🔴 | Confirmed |
| 8.9 | Cause codes selection on scrap | 🟡 | 🔴 | Confirmed |
| 8.10 | Box operations in HMI (pack, seal, ship) | 🟡 | 🔴 | Confirmed (v1.1) |
| 8.11 | Counters real-time visualization | 🟡 | 🔴 | Confirmed |
| 8.12 | Attention Points display in steps | 🟡 | 🔴 | Confirmed |
| 8.13 | Audio notifications (optional) | 🟡 | 🟢 | Confirmed |
| 8.14 | Step history navigation | 🟡 | 🟡 | Confirmed |
| 8.15 | Pause/Resume capability | 🟡 | 🔴 | Confirmed |
| 8.16 | Operator skip with permission | 🟡 | 🟡 | Confirmed |
| 8.17 | Photo capture on scrap | 🟡 | 🟡 | Confirmed |
| 8.18 | HMI offline-first capability | 🟡 | 🟢 | Confirmed |

---

## 9. Industrial Operations (v1.2)

| # | Functionality | Status | Priority | Decision |
|---|---|---|---|---|
| 9.1 | Multi-output cycles (1 cycle → N pieces) | 🟡 | 🔴 | Confirmed (Bucket A) |
| 9.2 | Continuous production mode | 🟡 | 🔴 | Confirmed (Bucket A) |
| 9.3 | Sample taking (separate from production count) | 🟡 | 🔴 | Confirmed (Bucket A) |
| 9.4 | First Article Inspection (FAI) formal | 🟡 | 🔴 | Confirmed (Bucket A) |
| 9.5 | Containerized WIP (kanban bins, trolleys) | 🟡 | 🟡 | Confirmed (Y=A) |
| 9.6 | Subassembly + nested BOM | 🟡 | 🟡 | Confirmed (Y=A) |
| 9.7 | Quality Hold / Release workflow | 🟡 | 🔴 | Confirmed (Bucket A) |
| 9.8 | Material consumption non-discrete (granuli) | 🟡 | 🟡 | Confirmed (Bucket A) |
| 9.9 | Backflush automatic | 🟡 | 🟡 | Confirmed |
| 9.10 | In-process measurement (telemetry inline) | 🔵 | 🟡 | V2 |
| 9.11 | Operator visual confirmation (with photo) | 🟡 | 🟢 | Confirmed |
| 9.12 | Parallel multi-operator (Assist Mode) | 🔵 | 🟢 | V2 |
| 9.13 | Energy-aware operations | 🔵 | 🟢 | V2 |
| 9.14 | Cross-line operations | 🔵 | 🟡 | V2 |
| 9.15 | Multi-level genealogy (forward + backward) | 🟡 | 🔴 | Confirmed |

---

## 10. Quality Control

| # | Functionality | Status | Priority | Decision |
|---|---|---|---|---|
| 10.1 | Lot quality status workflow (APPROVED/QUARANTINE/REJECTED) | 🟡 | 🔴 | Confirmed |
| 10.2 | Sample test results recording | 🟡 | 🔴 | Confirmed (v1.2) |
| 10.3 | FAI report (PPAP-compliant attachments) | 🟡 | 🔴 | Confirmed (v1.2) |
| 10.4 | Visual inspection workflow | 🟡 | 🔴 | Confirmed |
| 10.5 | Dimensional check workflow | 🟡 | 🔴 | Confirmed |
| 10.6 | Functional test workflow | 🟡 | 🔴 | Confirmed |
| 10.7 | Defect documentation with photo | 🟡 | 🟡 | Confirmed |
| 10.8 | Cause code analysis | 🟡 | 🔴 | Confirmed |
| 10.9 | Quality alerts and notifications | 🟡 | 🟡 | Confirmed |
| 10.10 | First Pass Yield (FPY) tracking | 🟡 | 🔴 | Confirmed |
| 10.11 | NCR (Non-Conformance Report) | 🔵 | 🟡 | V2 |
| 10.12 | Deviation/Hold/Use-as-is dispositions | 🔵 | 🟡 | V2 |
| 10.13 | SPC charts (X-bar, R) | 🔵 | 🔵 | V2 |
| 10.14 | Customer-specific QC requirements | 🔵 | 🟢 | V2 |
| 10.15 | NDT (CFRP) integration | 🟡 | 🔴 | Confirmed (CFRP module) |
| 10.16 | Reflectance / colorimetry (Safety) | 🟡 | 🔴 | Confirmed (Safety module) |

---

## 11. Box Management (v1.1)

| # | Functionality | Status | Priority | Decision |
|---|---|---|---|---|
| 11.1 | BoxType registry (8 categories) | 🟡 | 🔴 | Confirmed |
| 11.2 | Box instances with state machine | 🟡 | 🔴 | Confirmed |
| 11.3 | Box capacity validation (HARD weight/volume) | 🟡 | 🔴 | Confirmed |
| 11.4 | Box content tracking (3 modes: serial/quantity/mixed) | 🟡 | 🔴 | Confirmed |
| 11.5 | Box pack/unpack operations | 🟡 | 🔴 | Confirmed |
| 11.6 | Box sealing with seal numbers | 🟡 | 🔴 | Confirmed |
| 11.7 | Box returnable lifecycle | 🟡 | 🔴 | Confirmed |
| 11.8 | Box inspection cycles | 🟡 | 🟡 | Confirmed |
| 11.9 | Box cleaning workflow | 🟡 | 🟡 | Confirmed |
| 11.10 | Box movement audit trail | 🟡 | 🔴 | Confirmed |
| 11.11 | Box at customer tracking | 🟡 | 🟡 | Confirmed |
| 11.12 | Box damage/condition tracking | 🟡 | 🟡 | Confirmed |

---

## 12. CFRP Module (v1.2)

| # | Functionality | Status | Priority | Decision |
|---|---|---|---|---|
| 12.1 | Mold management (cycles count, lifecycle) | 🟡 | 🔴 | Confirmed (ADR-026) |
| 12.2 | Prepreg out-time tracking (cumulative) | 🟡 | 🔴 | Confirmed |
| 12.3 | Cure cycle long-running (autoclave) | 🟡 | 🔴 | Confirmed |
| 12.4 | Cure cycle telemetry archive (time-series) | 🟡 | 🔴 | Confirmed |
| 12.5 | NDT (Non-Destructive Testing) integration | 🟡 | 🔴 | Confirmed |
| 12.6 | Vacuum bag tightness test | 🟡 | 🔴 | Confirmed |
| 12.7 | Material conditioning periods (rinvenimento) | 🟡 | 🟡 | Confirmed |
| 12.8 | Hand lay-up tracking (per ply) | 🟡 | 🟡 | Confirmed |

---

## 13. Safety Devices Module (v1.2)

| # | Functionality | Status | Priority | Decision |
|---|---|---|---|---|
| 13.1 | Reflectance measurement (ECE-R104 thresholds) | 🟡 | 🔴 | Confirmed (ADR-027) |
| 13.2 | Colorimetry (CIE-Lab) | 🟡 | 🔴 | Confirmed |
| 13.3 | Homologation Certificate management | 🟡 | 🔴 | Confirmed |
| 13.4 | ECE-R104 marking generation | 🟡 | 🔴 | Confirmed |
| 13.5 | Cross-cut adhesion test (ASTM D3359) | 🟡 | 🔴 | Confirmed |
| 13.6 | QUV chamber aging tests (long-running) | 🟡 | 🟡 | Confirmed |
| 13.7 | Salt spray aging tests | 🟡 | 🟡 | Confirmed |
| 13.8 | Lamination process recording | 🟡 | 🔴 | Confirmed |

---

## 14. Fluid Power Module

> **Status**: All V2 — line-specific module not in MVP scope.
> Workflow reference WORKFLOW_FLUID_POWER.md provided as documentation.

| # | Functionality | Status | Priority | Decision |
|---|---|---|---|---|
| 14.1 | Hydraulic test (pressure cycles) | 🔵 | 🟡 | V2 |
| 14.2 | Burst test management | 🔵 | 🟡 | V2 |
| 14.3 | Cleanliness verification (NAS 1638) | 🔵 | 🟡 | V2 |
| 14.4 | Hose crimping force monitoring | 🔵 | 🟡 | V2 |
| 14.5 | Pressure profile recording | 🔵 | 🟡 | V2 |

---

## 15. Digital Electrical Module

> **Status**: All V2 — line-specific module not in MVP scope.
> Workflow reference WORKFLOW_DIGITAL_ELECTRICAL.md provided as documentation.

| # | Functionality | Status | Priority | Decision |
|---|---|---|---|---|
| 15.1 | Electrical continuity test | 🔵 | 🟡 | V2 |
| 15.2 | Insulation resistance test | 🔵 | 🟡 | V2 |
| 15.3 | Hi-pot test (high voltage) | 🔵 | 🟡 | V2 |
| 15.4 | Connector pull-off test | 🔵 | 🟡 | V2 |
| 15.5 | Pin retention force | 🔵 | 🟡 | V2 |

---

## 16. Compliance & Audit

| # | Functionality | Status | Priority | Decision |
|---|---|---|---|---|
| 16.1 | Audit trail backend (every entity, every change) | ✅ | 🔴 | Confirmed |
| 16.2 | Audit trail UI viewer | 🟡 | 🟡 | Confirmed (Z=A) |
| 16.3 | Genealogy bidirectional advanced | ✅ | 🔴 | Confirmed |
| 16.4 | FAI report PPAP attachments | 🟡 | 🔴 | Confirmed (Bucket A) |
| 16.5 | Document retention 15+ years (automotive) | 🟡 | 🔴 | Confirmed |
| 16.6 | Electronic signatures (21 CFR Part 11) | 🔵 | 🔵 | V2 |
| 16.7 | NCR (Non-Conformance Report) | 🔵 | 🟡 | V2 |
| 16.8 | Deviation/Hold/Use-as-is dispositions | 🔵 | 🟡 | V2 |
| 16.9 | Recall management | 🔵 | 🔵 | V2 |
| 16.10 | Customer audit reports | 🔵 | 🟡 | V2 |

---

## 17. Reporting & Analytics

| # | Functionality | Status | Priority | Decision |
|---|---|---|---|---|
| 17.1 | OEE calculation (Availability × Performance × Quality) | 🟡 | 🔴 | Confirmed |
| 17.2 | OEE per equipment breakdown | 🟡 | 🟡 | Confirmed (v1.2) |
| 17.3 | 6 Big Losses analysis | 🟡 | 🟡 | Confirmed |
| 17.4 | First Pass Yield tracking | 🟡 | 🔴 | Confirmed |
| 17.5 | Production volume reports | 🟡 | 🔴 | Confirmed |
| 17.6 | Scrap analysis by cause code | 🟡 | 🔴 | Confirmed |
| 17.7 | Operator productivity dashboard | 🟡 | 🟡 | Confirmed |
| 17.8 | Real-time production monitor | 🟡 | 🔴 | Confirmed |
| 17.9 | Custom report builder (advanced) | 🔵 | 🟡 | V2 |
| 17.10 | Excel export (advanced formatting) | 🔵 | 🟡 | V2 |
| 17.11 | Scheduled reports email | 🔵 | 🟢 | V2 |
| 17.12 | KPI dashboard customizable per role | 🔵 | 🟡 | V2 |
| 17.13 | SPC charts (X-bar, R) | 🔵 | 🟡 | V2 |
| 17.14 | Predictive analytics (ML) | 🔵 | 🔵 | V2 |

---

## 18. Notifications & Communication

| # | Functionality | Status | Priority | Decision |
|---|---|---|---|---|
| 18.1 | In-app notifications (toast) | 🟡 | 🔴 | Confirmed |
| 18.2 | Notification center | 🟡 | 🟡 | Confirmed |
| 18.3 | Notification preferences per user | 🟡 | 🟢 | Confirmed |
| 18.4 | Real-time alerts (Socket.IO) | 🟡 | 🔴 | Confirmed |
| 18.5 | Email notifications | 🔵 | 🟡 | V2 |
| 18.6 | SMS notifications | 🔵 | 🟢 | V2 |
| 18.7 | Slack/Teams integration | 🔵 | 🟢 | V2 |
| 18.8 | Push mobile notifications | 🔵 | 🟢 | V2 |

---

## 19. UI/UX & Universal Patterns

| # | Functionality | Status | Priority | Decision |
|---|---|---|---|---|
| 19.1 | Universal Components library (~30 components) | 🟡 | 🔴 | Confirmed |
| 19.2 | EntityImage with auto-fallback | 🟡 | 🔴 | Confirmed |
| 19.3 | ViewSwitcher (list/card/flow/calendar/gantt) | 🟡 | 🔴 | Confirmed |
| 19.4 | StatusBadge with consistent colors | 🟡 | 🔴 | Confirmed |
| 19.5 | DataTable with virtualization | 🟡 | 🔴 | Confirmed |
| 19.6 | EntityForm with Zod validation | 🟡 | 🔴 | Confirmed |
| 19.7 | Saved filters (URL-based) | 🟡 | 🟡 | Confirmed |
| 19.8 | Recently viewed tracking | 🟡 | 🟢 | Confirmed |
| 19.9 | Favorites system | 🟡 | 🟢 | Confirmed |
| 19.10 | Bulk operations toolbar | 🟡 | 🟡 | Confirmed |
| 19.11 | Activity feed per entity | 🟡 | 🟡 | Confirmed |
| 19.12 | Comments per entity | 🟡 | 🟢 | Confirmed |
| 19.13 | Attachments per entity | 🟡 | 🟡 | Confirmed |
| 19.14 | Tags per entity | 🟡 | 🟢 | Confirmed |
| 19.15 | Trash bin (soft delete UI) | 🟡 | 🟡 | Confirmed |
| 19.16 | Print-friendly views | 🟡 | 🟢 | Confirmed |

---

## 20. Multi-tenancy & Internationalization

| # | Functionality | Status | Priority | Decision |
|---|---|---|---|---|
| 20.1 | Single-plant MVP, multi-plant ready architecture | ✅ | 🔴 | Confirmed |
| 20.2 | plantId scoping on all entities | ✅ | 🔴 | Confirmed |
| 20.3 | Italian (IT) localization | 🟡 | 🔴 | Confirmed |
| 20.4 | English (EN) localization | 🔵 | 🟡 | V2 |
| 20.5 | Multi-plant data isolation | 🔵 | 🟡 | V2 |
| 20.6 | Plant-specific configurations | 🔵 | 🟡 | V2 |

---

## 📈 MVP Build Effort Summary

| Phase | Estimated hours |
|---|---|
| Foundation + Infrastructure | 3-4 |
| Master Data Registries (13) | 4-5 |
| Workflow Designer | 5-6 |
| Auto-generation Engine | 3-4 |
| Work Order Management | 2 |
| Scheduling & Assignment basics | 4 |
| Equipment & Maintenance basics | 4-5 |
| Production Execution + HMI | 6-8 |
| Industrial Operations (Bucket A) | 12 |
| Quality Control | 3-4 |
| Box Management (v1.1) | 4-5 |
| CFRP Module | 8 |
| Safety Devices Module | 6 |
| Compliance & Audit basics | 2-3 |
| Reporting & Analytics basics | 3-4 |
| Notifications | 1-2 |
| UI/UX Universal Patterns | covered in registries |
| **TOTALE MVP estimato** | **~65-75 ore** |

---

## 🎯 V2 Roadmap (Priority Order)

### V2 Wave 1 (next quarter post-MVP)
- Fluid Power Module
- Digital Electrical Module
- Multi-language EN
- NCR + Deviation management
- Audit reports for customer

### V2 Wave 2 (6-12 months)
- Advanced Scheduling (Gantt drag-drop, MRP)
- IIoT Telemetry (OPC UA, MQTT real)
- Predictive maintenance
- Custom report builder
- Multi-plant rollout

### V2 Wave 3 (12+ months)
- ML / predictive analytics
- 21 CFR Part 11 compliance
- Customer-specific QC
- Recall management
- Mobile apps

---

## 📚 Document references

For detailed specifications:

| Topic | Document |
|---|---|
| Domain model & taxonomies | `MASTER_SPECIFICATION.md` |
| Implementation patterns | `BEST_PRACTICES.md` |
| Quick reference | `CONVENTIONS.md` |
| Equipment & maintenance | `extensions/EQUIPMENT_MANAGEMENT.md` |
| Scheduling & assignment | `extensions/SCHEDULING_ASSIGNMENT.md` |
| Industrial operations | `extensions/INDUSTRIAL_OPERATIONS.md` |
| CFRP specifics | `extensions/CFRP_MODULE.md` |
| Safety Devices specifics | `extensions/SAFETY_DEVICES_MODULE.md` |
| Workflows reference | `extensions/WORKFLOW_*.md` |

---

## 🔄 Change Log

| Date | Change |
|---|---|
| 2026-04-27 | Initial document v1.0 — comprehensive inventory of MVP v1.2 + V2 roadmap |

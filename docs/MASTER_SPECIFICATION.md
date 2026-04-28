# MASTER SPECIFICATION

> **Project**: MES (Manufacturing Execution System) v2 — ISA-95 Compliant
> **Document type**: Domain Specification (the WHAT)
> **Audience**: Engineering team, Product, Claude Code
> **Companion documents**: `BEST_PRACTICES.md` (the HOW), `CONVENTIONS.md` (quick reference)
> **Version**: 1.2
> **Last updated**: 2026-04-27
> **Maintainers**: Engineering Lead, Product Owner
> 
> **Changelog**:
> - v1.2 (2026-04-27): Added Scheduling & Assignment, Equipment State Machine, Maintenance basics, Tool wear tracking, Industrial operations (multi-output, continuous production, sample taking, FAI), Containerized WIP, Quality Hold/Release, Audit UI. **Added CFRP Module + Safety Devices Module as full MVP coverage** (Reflexallen multi-line). See extensions/ for detailed coverage.
> - v1.1 (2026-04-26): Added Box Management section, BoxType/Box/BoxContent entities, packaging group promoted to MVP
> - v1.0 (2026-04-26): Initial version

---

## How to read this document

This is the **single source of truth** for what the MES system does. It defines the domain language, taxonomies, business rules, state machines, and architectural decisions.

This document answers: **"What does the system do?"**
The companion `BEST_PRACTICES.md` answers: **"How do we build it?"**

**Always attach this document** as context when prompting Claude Code, alongside `BEST_PRACTICES.md`.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Domain Glossary](#2-domain-glossary)
3. [Architectural Overview](#3-architectural-overview)
4. [Complete Taxonomies](#4-complete-taxonomies)
5. [Domain Model](#5-domain-model)
6. [State Machines](#6-state-machines)
7. [Workflow & Routes](#7-workflow--routes)
8. [Auto-Generation Engine](#8-auto-generation-engine)
9. [Parallel Steps System](#9-parallel-steps-system)
10. [Recovery Flow](#10-recovery-flow)
11. [Attention Points](#11-attention-points)
12. [Box Management](#12-box-management)
13. [Real-time Synchronization](#13-real-time-synchronization)
14. [Universal UX Patterns](#14-universal-ux-patterns)
15. [Permissions Matrix](#15-permissions-matrix)
16. [KPI & Metrics](#16-kpi--metrics)
17. [API Contract Overview](#17-api-contract-overview)
18. [Business Code Naming](#18-business-code-naming)
19. [Multi-tenancy & Multi-plant](#19-multi-tenancy--multi-plant)
20. [Internationalization](#20-internationalization)
21. [Out-of-Scope MVP / V2 Roadmap](#21-out-of-scope-mvp--v2-roadmap)
22. [Extensions (modular specifications)](#22-extensions-modular-specifications)

---

## 1. Executive Summary

### 1.1 Product mission

A modern, ISA-95 compliant Manufacturing Execution System designed to bridge ERP and shop floor, providing complete workflow management from inbound material reception through production, quality control, and outbound logistics.

### 1.2 Core differentiators

The system is built around **5 game-changer capabilities** that distinguish it from traditional MES:

1. **Setup/Teardown Auto-Generation** — preparation and closure phases automatically derived from the production route, eliminating manual configuration errors and standardizing procedures.
2. **Sequential BOM Check** — operator scans each material before production starts, with real-time validation of quantity, lot, and quality status.
3. **Skills Matching with Validation** — blocking validation that ensures only qualified operators execute steps, with audited override workflow.
4. **Device Execution with Parallel Steps** — operator can perform value-add tasks (labeling, preparation) on adjacent parts while the device runs the current cycle, optimizing throughput by 20-30%.
5. **Automatic Recovery Flow** — guided recovery procedure on NOK outcomes, attempting rework before scrap to reduce waste by 40-60%.

### 1.3 Target users

- **Process Engineers**: design workflows, recipes, define auto-gen rules
- **Production Planners**: release work orders, schedule production
- **Supervisors**: monitor production real-time, manage exceptions
- **Operators**: execute steps via touch-friendly HMI on shop floor
- **Quality Engineers**: define attention points, manage cause codes, review quality metrics
- **Management**: view KPIs, OEE dashboards, performance reports

### 1.4 Architectural principles

- **Domain-driven**: model reflects real manufacturing concepts (ISA-95)
- **Event-driven**: domain events propagate state changes across the system
- **Real-time first**: live synchronization between all clients via WebSocket
- **Multi-tenant ready**: plant-isolated by design from day one
- **Touch-friendly**: dedicated HMI for shop floor with operator-optimized UX
- **Auditable**: every action traceable for compliance and lessons learned
- **Extensible**: polymorphic step model allows new step types without core changes

---

## 2. Domain Glossary

This is the **ubiquitous language** of the system. Every team member, document, and code identifier must use these terms consistently.

### 2.1 Core entities

| Term | Definition |
|---|---|
| **Plant** | Physical manufacturing site. Top-level tenant boundary. All transactional data is plant-scoped. |
| **Item** | Any material/product handled by the system: raw materials, semi-finished, components, finished goods, consumables. |
| **BOM** (Bill of Materials) | Multi-level tree describing what components compose a product, with quantities and validity dates. |
| **Workflow** | End-to-end operational flow from material reception to finished goods storage, multi-functional. Contains all phases including logistics, production, QC. |
| **Route** | Subset of a Workflow specifically describing production transformation phases. Conceptually replaced by Workflow in this system. |
| **Phase** | Macro-stage of a Workflow with a declared functional scope (production, logistics, QC, setup, teardown). |
| **Group** | Cluster of related steps within a Phase. Examples: BOM Check group, Device Execution group. |
| **Step** | Atomic action executed by operator or system. Polymorphic: can be production work, scan, movement, decision, information, etc. |
| **Recipe** | Set of process parameters (pressure, temperature, cycle time, tolerances) used by a device. Versioned and approved. |
| **Work Order (WO)** | Production order to manufacture a specific quantity of an item using a workflow. |
| **Equipment** | Any physical asset: site, area, work center, work unit, device, tool. Hierarchical (ISA-95 5 levels). |
| **Device** | Specific equipment that executes automated cycles (scanner, leak tester, press, robot). Sub-type of Equipment. |
| **Workstation** | Physical work position where operators work, contains devices and tools. |
| **Operator** | Person executing production work, with skills, shifts, and login credentials. |
| **Skill** | Competency required to execute certain steps (assembly, QC, forklift, welding). Binary with optional expiration. |
| **Lot** | Batch of materials with shared origin, quality status, and tracking. |
| **Serial** | Unique identifier for a single tracked piece, with full genealogy. |
| **BoxType** | Master entity defining a category of transport box: dimensions, capacity, returnable flag, sealing requirements. |
| **Box** | Physical instance of a box, tracked individually as an asset with unique ID, current contents, location, and lifecycle status. |
| **BoxContent** | Association between a Box and the items inside it (serials and/or quantities), with timestamps. |
| **Pallet** | Special BoxType (category `standard_pallet` or `half_pallet`); modeled uniformly with other boxes. |
| **Seal** | Tamper-evident closure on a Box. Seal numbers may be system-generated or manually entered, configurable per BoxType. |
| **Returnable Box** | Box configured for reuse: returns from customer, undergoes inspection/cleaning, returns to inventory. |
| **WorkOrderAssignment** | Explicit linkage between a Work Order (or specific Group within it) and an Operator, with timestamps and status tracking. |
| **Dispatch List** | Operator-facing list of Work Orders assigned to them, sorted by priority and due date. |
| **Shift** | Defined work period (e.g., Morning 06-14, Afternoon 14-22, Night 22-06) with associated operator coverage. |
| **Sample** | Piece extracted from production batch for offline testing (burst test, dimensional, aging). Tracked separately from main production count. |
| **Multi-output cycle** | Single device cycle producing multiple discrete pieces (e.g., one extrusion run produces N cut tubes). |
| **Continuous Production** | Production without discrete cycles (e.g., extruder runs for hours producing continuous tube length). |
| **Containerized WIP** | Work-in-progress pieces accumulated in physical containers between production phases (kanban bins, trolleys). |
| **Subassembly** | Sub-component pre-assembled before main production line (e.g., pre-crimped fitting). Has its own BOM and workflow. |
| **Quality Hold** | Status applied to a lot/batch awaiting quality decision; prevents downstream consumption until released. |
| **First Article Inspection (FAI)** | Formal inspection of the first piece(s) of a production run against full PPAP requirements; mandatory for automotive. |
| **Tool Wear** | Cumulative usage tracking on a tool (cycles count, hours, condition score) to predict end-of-life and trigger replacement. |
| **Tool Changeover** | Formalized procedure for swapping tooling between WO (e.g., different extruder head for different tube diameter). |
| **Mold** | Special tool used in CFRP, casting, molding processes; tracked as asset with cycle count and lifecycle (V2 — defined in extensions). |
| **Maintenance Order** | Work order specifically for equipment maintenance (preventive, corrective, calibration). |

### 2.2 Execution concepts

| Term | Definition |
|---|---|
| **Setup** | Phase before production cycles begin. Auto-generated from workflow analysis. Includes BOM check, skills verification, device setup, first piece approval. |
| **Teardown** | Phase after production cycles complete. Auto-generated. Includes device reset, tool return, cleanup, documentation. |
| **Cycle** | Single execution of a production phase for one piece. A WO has N cycles equal to qtyTarget. |
| **Cycle Time** | Time required to produce one piece through a phase. Sum of step durations excluding parallel steps. |
| **Parallel Step** | Step performed during a device cycle on adjacent parts (previous, next), not counted in cycle time. |
| **Part Reference** | Which piece a parallel step targets: current (in device), previous (just completed), next (being prepared). |
| **Buffer** | Rolling list of recent parts at a device, used to resolve part references. Default size 5. |
| **Recovery Flow** | Guided procedure activated on NOK outcomes, attempting to rework the part before scrapping. |
| **Scrap Compensation** | Automatic increase of remaining production target when a piece is scrapped, ensuring final qty meets order. |
| **Genealogy** | Full traceability of a serial: components consumed, operators involved, parameters measured, cycle outcomes. |

### 2.3 UX/UI concepts

| Term | Definition |
|---|---|
| **HMI** (Human-Machine Interface) | Touch-optimized application for operators on shop floor, separate from back-office UI. |
| **View Switcher** | Universal pattern allowing list/card/flow visualization of registries. |
| **Flow View** | Interactive canvas (React Flow) showing entities with relationships, optionally editable. |
| **4-Pane Configurator** | Universal layout for complex creation: wizard + palette + form + live preview. |
| **Live Preview** | Interactive simulator showing how a step will appear to operators in all possible states. |
| **Attention Point** | Ambient visual reminder on HMI step screens. Categorized (safety, quality, technical, regulatory, general). Non-blocking, no acknowledgment required. |
| **Andon** | Fullscreen production status display for shop floor visibility. |
| **Travel Card** | Printed document with WO information and QR code that follows the work through the floor. |

### 2.4 Process concepts

| Term | Definition |
|---|---|
| **Auto-Generation Rules** | Declarative rules that derive Setup and Teardown steps from workflow analysis. 6 core rules in MVP. |
| **Diff Visualizer** | UI showing what changed when auto-generation runs after workflow modification: added, modified, removed steps. |
| **Snapshot** | Frozen copy of a workflow version captured at WO release. WO uses snapshot, not live workflow. |
| **Override** | Manual modification of an auto-generated element, with audit trail and reason. |
| **Validation Runtime** | Pre-release checks that block WO release if prerequisites are missing (BOM, skills, devices, recipes). |
| **OEE** (Overall Equipment Effectiveness) | Standard manufacturing KPI: Availability × Performance × Quality. |
| **6 Big Losses** | Standard categorization of production losses: breakdowns, setup/adjustments, minor stops, reduced speed, defects, startup loss. |

---

## 3. Architectural Overview

### 3.1 Technology stack

**Backend**:
- **Runtime**: Node.js 20+ LTS
- **Framework**: NestJS 10+ (TypeScript)
- **ORM**: Prisma 5+
- **Database**: PostgreSQL 16+
- **Cache & queues**: Redis 7+ (BullMQ for jobs)
- **Real-time**: Socket.IO
- **Validation**: Zod (shared with frontend)
- **Logging**: Pino structured logging
- **Authentication**: JWT with refresh tokens (Passport.js)
- **API documentation**: OpenAPI/Swagger auto-generated

**Frontend**:
- **Framework**: Next.js 14+ (App Router, RSC)
- **UI library**: shadcn/ui (Radix UI primitives + Tailwind)
- **Styling**: TailwindCSS with custom design tokens
- **State**:
  - Server state: TanStack Query v5
  - Client state: Zustand
  - Forms: React Hook Form + Zod resolver
  - State machines: XState v5
- **Real-time**: Socket.IO client
- **Canvas/Flow**: @xyflow/react (React Flow v12) + dagre layout
- **Charts**: Recharts
- **Icons**: Lucide React
- **Animation**: Framer Motion
- **Internationalization**: next-intl
- **Date/time**: date-fns + date-fns-tz

**Storage & Infrastructure**:
- **File storage**: S3-compatible (MinIO for dev, AWS S3/Cloudflare R2 for prod)
- **Image processing**: Sharp (server-side)
- **Containerization**: Docker + Docker Compose for development
- **Deployment**: Container-based (Kubernetes-ready)

**Quality & Testing**:
- **Unit testing**: Vitest
- **E2E testing**: Playwright
- **Type checking**: TypeScript strict mode
- **Linting**: ESLint with multiple workspace configs
- **Formatting**: Prettier
- **Git hooks**: Husky + lint-staged + commitlint

### 3.2 Monorepo structure

```
mes-app/
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/        # Feature modules (work-orders, items, ...)
│   │   │   ├── common/         # Filters, interceptors, pipes, decorators
│   │   │   ├── auth/           # Authentication module
│   │   │   ├── events/         # Domain event handlers
│   │   │   └── main.ts
│   │   └── test/
│   │
│   └── web/                    # Next.js frontend (back-office + HMI)
│       ├── app/
│       │   ├── (back-office)/  # Back-office routes
│       │   ├── hmi/            # Shop floor HMI routes
│       │   └── api/            # API routes (auth callbacks)
│       ├── components/
│       │   ├── ui/             # Design system primitives
│       │   ├── shared/         # Cross-feature components
│       │   └── features/       # Feature-specific
│       ├── lib/
│       └── messages/           # i18n translations
│
├── packages/
│   ├── shared/                 # Shared types, Zod schemas, enums
│   │   ├── src/
│   │   │   ├── enums/          # All taxonomies
│   │   │   ├── schemas/        # Zod schemas
│   │   │   ├── types/          # TypeScript types
│   │   │   └── machines/       # XState state machines
│   │   └── package.json
│   │
│   ├── database/               # Prisma schema + migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── src/
│   │
│   └── ui/                     # Shared UI components (optional)
│
├── docs/
│   ├── MASTER_SPECIFICATION.md  # This document
│   ├── BEST_PRACTICES.md
│   ├── CONVENTIONS.md
│   └── adr/                     # Architecture Decision Records
│
├── docker-compose.dev.yml
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### 3.3 Bounded contexts

The system is organized into 10 domain aggregates, each with its own module in the backend:

| Domain | Responsibility |
|---|---|
| **Foundation** | Users, roles, plants, audit, notifications, activity feed, attachments, comments |
| **Equipment** | Equipment hierarchy (ISA-95), workstations, devices, tools, calibration |
| **Catalog** | Items, BOM, recipes, skills, cause codes, attention points, workflows, auto-gen rules |
| **People** | Operators, skills assignments, shifts, sessions |
| **Operations** | Work orders, executions, recovery attempts, counters |
| **Materials** | Lots, serials, reservations, stock locations, part location history, **box types, boxes, box contents, box movements** |
| **Quality** | QC records, measurements, defects, scrap, rework, dispositions |
| **Logistics** | Movement orders, scan records, label print jobs, kitting |
| **Performance** | Downtime events, OEE metrics, cycle times, declarations |
| **Configuration** | Auto-gen rules, recurring tasks, system settings, step category schemas |

Each domain communicates with others via:
- **Repository abstractions** (no cross-domain database access)
- **Domain events** (loose coupling)
- **Service contracts** (typed interfaces)

---

## 4. Complete Taxonomies

This section is the **definitive reference** for all enums and categorical values in the system. These taxonomies are mirrored as TypeScript enums in `/packages/shared/enums/` and as PostgreSQL ENUM types in the database.

### 4.1 Phase Categories (6)

A Phase is a macro-stage of a Workflow with a declared functional scope.

| Code | Label (IT) | Label (EN) | Icon | Auto-gen | Cycle-based | Notes |
|---|---|---|---|---|---|---|
| `inbound` | Logistica Ingresso | Inbound Logistics | 📥 | No | No | Material reception, qualification, movement to line |
| `setup` | Setup | Setup | 🔧 | **Yes** | No | Auto-generated. Skills check, BOM check, tooling, device setup, first piece |
| `production` | Produzione | Production | ⚙️ | No | **Yes** | Core production cycles. Repeated for each piece |
| `quality_control` | Controllo Qualità | Quality Control | 🎯 | No | Yes | QC inspections, measurements |
| `outbound` | Logistica Uscita | Outbound Logistics | 📤 | No | Yes | Labeling, packaging, storage |
| `teardown` | Chiusura | Teardown | ✅ | **Yes** | No | Auto-generated. Device reset, tool return, cleanup |

**Cycle-based**: phase is executed once per piece (production, qc, outbound) vs once per WO (inbound, setup, teardown).

### 4.2 Group Categories — MVP (9)

A Group is a cluster of related steps within a Phase.

| Code | Label (IT) | Auto-gen | Parallel support | Recovery support | Valid in phases |
|---|---|---|---|---|---|
| `skills_check` | Verifica Competenze | **Yes** | No | No | setup |
| `bom_check` | Verifica BOM | **Yes** | No | No | setup |
| `tooling_check` | Verifica Utensili | **Yes** | No | No | setup, teardown |
| `device_setup` | Setup Device | **Yes** | No | No | setup |
| `device_execution` | Esecuzione Device | No | **Yes** | **Yes** | production |
| `assembly` | Assemblaggio | No | No | No | production |
| `qc` | Controllo Qualità | No | No | **Yes** | quality_control, production |
| `logistics` | Movimentazione | No | No | No | inbound, outbound, production |
| `packaging` | Imballaggio (Box) | **Yes** | No | No | outbound |

> **v1.1 change**: `packaging` group promoted from V2 to MVP to support Box Management.

### 4.3 Group Categories — V2 (7)

Reserved for future expansion:
- `measurement` — dedicated measurement group with SPC
- `identification` — multi-scan identification group
- `material_handling` — picking, kitting, consumables
- `storage` — dedicated storage operations
- `documentation` — documents, signatures, batch records
- `device_reset` — auto-gen teardown reset
- `cleanup` — auto-gen teardown cleanup

In MVP, these are handled as generic steps within existing groups.

### 4.4 Step Categories (8)

A Step is the atomic action executed by operator or system. Polymorphic.

| Code | Label (IT) | Description |
|---|---|---|
| `production` | Produzione | Material transformation: assembly, processing, device execution |
| `logistics` | Movimentazione | Physical material movement |
| `identification` | Identificazione | Scan, label, identify uniquely |
| `quality_control` | Controllo Qualità | Inspection, measurement, testing |
| `decision` | Decisione | Conditional flow routing |
| `information` | Informazione | Briefing, SOP reading, video viewing |
| `setup` | Setup | Preparation steps (auto-generated) |
| `teardown` | Chiusura | Closure steps (auto-generated) |

### 4.5 Step Action Types

Action types specialize step categories:

```typescript
// Production
'assembly' | 'process' | 'device_run' | 'rework'

// Logistics
'move' | 'transfer' | 'load' | 'unload'

// Identification
'scan_barcode' | 'scan_qr' | 'scan_rfid' | 'scan_datamatrix'
'manual_id_entry' | 'print_label' | 'apply_label' | 'verify_id'

// Quality Control
'visual_check' | 'dimensional_check' | 'functional_test'
'sample_take' | 'document_defect'

// Decision
'auto_branch' | 'manual_choice' | 'condition_check'

// Information
'read_sop' | 'safety_briefing' | 'view_video' | 'view_drawing'

// Setup / Teardown
'verify_workstation' | 'verify_skill' | 'verify_tool' | 'verify_material'
'load_recipe' | 'unload_recipe' | 'first_piece' | 'last_piece' | 'cleanup'

// Box operations (NEW v1.1)
'pack_into_box' | 'unpack_from_box' | 'seal_box' | 'open_sealed_box'
'palletize_box' | 'depalletize_box' | 'inspect_box' | 'clean_box'
'select_empty_box' | 'validate_box_capacity' | 'print_box_label'
```

### 4.6 Step Type (visual modifier)

Independent of category, modifies visual treatment:

| Code | Visual | Use case |
|---|---|---|
| `normal` | Neutral gray | Default |
| `warning` | Amber/yellow | Step requiring extra attention |
| `informative` | Blue | Read-only information |

### 4.7 Step Device Category (within `device_execution` group)

When a step belongs to a `device_execution` group:

| Code | Description | Time mode |
|---|---|---|
| `pre` | Pre-step before device cycle | manual-standard-time |
| `device_main` | The device cycle itself | device-cycle-time |
| `parallel` | Performed during device cycle on adjacent part | while-device-running |
| `post` | Post-step after device cycle | manual-standard-time |

### 4.8 Time Mode (3)

| Code | Description |
|---|---|
| `manual-standard-time` | Operator-driven, duration manually defined |
| `device-cycle-time` | Auto-populated from recipe cycle time |
| `while-device-running` | Parallel execution, contributes 0 to cycle time |

### 4.9 Part Reference (for parallel steps)

| Code | Resolves to |
|---|---|
| `current` | Piece currently in device |
| `previous` | Previous piece (cycle N-1) |
| `next` | Next piece being prepared (cycle N+1) |
| `previous_n` | N cycles ago (with offset) |
| `batch` | Lot/batch level, no specific piece |
| `none` | No piece association (e.g., maintenance) |

### 4.10 No-Target Policy (when previous part not available)

| Code | Behavior |
|---|---|
| `skip` | Skip step, log reason. Default for routine parallel steps. |
| `defer` | Execute on next cycle. Max 2 chain. For critical QC steps. |
| `block_operator_choice` | Prompt operator: skip, defer, or abort. For business-critical. |

### 4.11 Step Source (provenance)

| Code | Description |
|---|---|
| `manual` | Created manually by process engineer |
| `auto_generated` | Created by auto-gen rule |
| `overridden` | Auto-generated then manually modified |

### 4.12 Equipment Hierarchy Levels (ISA-95)

| Code | Italian | English |
|---|---|---|
| `enterprise` | Azienda | Enterprise |
| `site` | Stabilimento | Site |
| `area` | Reparto | Area |
| `work_center` | Cella | Work Center |
| `work_unit` | Postazione | Work Unit |
| `equipment_module` | Dispositivo | Equipment Module |

### 4.13 Equipment Classes (6)

| Code | Description | Examples |
|---|---|---|
| `production` | Transforms material | Press, robot, oven |
| `storage` | Stocks materials | Warehouse rack, buffer |
| `transport` | Moves material | Forklift, AGV, conveyor |
| `test` | Quality verification | Leak tester, scanner, gauge |
| `maintenance` | Maintenance ops | Calibration bench |
| `administrative` | Support | Office equipment, kiosks |

### 4.14 Equipment Status (5)

| Code | Visual | Description |
|---|---|---|
| `available` | 🟢 Green | Ready to use |
| `in_use` | 🟡 Yellow | Currently active |
| `maintenance` | 🟠 Orange | Under maintenance |
| `broken` | 🔴 Red | Faulty |
| `offline` | ⚫ Gray | Disconnected |

### 4.15 Device Types (extensible)

```
'scanner' | 'printer' | 'leak_tester' | 'press' | 'welder'
'robot' | 'oven' | 'washer' | 'conveyor' | 'agv' | 'forklift'
'measurement' | 'custom'
```

### 4.16 Work Order Status (8)

| Code | Description |
|---|---|
| `draft` | Initial creation, not yet planned |
| `planned` | Scheduled, prerequisites being checked |
| `released` | Validated and ready for execution |
| `in_progress` | Production currently ongoing |
| `on_hold` | Paused (material, equipment, decision) |
| `completed` | qtyProduced >= qtyTarget |
| `partially_completed` | Closed before target (short-close) |
| `closed` | Finalized, costed, archived |
| `cancelled` | Cancelled before completion |

### 4.17 Work Order Priority (4)

`'low' | 'normal' | 'high' | 'urgent'`

### 4.18 Work Order Type (3)

| Code | Description |
|---|---|
| `production` | Standard production order |
| `rework` | Rework order for non-conforming pieces |
| `prototype` | Prototype, sample, R&D |

### 4.19 Item Type (5)

| Code | Italian | Description |
|---|---|---|
| `finished_good` | PF - Prodotto Finito | Sellable end product |
| `semi_finished` | SL - Semilavorato | Intermediate product |
| `raw_material` | MP - Materia Prima | Input material |
| `component` | Componente | Purchased component |
| `consumable` | Consumabile | Operating consumable (oil, gas, packaging) |

### 4.20 Tracking Mode (3)

| Code | Description |
|---|---|
| `none` | No tracking |
| `lot` | Lot/batch tracking |
| `serial` | Individual serial tracking |

### 4.21 Unit of Measure (extensible)

```
// Quantity:    'pc'
// Weight:      'g' | 'kg' | 't'
// Length:      'mm' | 'cm' | 'm'
// Volume:      'ml' | 'l' | 'm3'
// Time:        's' | 'min' | 'h'
// Area:        'm2'
// Imperial: V2 (lb, oz, in, ft, gal)
```

### 4.22 Lot Quality Status (3)

| Code | Visual | Description |
|---|---|---|
| `approved` | 🟢 Green | Released for use |
| `quarantine` | 🟡 Yellow | Awaiting decision |
| `rejected` | 🔴 Red | Rejected, do not use |

### 4.23 Serial Status (6)

| Code | Description |
|---|---|
| `allocated` | Pre-generated, not yet in production |
| `in_production` | Currently being processed |
| `completed` | Production finished, OK |
| `rework` | Reworked successfully |
| `scrapped` | Scrapped |
| `on_hold` | In quarantine awaiting decision |

### 4.24 Recipe Status (3)

| Code | Description |
|---|---|
| `draft` | In editing, not usable |
| `approved` | Approved, usable in production |
| `deprecated` | Obsolete, read-only |

### 4.25 Recipe Parameter Type (4)

`'numeric' | 'string' | 'enum' | 'boolean'`

Numeric parameters include `min`, `max`, `target`, `tolerance`, `unit`.

### 4.26 User Role (6)

| Code | Description |
|---|---|
| `admin` | System administrator |
| `planner` | Production planner |
| `supervisor` | Shop floor supervisor |
| `operator` | Production operator |
| `quality` | Quality engineer |
| `viewer` | Read-only access |

Users can have **multiple roles**.

### 4.27 Operator Status (4)

`'active' | 'on_leave' | 'training' | 'inactive'`

### 4.28 Skill Status (3)

`'active' | 'expired' | 'revoked'`

### 4.29 Downtime Categories — 6 Big Losses + extras

The 6 Big Losses (ISA-95 standard) plus operational categories:

| Code | Big Loss Mapping | Description |
|---|---|---|
| `breakdown` | Availability | Unexpected equipment failure |
| `setup_adjustment` | Availability | Setup, changeover, format change |
| `minor_stop` | Performance | Micro-stop < 5 minutes |
| `reduced_speed` | Performance | Running below nominal speed |
| `startup_loss` | Quality | Loss during startup phase |
| `defect_loss` | Quality | Scrap, rework, defects |
| `scheduled_maintenance` | Planned | Planned maintenance |
| `no_operator` | Operational | Operator absence |
| `no_material` | Operational | Material shortage |
| `not_scheduled` | Planned | Outside scheduled production |

### 4.30 Scrap Categories (9)

```
'material_defect' | 'process_error' | 'operator_error'
'equipment_failure' | 'design_issue' | 'contamination'
'dimensional' | 'cosmetic' | 'functional'
```

### 4.31 Recovery Outcome (4)

| Code | Description |
|---|---|
| `rework_success` | Piece recovered after rework |
| `scrap` | Piece scrapped |
| `deviation` | Accepted with deviation (V2) |
| `hold` | Quarantined for decision (V2) |

In MVP, only `rework_success` and `scrap` are implemented. `deviation` and `hold` deferred to V2 with NCR module.

### 4.32 Disposition Type (5)

```
'use_as_is' | 'rework' | 'scrap' | 'return_to_supplier' | 'hold'
```

### 4.33 Transport Mode (8)

```
'manual_carry' | 'manual_cart' | 'pallet_jack' | 'forklift'
'agv' | 'conveyor' | 'crane' | 'tugger'
```

### 4.34 Location Type (8)

```
'warehouse' | 'staging' | 'work_center' | 'workstation'
'buffer' | 'wip_area' | 'shipping' | 'quarantine'
```

### 4.34a Box Category (8) — NEW v1.1

| Code | Description | Examples |
|---|---|---|
| `standard_pallet` | Standard wooden/plastic pallet | EUR, EUR2 |
| `half_pallet` | Half-size pallet | 600×800 mm |
| `cardboard_box` | Single-use cardboard | Customer shipping |
| `plastic_crate` | Reusable plastic | Returnable bins |
| `metal_container` | Heavy-duty metal | Industrial parts |
| `kanban_bin` | Small inventory bin | Line-side feeding |
| `iso_container` | ISO shipping container | Bulk export |
| `custom` | Custom-defined type | Specialized |

### 4.34b Box Status (8) — NEW v1.1

| Code | Description | Visual |
|---|---|---|
| `empty` | Available, no contents | Gray |
| `partially_filled` | Loading in progress | Blue |
| `full` | At capacity, not sealed | Cyan |
| `sealed` | Sealed, ready to ship | Violet |
| `shipped` | Shipped to customer | Green |
| `returned` | Returnable box came back | Amber |
| `in_cleaning` | Being cleaned | Yellow |
| `damaged` | Damaged, not usable | Red |

### 4.34c Box Movement Type (8) — NEW v1.1

| Code | Description |
|---|---|
| `pack` | Item added to box |
| `unpack` | Item removed from box |
| `seal` | Box sealed |
| `unseal` | Sealed box opened |
| `palletize` | Box placed on pallet |
| `depalletize` | Box removed from pallet |
| `ship` | Box shipped to customer |
| `return` | Returnable box received back |

### 4.34d Box Content Tracking Mode (3) — NEW v1.1

How content inside a Box is tracked, configurable per BoxType:

| Code | Description | Use case |
|---|---|---|
| `serial` | Each item tracked by serial number | Finished products with serial |
| `quantity` | Only quantity counted, no individual tracking | Small components in bulk |
| `mixed` | Either serial or quantity per item | Mixed contents allowed |

### 4.35 Attention Point Category (5)

| Code | Italian | Visual | Use case |
|---|---|---|---|
| `safety` | Sicurezza | ⚠️ orange-500 | Physical hazards, PPE, safety procedures |
| `quality` | Qualità | 🎯 violet-500 | Critical tolerances, quality parameters |
| `technical` | Tecnico | 🔧 blue-500 | Technical operational notes |
| `regulatory` | Normativo | 📋 amber-500 | Compliance, batch records, regulations |
| `general` | Generale | 💡 gray-500 | Tips, best practices |

### 4.36 Attention Point Source (3)

```
'manual' | 'lesson_learned' | 'regulatory'
```

### 4.37 Step Execution Status (11)

**OK Flow (6)**:
| Code | Description |
|---|---|
| `idle` | Not yet started, in queue |
| `ready` | Ready to start (prerequisites OK) |
| `in_progress` | Currently executing |
| `paused` | Suspended by operator |
| `complete` | Successfully completed |
| `retry` | Retrying after recoverable failure |

**KO Flow (5)**:
| Code | Description |
|---|---|
| `error` | System/technical error |
| `failed` | Device or test NOK outcome |
| `warning` | Non-blocking anomaly |
| `timeout` | Maximum time exceeded |
| `offline` | Device unreachable |

### 4.38 Group Execution Status (8)

| Code | Description |
|---|---|
| `pending` | Not yet started |
| `pre_running` | Executing pre-steps |
| `device_starting` | Sending command to device |
| `device_running` | Device cycle in progress |
| `parallel_suspended` | NOK during device, parallel paused |
| `post_running` | Executing post-steps |
| `recovery` | Recovery flow active |
| `completed` | Group finished |

### 4.39 Timing Status (7)

For multi-level timer (WO/Phase/Part):

| Code | Visual | Threshold |
|---|---|---|
| `not_started` | Gray | Not started |
| `on_track` | Green | -5% to +5% of planned |
| `ahead` | Blue | Faster than -5% |
| `at_risk` | Amber | +5% to +20% slower |
| `delayed` | Red | > +20% slower |
| `paused` | Gray | Currently paused |
| `completed` | Green checkmark | Finished |

### 4.40 Auto-Gen Rule Trigger (6)

| Code | Triggers when workflow contains |
|---|---|
| `device_present` | Any device |
| `bom_present` | BOM components |
| `tooling_present` | Tools |
| `skill_required` | Skill requirements |
| `recipe_present` | Recipes |
| `consumable_present` | Consumables |

### 4.41 Auto-Gen Rule Scope (4)

```
'global' | 'plant' | 'equipment_class' | 'equipment_specific'
```

### 4.42 Recurring Task Category (4)

```
'maintenance' | 'qc_check' | 'consumable' | 'calibration'
```

### 4.43 Recurring Task Trigger (3)

```
'counter' | 'timer' | 'event'
```

### 4.44 Recurring Task Status (5)

```
'pending' | 'in_progress' | 'completed' | 'overdue' | 'skipped'
```

### 4.45 Notification Type (5)

```
'info' | 'success' | 'warning' | 'error' | 'action_required'
```

### 4.46 Activity Type

```
'created' | 'updated' | 'deleted' | 'status_changed'
'commented' | 'attachment_added' | 'released'
'completed' | 'cancelled'
```

### 4.47 WorkOrder Assignment Status (5) — NEW v1.2

| Code | Description |
|---|---|
| `pending` | Assignment created, awaiting operator acceptance/start |
| `accepted` | Operator confirmed, ready to start |
| `active` | Operator currently executing |
| `completed` | Assignment closed successfully |
| `reassigned` | Transferred to another operator (audit trail preserved) |

### 4.48 Shift Type (3) — NEW v1.2

| Code | Italian | Typical hours |
|---|---|---|
| `morning` | Mattino | 06:00 - 14:00 |
| `afternoon` | Pomeriggio | 14:00 - 22:00 |
| `night` | Notte | 22:00 - 06:00 |

Configurable per plant. Custom shifts allowed via Shift entity (see extensions/SCHEDULING_ASSIGNMENT.md).

### 4.49 Maintenance Order Status (6) — NEW v1.2

| Code | Description |
|---|---|
| `scheduled` | Maintenance planned, awaiting execution |
| `in_progress` | Maintenance being performed |
| `completed` | Maintenance done successfully |
| `cancelled` | Maintenance cancelled before completion |
| `overdue` | Maintenance window passed without execution |
| `deferred` | Postponed with reason and approval |

### 4.50 Maintenance Type (4) — NEW v1.2

| Code | Description |
|---|---|
| `preventive` | Scheduled, proactive maintenance |
| `corrective` | Reactive, after equipment fault |
| `calibration` | Periodic calibration of measuring instruments |
| `inspection` | Visual inspection / safety check |

Predictive maintenance is V2.

### 4.51 Equipment State Machine (formal states) — NEW v1.2

Replaces and extends the simple `EquipmentStatus` enum with formal state machine semantics:

| State | Description | Transitions |
|---|---|---|
| `available` | Ready to use | → in_use, maintenance, broken, offline |
| `setup_required` | Awaiting setup before use (after WO release) | → in_use, available |
| `in_use` | Currently operating | → available, paused, broken |
| `paused` | Temporarily stopped during use | → in_use, broken |
| `maintenance_pending` | Maintenance scheduled, not yet started | → maintenance, available |
| `maintenance` | Under maintenance | → available, broken |
| `broken` | Faulty, requires repair | → maintenance |
| `offline` | Disconnected, decommissioned, or out of service | → available |

Detailed XState definition in `extensions/EQUIPMENT_MANAGEMENT.md`.

### 4.52 Tool Wear Status (5) — NEW v1.2

| Code | Description | Visual |
|---|---|---|
| `new` | Just installed, fresh | Green |
| `good` | Normal operation | Green |
| `worn` | Approaching limits, monitor closely | Amber |
| `at_limit` | Reached predicted end-of-life | Orange |
| `replaced` | Already removed from service | Gray |

Cycle count tracked per tool. Configurable thresholds per tool type.

### 4.53 Sample Type (4) — NEW v1.2

| Code | Description | Frequency |
|---|---|---|
| `first_article` | First piece(s) for FAI inspection | First N pieces of run |
| `periodic` | Regular sampling (every N pieces or every X minutes) | Configurable |
| `lot_certification` | End-of-lot sample for batch certification | 1-2% of lot |
| `customer_request` | On-demand sample requested by customer | Ad-hoc |

### 4.54 Lot Hold Reason (5) — NEW v1.2

For Quality Hold/Release workflow:

| Code | Description |
|---|---|
| `awaiting_test_results` | Test in progress, lot blocked |
| `under_review` | Quality team reviewing |
| `customer_complaint` | Hold pending customer feedback |
| `documentation_pending` | Awaiting paperwork |
| `quarantine` | Suspected defect, isolated |

### 4.55 Production Mode (2) — NEW v1.2

For modeling continuous vs discrete production:

| Code | Description | Example |
|---|---|---|
| `discrete` | One cycle = one piece (or multi-output set) | Assembly, Leak test |
| `continuous` | Continuous output, cut/sampled at intervals | Extrusion, lamination |

Configurable per Phase. Affects cycle counting and KPI calculation.

### 4.56 Multi-Output Type (3) — NEW v1.2

For cycles producing multiple pieces:

| Code | Description |
|---|---|
| `none` | 1 cycle = 1 piece (default) |
| `fixed` | 1 cycle = N pieces (e.g., 1 mold = 4 cavities) |
| `variable` | 1 cycle = variable pieces (e.g., extrusion → cuts) |

### 4.57 Prepreg Storage State (4) — NEW v1.2 (CFRP)

For tracking prepreg material lifecycle:

| Code | Description | Temperature |
|---|---|---|
| `frozen` | Stored at -18°C, lifecycle paused | -18°C |
| `refrigerated` | Stored at 4°C, slow degradation | 4°C |
| `out` | Out at room temperature, accumulating out-time | 20°C |
| `expired` | Out-time exceeded, must be discarded | N/A |

Out-time tracking is **cumulative** across multiple "out" periods.

### 4.58 Mold Status (5) — NEW v1.2 (CFRP)

| Code | Description |
|---|---|
| `available` | Ready for use |
| `in_use` | Currently used in production |
| `cleaning` | Post-cycle cleaning |
| `maintenance` | Refurbishment / repair |
| `decommissioned` | End of life, retired |

Cycles count tracked. Predictable lifetime (200-1000 cycles typically).

### 4.59 Cure Cycle Phase (5) — NEW v1.2 (CFRP)

For autoclave long-running cycles:

| Code | Description | Duration typical |
|---|---|---|
| `vacuum_pre_cure` | Initial vacuum, no temperature | 30 min |
| `heating_ramp` | Temperature rising 1-3°C/min | 1-2h |
| `dwell` | Hold at cure temperature | 1-4h |
| `cooling_ramp` | Controlled cooling | 1-2h |
| `depressurization` | Final cooling and pressure release | 30 min |

### 4.60 NDT Test Type (4) — NEW v1.2 (CFRP)

| Code | Description |
|---|---|
| `ultrasonic_c_scan` | Detects delaminations, voids |
| `dimensional` | CMM or 3D scanner |
| `weight` | Mass verification |
| `visual_inspection` | Surface defects |

### 4.61 Reflectance Test Result (3) — NEW v1.2 (Safety Devices)

| Code | Description |
|---|---|
| `pass` | Above threshold per ECE-R104 |
| `marginal` | Within 10% of threshold (warning) |
| `fail` | Below threshold (reject) |

Specific thresholds per color: White (250 cd/lx/m²), Yellow (175), Red (60).

### 4.62 Homologation Status (4) — NEW v1.2 (Safety Devices)

| Code | Description |
|---|---|
| `valid` | Currently valid certification |
| `expiring_soon` | Expiring in < 90 days |
| `expired` | Certification expired, must renew |
| `withdrawn` | Voluntarily or compulsorily withdrawn |

### 4.63 Lamination Quality Result (3) — NEW v1.2 (Safety Devices)

| Code | Description |
|---|---|
| `passed` | Adhesion + visual OK |
| `bubbles_detected` | Bolle d'aria, da rifare |
| `delamination` | Pellicola scollata, scartare |

### 4.64 Aging Test Type (5) — NEW v1.2 (Safety Devices)

| Code | Description | Duration |
|---|---|---|
| `quv_uv_exposure` | Accelerated UV exposure | 1000-2000h |
| `salt_spray` | Salt corrosion | 168-500h |
| `thermal_cycling` | -40°C to +80°C cycles | Cycles |
| `humidity` | 95% RH constant | 1000h |
| `combined` | Multiple stresses combined | Variable |



---

## 5. Domain Model

### 5.1 High-level entity relationships

```
Plant ─┬── Users (with multi-role)
       ├── Operators (with skills, shifts)
       │
       ├── Equipment Tree (ISA-95 5 levels)
       │   └── Workstations
       │       └── Devices, Tools
       │
       ├── Items
       │   ├── BOM ─→ BOMComponent (recursive)
       │   └── Recipes ─→ RecipeVersions ─→ Parameters
       │
       ├── Workflows ─→ WorkflowVersions
       │   └── Phases
       │       └── Groups
       │           └── Steps (polymorphic)
       │               ←─→ AttentionPoints (M2M)
       │
       ├── WorkOrders
       │   ├── WorkflowSnapshot (frozen at release)
       │   ├── WorkOrderPhases
       │   │   └── WorkOrderGroups
       │   │       └── WorkOrderSteps
       │   │           └── StepExecutions (history)
       │   ├── SerialNumbers (allocated range)
       │   ├── MaterialReservations
       │   └── Counters (qty produced/scrap/rework)
       │
       ├── Lots ─→ LotMovements
       │
       ├── BoxTypes (master/registry)
       │   └── Boxes (instances, tracked assets)
       │       ├── BoxContents (M2M with Serial/Lot)
       │       └── BoxMovements (history)
       │
       └── DowntimeEvents
```

### 5.2 Aggregate boundaries

Aggregates enforce consistency boundaries. Within an aggregate, data is loaded and modified together.

**Foundation aggregate**:
- User (root)
- UserRoles (membership)

**Equipment aggregate**:
- EquipmentNode (root)
- Children EquipmentNodes (composition)
- Calibrations
- MaintenanceRecords

**Workflow aggregate**:
- Workflow (root)
- WorkflowVersion
- Phases
- Groups
- Steps
- Step-AttentionPoint links

**Work Order aggregate**:
- WorkOrder (root)
- WorkflowSnapshot
- Phases (snapshot)
- Groups (snapshot)
- Steps (snapshot)
- StepExecutions
- Counters
- ParallelSuspensions
- RecoveryAttempts

**Lot aggregate**:
- Lot (root)
- LotMovements
- LotQualityStatusHistory

**Serial aggregate**:
- Serial (root)
- SerialHistory
- Genealogy links

### 5.3 Polymorphic Step model

The Step entity is **polymorphic** based on `category`. Common fields are stored in the `steps` table; category-specific configuration is stored in `step_config` JSONB column, validated against a JSON Schema per category.

```typescript
// Common to all steps
interface StepBase {
  id: string
  groupId: string
  sequence: number
  category: StepCategory          // discriminator
  actionType: StepActionType
  stepType: 'normal' | 'warning' | 'informative'
  title: string
  instructions?: string
  imageUrl?: string
  durationSec: number
  timeMode: TimeMode
  
  // Device execution specific (only when group is device_execution)
  deviceCategory?: 'pre' | 'device_main' | 'parallel' | 'post'
  partReference?: PartReference
  partOffset?: number
  noTargetPolicy?: NoTargetPolicy
  
  // Behavior
  blocking: boolean
  requiresConfirmation: boolean
  
  // Source
  source: 'manual' | 'auto_generated' | 'overridden'
  autoGenRuleId?: string
  preserveOnRegeneration: boolean
  
  // Polymorphic config
  config: JsonValue                // validated against category schema
  
  // Audit
  createdAt, createdBy, updatedAt, updatedBy, deletedAt, version, plantId
}

// Category-specific config examples:

interface ScanStepConfig {
  inputType: 'barcode' | 'qr' | 'rfid' | 'datamatrix' | 'manual_entry'
  expectedFormat?: string         // regex
  validateAgainst?: 'database' | 'pattern' | 'checksum'
  onMismatch: 'block' | 'warn' | 'allow_with_reason'
  scanMultiple?: { min, max, stopOnDuplicate }
}

interface MovementStepConfig {
  fromLocation: LocationRef
  toLocation: LocationRef
  transportMode: TransportMode
  moveItemType: 'part' | 'kit' | 'pallet' | 'container' | 'tool'
  requiresScanAtSource: boolean
  requiresScanAtDestination: boolean
  weightKg?: number
  requiresTwoOperators?: boolean
}

interface DecisionStepConfig {
  decisionType: 'auto' | 'operator' | 'mixed'
  conditions?: Condition[]
  operatorPrompt?: { question, options }
  branches: { conditionRef, nextStepId }[]
  defaultBranch?: string
}

interface DeviceRunStepConfig {
  deviceId: string
  recipeId: string
  cycleTimeSec: number
  expectedOutputs?: { key, expectedValue, tolerance }[]
}
```

### 5.4 Schema registry

Each Step category has a corresponding JSON Schema in the `step_category_schemas` table:

```sql
CREATE TABLE step_category_schemas (
  category        VARCHAR(30) PRIMARY KEY,
  json_schema     JSONB NOT NULL,           -- validates step.config
  ui_component    VARCHAR(100),             -- React component for editor
  hmi_component   VARCHAR(100),             -- React component for HMI runtime
  preview_component VARCHAR(100),           -- Component for live preview
  version         INTEGER NOT NULL DEFAULT 1
)
```

Adding a new step category requires:
1. Insert row in `step_category_schemas`
2. Implement UI editor component
3. Implement HMI runtime component
4. Implement preview component

No core changes needed.

---

## 6. State Machines

All entities with non-trivial lifecycle use **formal state machines** (XState v5) shared between backend and frontend via `/packages/shared/machines/`.

### 6.1 Work Order state machine

```
                        ┌──────────────┐
                        │    DRAFT     │
                        └──────┬───────┘
                               │ PLAN
                               ▼
                        ┌──────────────┐
              ┌─────────│   PLANNED    │
              │         └──────┬───────┘
              │                │ RELEASE (validation OK)
              │                ▼
              │         ┌──────────────┐
              │   ┌─────│   RELEASED   │
              │   │     └──────┬───────┘
              │   │            │ START
              │   │            ▼
              │   │     ┌──────────────┐
              │   │  ┌──│ IN_PROGRESS  │
              │   │  │  └──────┬───────┘
              │   │  │         │
              │   │  │   ┌─────┼─────────────┬─────────────┐
              │   │  │   │     │             │             │
              │   │  │   ▼     ▼             ▼             ▼
              │   │  │  HOLD COMPLETE    PARTIALLY_   CANCELLED
              │   │  │   │     │         COMPLETED        │
              │   │  │   │     │             │            │
              │   │  └───┘     │             │            │
              │   │            │             │            │
              │   │            ▼             ▼            │
              │   │       ┌────────┐    ┌─────────┐       │
              │   │       │ CLOSED │    │ CLOSED  │       │
              │   │       └────────┘    └─────────┘       │
              │   │                                       │
              │   └───────CANCEL──────────────────────────┘
              │                                           │
              └────────────CANCEL─────────────────────────┘
```

**Transitions**:

| From | Event | To | Guard | Side effects |
|---|---|---|---|---|
| `draft` | PLAN | `planned` | hasWorkflow | snapshot version pending |
| `planned` | RELEASE | `released` | validateRelease | snapshot workflow, allocate serials, reserve materials |
| `released` | START | `in_progress` | — | initialize counters, dispatch first phase |
| `in_progress` | PUT_ON_HOLD | `on_hold` | — | log reason |
| `on_hold` | RESUME | `in_progress` | — | log resume |
| `in_progress` | COMPLETE | `completed` | qtyProduced >= qtyTarget | trigger teardown |
| `in_progress` | SHORT_CLOSE | `partially_completed` | userConfirm | log reason |
| `completed` | CLOSE | `closed` | — | finalize, archive |
| `partially_completed` | CLOSE | `closed` | — | finalize |
| `*` (except closed) | CANCEL | `cancelled` | userConfirm | release reservations |

### 6.2 Step Execution state machine (11 states)

See section 4.37. The state machine handles transitions between:
- OK flow: idle → ready → in_progress → (paused ↔ in_progress) → complete
- KO flow: error, failed, warning, timeout, offline (each with recovery options)

Key transitions:
- `in_progress` → `failed` triggers Recovery Flow
- `in_progress` → `error` triggers Error Handling
- `failed` + `retry` → `retry` → `in_progress`
- `retry` after max attempts → `failed` (final)

### 6.3 Group Execution state machine (Device Execution)

```
PENDING
  │
  │ START
  ▼
PRE_RUNNING ──── (all pre-steps confirmed) ──→ DEVICE_STARTING
                                                  │
                                                  │ device ACK
                                                  ▼
                                            DEVICE_RUNNING ←──┐
                                                  │           │
                              ┌───────────────────┼───────────┤
                              │                   │           │
                              ▼                   ▼           │
                    HARD_NOK during         DEVICE_COMPLETE   │
                              │                   │           │
                              ▼                   ▼           │
                    PARALLEL_SUSPENDED      (parallel done?)  │
                              │              YES → POST       │
                              │              NO → wait        │
                              ▼                                │
                          RECOVERY ─── success ────────────────┘
                              │
                              │ failure
                              ▼
                            FAILED (scrap flow)
                              │
                              ▼
                          POST_RUNNING
                              │
                              ▼
                          COMPLETED
```

### 6.4 Recipe state machine

```
DRAFT ──approve──→ APPROVED ──deprecate──→ DEPRECATED
  ↑                    │
  │                    │ create_new_version
  │                    ▼
  └────────────── DRAFT (new version)
```

Versioning: each significant change creates a new version. Approval is per-version. Only one version per recipe is `approved` at a time; others become `deprecated`.

### 6.5 Lot Quality state machine

```
APPROVED ←──approve──┐
   │                 │
   │                 │
   ▼                 │
QUARANTINE ──────────┤
   │                 │
   │ reject          │ reapprove
   ▼                 │
REJECTED ←───────────┘
```

Quarantine to/from Approved is bidirectional with quality engineer authorization. Once Rejected, requires special procedure to re-approve (V2).

---

## 7. Workflow & Routes

### 7.1 Workflow vs Route

The system uses **Workflow** as the primary concept; **Route** is its production-only subset.

- **Workflow**: end-to-end flow including inbound, setup, production, QC, outbound, teardown
- **Route**: traditional MES term for production transformation phases only

Internally, the system models **Workflow** as the master entity. The "Route" terminology may appear in UI for user familiarity but maps to the production phase of a workflow.

### 7.2 Hierarchy

```
Workflow (versioned)
  └── Phase (1..N, ordered, with category)
      └── Group (1..N, ordered, with category)
          └── Step (1..N, ordered, polymorphic)
              ├── AttentionPoints (M2M, optional)
              ├── BOM Components (M2M, for production steps)
              ├── Tools (M2M, for production/setup)
              ├── Skills (M2M, required for execution)
              └── Recipe (FK, for device steps)
```

### 7.3 Workflow versioning

- Each Workflow has multiple versions
- Only one version is `active` at a time
- New versions created from existing (clone + modify)
- Historical versions remain queryable
- Version increments on any structural change
- Minor edits (e.g., title typo) don't trigger version increment

### 7.4 WO snapshot pattern

When a Work Order is **released**, a snapshot of the current workflow version is frozen and stored with the WO. This ensures:

- WOs in flight are unaffected by workflow modifications
- Audit trail clearly shows what version was used
- Reproducibility: same WO would produce the same execution
- Compliance: regulated industries require frozen procedures

The snapshot is stored as a deep copy in `workorder_workflow_snapshots` table with full hierarchy.

### 7.5 Compatibility matrix Phase × Group

| Phase | Allowed Group Categories |
|---|---|
| `inbound` | logistics, identification (V2), material_handling (V2) |
| `setup` | skills_check, bom_check, tooling_check, device_setup (all auto-gen) + custom |
| `production` | device_execution, assembly, qc |
| `quality_control` | qc, measurement (V2) |
| `outbound` | logistics, **packaging**, identification (V2), storage (V2) |
| `teardown` | device_reset (V2), cleanup (V2), tool_return (V2), documentation (V2) — in MVP, generic groups |

### 7.6 Compatibility matrix Group × Step Category

Each Group category accepts certain Step categories:

| Group | Allowed Step Categories |
|---|---|
| `skills_check` | identification, information, setup |
| `bom_check` | identification, setup |
| `tooling_check` | identification, setup |
| `device_setup` | identification, information, setup |
| `device_execution` | production, identification, information |
| `assembly` | production, information, identification |
| `qc` | quality_control, identification, information |
| `logistics` | logistics, identification |
| `packaging` | logistics, identification, information |

Validation enforces these constraints in the workflow editor.

---

## 8. Auto-Generation Engine

### 8.1 Concept

Setup and Teardown phases are **automatically derived** from analyzing the Workflow. The Process Engineer designs only the production-related phases; setup/teardown emerge automatically from declarative rules.

### 8.2 Generation lifecycle

```
WORKFLOW DEFINITION                  AUTO-GEN ENGINE                OUTPUT
                                             
Process Engineer                     Rule matching                  Setup Phase
designs workflow:                    Each rule:                      ├── Group: Skills Check
- Phases                       →     1. Checks trigger          →    ├── Group: BOM Check
- Groups                             2. If matches, generates        ├── Group: Tooling Check
- Steps                              3. Adds to Setup/Teardown       ├── Group: Device Setup
- BOM, Tools, Recipes                                                └── Group: First Piece
- Skills, Devices                                                    
                                                                     Teardown Phase
                                                                     ├── Group: Device Reset
                                                                     ├── Group: Tool Return
                                                                     └── Group: Cleanup
```

### 8.3 Seven core rules (MVP)

| # | Rule | Trigger | Generates in Setup | Generates in Teardown |
|---|---|---|---|---|
| 1 | **Skills & Login Verification** | Phase requires skills | Group `skills_check` with verify steps per skill | — |
| 2 | **BOM Check Sequenziale** | Phase consumes BOM | Group `bom_check` with scan step per component | — |
| 3 | **Tooling Check** | Phase uses tools | Group `tooling_check` with verify per tool | Group `tooling_check` with return per tool |
| 4 | **Device Verify & Recipe Load** | Phase has device + recipe | Group `device_setup` with verify + load_recipe | Group with unload_recipe + cleanup |
| 5 | **First Piece Approval** | Phase has device PRODUCTION class | Group with first_piece step + QC sign-off | — |
| 6 | **Device Reset & Cleanup** | Any device used | — | Group with device_reset + cleanup |
| 7 | **Box Packaging** | Phase `outbound` + item has `boxingRequired=true` | — | Group `packaging` in outbound: select_empty_box, pack_into_box, validate_capacity, seal_box, print_label |

### 8.4 Generation timing

| Trigger | Action |
|---|---|
| Workflow created | Auto-gen runs, proposes Setup + Teardown |
| Workflow modified (BOM, devices, tools, skills, recipe) | Re-generation with **diff visualizer** |
| Recipe version updated | Update Recipe Verify step in Setup |
| WO **released** | Snapshot frozen, no further regeneration |

**Important**: WOs use the snapshot from release time. Workflow modifications after WO release **do not** affect that WO.

### 8.5 Diff visualizer

When workflow changes trigger re-generation:

```
Route RT-001 modified — Setup/Teardown re-generation

CHANGES DETECTED:

➕ ADDED
• BOM Check step for new component C789 (qty 4)
• Tooling Check for added TRQ-WRENCH-30NM

✏️ MODIFIED
• Recipe Verify: RCP-LEAK-001 v2 → v3

➖ REMOVED
• BOM Check step for B456 (component removed from BOM)

⚠️ MANUAL OVERRIDES PRESERVED
• Step "Custom QC briefing" preserved (manual addition)

[APPLY CHANGES]  [REVIEW EACH]  [CANCEL]
```

### 8.6 Override system

Process Engineer can:

**A. Disable a rule for the workflow**:
```typescript
{
  workflowId: "WF-001",
  ruleOverrides: [
    { ruleId: "AUTO_TOOLING_CHECK", enabled: false, reason: "Tooling permanent" }
  ]
}
```

**B. Override a specific step**:
```typescript
{
  stepOverrides: [
    {
      autoGeneratedStepId: "STEP_BOM_CHECK_A123",
      override: { 
        instructions: "Custom: scan only batch label, not individual items",
        durationSec: 5
      },
      preserveOnRegeneration: true,
      reason: "Agreement with warehouse"
    }
  ]
}
```

**C. Add manual steps alongside auto**:
Manual additions live next to auto-generated ones, marked `source: 'manual'`. Subsequent regenerations don't touch them.

### 8.7 Validation runtime (pre-release)

When Planner attempts to RELEASE a WO, system performs comprehensive validation based on auto-generated setup steps:

```typescript
async function validateRelease(woId: string): Promise<ValidationReport> {
  return {
    bomCheck: await checkAllComponentsAvailable(wo),
    deviceCheck: await checkDevicesAvailableAndCalibrated(wo),
    toolingCheck: await checkToolingPresent(wo),
    skillsCheck: await checkOperatorSkills(wo),
    recipeCheck: await checkRecipesApproved(wo),
    workstationCheck: await checkWorkstationsReady(wo),
    consumableCheck: await checkConsumableLevels(wo)
  }
}
```

If any check fails, RELEASE is blocked with explicit error and remediation suggestions.

---

## 9. Parallel Steps System

### 9.1 Concept

Within a Device Execution group, the operator can perform value-add tasks **during** the device cycle on adjacent parts (typically the previous part), maximizing throughput.

```
TIMELINE OF DEVICE EXECUTION GROUP

T=0s         T=30s              T=75s         T=85s
│            │                  │             │
├─PRE-STEPS──┼──DEVICE RUNNING──┼─POST-STEPS──┤
│ (manual)   │ (device-cycle)   │ (manual)    │
│ 30 sec     │ 45 sec           │ 10 sec      │
│            │                  │             │
│            ├─PARALLEL STEPS───┤             │
│            │ (while-running)  │             │
│            │ 0 sec counted    │             │
                    
Total cycle time = 85 sec
(NOT 30+45+25+10 = 110 sec)
```

### 9.2 Step categories within device_execution group

| Category | Time Mode | Counts in cycle? | Sequence |
|---|---|---|---|
| `pre` | manual-standard-time | ✅ Yes | Sequential, before device |
| `device_main` | device-cycle-time | ✅ Yes | Single, the device cycle |
| `parallel` | while-device-running | ❌ No (duration=0) | Can be in any order |
| `post` | manual-standard-time | ✅ Yes | Sequential, after device |

### 9.3 Validation: parallel feasibility

```typescript
sum(parallelSteps.duration) <= deviceCycleTime

if > deviceCycleTime: BLOCK (impossible to fit)
if > deviceCycleTime * 0.85: WARNING (operator overload risk)
```

Editor shows real-time validation with visual feedback.

### 9.4 Part Cycle Buffer

Each device maintains a **rolling buffer** of recent parts. Default size: 5. Configurable per device or workflow.

```
Device DEV-LEAKTEST-01 — Buffer (size 5)

Slot   PartId      Status         CycleNum   Timestamp
─────────────────────────────────────────────────────────
N-3    SN-001237   completed      37         08:15:22
N-2    SN-001238   completed      38         08:16:05
N-1    SN-001239   completed      39         08:16:48  ← target of parallel "previous"
N      SN-001240   in_device      40         08:17:31  ← currently in device
N+1    SN-001241   prepared       41         08:17:55  ← prepared, target of "next"
```

Buffer entries are evicted on FIFO when buffer is full.

### 9.5 Part Reference resolution

Parallel steps declare which part they target:

```typescript
async function resolvePartReference(
  deviceId: string,
  workOrderId: string,
  currentCycleNum: number,
  reference: PartReference,
  offset?: number
): Promise<PartCycleBufferEntry | null> {
  switch (reference) {
    case 'current':
      return findInBuffer({ cycleNumber: currentCycleNum, status: 'in_device' })
    case 'previous':
      return findInBuffer({ cycleNumber: currentCycleNum - 1, status: 'completed' })
    case 'previous_n':
      return findInBuffer({ cycleNumber: currentCycleNum - Math.abs(offset!) })
    case 'next':
      return findInBuffer({ cycleNumber: currentCycleNum + 1, status: 'prepared' })
    case 'batch':
    case 'none':
      return null
  }
}
```

### 9.6 Edge cases

**First cycle (no previous)**:
- Reference `previous` returns null
- Apply `noTargetPolicy`: skip / defer / block

**Previous part scrapped**:
- Buffer entry status = `scrapped`
- Step on scrapped part: prompt operator, typically skip

**Parallel not finished when device completes**:
- State → `WAIT_OPERATOR_FINISH`
- Block POST-steps until parallel complete
- Track `delayPostDevice` for analytics

**Buffer eviction during late parallel**:
- Step retains `targetPartId` (not just offset)
- Warning: "Part may have moved physically"
- Step still completes but logs anomaly

### 9.7 NOK during device with parallel active

Critical scenario: device fails NOK while operator is doing parallel work.

```
1. Device emits HARD_NOK during cycle
2. System creates ParallelSuspensionEvent:
   - Snapshot of completed parallel steps
   - Snapshot of in-progress step (if any) with progress %
   - Snapshot of pending parallel steps
3. State → PARALLEL_SUSPENDED
4. UI shows alert with status of each parallel step
5. Recovery flow starts on current part (in device)
6. Outcome:
   - Recovery success: resume parallel from suspension
   - Recovery failure: scrap current part
     • Parallel steps targeting other parts (previous/next): preserved
     • Parallel steps targeting current part: invalidated
```

### 9.8 Single owner default + Assist Mode (V2 opt-in)

**Default**: one operator owns the entire group execution. All steps assigned to them.

**Assist Mode** (V2, opt-in per group): multiple operators can work simultaneously on the same group. Used for:
- Compliance with witness signatures (pharma)
- Heavy/large parts requiring two operators
- Specialized roles (operator + QC inspector)

In MVP, only single-owner mode is implemented. Operator handover supported via explicit transfer with audit.

### 9.9 Buffer size configuration hierarchy

```
Default (system):           5
  ↓ override
Per Device (registry):      configurable 2-15
  ↓ override
Per Workflow:               override if previous_n with n > buffer
  ↓ override
Per WO (exceptional):       override with reason + audit
```

### 9.10 KPIs for parallel steps

| KPI | Formula | Purpose |
|---|---|---|
| Parallel Utilization | `sum(parallel_actual) / device_actual` | Identify under-utilized device cycles |
| Parallel Skip Rate | `count(skipped) / count(total)` | Detect badly designed steps |
| Operator Idle During Device | `device_time - sum(parallel_actual)` | Optimization potential |
| Delay Post Device | `avg(post_start - device_complete)` | Operator timing performance |

---

## 10. Recovery Flow

### 10.1 Concept

When a step produces NOK outcome (test failure, process anomaly, operator-detected issue), the system activates a **guided recovery procedure** that attempts to recover the part before scrapping.

### 10.2 Triggers (3 families)

**1. Test/QC failure**:
- Leak test failed, electrical test negative, dimensional out of tolerance, functional test not passed

**2. Process anomaly**:
- Torque out of range, temperature/pressure deviation, abnormal cycle time, device alarm

**3. Operator-detected**:
- Visual defect, damaged component, recognized procedure error, lot mismatch

### 10.3 Five stages

```
NOK detected
    │
    ▼
Stage 1: DIAGNOSIS
    Operator identifies cause (fault code from list)
    System suggests recovery procedure
    │
    ▼
Stage 2: RECOVERY ATTEMPT (1..maxAttempts)
    Diagnostic steps (e.g., check connections)
    Corrective actions (e.g., reposition, retighten)
    Re-test (re-execute failed operation)
    │
    ├─── OK → REWORK_SUCCESS, continue normal flow
    │         qtyRework++ (NOT qtyProduced++ separately)
    │
    └─── NOK → Stage 3
    │
Stage 3: ATTEMPT MANAGEMENT
    if attempts < maxAttempts: → back to Stage 2
    if attempts >= maxAttempts: → Stage 4
    │
    ▼
Stage 4: DISPOSITION DECISION (MVP: only scrap)
    Default: Scrap
    V2: Deviation, Hold, Use as-is
    │
    ▼
Stage 5: EXECUTION (Scrap flow in MVP)
    Print scrap label, move to bin, log reason
    qtyScrap++ → triggers Scrap Compensation
```

### 10.4 Recovery Procedure entity

Recovery flows are configured as Recovery Procedures associated to step/device/recipe:

```typescript
interface RecoveryProcedure {
  id: string
  name: string
  scope: { deviceId?, recipeId?, stepId?, faultCode? }
  
  maxAttempts: number              // default 3
  attemptStrategy: 'same_steps' | 'progressive'
  
  diagnosisSteps: Step[]
  recoverySteps: Step[][]          // array per attempt if progressive
  
  // V2 dispositions (out-of-scope MVP)
  allowedDispositions: ('scrap' | 'rework_extended' | 'deviation' | 'hold')[]
  defaultDisposition: 'scrap'
  scrapRequiresApproval: boolean
}
```

### 10.5 MVP simplification

In MVP, Recovery Flow is simplified:
- 3 attempts max (configurable)
- Outcomes limited to: rework_success or scrap
- No NCR generation (V2 with quality module)
- No deviation/hold/use_as_is (V2)
- No multi-tier approval (V2)

### 10.6 Scrap Compensation

When a piece is scrapped, the WO's remaining quantity automatically increases:

```
qtyRemaining = qtyTarget - qtyProduced - qtyDeviation + qtyScrap

Example:
  qtyTarget: 100
  qtyProduced: 80
  qtyScrap: 5
  qtyRemaining: 100 - 80 - 0 + 5 = 25 pieces

The operator must produce 25 more pieces (not 20!)
to compensate for the 5 scrapped.
```

This ensures the customer receives the requested quantity of OK pieces.

### 10.7 Recovery integration with Genealogy

Each recovery attempt is recorded in the part's genealogy:

```
SN-001239 history:
├── Cycle #39 leak test → NOK (6.8 bar)
├── Recovery attempt 1: hose check → NOK (6.7 bar)
├── Recovery attempt 2: O-ring replaced → OK (6.2 bar)
├── Final outcome: REWORK_SUCCESS
└── Root cause: O-ring wear (operator: Mario R.)
```

This data feeds:
- Quality analytics (recurring fault codes)
- Recall management (forward genealogy of reworked parts)
- Continuous improvement (root cause patterns)

---

## 11. Attention Points

### 11.1 Concept

Attention Points are **passive ambient visual reminders** displayed on shop floor HMI alongside step instructions. Operators see them while working but **do not need to interact** with them to proceed.

Think of them as digital post-it notes attached to a step: visible, present, but non-blocking.

### 11.2 What Attention Points are NOT

To clarify scope:
- ❌ Not popups requiring confirmation
- ❌ Not blocking modals
- ❌ Not EULA-style "I agree" dialogs
- ❌ Not interactive elements (no buttons, no checkboxes)
- ❌ Not subject to acknowledgment audit

### 11.3 What Attention Points ARE

- ✅ Static visual cards in side panel
- ✅ Categorized for color coding
- ✅ Reusable entities (one AP can be on multiple steps)
- ✅ Optional images/documents for visual support
- ✅ Manageable as first-class registry

### 11.4 Categories (5)

| Category | Italian | Visual | Use case |
|---|---|---|---|
| `safety` | Sicurezza | ⚠️ orange | "Disinnestare aria prima di rimuovere flangia" |
| `quality` | Qualità | 🎯 violet | "Verificare coppia 20 Nm ± 2 Nm" |
| `technical` | Tecnico | 🔧 blue | "Controllare allineamento sensore" |
| `regulatory` | Normativo | 📋 amber | "Compilare batch record entro fine turno" |
| `general` | Generale | 💡 gray | "Pulire l'area dopo l'uso" |

### 11.5 Display logic

During step execution, APs are displayed in a side panel:

```
┌────────────────────────────────────────────────────┐
│ DEVICE EXECUTION  •  Scan con Scanner Green        │
├────────────────────────────────────────────────────┤
│                                                    │
│ Instructions:                                      │
│ Position part on fixture and start scan            │
│                                                    │
│ [⚡ Start] (always enabled, no AP confirmation)    │
│                                                    │
│ ─── Side panel ────────────────────────────────    │
│                                                    │
│ ATTENTION POINTS                                   │
│ ┌────────────────────────────────────────────────┐ │
│ │ 🎯 Verificare coppia serraggio                 │ │
│ │ Coppia richiesta: 20 Nm ± 2 Nm                 │ │
│ │ [📷 image attached]                            │ │
│ └────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────┐ │
│ │ ⚠️ Disinnestare aria prima di rimuovere flangia│ │
│ └────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────┐ │
│ │ 📋 Indossare DPI: occhiali e guanti            │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 11.6 Responsive behavior

| Screen size | Display |
|---|---|
| Desktop HMI ≥1280px | Always-visible side panel (right) |
| Tablet 768-1280 | Collapsible panel or tabbed with instructions |
| Smaller | Bottom sheet expandable on demand |

### 11.7 Registry management

APs are first-class entities with:
- CRUD with list/card views
- Filter by category
- "Used in N steps" reverse lookup
- Bulk import/export
- Soft delete + restore
- i18n: title_en, description_en alongside Italian

### 11.8 No flow view

Unlike Equipment Hierarchy or Workflows, APs do not have a flow view. They are flat entities with no relationships beyond "used in steps".

---

## 12. Box Management

### 12.1 Concept

Boxes are tracked physical assets used to transport, contain, and ship products. The system manages boxes as **first-class entities** with full lifecycle, capacity validation, and traceability from packaging to customer delivery and (for returnables) back to inventory.

### 12.2 Two-level model

The system uses a **two-entity** approach:

**BoxType** (master/registry):
- Defines a category of box: dimensions, capacity, returnable flag, sealing requirements
- Reusable across multiple physical instances
- Examples: "Euro Pallet 80×120", "Plastic Crate 60×40", "Cardboard Mailer Small"

**Box** (physical instance):
- Individual physical box with unique ID
- Has current status, location, contents, lifecycle history
- Tracks cycles count for returnables
- Behaves as a tracked asset

### 12.3 Pallet handling

**Pallets are modeled as BoxType** with category `standard_pallet` or `half_pallet`. The same Box entity represents both small crates and pallets — the difference is in BoxType configuration.

This unification simplifies the model: one set of operations (pack, seal, ship) works for all box types.

For nested packaging (boxes on a pallet), the system uses `palletize_box` and `depalletize_box` actions with parent-child relationships in box content.

### 12.4 Capacity validation

Each BoxType defines:
- `maxUnits` — maximum number of items
- `maxWeightKg` — maximum total weight
- `internalVolumeL` — internal volume

**Validation rules**:
- **Hard block** for weight and volume — system prevents overload
- **Warning with override** for unit count — operator can confirm
- Validation runs at every `pack_into_box` action

### 12.5 Content tracking modes

Configurable per BoxType via `contentTrackingMode`:

| Mode | Behavior | Example |
|---|---|---|
| `serial` | Each item tracked by serial number | Boxed finished goods with serial |
| `quantity` | Quantity counted, no individual tracking | Bulk components |
| `mixed` | Per-item flexibility (serial OR quantity) | Mixed contents allowed |

Operator HMI adapts: serial mode requires scan, quantity mode allows numeric input.

### 12.6 Returnable box lifecycle

```
empty → partially_filled → full → sealed → shipped
                                              │
                                              ▼ (if returnable)
                                          returned
                                              │
                                              ▼ (if cleaningRequired)
                                         in_cleaning
                                              │
                                              ▼
                                            empty (cycles++)
```

**Cycle tracking**:
- `cyclesCount` increments on each return-to-empty
- `expectedLifecycles` from BoxType used to predict end-of-life
- `conditionScore` (0-100) decreases with cycles, recoverable on inspection
- When score below threshold or after expected cycles: flagged for inspection

### 12.7 Sealing system

**Per-BoxType configuration**:
- `requiresSeal: boolean` — does this type need sealing?
- `sealNumberFormat?` — pattern for seal numbers (regex)

**System behavior**:
- If `requiresSeal=true`, box transitions `full → sealed` requires seal number
- Seal number can be:
  - **Auto-generated** by system (sequential, format `SEAL-{year}-{seq}`)
  - **Manually entered** by operator (scanned from physical seal)
- Once sealed, contents are immutable: opening requires explicit `open_sealed_box` action with reason
- Seal break is audited (who, when, why)

### 12.8 Asset management

Boxes are tracked as aziendal assets:

**Per-Box financial fields**:
- `unitCostEur` — purchase cost (from BoxType)
- `cyclesCount` — current usage
- `expectedLifecycles` — expected total uses
- Computed: residual value = unitCost × (1 - cyclesCount / expectedLifecycles)

**Per-Box physical condition**:
- `conditionScore: 0-100` — visual/functional state
- `lastInspectionAt` — when last checked
- `nextInspectionDueAt` — when due (configurable interval per type)
- `damaged` status — flagged out of service

### 12.9 Operations on Box

The HMI supports these box-specific step actions:

| Action | Description | Validation |
|---|---|---|
| `select_empty_box` | Operator scans/selects available empty box | Box must be `empty` status |
| `pack_into_box` | Add item to box | Capacity check, status must be empty/partially_filled |
| `unpack_from_box` | Remove item | Status must allow unpack (not sealed) |
| `validate_box_capacity` | Check if more items fit | Returns remaining capacity |
| `seal_box` | Seal the box | Generate or scan seal number |
| `open_sealed_box` | Break seal (audited) | Requires reason |
| `palletize_box` | Place box on pallet | Pallet capacity check |
| `depalletize_box` | Remove from pallet | — |
| `inspect_box` | Inspect returned box | Updates condition score |
| `clean_box` | Mark cleaning done | Status `in_cleaning → empty` |
| `print_box_label` | Print physical label | — |

### 12.10 Auto-generation: Box Packaging rule

A new auto-generation rule (rule #7) is added:

| # | Rule | Trigger | Generates |
|---|---|---|---|
| 7 | **Box Packaging** | Phase `outbound` + item has `boxingRequired=true` | Group `packaging` with steps: select_empty_box, pack_into_box (per piece), validate_box_capacity, seal_box, print_box_label |

The rule analyzes:
- Item's `defaultBoxTypeId` (preferred BoxType)
- Item's `boxingRequired` flag
- Quantity to box per cycle (1 piece per cycle by default)

### 12.11 Genealogy integration

When a piece is packed into a box:
- BoxContent record created
- Forward genealogy: SN-001239 → BOX-EUR80-00042 → CUSTOMER X
- Backward genealogy: from box ID, retrieve all serials inside
- Used for recall management: "all serials in shipped box BOX-X"

### 12.12 Real-time events

```
'box.created'              new box instance registered
'box.statusChanged'        any status transition
'box.packed'               item added to box
'box.unpacked'             item removed from box
'box.sealed'               box sealed
'box.shipped'              box shipped to customer
'box.returned'             returnable box received back
'box.damaged'              box flagged damaged
'box.inspected'            inspection completed
'boxType.created'          new type defined
'boxType.updated'          type modified
```

### 12.13 KPI for Box Management

| KPI | Formula | Purpose |
|---|---|---|
| Box utilization | `currentUnits / maxUnits × 100` | Fill efficiency |
| Average fill rate per type | `avg(fillPercentage)` per BoxType | Type efficiency |
| Box turnaround time | `avg(returnedAt - shippedAt)` for returnables | Returnable cycle speed |
| Average cycle count | `avg(cyclesCount)` per BoxType | Asset utilization |
| Damaged box rate | `damaged / total` per period | Asset durability |
| Boxing time per piece | `avg(time in pack_into_box steps)` | Operator efficiency |
| Available boxes | `count(status='empty')` per type per location | Inventory visibility |
| End-of-life prediction | `cyclesCount / expectedLifecycles × 100` | Replacement planning |

### 12.14 Domain model

**BoxType entity**:
```
- id, code, name, description
- category (standard_pallet, plastic_crate, ...)
- dimensions (lengthMm, widthMm, heightMm)
- maxUnits, maxWeightKg, internalVolumeL
- isReturnable, expectedLifecycles, cleaningRequired
- inspectionFrequencyDays
- requiresSeal, sealNumberFormat
- contentTrackingMode (serial | quantity | mixed)
- unitCostEur
- imageUrl, imageThumbUrl
- standard audit fields
```

**Box entity (instance)**:
```
- id, code, serialNumber
- typeId (FK BoxType)
- status (empty, partially_filled, ...)
- currentLocationId, currentLocationType
- currentUnits, currentWeightKg, fillPercentage (computed)
- cyclesCount
- lastInspectionAt, nextInspectionDueAt, conditionScore
- isSealed, sealNumber, sealedAt, sealedBy
- currentWorkOrderId, destinationCustomerId
- imageUrl
- standard audit fields
```

**BoxContent entity**:
```
- id, boxId
- itemId, serialNumber?, lotNumber?, quantity
- addedAt, addedBy, removedAt?, removedBy?
- validatedScan
```

**BoxMovement entity**:
```
- id, boxId
- fromLocationId, toLocationId
- movementType (pack, ship, ...)
- workOrderId?, movedBy, movedAt
- notes
```

### 12.15 Cross-references

- Box operations integrate with Movement Steps (section 5.3)
- BoxType is anagrafica/registry (section 13 patterns)
- Auto-generation Box Packaging rule (section 8.3, rule #7)
- HMI box operations (Universal Patterns section 14)
- Box KPIs in dashboards (section 16)

---

## 13. Real-time Synchronization

### 12.1 Architecture

The application implements **end-to-end real-time synchronization**: any data mutation propagates instantly to all connected clients without manual refresh.

```
┌──────────┐                  ┌──────────┐                ┌──────────┐
│ Client 1 │ ←─── update ──── │   API    │ ←─── action ── │ Client 2 │
└──────────┘                  └──────────┘                └──────────┘
     ↑                              │
     │                              │ emit event
     │                              ▼
     │                        ┌──────────┐
     │                        │ Socket   │ ──→ broadcast
     │                        │ Gateway  │
     └─────── invalidate ─────└──────────┘
              cache + refetch
```

### 12.2 Event-driven flow

When entity X is mutated:

1. Backend service performs DB transaction
2. Service emits domain event (`item.created`, `workOrder.statusChanged`)
3. WebSocket gateway broadcasts to subscribed clients in relevant rooms
4. Frontend Query client invalidates affected cache keys
5. Active queries automatically refetch
6. UI re-renders with new data

### 12.3 Subscription model (rooms)

Clients join rooms based on context:

| Room pattern | Purpose |
|---|---|
| `plant:{plantId}` | Plant-wide events |
| `workOrder:{woId}` | Specific WO events |
| `entity:{type}` | Registry-level events (all items, all routes) |
| `dashboard:{role}` | Role-specific dashboard updates |
| `hmi:{workCenterId}` | HMI-specific events |
| `user:{userId}` | User-specific notifications |

Server broadcasts only to relevant rooms (no over-fetching).

### 12.4 Cache invalidation map (declarative)

A central map declares which mutations invalidate which queries:

```typescript
const invalidationMap = {
  'item.created': [
    'items.list', 
    'bom.dropdowns', 
    'routes.dropdowns'
  ],
  'item.updated': [
    'items.list', 
    'items.detail', 
    'bom.using-item'
  ],
  'workOrder.statusChanged': [
    'workOrders.list', 
    'dashboard.kpi', 
    'andon'
  ],
  'workOrder.released': [
    'workOrders.list', 
    'serials.allocated', 
    'reservations.list'
  ],
  'step.completed': [
    'workOrder.progress', 
    'dashboard.kpi'
  ],
  // ... ~40 events total
}
```

This map is the **single source of truth** for invalidation logic, used both by backend (which events to emit) and frontend (which queries to invalidate).

### 12.5 Optimistic updates

For frequent operations (toggle, like, status change), UI updates immediately:

```typescript
// Pseudo-code
const mutation = useMutation({
  mutationFn: updateStatus,
  onMutate: async (newStatus) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['items'])
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['items'])
    
    // Optimistically update
    queryClient.setQueryData(['items'], old => 
      old.map(i => i.id === id ? { ...i, status: newStatus } : i)
    )
    
    return { previous }
  },
  onError: (err, vars, context) => {
    // Rollback on error
    queryClient.setQueryData(['items'], context.previous)
    toast.error('Update failed')
  },
  onSettled: () => {
    queryClient.invalidateQueries(['items'])
  }
})
```

### 12.6 Conflict resolution

| Scenario | Strategy |
|---|---|
| Last-write-wins | Default for non-critical updates |
| Optimistic locking | Version column for critical entities (WO, Recipe) |
| Operational transformation | V2 for collaborative canvas editing |
| Conflict UI | Show diff to user, ask resolution |

### 12.7 Reliability

- **Heartbeat ping** every 30s
- **Reconnection logic** on network drop with exponential backoff
- **Event replay** on reconnect (events emitted during disconnection delivered)
- **Fallback to polling** if WebSocket unavailable
- **"Working offline" mode** with queued mutations (PWA pattern)

### 12.8 Visual indicators

User-facing connection status:

| State | Visual |
|---|---|
| Connected | Green dot, "Live" with pulse animation |
| Reconnecting | Yellow dot, "Reconnecting..." |
| Offline | Gray dot, "Working offline" |
| Sync pending | Spinner with "Syncing N changes..." |

---

## 14. Universal UX Patterns

The system uses **6 universal patterns** applied consistently across all features. These are the cornerstones of UX consistency.

### 14.1 Universal Entity Image

**Every domain entity has an associated image**, always.

Applied to: Item, BOM, Route, Workflow, Equipment, Workstation, Skill, Recipe, Operator, Tool, Cause Code, Step Template, Work Order, AttentionPoint.

**Lifecycle**:
1. On creation: user can upload, or system auto-generates default
2. Auto-generation strategy: icon (Lucide) on colored background (deterministic from entity ID hash)
3. On display: lazy-loaded with blur-up placeholder
4. Variants: thumb (200x200), card (400x400), hero (800x800)
5. Editable: replace image action available where entity shown

**Component**: `<EntityImage>` reusable across the app.

**Storage**: S3-compatible (MinIO dev, R2/S3 prod) with CDN-ready URLs.

### 14.2 Universal View Switcher

Toggle between visualizations of any registry: list, card, flow, gantt.

**Per-page configuration**:

| Registry | Available views | Default |
|---|---|---|
| Equipment Hierarchy | list, card, **flow** | flow |
| Workflows | list, card, **flow** | flow |
| BOM | list, **flow** | flow |
| Routes | list, card, **flow** | list |
| Items | list, card | card |
| Operators | list, card | card |
| Recipes | list, card | list |
| Skills | list, card | list |
| Cause codes | list | list |
| Tools | list, card | card |
| Work Orders | list, card | list |
| Attention Points | list, card | card |

User preference persisted per registry in localStorage.

**Component**: `<ViewSwitcher>` with availableViews prop declaration.

### 14.3 Universal Canvas / Flow Editor

When flow view is enabled, uses **React Flow (xyflow) v12 + dagre** for layout.

**Adapter pattern**: a single `<CanvasView>` component renders any entity via entity-specific adapters:

- `EquipmentHierarchyAdapter` — ISA-95 5-level tree
- `WorkflowAdapter` — Phase > Group > Step with branches
- `BOMAdapter` — Multi-level component tree
- `RouteAdapter` — Sequential phases (subset of workflow)

**Modes**:
- `editable`: full drag-drop, edit, delete (default for config entities)
- `readonly`: pan/zoom only, click for detail (genealogy, history)

**Required UX**:
- Toolbar with zoom, fit, layout, undo/redo, save
- Side panels: left palette (drag from), right properties (when selected)
- Validation feedback: red borders, error tooltips, issues panel
- Keyboard shortcuts: ⌘Z undo, Delete, ⌘S save, Space+drag pan
- Mini-map for navigation
- Custom node types per entity with EntityImage display

### 14.4 Universal 4-Pane Configurator

For complex creation flows (steps, workflows, recipes, BOM, equipment), use the same 4-pane layout:

```
┌──────────────┬────────────┬───────────────┬─────────────┐
│ WIZARD STEPS │ RESOURCE   │ CONFIGURATION │ LIVE        │
│ (vertical    │ PALETTE    │ CENTER        │ PREVIEW     │
│  stepper)    │            │               │             │
│              │            │               │             │
│ ✓ Category   │ [Search]   │ [Tabs]        │ States      │
│ ✓ Name       │ [Filters]  │ Main/Pre/...  │ panel       │
│ ✓ Config     │            │               │             │
│ ▶ Steps      │ Resources  │ Form fields   │ HMI mock    │
│ ○ Summary    │ by category│ ...           │ preview     │
│              │            │               │             │
│   ~180px     │   ~280px   │   flexible    │   ~340px    │
└──────────────┴────────────┴───────────────┴─────────────┘
```

**Component**: `<FourPaneConfigurator>` with adapters for each zone.

**Responsive**:
- ≥1280px: full 4-pane
- 1024-1280: Live Preview becomes floating drawer
- <1024px: stacked with tabs

### 14.5 Universal Live Preview (state-driven)

In Configuration Center's Live Preview, render the step **exactly as operators will see it on HMI** in all 11 possible states.

**State chip groups**:
- FLUSSO OK: idle, ready, in_progress, paused, complete, retry
- FLUSSO KO: error, failed, warning, timeout, offline

**Behavior**:
- Click state chip: preview transitions to that state
- Click action buttons in preview: simulates state changes
- Real-time update: any form change reflects in preview within 150ms
- Mock data engine generates realistic mock values per state
- Smooth transitions between states (200-300ms)

**Component**: `<StepLivePreview>` with state machine internal.

Mock data must be **deterministic** (reproducible from step config), not random.

### 14.6 Universal Multi-Level Timer & Status Bar

Persistent HMI element tracking time at THREE levels:

| Level | Magnitude | Example |
|---|---|---|
| **Work Order** | hours/days | "Produrre 100 pezzi" — 4:32 / 8:00 — 47% |
| **Phase** | minutes/hours | "Leak Test" — 1:15:42 / 2:05:00 — 62% |
| **Part** | seconds/minutes | "Cycle SN-001270" — 28s / 45s — 62% |

Each level shows:
- Visual progress bar with status color
- Actual elapsed / Planned duration (tabular nums)
- Status badge (on_track, at_risk, delayed, ahead, paused, completed)
- ETA (estimated time of arrival, recomputed on every part completion)

**Three layouts**:
- `full` (HMI desktop): all 3 levels stacked, sticky top bar
- `compact` (tablet): condensed single line per level
- `minimal` (floating widget): part level only, draggable

**Component**: `<TimerStatusBar>` with composable parts (`<TimerLevel>`, `<ProgressBar>`, `<StatusBadge>`, `<ETAIndicator>`).

---

## 15. Permissions Matrix

| Resource | Admin | Planner | Supervisor | Operator | Quality | Viewer |
|----------|-------|---------|------------|----------|---------|--------|
| Items | CRUD | CRUD | R | R | R | R |
| BOM | CRUD | CRUD | R | R | R | R |
| Workflows | CRUD | CRUD | R | R | R | R |
| Recipes | CRUD | R | R | R | CRUD | R |
| Equipment | CRUD | R | R | R | R | R |
| Operators | CRUD | R | RU | R-self | R | R |
| Skills | CRUD | R | R | R-self | R | R |
| Cause Codes | CRUD | R | R | R | CRUD | R |
| Attention Points | CRUD | CRU | R | R | CRUD | R |
| Tools | CRUD | R | RU | R | R | R |
| Auto-Gen Rules | CRUD | R | R | R | R | R |
| **BoxTypes** | CRUD | CRUD | R | R | R | R |
| **Boxes** (instances) | CRUD | R | RU | R+pack/unpack/seal | RU+inspect | R |
| **BoxMovements** | R | R | R | C-self | R | R |
| **WO Assignments** (v1.2) | CRUD | CRUD | CRUD | R-own + accept/start | R | R |
| **Dispatch List** (v1.2) | R | R | R | R-own | R | R |
| **Shifts** (v1.2) | CRUD | CRUD | RU | R | R | R |
| **Shift Assignments** (v1.2) | CRUD | CRUD | RU | R-own | R | R |
| **Maintenance Orders** (v1.2) | CRUD | R | CRUD | R+execute | R | R |
| **Maintenance Logs** (v1.2) | R | R | R | C+R-own | R | R |
| **Tool Wear Records** (v1.2) | CRUD | R | RU | R | CRUD | R |
| **Samples** (v1.2) | CRUD | R | RU | C-self | CRUD | R |
| **FAI Records** (v1.2) | R | R | RU+approve | C-self | CRUD | R |
| **WIP Containers** (v1.2) | CRUD | R | RU | RU | R | R |
| **Subassemblies** (v1.2) | CRUD | CRUD | R | R+execute | R | R |
| **Lot Holds** (v1.2) | CRUD | R | CRUD | R | CRUD+release | R |
| **Molds** (v1.2 CFRP) | CRUD | R | RU | R+use | RU+inspect | R |
| **Prepreg Out-time Records** (v1.2 CFRP) | R | R | RU | C-self | CRUD | R |
| **Cure Cycle Records** (v1.2 CFRP) | R | R | R | C-self | CRUD | R |
| **NDT Results** (v1.2 CFRP) | R | R | R | R | CRUD | R |
| **Reflectance Tests** (v1.2 Safety) | R | R | RU | C-self | CRUD | R |
| **Homologation Certificates** (v1.2 Safety) | CRUD | R | R | R | CRUD | R |
| **Aging Test Specimens** (v1.2 Safety) | CRUD | R | RU | C-self | CRUD | R |
| Work Orders | CRUD | CRUD | RU+release | R+execute | R | R |
| Step Execution | — | — | RU | CRUD-self | R | R |
| Lots | CRUD | R | RU | R | CRUD | R |
| Serials | CRUD | R | R | R+update_status | CRUD | R |
| Downtime | — | R | CRUD | CRUD-self | R | R |
| QC Records | — | — | R | CRUD-self | CRUD | R |
| Scrap Records | — | — | R | CRUD-self | CRUD | R |
| Reports | R | R | R | R-personal | R | R |
| Settings | CRUD | R | R | R-self | R | — |
| Audit Log | R | R-own | R | — | R | — |

**Legend**:
- C = Create
- R = Read
- U = Update
- D = Delete (soft)
- `-self` = own records only
- `-personal` = personal scope

**Notes**:
- Multi-role: users can have multiple roles, permissions are union
- Override skills check: requires SUPERVISOR + audit
- Recipe approval: requires QUALITY (separation of duties from author)
- Critical AP creation: requires QUALITY

---

## 16. KPI & Metrics

### 16.1 OEE (Overall Equipment Effectiveness)

```
OEE = Availability × Performance × Quality

Where:
  Availability = run_time / planned_production_time
                 (excludes scheduled maintenance, not scheduled)
                 
  Performance = (ideal_cycle_time × total_count) / run_time
                (or: actual_count / theoretical_count_at_full_speed)
                
  Quality = good_count / total_count
            (good = OK + rework_success; total = good + scrap)
```

**Target benchmarks** (industry standard):
- World-class: OEE ≥ 85%
- Typical: 60-85%
- Below 60%: improvement needed

### 16.2 Six Big Losses (ISA-95)

Categorize every minute of downtime/loss:

| Category | Affects | Definition |
|---|---|---|
| Breakdowns | Availability | Unplanned equipment failure |
| Setup/Adjustments | Availability | Changeovers, format changes |
| Idling/Minor stops | Performance | Stops < 5 minutes |
| Reduced speed | Performance | Running below nominal |
| Defects in process | Quality | Scrap during steady-state |
| Startup loss | Quality | Defects during startup |

### 16.3 Cycle Time KPIs

| KPI | Formula | Insight |
|---|---|---|
| Planned cycle time | from workflow definition | Target |
| Actual cycle time avg | sum(actual_cycles) / count | Real performance |
| Cycle time variance | (actual - planned) / planned × 100 | Deviation % |
| Trend (rolling 10 parts) | improving / stable / degrading | Direction |
| Fastest / Slowest | min / max | Range |

### 16.4 Production KPIs

| KPI | Formula |
|---|---|
| Throughput | parts_completed / hour |
| First Pass Yield (FPY) | (total - rework - scrap) / total |
| Scrap Rate | qty_scrap / total_produced × 100 |
| Rework Rate | qty_rework / total_produced × 100 |
| WIP (Work In Progress) | parts in production phases |
| Touch Time | sum(manual_step_time) |
| Value-Add Ratio | production_time / total_cycle_time |

### 16.5 Logistics KPIs

| KPI | Formula |
|---|---|
| Movement waste | sum(logistics_step_time) |
| Distance traveled | sum(movement_distance) |
| Scan accuracy | successful_scans / total_scans |
| WIP turnover | avg_time_in_wip |

### 16.6 Parallel utilization KPIs

| KPI | Formula |
|---|---|
| Parallel utilization | sum(parallel_actual) / device_actual |
| Parallel skip rate | count(skipped_parallel) / count(total_parallel) |
| Operator idle during device | device_time - sum(parallel_actual) |
| Delay post device | avg(post_start - device_complete) |

### 16.7 Operator KPIs

| KPI | Formula |
|---|---|
| Productivity | parts_produced / shift_hours |
| Quality score | (FPY by operator) |
| Cycle time vs standard | (actual - standard) / standard |
| Skills utilization | skills_used / skills_available |

### 16.8 Recovery KPIs

| KPI | Formula |
|---|---|
| Recovery success rate | rework_success / (rework_success + scrap_after_recovery) |
| Avg recovery attempts | sum(attempts_per_recovery) / count |
| Top fault codes | Pareto by count |

### 16.9 Box Management KPIs (NEW v1.1)

| KPI | Formula | Purpose |
|---|---|---|
| Box utilization | currentUnits / maxUnits × 100 | Fill efficiency per box |
| Average fill rate | avg(fillPercentage) per BoxType | Type-level efficiency |
| Box turnaround time | avg(returnedAt - shippedAt) for returnables | Returnable cycle speed |
| Average cycle count | avg(cyclesCount) per BoxType | Asset utilization |
| Damaged box rate | damaged / total per period | Asset durability |
| Boxing time per piece | avg(time in pack_into_box steps) | Operator efficiency |
| Available boxes | count(status='empty') per type/location | Inventory visibility |
| End-of-life prediction | cyclesCount / expectedLifecycles × 100 | Replacement planning |
| Seal break rate | open_sealed_box events / total seals | Audit/security indicator |

### 16.10 Production day boundaries

Production day is configurable per plant (default: 06:00-06:00 next day). All KPIs calculated within production day boundaries, not calendar day. Cross-midnight shifts handled correctly.

---

## 17. API Contract Overview

### 17.1 REST conventions

```
GET    /api/v1/{resource}              List with pagination
POST   /api/v1/{resource}              Create
GET    /api/v1/{resource}/{id}         Detail
PATCH  /api/v1/{resource}/{id}         Partial update
PUT    /api/v1/{resource}/{id}         Full replace (rare)
DELETE /api/v1/{resource}/{id}         Soft delete
POST   /api/v1/{resource}/{id}/{action}  Custom actions
```

**Examples**:
```
GET    /api/v1/work-orders?status=in_progress&plant=BO
POST   /api/v1/work-orders/{id}/release
POST   /api/v1/work-orders/{id}/cancel
POST   /api/v1/recipes/{id}/approve
POST   /api/v1/steps/{id}/duplicate
GET    /api/v1/equipment-hierarchy?level=work_center
```

### 17.2 Query parameters

```
?page=1&pageSize=20             pagination
?cursor=abc&pageSize=20         cursor-based (preferred)
?sort=createdAt:desc            sorting (multi: sort=field1:asc,field2:desc)
?filter[status]=active          filtering
?include=phases,groups          eager loading
?fields=id,name,status          field selection
?search=foo                     full-text search
?view=list                      view hint for client
```

### 17.3 Response format

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 142,
    "totalPages": 8,
    "cursor": {
      "next": "eyJpZCI6IjEyMyJ9",
      "prev": null
    }
  },
  "links": {
    "self": "/api/v1/items?page=1",
    "next": "/api/v1/items?page=2",
    "prev": null
  }
}
```

### 17.4 Error format (RFC 7807)

```json
{
  "type": "https://errors.mes.app/wo-not-releasable",
  "title": "Work Order cannot be released",
  "status": 422,
  "detail": "Skills coverage incomplete",
  "code": "WO_NOT_RELEASABLE_SKILLS_MISSING",
  "errors": [
    { 
      "field": "operators[0]", 
      "rule": "skill_required", 
      "value": "QC",
      "message": "Operator does not have required skill: QC"
    }
  ],
  "instance": "/api/v1/work-orders/abc-123",
  "traceId": "00-abc123def456-789012-01"
}
```

### 17.5 Versioning

- Path-based: `/api/v1/`, `/api/v2/`
- Backward compatibility maintained within major version
- Deprecation announced via headers and response metadata
- Breaking changes only in new major version

### 17.6 Rate limiting

- Per-user: 1000 req/min
- Per-IP unauthenticated: 100 req/min
- Per-API-key: configurable
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### 17.7 Authentication

- JWT bearer tokens
- Refresh tokens via secure HTTP-only cookies
- Short-lived access tokens (15 min)
- Long-lived refresh tokens (7 days)
- API keys for integrations (scoped, revocable)

---

## 18. Business Code Naming

Standard patterns for business codes generated by the system:

| Entity | Pattern | Example |
|---|---|---|
| Item | `ITM-{type}-{seq}` | `ITM-FG-00042` |
| Lot | `LOT-{date}-{seq}` | `LOT-260415-001` |
| Serial | `SN-{year}-{seq}` | `SN-2026-000142` |
| Work Order | `WO-{year}-{seq}` | `WO-2026-0142` |
| Recipe | `RCP-{category}-{seq}` | `RCP-LEAK-001` |
| Workflow | `WF-{seq}` | `WF-0042` |
| Equipment | `{type}-{location}-{seq}` | `DEV-WC1-001` |
| Cause code | `{category}-{seq}` | `DT-BD-001` |
| Step | `STP-{group}-{seq}` | `STP-DEV-SCN-002` |
| Tool | `TOOL-{type}-{seq}` | `TOOL-WRENCH-001` |
| Attention Point | `AP-{category}-{seq}` | `AP-SAFETY-042` |
| **BoxType** | `BTYPE-{category}-{seq}` | `BTYPE-PLT-001` |
| **Box (instance)** | `BOX-{type-suffix}-{seq}` | `BOX-PLT-001234` |
| **Seal** | `SEAL-{year}-{seq}` | `SEAL-2026-00042` |
| **WO Assignment** (v1.2) | `WOA-{wo-suffix}-{seq}` | `WOA-2026-0142-01` |
| **Shift** (v1.2) | `SHIFT-{type}` | `SHIFT-MORNING` |
| **Maintenance Order** (v1.2) | `MNT-{year}-{seq}` | `MNT-2026-0042` |
| **Sample** (v1.2) | `SMP-{wo-suffix}-{seq}` | `SMP-2026-0142-01` |
| **FAI Record** (v1.2) | `FAI-{year}-{seq}` | `FAI-2026-0042` |
| **WIP Container** (v1.2) | `WIP-{location}-{seq}` | `WIP-WC1-001` |
| **Subassembly** (v1.2) | `SUB-{item-suffix}-{seq}` | `SUB-RACC-001` |
| **Lot Hold** (v1.2) | `HOLD-{lot-suffix}-{seq}` | `HOLD-260415-001-A` |
| **Mold** (v1.2 CFRP) | `MOLD-{type}-{seq}` | `MOLD-CARENA-001` |
| **Prepreg Roll** (v1.2 CFRP) | `PREPREG-{material}-{seq}` | `PREPREG-CF-T700-001` |
| **Cure Cycle Run** (v1.2 CFRP) | `CCR-{year}-{seq}` | `CCR-2026-0042` |
| **NDT Result** (v1.2 CFRP) | `NDT-{type}-{seq}` | `NDT-UT-2026-0042` |
| **Reflectance Test** (v1.2 Safety) | `RFT-{year}-{seq}` | `RFT-2026-0042` |
| **Homologation Cert** (v1.2 Safety) | `ECE-{number}-{year}` | `ECE-104R-001234-2026` |
| **Aging Specimen** (v1.2 Safety) | `AGE-{type}-{seq}` | `AGE-QUV-2026-0042` |

Sequences are plant-scoped and zero-padded for sortability.

---

## 19. Multi-tenancy & Multi-plant

### 19.1 Strategy

**Single database, row-level isolation** via `plant_id` column on all transactional entities.

### 19.2 Plant scope

| Entity | Plant-scoped? | Notes |
|---|---|---|
| Work Order | ✅ Always | Transactional |
| Operator | ✅ Always | Plant-specific employees |
| Equipment | ✅ Always | Physical assets |
| Lot, Serial | ✅ Always | Material instances |
| Workflow | ✅ Always | Plant-specific procedures |
| Recipe | ⚠️ Optional | Can be global or plant |
| Item | ⚠️ Optional | Catalog can be shared |
| Skill | ✅ Always | Plant-specific certifications |
| User | ✅ Multi-plant | User can access multiple plants |
| Role | 🌐 Global | Role definitions universal |
| UoM | 🌐 Global | Standard units |

### 19.3 Row Level Security (PostgreSQL)

```sql
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON work_orders
  USING (plant_id = current_setting('app.current_plant_id')::UUID);
```

The application sets `app.current_plant_id` per request context.

### 19.4 MVP scope

In MVP: **single-plant deployment** with `plant_id` infrastructure ready. Multi-plant UI (plant selector, cross-plant analytics) deferred to V2.

---

## 20. Internationalization

### 20.1 Supported locales

MVP: **Italian (default), English**.

Future: configurable per deployment.

### 20.2 UI strings

- Stored in `/messages/{locale}.json`
- Namespaced per module: common, workOrder, hmi, dashboard, errors
- Pluralization via ICU MessageFormat
- Server-side translation via next-intl for SSR/SEO

### 20.3 Database content

For entities with translatable content, store both:
- `field_it` (default)
- `field_en` (English)

Applied to:
- Cause Codes (label, description)
- Attention Points (title, description)
- Items (description)
- Skills (label)
- Step instructions

Fallback to default locale if translation missing.

### 20.4 Date/number formatting

- Dates stored as UTC `TIMESTAMPTZ`
- Display formatted per user locale via `Intl.DateTimeFormat`
- Use `date-fns-tz` for timezone-aware operations
- Italian format: DD/MM/YYYY HH:mm
- English format: MM/DD/YYYY hh:mm a

### 20.5 Currency

- Stored with ISO 4217 code (EUR, USD)
- Displayed via `Intl.NumberFormat` per locale

---

## 21. Out-of-Scope MVP / V2 Roadmap

### 21.1 Features explicitly out-of-scope for MVP

These features are recognized as valuable but deferred to V2:

**Quality Module**:
- NCR (Non-Conformance Report) workflow
- Deviation/Hold/Use-as-is dispositions
- SPC (Statistical Process Control) charts
- First Article Inspection (FAI) reports
- 21 CFR Part 11 electronic signatures

**Production**:
- Schedulazione finita with Gantt drag-drop
- What-if simulation
- Calibration tracking module
- Custom report builder
- Multi-tier approval workflows

**Integration**:
- IIoT real connectors (OPC UA, MQTT, Modbus)
- ERP bidirectional sync (SAP, Odoo)
- WMS integration
- Email/SMS/Teams notifications
- Voice notes, OCR documents

**Collaboration**:
- Real-time multi-user editing on canvas (Yjs/Liveblocks)
- Comments threads with mentions
- Video annotations

**Advanced UX**:
- BOM and Route in flow editable (only Equipment + Workflow in MVP)
- Recipe and Skills in flow view
- Custom dashboard builder (drag-drop widgets)
- Mobile back-office (currently desktop-primary)

**Operability**:
- White-label branding
- Multi-plant active UI
- Multi-timezone support
- Profili Setup multipli (full/quick/minimal)
- UI for configuring new auto-gen rules

**Recurring Tasks**:
- Architecture ready, full UI in V2

### 21.2 Architectural decisions enabling V2

Even though V2 features are not implemented, the MVP architecture supports them:

- Multi-plant: `plant_id` column ready
- IIoT: device service interface abstracted (mock implementation, real swappable)
- NCR: schema extensions planned
- Real-time collab: Socket.IO infrastructure ready
- White-label: CSS variables ready, theming pattern in place
- i18n: full architecture from day one
- Auto-gen rules: rule engine extensible

### 21.3 Decision criteria

Features considered for V2 inclusion based on:
1. Business demand (user requests post-MVP)
2. Compliance requirements (regulated industries)
3. Integration needs (specific customer ERP)
4. Performance/scale issues observed in production
5. Foundational for further capabilities

---

## 22. Extensions (modular specifications)

Starting from v1.2, the MES specification is **modular**. The core MASTER_SPECIFICATION (this document) defines the foundation, while detailed sub-domain specifications live in separate files under `docs/extensions/`.

### 22.1 Why modular?

As the system grows, single-file specifications become unwieldy. Modular extensions provide:

- **Separation of concerns**: each extension covers a focused domain
- **Independent evolution**: extensions can be updated without touching core
- **Targeted review**: stakeholders read only relevant extensions
- **Scalability**: new domains added as new extension files
- **Single source of truth per area**: no duplicate definitions

### 22.2 Extensions structure

```
docs/
├── MASTER_SPECIFICATION.md       (this file — core)
├── BEST_PRACTICES.md
├── CONVENTIONS.md
└── extensions/
    │
    │ === MVP v1.2 (full Reflexallen coverage) ===
    │
    ├── EQUIPMENT_MANAGEMENT.md       (Equipment lifecycle, maintenance, tool wear)
    ├── SCHEDULING_ASSIGNMENT.md      (WO assignment, dispatch, shifts)
    ├── INDUSTRIAL_OPERATIONS.md      (Multi-output, continuous, sample, FAI, WIP)
    │
    │ === Line-specific modules (Reflexallen lines) ===
    │
    ├── CFRP_MODULE.md                 (Composites: out-time, mold, autoclave, NDT)
    ├── SAFETY_DEVICES_MODULE.md       (Reflective devices: ECE-104, riflettanza, lamination)
    │
    │ === Workflow references (seed data + operational examples) ===
    │
    ├── WORKFLOW_PNEUMATIC_AIR.md     (Reflexallen Pneumatic Air production)
    ├── WORKFLOW_CFRP.md               (Reflexallen CFRP carene moto)
    └── WORKFLOW_SAFETY_DEVICES.md     (Reflexallen ECE-104 panels)
```

Future extensions (V2):

```
    ├── NCR_QUALITY_MODULE.md           (V2 — Non-conformance, deviation management)
    ├── IIoT_TELEMETRY.md               (V2 — Real device connectors OPC UA, MQTT)
    ├── ADVANCED_SCHEDULING.md          (V2 — Gantt, MRP, capacity planning)
    ├── COMPLIANCE_PHARMA.md            (V2 — 21 CFR Part 11, electronic signatures)
    ├── FLUID_POWER_MODULE.md           (V2 — Reflexallen Fluid Power line)
    └── DIGITAL_ELECTRICAL_MODULE.md    (V2 — Reflexallen Digital Electrical line)
```

### 22.3 Extension scope

Each extension follows this structure:

1. **Concept** — what problem it solves
2. **Domain model** — entities, relationships, schema
3. **State machines** (if applicable)
4. **Business rules** — logic and validations
5. **API endpoints** — relevant routes
6. **UI patterns** — components and flows
7. **KPIs** — metrics specific to this domain
8. **Integration points** — how it connects to core

### 22.4 v1.2 extensions overview

#### EQUIPMENT_MANAGEMENT.md
Covers:
- Equipment State Machine (formal XState)
- Maintenance Order entity + lifecycle
- MaintenanceLog (history)
- Tool Wear Tracking (cycles count, condition, replacement)
- Tool Changeover formal procedure
- Equipment-specific OEE breakdown

Status: **MVP** (basics included).

#### SCHEDULING_ASSIGNMENT.md
Covers:
- WorkOrderAssignment entity
- Dispatch list operator (HMI integration)
- Skills coverage automatic check
- Reassignment workflow (planner UI)
- Shift entity + ShiftAssignment
- Shift handover procedure

Status: **MVP** (advanced scheduling like Gantt is V2).

#### INDUSTRIAL_OPERATIONS.md
Covers:
- Multi-output cycles (1 cycle → N pieces)
- Continuous production mode (extrusion)
- Sample taking workflow
- First Article Inspection (FAI) formal procedure
- Containerized WIP (kanban bins, trolleys)
- Subassembly + nested BOM
- Quality Hold / Release workflow
- Material consumption non-discrete (granuli, liquids)

Status: **MVP** (essential for automotive Tier 1 production).

#### CFRP_MODULE.md
Covers Reflexallen Compositi line specifics:
- **Prepreg out-time tracking** (cumulative, with multi-state: frozen/refrigerated/opened)
- **Mold management** (mold as tracked asset, cycle count, refurbishment)
- **Autoclave cure cycles** (long-running 4-8 hours, multi-sensor telemetry)
- **NDT (Non-Destructive Testing)** integration: ultrasonic C-scan, dimensional with CMM
- **Vacuum bagging quality control** (test tenuta sacco)
- **Material conditioning** periods (rinvenimento prepreg)
- Cure cycle file archive per lot
- **Hand lay-up tracking** (per ply: operator, orientation, timestamp)

Equipment specifics: autoclave, CNC plotter taglio prepreg, vacuum systems, UT scanner.

Status: **MVP** (full Reflexallen coverage).

#### SAFETY_DEVICES_MODULE.md
Covers Reflexallen Safety Devices line specifics:
- **Riflettanza measurement** (retroriflettometro integration)
- **Colorimetry** (spettrofotometro CIE-Lab)
- **ECE-R104 homologation** management:
  - Marking generation (E + country + 104R + number)
  - Certificate retention (10+ years)
  - Aging test scheduling and tracking
- **Lamination process** (pellicola retroriflettente + substrato)
- **Multi-color screen printing** (serigrafia)
- **Die-cutting** + **Water-jet** + **Laser cutting**
- **Adhesion testing** (cross-cut test ASTM D3359)
- **QUV chamber** aging tests (1000-2000 ore)

Equipment specifics: macchina serigrafica multi-stazione, laminatrici, fustelle/water-jet, retroriflettometro, QUV chamber.

Status: **MVP** (full Reflexallen coverage).

#### WORKFLOW_PNEUMATIC_AIR.md
Covers Reflexallen Pneumatic Air production reference:
- 9 phase complete (inbound → teardown)
- Specific equipment (Krauss Maffei extruder, Cosmo leak tester)
- Recipe examples (extrusion PA12, leak test 6 bar)
- Operator profiles with skills (EXT, ASSY, TEST, QC)
- BoxTypes for OEM packaging (returnable Reflexallen)
- Attention Points operational

Product example: tubo pneumatico multistrato 12mm × 2m for truck braking system.

Status: **Reference workflow** for seed data and demo.

#### WORKFLOW_CFRP.md
Covers Reflexallen CFRP carene moto reference:
- 11 phase complete (inbound prepreg → finishing → packaging)
- Specific equipment (autoclave, CNC plotter, mold dedicated, UT scanner)
- Cure cycle recipes (epossidica 180°C × 2h)
- Operator profiles with skills (LAYUP, AUTOCLAVE, FINISH, NDT)
- BoxTypes for fragile shipping
- Attention Points specific (out-time check, vacuum tightness)

Product example: carena posteriore moto sportiva.

Status: **Reference workflow** for seed data and demo.

#### WORKFLOW_SAFETY_DEVICES.md
Covers Reflexallen Safety Devices reference:
- 9 phase complete (inbound pellicole → stampa → laminazione → test → omologazione → outbound)
- Specific equipment (serigrafica, laminatrice, water-jet, retroriflettometro)
- Recipe examples (multi-color print, cure cycles)
- Operator profiles with skills (PRINT, LAMINATE, QC_OPTICAL)
- Box for pannelli + nastri
- Attention Points specific (omologazione marking, riflettanza thresholds)

Product example: pannello catarifrangente posteriore camion ECE-104.

Status: **Reference workflow** for seed data and demo.

### 22.5 Reading order

For comprehensive understanding:

1. **Start here** (MASTER_SPECIFICATION.md) — domain and architecture
2. **BEST_PRACTICES.md** — implementation patterns
3. **CONVENTIONS.md** — quick reference
4. **Extensions** — specific domains as needed

For Claude Code build, all `docs/**/*.md` files are loaded as context.

### 22.6 Cross-references

Extensions reference back to core sections via inline links:

```markdown
> See MASTER_SPECIFICATION § 6 (State Machines) for foundation pattern.
```

Core sections that reference extensions use this format:

```markdown
> Detailed scheduling logic in extensions/SCHEDULING_ASSIGNMENT.md
```

### 22.7 Versioning

Each extension has its own version, tracked in CHANGELOG.md. Extensions can evolve independently, but breaking changes that affect core specifications require coordinated v.X.0 bump.

---



Major architectural decisions with rationale. Detailed ADRs in `/docs/adr/`.

| ID | Decision | Date | Rationale |
|---|---|---|---|
| ADR-001 | Monorepo with Turborepo + pnpm | 2026-04-26 | Coherent codebase, shared packages, atomic commits |
| ADR-002 | Prisma over TypeORM | 2026-04-26 | Better TS types, modern API, active development |
| ADR-003 | Zod schemas shared FE/BE | 2026-04-26 | Single source of truth for validation |
| ADR-004 | XState for state machines | 2026-04-26 | Visualizable, testable, type-safe |
| ADR-005 | Socket.IO over SSE/Pusher | 2026-04-26 | Bi-directional, room support, fallback to polling |
| ADR-006 | Single-plant MVP, multi-plant ready | 2026-04-26 | Reduce MVP complexity, future-proof |
| ADR-007 | Mock device REST API in MVP | 2026-04-26 | Demo-able without hardware, real connectors V2 |
| ADR-008 | Polymorphic step model with JSON Schema | 2026-04-26 | Extensible, validation-first |
| ADR-009 | Auto-gen at workflow level, freeze at WO release | 2026-04-26 | Reproducibility, audit, separation of design and execution |
| ADR-010 | Single owner for groups (no multi-op MVP) | 2026-04-26 | Simplicity, Assist Mode V2 for compliance |
| ADR-011 | Recovery flow simplified (rework/scrap only MVP) | 2026-04-26 | NCR module deferred to V2 |
| ADR-012 | AP as ambient non-blocking elements | 2026-04-26 | Reduce friction, no banner blindness |
| ADR-013 | TanStack Query for server state | 2026-04-26 | Best-in-class caching, optimistic updates |
| ADR-014 | shadcn/ui as design system base | 2026-04-26 | Accessible, customizable, owned components |
| ADR-015 | Avenir Next Cyr typography | 2026-04-26 | Brand identity (commercial license required) |
| ADR-016 | Box Management as first-class entity in MVP | 2026-04-26 | Critical for transport/packaging traceability; unified Pallet+Box model |
| ADR-017 | Modular extensions for sub-domains (v1.2) | 2026-04-27 | Single core MASTER_SPEC + modular `extensions/` for scalability |
| ADR-018 | Equipment State Machine formalized in MVP | 2026-04-27 | Replaces simple enum with XState; foundation for maintenance |
| ADR-019 | Maintenance Management basics in MVP, advanced V2 | 2026-04-27 | Basics (Order + Log) sufficient for MVP, predictive/CMMS V2 |
| ADR-020 | Tool Wear Tracking in MVP | 2026-04-27 | Tier 1 automotive needs predictable tool replacement |
| ADR-021 | Scheduling: Assignment in MVP, full Scheduling V2 | 2026-04-27 | MVP needs operator dispatch; Gantt/MRP V2 |
| ADR-022 | Industrial operations extensions (multi-output, continuous, sample, FAI) in MVP | 2026-04-27 | Required for real production scenarios (extrusion, automotive) |
| ADR-023 | Containerized WIP + Subassemblies in MVP | 2026-04-27 | Reflexallen has buffer phases between extrusion and assembly |
| ADR-024 | Quality Hold/Release workflow in MVP | 2026-04-27 | Lot-level quarantine essential for automotive traceability |
| ADR-025 | Audit UI viewer in MVP | 2026-04-27 | Compliance-ready, low cost (backend already exists) |
| ADR-026 | CFRP Module in MVP (full coverage) | 2026-04-27 | Reflexallen Compositi line: out-time, mold, autoclave, NDT |
| ADR-027 | Safety Devices Module in MVP (full coverage) | 2026-04-27 | Reflexallen Safety line: ECE-104, riflettanza, lamination |

---

## Appendix B: Glossary of Acronyms

| Acronym | Meaning |
|---|---|
| MES | Manufacturing Execution System |
| ERP | Enterprise Resource Planning |
| ISA-95 | International Standard for Enterprise-Control System Integration |
| ISA-88 | International Standard for Batch Control |
| OEE | Overall Equipment Effectiveness |
| BOM | Bill of Materials |
| WO | Work Order |
| WC | Work Center |
| WU | Work Unit |
| QC | Quality Control |
| FPY | First Pass Yield |
| WIP | Work In Progress |
| SOP | Standard Operating Procedure |
| HMI | Human-Machine Interface |
| AGV | Automated Guided Vehicle |
| RFID | Radio-Frequency Identification |
| NCR | Non-Conformance Report |
| SPC | Statistical Process Control |
| FAI | First Article Inspection |
| MTBF | Mean Time Between Failures |
| MTTR | Mean Time To Repair |
| TPM | Total Productive Maintenance |
| RBAC | Role-Based Access Control |
| ABAC | Attribute-Based Access Control |
| RTO | Recovery Time Objective |
| RPO | Recovery Point Objective |
| ADR | Architecture Decision Record |

---

## Appendix C: References

**Standards**:
- ISA-95: ANSI/ISA-95 series, equipment hierarchy and integration model
- ISA-88: ANSI/ISA-88 series, batch process control
- 21 CFR Part 11: FDA regulations on electronic records and signatures
- GDPR: EU General Data Protection Regulation
- WCAG 2.1: Web Content Accessibility Guidelines AA

**Manufacturing concepts**:
- Lean Manufacturing: 7 Wastes, Value Stream Mapping
- Six Sigma: Cp/Cpk, DMAIC
- TPM: Total Productive Maintenance, 6 Big Losses
- Industry 4.0: IIoT, digital twins

---

**END OF MASTER SPECIFICATION**

> This document is a living artifact. Update it when domain decisions change. Reference specific sections in PRs and ADRs.

> For implementation patterns and code-level guidance, see `BEST_PRACTICES.md`.
> For quick lookup during coding, see `CONVENTIONS.md`.

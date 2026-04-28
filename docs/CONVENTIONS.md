# CONVENTIONS

> **Quick reference cheat sheet** for daily coding on the MES project.
> 
> For full context see `MASTER_SPECIFICATION.md` (the WHAT) and `BEST_PRACTICES.md` (the HOW).
> 
> **Version**: 1.2 — **Last updated**: 2026-04-27
>
> **Changelog**:
> - v1.2: Added quick refs for v1.2 features (Scheduling, Maintenance, Tool wear, Multi-output, Sample, FAI, WIP, Quality Hold, CFRP module, Safety Devices module)
> - v1.1: Added Box Management quick references
> - v1.0: Initial

---

## ⚡ Stack at a glance

```
Backend:    NestJS 10 + TypeScript + Prisma 5 + PostgreSQL 16 + Redis 7 + Socket.IO
Frontend:   Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
State:      TanStack Query (server) · Zustand (client) · React Hook Form + Zod (forms) · XState (machines)
Validation: Zod schemas in /packages/shared (FE+BE)
Real-time:  Socket.IO with declarative cache invalidation map
Storage:    S3-compatible (MinIO dev, R2/S3 prod)
i18n:       next-intl, IT default + EN
Testing:    Vitest (unit) + Playwright (e2e) + testcontainers (integration)
Tooling:    Turborepo + pnpm workspaces + Husky + commitlint
Logging:    Pino structured + correlation ID
Auth:       JWT (15min access) + refresh token cookie (7d)
Canvas:     @xyflow/react (React Flow v12) + dagre layout
Icons:      Lucide React (exclusive) + emoji in filter chips only
Animation:  Framer Motion (respects prefers-reduced-motion)
Font:       Avenir Next Cyr (commercial license, fallback to system-ui)
```

---

## 📁 Folder structure

```
mes-app/
├── apps/
│   ├── api/                  NestJS backend
│   │   └── src/modules/      Feature modules
│   └── web/                  Next.js frontend
│       ├── app/              App Router
│       │   ├── (back-office) Back-office routes
│       │   └── hmi/          Shop floor HMI
│       └── components/
│           ├── ui/           shadcn/ui primitives
│           ├── shared/       Cross-feature
│           └── features/     Feature-specific
│
├── packages/
│   ├── shared/               Types, Zod, enums, machines
│   ├── database/             Prisma schema + migrations
│   └── ui/                   Shared UI components (optional)
│
├── docs/
│   ├── MASTER_SPECIFICATION.md
│   ├── BEST_PRACTICES.md
│   ├── CONVENTIONS.md        (this file)
│   └── adr/                  ADR records
│
└── docker-compose.dev.yml
```

---

## 🏷️ Naming quick lookup

### Files

| Type | Convention | Example |
|---|---|---|
| React components | `PascalCase.tsx` | `WorkOrderCard.tsx` |
| Hooks | `useCamelCase.ts` | `useWorkOrder.ts` |
| Utilities | `camelCase.ts` | `formatDuration.ts` |
| Types | `kebab-case.types.ts` | `work-order.types.ts` |
| Constants | `kebab-case.constants.ts` | `step-categories.constants.ts` |
| Routes (Next.js) | `kebab-case/page.tsx` | `work-orders/[id]/page.tsx` |
| NestJS modules | `kebab-case/` folder | `work-orders/` |
| NestJS files | `*.controller.ts`, `*.service.ts`, `*.repository.ts`, `*.dto.ts` | `work-orders.service.ts` |
| Tests | `*.test.ts(x)` (unit), `*.spec.ts` (NestJS) | `WorkOrderCard.test.tsx` |
| State machines | `*.machine.ts` | `work-order.machine.ts` |
| Zod schemas | `*.schemas.ts` | `work-order.schemas.ts` |

### Code identifiers

| Type | Convention | Example |
|---|---|---|
| Variables | `camelCase` | `workOrderId` |
| Booleans | `is/has/should/can/did + ...` | `isLoading`, `hasPermission` |
| Functions | verb + noun | `fetchWorkOrders()`, `validateEmail()` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Types/Interfaces | `PascalCase` | `WorkOrder`, `CreateWorkOrderInput` |
| Enums | `PascalCase` (TS) / `snake_case` (DB) | `WorkOrderStatus.in_progress` |
| React components | `PascalCase` | `<WorkOrderCard />` |
| Custom hooks | `useCamelCase` | `useWorkOrder()` |
| Event names | `entity.action` (camelCase) | `workOrder.released` |

### Database

| Type | Convention | Example |
|---|---|---|
| Tables | `snake_case`, **plural** | `work_orders` |
| Columns | `snake_case` (DB) / `camelCase` (Prisma) | `created_at` / `createdAt` |
| Indexes | `idx_<table>_<columns>` | `idx_workorders_status` |
| Foreign keys | `<column>_id` | `work_order_id` |
| Enums | `<entity>_<attr>_enum` | `work_order_status_enum` |

### Business codes

| Entity | Pattern | Example |
|---|---|---|
| Item | `ITM-{type}-{seq}` | `ITM-FG-00042` |
| Lot | `LOT-{date}-{seq}` | `LOT-260415-001` |
| Serial | `SN-{year}-{seq}` | `SN-2026-000142` |
| Work Order | `WO-{year}-{seq}` | `WO-2026-0142` |
| Recipe | `RCP-{category}-{seq}` | `RCP-LEAK-001` |
| Workflow | `WF-{seq}` | `WF-0042` |
| Equipment | `{type}-{location}-{seq}` | `DEV-WC1-001` |
| Step | `STP-{group}-{seq}` | `STP-DEV-SCN-002` |
| Cause code | `{category}-{seq}` | `DT-BD-001` |
| Attention Point | `AP-{category}-{seq}` | `AP-SAFETY-042` |
| **BoxType** | `BTYPE-{category}-{seq}` | `BTYPE-PLT-001` |
| **Box (instance)** | `BOX-{type-suffix}-{seq}` | `BOX-PLT-001234` |
| **Seal** | `SEAL-{year}-{seq}` | `SEAL-2026-00042` |
| **WO Assignment** (v1.2) | `WOA-{wo}-{seq}` | `WOA-2026-0142-01` |
| **Shift** (v1.2) | `SHIFT-{type}` | `SHIFT-MORNING` |
| **Maintenance Order** (v1.2) | `MNT-{year}-{seq}` | `MNT-2026-0042` |
| **Sample** (v1.2) | `SMP-{wo}-{seq}` | `SMP-2026-0142-01` |
| **FAI** (v1.2) | `FAI-{year}-{seq}` | `FAI-2026-0042` |
| **WIP Container** (v1.2) | `WIP-{location}-{seq}` | `WIP-WC1-001` |
| **Subassembly** (v1.2) | `SUB-{item}-{seq}` | `SUB-RACC-001` |
| **Lot Hold** (v1.2) | `HOLD-{lot}-{seq}` | `HOLD-260415-001-A` |
| **Mold** (v1.2 CFRP) | `MOLD-{type}-{seq}` | `MOLD-CARENA-001` |
| **Prepreg Roll** (v1.2 CFRP) | `PREPREG-{material}-{seq}` | `PREPREG-CF-T700-001` |
| **Cure Cycle** (v1.2 CFRP) | `CCR-{year}-{seq}` | `CCR-2026-0042` |
| **NDT Result** (v1.2 CFRP) | `NDT-{type}-{seq}` | `NDT-UT-2026-0042` |
| **Reflectance Test** (v1.2 Safety) | `RFT-{year}-{seq}` | `RFT-2026-0042` |
| **Homologation** (v1.2 Safety) | `ECE-{number}-{year}` | `ECE-104R-001234-2026` |
| **Aging Specimen** (v1.2 Safety) | `AGE-{type}-{seq}` | `AGE-QUV-2026-0042` |

---

## ✅ Always do

- ✅ TypeScript **strict mode** everywhere
- ✅ Zod schemas in `/packages/shared` shared FE+BE
- ✅ **Soft delete** via `deletedAt` (never hard DELETE)
- ✅ Timestamps **always `TIMESTAMPTZ`** stored UTC
- ✅ **`plantId` filter** on every transactional query
- ✅ Standard audit fields: `createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `deletedAt`, `version`
- ✅ **`<EntityImage>`** for entity images (never raw `<img>`)
- ✅ **XState** for non-trivial lifecycles
- ✅ Server-side validation **always** (client-side only for UX)
- ✅ Loading / Empty / Error states for **every** data view
- ✅ TanStack Query for server state
- ✅ Translations via **next-intl**, never hardcoded strings
- ✅ **Conventional commits** (`feat:`, `fix:`, `chore:`...)
- ✅ Named exports for components (no `export default`)
- ✅ Validate inputs at **every API boundary** (Zod + DTO)
- ✅ **Permission checks** via `@Roles()` and `@RequirePermission()` decorators
- ✅ **Emit events after** transaction commits (not inside)
- ✅ **Workflow snapshot** at WO release (frozen, immutable)
- ✅ **Decimal** for quantities and money (never `float`)
- ✅ Run `pnpm lint && pnpm typecheck && pnpm test` before commit
- ✅ Update translations **IT + EN** when adding strings
- ✅ **Box capacity**: hard block weight/volume, warning + override units
- ✅ **Sealed box** is immutable: `open_sealed_box` action with reason required
- ✅ **Box cycle count** auto-increments on full lifecycle (returned → empty)
- ✅ **Pallet = BoxType** with category `standard_pallet` (unified model)
- ✅ Use **Decimal** for box weights/volumes, never float
- ✅ **WO Assignment** with skills coverage check before activation (v1.2)
- ✅ **Equipment State Machine** XState formal, no free enum (v1.2)
- ✅ **Multi-output cycles**: distinguish in counters (v1.2)
- ✅ **Sample tracking** separate from production count (v1.2)
- ✅ **FAI block** production until quality approval (v1.2)
- ✅ **Maintenance Order** for any equipment intervention (v1.2)
- ✅ **Tool wear** auto-incremented on usage (v1.2)
- ✅ **Quality Hold** blocks downstream consumption (v1.2)
- ✅ **Continuous production** mode for extrusion/lamination (v1.2)
- ✅ **Subassembly** nested BOM with multi-level explosion (v1.2)
- ✅ **WIP container** tracking for buffer phases (v1.2)
- ✅ **Prepreg out-time** cumulative tracking (v1.2 CFRP)
- ✅ **Cure cycle** telemetry as time-series (v1.2 CFRP)
- ✅ **Reflectance test** linked to lot per ECE-R104 (v1.2 Safety)
- ✅ **Homologation marking** format `E{country}-104R-{seq}/{year}` (v1.2 Safety)

---

## ❌ Never do

- ❌ `any` type (use `unknown` if truly unknown)
- ❌ Inline styles (use Tailwind utilities)
- ❌ `console.log` in committed code (use Pino logger)
- ❌ Hardcoded user-facing strings (always i18n)
- ❌ Direct Prisma calls in **controllers** (use service → repository)
- ❌ Cross-domain database access (use service contracts)
- ❌ `useEffect` for data fetching (use TanStack Query)
- ❌ Default exports for components (use named exports)
- ❌ Magic numbers (extract to named constants)
- ❌ Skip `plant_id` filter on transactional queries (DATA LEAK!)
- ❌ Hard DELETE (always soft delete with `deletedAt`)
- ❌ Float for monetary or quantity values
- ❌ Mutate state directly (immutable updates only)
- ❌ Mix runtime + type imports unnecessarily (use `import type`)
- ❌ Catch errors silently (always log or rethrow)
- ❌ Commit secrets, tokens, passwords
- ❌ Skip tests because "it's a small change"
- ❌ Force push to `main`
- ❌ Modify a step's `category` after creation (create new step)
- ❌ Modify recipe parameters of a deployed approved version (create new version)
- ❌ Reuse Work Order codes after cancellation
- ❌ Use `findUnique` without `plantId` (use `findFirst` with composite where)
- ❌ **Modify contents** of a sealed box (must `open_sealed_box` first)
- ❌ **Bypass capacity validation** weight/volume (HARD BLOCK)
- ❌ **Pack into damaged box** (status terminal, never reverts)
- ❌ **Manually reset** cyclesCount on a Box
- ❌ **Hard-code box dimensions/capacity** (always read from BoxType)
- ❌ **Skip skills coverage** on WO assignment (v1.2)
- ❌ **Activate WO without FAI** approval (v1.2)
- ❌ **Sample mixed** with production counter (v1.2)
- ❌ **Continuous production** as discrete cycles (v1.2)
- ❌ **Manual edit** mold cycles count (v1.2 CFRP)
- ❌ **Use prepreg** without out-time check (v1.2 CFRP)
- ❌ **Reflectance fail** approved without QC (v1.2 Safety)
- ❌ **ECE marking** without active certificate (v1.2 Safety)
- ❌ **Modify sealed/locked entities** (sealed boxes, approved FAI, valid certificates)

---

## 🎯 Common patterns one-liners

| Need | Pattern |
|---|---|
| Server state | `useQuery({ queryKey, queryFn })` from TanStack Query |
| Mutation with optimistic UI | `useMutation` with `onMutate` + `onError` rollback |
| Client global state | Zustand store with `persist` middleware |
| Form state | `useForm({ resolver: zodResolver(schema) })` |
| State machine | XState `setup({}).createMachine({})` shared FE/BE |
| Validation FE+BE | Zod schema in `/packages/shared/schemas` |
| URL state (filters) | `useSearchParams` + `useRouter` |
| Translations | `useTranslations('namespace')` from next-intl |
| Date formatting | `date-fns` + `date-fns-tz` (UTC stored) |
| Money/qty | `Decimal` from `decimal.js` (never float) |
| Image entity | `<EntityImage entity={x} entityType="item" size="card" />` |
| List/Card/Flow toggle | `<ViewSwitcher availableViews={[...]} />` |
| Loading state | `<Skeleton />` from shadcn (not spinner) |
| Empty state | Icon + heading + description + CTA |
| Error boundary | `<ErrorBoundary fallback={...}>` per feature |
| Permission check (BE) | `@Roles('admin')` + `@RequirePermission('x')` |
| Plant context (BE) | `@Plant() plantId: string` decorator |
| Current user (BE) | `@CurrentUser() user: User` decorator |
| Audit action (BE) | `@Audit('action.name')` decorator |
| Idempotent action | `@Idempotent({ ttl: '1h' })` decorator |
| Background job | BullMQ queue + `@Processor` |
| Real-time event emit | `this.events.emit('entity.action', payload)` after commit |
| Real-time event listen (FE) | `useSocketEvent<T>('event.name', handler)` |
| Cache invalidation | Add to `INVALIDATION_MAP` in `/packages/shared/cache` |
| Box image | `<EntityImage entity={box} entityType="box" size="card" />` |
| Box status | `<BoxStatusBadge status={box.status} />` |
| Box fill bar | `<BoxFillIndicator currentUnits maxUnits currentWeightKg maxWeightKg />` |
| Box scan input | `<BoxScanInput expectedStatus={['empty', 'partially_filled']} onScan={...} />` |
| Pack into box | Service `boxesService.packIntoBox(boxId, payload, ctx)` (transactional) |
| Seal box | Service `boxesService.sealBox(boxId, payload, ctx)` (validates type) |
| Open sealed | Service `boxesService.openSealedBox(boxId, { reason }, ctx)` (audited) |
| Box state machine | XState `boxMachine` from `/packages/shared/machines/box.machine.ts` |
| WO Assignment (v1.2) | Service `assignmentService.assign(woId, opId, options, ctx)` with skills check |
| Operator dispatch list | `assignmentService.getDispatchListForOperator(operatorId, ctx)` |
| Reassign WO (v1.2) | `assignmentService.reassign(assignmentId, newOpId, reason, ctx)` |
| Maintenance Order create (v1.2) | `mntService.create(payload, ctx)` — equipment → maintenance_pending |
| Tool wear increment (v1.2) | `toolWearService.incrementCycles(toolId, n, woId, ctx)` automatic |
| Multi-output cycle complete (v1.2) | `cycleService.completeCycle(cycleId, outputs[], ctx)` |
| Continuous production start (v1.2) | `continuousService.startContinuous(woId, phaseId, ctx)` |
| Sample take (v1.2) | `sampleService.takeSample(payload, ctx)` separate from prod count |
| FAI initiate (v1.2) | `faiService.initiate(woId, pieceCount, ctx)` blocks production |
| FAI approve (v1.2) | `faiService.approve(faiId, approval, ctx)` requires fai.approve permission |
| Quality Hold apply (v1.2) | `qualityHoldService.applyHold(lotId, payload, ctx)` |
| Quality Hold release (v1.2) | `qualityHoldService.release(holdId, decision, ctx)` requires lotHold.release |
| Mold use (v1.2 CFRP) | `moldService.useMold(moldId, woId, ctx)` auto-increment cycles |
| Cure cycle start (v1.2 CFRP) | `cureCycleService.startCycle(payload, ctx)` schedules telemetry job |
| NDT result record (v1.2 CFRP) | `ndtService.recordResult(payload, ctx)` |
| Reflectance test (v1.2 Safety) | `reflectanceService.recordTest(payload, ctx)` validates ECE-R104 |
| Homologation marking (v1.2 Safety) | `homologationService.generateMarking(cert, year)` |

---

## 🚀 Common commands

### Setup
```bash
# Install dependencies
pnpm install

# Initial DB setup
pnpm db:reset           # drop, create, migrate, seed
pnpm db:seed            # seed only
pnpm prisma:studio      # open Prisma Studio
```

### Development
```bash
# Start everything (Turborepo)
pnpm dev

# Or per app
pnpm --filter api dev
pnpm --filter web dev

# Docker services (Postgres, Redis, MinIO)
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml down
```

### Quality gates (before commit)
```bash
pnpm lint               # ESLint
pnpm lint:fix           # auto-fix
pnpm format             # Prettier
pnpm typecheck          # tsc --noEmit
pnpm test               # Vitest
pnpm test:watch         # watch mode
pnpm test:coverage      # with coverage report
pnpm check              # lint + typecheck + test (all)
```

### Database
```bash
pnpm prisma:migrate     # create new migration
pnpm prisma:deploy      # apply migrations (production)
pnpm prisma:generate    # regenerate Prisma client
pnpm prisma:studio      # GUI for DB
```

### Testing
```bash
pnpm test:unit          # unit tests only
pnpm test:integration   # integration with testcontainers
pnpm test:e2e           # Playwright e2e
pnpm test:e2e:ui        # Playwright UI mode
```

### Build
```bash
pnpm build              # all apps
pnpm --filter web build
pnpm --filter api build
```

### Generators (NestJS CLI)
```bash
pnpm nest g module work-orders
pnpm nest g controller work-orders
pnpm nest g service work-orders
```

### Git
```bash
# Conventional commits enforced by commitlint
git commit -m "feat(work-orders): add release validation"
git commit -m "fix(hmi): resolve scan timeout"
git commit -m "docs(api): update OpenAPI examples"
```

---

## 🎨 Tailwind / Design tokens

```typescript
// Color tokens (semantic, dark mode ready)
bg-background       // page background
bg-foreground       // text on background
bg-card             // card surface
bg-muted            // subtle backgrounds
bg-primary          // brand primary (violet/indigo)
bg-secondary        // brand secondary
bg-destructive      // errors, delete actions
bg-success          // success states (emerald)
bg-warning          // warnings (amber)

// Typography
text-xs / text-sm / text-base / text-lg / text-xl / text-2xl / text-3xl
font-normal / font-medium / font-semibold / font-bold
tracking-tight (headings) / tracking-normal / tracking-wide
tabular-nums  // for KPIs and numeric counters

// Spacing scale (Tailwind)
0  4px  8px  12px  16px  24px  32px  48px  64px  96px
0  1    2    3     4     6     8     12    16    24

// Border radius
rounded-md      // 6px (default for inputs)
rounded-lg      // 8px (default for cards)
rounded-full    // pills/chips/circular

// Shadows (use sparingly, prefer borders)
shadow-sm       // dropdowns, tooltips
shadow          // standard elevation
shadow-md       // modals, drawers
shadow-lg       // popovers (rare)

// Touch targets (HMI)
.hmi-touch-target   { @apply min-h-[48px] min-w-[48px]; }
.hmi-button         { @apply h-14 px-6 text-base font-medium; }
.hmi-card           { @apply p-6; }
```

---

## 🔢 Status colors quick map

```
Work Order status:
  draft               → gray
  planned             → blue
  released            → cyan
  in_progress         → violet
  on_hold             → amber
  completed           → green
  partially_completed → green (with badge)
  closed              → green darker
  cancelled           → red

Step Execution status (FLUSSO OK):
  idle, ready         → gray, blue
  in_progress         → violet
  paused              → amber
  complete            → green
  retry               → yellow

Step Execution status (FLUSSO KO):
  error, failed       → red
  warning             → amber
  timeout             → orange-red
  offline             → gray

Equipment status:
  available           → 🟢 green
  in_use              → 🟡 yellow
  maintenance         → 🟠 orange
  broken              → 🔴 red
  offline             → ⚫ gray

Lot quality:
  approved            → 🟢 green
  quarantine          → 🟡 yellow
  rejected            → 🔴 red

Box status:
  empty               → gray         (available)
  partially_filled    → blue         (loading)
  full                → cyan         (at capacity)
  sealed              → violet       (locked)
  shipped             → green        (out)
  returned            → amber        (back from customer)
  in_cleaning         → yellow       (washing)
  damaged             → red          (terminal)

Timing status:
  not_started         → gray
  on_track            → green
  ahead               → blue
  at_risk             → amber
  delayed             → red
  paused              → gray
  completed           → green checkmark

WO Assignment status (v1.2):
  pending             → blue          (just assigned)
  accepted            → cyan          (operator confirmed)
  active              → violet        (executing)
  completed           → green
  reassigned          → gray          (transferred to other op)

Equipment State (v1.2 — formal):
  available           → 🟢 green
  setup_required      → 🔵 blue
  in_use              → 🟡 yellow
  paused              → 🟠 amber
  maintenance_pending → 🟠 orange
  maintenance         → 🟠 orange darker
  broken              → 🔴 red
  offline             → ⚫ gray

Maintenance Order status (v1.2):
  scheduled           → blue
  in_progress         → violet
  completed           → green
  cancelled           → gray
  overdue             → red
  deferred            → amber

Tool Wear status (v1.2):
  new                 → green
  good                → green darker
  worn                → amber
  at_limit            → orange
  replaced            → gray

Sample status (v1.2):
  pending_test        → blue
  testing             → violet
  passed              → green
  failed              → red
  archived            → gray

FAI status (v1.2):
  in_progress         → violet
  approved            → green
  rejected            → red
  pending_review      → amber

Lot Hold status (v1.2):
  active              → red
  released            → green
  pending             → amber

Mold status (v1.2 CFRP):
  available           → 🟢 green
  in_use              → 🟡 yellow
  cleaning            → 🔵 blue
  maintenance         → 🟠 orange
  decommissioned      → ⚫ gray

Cure Cycle phase (v1.2 CFRP):
  vacuum_pre_cure     → blue
  heating_ramp        → orange
  dwell               → red
  cooling_ramp        → cyan
  depressurization    → blue
  
Reflectance Test (v1.2 Safety):
  pass                → 🟢 green
  marginal            → 🟡 yellow
  fail                → 🔴 red

Homologation status (v1.2 Safety):
  valid               → 🟢 green
  expiring_soon       → 🟡 amber (< 90 days)
  expired             → 🔴 red
  withdrawn           → ⚫ gray
```

---

## 📋 Attention Point categories

```
safety       → ⚠️ orange-500   PPE, hazards, safety procedures
quality      → 🎯 violet-500   Tolerances, critical quality params
technical    → 🔧 blue-500     Technical operational notes
regulatory   → 📋 amber-500    Compliance, batch records
general      → 💡 gray-500     Tips, best practices
```

---

## 🏗️ Universal components quick reference

| Component | Purpose | Where |
|---|---|---|
| `<EntityImage>` | Universal entity image with fallback | All entities |
| `<ViewSwitcher>` | List/Card/Flow toggle | All registries |
| `<CanvasView>` | React Flow canvas with adapters | Equipment, Workflow, BOM |
| `<FourPaneConfigurator>` | Wizard + Palette + Form + Preview | Step config, Workflow design |
| `<StepLivePreview>` | State-driven HMI mock with 11 states | Step configurator |
| `<TimerStatusBar>` | Multi-level timer (WO/Phase/Part) | HMI |
| `<AttentionPointCard>` | Static ambient AP card (non-blocking) | HMI step screens |
| `<BoxStatusBadge>` | Color-coded box status indicator | Box lists, HMI |
| `<BoxFillIndicator>` | Dual progress bar (units + weight) | Box detail, packing HMI |
| `<BoxContentList>` | Tabular contents inside a box | Box detail |
| `<BoxScanInput>` | Specialized box scan with validation | HMI packing flow |
| `<SealNumberDisplay>` | Seal number with copy/print actions | Box detail, HMI |
| `<AssignmentBadge>` (v1.2) | Status badge for WO assignment | Dispatch lists, WO detail |
| `<DispatchListItem>` (v1.2) | Card for assigned WO in operator HMI | HMI dispatch screen |
| `<MaintenanceOrderCard>` (v1.2) | Card showing maintenance order with status | Equipment detail, calendar |
| `<ToolWearIndicator>` (v1.2) | Progress bar showing tool wear % | Tool detail, HMI |
| `<SampleCard>` (v1.2) | Sample with status + test results | Sample list, lot detail |
| `<FAIPanel>` (v1.2) | FAI workflow UI with approval | WO detail when blocked |
| `<HoldBanner>` (v1.2) | Banner alert for lot quality hold | Lot detail, WO if affected |
| `<CycleProgressBar>` (v1.2) | Progress for multi-output cycle | Production execution HMI |
| `<ContinuousProductionMonitor>` (v1.2) | Real-time view of continuous run | Extrusion HMI |
| `<MoldCard>` (v1.2 CFRP) | Mold info with cycles count + lifecycle | Mold registry |
| `<CureCycleChart>` (v1.2 CFRP) | Time-series chart of cure cycle telemetry | Cure cycle detail |
| `<NDTResultViewer>` (v1.2 CFRP) | Display NDT scan results + defects | Quality detail |
| `<ReflectanceMeter>` (v1.2 Safety) | Visual gauge for reflectance vs threshold | Reflectance test UI |
| `<HomologationCertificateCard>` (v1.2 Safety) | Certificate with expiration alerts | Compliance dashboard |
| `<DataTable>` | Sortable, paginated, filterable table | All list views |
| `<EmptyState>` | Icon + heading + CTA | Empty data views |
| `<Skeleton>` | Loading placeholder (shape-matching) | Loading states |
| `<ErrorBoundary>` | Per-feature error containment | Major sections |

---

## 🚦 State management decision tree

```
Is it server data?              → TanStack Query
Is it form state?               → React Hook Form + Zod
Is it URL state (filters)?      → URL search params
Is it global UI state?          → Zustand
Is it component-local?          → useState
Is it complex flow logic?       → XState
```

---

## 🔄 View switcher per registry

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
| **Box Types** | list, card | card |
| **Boxes** (instances) | list, card | list |
| **WO Assignments** (v1.2) | list | list |
| **Maintenance Orders** (v1.2) | list, card, calendar | list |
| **Samples** (v1.2) | list, card | list |
| **FAI Records** (v1.2) | list | list |
| **Lot Holds** (v1.2) | list | list |
| **Molds** (v1.2 CFRP) | list, card | list |
| **Prepreg Rolls** (v1.2 CFRP) | list, card | list |
| **Cure Cycle Runs** (v1.2 CFRP) | list, card, timeline | list |
| **NDT Results** (v1.2 CFRP) | list | list |
| **Reflectance Tests** (v1.2 Safety) | list, card | list |
| **Homologation Certificates** (v1.2 Safety) | list, card | card |

---

## 🔧 Quick troubleshooting

### "Type error: cannot find module '@mes/shared'"
```bash
pnpm install
pnpm --filter shared build
```

### "Prisma Client not generated"
```bash
pnpm prisma:generate
```

### "Migration failed"
```bash
# Check current state
pnpm prisma migrate status

# Reset DB (DEV ONLY)
pnpm db:reset
```

### "Tests fail with Prisma errors"
```bash
# Ensure test DB is migrated
pnpm prisma migrate deploy
# Or use testcontainers (auto-migrates)
```

### "Socket.IO not connecting"
- Check `NEXT_PUBLIC_SOCKET_URL` in `.env.local`
- Check JWT token in handshake auth
- Check CORS settings in API
- Check browser network tab for upgrade error

### "Hot reload not working"
```bash
# Restart Turborepo
pnpm dev --force
```

### "TypeScript slow"
```bash
# Restart TS server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"
# Or
rm -rf .turbo node_modules/.cache
pnpm install
```

### "Docker services not starting"
```bash
docker compose -f docker-compose.dev.yml down -v   # remove volumes
docker compose -f docker-compose.dev.yml up -d
docker compose logs -f                              # check logs
```

### "ESLint conflicts with Prettier"
- Conflicts handled by `eslint-config-prettier` (already in config)
- Run `pnpm format` first, then `pnpm lint`

### "Build fails in CI but works locally"
```bash
# Test the same way as CI
pnpm clean
pnpm install --frozen-lockfile
pnpm check
pnpm build
```

### "Box.currentUnits doesn't match COUNT(BoxContent)"
- Denormalized fields out of sync
- Check that pack/unpack updates BOTH BoxContent AND Box in same transaction
- Run integrity test:
```typescript
const actual = await prisma.boxContent.count({ 
  where: { boxId, removedAt: null } 
})
expect(box.currentUnits).toBe(actual)
```

### "Cannot pack into box: validation fails inconsistently"
- Race condition on capacity check
- Ensure operation is in single transaction with optimistic lock
- Check that weight/volume validation uses Decimal (not float)

### "Sealed box content was modified"
- Audit failure — should never happen
- Check guard: `if (box.isSealed) throw`
- Verify `open_sealed_box` action was called explicitly

### "Returnable box never increments cycles"
- Lifecycle short-circuited (e.g., directly returned → empty)
- Must go through proper transitions
- Check XState machine transitions in test

---

## 🎨 i18n quick patterns

```typescript
// Component usage
import { useTranslations } from 'next-intl'

const t = useTranslations('workOrders')
<h1>{t('title')}</h1>
<Badge>{t(`status.${wo.status}`)}</Badge>

// Pluralization (ICU MessageFormat)
{t('items', { count: 5 })}
// In JSON: "items": "{count, plural, =0 {No items} =1 {# item} other {# items}}"

// Variables
{t('errors.notReleasable', { reason: error.message })}
// In JSON: "notReleasable": "Cannot release: {reason}"

// Date formatting
import { format } from 'date-fns'
import { it, enUS } from 'date-fns/locale'

const locale = useLocale() === 'it' ? it : enUS
format(date, 'PPP', { locale })

// Number / currency
new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(1234.56)

// DB content (multi-language fields)
function localized(obj, field, locale = 'it') {
  return obj[`${field}_${locale}`] ?? obj[`${field}_it`] ?? ''
}
```

---

## 🔐 Permissions quick reference

```typescript
// Roles (multi-role per user supported)
'admin' | 'planner' | 'supervisor' | 'operator' | 'quality' | 'viewer'

// Common permissions
'workOrder.create'
'workOrder.release'
'workOrder.cancel'
'recipe.approve'
'skill.override'
'item.create'
// ... full matrix in MASTER_SPECIFICATION.md § 14

// Decorator usage
@Roles('admin', 'planner')
@RequirePermission('workOrder.release')
@Audit('workOrder.release')
@Post(':id/release')
async release() { ... }
```

---

## 🌐 Real-time events catalog

```typescript
// Event naming: {entity}.{action} (camelCase)

// Work Orders
'workOrder.created'
'workOrder.planned'
'workOrder.released'
'workOrder.started'
'workOrder.statusChanged'
'workOrder.completed'
'workOrder.cancelled'

// Steps
'step.started'
'step.completed'
'step.failed'
'step.paused'
'step.resumed'

// Devices
'device.statusChanged'
'device.cycleStarted'
'device.cycleCompleted'
'device.alarm'

// Materials
'lot.created'
'lot.qualityChanged'
'serial.allocated'
'serial.completed'
'serial.scrapped'

// Operators
'operator.loggedIn'
'operator.loggedOut'

// Boxes (NEW v1.1)
'box.created'              // new box instance
'box.statusChanged'        // any status transition
'box.packed'               // item added
'box.unpacked'             // item removed
'box.sealed'               // box sealed
'box.sealOpened'           // sealed box opened (audited)
'box.shipped'              // shipped to customer
'box.returned'             // returnable came back
'box.damaged'              // flagged damaged
'box.inspected'            // inspection completed
'boxType.created' / '.updated' / '.deleted'

// WO Assignments (v1.2)
'workOrderAssignment.created'
'workOrderAssignment.accepted'
'workOrderAssignment.started'
'workOrderAssignment.completed'
'workOrderAssignment.reassigned'

// Maintenance (v1.2)
'maintenanceOrder.created'
'maintenanceOrder.started'
'maintenanceOrder.completed'
'maintenanceOrder.overdue'

// Tool Wear (v1.2)
'tool.wearWarning'
'tool.atLimit'
'tool.replaced'

// Samples (v1.2)
'sample.taken'
'sample.testResultRecorded'
'sample.passed' / '.failed'

// FAI (v1.2)
'fai.initiated'
'fai.approved'
'fai.rejected'

// Quality Hold (v1.2)
'lotHold.applied'
'lotHold.released'

// Cycle execution (v1.2)
'cycle.completed'             // multi-output
'continuousProduction.started'
'continuousProduction.stopped'

// Equipment State Machine (v1.2)
'equipment.statusChanged'
'equipment.maintenanceRequired'

// CFRP (v1.2)
'mold.endOfLifeApproaching'
'mold.replaced'
'cureCycle.started' / '.phaseChanged' / '.completed' / '.failed'
'ndt.resultRecorded'
'prepreg.outTimeWarning' / '.expired'

// Safety Devices (v1.2)
'reflectance.tested'
'reflectance.belowThreshold'
'homologation.expiringSoon' / '.expired'
'lamination.completed' / '.failed'

// Anagrafiche
'item.created'  / '.updated'  / '.deleted'
'workflow.created'  / '.updated'  / '.deleted'
'recipe.created'  / '.updated'  / '.approved'  / '.deprecated'
// ... etc
```

---

## 🔢 OEE / KPI formulas

```
OEE = Availability × Performance × Quality

Availability  = run_time / planned_production_time
Performance   = (ideal_cycle_time × total_count) / run_time
Quality       = good_count / total_count
                where good = OK + rework_success
                      total = good + scrap

FPY (First Pass Yield) = (total - rework - scrap) / total
Throughput   = parts_completed / hour
Scrap rate   = qty_scrap / total_produced × 100
Rework rate  = qty_rework / total_produced × 100

Parallel utilization = sum(parallel_actual) / device_actual
Cycle deviation %    = (actual - planned) / planned × 100

Scrap compensation:
  qtyRemaining = qtyTarget - qtyProduced - qtyDeviation + qtyScrap

Box KPIs (NEW v1.1):
  Box utilization        = currentUnits / maxUnits × 100
  Fill rate avg per type = avg(fillPercentage) per BoxType
  Box turnaround time    = avg(returnedAt - shippedAt) for returnables
  Average cycle count    = avg(cyclesCount) per BoxType
  Damaged box rate       = damaged / total per period
  Boxing time per piece  = avg(time in pack_into_box steps)
  End-of-life prediction = cyclesCount / expectedLifecycles × 100
  Seal break rate        = open_sealed_box events / total seals
```

---

## 📦 Universal types quick reference

```typescript
// Branded IDs (prevent mixing)
type WorkOrderId = string & { __brand: 'WorkOrderId' }
type UserId = string & { __brand: 'UserId' }
type PlantId = string & { __brand: 'PlantId' }

// Common request context
interface RequestContext {
  userId: string
  plantId: string
  correlationId: string
  locale: 'it' | 'en'
}

// API response shape
interface ApiResponse<T> {
  data: T
  meta?: PaginationMeta
}

interface ProblemDetails {  // RFC 7807
  type: string
  title: string
  status: number
  detail: string
  code: string
  errors?: ValidationError[]
  instance: string
  traceId: string
}
```

---

## 📐 Step categories quick reference

```typescript
// Step categories (8)
'production'     | 'logistics'    | 'identification' | 'quality_control'
'decision'       | 'information'  | 'setup'          | 'teardown'

// Group categories MVP (9 — v1.1 added packaging)
'skills_check'   | 'bom_check'    | 'tooling_check'  | 'device_setup'
'device_execution' | 'assembly'   | 'qc'             | 'logistics'
'packaging'                                              // NEW v1.1

// Phase categories (6)
'inbound'  | 'setup'  | 'production'  | 'quality_control'
'outbound' | 'teardown'

// Step types (visual modifier)
'normal' | 'warning' | 'informative'

// Time modes (for device_execution)
'manual-standard-time' | 'device-cycle-time' | 'while-device-running'

// Part references (parallel)
'current' | 'previous' | 'next' | 'previous_n' | 'batch' | 'none'

// No-target policy (when previous unavailable)
'skip' | 'defer' | 'block_operator_choice'

// Step source (provenance)
'manual' | 'auto_generated' | 'overridden'

// Box action types (NEW v1.1)
'pack_into_box' | 'unpack_from_box' | 'seal_box' | 'open_sealed_box'
'palletize_box' | 'depalletize_box' | 'inspect_box' | 'clean_box'
'select_empty_box' | 'validate_box_capacity' | 'print_box_label'
```

---

## ⏰ Multi-level timer

```typescript
// 3 levels always shown in HMI:
//   1. Work Order (hours/days)
//   2. Phase (minutes/hours)
//   3. Part (seconds/minutes)

// 7 timing statuses:
'not_started' | 'on_track' | 'ahead' | 'at_risk' | 'delayed' | 'paused' | 'completed'

// Thresholds (configurable):
on_track:  -5%  to  +5%
ahead:     < -5%
at_risk:   +5%  to  +20%
delayed:   > +20%

// 3 layouts:
'full' (HMI desktop)  |  'compact' (tablet)  |  'minimal' (floating widget)
```

---

## 📦 Box Management quick reference (NEW v1.1)

```
ENTITIES (4):
  BoxType        master/registry — defines a category of box
  Box            physical instance — tracked asset with unique ID
  BoxContent     M2M serial/lot inside a box (with timestamps)
  BoxMovement    append-only history (pack/unpack/seal/ship/...)

CATEGORIES (8):
  standard_pallet | half_pallet | cardboard_box | plastic_crate
  metal_container | kanban_bin | iso_container | custom

STATUSES (8) — state machine:
  empty → partially_filled → full → sealed → shipped
                                                ↓ (returnable)
                                            returned
                                                ↓ (cleaningRequired)
                                          in_cleaning
                                                ↓
                                              empty (cycles++)
  
  damaged ← (any state, manual marking, terminal)

CONTENT TRACKING MODES (3):
  serial   — each item by SN
  quantity — only count
  mixed    — flexibility per item

CAPACITY VALIDATION:
  weight, volume   → HARD BLOCK
  units count      → WARNING + OVERRIDE

KEY RULES:
  • Pallet IS a BoxType (category 'standard_pallet')
  • Sealed = immutable (no pack/unpack until 'open_sealed_box')
  • Open seal requires REASON + audit + special permission
  • cyclesCount auto-increments on returned → empty
  • conditionScore: 0-100, decreases with cycles
  • Atomic transaction: capacity check + content insert + box update
  • Optimistic locking: version field on Box

ACTIONS (11):
  select_empty_box | pack_into_box | unpack_from_box
  validate_box_capacity | seal_box | open_sealed_box
  palletize_box | depalletize_box | inspect_box | clean_box
  print_box_label

EVENTS (10):
  box.created | box.statusChanged | box.packed | box.unpacked
  box.sealed | box.sealOpened | box.shipped | box.returned
  box.damaged | box.inspected
```

---

## 📋 Scheduling & Assignment quick reference (NEW v1.2)

```
ENTITIES (3):
  WorkOrderAssignment     WO ↔ Operator linkage with lifecycle
  Shift                   Defined work period (Mattino/Pomeriggio/Notte)
  ShiftAssignment         Operator → Shift M2M

ASSIGNMENT STATUSES (5):
  pending → accepted → active → completed
                            ↘ reassigned (transferred)

KEY RULES:
  • Skills coverage check MANDATORY before activation
  • Override allowed with permission + audit reason
  • Reassignment preserves history
  • Dispatch list ordered by priority + due date

SHIFT TYPES (3):
  morning (06:00-14:00) | afternoon (14:00-22:00) | night (22:00-06:00)
  Custom shifts allowed via Shift entity

ENDPOINTS:
  POST   /work-order-assignments              → assign
  POST   /work-order-assignments/:id/accept   → operator HMI
  POST   /work-order-assignments/:id/reassign → planner UI
  GET    /work-order-assignments/dispatch     → operator dispatch list
```

---

## 🔧 Maintenance & Tool Wear quick reference (NEW v1.2)

```
ENTITIES (4):
  MaintenanceOrder        Order with status (scheduled/in_progress/completed/...)
  MaintenanceLog          History entry per intervention
  ToolWearHistory         Replacement history per tool
  EquipmentStateLog       Audit trail of equipment status transitions

MAINTENANCE TYPES (4):
  preventive | corrective | calibration | inspection

MAINTENANCE STATUS (6):
  scheduled → in_progress → completed
       ↓                ↓
  cancelled            overdue / deferred

EQUIPMENT STATE MACHINE (8 states):
  available → setup_required → in_use → paused
                    ↓             ↓
              maintenance_pending → maintenance → broken
                                                    ↓
                                                offline

TOOL WEAR STATUS (5):
  new → good → worn → at_limit → replaced

WEAR THRESHOLDS:
  0% - 70%   → good
  70% - 90%  → worn (warning)
  > 90%      → at_limit (alert + auto-create maintenance)

ENDPOINTS:
  POST /maintenance-orders                    → create
  POST /maintenance-orders/:id/start          → equipment → maintenance
  POST /maintenance-orders/:id/complete       → equipment → available
  GET  /tools/:id/wear                        → current wear status
  POST /tools/:id/replace                     → replace + reset cycles
```

---

## 🏭 Industrial Operations quick reference (NEW v1.2)

```
ENTITIES (7):
  ProductionRecord            Per-piece record (1 cycle = 1+ records)
  CycleExecution              Cycle metadata
  ContinuousProductionRun     Long-running continuous process
  ContinuousProductionLog     Periodic readings (time-series)
  Sample                      Sample for testing
  SampleTestResult            Test outcome on sample
  FAI                         First Article Inspection
  WIPContainer                Buffer container between phases
  Subassembly                 Sub-component pre-assembled

PRODUCTION MODE (2):
  discrete    → 1 cycle = 1 piece (or N if multi-output)
  continuous  → continuous output, periodic logging

MULTI-OUTPUT TYPE (3):
  none      → 1:1 (default)
  fixed     → 1:N (e.g., 1 mold = 4 cavities)
  variable  → 1:M variable (extrusion → cuts)

SAMPLE TYPE (4):
  first_article | periodic | lot_certification | customer_request

SAMPLE STATUS:
  pending_test → testing → passed / failed → archived

FAI WORKFLOW:
  initiate → in_progress → approved (unblock production)
                       ↘ rejected (production stays blocked)

LOT HOLD:
  apply (lot → quarantine) → released (approved/rejected/conditional)

KEY RULES:
  • Continuous: store time-series, not per-cycle
  • Sample: separate counter from production
  • FAI: blocks production until approved
  • Hold: blocks downstream consumption
  • WIP: tracks buffer location
  • Subassembly: BOM nesting allowed

ENDPOINTS:
  POST /cycles/:id/complete       → multi-output
  POST /continuous/start/stop     → continuous prod
  POST /samples                   → take sample
  POST /samples/:id/test-result   → record test
  POST /fai                       → initiate
  POST /fai/:id/approve           → quality role only
  POST /lots/:id/hold             → apply hold
  POST /holds/:id/release         → quality role only
```

---

## 🏎️ CFRP Module quick reference (NEW v1.2)

```
ENTITIES (5):
  Mold                    Tracked asset, cycle count, lifecycle
  PrepregRoll             Prepreg roll with out-time tracking
  PrepregOutTimeRecord    Each "out" period tracked cumulatively
  CureCycleRun            Autoclave run (4-8h long)
  CureCycleTelemetry      Time-series sensor data
  NDTResult               Non-destructive test result

MOLD STATUS (5):
  available → in_use → cleaning → maintenance → decommissioned

PREPREG STORAGE STATE (4):
  frozen (-18°C) | refrigerated (4°C) | out (room temp) | expired

OUT-TIME TRACKING:
  Cumulative across multiple "out" periods
  Total life: 10-30 days at room temp typically
  System blocks usage if exceeded

CURE CYCLE PHASES (5):
  vacuum_pre_cure → heating_ramp → dwell → cooling_ramp → depressurization
  Total: 4-8 hours typically

NDT TEST TYPES (4):
  ultrasonic_c_scan | dimensional | weight | visual_inspection

KEY RULES:
  • Mold cycles count auto-increment, no manual edit
  • Prepreg out-time check MANDATORY before lay-up
  • Cure cycle telemetry every 30 sec via background job
  • NDT result linked to specific piece (genealogy)
  • Vacuum tightness check before autoclave
  • Pieces in same cure cycle share same telemetry archive

ENDPOINTS:
  POST /molds/:id/use                → use for cycle (auto-increment)
  POST /molds/:id/replace            → end-of-life replacement
  POST /prepreg/:id/take-out         → start out-time
  POST /prepreg/:id/return           → stop out-time
  POST /cure-cycles                  → start cycle
  POST /cure-cycles/:id/complete     → end + archive telemetry
  POST /ndt-results                  → record inspection
```

---

## 🦺 Safety Devices Module quick reference (NEW v1.2)

```
ENTITIES (5):
  ReflectanceTest                  Measurement vs ECE-R104 thresholds
  HomologationCertificate          Certificate with validity period
  AgingTestSpecimen                Sample in aging chamber
  AgingTestRecord                  Test progress (long-running)
  LaminationRecord                 Laminate quality result

REFLECTANCE THRESHOLDS (cd/lx/m² minimum):
  white    → 250 (at 0.33° obs / 5° entrance)
  yellow   → 175
  red      → 60
  
RESULT CLASSIFICATION:
  pass      → ≥ threshold
  marginal  → 90-100% threshold (warning)
  fail      → < 90% threshold (block)

HOMOLOGATION STATUS (4):
  valid → expiring_soon (< 90 days) → expired → withdrawn

HOMOLOGATION MARKING FORMAT:
  E{country}-104R-{cert_number}/{year}
  Example: E3-104R-001234/2026 (Italy)

AGING TEST TYPES (5):
  quv_uv_exposure (1000-2000h) | salt_spray (168-500h) 
  thermal_cycling | humidity (1000h) | combined

LAMINATION RESULT (3):
  passed | bubbles_detected | delamination

KEY RULES:
  • Reflectance fail → block shipping
  • Marginal → requires QC manager approval
  • Marking generation requires VALID certificate
  • Expired certificate → auto-stop production
  • Aging tests run for weeks, periodic check
  • Cross-cut test (ASTM D3359) for adhesion

ENDPOINTS:
  POST /reflectance-tests          → record test
  POST /homologation-certs         → register cert
  GET  /homologation/expiring      → certificates expiring soon
  POST /aging-specimens            → start aging
  POST /aging-specimens/:id/check  → periodic check
```

---

## 🎬 11 step execution states

```
FLUSSO OK (6):
  idle → ready → in_progress → paused ↔ in_progress → complete
                                                      ↓
                                                   retry → in_progress

FLUSSO KO (5):
  error    (technical/system error)
  failed   (device/test NOK outcome)
  warning  (non-blocking anomaly)
  timeout  (max time exceeded)
  offline  (device unreachable)
```

---

## 🔗 Cross-references

- **Domain knowledge** → `MASTER_SPECIFICATION.md`
- **Implementation patterns** → `BEST_PRACTICES.md`
- **Quick lookup** → this file
- **Architectural decisions** → `/docs/adr/`
- **API specs** → `/api/docs` (auto-generated)
- **Component library** → Storybook (when available)

---

## 📚 Pre-commit checklist

Before `git commit`:
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] No `console.log` left
- [ ] No `any` types
- [ ] Translations IT + EN added (if new strings)
- [ ] Conventional commit message

Husky pre-commit hook auto-runs lint-staged on changed files.

---

## 🚨 If you're stuck

1. **Check this file** for the pattern
2. **Search the codebase** for similar implementations
3. **Read the relevant section** in `BEST_PRACTICES.md`
4. **Read the domain context** in `MASTER_SPECIFICATION.md`
5. **Check ADRs** in `/docs/adr/` for architectural decisions
6. **Open an ADR** if making a new architectural decision

---

**END OF CONVENTIONS**

> Keep this file open while coding. Update it when adding new patterns that should be quickly accessible.

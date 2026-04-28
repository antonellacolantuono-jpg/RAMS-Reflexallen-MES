# BEST PRACTICES

> **Project**: MES (Manufacturing Execution System) v2 — ISA-95 Compliant
> **Document type**: Technical Implementation Standards (the HOW)
> **Audience**: Engineering team, Code reviewers, Claude Code
> **Companion documents**: `MASTER_SPECIFICATION.md` (the WHAT), `CONVENTIONS.md` (quick reference)
> **Version**: 1.2
> **Last updated**: 2026-04-27
> **Maintainers**: Engineering Lead
>
> **Changelog**:
> - v1.2 (2026-04-27): Added patterns for v1.2 features: WO Assignment, Maintenance, Tool Wear, Multi-output cycles, Sample taking, FAI, WIP, Subassembly, Quality Hold/Release, Equipment State Machine. Added CFRP Module patterns (Mold, Out-time, Cure Cycles, NDT) and Safety Devices Module patterns (Reflectance, Homologation, Lamination).
> - v1.1 (2026-04-26): Added Box Management patterns, BoxType/Box/BoxContent entities, packaging group implementation
> - v1.0 (2026-04-26): Initial version

---

## How to read this document

This is the **technical execution standard** for the MES project. It defines coding patterns, naming conventions, architectural patterns, and quality gates.

This document answers: **"How do we build it?"**
The companion `MASTER_SPECIFICATION.md` answers: **"What does the system do?"**

**Always attach this document** as context when prompting Claude Code, alongside `MASTER_SPECIFICATION.md`.

When generating or reviewing code, **every rule here is enforceable**. If a deviation is needed, it must be justified in the PR and added to the Decision Log section.

---

## Table of Contents

1. [Quick Reference](#1-quick-reference)
2. [Project Conventions](#2-project-conventions)
3. [Frontend Patterns](#3-frontend-patterns)
4. [Backend Patterns](#4-backend-patterns)
5. [Database Conventions](#5-database-conventions)
6. [API Design](#6-api-design)
7. [Type Safety](#7-type-safety)
8. [Error Handling](#8-error-handling)
9. [Logging & Observability](#9-logging--observability)
10. [Security](#10-security)
11. [Resilience Patterns](#11-resilience-patterns)
12. [Caching Strategy](#12-caching-strategy)
13. [State Management](#13-state-management)
14. [Real-time Sync Implementation](#14-real-time-sync-implementation)
15. [Performance](#15-performance)
16. [Accessibility](#16-accessibility)
17. [Internationalization](#17-internationalization)
18. [Testing Strategy](#18-testing-strategy)
19. [Universal Components Patterns](#19-universal-components-patterns)
20. [HMI Shop Floor Patterns](#20-hmi-shop-floor-patterns)
21. [MES Domain Implementation](#21-mes-domain-implementation)
22. [Git Workflow](#22-git-workflow)
23. [CI/CD Standards](#23-cicd-standards)
24. [Documentation Standards](#24-documentation-standards)
25. [Common Pitfalls](#25-common-pitfalls)
26. [Decision Log Index](#26-decision-log-index)

---

## 1. Quick Reference

### Stack at a glance

```
Backend:    NestJS + TypeScript + Prisma + PostgreSQL + Redis + Socket.IO
Frontend:   Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
State:      TanStack Query (server) + Zustand (client) + RHF (forms) + XState (machines)
Validation: Zod (shared FE/BE in /packages/shared)
Testing:    Vitest (unit) + Playwright (e2e)
Deploy:     Docker + Turbo monorepo
```

### Always

- ✅ TypeScript strict mode, NO `any`
- ✅ Zod schemas in `/packages/shared`, used by both FE and BE
- ✅ Soft delete via `deletedAt`, never hard DELETE
- ✅ Timestamps always `TIMESTAMPTZ`, UTC stored
- ✅ Multi-tenant: every transactional entity has `plantId`
- ✅ Standard audit fields: createdAt, createdBy, updatedAt, updatedBy
- ✅ `<EntityImage>` for entity images, never raw `<img>`
- ✅ State machines in XState for non-trivial lifecycles
- ✅ Server-side validation always (client-side is UX only)
- ✅ Loading/Empty/Error states for every data view
- ✅ `useQuery` for server state, never `useState` for fetched data
- ✅ Translations via next-intl, never hardcoded strings
- ✅ Conventional commits (`feat:`, `fix:`, `chore:`, ...)
- ✅ **Box capacity validation**: hard block weight/volume, warning units count
- ✅ **Sealed boxes are immutable**: opening requires `open_sealed_box` action with reason
- ✅ **Track box cycles** on every return-to-empty for returnables
- ✅ **Use `<BoxStatusBadge>` and `<BoxFillIndicator>`** for box visualizations
- ✅ **WO Assignment with skills coverage check** automatic before activation (v1.2)
- ✅ **Equipment State Machine** XState formal (8 states), no free enum (v1.2)
- ✅ **Multi-output cycles**: distinguish 1-cycle-N-pieces from 1-cycle-1-piece in counters (v1.2)
- ✅ **Sample tracking** separate from main production count (v1.2)
- ✅ **FAI as formal step** with QC sign-off + supervisor approval (v1.2)
- ✅ **Maintenance Order** for any equipment intervention with status tracking (v1.2)
- ✅ **Tool wear** auto-incremented on usage, threshold alerts (v1.2)
- ✅ **Quality Hold blocks downstream** consumption of held lots (v1.2)
- ✅ **Continuous production** mode for extrusion/lamination (v1.2)
- ✅ **Subassembly nested BOM** support with multi-level explosion (v1.2)
- ✅ **WIP container tracking** for buffer phases (v1.2)
- ✅ **Prepreg out-time cumulative** tracking for CFRP (v1.2)
- ✅ **Mold cycles count** auto-increment on use (v1.2 CFRP)
- ✅ **Cure cycle telemetry** stored as time-series with multiple sensors (v1.2 CFRP)
- ✅ **Reflectance test** linked to lot per ECE-R104 compliance (v1.2 Safety)
- ✅ **Homologation marking** generated with formula `E{country}-104R-{seq}/{year}` (v1.2 Safety)

### Never

- ❌ `any` in TypeScript (use `unknown` if truly unknown)
- ❌ Inline styles (use Tailwind utilities)
- ❌ `console.log` in committed code (use Pino logger)
- ❌ Hardcoded user-facing strings (always i18n)
- ❌ Direct Prisma calls in controllers (use service → repository)
- ❌ Cross-domain database access (use service contracts)
- ❌ `useEffect` for data fetching (use TanStack Query)
- ❌ Default exports for components (use named exports)
- ❌ Magic numbers (extract to named constants)
- ❌ Mutations without optimistic UI for frequent operations
- ❌ Skip plant_id filter on transactional queries
- ❌ Float for monetary or quantity values (use Decimal/Numeric)
- ❌ **Modify contents of a sealed box** without `open_sealed_box` audit
- ❌ **Bypass box capacity validation** (especially weight/volume hard blocks)
- ❌ **Pack into damaged box** (status `damaged` is terminal)
- ❌ **Reset cycles count manually** (must go through full lifecycle)
- ❌ **Hard-code box types** (always reference BoxType registry)
- ❌ **Use prepreg without out-time check** (CFRP: scrap risk, mandatory validation)
- ❌ **Skip vacuum tightness test** before autoclave loading (CFRP: scrap entire cycle)
- ❌ **Reflectance below threshold** without QC review (Safety: ECE-104 violation)
- ❌ **Manual marking ECE** without homologation reference (Safety: legal risk)
- ❌ **Modify mold cycle count** manually (always increment via use, audit trail)
- ❌ **Activate WO Assignment** without skills coverage check (v1.2)
- ❌ **Sample counter** mixed with production counter (v1.2: keep separate)
- ❌ **Mark FAI passed** without quality role approval (v1.2)
- ❌ **Released lot still in QualityHold** (v1.2: hold blocks consumption)
- ❌ **Continuous production tracked as discrete** (v1.2: use proper mode)

### Folder structure overview

```
/apps
  /api          NestJS backend
  /web          Next.js frontend (back-office + HMI)
/packages
  /shared       Types, Zod schemas, enums, state machines
  /database     Prisma schema, migrations, seed
  /ui           Shared UI components (optional)
/docs           Documentation (this file, master spec, ADRs)
```

---

## 2. Project Conventions

### 2.1 File naming

**Frontend (Next.js)**:

| Type | Convention | Example |
|---|---|---|
| Components | `PascalCase.tsx` | `WorkOrderCard.tsx` |
| Hooks | `useCamelCase.ts` | `useWorkOrder.ts` |
| Utilities | `camelCase.ts` | `formatDuration.ts` |
| Types | `kebab-case.types.ts` | `work-order.types.ts` |
| Constants | `kebab-case.constants.ts` | `step-categories.constants.ts` |
| Routes (App Router) | `kebab-case/page.tsx` | `work-orders/[id]/page.tsx` |
| Tests | `*.test.ts(x)` | `WorkOrderCard.test.tsx` |
| Stories | `*.stories.tsx` | `Button.stories.tsx` |

**Backend (NestJS)**:

| Type | Convention | Example |
|---|---|---|
| Modules | `kebab-case/` folder | `work-orders/` |
| Controllers | `*.controller.ts` | `work-orders.controller.ts` |
| Services | `*.service.ts` | `work-orders.service.ts` |
| Repositories | `*.repository.ts` | `work-orders.repository.ts` |
| DTOs | `*.dto.ts` | `create-work-order.dto.ts` |
| Entities | `*.entity.ts` | `work-order.entity.ts` |
| Guards | `*.guard.ts` | `roles.guard.ts` |
| Decorators | `*.decorator.ts` | `roles.decorator.ts` |

### 2.2 Variable and function naming

```typescript
// ✅ Good
const isLoading = false
const hasPermission = true
const shouldShowModal = false
const userData: User | null = null
const MAX_RETRY_COUNT = 3
const API_BASE_URL = '/api/v1'

function fetchWorkOrders() {}
function validateEmailFormat() {}
function calculateOEE() {}

// ❌ Bad
const flag = false                  // vague
const data = null                   // generic
const x = 0                         // meaningless
function doThing() {}               // unclear
function process() {}               // generic
```

**Rules**:
- Booleans: `is`, `has`, `should`, `can`, `did` prefix
- Functions: verb + noun (action-focused)
- Constants: `SCREAMING_SNAKE_CASE`
- React components: `PascalCase`
- Types/Interfaces: `PascalCase`
- Variables: `camelCase`
- No abbreviations except universally known (`id`, `url`, `api`)

### 2.3 Import order

```typescript
// 1. Node built-ins
import path from 'node:path'

// 2. External packages (alphabetical)
import { Module } from '@nestjs/common'
import clsx from 'clsx'
import { z } from 'zod'

// 3. Internal packages (workspace)
import { WorkOrderSchema } from '@mes/shared/schemas'
import { prisma } from '@mes/database'

// 4. Relative imports (from far to near)
import { AuthGuard } from '../../auth/guards/auth.guard'
import { CreateWorkOrderDto } from '../dto/create-work-order.dto'
import { WorkOrderService } from './work-orders.service'

// 5. Type-only imports last
import type { User } from '@mes/shared/types'
```

ESLint enforces this with `eslint-plugin-import`.

### 2.4 Folder structure (frontend feature)

```
/apps/web/components/features/work-orders/
├── WorkOrderCard.tsx
├── WorkOrderCard.test.tsx
├── WorkOrderList.tsx
├── WorkOrderForm.tsx
├── hooks/
│   ├── useWorkOrders.ts
│   └── useWorkOrderActions.ts
├── lib/
│   ├── workOrderHelpers.ts
│   └── workOrderHelpers.test.ts
└── index.ts                    // barrel export (named only)
```

### 2.5 Folder structure (backend module)

```
/apps/api/src/modules/work-orders/
├── work-orders.module.ts
├── work-orders.controller.ts
├── work-orders.service.ts
├── work-orders.repository.ts
├── dto/
│   ├── create-work-order.dto.ts
│   ├── update-work-order.dto.ts
│   └── release-work-order.dto.ts
├── events/
│   └── work-order.events.ts
├── guards/
│   └── work-order-permission.guard.ts
└── tests/
    ├── work-orders.controller.spec.ts
    └── work-orders.service.spec.ts
```

---

## 3. Frontend Patterns

### 3.1 Server Components vs Client Components (Next.js 14)

**Default to Server Components**. Use `'use client'` only when necessary.

```typescript
// ✅ Server Component (default) — for data fetching, SSR, SEO
// app/work-orders/page.tsx
import { getWorkOrders } from '@/lib/api/work-orders'

export default async function WorkOrdersPage() {
  const workOrders = await getWorkOrders()
  return <WorkOrderList initialData={workOrders} />
}

// ✅ Client Component — for interactivity, state, browser APIs
// components/features/work-orders/WorkOrderList.tsx
'use client'

import { useQuery } from '@tanstack/react-query'

export function WorkOrderList({ initialData }: Props) {
  const { data } = useQuery({
    queryKey: ['workOrders'],
    queryFn: fetchWorkOrders,
    initialData
  })
  return <div>{/* interactive UI */}</div>
}
```

**Rules**:
- Use Server Components for: pages, layouts, data fetching, static content
- Use Client Components for: state, effects, browser APIs, event handlers
- Pass server-fetched data as `initialData` to client components for hydration
- Keep `'use client'` boundary as deep as possible

### 3.2 Component composition

**Prefer composition over inheritance**. Use compound components for complex UI.

```typescript
// ✅ Good — composable
<Card>
  <Card.Header>
    <Card.Title>Work Order #2026-0142</Card.Title>
    <Card.Actions>
      <Button>Release</Button>
    </Card.Actions>
  </Card.Header>
  <Card.Content>
    {/* content */}
  </Card.Content>
  <Card.Footer>
    <Button variant="ghost">Cancel</Button>
  </Card.Footer>
</Card>

// ❌ Bad — too many props
<Card 
  title="Work Order #2026-0142"
  showHeader={true}
  headerActions={<Button>Release</Button>}
  content={<div>...</div>}
  footerLeft={<Button>Cancel</Button>}
/>
```

### 3.3 Component structure

```typescript
// ✅ Good component pattern
import { type ReactNode } from 'react'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

/**
 * Displays a Work Order card with status badge, key metrics, and action buttons.
 * Used in WorkOrderList grid view and dashboard widgets.
 *
 * @example
 * <WorkOrderCard 
 *   workOrder={wo} 
 *   onRelease={handleRelease}
 *   variant="compact"
 * />
 */
interface WorkOrderCardProps {
  workOrder: WorkOrder
  onRelease?: (woId: string) => void
  onCancel?: (woId: string) => void
  variant?: 'default' | 'compact' | 'detailed'
  className?: string
}

export function WorkOrderCard({ 
  workOrder, 
  onRelease,
  onCancel,
  variant = 'default',
  className
}: WorkOrderCardProps) {
  const t = useTranslations('workOrders')
  const [isReleasing, setIsReleasing] = useState(false)
  
  const handleRelease = async () => {
    if (!onRelease) return
    setIsReleasing(true)
    try {
      await onRelease(workOrder.id)
    } finally {
      setIsReleasing(false)
    }
  }
  
  return (
    <Card className={cn('p-4', className)}>
      {/* component JSX */}
    </Card>
  )
}
```

**Rules**:
- Named exports only (no `export default`)
- Props interface above component
- JSDoc for non-trivial components with `@example`
- Default props via destructuring
- One component per file
- Component < 200 lines (split if larger)

### 3.4 Custom hooks

```typescript
// ✅ Good — single responsibility, reusable
export function useWorkOrder(workOrderId: string) {
  return useQuery({
    queryKey: ['workOrder', workOrderId],
    queryFn: () => fetchWorkOrder(workOrderId),
    enabled: !!workOrderId
  })
}

export function useReleaseWorkOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: releaseWorkOrder,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] })
      queryClient.invalidateQueries({ queryKey: ['workOrder', variables.id] })
      toast.success('Work Order released')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    }
  })
}
```

**Rules**:
- Hooks named with `use` prefix
- One hook = one responsibility
- Co-locate with feature folder
- Return consistent shape (data, loading, error, actions)
- Memoize callbacks if passed to child components

### 3.5 Forms with React Hook Form + Zod

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateWorkOrderSchema } from '@mes/shared/schemas'
import type { CreateWorkOrderInput } from '@mes/shared/types'

export function CreateWorkOrderForm({ onSuccess }: Props) {
  const form = useForm<CreateWorkOrderInput>({
    resolver: zodResolver(CreateWorkOrderSchema),
    defaultValues: {
      itemId: '',
      qtyTarget: 0,
      priority: 'normal'
    }
  })
  
  const mutation = useCreateWorkOrder()
  
  const onSubmit = async (data: CreateWorkOrderInput) => {
    try {
      const result = await mutation.mutateAsync(data)
      onSuccess?.(result)
      form.reset()
    } catch (error) {
      // Server validation errors map back to fields
      mapServerErrorsToForm(error, form)
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="itemId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('item')}</FormLabel>
              <FormControl>
                <ItemSelect {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* more fields */}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? t('creating') : t('create')}
        </Button>
      </form>
    </Form>
  )
}
```

**Rules**:
- Always use Zod resolver for type-safe forms
- Schemas live in `/packages/shared/schemas`
- Validation modes:
  - `onChange` for search inputs
  - `onBlur` for typical forms (default)
  - `onSubmit` for critical/long forms
- Server validation errors mapped to form fields
- Auto-save drafts to localStorage every 5s for long forms
- Disable submit during pending mutations

### 3.6 shadcn/ui usage

Build on top of shadcn/ui primitives, customize via Tailwind:

```typescript
// ✅ Good — extend shadcn/ui Button
import { Button as ShadcnButton } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ComponentProps<typeof ShadcnButton> {
  loading?: boolean
  icon?: React.ReactNode
}

export function Button({ loading, icon, children, disabled, ...props }: ButtonProps) {
  return (
    <ShadcnButton disabled={disabled || loading} {...props}>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : icon && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
    </ShadcnButton>
  )
}
```

**Rules**:
- shadcn components in `/components/ui/`
- Custom variants via `cva` (class-variance-authority)
- Don't fight Radix/shadcn primitives, extend them
- Tokens (colors, spacing) via Tailwind config
- Dark mode ready: use semantic tokens (`bg-background`, `text-foreground`)

---

## 4. Backend Patterns

### 4.1 Module structure (NestJS)

```typescript
// work-orders.module.ts
import { Module } from '@nestjs/common'
import { WorkOrdersController } from './work-orders.controller'
import { WorkOrdersService } from './work-orders.service'
import { WorkOrdersRepository } from './work-orders.repository'
import { DatabaseModule } from '@/database/database.module'
import { EventsModule } from '@/events/events.module'
import { AuthModule } from '@/auth/auth.module'

@Module({
  imports: [DatabaseModule, EventsModule, AuthModule],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService, WorkOrdersRepository],
  exports: [WorkOrdersService]  // only export service, not repository
})
export class WorkOrdersModule {}
```

**Rules**:
- One module per bounded context
- Module exports only services (service layer is the public contract)
- Repositories are internal to module
- Cross-module access only through service interfaces

### 4.2 Layered architecture

```
Controller  →  Service  →  Repository  →  Database
   │              │             │
   │              │             └── Prisma queries only
   │              └── Business logic, transactions, events
   └── HTTP concerns only (validation, auth, response shape)
```

```typescript
// ✅ Controller — thin, HTTP concerns only
@Controller('work-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkOrdersController {
  constructor(private readonly service: WorkOrdersService) {}
  
  @Post()
  @Roles('admin', 'planner')
  @RequirePermission('workOrder.create')
  async create(
    @Body(new ZodValidationPipe(CreateWorkOrderSchema)) dto: CreateWorkOrderInput,
    @CurrentUser() user: User,
    @Plant() plantId: string
  ) {
    return this.service.create(dto, { userId: user.id, plantId })
  }
  
  @Post(':id/release')
  @Roles('admin', 'planner', 'supervisor')
  @RequirePermission('workOrder.release')
  @Audit('workOrder.release')
  async release(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Plant() plantId: string
  ) {
    return this.service.release(id, { userId: user.id, plantId })
  }
}

// ✅ Service — business logic, orchestration, transactions
@Injectable()
export class WorkOrdersService {
  constructor(
    private readonly repository: WorkOrdersRepository,
    private readonly events: EventEmitter2,
    private readonly autoGen: AutoGenerationService,
    private readonly serials: SerialsService,
    private readonly logger: Logger
  ) {}
  
  async release(id: string, ctx: RequestContext): Promise<WorkOrder> {
    // 1. Load
    const wo = await this.repository.findByIdOrThrow(id, ctx.plantId)
    
    // 2. Validate state machine
    if (wo.status !== 'planned') {
      throw new InvalidStateTransitionException('release', wo.status)
    }
    
    // 3. Validate prerequisites
    const validation = await this.validateRelease(wo)
    if (!validation.valid) {
      throw new WorkOrderNotReleasableException(validation.errors)
    }
    
    // 4. Execute in transaction
    const released = await this.repository.transaction(async (tx) => {
      const updated = await this.repository.update(
        id, 
        { status: 'released', releasedAt: new Date() },
        ctx,
        tx
      )
      
      // Generate setup
      await this.autoGen.generateSetupForWorkOrder(updated.id, tx)
      
      // Allocate serials if needed
      if (updated.trackingMode === 'serial') {
        await this.serials.allocateRange(updated, tx)
      }
      
      return updated
    })
    
    // 5. Emit events (after transaction commits)
    this.events.emit('workOrder.released', { workOrder: released, ctx })
    
    return released
  }
}

// ✅ Repository — Prisma queries only, no business logic
@Injectable()
export class WorkOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}
  
  async findById(id: string, plantId: string): Promise<WorkOrder | null> {
    return this.prisma.workOrder.findFirst({
      where: { id, plantId, deletedAt: null }
    })
  }
  
  async findByIdOrThrow(id: string, plantId: string): Promise<WorkOrder> {
    const wo = await this.findById(id, plantId)
    if (!wo) throw new NotFoundException(`Work Order ${id} not found`)
    return wo
  }
  
  async update(
    id: string, 
    data: Partial<WorkOrder>, 
    ctx: RequestContext,
    tx?: PrismaTransactionClient
  ): Promise<WorkOrder> {
    const client = tx ?? this.prisma
    return client.workOrder.update({
      where: { id, plantId: ctx.plantId },
      data: {
        ...data,
        updatedAt: new Date(),
        updatedBy: ctx.userId,
        version: { increment: 1 }
      }
    })
  }
  
  async transaction<T>(fn: (tx: PrismaTransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn, {
      isolationLevel: 'Serializable',
      timeout: 10000
    })
  }
}
```

### 4.3 DTOs with Zod validation

```typescript
// /packages/shared/schemas/work-order.schemas.ts
import { z } from 'zod'

export const CreateWorkOrderSchema = z.object({
  itemId: z.string().uuid(),
  workflowId: z.string().uuid(),
  qtyTarget: z.number().int().positive().max(1000000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  type: z.enum(['production', 'rework', 'prototype']).default('production'),
  plannedStart: z.string().datetime().optional(),
  plannedEnd: z.string().datetime().optional(),
  notes: z.string().max(1000).optional()
})

export type CreateWorkOrderInput = z.infer<typeof CreateWorkOrderSchema>

// /apps/api/src/modules/work-orders/dto/create-work-order.dto.ts
export { CreateWorkOrderSchema, type CreateWorkOrderInput } from '@mes/shared/schemas'
```

### 4.4 Custom decorators

```typescript
// @Plant() decorator — extracts plant context from request
export const Plant = createParamDecorator(
  (_, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest()
    const plantId = request.user?.activePlantId
    if (!plantId) throw new UnauthorizedException('No active plant')
    return plantId
  }
)

// @CurrentUser() decorator — extracts authenticated user
export const CurrentUser = createParamDecorator(
  (_, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest()
    return request.user
  }
)

// @Roles() decorator — declarative role check
export const ROLES_KEY = 'roles'
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles)

// @RequirePermission() decorator — fine-grained permission
export const PERMISSION_KEY = 'permission'
export const RequirePermission = (perm: string) => SetMetadata(PERMISSION_KEY, perm)

// @Audit() decorator — auto-log to audit table
export const AUDIT_KEY = 'audit'
export const Audit = (action: string) => SetMetadata(AUDIT_KEY, action)

// @Idempotent() decorator — idempotency key handling
export const Idempotent = (options: { ttl: string }) => 
  SetMetadata('idempotent', options)
```

### 4.5 Domain events

Use NestJS EventEmitter2 for in-process domain events:

```typescript
// Event names: {entity}.{action} (camelCase)
// /packages/shared/events/event-names.ts
export const EVENTS = {
  workOrder: {
    created: 'workOrder.created',
    planned: 'workOrder.planned',
    released: 'workOrder.released',
    started: 'workOrder.started',
    completed: 'workOrder.completed',
    cancelled: 'workOrder.cancelled',
    statusChanged: 'workOrder.statusChanged'
  },
  step: {
    started: 'step.started',
    completed: 'step.completed',
    failed: 'step.failed'
  },
  // ... etc
} as const

// Emit in service
@Injectable()
export class WorkOrdersService {
  async release(id: string, ctx: RequestContext) {
    const wo = await this.repository.update(...)
    this.events.emit(EVENTS.workOrder.released, { workOrder: wo, ctx })
    return wo
  }
}

// Listen in handler
@Injectable()
export class WorkOrderEventHandler {
  @OnEvent(EVENTS.workOrder.released)
  async handleReleased(payload: { workOrder: WorkOrder; ctx: RequestContext }) {
    // Side effects:
    // - Notify operators
    // - Update dashboard cache
    // - Broadcast via Socket.IO
    await this.realtimeGateway.broadcast(
      `plant:${payload.workOrder.plantId}`,
      EVENTS.workOrder.released,
      { workOrderId: payload.workOrder.id }
    )
  }
}
```

**Rules**:
- Event names: `{entity}.{action}` camelCase
- Centralized registry of event names in `/packages/shared/events/`
- Emit AFTER transaction commits (not inside)
- Handlers should be idempotent (events may be replayed)
- Heavy work in handlers should be queued (BullMQ)

### 4.6 Background jobs (BullMQ)

```typescript
// Queue definition
@Injectable()
export class AutoGenQueue {
  constructor(
    @InjectQueue('autoGen') private readonly queue: Queue
  ) {}
  
  async generateSetup(workflowId: string) {
    return this.queue.add('generate-setup', { workflowId }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 1000
    })
  }
}

// Processor
@Processor('autoGen')
export class AutoGenProcessor {
  constructor(private readonly autoGenService: AutoGenerationService) {}
  
  @Process('generate-setup')
  async handleGenerateSetup(job: Job<{ workflowId: string }>) {
    const { workflowId } = job.data
    await this.autoGenService.regenerateSetup(workflowId)
  }
}
```

**Use queues for**:
- Heavy computations (auto-generation, report generation)
- External API calls (notifications, ERP sync)
- Scheduled tasks (recurring tasks, periodic cleanup)
- Retryable operations

### 4.7 Box service pattern (NEW v1.1)

Box operations require careful transaction management because:
- Capacity validation must be atomic
- Content addition updates denormalized fields
- State transitions must respect XState rules

```typescript
@Injectable()
export class BoxesService {
  constructor(
    private readonly boxRepo: BoxesRepository,
    private readonly contentRepo: BoxContentsRepository,
    private readonly events: EventEmitter2,
    private readonly prisma: PrismaService
  ) {}
  
  /**
   * Pack an item into a box with full capacity validation.
   * Atomic operation: validates, updates content, updates denormalized fields.
   */
  async packIntoBox(
    boxId: string,
    payload: PackIntoBoxInput,
    ctx: RequestContext
  ): Promise<Box> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Load box + type with row lock
      const box = await tx.box.findFirst({
        where: { id: boxId, plantId: ctx.plantId },
        include: { type: true }
      })
      
      if (!box) throw new NotFoundException('Box', boxId)
      
      // 2. State validation
      if (box.status === 'sealed') {
        throw new InvalidBoxStateException(
          'Cannot pack into sealed box. Use open_sealed_box first with reason.'
        )
      }
      
      if (box.status === 'damaged') {
        throw new InvalidBoxStateException('Cannot pack into damaged box.')
      }
      
      // 3. Capacity validation — HARD BLOCK on weight/volume
      const newUnits = box.currentUnits + payload.quantity
      const newWeight = Number(box.currentWeightKg) + payload.weightKg
      
      if (newWeight > Number(box.type.maxWeightKg)) {
        throw new BoxCapacityExceededException(
          `Weight ${newWeight}kg exceeds max ${box.type.maxWeightKg}kg`,
          { kind: 'weight', current: newWeight, max: box.type.maxWeightKg }
        )
      }
      
      // SOFT BLOCK on units count (warning + override)
      if (newUnits > box.type.maxUnits && !payload.overrideCapacity) {
        throw new BoxCapacityWarningException(
          `Units ${newUnits} exceeds max ${box.type.maxUnits}`,
          { kind: 'units', current: newUnits, max: box.type.maxUnits, overridable: true }
        )
      }
      
      // 4. Validate content tracking mode
      this.validateContentTracking(box.type.contentTrackingMode, payload)
      
      // 5. Create BoxContent record
      const content = await tx.boxContent.create({
        data: {
          boxId: box.id,
          itemId: payload.itemId,
          serialNumber: payload.serialNumber,
          lotNumber: payload.lotNumber,
          quantity: payload.quantity,
          addedBy: ctx.userId,
          validatedScan: payload.scanValidated ?? false
        }
      })
      
      // 6. Update box (denormalized fields + status)
      const newStatus = this.computeNewStatus(box, newUnits, box.type)
      const updated = await tx.box.update({
        where: { id: box.id, version: box.version },
        data: {
          currentUnits: newUnits,
          currentWeightKg: newWeight,
          status: newStatus,
          updatedBy: ctx.userId,
          version: { increment: 1 }
        }
      })
      
      // 7. Movement record (audit)
      await tx.boxMovement.create({
        data: {
          boxId: box.id,
          movementType: 'pack',
          workOrderId: payload.workOrderId,
          movedBy: ctx.userId,
          metadata: { contentId: content.id }
        }
      })
      
      return updated
    })
  }
  
  /**
   * Seal a box — generates seal number if required by BoxType.
   * Once sealed, contents are immutable.
   */
  async sealBox(
    boxId: string,
    payload: SealBoxInput,
    ctx: RequestContext
  ): Promise<Box> {
    const box = await this.boxRepo.findByIdOrThrow(boxId, ctx.plantId)
    
    if (box.isSealed) {
      throw new InvalidBoxStateException('Box already sealed')
    }
    
    if (!box.type.requiresSeal) {
      throw new InvalidBoxStateException('BoxType does not require sealing')
    }
    
    // Generate or accept seal number
    const sealNumber = payload.sealNumber ?? await this.generateSealNumber(ctx.plantId)
    
    // Validate format if BoxType has pattern
    if (box.type.sealNumberFormat) {
      const regex = new RegExp(box.type.sealNumberFormat)
      if (!regex.test(sealNumber)) {
        throw new ValidationException(
          `Seal number does not match required format: ${box.type.sealNumberFormat}`
        )
      }
    }
    
    const sealed = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.box.update({
        where: { id: boxId, version: box.version },
        data: {
          status: 'sealed',
          isSealed: true,
          sealNumber,
          sealedAt: new Date(),
          sealedBy: ctx.userId,
          updatedBy: ctx.userId,
          version: { increment: 1 }
        }
      })
      
      await tx.boxMovement.create({
        data: {
          boxId,
          movementType: 'seal',
          movedBy: ctx.userId,
          metadata: { sealNumber }
        }
      })
      
      return updated
    })
    
    this.events.emit('box.sealed', { box: sealed, ctx })
    return sealed
  }
  
  /**
   * Open a sealed box — REQUIRES reason, fully audited.
   * This is a sensitive operation: tracking who/why for compliance.
   */
  async openSealedBox(
    boxId: string,
    payload: OpenSealedBoxInput,
    ctx: RequestContext
  ): Promise<Box> {
    if (!payload.reason || payload.reason.trim().length < 10) {
      throw new ValidationException('Reason is required (min 10 chars) for opening sealed box')
    }
    
    // Special permission check
    if (!ctx.permissions.includes('box.openSealed')) {
      throw new InsufficientPermissionsException('box.openSealed')
    }
    
    // ... transaction to update status, log audit
    // Always emit `box.sealOpened` event
  }
  
  private computeNewStatus(
    box: Box, 
    newUnits: number, 
    type: BoxType
  ): BoxStatus {
    if (newUnits >= type.maxUnits) return 'full'
    if (newUnits > 0) return 'partially_filled'
    return 'empty'
  }
  
  private validateContentTracking(
    mode: ContentTrackingMode, 
    payload: PackIntoBoxInput
  ): void {
    if (mode === 'serial' && !payload.serialNumber) {
      throw new ValidationException('Serial number required for serial-tracked box type')
    }
    if (mode === 'quantity' && payload.serialNumber) {
      throw new ValidationException('Serial number not allowed for quantity-tracked box type')
    }
    // mode === 'mixed' allows either
  }
}
```

**Key patterns**:
- All operations are **transactional**
- **Optimistic locking** via `version` field
- **Capacity validation** in service layer (not just DB)
- **Movement records** for full audit trail
- **Events emitted** after commit
- **Special permission** for sensitive ops (open sealed box)

### 4.8 v1.2 Service patterns (summary reference)

The following service patterns are added in v1.2. Detailed implementations are in `docs/extensions/`:

**Core extensions** (applicable to all production lines):
- **WorkOrderAssignmentService** — assignment + skills coverage + reassignment + dispatch list
  - See `extensions/SCHEDULING_ASSIGNMENT.md`
- **MaintenanceOrderService** — preventive/corrective maintenance with equipment state transitions
  - See `extensions/EQUIPMENT_MANAGEMENT.md`
- **ToolWearService** — auto-increment cycles, threshold alerts, replacement workflow
  - See `extensions/EQUIPMENT_MANAGEMENT.md`
- **CycleExecutionService** — multi-output cycle handling (1 cycle → N pieces)
  - See `extensions/INDUSTRIAL_OPERATIONS.md`
- **ContinuousProductionService** — continuous production with periodic logging
  - See `extensions/INDUSTRIAL_OPERATIONS.md`
- **SampleService** — separate sample tracking from production count
  - See `extensions/INDUSTRIAL_OPERATIONS.md`
- **FAIService** — First Article Inspection with production block until approval
  - See `extensions/INDUSTRIAL_OPERATIONS.md`
- **QualityHoldService** — lot-level quarantine with downstream blocking
  - See `extensions/INDUSTRIAL_OPERATIONS.md`

**Line-specific extensions**:
- **MoldService** (CFRP) — mold lifecycle, cycle count, end-of-life detection
  - See `extensions/CFRP_MODULE.md`
- **CureCycleService** (CFRP) — autoclave long-running cycles with telemetry
  - See `extensions/CFRP_MODULE.md`
- **NDTService** (CFRP) — non-destructive testing results
  - See `extensions/CFRP_MODULE.md`
- **ReflectanceTestService** (Safety) — ECE-R104 compliance measurements
  - See `extensions/SAFETY_DEVICES_MODULE.md`
- **HomologationService** (Safety) — certificate management, marking generation
  - See `extensions/SAFETY_DEVICES_MODULE.md`

**Common patterns across all v1.2 services**:
- ✅ Atomic transactions for state changes + audit
- ✅ Optimistic locking (version field) for concurrent updates
- ✅ Domain events emitted **after** commit
- ✅ Permission checks via `@RequirePermission()` decorators
- ✅ Background jobs (BullMQ) for long-running monitoring
- ✅ Time-series logging for telemetry data (cure cycles, continuous production)

---

## 5. Database Conventions

### 5.1 Prisma schema standards

```prisma
// schema.prisma

model WorkOrder {
  // Primary key — UUID v7 if possible, else v4
  id          String   @id @default(uuid()) @db.Uuid
  
  // Multi-tenant — REQUIRED on all transactional entities
  plantId     String   @map("plant_id") @db.Uuid
  plant       Plant    @relation(fields: [plantId], references: [id], onDelete: Restrict)
  
  // Business fields
  code        String                    // e.g., "WO-2026-0142"
  itemId      String   @map("item_id") @db.Uuid
  workflowId  String   @map("workflow_id") @db.Uuid
  qtyTarget   Decimal  @map("qty_target") @db.Decimal(15, 4)
  qtyProduced Decimal  @default(0) @map("qty_produced") @db.Decimal(15, 4)
  qtyScrap    Decimal  @default(0) @map("qty_scrap") @db.Decimal(15, 4)
  qtyRework   Decimal  @default(0) @map("qty_rework") @db.Decimal(15, 4)
  
  // State
  status      WorkOrderStatus @default(draft)
  priority    WorkOrderPriority @default(normal)
  type        WorkOrderType @default(production)
  
  // Timestamps (always TIMESTAMPTZ)
  plannedStart DateTime? @map("planned_start") @db.Timestamptz(3)
  plannedEnd   DateTime? @map("planned_end") @db.Timestamptz(3)
  actualStart  DateTime? @map("actual_start") @db.Timestamptz(3)
  actualEnd    DateTime? @map("actual_end") @db.Timestamptz(3)
  releasedAt   DateTime? @map("released_at") @db.Timestamptz(3)
  
  // Audit fields — MANDATORY on every entity
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  createdBy   String   @map("created_by") @db.Uuid
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)
  updatedBy   String   @map("updated_by") @db.Uuid
  deletedAt   DateTime? @map("deleted_at") @db.Timestamptz(3)
  deletedBy   String?   @map("deleted_by") @db.Uuid
  version     Int      @default(1)  // optimistic locking
  
  // Relations
  item        Item       @relation(fields: [itemId], references: [id], onDelete: Restrict)
  workflow    Workflow   @relation(fields: [workflowId], references: [id], onDelete: Restrict)
  phases      WorkOrderPhase[]
  
  // Indexes
  @@unique([plantId, code])
  @@index([plantId, status, priority])
  @@index([plantId, deletedAt])
  @@index([itemId])
  @@index([releasedAt])
  
  // Naming
  @@map("work_orders")  // snake_case plural
}

enum WorkOrderStatus {
  draft
  planned
  released
  in_progress
  on_hold
  completed
  partially_completed
  closed
  cancelled
  
  @@map("work_order_status")
}
```

**Rules**:
- Tables: `snake_case`, **plural** (`work_orders`)
- Columns: `snake_case` in DB, `camelCase` in Prisma model
- Enums: PostgreSQL native enums, snake_case, mapped explicitly
- Decimals for quantities and money (15,4 precision)
- TIMESTAMPTZ for all timestamps (NEVER `TIMESTAMP`)
- Mandatory audit fields on every entity
- Indexes on FKs, status filters, and `(plantId, status)` composites

### 5.2 Multi-tenant queries

**Critical rule**: every query on transactional entities MUST filter by `plantId`.

```typescript
// ✅ Good
async findById(id: string, plantId: string) {
  return this.prisma.workOrder.findFirst({
    where: { id, plantId, deletedAt: null }
  })
}

// ❌ DANGEROUS — data leak between tenants
async findById(id: string) {
  return this.prisma.workOrder.findUnique({
    where: { id }
  })
}
```

**Enforcement**: 
- All repository methods take `plantId` as parameter
- `@Plant()` decorator extracts from request context
- Linting rule: warn on Prisma queries without `plantId`
- Tests verify isolation

### 5.3 Soft delete pattern

```typescript
// Always filter by deletedAt: null on reads
async findMany(plantId: string) {
  return this.prisma.workOrder.findMany({
    where: { plantId, deletedAt: null }
  })
}

// Soft delete (never hard DELETE)
async softDelete(id: string, ctx: RequestContext) {
  return this.prisma.workOrder.update({
    where: { id, plantId: ctx.plantId },
    data: {
      deletedAt: new Date(),
      deletedBy: ctx.userId
    }
  })
}

// Restore
async restore(id: string, ctx: RequestContext) {
  return this.prisma.workOrder.update({
    where: { id, plantId: ctx.plantId },
    data: {
      deletedAt: null,
      deletedBy: null,
      updatedBy: ctx.userId
    }
  })
}
```

### 5.4 Transactions

```typescript
// ✅ Use transactions for multi-table operations
async release(id: string, ctx: RequestContext) {
  return this.prisma.$transaction(async (tx) => {
    const wo = await tx.workOrder.update({...})
    await tx.workOrderPhase.createMany({...})
    await tx.serialNumber.createMany({...})
    await tx.activity.create({...})
    return wo
  }, {
    isolationLevel: 'Serializable',  // for critical consistency
    timeout: 10000,                  // 10s max
    maxWait: 5000                    // 5s wait for connection
  })
}
```

**Isolation levels**:
- `ReadCommitted` (default) — most operations
- `RepeatableRead` — when re-reading same data
- `Serializable` — critical operations (WO release, payment)

### 5.5 Optimistic locking

```typescript
// Version column on entity, increment on update
async update(id: string, data: Partial<WorkOrder>, expectedVersion: number, ctx: RequestContext) {
  const result = await this.prisma.workOrder.updateMany({
    where: { 
      id, 
      plantId: ctx.plantId,
      version: expectedVersion  // optimistic check
    },
    data: {
      ...data,
      updatedAt: new Date(),
      updatedBy: ctx.userId,
      version: { increment: 1 }
    }
  })
  
  if (result.count === 0) {
    throw new ConflictException('Work Order was modified by another user')
  }
  
  return this.findById(id, ctx.plantId)
}
```

### 5.6 N+1 query prevention

```typescript
// ❌ Bad — N+1 queries
const workOrders = await prisma.workOrder.findMany()
for (const wo of workOrders) {
  wo.phases = await prisma.phase.findMany({ where: { woId: wo.id } })
}

// ✅ Good — single query with include
const workOrders = await prisma.workOrder.findMany({
  include: {
    phases: {
      include: {
        groups: {
          include: {
            steps: true
          }
        }
      }
    }
  }
})
```

**Tools**:
- Prisma `include` for known relations
- DataLoader pattern for GraphQL (V2)
- Query complexity limits

### 5.7 Box entities (Prisma schema example)

Box Management uses 4 related entities. Schema pattern:

```prisma
model BoxType {
  id                       String   @id @default(uuid()) @db.Uuid
  plantId                  String   @map("plant_id") @db.Uuid
  
  code                     String                              // BTYPE-PLT-001
  name                     String
  description              String?
  category                 BoxCategory
  
  // Dimensions (mm)
  lengthMm                 Decimal  @map("length_mm") @db.Decimal(10, 2)
  widthMm                  Decimal  @map("width_mm") @db.Decimal(10, 2)
  heightMm                 Decimal  @map("height_mm") @db.Decimal(10, 2)
  
  // Capacity
  maxUnits                 Int      @map("max_units")
  maxWeightKg              Decimal  @map("max_weight_kg") @db.Decimal(10, 3)
  internalVolumeL          Decimal  @map("internal_volume_l") @db.Decimal(10, 3)
  
  // Lifecycle
  isReturnable             Boolean  @default(false) @map("is_returnable")
  expectedLifecycles       Int?     @map("expected_lifecycles")
  cleaningRequired         Boolean  @default(false) @map("cleaning_required")
  inspectionFrequencyDays  Int?     @map("inspection_frequency_days")
  
  // Sealing
  requiresSeal             Boolean  @default(false) @map("requires_seal")
  sealNumberFormat         String?  @map("seal_number_format")
  
  // Content tracking mode
  contentTrackingMode      ContentTrackingMode @default(quantity) @map("content_tracking_mode")
  
  // Cost
  unitCostEur              Decimal? @map("unit_cost_eur") @db.Decimal(10, 2)
  
  // Image
  imageUrl                 String?  @map("image_url")
  imageThumbUrl            String?  @map("image_thumb_url")
  
  // Audit
  createdAt                DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  createdBy                String   @map("created_by") @db.Uuid
  updatedAt                DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)
  updatedBy                String   @map("updated_by") @db.Uuid
  deletedAt                DateTime? @map("deleted_at") @db.Timestamptz(3)
  version                  Int      @default(1)
  
  // Relations
  plant                    Plant    @relation(fields: [plantId], references: [id], onDelete: Restrict)
  boxes                    Box[]
  
  @@unique([plantId, code])
  @@index([plantId, category])
  @@index([plantId, deletedAt])
  @@map("box_types")
}

model Box {
  id                       String   @id @default(uuid()) @db.Uuid
  plantId                  String   @map("plant_id") @db.Uuid
  typeId                   String   @map("type_id") @db.Uuid
  
  code                     String                                // BOX-PLT-001234
  serialNumber             String?  @map("serial_number")        // optional
  
  // Status
  status                   BoxStatus @default(empty)
  
  // Current location
  currentLocationId        String?  @map("current_location_id") @db.Uuid
  currentLocationType      LocationType? @map("current_location_type")
  
  // Current contents (denormalized for performance)
  currentUnits             Int      @default(0) @map("current_units")
  currentWeightKg          Decimal  @default(0) @map("current_weight_kg") @db.Decimal(10, 3)
  
  // Lifecycle
  cyclesCount              Int      @default(0) @map("cycles_count")
  lastInspectionAt         DateTime? @map("last_inspection_at") @db.Timestamptz(3)
  nextInspectionDueAt      DateTime? @map("next_inspection_due_at") @db.Timestamptz(3)
  conditionScore           Int      @default(100) @map("condition_score")  // 0-100
  
  // Sealing
  isSealed                 Boolean  @default(false) @map("is_sealed")
  sealNumber               String?  @map("seal_number")
  sealedAt                 DateTime? @map("sealed_at") @db.Timestamptz(3)
  sealedBy                 String?  @map("sealed_by") @db.Uuid
  
  // Current assignment
  currentWorkOrderId       String?  @map("current_work_order_id") @db.Uuid
  destinationCustomerId    String?  @map("destination_customer_id") @db.Uuid
  
  // Image
  imageUrl                 String?  @map("image_url")
  
  // Audit
  createdAt                DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  createdBy                String   @map("created_by") @db.Uuid
  updatedAt                DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)
  updatedBy                String   @map("updated_by") @db.Uuid
  deletedAt                DateTime? @map("deleted_at") @db.Timestamptz(3)
  version                  Int      @default(1)
  
  // Relations
  plant                    Plant    @relation(fields: [plantId], references: [id], onDelete: Restrict)
  type                     BoxType  @relation(fields: [typeId], references: [id], onDelete: Restrict)
  contents                 BoxContent[]
  movements                BoxMovement[]
  
  @@unique([plantId, code])
  @@index([plantId, status])
  @@index([plantId, typeId])
  @@index([currentLocationId])
  @@index([plantId, deletedAt])
  @@map("boxes")
}

model BoxContent {
  id                       String   @id @default(uuid()) @db.Uuid
  boxId                    String   @map("box_id") @db.Uuid
  
  itemId                   String   @map("item_id") @db.Uuid
  serialNumber             String?  @map("serial_number")
  lotNumber                String?  @map("lot_number")
  quantity                 Decimal  @db.Decimal(15, 4)
  
  // When/who
  addedAt                  DateTime @default(now()) @map("added_at") @db.Timestamptz(3)
  addedBy                  String   @map("added_by") @db.Uuid
  removedAt                DateTime? @map("removed_at") @db.Timestamptz(3)
  removedBy                String?  @map("removed_by") @db.Uuid
  
  // Validation
  validatedScan            Boolean  @default(false) @map("validated_scan")
  
  // Relations
  box                      Box      @relation(fields: [boxId], references: [id], onDelete: Cascade)
  item                     Item     @relation(fields: [itemId], references: [id])
  
  @@index([boxId, removedAt])
  @@index([itemId])
  @@index([serialNumber])
  @@map("box_contents")
}

model BoxMovement {
  id                       String   @id @default(uuid()) @db.Uuid
  boxId                    String   @map("box_id") @db.Uuid
  
  fromLocationId           String?  @map("from_location_id") @db.Uuid
  toLocationId             String?  @map("to_location_id") @db.Uuid
  movementType             BoxMovementType @map("movement_type")
  
  workOrderId              String?  @map("work_order_id") @db.Uuid
  movedBy                  String   @map("moved_by") @db.Uuid
  movedAt                  DateTime @default(now()) @map("moved_at") @db.Timestamptz(3)
  
  notes                    String?
  metadata                 Json?
  
  // Relations
  box                      Box      @relation(fields: [boxId], references: [id], onDelete: Restrict)
  
  @@index([boxId, movedAt])
  @@index([workOrderId])
  @@map("box_movements")
}

enum BoxCategory {
  standard_pallet
  half_pallet
  cardboard_box
  plastic_crate
  metal_container
  kanban_bin
  iso_container
  custom
  
  @@map("box_category")
}

enum BoxStatus {
  empty
  partially_filled
  full
  sealed
  shipped
  returned
  in_cleaning
  damaged
  
  @@map("box_status")
}

enum BoxMovementType {
  pack
  unpack
  seal
  unseal
  palletize
  depalletize
  ship
  return
  
  @@map("box_movement_type")
}

enum ContentTrackingMode {
  serial
  quantity
  mixed
  
  @@map("content_tracking_mode")
}
```

**Key design decisions**:
- `currentUnits` and `currentWeightKg` are **denormalized** on Box for fast queries (avoid SUM on box_contents every read)
- Update them transactionally on pack/unpack
- `BoxContent.removedAt` allows soft-removal (audit trail)
- `BoxMovement` is append-only (history record)
- Optimistic locking via `version` on Box

### 5.8 Migrations

```bash
# Development
pnpm prisma migrate dev --name add_work_order_priority

# Production
pnpm prisma migrate deploy
```

**Rules**:
- Never `db push` in production
- Migrations versioned in Git
- Reversible (down also implemented for major changes)
- Multi-step for big tables (NULL → backfill → NOT NULL)
- Test on prod-like data before deploy

---

## 6. API Design

### 6.1 REST conventions

```
GET    /api/v1/work-orders               List
POST   /api/v1/work-orders               Create
GET    /api/v1/work-orders/:id           Detail
PATCH  /api/v1/work-orders/:id           Partial update
DELETE /api/v1/work-orders/:id           Soft delete
POST   /api/v1/work-orders/:id/release   Custom action
POST   /api/v1/work-orders/:id/cancel    Custom action
```

**Rules**:
- Plural nouns for resources
- kebab-case in URLs
- Versioning in path: `/api/v1/`
- Custom actions as sub-resources: `/work-orders/:id/release`
- Bulk operations: `POST /api/v1/work-orders/bulk-release` with array

### 6.2 Pagination (cursor-based preferred)

```typescript
// Cursor-based for large datasets
GET /api/v1/work-orders?cursor=eyJpZCI6IjEyMyJ9&pageSize=20

Response:
{
  "data": [...],
  "meta": {
    "pageSize": 20,
    "hasMore": true,
    "nextCursor": "eyJpZCI6IjE0NSJ9"
  }
}

// Offset-based for small/static lists (UI tables)
GET /api/v1/items?page=1&pageSize=20

Response:
{
  "data": [...],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 142,
    "totalPages": 8
  }
}
```

### 6.3 Filtering and sorting

```
?filter[status]=in_progress
?filter[status][in]=planned,released
?filter[priority][gte]=high
?filter[createdAt][gte]=2026-01-01
?sort=createdAt:desc,priority:asc
?search=customer-foo
```

### 6.4 Error responses (RFC 7807)

```typescript
// Always return Problem+JSON for errors
{
  "type": "https://errors.mes.app/wo-not-releasable",
  "title": "Work Order cannot be released",
  "status": 422,
  "detail": "Skills coverage incomplete",
  "code": "WO_NOT_RELEASABLE_SKILLS_MISSING",
  "errors": [
    {
      "field": "operators[0].skills",
      "rule": "skill_required",
      "value": "QC",
      "message": "Operator does not have required skill: QC"
    }
  ],
  "instance": "/api/v1/work-orders/abc-123/release",
  "traceId": "00-abc123def456-789012-01"
}
```

### 6.5 OpenAPI documentation

Auto-generate OpenAPI from Zod schemas via `@anatine/zod-openapi` or NestJS Swagger:

```typescript
@ApiTags('Work Orders')
@Controller('work-orders')
export class WorkOrdersController {
  @Post()
  @ApiOperation({ summary: 'Create a new work order' })
  @ApiResponse({ status: 201, type: WorkOrderResponseDto })
  @ApiResponse({ status: 422, type: ValidationErrorDto })
  async create(@Body() dto: CreateWorkOrderDto) {
    // ...
  }
}
```

OpenAPI spec served at `/api/docs`, JSON at `/api/docs-json`.

### 6.6 Idempotency

For mutations that can be retried:

```typescript
// Client sends Idempotency-Key header
@Post(':id/release')
@Idempotent({ ttl: '1h' })  // custom decorator
async release(@Param('id') id: string, @Headers('idempotency-key') key: string) {
  // Decorator checks if key was used in last 1h
  // If yes, returns cached response
  // If no, executes and caches
}
```

---

## 7. Type Safety

### 7.1 Strict mode configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### 7.2 Zero `any` policy

```typescript
// ❌ Never
function process(data: any) { ... }

// ✅ Use unknown for truly unknown
function process(data: unknown) {
  if (typeof data === 'string') {
    return data.toUpperCase()
  }
  throw new Error('Expected string')
}

// ✅ Use generics for flexibility
function process<T extends string | number>(data: T): T { ... }
```

ESLint rule: `@typescript-eslint/no-explicit-any: 'error'`

### 7.3 Branded types for IDs

```typescript
// /packages/shared/types/branded.ts
type Brand<T, B> = T & { readonly __brand: B }

export type WorkOrderId = Brand<string, 'WorkOrderId'>
export type UserId = Brand<string, 'UserId'>
export type PlantId = Brand<string, 'PlantId'>

// Constructor functions
export const WorkOrderId = (id: string): WorkOrderId => id as WorkOrderId
export const UserId = (id: string): UserId => id as UserId

// Prevents mixing IDs:
function getWorkOrder(id: WorkOrderId): WorkOrder { ... }
const userId = UserId('abc-123')
getWorkOrder(userId)  // ❌ Type error: WorkOrderId expected
```

### 7.4 Discriminated unions

```typescript
// API response patterns
type ApiResponse<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; error: ErrorDetails }
  | { status: 'loading' }

function handleResponse<T>(response: ApiResponse<T>) {
  switch (response.status) {
    case 'success':
      return response.data  // T is narrowed
    case 'error':
      throw new Error(response.error.message)
    case 'loading':
      return null
  }
}

// Step polymorphism
type StepConfig =
  | { category: 'production'; deviceId: string; recipeId: string }
  | { category: 'logistics'; fromLocation: Location; toLocation: Location }
  | { category: 'identification'; inputType: ScanInputType; expectedFormat: string }
```

### 7.5 Exhaustive switch

```typescript
function getStatusColor(status: WorkOrderStatus): string {
  switch (status) {
    case 'draft': return 'gray'
    case 'planned': return 'blue'
    case 'released': return 'cyan'
    case 'in_progress': return 'violet'
    case 'on_hold': return 'amber'
    case 'completed': return 'green'
    case 'partially_completed': return 'green'
    case 'closed': return 'green'
    case 'cancelled': return 'red'
    default:
      // Compile error if a case is missing
      const _exhaustive: never = status
      throw new Error(`Unhandled status: ${_exhaustive}`)
  }
}
```

### 7.6 Type guards

```typescript
function isWorkOrder(x: unknown): x is WorkOrder {
  return (
    typeof x === 'object' &&
    x !== null &&
    'id' in x &&
    'status' in x &&
    'qtyTarget' in x
  )
}

// Usage
const data: unknown = await fetchData()
if (isWorkOrder(data)) {
  console.log(data.qtyTarget)  // typed
}
```

### 7.7 Template literal types

```typescript
type EntityType = 'workOrder' | 'item' | 'recipe'
type ActionType = 'created' | 'updated' | 'deleted' | 'released'
type EventName = `${EntityType}.${ActionType}`
// 'workOrder.created' | 'workOrder.updated' | ... (12 combinations)

const EVENT_NAMES: Record<EventName, string> = {
  'workOrder.created': 'Work Order Created',
  // ... TypeScript enforces all combinations exist
}
```

### 7.8 Const assertions

```typescript
// ✅ Inferred as literal types
const ROLES = ['admin', 'planner', 'operator'] as const
type Role = typeof ROLES[number]  // 'admin' | 'planner' | 'operator'

// ✅ For object shapes
const CONFIG = {
  apiUrl: '/api/v1',
  retries: 3
} as const
```

### 7.9 Type-only imports

```typescript
// ✅ Use type-only when only type info is needed
import type { User } from '@mes/shared/types'

// ✅ Mixed runtime + type
import { isAdmin, type User } from '@mes/shared/utils'
```

---

## 8. Error Handling

### 8.1 Custom exception classes

```typescript
// /apps/api/src/common/exceptions/

export class DomainException extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

export class NotFoundException extends DomainException {
  constructor(entity: string, id: string) {
    super(
      'ENTITY_NOT_FOUND',
      `${entity} with id ${id} not found`,
      { entity, id }
    )
  }
}

export class WorkOrderNotReleasableException extends DomainException {
  constructor(reasons: ValidationError[]) {
    super(
      'WO_NOT_RELEASABLE',
      'Work Order cannot be released',
      { reasons }
    )
  }
}

export class InvalidStateTransitionException extends DomainException {
  constructor(action: string, currentState: string) {
    super(
      'INVALID_STATE_TRANSITION',
      `Cannot ${action} from state ${currentState}`,
      { action, currentState }
    )
  }
}
```

### 8.2 Global exception filter

```typescript
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}
  
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let problem: ProblemDetails = {
      type: 'about:blank',
      title: 'Internal Server Error',
      status,
      detail: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      instance: request.url,
      traceId: request.id
    }
    
    if (exception instanceof DomainException) {
      status = this.mapCodeToStatus(exception.code)
      problem = {
        type: `https://errors.mes.app/${exception.code.toLowerCase()}`,
        title: exception.message,
        status,
        detail: exception.message,
        code: exception.code,
        errors: exception.details?.errors,
        instance: request.url,
        traceId: request.id
      }
    } else if (exception instanceof HttpException) {
      // Standard NestJS exceptions
      status = exception.getStatus()
      // ... map to ProblemDetails
    }
    
    // Log error with correlation
    this.logger.error({
      err: exception,
      request: {
        method: request.method,
        url: request.url,
        traceId: request.id
      }
    })
    
    response.status(status).type('application/problem+json').json(problem)
  }
  
  private mapCodeToStatus(code: string): number {
    // Map domain error codes to HTTP statuses
    const map: Record<string, number> = {
      ENTITY_NOT_FOUND: 404,
      WO_NOT_RELEASABLE: 422,
      INVALID_STATE_TRANSITION: 409,
      INSUFFICIENT_PERMISSIONS: 403,
      VALIDATION_ERROR: 422
    }
    return map[code] ?? 500
  }
}
```

### 8.3 Frontend error boundaries

```typescript
'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to Sentry
    Sentry.captureException(error, { extra: info })
  }
  
  reset = () => this.setState({ hasError: false, error: null })
  
  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback?.(this.state.error, this.reset) ?? (
        <div className="flex flex-col items-center justify-center p-8">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">
            {this.state.error.message}
          </p>
          <Button onClick={this.reset}>Try again</Button>
        </div>
      )
    }
    
    return this.props.children
  }
}

// Usage
<ErrorBoundary>
  <WorkOrderDashboard />
</ErrorBoundary>
```

### 8.4 Async error handling

```typescript
// ✅ Comprehensive error handling
async function handleRelease(woId: string) {
  try {
    await releaseWorkOrder(woId)
    toast.success(t('workOrder.released'))
    return { success: true }
  } catch (error) {
    if (error instanceof WorkOrderNotReleasableException) {
      // Domain error: show specific feedback
      toast.error(t('errors.workOrderNotReleasable'))
      return { success: false, errors: error.details?.reasons }
    }
    
    if (isNetworkError(error)) {
      toast.error(t('errors.network'))
      return { success: false, retryable: true }
    }
    
    // Unexpected: log + generic message
    Sentry.captureException(error)
    toast.error(t('errors.unexpected'))
    return { success: false }
  }
}
```

---

## 9. Logging & Observability

### 9.1 Structured logging with Pino

```typescript
// /apps/api/src/common/logger/pino.config.ts
import pino from 'pino'

export const pinoConfig = {
  level: process.env.LOG_LEVEL ?? 'info',
  redact: ['req.headers.authorization', '*.password', '*.creditCard'],
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime
}
```

### 9.2 Correlation ID propagation

```typescript
// Middleware: assign or read correlation ID
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const id = req.headers['x-request-id'] as string ?? randomUUID()
    req.id = id
    res.setHeader('x-request-id', id)
    next()
  }
}

// Logger uses request context
this.logger.info({ 
  event: 'workOrder.released',
  workOrderId: wo.id,
  userId: ctx.userId,
  correlationId: ctx.correlationId
}, 'Work Order released')
```

### 9.3 Logging levels

```typescript
// FATAL — system is unusable
logger.fatal({ err }, 'Database connection lost')

// ERROR — error events, may need attention
logger.error({ err, woId }, 'Failed to release Work Order')

// WARN — abnormal but recoverable
logger.warn({ retries: 3 }, 'External API call retried')

// INFO — business events
logger.info({ workOrderId: wo.id }, 'Work Order released')

// DEBUG — detailed diagnostic info (off in production)
logger.debug({ query, duration }, 'Database query executed')

// TRACE — very verbose (off everywhere except local debug)
logger.trace({ payload }, 'Incoming WebSocket message')
```

### 9.4 What NOT to log

```typescript
// ❌ NEVER log
- Passwords, tokens, API keys
- Credit cards, SSN, personal IDs
- Full request bodies with sensitive data
- Operator photos/biometrics
- Patient/customer data (PII/PHI)

// ✅ Always redact via Pino redact config
redact: [
  '*.password',
  '*.token',
  '*.refreshToken',
  '*.creditCard',
  'req.headers.authorization',
  'req.headers.cookie'
]
```

### 9.5 Health checks

```typescript
@Controller()
export class HealthController {
  @Get('health')
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() }
  }
  
  @Get('ready')
  async readiness() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStorage()
    ])
    
    const failed = checks.filter(c => c.status === 'rejected')
    if (failed.length > 0) {
      throw new ServiceUnavailableException({ checks })
    }
    
    return { status: 'ready', checks: 'all healthy' }
  }
}
```

### 9.6 Metrics (Prometheus)

```typescript
// Business metrics
const workOrderReleasedCounter = new Counter({
  name: 'mes_work_orders_released_total',
  help: 'Total work orders released',
  labelNames: ['plant', 'priority']
})

const apiRequestDuration = new Histogram({
  name: 'mes_api_request_duration_seconds',
  help: 'API request duration',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
})

// Increment on event
@OnEvent('workOrder.released')
async handleReleased(payload: { workOrder: WorkOrder }) {
  workOrderReleasedCounter.inc({
    plant: payload.workOrder.plantId,
    priority: payload.workOrder.priority
  })
}
```

### 9.7 Error tracking (Sentry)

```typescript
// Setup in main.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend: (event) => {
    // Scrub sensitive data
    return scrubSensitive(event)
  }
})

// Capture exceptions in handlers
try {
  await riskyOperation()
} catch (error) {
  Sentry.captureException(error, {
    tags: { module: 'work-orders', action: 'release' },
    extra: { workOrderId: wo.id }
  })
  throw error
}
```

---

## 10. Security

### 10.1 Authentication

```typescript
// JWT strategy
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET'),
      passReqToCallback: true
    })
  }
  
  async validate(req: Request, payload: JwtPayload): Promise<User> {
    // Check token revocation
    const revoked = await this.tokenService.isRevoked(payload.jti)
    if (revoked) throw new UnauthorizedException('Token revoked')
    
    // Load fresh user
    const user = await this.userService.findById(payload.sub)
    if (!user || user.status === 'inactive') {
      throw new UnauthorizedException('User not active')
    }
    
    return user
  }
}

// Tokens
- Access token: 15 min lifetime, in memory
- Refresh token: 7 days, HTTP-only cookie, rotated on use
- Single-use refresh tokens (revoked on use)
```

### 10.2 RBAC + permissions

```typescript
// Roles guard
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(ROLES_KEY, context.getHandler())
    if (!requiredRoles) return true
    
    const { user } = context.switchToHttp().getRequest()
    return requiredRoles.some((role) => user.roles.includes(role))
  }
}

// Permission guard (more granular)
@Injectable()
export class PermissionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.get<string>(PERMISSION_KEY, context.getHandler())
    if (!required) return true
    
    const { user } = context.switchToHttp().getRequest()
    return user.permissions.includes(required)
  }
}

// Usage
@Post(':id/release')
@Roles('admin', 'planner')
@RequirePermission('workOrder.release')
async release() { ... }
```

### 10.3 Input sanitization

```typescript
// ✅ Validate at API boundary
@Post()
async create(
  @Body(new ZodValidationPipe(CreateWorkOrderSchema)) dto: CreateWorkOrderInput
) {
  // dto is fully validated
}

// ✅ Sanitize HTML if rendering user content
import DOMPurify from 'isomorphic-dompurify'

const sanitized = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['b', 'i', 'u', 'a'],
  ALLOWED_ATTR: ['href']
})
```

### 10.4 Rate limiting

```typescript
@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },     // 10/sec
      { name: 'medium', ttl: 60000, limit: 100 },   // 100/min
      { name: 'long', ttl: 3600000, limit: 1000 }   // 1000/hour
    ])
  ]
})

// Per-endpoint custom limits
@Throttle({ short: { limit: 5, ttl: 60000 } })  // 5/min
@Post('login')
async login() { ... }
```

### 10.5 Security headers (Helmet)

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.SOCKET_URL]
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  frameguard: { action: 'deny' }
}))
```

### 10.6 CORS

```typescript
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? [],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
  maxAge: 3600
})
```

### 10.7 Secrets management

```typescript
// ✅ All secrets in env vars, validated at boot
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  REDIS_URL: z.string().url(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  // ... 
})

const env = envSchema.parse(process.env)
// App fails fast if any secret missing/invalid

// ❌ Never
const SECRET = "hardcoded-secret"
const TOKEN = "abc-123-xyz"  // committed to git
```

### 10.8 Password handling

```typescript
import argon2 from 'argon2'

// Hash
const hash = await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 65536,    // 64 MB
  timeCost: 3,
  parallelism: 4
})

// Verify
const valid = await argon2.verify(hash, password)

// Password policy (zod)
const PasswordSchema = z.string()
  .min(12)
  .regex(/[A-Z]/, 'Must contain uppercase')
  .regex(/[a-z]/, 'Must contain lowercase')
  .regex(/[0-9]/, 'Must contain number')
  .regex(/[^A-Za-z0-9]/, 'Must contain special char')
```

### 10.9 File upload security

```typescript
@Post('upload')
@UseInterceptors(FileInterceptor('file', {
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.mimetype)) {
      return cb(new BadRequestException('Invalid file type'), false)
    }
    cb(null, true)
  }
}))
async upload(@UploadedFile() file: Express.Multer.File) {
  // ✅ Verify magic bytes (MIME spoofing prevention)
  const detected = await fileTypeFromBuffer(file.buffer)
  if (!detected || !ALLOWED_MIMES.includes(detected.mime)) {
    throw new BadRequestException('File content does not match extension')
  }
  
  // ✅ Virus scan (ClamAV in production)
  if (process.env.NODE_ENV === 'production') {
    await this.virusScanner.scan(file.buffer)
  }
  
  // ✅ Strip EXIF for privacy
  const cleaned = await this.imageProcessor.stripExif(file.buffer)
  
  return this.storage.upload(cleaned, generateSafeFilename(file.originalname))
}
```

---

## 11. Resilience Patterns

### 11.1 Retry with exponential backoff

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; initialDelay?: number; maxDelay?: number } = {}
): Promise<T> {
  const { maxAttempts = 3, initialDelay = 1000, maxDelay = 30000 } = options
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxAttempts) throw error
      if (!isRetryable(error)) throw error
      
      const delay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay)
      const jitter = Math.random() * 1000
      await sleep(delay + jitter)
    }
  }
  
  throw new Error('Unreachable')
}

function isRetryable(error: unknown): boolean {
  if (error instanceof NetworkError) return true
  if (error instanceof TimeoutError) return true
  if (error instanceof RateLimitError) return true
  return false
}
```

### 11.2 Circuit breaker

```typescript
import CircuitBreaker from 'opossum'

const deviceApiCall = new CircuitBreaker(callDevice, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  rollingCountTimeout: 10000
})

deviceApiCall.fallback(() => ({ status: 'circuit_open', cached: true }))

deviceApiCall.on('open', () => logger.warn('Circuit opened: device API'))
deviceApiCall.on('close', () => logger.info('Circuit closed: device API'))

// Use
const result = await deviceApiCall.fire(deviceId, command)
```

### 11.3 Idempotency

```typescript
@Injectable()
export class IdempotencyService {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}
  
  async checkOrStore(key: string, ttlSeconds: number = 3600): Promise<string | null> {
    // Returns cached response if key exists, else null
    return this.redis.get(`idempotency:${key}`)
  }
  
  async store(key: string, response: unknown, ttlSeconds: number = 3600) {
    await this.redis.setex(
      `idempotency:${key}`, 
      ttlSeconds, 
      JSON.stringify(response)
    )
  }
}

// Interceptor checks Idempotency-Key header
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest()
    const key = req.headers['idempotency-key']
    
    if (!key) return next.handle()
    
    const cached = await this.idempotency.checkOrStore(key)
    if (cached) return of(JSON.parse(cached))
    
    return next.handle().pipe(
      tap(async (response) => {
        await this.idempotency.store(key, response)
      })
    )
  }
}
```

### 11.4 Timeouts everywhere

```typescript
// HTTP requests
const response = await fetch(url, {
  signal: AbortSignal.timeout(5000)
})

// Database queries
await prisma.$queryRaw`SET LOCAL statement_timeout = '5s'`

// Background jobs
@Process({ concurrency: 5 })
async handleJob(job: Job, done: DoneCallback) {
  const timeout = setTimeout(() => done(new Error('Timeout')), 60000)
  try {
    await this.process(job)
  } finally {
    clearTimeout(timeout)
  }
}
```

### 11.5 Graceful degradation

```typescript
async function getOEE(plantId: string): Promise<OEE> {
  try {
    return await this.computeOEE(plantId)
  } catch (error) {
    logger.warn({ err: error }, 'OEE computation failed, returning cached')
    
    // Fallback to cached value
    const cached = await this.cache.get(`oee:${plantId}`)
    if (cached) return { ...cached, stale: true }
    
    // Last resort
    return { availability: 0, performance: 0, quality: 0, total: 0, stale: true }
  }
}
```

---

## 12. Caching Strategy

### 12.1 Multi-layer cache

```
Browser (Service Worker)
    ↓
CDN (static assets)
    ↓
API Gateway (Redis)
    ↓
App-level (TanStack Query / NestJS Cache)
    ↓
Database
```

### 12.2 Cache key naming

```typescript
// Pattern: {scope}:{plant}:{entity}:{id}:{variant}
'plant:abc-123:wo:def-456'
'plant:abc-123:dashboard:kpi:today'
'plant:abc-123:wo:list:status=in_progress&priority=high'
'global:items:catalog:v3'
```

### 12.3 TTL by data type

| Data type | TTL | Strategy |
|---|---|---|
| Static lookups (UoM, countries) | 24h | Cache-aside |
| Anagrafiche (items, recipes) | 5min | Write-through with invalidation |
| Real-time (dashboard KPI) | 30s | Short TTL + SWR |
| User preferences | session | In-memory client-side |
| Auth tokens | until expiry | HTTP-only cookie |

### 12.4 Cache invalidation map (declarative)

```typescript
// /packages/shared/cache/invalidation-map.ts
export const INVALIDATION_MAP: Record<EventName, string[]> = {
  'item.created': ['items.list', 'bom.dropdowns', 'routes.dropdowns'],
  'item.updated': ['items.list', 'items.detail', 'bom.using-item'],
  'item.deleted': ['items.list', 'bom.using-item'],
  
  'workOrder.released': ['workOrders.list', 'serials.allocated', 'reservations.list'],
  'workOrder.statusChanged': ['workOrders.list', 'dashboard.kpi', 'andon'],
  
  'step.completed': ['workOrder.progress', 'dashboard.kpi'],
  
  // ... ~40 events total
}

// Server-side: clear Redis keys
async invalidateOnEvent(event: EventName) {
  const patterns = INVALIDATION_MAP[event] ?? []
  for (const pattern of patterns) {
    await this.redis.del(`${pattern}:*`)
  }
}

// Client-side: invalidate TanStack Query
useInvalidateOnSocketEvent(event: EventName) {
  const queryClient = useQueryClient()
  
  useSocketEvent(event, () => {
    const patterns = INVALIDATION_MAP[event] ?? []
    patterns.forEach(pattern => {
      queryClient.invalidateQueries({ queryKey: pattern.split(':') })
    })
  })
}
```

### 12.5 Stale-While-Revalidate

```typescript
// TanStack Query handles this natively
useQuery({
  queryKey: ['dashboard', 'kpi'],
  queryFn: fetchKPI,
  staleTime: 30_000,      // considered fresh for 30s
  gcTime: 5 * 60_000,     // keep in cache 5min after unmount
  refetchOnWindowFocus: true,
  refetchInterval: 60_000  // refresh every minute
})
```

---

## 13. State Management

### 13.1 State category decision tree

```
Is it server data?              → TanStack Query
Is it form state?               → React Hook Form
Is it URL state (filters)?      → URL search params
Is it global UI state?          → Zustand
Is it component-local?          → useState
Is it complex flow logic?       → XState
```

### 13.2 TanStack Query (server state)

```typescript
// Standard query
function useWorkOrders(filters?: WorkOrderFilters) {
  return useQuery({
    queryKey: ['workOrders', filters],
    queryFn: () => fetchWorkOrders(filters),
    staleTime: 30_000
  })
}

// Mutation with optimistic update
function useUpdateWorkOrderStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateStatus,
    
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['workOrders'] })
      
      const previous = queryClient.getQueryData<WorkOrder[]>(['workOrders'])
      
      queryClient.setQueryData<WorkOrder[]>(['workOrders'], old =>
        old?.map(wo => wo.id === id ? { ...wo, status } : wo)
      )
      
      return { previous }
    },
    
    onError: (err, variables, context) => {
      queryClient.setQueryData(['workOrders'], context?.previous)
      toast.error('Failed to update status')
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] })
    }
  })
}
```

### 13.3 Zustand (client global state)

```typescript
// /apps/web/lib/stores/ui-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  density: 'compact' | 'comfortable'
  
  toggleSidebar: () => void
  setTheme: (theme: UIState['theme']) => void
  setDensity: (density: UIState['density']) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'system',
      density: 'comfortable',
      
      toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
      setDensity: (density) => set({ density })
    }),
    { name: 'ui-preferences' }
  )
)
```

### 13.4 XState (state machines)

```typescript
// /packages/shared/machines/work-order.machine.ts
import { setup, assign } from 'xstate'

export const workOrderMachine = setup({
  types: {} as {
    context: WorkOrderContext
    events: WorkOrderEvent
    input: { workOrderId: string }
  },
  
  guards: {
    canRelease: ({ context }) => 
      context.bomAvailable && context.skillsCovered && context.devicesReady,
    targetReached: ({ context }) => 
      context.qtyProduced >= context.qtyTarget
  },
  
  actions: {
    notifyOperators: ({ context }) => {
      // side effect
    },
    snapshotWorkflow: assign({
      workflowSnapshot: ({ context }) => snapshotCurrentWorkflow(context)
    })
  }
}).createMachine({
  id: 'workOrder',
  initial: 'draft',
  
  context: ({ input }) => ({
    workOrderId: input.workOrderId,
    qtyProduced: 0,
    qtyTarget: 0,
    bomAvailable: false,
    skillsCovered: false,
    devicesReady: false
  }),
  
  states: {
    draft: {
      on: { PLAN: 'planned' }
    },
    
    planned: {
      on: {
        RELEASE: {
          target: 'released',
          guard: 'canRelease',
          actions: 'snapshotWorkflow'
        }
      }
    },
    
    released: {
      on: { 
        START: 'in_progress',
        CANCEL: 'cancelled'
      },
      entry: 'notifyOperators'
    },
    
    in_progress: {
      always: [
        { target: 'completed', guard: 'targetReached' }
      ],
      on: {
        PAUSE: 'on_hold',
        CANCEL: 'cancelled'
      }
    },
    
    on_hold: {
      on: { 
        RESUME: 'in_progress',
        CANCEL: 'cancelled'
      }
    },
    
    completed: {
      on: { CLOSE: 'closed' }
    },
    
    cancelled: { type: 'final' },
    closed: { type: 'final' }
  }
})

// Frontend usage
import { useMachine } from '@xstate/react'

function WorkOrderManager({ workOrderId }: Props) {
  const [state, send] = useMachine(workOrderMachine, {
    input: { workOrderId }
  })
  
  return (
    <div>
      <p>State: {state.value}</p>
      <button 
        disabled={!state.can({ type: 'RELEASE' })}
        onClick={() => send({ type: 'RELEASE' })}
      >
        Release
      </button>
    </div>
  )
}

// Backend usage (same machine!)
import { createActor } from 'xstate'

const actor = createActor(workOrderMachine, { input: { workOrderId } })
actor.start()
actor.send({ type: 'RELEASE' })
```

**Rules**:
- Machines in `/packages/shared/machines/` (shared FE/BE)
- One machine = one entity lifecycle
- Guards as pure functions
- Actions for side effects
- Test machines in isolation (logic) + integration (with services)

#### Box state machine

```typescript
// /packages/shared/machines/box.machine.ts
export const boxMachine = setup({
  types: {} as {
    context: BoxContext
    events: BoxEvent
    input: { boxId: string; typeConfig: BoxTypeConfig }
  },
  
  guards: {
    canPack: ({ context, event }) => 
      event.type === 'PACK' && 
      context.status !== 'damaged' && 
      !context.isSealed &&
      context.currentUnits + event.quantity <= context.maxUnits &&
      context.currentWeightKg + event.weightKg <= context.maxWeightKg,
      
    isFull: ({ context }) => 
      context.currentUnits >= context.maxUnits ||
      context.currentWeightKg >= context.maxWeightKg,
      
    requiresSeal: ({ context }) => context.typeConfig.requiresSeal,
    
    requiresCleaning: ({ context }) => context.typeConfig.cleaningRequired
  },
  
  actions: {
    incrementCycles: assign({
      cyclesCount: ({ context }) => context.cyclesCount + 1
    }),
    addContent: assign({
      currentUnits: ({ context, event }) => 
        event.type === 'PACK' ? context.currentUnits + event.quantity : context.currentUnits,
      currentWeightKg: ({ context, event }) =>
        event.type === 'PACK' ? context.currentWeightKg + event.weightKg : context.currentWeightKg
    }),
    resetContent: assign({
      currentUnits: 0,
      currentWeightKg: 0
    })
  }
}).createMachine({
  id: 'box',
  initial: 'empty',
  
  states: {
    empty: {
      on: {
        PACK: {
          target: 'partially_filled',
          guard: 'canPack',
          actions: 'addContent'
        }
      }
    },
    
    partially_filled: {
      on: {
        PACK: [
          { 
            target: 'full', 
            guard: 'isFull',
            actions: 'addContent'
          },
          { 
            target: 'partially_filled',
            guard: 'canPack',
            actions: 'addContent'
          }
        ],
        UNPACK: 'partially_filled', // stays partially filled or transitions to empty
        SEAL: {
          target: 'sealed',
          guard: 'requiresSeal'
        }
      }
    },
    
    full: {
      on: {
        SEAL: {
          target: 'sealed'
        },
        UNPACK: 'partially_filled' // operator override
      }
    },
    
    sealed: {
      on: {
        SHIP: 'shipped',
        OPEN_SEAL: {
          target: 'partially_filled', 
          // reason required (in event payload)
        }
      }
    },
    
    shipped: {
      on: {
        RETURN: [
          { 
            target: 'in_cleaning', 
            guard: 'requiresCleaning' 
          },
          { 
            target: 'returned' 
          }
        ]
      }
    },
    
    returned: {
      on: {
        INSPECT: 'returned', // stays, updates condition
        SEND_TO_CLEANING: 'in_cleaning',
        MARK_DAMAGED: 'damaged',
        RETURN_TO_INVENTORY: {
          target: 'empty',
          actions: ['incrementCycles', 'resetContent']
        }
      }
    },
    
    in_cleaning: {
      on: {
        CLEANING_DONE: {
          target: 'empty',
          actions: ['incrementCycles', 'resetContent']
        },
        MARK_DAMAGED: 'damaged'
      }
    },
    
    damaged: {
      type: 'final'
    }
  }
})
```

### 13.5 React Hook Form (forms)

See section 3.5.

---

## 14. Real-time Sync Implementation

### 14.1 Socket.IO gateway

```typescript
@WebSocketGateway({
  cors: { origin: process.env.ALLOWED_ORIGINS?.split(',') },
  namespace: 'realtime'
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server
  
  async handleConnection(client: Socket) {
    // Auth via JWT in handshake
    const user = await this.authService.verifyToken(
      client.handshake.auth.token
    )
    
    if (!user) {
      client.disconnect()
      return
    }
    
    client.data.user = user
    
    // Auto-join plant room
    client.join(`plant:${user.activePlantId}`)
    client.join(`user:${user.id}`)
  }
  
  handleDisconnect(client: Socket) {
    // Cleanup
  }
  
  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { rooms: string[] }
  ) {
    // Validate user can join requested rooms
    for (const room of data.rooms) {
      if (await this.canJoin(client.data.user, room)) {
        client.join(room)
      }
    }
  }
  
  // Broadcast helper
  async broadcast(room: string, event: string, payload: unknown) {
    this.server.to(room).emit(event, payload)
  }
}
```

### 14.2 Frontend Socket.IO hook

```typescript
// /apps/web/lib/socket/use-socket.ts
'use client'

import { io, Socket } from 'socket.io-client'
import { useEffect } from 'react'

let socket: Socket | null = null

export function getSocket(token: string): Socket {
  if (!socket) {
    socket = io(`${process.env.NEXT_PUBLIC_SOCKET_URL}/realtime`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    })
  }
  return socket
}

export function useSocketEvent<T>(event: string, handler: (data: T) => void) {
  useEffect(() => {
    const sock = getSocket(getAuthToken())
    sock.on(event, handler)
    return () => { sock.off(event, handler) }
  }, [event, handler])
}

// Usage
function WorkOrderList() {
  const queryClient = useQueryClient()
  
  useSocketEvent<{ workOrderId: string }>('workOrder.released', () => {
    queryClient.invalidateQueries({ queryKey: ['workOrders'] })
  })
  
  // ... render
}
```

### 14.3 Connection status indicator

```typescript
function ConnectionStatus() {
  const [status, setStatus] = useState<'connected' | 'reconnecting' | 'offline'>('connected')
  
  useEffect(() => {
    const sock = getSocket(getAuthToken())
    sock.on('connect', () => setStatus('connected'))
    sock.on('disconnect', () => setStatus('reconnecting'))
    sock.on('reconnect_failed', () => setStatus('offline'))
  }, [])
  
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={cn(
        'h-2 w-2 rounded-full',
        status === 'connected' && 'bg-green-500 animate-pulse',
        status === 'reconnecting' && 'bg-amber-500',
        status === 'offline' && 'bg-gray-400'
      )} />
      <span className="text-muted-foreground">
        {status === 'connected' && 'Live'}
        {status === 'reconnecting' && 'Reconnecting...'}
        {status === 'offline' && 'Offline'}
      </span>
    </div>
  )
}
```

---

## 15. Performance

### 15.1 Web Vitals targets

| Metric | Target | Critical |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s | < 4s |
| INP (Interaction to Next Paint) | < 200ms | < 500ms |
| CLS (Cumulative Layout Shift) | < 0.1 | < 0.25 |
| FCP (First Contentful Paint) | < 1.8s | < 3s |
| TTFB (Time to First Byte) | < 600ms | < 1.5s |

Measured in production via Real User Monitoring (Vercel Analytics, Datadog).

### 15.2 Bundle size budget

```javascript
// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.performance = {
        maxAssetSize: 250_000,
        maxEntrypointSize: 500_000,
        hints: 'error'  // fail build if exceeded
      }
    }
    return config
  }
}
```

### 15.3 Code splitting

```typescript
// ✅ Route-based (automatic in Next.js App Router)
// app/work-orders/page.tsx — separate chunk

// ✅ Component-based for heavy components
const WorkflowCanvas = dynamic(
  () => import('@/components/features/workflows/WorkflowCanvas'),
  { 
    ssr: false,  // canvas doesn't need SSR
    loading: () => <CanvasSkeleton />
  }
)

// ✅ Per heavy library
const Chart = dynamic(() => import('recharts').then(m => m.LineChart))
```

### 15.4 Image optimization

```typescript
import Image from 'next/image'

<Image
  src={item.imageUrl}
  alt={item.name}
  width={400}
  height={400}
  placeholder="blur"
  blurDataURL={item.imageBlurHash}
  sizes="(max-width: 768px) 100vw, 400px"
  priority={isAboveFold}
/>
```

### 15.5 Font loading (Avenir Next Cyr)

```typescript
// app/layout.tsx
import localFont from 'next/font/local'

const avenirNextCyr = localFont({
  src: [
    { path: '../public/fonts/AvenirNextCyr-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/AvenirNextCyr-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/AvenirNextCyr-Demi.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/AvenirNextCyr-Bold.woff2', weight: '700', style: 'normal' }
  ],
  variable: '--font-avenir-next-cyr',
  display: 'swap',
  preload: true
})

// Fallback when font files not yet provided
const fontFallback = `'Avenir Next', 'Avenir', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`
```

### 15.6 React optimizations

```typescript
// ✅ Memoize expensive components
const ExpensiveList = memo(({ items }: Props) => {
  return items.map(item => <Item key={item.id} {...item} />)
}, (prev, next) => prev.items.length === next.items.length)

// ✅ Memoize expensive computations
const sortedItems = useMemo(
  () => [...items].sort((a, b) => a.priority - b.priority),
  [items]
)

// ✅ Stable callback refs
const handleSelect = useCallback((id: string) => {
  navigate(`/items/${id}`)
}, [navigate])

// ❌ Don't memoize unconditionally
// Profile first with React DevTools Profiler
```

### 15.7 List virtualization

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

function VirtualList({ items }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5
  })
  
  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              transform: `translateY(${virtualItem.start}px)`
            }}
          >
            <Item {...items[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

Virtualize lists > 100 items.

### 15.8 Database query optimization

```typescript
// ✅ Specific includes only what's needed
const wo = await prisma.workOrder.findUnique({
  where: { id },
  select: {
    id: true,
    code: true,
    status: true,
    // exclude large fields like phases JSON
  }
})

// ✅ Batch operations
await prisma.serialNumber.createMany({
  data: serials,
  skipDuplicates: true
})

// ✅ Use indexes properly (verify with EXPLAIN ANALYZE)
@@index([plantId, status, priority])
```

---

## 16. Accessibility

### 16.1 Semantic HTML

```typescript
// ✅ Good
<main>
  <article>
    <header>
      <h1>Work Order #2026-0142</h1>
      <p className="text-muted-foreground">Released on 2026-04-26</p>
    </header>
    <section>
      <h2>Production Phases</h2>
      <ol>
        {phases.map(phase => <li key={phase.id}>{phase.name}</li>)}
      </ol>
    </section>
  </article>
</main>

// ❌ Bad — div soup
<div>
  <div>
    <div>Work Order #2026-0142</div>
    <div>Released on 2026-04-26</div>
    <div>Production Phases</div>
    <div>{phases.map(...)}</div>
  </div>
</div>
```

### 16.2 ARIA patterns

```typescript
// Toggle / dropdown
<button
  aria-expanded={isOpen}
  aria-controls="filters-panel"
  aria-haspopup="true"
>
  Filters
</button>
<div id="filters-panel" role="region" aria-label="Filter options" hidden={!isOpen}>
  {/* ... */}
</div>

// Icon-only button
<button aria-label="Close dialog">
  <X className="h-4 w-4" />
</button>

// Live regions for dynamic content
<div role="status" aria-live="polite" aria-atomic="true">
  {message}
</div>

// Loading state
<div role="status" aria-live="polite">
  <span className="sr-only">Loading work orders</span>
  <Spinner aria-hidden="true" />
</div>
```

### 16.3 Keyboard navigation

```typescript
// Trap focus in modal
function Modal({ isOpen, onClose, children }) {
  useEffect(() => {
    if (!isOpen) return
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])
  
  // ... use focus-trap-react or Radix Dialog
}

// Keyboard shortcuts
useHotkeys('cmd+k, ctrl+k', () => openCommandPalette())
useHotkeys('cmd+s, ctrl+s', (e) => { e.preventDefault(); save() })
```

### 16.4 Color contrast

WCAG AA minimum:
- Normal text: 4.5:1 contrast ratio
- Large text (≥18pt): 3:1
- UI components: 3:1

Use color tokens from design system, verified for contrast.

### 16.5 Focus management

```css
/* Custom focus styles (better than browser default) */
.focus-visible\:ring-2:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

Never `outline: none` without alternative.

### 16.6 Reduced motion

```typescript
// Respect user preference
const prefersReducedMotion = useReducedMotion()

<motion.div
  animate={{ x: 100 }}
  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
/>
```

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 17. Internationalization

### 17.1 next-intl setup

```typescript
// /apps/web/i18n.ts
import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'

const locales = ['it', 'en'] as const
type Locale = typeof locales[number]

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as Locale)) notFound()
  
  return {
    messages: (await import(`./messages/${locale}.json`)).default
  }
})
```

### 17.2 Translation file structure

```json
// /apps/web/messages/it.json
{
  "common": {
    "actions": {
      "save": "Salva",
      "cancel": "Annulla",
      "delete": "Elimina",
      "edit": "Modifica"
    },
    "states": {
      "loading": "Caricamento...",
      "saving": "Salvataggio...",
      "error": "Si è verificato un errore"
    }
  },
  "workOrders": {
    "title": "Ordini di Produzione",
    "create": "Crea Ordine",
    "released": "Ordine rilasciato",
    "status": {
      "draft": "Bozza",
      "planned": "Pianificato",
      "released": "Rilasciato",
      "in_progress": "In corso",
      "completed": "Completato"
    },
    "errors": {
      "notReleasable": "L'ordine non può essere rilasciato: {reason}"
    }
  }
}
```

### 17.3 Usage in components

```typescript
import { useTranslations } from 'next-intl'

function WorkOrderCard({ workOrder }: Props) {
  const t = useTranslations('workOrders')
  
  return (
    <Card>
      <h3>{t('title')}: {workOrder.code}</h3>
      <Badge>{t(`status.${workOrder.status}`)}</Badge>
      <Button>{t('common.actions.save')}</Button>
    </Card>
  )
}
```

### 17.4 Date/number formatting

```typescript
import { format, formatDistance } from 'date-fns'
import { it, enUS } from 'date-fns/locale'

const locale = useLocale() === 'it' ? it : enUS

// Date
format(new Date(), 'PPP', { locale })  // "26 aprile 2026" / "April 26, 2026"

// Relative
formatDistance(date, new Date(), { locale, addSuffix: true })  // "2 ore fa"

// Number
new Intl.NumberFormat('it-IT').format(1234.56)  // "1.234,56"

// Currency
new Intl.NumberFormat('it-IT', { 
  style: 'currency', 
  currency: 'EUR' 
}).format(1234.56)  // "1.234,56 €"
```

### 17.5 DB content i18n

```typescript
// Store both in DB
{
  title_it: "Verificare coppia serraggio",
  title_en: "Check tightening torque"
}

// Helper to get current locale's value
function localized<T extends { [key: string]: any }>(
  obj: T,
  field: string,
  locale: Locale = 'it'
): string {
  return obj[`${field}_${locale}`] ?? obj[`${field}_it`] ?? ''
}

// Usage
const title = localized(attentionPoint, 'title', currentLocale)
```

---

## 18. Testing Strategy

### 18.1 Test pyramid

```
       /\          E2E (10%) — Playwright
      /  \         Integration (20%) — Vitest + testcontainers
     /____\        Unit (70%) — Vitest
```

### 18.2 Coverage targets

- Critical business logic: ≥ 90%
- Services: ≥ 80%
- Utilities: ≥ 80%
- UI components: behavior > line coverage
- Overall: ≥ 75%

### 18.3 Unit test patterns

```typescript
// /apps/api/src/modules/work-orders/work-orders.service.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WorkOrdersService } from './work-orders.service'
import { createMockRepository, createMockEventEmitter } from './test-utils'

describe('WorkOrdersService', () => {
  let service: WorkOrdersService
  let mockRepo: ReturnType<typeof createMockRepository>
  let mockEvents: ReturnType<typeof createMockEventEmitter>
  
  beforeEach(() => {
    mockRepo = createMockRepository()
    mockEvents = createMockEventEmitter()
    service = new WorkOrdersService(mockRepo, mockEvents, /* ... */)
  })
  
  describe('release()', () => {
    it('transitions PLANNED → RELEASED when valid', async () => {
      // Arrange
      const wo = createMockWorkOrder({ status: 'planned' })
      mockRepo.findByIdOrThrow.mockResolvedValue(wo)
      mockRepo.update.mockResolvedValue({ ...wo, status: 'released' })
      
      // Act
      const result = await service.release(wo.id, mockContext)
      
      // Assert
      expect(result.status).toBe('released')
      expect(mockEvents.emit).toHaveBeenCalledWith(
        'workOrder.released',
        expect.objectContaining({ workOrder: result })
      )
    })
    
    it('throws when WO is not in PLANNED state', async () => {
      const wo = createMockWorkOrder({ status: 'in_progress' })
      mockRepo.findByIdOrThrow.mockResolvedValue(wo)
      
      await expect(service.release(wo.id, mockContext))
        .rejects.toThrow(InvalidStateTransitionException)
    })
    
    it('throws when BOM components unavailable', async () => {
      // ... arrange
      await expect(service.release(wo.id, mockContext))
        .rejects.toThrow(WorkOrderNotReleasableException)
    })
  })
})
```

### 18.4 Integration tests with testcontainers

```typescript
import { describe, beforeAll, afterAll, it, expect } from 'vitest'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { Test } from '@nestjs/testing'

describe('WorkOrders Integration', () => {
  let postgresContainer: StartedPostgreSqlContainer
  let app: INestApplication
  
  beforeAll(async () => {
    postgresContainer = await new PostgreSqlContainer().start()
    process.env.DATABASE_URL = postgresContainer.getConnectionUri()
    
    // Run migrations
    await execMigrations()
    
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()
    
    app = moduleRef.createNestApplication()
    await app.init()
  })
  
  afterAll(async () => {
    await app.close()
    await postgresContainer.stop()
  })
  
  it('creates and releases a work order', async () => {
    // Real DB, real services, mocked external only
    const created = await request(app.getHttpServer())
      .post('/api/v1/work-orders')
      .set('Authorization', `Bearer ${validToken}`)
      .send(validPayload)
      .expect(201)
    
    await request(app.getHttpServer())
      .post(`/api/v1/work-orders/${created.body.id}/release`)
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200)
    
    // Verify state in DB
    const wo = await prisma.workOrder.findUnique({ where: { id: created.body.id } })
    expect(wo?.status).toBe('released')
  })
})
```

### 18.5 E2E tests with Playwright

```typescript
// /apps/web/e2e/work-orders.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Work Orders', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name=email]', 'planner@test.com')
    await page.fill('input[name=password]', 'password')
    await page.click('button[type=submit]')
    await page.waitForURL('/dashboard')
  })
  
  test('creates and releases a work order', async ({ page }) => {
    await page.goto('/work-orders')
    await page.click('text=Create Work Order')
    
    await page.selectOption('select[name=item]', 'Item A')
    await page.fill('input[name=qtyTarget]', '100')
    await page.click('button:has-text("Create")')
    
    await expect(page.locator('text=WO-2026-')).toBeVisible()
    await expect(page.locator('text=Draft')).toBeVisible()
    
    await page.click('button:has-text("Plan")')
    await page.click('button:has-text("Release")')
    
    await expect(page.locator('text=Released')).toBeVisible()
  })
})
```

### 18.6 Test data factories

```typescript
// /packages/shared/test/factories/work-order.factory.ts
import { faker } from '@faker-js/faker'

export function createMockWorkOrder(overrides?: Partial<WorkOrder>): WorkOrder {
  return {
    id: faker.string.uuid(),
    code: `WO-2026-${faker.number.int({ min: 1000, max: 9999 })}`,
    plantId: faker.string.uuid(),
    itemId: faker.string.uuid(),
    workflowId: faker.string.uuid(),
    qtyTarget: faker.number.int({ min: 10, max: 1000 }),
    qtyProduced: 0,
    qtyScrap: 0,
    qtyRework: 0,
    status: 'draft',
    priority: 'normal',
    type: 'production',
    createdAt: faker.date.recent(),
    createdBy: faker.string.uuid(),
    updatedAt: faker.date.recent(),
    updatedBy: faker.string.uuid(),
    deletedAt: null,
    deletedBy: null,
    version: 1,
    ...overrides
  }
}
```

### 18.7 Test naming

```typescript
describe('WorkOrderService', () => {
  describe('release()', () => {
    it('transitions PLANNED → RELEASED when valid')
    it('throws when WO is not in PLANNED state')
    it('throws when BOM components unavailable')
    it('throws when skills coverage incomplete')
    it('snapshots workflow version on release')
    it('allocates serial range when tracking is SERIAL')
    it('emits workOrder.released event')
  })
})
```

Pattern: `it('<expected behavior>')` — describes what should happen, not implementation.

---

## 19. Universal Components Patterns

This section provides implementation guidance for the 6 universal patterns defined in `MASTER_SPECIFICATION.md` § 13.

### 19.1 `<EntityImage>`

```typescript
// /apps/web/components/shared/EntityImage.tsx
'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { generateInitialsAvatar } from '@/lib/image-helpers'
import { ENTITY_ICONS } from '@/lib/entity-icons'

interface EntityImageProps {
  entity: {
    id: string
    name: string
    imageUrl?: string | null
    imageAlt?: string | null
  }
  entityType: EntityType
  size: 'thumb' | 'card' | 'hero' | 'avatar'
  shape?: 'square' | 'rounded' | 'circle'
  fallbackStrategy?: 'icon' | 'initials' | 'pattern'
  className?: string
}

const SIZE_MAP = {
  thumb: { width: 32, height: 32 },
  avatar: { width: 64, height: 64 },
  card: { width: 400, height: 400 },
  hero: { width: 800, height: 800 }
}

export function EntityImage({
  entity,
  entityType,
  size,
  shape = 'rounded',
  fallbackStrategy = 'icon',
  className
}: EntityImageProps) {
  const dimensions = SIZE_MAP[size]
  const shapeClass = {
    square: 'rounded-none',
    rounded: 'rounded-md',
    circle: 'rounded-full'
  }[shape]
  
  // Has uploaded image
  if (entity.imageUrl) {
    return (
      <Image
        src={entity.imageUrl}
        alt={entity.imageAlt ?? entity.name}
        {...dimensions}
        className={cn('object-cover', shapeClass, className)}
        loading="lazy"
      />
    )
  }
  
  // Auto-generated fallback
  if (fallbackStrategy === 'icon') {
    const Icon = ENTITY_ICONS[entityType]
    const bgColor = colorFromHash(entity.id)
    return (
      <div 
        className={cn('flex items-center justify-center', shapeClass, className)}
        style={{ backgroundColor: bgColor, ...dimensions }}
      >
        <Icon className="text-white" />
      </div>
    )
  }
  
  // Initials fallback
  return (
    <div 
      className={cn('flex items-center justify-center text-white font-medium', shapeClass, className)}
      style={{ backgroundColor: colorFromHash(entity.id), ...dimensions }}
    >
      {getInitials(entity.name)}
    </div>
  )
}
```

### 19.2 `<ViewSwitcher>`

```typescript
'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { List, LayoutGrid, GitBranch, Calendar } from 'lucide-react'

type View = 'list' | 'card' | 'flow' | 'gantt'

interface ViewSwitcherProps {
  registryName: string
  availableViews: View[]
  defaultView?: View
  onViewChange: (view: View) => void
  className?: string
}

const VIEW_ICONS = {
  list: List,
  card: LayoutGrid,
  flow: GitBranch,
  gantt: Calendar
}

export function ViewSwitcher({ 
  registryName, 
  availableViews, 
  defaultView,
  onViewChange,
  className
}: ViewSwitcherProps) {
  const [view, setView] = useState<View>(() => {
    const stored = localStorage.getItem(`view-mode-${registryName}`)
    if (stored && availableViews.includes(stored as View)) return stored as View
    return defaultView ?? availableViews[0]
  })
  
  useEffect(() => {
    localStorage.setItem(`view-mode-${registryName}`, view)
    onViewChange(view)
  }, [view, registryName, onViewChange])
  
  return (
    <ToggleGroup 
      type="single" 
      value={view} 
      onValueChange={(v) => v && setView(v as View)}
      className={cn('bg-muted/50 p-0.5 rounded-md', className)}
    >
      {availableViews.map(v => {
        const Icon = VIEW_ICONS[v]
        return (
          <ToggleGroupItem 
            key={v} 
            value={v} 
            aria-label={`${v} view`}
            className="data-[state=on]:bg-background data-[state=on]:shadow-sm"
          >
            <Icon className="h-4 w-4" />
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
```

### 19.3 `<FourPaneConfigurator>`

```typescript
interface FourPaneConfiguratorProps<TStep, TResource> {
  wizardSteps: WizardStep[]
  paletteAdapter: PaletteAdapter<TResource>
  configCenterRenderer: (currentStep: WizardStep) => React.ReactNode
  previewRenderer: (config: TStep, state: PreviewState) => React.ReactNode
  onComplete: (data: TStep) => void | Promise<void>
}

export function FourPaneConfigurator<TStep, TResource>({
  wizardSteps,
  paletteAdapter,
  configCenterRenderer,
  previewRenderer,
  onComplete
}: FourPaneConfiguratorProps<TStep, TResource>) {
  // ... see master spec § 13.4 for full layout
}
```

### 19.4 `<StepLivePreview>`

State-driven preview component implementing 11 states defined in master spec § 4.37.

### 19.5 `<TimerStatusBar>`

Multi-level timer (WO/Phase/Part) with 3 layouts (full/compact/minimal). See master spec § 13.6.

### 19.6 `<AttentionPointCard>`

Static, non-interactive display component for ambient AP rendering on HMI. See master spec § 11.

### 19.7 Box Components (NEW v1.1)

#### `<BoxStatusBadge>`

Visual status indicator for a Box, color-coded per status.

```tsx
<BoxStatusBadge status="partially_filled" size="sm" />

// Component
const STATUS_THEME = {
  empty:             { color: 'gray-500',    bg: 'gray-100',    label: 'Vuota' },
  partially_filled:  { color: 'blue-600',    bg: 'blue-50',     label: 'In carico' },
  full:              { color: 'cyan-600',    bg: 'cyan-50',     label: 'Piena' },
  sealed:            { color: 'violet-600',  bg: 'violet-50',   label: 'Sigillata' },
  shipped:           { color: 'green-600',   bg: 'green-50',    label: 'Spedita' },
  returned:          { color: 'amber-600',   bg: 'amber-50',    label: 'Restituita' },
  in_cleaning:       { color: 'yellow-700',  bg: 'yellow-50',   label: 'In pulizia' },
  damaged:           { color: 'red-600',     bg: 'red-50',      label: 'Danneggiata' },
}
```

#### `<BoxFillIndicator>`

Visual progress bar showing fill percentage with color coding.

```tsx
<BoxFillIndicator 
  currentUnits={42}
  maxUnits={50}
  currentWeightKg={8.4}
  maxWeightKg={10}
  showLabels={true}
/>

// Renders dual progress (units + weight) with status colors:
// 0-50%   → green (room to grow)
// 50-85%  → blue (healthy fill)
// 85-100% → amber (near full)
// >100%   → red (overload, only shown if forced)
```

#### `<BoxContentList>`

Tabular display of contents inside a box with serial/lot/quantity.

```tsx
<BoxContentList 
  boxId={box.id}
  showRemoved={false}     // hide soft-removed entries
  groupBy="item"          // group by item or lot
  actionable={true}       // show unpack action if box not sealed
/>
```

#### `<BoxScanInput>`

Specialized scan input for box operations on HMI.

```tsx
<BoxScanInput
  expectedStatus={['empty', 'partially_filled']}
  onScan={(boxCode) => handleBoxSelect(boxCode)}
  showCameraIcon={true}
  validateAgainstDatabase={true}
/>

// Validates box exists, status matches expected, plant scope.
// Plays audio feedback on success/error (HMI mode).
```

#### `<SealNumberDisplay>`

Display seal number with copy/print actions.

```tsx
<SealNumberDisplay 
  sealNumber="SEAL-2026-00042"
  sealedAt={box.sealedAt}
  sealedBy={box.sealedBy}
  printable={true}
/>
```

All box components are touch-friendly for HMI use.

---

## 20. HMI Shop Floor Patterns

### 20.1 Touch optimization

```css
/* Tailwind utilities for HMI */
.hmi-touch-target {
  @apply min-h-[48px] min-w-[48px];  /* Material guidelines */
}

.hmi-button {
  @apply h-14 px-6 text-base font-medium;  /* Larger than back-office */
}

.hmi-card {
  @apply p-6;  /* More padding for touch */
}
```

**Rules**:
- Minimum touch target: 48×48px
- Spacing between targets: ≥ 8px
- Font size: ≥ 16px body, ≥ 20px CTAs
- No hover-only states (touch has no hover)
- No fine drag-drop (operators wear gloves)

### 20.2 Audio feedback

```typescript
// /apps/web/lib/hmi/audio.ts
const audio = {
  success: new Audio('/sounds/success.mp3'),
  warning: new Audio('/sounds/warning.mp3'),
  error: new Audio('/sounds/error.mp3'),
  scan: new Audio('/sounds/scan.mp3')
}

export function playSound(type: keyof typeof audio) {
  if (!isHMIMode() || isMuted()) return
  audio[type].play().catch(() => { /* ignore autoplay errors */ })
}

// Usage on step completion
useEffect(() => {
  if (step.status === 'complete') playSound('success')
  if (step.status === 'failed') playSound('error')
}, [step.status])
```

### 20.3 Offline-first PWA

```typescript
// /apps/web/app/hmi/manifest.ts (PWA)
export const manifest = {
  name: 'MES HMI',
  short_name: 'MES HMI',
  display: 'fullscreen',
  orientation: 'landscape',
  theme_color: '#6366F1',
  background_color: '#ffffff',
  // ...
}

// Service worker for offline caching
// next-pwa or workbox configuration

// Mutation queue for offline actions
class OfflineMutationQueue {
  private db: IDBDatabase
  
  async enqueue(mutation: PendingMutation) {
    await this.db.transaction('mutations', 'readwrite')
      .objectStore('mutations')
      .add(mutation)
  }
  
  async flush() {
    const pending = await this.getPending()
    for (const mutation of pending) {
      try {
        await executeOnline(mutation)
        await this.markCompleted(mutation.id)
      } catch (err) {
        // Will retry next flush
      }
    }
  }
}
```

### 20.4 High-contrast mode

```css
@media (prefers-contrast: more) {
  :root {
    --border: 0 0% 0%;
    --foreground: 0 0% 0%;
    --background: 0 0% 100%;
    /* maximum contrast tokens */
  }
}
```

Manual toggle for noisy/bright environments.

### 20.5 Auto-logout

```typescript
function useAutoLogout(timeoutMs = 30 * 60 * 1000) {  // 30 min
  const logout = useLogout()
  
  useEffect(() => {
    let timer: NodeJS.Timeout
    
    const reset = () => {
      clearTimeout(timer)
      timer = setTimeout(logout, timeoutMs)
    }
    
    const events = ['mousedown', 'keydown', 'touchstart']
    events.forEach(e => document.addEventListener(e, reset))
    reset()
    
    return () => {
      clearTimeout(timer)
      events.forEach(e => document.removeEventListener(e, reset))
    }
  }, [logout, timeoutMs])
}
```

---

## 21. MES Domain Implementation

### 21.1 Polymorphic step types

```typescript
// Schema registry pattern
@Injectable()
export class StepSchemaRegistry {
  private schemas = new Map<StepCategory, ZodSchema>()
  private uiComponents = new Map<StepCategory, string>()
  
  register(category: StepCategory, config: {
    schema: ZodSchema
    uiComponent: string
    hmiComponent: string
  }) {
    this.schemas.set(category, config.schema)
    // ...
  }
  
  validate(category: StepCategory, config: unknown): ValidationResult {
    const schema = this.schemas.get(category)
    if (!schema) throw new Error(`No schema for ${category}`)
    return schema.safeParse(config)
  }
}

// Each step category has dedicated schema
export const ScanStepConfigSchema = z.object({
  inputType: z.enum(['barcode', 'qr', 'rfid', 'datamatrix', 'manual_entry']),
  expectedFormat: z.string().optional(),
  validateAgainst: z.enum(['database', 'pattern', 'checksum']).optional(),
  onMismatch: z.enum(['block', 'warn', 'allow_with_reason']).default('block')
})
```

### 21.2 Plant-aware queries

**Mandatory pattern** for all transactional queries:

```typescript
// ✅ Always pass plantId
@Injectable()
export class WorkOrdersRepository {
  async findById(id: string, plantId: string) {
    return this.prisma.workOrder.findFirst({
      where: { id, plantId, deletedAt: null }
    })
  }
}

// Service receives plantId from context
@Injectable()
export class WorkOrdersService {
  async release(id: string, ctx: RequestContext) {
    const wo = await this.repository.findByIdOrThrow(id, ctx.plantId)
    // ...
  }
}

// Controller extracts plantId via @Plant() decorator
@Post(':id/release')
async release(
  @Param('id') id: string,
  @CurrentUser() user: User,
  @Plant() plantId: string
) {
  return this.service.release(id, { userId: user.id, plantId })
}
```

### 21.3 Time mode calculations

```typescript
function computeStepEffectiveDuration(step: Step): number {
  switch (step.timeMode) {
    case 'while-device-running':
      return 0  // parallel doesn't count
    case 'device-cycle-time':
    case 'manual-standard-time':
      return step.durationSec
  }
}

function computeGroupCycleTime(group: Group): number {
  const preTime = group.steps
    .filter(s => s.deviceCategory === 'pre')
    .reduce((sum, s) => sum + s.durationSec, 0)
  
  const deviceTime = group.steps
    .find(s => s.deviceCategory === 'device_main')?.durationSec ?? 0
  
  const postTime = group.steps
    .filter(s => s.deviceCategory === 'post')
    .reduce((sum, s) => sum + s.durationSec, 0)
  
  // Parallel does NOT contribute
  return preTime + deviceTime + postTime
}
```

### 21.4 Part reference resolution

```typescript
async function resolvePartReference(
  deviceId: string,
  workOrderId: string,
  currentCycle: number,
  reference: PartReference,
  offset?: number
): Promise<PartCycleBufferEntry | null> {
  switch (reference) {
    case 'current':
      return this.buffer.findOne({ deviceId, workOrderId, cycleNumber: currentCycle, status: 'in_device' })
    case 'previous':
      return this.buffer.findOne({ deviceId, workOrderId, cycleNumber: currentCycle - 1, status: 'completed' })
    case 'previous_n': {
      const target = currentCycle - Math.abs(offset ?? 1)
      return this.buffer.findOne({ deviceId, workOrderId, cycleNumber: target })
    }
    case 'next':
      return this.buffer.findOne({ deviceId, workOrderId, cycleNumber: currentCycle + 1, status: 'prepared' })
    case 'batch':
    case 'none':
      return null
  }
}
```

### 21.5 Auto-generation rule engine

```typescript
@Injectable()
export class AutoGenerationService {
  async generateFromWorkflow(workflowId: string, plantId: string): Promise<GenerationResult> {
    const workflow = await this.workflowRepo.findById(workflowId, plantId)
    const rules = await this.ruleRepo.findActiveRules(plantId)
    
    const setupSteps: GeneratedStep[] = []
    const teardownSteps: GeneratedStep[] = []
    
    for (const rule of rules) {
      const matches = this.evaluateTrigger(rule.trigger, workflow)
      if (!matches) continue
      
      const generated = this.applyRule(rule, workflow)
      
      if (rule.generatesPhase === 'setup') {
        setupSteps.push(...generated)
      } else {
        teardownSteps.push(...generated)
      }
    }
    
    return { setup: setupSteps, teardown: teardownSteps }
  }
  
  private evaluateTrigger(trigger: AutoGenTrigger, workflow: Workflow): boolean {
    switch (trigger.type) {
      case 'device_present':
        return workflow.phases.some(p => p.groups.some(g => g.steps.some(s => s.deviceId)))
      case 'bom_present':
        return workflow.bomComponents.length > 0
      // ...
    }
  }
}
```

---

## 22. Git Workflow

### 22.1 Conventional Commits

```bash
# Format: <type>(<scope>): <subject>

feat(work-orders): add release validation
fix(hmi): resolve scan timeout issue
docs(api): update OpenAPI examples
style(ui): format with prettier
refactor(auth): extract token logic to service
perf(dashboard): optimize KPI query
test(workflows): add e2e for canvas editing
chore(deps): bump dependencies
build(ci): add bundle size check
ci(workflows): add e2e tests
```

**Types**:
- `feat` — new feature
- `fix` — bug fix
- `docs` — documentation
- `style` — formatting (no logic change)
- `refactor` — code restructure
- `perf` — performance
- `test` — tests
- `chore` — maintenance
- `build` — build system
- `ci` — CI/CD

### 22.2 Branch strategy

```bash
main                      # always deployable
├── develop              # integration branch (V2 if used)
├── feat/work-orders-release
├── fix/hmi-scan-timeout
└── chore/deps-update
```

### 22.3 PR template

```markdown
## What
Brief description of changes

## Why
Motivation, link to issue/spec

## How
Technical approach, key decisions

## Screenshots
(if UI changes)

## Testing
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] E2E tests added
- [ ] Manually tested in browser
- [ ] Tested on mobile/tablet (if applicable)

## Checklist
- [ ] Code follows project conventions
- [ ] No `any` types
- [ ] No `console.log` left
- [ ] Translations added if needed
- [ ] Documentation updated
- [ ] Breaking changes noted
- [ ] Migration steps documented (if DB changes)

## Breaking changes
None / Description

## Migration
N/A / Steps required
```

### 22.4 Code review checklist

**Code quality**:
- [ ] No `any` types
- [ ] No commented-out code
- [ ] No `console.log` left
- [ ] Functions < 50 lines
- [ ] Files < 300 lines
- [ ] Naming follows conventions

**Testing**:
- [ ] Unit tests for new logic
- [ ] Integration test if API endpoint
- [ ] Coverage maintained or improved

**UX**:
- [ ] Loading states implemented
- [ ] Empty states handled
- [ ] Error states with recovery
- [ ] Mobile responsive
- [ ] Accessibility checked
- [ ] Translations added (IT + EN)

**Security**:
- [ ] Input validation server-side
- [ ] Permission checks
- [ ] No secrets in code
- [ ] Plant scope verified

**Performance**:
- [ ] No N+1 queries
- [ ] Bundle size acceptable
- [ ] Critical paths optimized

**Documentation**:
- [ ] JSDoc for public APIs
- [ ] README updated if needed
- [ ] ADR if architectural change

---

## 23. CI/CD Standards

### 23.1 Pipeline stages

```yaml
# .github/workflows/ci.yml
name: CI

on: [pull_request, push]

jobs:
  install:
    # Cache dependencies
    
  lint:
    needs: install
    # ESLint + Prettier
    
  typecheck:
    needs: install
    # tsc --noEmit on all packages
    
  test-unit:
    needs: install
    # Vitest
    
  test-integration:
    needs: install
    services:
      postgres: { image: postgres:16 }
      redis: { image: redis:7 }
    # Vitest + testcontainers
    
  build:
    needs: [lint, typecheck, test-unit]
    # turbo run build
    
  test-e2e:
    needs: build
    # Playwright
    
  bundle-size:
    needs: build
    # next-bundle-analyzer + size budget enforcement
    
  security-scan:
    # Snyk + Trivy
    
  deploy-preview:
    if: github.event_name == 'pull_request'
    # Vercel preview / similar
```

### 23.2 Pre-commit hooks (Husky)

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  },
  "scripts": {
    "prepare": "husky install"
  }
}
```

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

```bash
# .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx commitlint --edit $1
```

### 23.3 Branch protection

`main` branch:
- Require PR review (1+ approvals)
- Require status checks pass
- Require branches up to date
- Require linear history (squash merge)
- Prohibit force push
- Prohibit direct commits

---

## 24. Documentation Standards

### 24.1 JSDoc for public APIs

```typescript
/**
 * Releases a Work Order, transitioning state from PLANNED to RELEASED.
 *
 * Performs comprehensive validation: skills coverage, BOM availability,
 * equipment status, recipe approval. Generates Setup phase from auto-gen
 * rules. Allocates serial range if tracking mode is SERIAL.
 *
 * @param workOrderId - The Work Order to release
 * @param ctx - Request context with user and plant info
 * @throws {WorkOrderNotReleasableException} If validations fail
 * @throws {InvalidStateTransitionException} If WO is not in PLANNED state
 * @returns The released Work Order with workflow snapshot
 *
 * @example
 * ```ts
 * const released = await service.release('wo-123', {
 *   userId: 'user-456',
 *   plantId: 'plant-abc'
 * })
 * ```
 *
 * @see MASTER_SPECIFICATION.md § 6.1 Work Order state machine
 * @see MASTER_SPECIFICATION.md § 8 Auto-Generation Engine
 */
async release(workOrderId: string, ctx: RequestContext): Promise<WorkOrder> {
  // ...
}
```

### 24.2 Architecture Decision Records (ADR)

```markdown
# ADR-002: Prisma over TypeORM

**Status**: Accepted  
**Date**: 2026-04-26  
**Deciders**: Engineering Lead, Backend Team

## Context
We need an ORM for our NestJS backend connected to PostgreSQL.
Main candidates: Prisma, TypeORM, Drizzle.

## Decision
Use Prisma 5+.

## Rationale
- Best TypeScript support: generated types from schema
- Modern API (async/await, fluent)
- Strong migrations with version control
- Excellent dev experience (Prisma Studio, autocomplete)
- Active development, large community
- Performance acceptable for our workload

## Trade-offs
- Less flexible for raw SQL → use $queryRaw when needed
- Migration model less flexible than TypeORM → accepted
- Single binary process per app instance → manageable

## Consequences
- All DB access via Prisma Client
- Repositories abstract Prisma details
- Schema changes via Prisma Migrate
- $queryRaw for complex/optimized queries

## Alternatives considered
- **TypeORM**: more flexible but worse TypeScript types, decorators feel dated
- **Drizzle**: excellent but younger, less mature tooling
```

### 24.3 README structure

Each package/app needs a README with:

```markdown
# Package Name

Brief description (1-2 sentences).

## Setup
Commands to install and configure.

## Usage
Common operations.

## Architecture
Key concepts, patterns used.

## Testing
How to run tests.

## Contributing
Link to CONTRIBUTING.md.
```

### 24.4 OpenAPI spec

Auto-generated from NestJS decorators + Zod schemas. Served at `/api/docs` (Swagger UI) and `/api/docs-json`.

---

## 25. Common Pitfalls

Project-specific anti-patterns we've encountered or want to prevent.

### 25.1 Missing `plant_id` in queries

**Symptom**: Cross-plant data leak.

**Wrong**:
```typescript
const wo = await prisma.workOrder.findUnique({ where: { id } })
```

**Right**:
```typescript
const wo = await prisma.workOrder.findFirst({ 
  where: { id, plantId, deletedAt: null } 
})
```

**Prevention**:
- Linting rule: warn on findUnique without plantId
- Repository pattern enforces it
- Tests verify isolation

### 25.2 Direct Prisma in controllers

**Symptom**: Business logic scattered, hard to test.

**Wrong**:
```typescript
@Post()
async create(@Body() dto) {
  return this.prisma.workOrder.create({ data: dto })  // ❌
}
```

**Right**: Controller → Service → Repository → Prisma.

### 25.3 useEffect for data fetching

**Symptom**: Race conditions, no caching, manual loading state.

**Wrong**:
```typescript
useEffect(() => {
  setLoading(true)
  fetchWorkOrder(id).then(setData).finally(() => setLoading(false))
}, [id])
```

**Right**: Use TanStack Query.

### 25.4 Step config not validated

**Symptom**: Polymorphic step.config bypassing Zod, runtime errors in HMI.

**Wrong**: Direct save without category schema validation.

**Right**: Always validate via `stepSchemaRegistry.validate(category, config)`.

### 25.5 Optimistic update without rollback

**Symptom**: UI shows success but server rejected.

**Wrong**:
```typescript
setItems(items.map(i => i.id === id ? newItem : i))
await api.update(id, newItem)  // if this fails, UI is wrong
```

**Right**: Use TanStack Query's optimistic update pattern with onError rollback.

### 25.6 Hardcoded translations

**Symptom**: New strings not translated, regressions.

**Wrong**: `<Button>Save</Button>`

**Right**: `<Button>{t('actions.save')}</Button>`

### 25.7 Missing audit fields on update

**Symptom**: No traceability, "who changed what when?" unanswerable.

**Wrong**:
```typescript
await prisma.workOrder.update({ where: { id }, data: { status: 'released' } })
```

**Right**:
```typescript
await prisma.workOrder.update({
  where: { id, plantId },
  data: {
    status: 'released',
    updatedAt: new Date(),
    updatedBy: ctx.userId,
    version: { increment: 1 }
  }
})
```

### 25.8 Event emit inside transaction

**Symptom**: Event handler runs before commit, sees stale data.

**Wrong**:
```typescript
await prisma.$transaction(async (tx) => {
  const wo = await tx.workOrder.update(...)
  this.events.emit('workOrder.released', wo)  // ❌ inside transaction
})
```

**Right**:
```typescript
const wo = await prisma.$transaction(async (tx) => {
  return tx.workOrder.update(...)
})
this.events.emit('workOrder.released', wo)  // ✅ after commit
```

### 25.9 Forgetting buffer eviction handling

**Symptom**: Late parallel work breaks because part not in buffer anymore.

**Right**: Step retains explicit `targetPartId`, not just offset.

### 25.10 Recipe modification while WO in flight

**Symptom**: WO uses outdated parameters.

**Right**: WO uses snapshot from release time, not current recipe version.

### 25.11 Box capacity not validated atomically (NEW v1.1)

**Symptom**: Race condition — two operators pack the same box simultaneously, total exceeds capacity.

**Wrong**:
```typescript
// Read box, check capacity, then update — RACE CONDITION
const box = await getBox(id)
if (box.currentWeight + weight <= box.maxWeight) {
  await addContent(id, weight)
  await updateBoxWeight(id, box.currentWeight + weight)
}
```

**Right**: Single transaction with optimistic locking.
```typescript
await prisma.$transaction(async (tx) => {
  const box = await tx.box.findFirst({ where: { id } })
  // validate capacity
  // create content
  // update box with version check
  await tx.box.update({
    where: { id, version: box.version },  // optimistic lock
    data: { currentWeight: { increment: weight }, version: { increment: 1 } }
  })
})
```

### 25.12 Modifying contents of a sealed box (NEW v1.1)

**Symptom**: Audit trail compromised, compliance issue.

**Wrong**: Allowing pack/unpack on `sealed` status.

**Right**: 
- Block all content modifications when `isSealed=true`
- Require explicit `open_sealed_box` action with mandatory reason
- Audit log every seal break
- Require special permission `box.openSealed`

### 25.13 Forgetting to increment cycle count (NEW v1.1)

**Symptom**: Returnable boxes used forever, never flagged for inspection.

**Wrong**: Resetting box to `empty` without incrementing `cyclesCount`.

**Right**: Always go through proper lifecycle (returned → cleaning → empty) which auto-increments cycles. Never directly set status to `empty` from any state.

### 25.14 Hard-coding box types instead of using registry (NEW v1.1)

**Symptom**: New box types require code changes, no plant-specific configuration.

**Wrong**:
```typescript
const PALLET_MAX_WEIGHT = 1000  // hard-coded
if (totalWeight > PALLET_MAX_WEIGHT) throw ...
```

**Right**: Always read from BoxType registry.
```typescript
const box = await getBoxWithType(id)
if (totalWeight > box.type.maxWeightKg) throw ...
```

### 25.15 Denormalized box fields out of sync (NEW v1.1)

**Symptom**: Box.currentUnits doesn't match COUNT(BoxContent).

**Wrong**: Update one without the other.

**Right**: Always update Box denormalized fields and BoxContent in same transaction. Add invariant check (assertion in tests):
```typescript
// Test invariant
expect(box.currentUnits).toBe(
  await prisma.boxContent.count({ where: { boxId, removedAt: null } })
)
```

### 25.16 Skipping skills coverage check on assignment (NEW v1.2)

**Symptom**: Operator without required skill executes step, quality risk.

**Wrong**:
```typescript
async assign(workOrderId, operatorId) {
  // Just create assignment without check
  return prisma.workOrderAssignment.create({...})
}
```

**Right**: 
- Always check skills coverage before activation
- Override allowed only with permission + audit reason
- Log every override

### 25.17 Skipping FAI for first piece (NEW v1.2)

**Symptom**: Production run without first article approval, PPAP non-compliance.

**Wrong**: Production starts without FAI step.

**Right**:
- WO `productionBlocked = true` until FAI approved
- HMI shows clear "FAI in progress" banner
- Only quality role can approve FAI

### 25.18 Continuous production tracked as discrete cycles (NEW v1.2)

**Symptom**: Counters incorrect for extrusion (1 hour run = 1 cycle counted).

**Wrong**: Use cycle-based counting for continuous processes.

**Right**:
- Phase has `productionMode: 'continuous'`
- Use `ContinuousProductionRun` entity with periodic logging
- Final count tallied at run completion

### 25.19 Sample counted as production (NEW v1.2)

**Symptom**: 100 produced, 5 sampled for testing → reports show 100 produced (wrong, should be 95).

**Wrong**: Sample logic doesn't decrement production count.

**Right**:
- `qtyProduced` counts only sellable production
- `qtySamples` separate counter
- Display both in dashboards
- Genealogy clearly distinguishes

### 25.20 Mold cycles count manually edited (NEW v1.2 — CFRP)

**Symptom**: Mold replaced too early or too late, cost waste or quality issue.

**Wrong**: Allow manual edit of `cyclesCount`.

**Right**:
- Only auto-increment via use
- Reset only via formal `replace()` action
- Audit trail mandatory

### 25.21 Cure cycle without telemetry archive (NEW v1.2 — CFRP)

**Symptom**: Customer audit fails, no proof of cure cycle parameters.

**Wrong**: Background job runs but doesn't persist time-series data.

**Right**:
- Every reading stored in `CureCycleTelemetry` (time-series)
- Linked to specific pieces (genealogy)
- Retention 15+ years for automotive

### 25.22 Out-time prepreg not validated (NEW v1.2 — CFRP)

**Symptom**: Prepreg used past out-time, scrapped pieces.

**Wrong**: No validation step before lay-up.

**Right**:
- Mandatory `out_time_check` step in workflow
- Block production if out-time exceeded
- Operator scans roll, system validates

### 25.23 Reflectance below threshold approved (NEW v1.2 — Safety)

**Symptom**: ECE-R104 violation, legal liability.

**Wrong**: System allows shipping marginal/failed reflectance pieces.

**Right**:
- `result: 'fail'` blocks shipping
- `result: 'marginal'` requires QC manager approval with audit
- Threshold values from ECE-R104 standard, hardcoded constants

### 25.24 Homologation marking without certificate (NEW v1.2 — Safety)

**Symptom**: Counterfeit marking, regulatory issue.

**Wrong**: Marking generated without active certificate validation.

**Right**:
- Validate certificate `status: 'valid'` before generation
- Marking includes certificate number for traceability
- Expired certificates auto-trigger production stop

---

## 26. Decision Log Index

ADRs in `/docs/adr/`:

| ID | Title | Status |
|---|---|---|
| ADR-001 | Monorepo with Turborepo + pnpm | Accepted |
| ADR-002 | Prisma over TypeORM | Accepted |
| ADR-003 | Zod schemas shared FE/BE | Accepted |
| ADR-004 | XState for state machines | Accepted |
| ADR-005 | Socket.IO over SSE/Pusher | Accepted |
| ADR-006 | Single-plant MVP, multi-plant ready | Accepted |
| ADR-007 | Mock device REST API in MVP | Accepted |
| ADR-008 | Polymorphic step model with JSON Schema | Accepted |
| ADR-009 | Auto-gen at workflow level, freeze at WO release | Accepted |
| ADR-010 | Single owner for groups (no multi-op MVP) | Accepted |
| ADR-011 | Recovery flow simplified (rework/scrap only MVP) | Accepted |
| ADR-012 | AP as ambient non-blocking elements | Accepted |
| ADR-013 | TanStack Query for server state | Accepted |
| ADR-014 | shadcn/ui as design system base | Accepted |
| ADR-015 | Avenir Next Cyr typography | Accepted |
| ADR-016 | Box Management as first-class entity (MVP) | Accepted |
| ADR-017 | Modular extensions for sub-domains | Accepted |
| ADR-018 | Equipment State Machine formalized in MVP | Accepted |
| ADR-019 | Maintenance Management basics in MVP | Accepted |
| ADR-020 | Tool Wear Tracking in MVP | Accepted |
| ADR-021 | Scheduling: Assignment in MVP, Gantt V2 | Accepted |
| ADR-022 | Industrial operations extensions in MVP | Accepted |
| ADR-023 | Containerized WIP + Subassemblies in MVP | Accepted |
| ADR-024 | Quality Hold/Release workflow in MVP | Accepted |
| ADR-025 | Audit UI viewer in MVP | Accepted |
| ADR-026 | CFRP Module in MVP (full coverage) | Accepted |
| ADR-027 | Safety Devices Module in MVP (full coverage) | Accepted |

---

## Quick Reference Checklist (final)

Before submitting a PR, verify:

### Code quality ✅
- [ ] No `any` types
- [ ] No `console.log`
- [ ] No commented-out code
- [ ] No unused imports
- [ ] Functions < 50 lines (or justified)
- [ ] Files < 300 lines (or justified)
- [ ] Naming conventions followed
- [ ] Imports ordered correctly

### Testing ✅
- [ ] Unit tests for new logic
- [ ] Integration test if API endpoint
- [ ] E2E test if critical user flow
- [ ] Coverage maintained
- [ ] Tests deterministic (no flaky)

### UX ✅
- [ ] Loading states
- [ ] Empty states
- [ ] Error states with recovery
- [ ] Mobile responsive
- [ ] Touch targets ≥ 48px (HMI)
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Color contrast WCAG AA

### Security ✅
- [ ] Server-side validation
- [ ] Permission checks (`@Roles`, `@RequirePermission`)
- [ ] `plant_id` filter on transactional queries
- [ ] No secrets in code
- [ ] Input sanitization
- [ ] SQL injection prevention (Prisma handles)

### Performance ✅
- [ ] No N+1 queries
- [ ] Bundle size acceptable
- [ ] Critical render path optimized
- [ ] Images optimized (Next.js Image)
- [ ] Heavy components lazy-loaded

### Domain ✅
- [ ] State machine transitions valid
- [ ] Audit fields populated
- [ ] Events emitted after transaction commit
- [ ] Snapshot pattern for WO release
- [ ] Recipe version frozen at WO release
- [ ] Multi-tenant isolation verified

### Documentation ✅
- [ ] JSDoc for public APIs
- [ ] README updated if needed
- [ ] ADR if architectural change
- [ ] Translations added (IT + EN)
- [ ] OpenAPI auto-generated correctly
- [ ] Breaking changes documented

### Real-time ✅
- [ ] Events emitted for relevant mutations
- [ ] Cache invalidation map updated
- [ ] Optimistic UI for frequent operations
- [ ] Socket.IO room subscriptions correct

---

**END OF BEST PRACTICES**

> This document is a living artifact. Update it when patterns evolve.
> Reference specific sections in PRs and code reviews.
> 
> For domain knowledge, see `MASTER_SPECIFICATION.md`.
> For quick lookup during coding, see `CONVENTIONS.md`.

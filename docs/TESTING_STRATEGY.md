# Testing Strategy — Reflexallen MES

> **Audience**: Developers, Claude Code, QA reviewers
> **Last updated**: 2026-04-27
> **Version**: 1.0

---

## 🎯 Why this document exists

The Reflexallen MES handles production operations. Bugs cost real money:
- A buggy auto-gen rule → 100 pieces scrapped
- A wrong cause code mapping → bad analytics
- A failed lot quality check → recall liability
- A WO state corruption → lost shift productivity

We can't afford "happy path only" testing. This document defines:
- WHAT to test (and what not to)
- WHERE to test (unit / integration / E2E)
- WHEN tests are "good enough"
- HOW Claude Code should write tests during build

---

## 📐 The testing pyramid

```
                    ┌─────────────┐
                    │     E2E     │   ← few (~50)
                    │  Playwright │      slow, expensive
                    └─────────────┘
                  ┌─────────────────┐
                  │   Integration   │   ← medium (~200)
                  │ Supertest + DB  │      moderately slow
                  └─────────────────┘
              ┌──────────────────────────┐
              │         Unit             │   ← many (~1000)
              │   Vitest (pure logic)    │      fast, cheap
              └──────────────────────────┘
```

**Ratio target**: ~70% unit, ~25% integration, ~5% E2E.

---

## 🔬 Unit tests

### What to unit-test

**Pure domain logic** (in `packages/domain/`):
- ✅ State machines (Equipment, Box, WorkOrder, Workflow lifecycle)
- ✅ Validation rules (workflow integrity, BOM constraints)
- ✅ KPI calculations (OEE, FPY, scrap rate, 6 Big Losses)
- ✅ Business rules (auto-gen rules, recovery flow logic)
- ✅ Utility functions (date/time, formatting, parsing)

**Service logic** (in `apps/api/`):
- ✅ Business logic isolated from DB (mock Prisma)
- ✅ Edge case handling
- ✅ Error scenarios
- ✅ Permission checks

### What NOT to unit-test

- ❌ Trivial getters/setters
- ❌ Type definitions (Zod handles this)
- ❌ React component rendering (better in integration tests)
- ❌ DB queries (better in integration)
- ❌ Third-party libraries (Prisma, NestJS internals)

### Tools

- **Vitest** for backend + packages
- **Vitest + Testing Library** for React components (rare)

### Coverage target

- **Domain logic**: 95%+ (this is the heart of the system)
- **Service logic**: 80%+
- **Utilities**: 90%+
- **UI components**: not measured here (covered by integration/E2E)

### Pattern example

```typescript
// packages/domain/src/equipment/state-machine.test.ts
import { describe, it, expect } from 'vitest';
import { equipmentMachine } from './state-machine';

describe('Equipment state machine', () => {
  it('transitions from available to reserved on ASSIGN_TO_WO', () => {
    const result = equipmentMachine.transition(
      { state: 'available' },
      { type: 'ASSIGN_TO_WO', woId: 'wo-123' }
    );
    expect(result.value).toBe('reserved');
  });

  it('rejects ASSIGN_TO_WO when in maintenance', () => {
    const result = equipmentMachine.transition(
      { state: 'maintenance' },
      { type: 'ASSIGN_TO_WO', woId: 'wo-123' }
    );
    expect(result.value).toBe('maintenance'); // unchanged
    expect(result.changed).toBe(false);
  });

  // ... more cases
});
```

### Naming conventions

- Test file: `<source>.test.ts` next to source file
- Test description: behavioral (`it('rejects invalid lot')`)
- Avoid: implementation-focused descriptions

### Mocking strategy

- ✅ Mock external dependencies (DB, Redis, MinIO)
- ✅ Mock time-dependent code (`vi.useFakeTimers()`)
- ❌ DON'T over-mock (test real logic, not mocks)
- ❌ DON'T mock the system under test

---

## 🔗 Integration tests

### What to integration-test

**API + DB interactions**:
- ✅ Each endpoint with real database (test DB, not production)
- ✅ Transactions: rollback on failure
- ✅ Concurrency: optimistic locking, race conditions
- ✅ Migrations: forward + backward compatibility
- ✅ Seed data: idempotent execution

**Cross-module flows**:
- ✅ WO release → triggers auto-gen → updates snapshot
- ✅ Lot status change → notifies dependent WOs
- ✅ Workflow approval → unlocks editing in next state

**External integrations** (mocked at HTTP boundary):
- ✅ MinIO file upload + retrieval
- ✅ Redis cache hit/miss/expiration
- ✅ BullMQ job lifecycle

### Tools

- **Supertest** for API endpoint testing (NestJS + Express)
- **Testcontainers** OR shared test DB for Postgres
- **Pact** for contract testing (V2, between FE+BE)

### Setup pattern

```typescript
// apps/api/test/work-orders.e2e-spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';

describe('Work Orders API (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    // Reset DB to clean state
    await app.get(PrismaService).$executeRaw`TRUNCATE ...`;
  });

  it('creates a work order with valid data', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/work-orders')
      .send({ itemId: '...', qtyTarget: 100 })
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
    expect(response.body.status).toBe('draft');
  });

  // ... more cases
});
```

### Test database strategy

**Option A** (preferred for MVP): Shared test DB with truncation
- Single DB for all integration tests
- Truncate tables between tests (fast)
- Run migrations once at startup

**Option B**: Testcontainers (per test suite)
- New PG container per suite (slower but cleaner)
- Better isolation
- Use for parallel test runs

**Decision**: Start with Option A. Switch to B if parallelization needed.

### Coverage target

- **API endpoints**: 80%+ (every endpoint has at least 1 happy + 1 error test)
- **Cross-module flows**: 70%+ (key flows tested)

---

## 🌐 End-to-End (E2E) tests

### What to E2E-test

**Critical user flows only** (not exhaustive):
- ✅ Operator login → start WO → execute steps → complete
- ✅ Process Engineer creates workflow → approves → release WO
- ✅ Quality Manager reviews scrap → analyzes causes → exports report
- ✅ Plant Manager opens dashboard → sees real-time production
- ✅ Auto-gen: release WO → setup steps appear in HMI
- ✅ Recovery: step fails → diagnosis → retry → success/scrap

### What NOT to E2E-test

- ❌ Every variation of a form (use unit tests)
- ❌ Visual styling (use Storybook + visual regression if needed)
- ❌ Edge cases of validation (unit tests)
- ❌ Performance (separate load testing)

### Tools

- **Playwright** for browser automation
- **Test data builders** for realistic scenarios
- **Page Object Model** for maintainability

### Pattern example

```typescript
// e2e/operator-execute-wo.spec.ts
import { test, expect } from '@playwright/test';
import { OperatorLoginPage, ExecutionPage } from './pages';

test('operator completes full WO with one scrap and recovery', async ({ page }) => {
  // Setup: WO already exists, assigned to operator OP-001
  await seedTestData('scenario-pneumatic-air-100pieces');

  // Login
  const login = new OperatorLoginPage(page);
  await login.goto();
  await login.scanBadge('OP-001');
  await login.enterPin('1234');
  
  // Select workstation
  await page.getByText('WC-EXT-PNE-01').click();
  
  // Open WO
  const exec = new ExecutionPage(page);
  await exec.openWorkOrder('WO-2026-0142');
  
  // Execute steps
  await exec.completeSetupPhase();
  await exec.executeProductionStep({ result: 'success' });
  await exec.executeProductionStep({ result: 'failure', causeCode: 'MAT-001' });
  await exec.handleRecoveryFlow({ outcome: 'scrap' });
  
  // Verify counters
  await expect(exec.qtyProduced).toHaveText('1');
  await expect(exec.qtyScrap).toHaveText('1');
  await expect(exec.qtyRemaining).toHaveText('99');
});
```

### Coverage target

- **Critical flows**: 100% (the 5-10 most important user journeys)
- **Total E2E tests**: ~20-50 max
- **Run frequency**: on PR + nightly

---

## 🎯 Tests by build phase

### After PROMPT_1 (Foundation)

Required:
- ✅ Health endpoint test (integration)
- ✅ Database connection test (integration)
- ✅ State machine tests (unit, ~30 tests)
- ✅ Zod schema tests (unit, ~20 tests)
- ✅ Validation rule tests (unit, ~15 tests)

Total: ~70 tests

### After PROMPT_2 (Registries)

Required:
- ✅ CRUD tests for each of 13 registries (~5 each = 65 integration)
- ✅ Seed test (idempotent)
- ✅ Audit log tests (10 unit + 5 integration)
- ✅ Real-time sync test (1 E2E)
- ✅ Permission tests per role (10 integration)

Total: +90 tests (~160 cumulative)

### After PROMPT_3 (Workflow Designer)

Required:
- ✅ Workflow validation rules (20 unit)
- ✅ WorkflowSnapshot creation (10 unit + 5 integration)
- ✅ Approval state machine (10 unit)
- ✅ Versioning logic (10 unit)
- ✅ E2E: create + approve + release workflow (1 E2E)

Total: +56 tests (~216 cumulative)

### After PROMPT_4 (Auto-Generation)

Required:
- ✅ Each of 7 rules: 5+ unit tests (35 unit)
- ✅ Integration: full WO release with auto-gen (5 integration)
- ✅ Edge cases: missing skills, expired lots, broken tools (10 unit)
- ✅ Performance test: < 5 sec for typical WO (1 perf)

Total: +51 tests (~267 cumulative)

### After PROMPT_5 (HMI)

Required:
- ✅ Each step renderer (8 categories × 3 tests = 24 unit/integration)
- ✅ Recovery flow E2E (1 E2E)
- ✅ Multi-level timer (5 unit)
- ✅ Counter accuracy (5 unit + 1 E2E)
- ✅ Offline mode E2E (1 E2E)
- ✅ Continuous production E2E (1 E2E)

Total: +38 tests (~305 cumulative)

### After PROMPT_6 (Dashboard & Reporting)

Required:
- ✅ KPI calculations: OEE, FPY, scrap rate, 6 losses (40 unit, ALL with manual verification)
- ✅ Dashboard data correctness (10 integration)
- ✅ Export PDF/Excel (5 integration)
- ✅ Audit search (5 integration)
- ✅ E2E: manager dashboard journey (1 E2E)

Total: +61 tests (~366 cumulative)

---

## 🎨 Test fixtures vs seed data

These are similar but different:

### Seed data (`packages/prisma/seed/`)

- **Purpose**: Realistic data for development and demos
- **Source**: `MOCK_DATA_PNEUMATIC_AIR.md`
- **Quantity**: 120+ entities across all registries
- **Idempotent**: Yes (run multiple times safely)
- **Used in**: Dev environment, integration tests setup

### Test fixtures (`test/fixtures/`)

- **Purpose**: Specific scenarios for tests
- **Source**: Hand-crafted per test
- **Quantity**: Minimal (just what test needs)
- **Used in**: Unit tests, integration tests with specific state

### Pattern: builder for fixtures

```typescript
// test/fixtures/work-order.builder.ts
export const aWorkOrder = (overrides?: Partial<WorkOrder>): WorkOrder => ({
  id: 'wo-test',
  itemId: 'item-test',
  qtyTarget: 100,
  status: 'draft',
  // ... defaults
  ...overrides,
});

// usage in test
const wo = aWorkOrder({ status: 'released', qtyTarget: 50 });
```

---

## 🚀 Running tests

### Local development

```bash
# All unit tests (fast)
pnpm test

# Specific package
pnpm --filter domain test

# Watch mode
pnpm --filter domain test --watch

# Integration tests (slower)
pnpm test:integration

# E2E tests (slowest, requires running app)
pnpm dev
pnpm test:e2e

# Coverage report
pnpm test:coverage
```

### CI/CD

On every push:
- Unit tests (fast, all)
- Integration tests (medium, all)
- Lint + type check

On PR:
- All of above
- E2E tests (critical flows)
- Coverage report

On main:
- All of above
- Performance tests
- Security scan

---

## ✅ Test quality checklist

A test is "good enough" when:

- [ ] **Independent**: Doesn't depend on test order or external state
- [ ] **Repeatable**: Runs same way every time
- [ ] **Fast**: Unit < 100ms, integration < 5s, E2E < 60s
- [ ] **Self-validating**: Pass/fail clear, no manual inspection needed
- [ ] **Timely**: Written with the feature, not after
- [ ] **Behavioral**: Tests behavior, not implementation
- [ ] **Specific**: Each test verifies one thing
- [ ] **Named clearly**: Test name describes the scenario
- [ ] **Edge cases covered**: Not just happy path
- [ ] **Failure messages helpful**: When test fails, you know why

---

## 🚫 Anti-patterns to avoid

### 1. Testing implementation details

```typescript
// ❌ BAD — couples test to implementation
expect(service.privateMethod).toHaveBeenCalled();

// ✅ GOOD — tests behavior
const result = await service.publicMethod(input);
expect(result.status).toBe('completed');
```

### 2. Excessive mocking

```typescript
// ❌ BAD — mocks everything, tests nothing real
const mockPrisma = vi.fn();
const mockEvents = vi.fn();
const mockLogger = vi.fn();
const service = new MyService(mockPrisma, mockEvents, mockLogger);

// ✅ GOOD — uses real domain logic with test DB
const service = await getRealService(testDb);
```

### 3. Brittle E2E tests

```typescript
// ❌ BAD — depends on exact text
await page.click('text=Crea nuovo elemento');

// ✅ GOOD — uses test ID
await page.click('[data-testid=create-button]');
```

### 4. Slow integration tests

If integration tests take > 5 minutes total:
- Profile and optimize
- Parallelize where safe
- Move some to unit tests
- Use Testcontainers for DB isolation

### 5. Flaky tests

Flaky tests are worse than no tests. If a test is flaky:
- Investigate the cause (race condition? timing?)
- Fix the underlying issue
- DO NOT retry-loop until pass
- DO NOT skip and forget

---

## 📊 Coverage interpretation

Coverage % is a guideline, not a goal:

- **<60%**: Inadequate, will have many bugs
- **60-80%**: Acceptable for most code
- **80-95%**: Good for critical code
- **>95%**: Diminishing returns; only for safety-critical logic

For Reflexallen MES:
- Domain logic (auto-gen, KPI, state machines): 95%+
- API services: 80%+
- UI components: 60%+ (covered by E2E)
- Utility code: 90%+

---

## 🎯 Mocking external devices

The MES integrates with physical devices (extruders, leak testers, autoclaves).

### Strategy

For tests, NEVER use real devices. Use:
- **Mock device server** (in-process REST emulator)
- **Realistic responses** (success, failure, timeout)
- **State simulation** (warming up, running, cool down)

### Example

```typescript
// test/mocks/device-server.ts
export class MockLeakTester {
  async runCycle(recipe: Recipe): Promise<LeakResult> {
    if (recipe.testPressureBar > 10) throw new Error('Out of range');
    return {
      result: Math.random() > 0.05 ? 'pass' : 'fail',
      leakRateMbarMin: Math.random() * 1.0,
      duration: 45,
    };
  }
}
```

---

## 🔄 Change log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-27 | Initial testing strategy. |

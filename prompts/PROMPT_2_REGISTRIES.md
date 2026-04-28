# PROMPT 2 — REGISTRIES v3

> **Type**: Build prompt for Claude Code (Step 2 of 6)
> **Pre-requisite**: PROMPT_1_FOUNDATION completed and committed; CLAUDE.md at repo root
> **Estimated time**: 2-3 hours
> **Last updated**: 2026-04-27

---

## 📋 PROMPT TO PASTE (copy from here)

```
TASK: Build the REGISTRIES (master data) layer of the Reflexallen MES.

(Context already loaded from CLAUDE.md at session start.)

═══════════════════════════════════════════════════════════════════════════════
GOAL
═══════════════════════════════════════════════════════════════════════════════

Build full CRUD (Create, Read, Update, Delete with soft-delete) for all 13 
master data registries. After this step, the system has:

- Working API endpoints for each registry
- Working UI pages in apps/web with list + form + detail views
- Seed data populated from MOCK_DATA_PNEUMATIC_AIR.md
- Real-time updates via Socket.IO
- Audit log automatic on every change
- Validation FE+BE via shared Zod schemas

After this step, a process engineer can log in and view/edit all reference 
data needed for production planning.

═══════════════════════════════════════════════════════════════════════════════
PRE-REQUISITES
═══════════════════════════════════════════════════════════════════════════════

You should have already completed and committed PROMPT_1 (foundation). 
Verify before starting:
✓ pnpm install runs
✓ docker compose up -d shows services healthy
✓ pnpm prisma migrate dev shows "no migrations needed"
✓ pnpm build succeeds
✓ apps/api responds on /health
✓ apps/web shows login page

═══════════════════════════════════════════════════════════════════════════════
ADDITIONAL READING (do BEFORE planning)
═══════════════════════════════════════════════════════════════════════════════

Beyond CLAUDE.md context, also read:

→ docs/MASTER_SPECIFICATION.md sections 4-7 (entity definitions)
→ docs/BEST_PRACTICES.md sections "Pattern Repository", "Pattern Frontend", "Pattern Validation"
→ docs/extensions/MOCK_DATA_PNEUMATIC_AIR.md (FULL — your seed data)
→ docs/extensions/EQUIPMENT_MANAGEMENT.md (for tool wear UI hints)
→ docs/design-tokens.md (UI components must respect these)

═══════════════════════════════════════════════════════════════════════════════
PHASE 1 — PLAN (NO CODE YET)
═══════════════════════════════════════════════════════════════════════════════

After reading, propose a plan covering:

1. REGISTRIES TO BUILD (13 total per FUNCTIONAL_INVENTORY section 2)
   
   For each, list which fields will be in:
   - List view (table columns)
   - Detail view
   - Edit form
   - Search/filter capabilities

   The 13 registries:
   
   2.1 Items
       - Polymorphic by type (FG, raw_material, component, consumable)
       - Image upload (MinIO)
       - Where-used (BOM reverse lookup)
       
   2.2 BOM (Bill of Materials)
       - Multi-level (components can be subassemblies)
       - Versioning + approval workflow
       - View as tree
       
   2.3 Equipment Hierarchy (ISA-95)
       - 5 levels: Plant > Site > Area > WorkCenter > Equipment
       - Editable canvas (React Flow or simple tree)
       
   2.4 Workstations (work centers detail)
       - Within Equipment Hierarchy
       
   2.5 Recipes
       - Versioning
       - Approval workflow (draft → approved → effective)
       - Parameters (JSON column with schema validation)
       
   2.6 Skills
       - With expiration tracking
       - Operator-skills matrix view
       
   2.7 Cause Codes
       - Categories: scrap + downtime
       - 6 Big Losses mapping (downtime)
       - i18n: textIt + textEn
       
   2.8 Tools
       - Compatibility (which items they work with)
       - Wear tracking integration (read-only here, full feature in PROMPT_3)
       
   2.9 Operators
       - With skills, badge, PIN (hashed), photo
       - Active/inactive
       
   2.10 Attention Points
       - 5 categories (safety, quality, environment, ergonomics, info)
       - i18n: textIt + textEn
       
   2.11 Auto-Generation Rules (READ-ONLY view)
       - 7 rules from MASTER_SPEC § 8.3
       - Just display, configuration in PROMPT_4
       
   2.12 BoxTypes
       - 8 categories
       - Capacity (units, weight)
       - Returnable flag
       - Sealing requirement
       
   2.13 Boxes (instances)
       - State machine (8 states)
       - Reservation
       - Audit movements

2. UI PATTERNS (consistent across all registries)
   
   List view:
   - Filterable, sortable DataTable
   - Search bar (full-text)
   - Bulk actions (delete, export)
   - "View" / "Edit" / "Delete" actions per row
   - Pagination (server-side for big tables)
   - Saved filters in URL
   
   Detail view:
   - Header with title + status + actions
   - Main content (organized in sections)
   - Activity feed (audit history)
   - Comments section
   - Attachments
   - Related entities sidebar
   
   Form view:
   - Zod schema-driven (auto-generate field types)
   - Inline validation
   - Optimistic updates with rollback on error
   - Confirmation dialog for destructive actions
   - Keyboard shortcuts (Cmd+S, Esc)

3. API STRUCTURE (NestJS)
   
   For each registry, create:
   - Module (e.g., ItemsModule)
   - Controller with endpoints:
     GET    /api/items              List (paginated, filtered)
     GET    /api/items/:id           Detail
     POST   /api/items               Create
     PATCH  /api/items/:id           Update
     DELETE /api/items/:id           Soft delete
     POST   /api/items/:id/restore   Restore soft-deleted
   - Service with business logic
   - DTO with Zod validation
   - Tests (at least 5 per registry)

4. SDK GENERATION
   - Update packages/sdk to expose typed clients for each registry
   - Use TanStack Query hooks (useItems, useItem, useCreateItem, ...)

5. SEED DATA
   - Implement packages/prisma/seed/index.ts
   - Read from MOCK_DATA_PNEUMATIC_AIR.md
   - Populate ALL entities listed there
   - Idempotent (running twice should not duplicate)
   - Order respects FK dependencies

6. SOCKET.IO INTEGRATION
   - Each entity update broadcasts an event:
     items.created, items.updated, items.deleted
     (and same for all 13 registries)
   - Frontend subscribes via TanStack Query cache invalidation

7. AUDIT LOG
   - Every mutation creates AuditLog entry:
     entity, entityId, action (create/update/delete/restore), 
     userId, before, after, timestamp, correlation_id
   - Viewable in detail view "Activity feed"

8. PERMISSIONS (basic RBAC for this step)
   - Roles: admin, planner, qc_manager, operator, viewer
   - All registries: admin can do everything
   - Other roles: read-only for now (full RBAC in later step)

9. DESIGN TOKENS COMPLIANCE
   - All UI components MUST use design tokens from docs/design-tokens.md
   - Tailwind config already set up in PROMPT_1
   - Use shadcn/ui components customized with our theme
   - Maintain visual consistency across all 13 registries

10. VERIFICATION STEPS
    - All 13 registries have working CRUD
    - Seed runs successfully
    - List view loads with pagination
    - Forms validate (FE + BE)
    - Audit log captures changes
    - Real-time update works (open 2 browser tabs, change in one, see in other)

After presenting your plan, STOP and wait for my approval.

═══════════════════════════════════════════════════════════════════════════════
PHASE 2 — BUILD (ONLY AFTER MY APPROVAL)
═══════════════════════════════════════════════════════════════════════════════

When I say "go", proceed in this order:

STEP 2.1 — Common infrastructure
  - Create base CRUD pattern that all registries extend
  - apps/api: BaseService with soft-delete + audit + events
  - apps/api: BaseController with paginated list + standard endpoints
  - apps/web: BaseRegistryPage component (list + detail + form)
  - packages/ui: DataTable, EntityForm, EntityDetail, ActivityFeed
  - Verify: tests pass for base classes

STEP 2.2 — Items registry (the most foundational)
  - Build full stack: schema → service → controller → SDK → web pages
  - Image upload via MinIO
  - Polymorphic type rendering (different fields by type)
  - "Where used" reverse lookup (BOM.components)
  - Verify: CRUD works, image upload works

STEP 2.3 — BOM registry
  - Tree view (React arborist or similar)
  - Versioning + approval state machine
  - Multi-level (components can have BOMs themselves)
  - Verify: can create multi-level BOM, approve, retract

STEP 2.4 — Equipment Hierarchy
  - Tree view editable
  - 5 levels enforced (Plant > Site > Area > WC > Equipment)
  - Drag-drop to reorganize (optional, good polish)
  - Verify: can build full hierarchy

STEP 2.5 — Recipes
  - Versioning UI
  - Approval workflow (draft → approved → effective from date)
  - JSON parameters with schema (use react-jsonschema-form or similar)
  - Verify: version history visible

STEP 2.6 — Skills + Operators
  - Build together (operators reference skills)
  - Skills: with expiration tracking, alert when expiring < 30 days
  - Operators: with photo, badge, PIN (hashed at DB level)
  - Operator-skills matrix view (drag skills onto operators)
  - Verify: PIN never exposed in API responses

STEP 2.7 — Cause Codes + Attention Points
  - Build together (similar UI patterns)
  - Categories filter
  - i18n editable (IT + EN)
  - Verify: search works in both languages

STEP 2.8 — Tools
  - Compatibility section (which items use this tool)
  - Wear status display (read-only — full feature in PROMPT_3)
  - Verify: list filters by status

STEP 2.9 — BoxTypes + Boxes
  - BoxTypes: registry of templates
  - Boxes: instances with state machine (display state in badge)
  - State machine UI uses XState visualizer
  - Verify: state transitions documented

STEP 2.10 — Auto-Generation Rules (read-only)
  - Display 7 rules from spec
  - View only — no editing here
  - Verify: all 7 rules visible with descriptions

STEP 2.11 — Workstations
  - Sub-view of Equipment Hierarchy
  - Filter equipment by work_center type
  - Verify: linked correctly to hierarchy

STEP 2.12 — Common UI features
  - Recently viewed (last 10 entities accessed)
  - Favorites (star entities)
  - Saved filters per user
  - Bulk operations (multi-select + action)
  - Trash (soft-deleted items, restorable)
  - Verify: features work across all registries

STEP 2.13 — Seed data implementation
  - Read MOCK_DATA_PNEUMATIC_AIR.md
  - Implement seed.ts: insert all entities in correct order
  - Make it idempotent (use upsert by code)
  - Verify: pnpm prisma db seed runs successfully
  - Verify: all 120+ entities visible in respective registries

STEP 2.14 — Real-time + Audit
  - Each mutation:
    - Writes audit log
    - Emits domain event (via EventBus)
    - Broadcasts Socket.IO event
  - Frontend:
    - Subscribes to relevant events
    - Invalidates TanStack Query cache
    - Shows toast notification on others' changes
  - Verify: 2 browsers, change in one → other updates

STEP 2.15 — Final verification
  - All 13 registries CRUD-complete
  - Seed runs cleanly
  - All E2E tests pass
  - Real-time works
  - Performance: list view loads < 500ms with 100+ entities
  - Design tokens applied consistently

═══════════════════════════════════════════════════════════════════════════════
PHASE 3 — VERIFY & REPORT
═══════════════════════════════════════════════════════════════════════════════

Generate a STATUS REPORT covering:

For each of 13 registries:
- ✓ CRUD complete
- ✓ Tests passing (count)
- ✓ Audit log working
- ✓ Real-time working
- Notes / known issues

Plus:
- Total entities seeded
- Total tests passing/failing
- Build time
- Suggested commit message

═══════════════════════════════════════════════════════════════════════════════
ACCEPTANCE CRITERIA
═══════════════════════════════════════════════════════════════════════════════

This prompt is COMPLETE when:

[ ] All 13 registries have working CRUD (list, detail, create, edit, delete)
[ ] Soft-delete is enforced (no hard-delete possible)
[ ] All forms use Zod validation (FE + BE)
[ ] All mutations write audit log entries
[ ] All mutations broadcast Socket.IO events
[ ] Frontend updates in real-time (verified with 2 browser tabs)
[ ] Seed populates 120+ entities from MOCK_DATA file
[ ] All E2E tests pass
[ ] List views support pagination + filtering + sorting
[ ] Detail views show activity feed (audit history)
[ ] Bulk operations work (multi-select + delete)
[ ] Trash bin lets you restore soft-deleted items
[ ] Design tokens applied consistently across all UIs
[ ] Status report generated

═══════════════════════════════════════════════════════════════════════════════
GO STEP-BY-STEP
═══════════════════════════════════════════════════════════════════════════════

Now:
1. Read the additional files listed above
2. Verify the foundation from PROMPT_1 still works
3. Present your detailed plan (no code yet)
4. Wait for my approval
5. After approval, build step by step
6. After build, generate status report

START WITH THE PLAN.
```

(End of prompt to paste)

---

## 📚 Notes for Antonella (NOT to paste to Claude Code)

### What changed from v2 to v3

- **Removed onboarding section** (now in CLAUDE.md, auto-loaded)
- **Added explicit reading list** for additional files needed for THIS task
- **Added Design Tokens Compliance section** (item 9)
- **Updated acceptance criteria** to include design tokens check

### Watch out for these issues

**Issue 1: "I'll do CRUD generic, then specialize"**
Claude Code might propose a generic CRUD generator for all entities at once. This is tempting but dangerous because each entity has special needs.
**Better**: build one registry fully, then the next. Iteratively. Items first.

**Issue 2: "I'll seed later"**
Don't let Claude Code defer seed data. The seed is essential for demos and tests.

**Issue 3: "Audit log can be MVP-2"**
NO. Automotive Tier 1 supplier requires 15+ years retention. Build it now.

**Issue 4: Performance issues with 100+ entities**
The Items registry might have 1000+ entities in production. List views must use pagination, indexes, SELECT only displayed fields.

### How long this should take

| Activity | Estimated time |
|---|---|
| Read additional specs | 15-20 min |
| Plan proposal | 15-20 min |
| Plan review | 10-15 min |
| Build (~15 steps) | 90-150 min |
| Verify | 15-20 min |
| Status report | 5-10 min |
| **Total** | **2-3.5 hours** |

This is the longest prompt. If it takes >4 hours, split it.

### Splitting strategy if too long

**Split A — Foundation registries**: Items, BOM, Equipment Hierarchy, Recipes, Skills + Operators (1.5h)
**Split B — Reference registries**: Cause Codes + Attention Points, Tools, BoxTypes + Boxes, Auto-Gen Rules, Workstations (1h)
**Split C — Polish**: Common UI features, Seed data, Real-time integration (1h)

You can do A, commit, B, commit, C, commit. Each ~1-1.5 hours.

### After this step

After PROMPT_2, you can:
- Show colleagues "look, all our master data in the system"
- Have a process engineer enter real production data
- Validate the data model with stakeholders before continuing

This is a great natural pause point in development.

After commit, proceed with PROMPT_3_WORKFLOW_DESIGNER.md (when generated) in a new session.

---

## 🔄 Change Log

| Version | Date | Changes |
|---|---|---|
| 1.0 | (earlier) | Initial registries prompt (v1.0 entities only) |
| 2.0 | 2026-04-27 | Added v1.2 registries support, MOCK_DATA seed, polish features |
| 3.0 | 2026-04-27 | Removed onboarding (now in CLAUDE.md auto-load). Added explicit reading list. Added design tokens compliance check. Streamlined for cleaner pattern. |

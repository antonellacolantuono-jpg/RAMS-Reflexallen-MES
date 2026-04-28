# PATCH — Local Dev Mode (SQLite, No Docker)

> **Type**: Patch to be appended to PROMPT_1_FOUNDATION.md
> **Purpose**: Build the MES without Docker, using SQLite + filesystem + in-memory cache
> **Use case**: Development without Docker access, stakeholder demos, learning
> **Last updated**: 2026-04-27

---

## 📋 PATCH TO PASTE (after PROMPT_1_FOUNDATION standard prompt)

Copy this section and paste it AT THE END of PROMPT_1_FOUNDATION when you start the Claude Code session.

```
═══════════════════════════════════════════════════════════════════════════════
LOCAL DEV MODE PATCH — NO DOCKER VARIANT
═══════════════════════════════════════════════════════════════════════════════

OVERRIDE: This build is for local development WITHOUT Docker installed.
Apply ALL of the following modifications to your standard plan:

1. DATABASE: Use SQLite instead of PostgreSQL
   - Prisma datasource: provider = "sqlite"
   - Database file: ./packages/prisma/dev.db (committed to .gitignore)
   - Connection string in .env: DATABASE_URL="file:./dev.db"
   - DO NOT create docker-compose.yml
   - DO NOT use postgres-specific features (e.g., raw SQL with PG operators)
   - For UUID/cuid: keep using cuid() — works in SQLite
   - For JSON columns: use String fields with JSON.stringify/parse helpers
   - Add migration command: pnpm prisma migrate dev --name init (works same)

2. CACHE: Use in-memory Map instead of Redis
   - Create packages/cache/src/index.ts with simple Map-based cache
   - API: get(key), set(key, value, ttlSec?), del(key), clear()
   - Implement TTL with setTimeout cleanup
   - Mark as "dev-mode placeholder" for production migration to Redis later

3. QUEUE: Use synchronous execution instead of BullMQ
   - Create packages/queue/src/index.ts with simple in-process job runner
   - API: addJob(name, data, handler) — executes synchronously or with setTimeout
   - For long-running tasks: use Node.js setImmediate or worker_threads
   - Mark as "dev-mode placeholder" for production migration to BullMQ later
   - DO NOT install bullmq or ioredis packages

4. STORAGE: Use local filesystem instead of MinIO
   - Storage root: ./uploads/ (committed to .gitignore)
   - Create packages/storage/src/index.ts with local filesystem adapter
   - API: put(key, buffer), get(key), delete(key), list(prefix)
   - Files saved to ./uploads/{key}
   - Mark as "dev-mode placeholder" for production migration to MinIO/S3 later
   - DO NOT install @minio/minio-js or aws-sdk

5. ENV VARIABLES (.env): Set these dev defaults
   DATABASE_URL="file:./packages/prisma/dev.db"
   CACHE_MODE="memory"
   QUEUE_MODE="sync"
   STORAGE_MODE="local"
   STORAGE_LOCAL_PATH="./uploads"
   NODE_ENV="development"
   API_PORT=3000
   WEB_PORT=3001
   HMI_PORT=3002

6. APPS: Skip apps/worker
   - SKIP creating apps/worker (it's BullMQ-based, not needed in sync mode)
   - The 3 remaining apps (api, web, hmi) handle everything in dev mode

7. PRISMA SCHEMA ADAPTATIONS for SQLite:
   - Replace any PG-specific types with SQLite-compatible:
     * Use String for UUIDs (already done with cuid())
     * Use String for JSON columns (with helper functions)
     * Use DateTime (works in SQLite)
     * Use Boolean (works in SQLite)
     * Use Int and Float (work in SQLite)
   - Keep all entity definitions IDENTICAL to v1.2 spec — only adapt types
   - All relations work the same way
   - All indexes work the same way

8. PACKAGES TO INSTALL (additional):
   - better-sqlite3 (Prisma's SQLite driver)
   - No need for @prisma/adapter-pg or pg

9. PACKAGES NOT TO INSTALL (omit):
   - bullmq
   - ioredis
   - @minio/minio-js
   - aws-sdk
   - pg
   - postgres

10. .GITIGNORE additions:
    - dev.db
    - dev.db-journal
    - uploads/
    - *.db

11. README.md update:
    - Add a note: "Currently in DEV MODE without Docker.
      Database: SQLite (./packages/prisma/dev.db)
      Cache: in-memory
      Queue: synchronous
      Storage: local filesystem (./uploads/)
      For production migration to PostgreSQL/Redis/MinIO, see docs/DEPLOYMENT.md (V2)"

12. VERIFICATION CHANGES:
    - REPLACE step "docker compose up -d" with "create empty uploads/ folder"
    - REPLACE step "postgres connection test" with "verify dev.db file exists"
    - All other verification steps remain the same
    - pnpm build, pnpm test, pnpm lint, pnpm dev → all work the same

13. DOCUMENTATION:
    - In CHANGELOG.md, add entry under [Unreleased]:
      "Note: built in DEV MODE (SQLite, no Docker) for local development"
    - Create docs/DEV_MODE.md explaining the differences and migration path

═══════════════════════════════════════════════════════════════════════════════
WHAT STAYS THE SAME
═══════════════════════════════════════════════════════════════════════════════

Everything ELSE in PROMPT_1_FOUNDATION applies normally:
- Monorepo structure (Turborepo + pnpm)
- All shared packages (types, schemas, ui, sdk, config, domain)
- All Zod schemas
- All state machines (XState)
- All Prisma entities (just SQLite-compatible)
- All UI patterns (shadcn/ui + Tailwind)
- TypeScript strict mode
- All tests
- All audit logging
- All real-time (Socket.IO works without Docker)

═══════════════════════════════════════════════════════════════════════════════
EXPECTED OUTCOME
═══════════════════════════════════════════════════════════════════════════════

After this build:
- pnpm install                          (works)
- pnpm prisma migrate dev               (creates dev.db with all v1.2 entities)
- pnpm build                            (all packages compile)
- pnpm dev                              (starts api on :3000, web on :3001, hmi on :3002)
- curl http://localhost:3000/health     (returns 200 ok)
- http://localhost:3001                 (web admin loads)
- http://localhost:3002                 (HMI loads)

User can then:
- Create Items via UI → saved in dev.db
- Upload images → saved in ./uploads/
- All CRUD operations work
- Real-time updates via Socket.IO work
- Audit log writes to dev.db
- Stakeholder demos fully functional

═══════════════════════════════════════════════════════════════════════════════
MIGRATION PATH (for future, when Docker becomes available)
═══════════════════════════════════════════════════════════════════════════════

When ready to switch to production stack:
1. Install Docker Desktop or equivalent
2. Create docker-compose.yml with postgres + redis + minio
3. Change DATABASE_URL in .env to PostgreSQL connection string
4. Change Prisma datasource provider from "sqlite" to "postgresql"
5. Run: pnpm prisma migrate dev --name production_migration
6. Adapt JSON String fields back to native JSON columns
7. Replace cache/queue/storage packages with real implementations
8. Re-create apps/worker for BullMQ
9. Test thoroughly

This migration takes ~1-2 hours of focused work, NOT a full rebuild.

═══════════════════════════════════════════════════════════════════════════════

Apply all the above modifications to your foundation plan, then proceed with
the standard PROMPT_1_FOUNDATION instructions. Present the modified plan and
wait for my approval before building.

START WITH THE MODIFIED PLAN.
```

(End of patch to paste)

---

## 📚 Notes for Antonella (NOT to paste to Claude Code)

### How to use this patch

1. Open Claude Code in the repo (CLAUDE.md auto-loaded)
2. Copy the entire content of `prompts/PROMPT_1_FOUNDATION.md` (the "PROMPT TO PASTE" section)
3. Paste it in Claude Code
4. **THEN copy the patch above** (the "PATCH TO PASTE" section)
5. Paste it RIGHT AFTER the PROMPT_1 content
6. Press Enter

Claude Code will receive both: the standard prompt + the patch overrides.

### What changes vs original PROMPT_1

| Aspect | Original PROMPT_1 | With patch |
|---|---|---|
| Database | PostgreSQL | SQLite (`dev.db`) |
| Cache | Redis | In-memory Map |
| Queue | BullMQ | Synchronous / setTimeout |
| Storage | MinIO | Local filesystem |
| Docker | Required | Not used |
| apps/worker | Created | Skipped |
| Number of apps | 4 | 3 (api, web, hmi) |
| Build time | ~2-3 hours | ~1.5-2 hours (less services) |
| Functionality | 100% | ~95% (job scheduling simplified) |

### What works perfectly

- All 13 master data registries (Items, BOM, Equipment, etc.)
- CRUD operations
- Form validation
- Real-time sync via Socket.IO
- Audit logging
- File uploads (saved to ./uploads/)
- Soft delete
- Optimistic locking
- All v1.2 entities

### What is "simplified" (still works, but not production-grade)

- Background jobs run synchronously (no parallelization)
- Cache is per-process (not shared across instances)
- File storage is local (not distributed)
- No automatic retries on failed jobs

For the use case "demo to stakeholders + show working MES", these limitations are completely acceptable.

### When to migrate

If you decide to go production:
- Docker becomes available → migrate
- Multiple users testing simultaneously → migrate
- Performance issues with 10000+ records → migrate
- Need for distributed deployment → migrate

For dev/demo with 1-3 users, SQLite is perfectly fine.

### Estimated migration time later

- Switch DB: 30 min
- Restore Redis cache: 30 min
- Restore MinIO storage: 30 min
- Restore BullMQ queue: 30 min
- Recreate apps/worker: 30 min
- Test everything: 60 min

**Total: 3-4 hours** (well-defined, not a rebuild)

---

## 🔄 Change Log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-27 | Initial patch for local dev without Docker. |

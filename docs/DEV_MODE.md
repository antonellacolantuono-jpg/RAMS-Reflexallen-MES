# DEV MODE — Local Development Without Docker

## Overview

This repository is currently configured for **DEV MODE**: local development without Docker.

| Service | Production | DEV MODE |
|---------|-----------|---------|
| Database | PostgreSQL 16 | SQLite (`packages/prisma/dev.db`) |
| Cache | Redis 7 | In-memory `Map` (per-process, no sharing) |
| Queue | BullMQ | Synchronous execution (`setImmediate`) |
| Storage | MinIO (S3-compatible) | Local filesystem (`./uploads/`) |
| Worker | apps/worker (standalone) | Not needed (sync execution in api) |

## What works identically

- All 63 Prisma entities and their relations
- All Zod schemas and validation
- All XState state machines (domain logic)
- All UI components and design system
- Real-time updates via Socket.IO
- Audit logging
- Soft delete
- All CRUD operations

## What is simplified

- **Background jobs** run synchronously (no parallelism, no retries, no delays)
- **Cache** is per-process only (restart = cache clear; fine for dev)
- **File storage** is local disk only (not distributed)

## Limitations for dev

- Cannot run multiple API instances simultaneously (cache not shared)
- Long-running jobs (cure cycles, aging tests) block the request thread in sync mode
- No job retry on failure

## Getting started

```bash
# 1. Copy env template
cp .env.example .env

# 2. Install dependencies
pnpm install

# 3. Run initial migration (creates dev.db)
pnpm prisma migrate dev --name init

# 4. (Optional) Seed initial data
pnpm prisma db seed

# 5. Start all apps
pnpm dev

# Apps available at:
#   API:  http://localhost:3000
#   Web:  http://localhost:3001
#   HMI:  http://localhost:3002
```

## Migration to production stack

When Docker becomes available (or for staging/production deployment):

### Step 1 — Database: SQLite → PostgreSQL
```bash
# In .env:
DATABASE_URL="postgresql://mes_user:password@localhost:5432/mes_dev?schema=public"

# In packages/prisma/schema.prisma:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

# Adapt JSON String fields back to native Json type
# Remove serialize/parse helpers in services

pnpm prisma migrate dev --name production_migration
```

### Step 2 — Cache: in-memory → Redis
```bash
# In .env:
CACHE_MODE=redis
REDIS_URL=redis://localhost:6379

# Install ioredis:
pnpm add ioredis --filter @mes/cache

# Switch packages/cache implementation to Redis adapter
```

### Step 3 — Queue: sync → BullMQ
```bash
# In .env:
QUEUE_MODE=bullmq

# Install bullmq:
pnpm add bullmq --filter @mes/queue

# Switch packages/queue implementation to BullMQ adapter
# Create apps/worker (NestJS standalone)
```

### Step 4 — Storage: local → MinIO
```bash
# In .env:
STORAGE_MODE=minio
MINIO_ENDPOINT=localhost
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...

# Install @aws-sdk/client-s3 or minio:
pnpm add @aws-sdk/client-s3 --filter @mes/storage

# Switch packages/storage implementation to MinIO/S3 adapter
```

**Estimated migration time**: 3–4 hours (well-defined swap, not a rebuild).

## File locations

- `packages/prisma/dev.db` — SQLite database (gitignored)
- `./uploads/` — uploaded files (gitignored)
- `packages/prisma/dev.db-journal` — SQLite journal (gitignored)

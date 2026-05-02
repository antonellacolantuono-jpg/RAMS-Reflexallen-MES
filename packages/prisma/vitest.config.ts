import { defineConfig } from 'vitest/config'

// PROMPT_PNE_2 D1 — vitest setup for @mes/prisma.
// Tests are pure data-shape (no DB / no PrismaClient instantiation).
// Glob picks up both seed/pneumatic-data/__tests__ AND any future src/ tests.
//
// Windows note: Vitest 2.1.x parallel runner hits temp-file races on Windows
// (UNKNOWN error opening AppData\Local\Temp\…) — see STATUS.md lesson 54.
// Workaround: pool=forks + singleFork serializes test files within one process.
export default defineConfig({
  test: {
    include: ['seed/**/*.test.ts', 'src/**/*.test.ts'],
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
})

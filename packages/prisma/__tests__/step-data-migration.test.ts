import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// PROMPT_7 D1 — pin the schema migration so:
//   1. The new `data` column on `Step` is documented in schema.prisma.
//   2. The migration SQL adds the column (no manual `prisma db push` drift).
//   3. The column is `String?` (TEXT) — SQLite + Prisma 5 has no native Json,
//      and we follow the StepExecution.data precedent. See § 5 S2.

describe('PROMPT_7 D1 — Step.data column migration', () => {
  it('schema.prisma declares Step.data as String?', () => {
    const schemaPath = join(__dirname, '..', 'schema.prisma')
    const schema = readFileSync(schemaPath, 'utf-8')

    // Find the Step model block.
    const match = schema.match(/model Step \{([\s\S]*?)\}/)
    expect(match, 'expected to find `model Step { … }` block in schema.prisma').not.toBeNull()
    const block = match![1]!

    // Step.data must be present and typed `String?`.
    expect(block).toMatch(/\bdata\s+String\?/)
  })

  it('migration directory exists with the expected ALTER TABLE', () => {
    const migrationPath = join(
      __dirname,
      '..',
      'migrations',
      '20260503140000_prompt_7_step_data_json',
      'migration.sql',
    )
    const sql = readFileSync(migrationPath, 'utf-8')

    expect(sql).toMatch(/ALTER TABLE\s+"steps"\s+ADD COLUMN\s+"data"\s+TEXT/i)
  })
})

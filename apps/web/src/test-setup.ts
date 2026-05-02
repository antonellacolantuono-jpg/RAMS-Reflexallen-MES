import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// vitest@2.1 + @testing-library/react@16 do not auto-cleanup the DOM between
// tests on Windows in serial mode (the auto-registration races with vitest's
// global test environment), which surfaces as DOM pollution: a later test
// sees nodes left behind by an earlier one. Explicit cleanup is the
// documented escape hatch.
afterEach(() => cleanup())

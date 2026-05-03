import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    // Vitest 2.1 + Windows multi-worker hits a temp-dir race on this repo
    // (Lesson #54 from STATUS history; same flake affects @mes/api,
    // @mes/domain, @mes/web). Disabling file parallelism resolves it without
    // breaking jsdom DOM cleanup the way singleFork would.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
})

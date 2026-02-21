import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: '.',
    include: ['src/__tests__/**/*.test.ts'],
    setupFiles: ['src/__tests__/helpers/setup.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    maxWorkers: 1,
    minWorkers: 1,
  },
});

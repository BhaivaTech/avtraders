// vitest.config.js
// Vitest is the test runner. We point it at the test/ directory and
// run our setup file (which mocks the MySQL pool) before every test.

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['test/**/*.test.js'],
    setupFiles: ['test/helpers/hooks.js'],
    testTimeout: 10_000,
    hookTimeout: 10_000,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: [
        'src/config/**',
        'src/utils/sentry.js',
        'src/utils/logger.js',
        'src/utils/migrations.js',
      ],
      reporter: ['text', 'html'],
    },
  },
});

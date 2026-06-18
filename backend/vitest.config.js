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
  // The PhonePe SDK is shipped as a tarball with non-standard
  // package.json exports, which Vite's resolver rejects. Tell Vite
  // to leave it alone — the test app does not load phonepe-api.js.
  optimizeDeps: { exclude: ['pg-sdk-node'] },
  resolve: {
    alias: {
      // Stub the PhonePe SDK with an empty module so any stray
      // import (e.g. from payment routes) resolves cleanly in tests.
      'pg-sdk-node': new URL('./test/helpers/empty-module.js', import.meta.url).pathname,
    },
  },
});

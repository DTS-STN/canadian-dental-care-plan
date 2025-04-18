import { reactRouter } from '@react-router/dev/vite';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { coverageConfigDefaults } from 'vitest/config';

/**
 * Application build and unit test configuration.
 * See vite.server.config.ts for the server build config.
 */
export default defineConfig({
  build: {
    target: 'es2022',
  },
  server: {
    hmr: {
      port: 3001,
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2022',
    },
    // Configure Remix plugin optimizeDeps entries since is has a bug on Windows
    // TODO: Check if the issue has been fixed
    // @see https://github.com/remix-run/remix/pull/10258
    entries: ['./app/entry.client.tsx', './app/root.tsx', './app/routes/**/*.tsx'],
    // exclude the otlp-exporter-base package because it causes
    // issues with vite's dependency optimization
    // see: https://github.com/open-telemetry/opentelemetry-js/issues/4794
    exclude: ['@opentelemetry/otlp-exporter-base'],
  },
  plugins: [
    tailwindcss(),
    tsconfigPaths(),
    //
    // see https://github.com/remix-run/remix/issues/9871
    //
    process.env.NODE_ENV === 'test' ? react() : reactRouter(),
  ],

  //
  // Vitest config. For more test configuration, see vitest.workspace.ts
  // see: https://vitest.dev/config/
  //
  test: {
    coverage: {
      include: ['**/app/**/*.{ts,tsx}'],
      exclude: [
        '!**/app/[.]client/**', //
        '!**/app/[.]server/**',
        '**/app/mocks/**',
        ...coverageConfigDefaults.exclude,
      ],
    },
    setupFiles: ['./__tests__/setup-test-env.ts'],
  },
});

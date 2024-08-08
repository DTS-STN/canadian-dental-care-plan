/// <reference types="vitest" />
import { installGlobals } from '@remix-run/node';

import react from '@vitejs/plugin-react';
import envOnly from 'vite-env-only';
import tsconfigPaths from 'vite-tsconfig-paths';
import { configDefaults, defineConfig } from 'vitest/config';

// install global node polyfills
// see: https://remix.run/docs/en/main/other-api/node#polyfills
installGlobals({ nativeFetch: true });

export default defineConfig({
  plugins: [envOnly({}), react(), tsconfigPaths()],
  test: {
    pool: 'forks',
    testTimeout: 50000,
    // happy-dom doesn't support button submit or FormData
    // https://github.com/capricorn86/happy-dom/issues/527
    // https://github.com/capricorn86/happy-dom/issues/585
    environment: 'jsdom',
    setupFiles: ['./__tests__/setup-test-env.ts'],
    exclude: [...configDefaults.exclude, '**/build/**', '**/e2e/**'],
    coverage: {
      include: ['**/app/**'],
      exclude: ['**/app/**/*.d.ts', '**/app/mocks/**'],
    },
  },
});

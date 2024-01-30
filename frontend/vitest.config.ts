/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    pool: 'forks',
    testTimeout: 50000,
    globals: true,
    // happy-dom doesn't support button submit or FormData
    // https://github.com/capricorn86/happy-dom/issues/527
    // https://github.com/capricorn86/happy-dom/issues/585
    environment: 'jsdom',
    setupFiles: ['./__tests__/setup-test-env.ts'],
    include: [...configDefaults.include, '**/*.test-d.ts(x)'],
    exclude: [...configDefaults.exclude, '**/build/**', '**/e2e/**'],
    coverage: {
      exclude: [...(configDefaults.coverage.exclude ?? []), '**/build/**', '**/e2e/**'],
    },
  },
});

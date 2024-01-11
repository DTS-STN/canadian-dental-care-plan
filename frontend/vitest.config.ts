/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    testTimeout: 50000,
    globals: true,
    // happy-dom doesn't support button submit or FormData
    // https://github.com/capricorn86/happy-dom/issues/527
    // https://github.com/capricorn86/happy-dom/issues/585
    environment: 'jsdom',
    setupFiles: ['./__tests__/setup-test-env.ts'],
    include: ['./**/*.{test,test-d,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/build/**', '**/e2e/**'],
  },
});

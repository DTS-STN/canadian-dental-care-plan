import { reactRouter } from '@react-router/dev/vite';
import react from '@vitejs/plugin-react';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { coverageConfigDefaults } from 'vitest/config';

export default defineConfig({
  build: {
    target: 'es2022',
  },
  css: {
    postcss: {
      // Configures PostCSS with Tailwind CSS and Autoprefixer.
      // Tailwind CSS is used for utility-based styling, and Autoprefixer ensures styles work across browsers.
      plugins: [tailwindcss, autoprefixer],
    },
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
    tsconfigPaths(),
    //
    // see https://github.com/remix-run/remix/issues/9871
    //
    process.env.NODE_ENV === 'test' ? react() : reactRouter(),
  ],
  test: {
    setupFiles: ['./__tests__/setup-test-env.ts'],
    include: ['./__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      include: ['**/app/**/*.{ts,tsx}'],
      exclude: ['!**/app/[.]client/**', '!**/app/[.]server/**', '**/app/mocks/**', ...coverageConfigDefaults.exclude],
    },
    environmentMatchGlobs: [
      ['__tests__/components/**', 'jsdom'],
      ['__tests__/hooks/**', 'jsdom'],
      ['__tests__/routes/**', 'jsdom'],
    ],
  },
});

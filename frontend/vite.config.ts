import { vitePlugin as remix } from '@remix-run/dev';

import react from '@vitejs/plugin-react';
import { expressDevServer } from 'remix-express-dev-server';
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
      plugins: [tailwindcss],
    },
  },
  server: {
    port: 3000,
    host: true,
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
    expressDevServer(),
    tsconfigPaths(),
    //
    // see https://github.com/remix-run/remix/issues/9871
    //
    process.env.NODE_ENV === 'test'
      ? react()
      : remix({
          future: {
            // Fix vite client-side dependency optimization issues that trigger a server restart.
            // https://remix.run/docs/en/main/guides/dependency-optimization
            unstable_optimizeDeps: true,
            v3_fetcherPersist: true,
            // XXX  :: GjB :: lazy route discovery breaks navigation from the language switcher when running in devmode
            //                strangely, when running in production mode, it works perfectly fine 🤷
            // TODO :: GjB :: figure out why this doesn't work in devmode and hopefully fix it.
            v3_lazyRouteDiscovery: false,
            v3_relativeSplatPath: true,
            v3_routeConfig: true,
            v3_singleFetch: true,
            v3_throwAbortReason: true,
          },
        }),
  ],
  ssr: {
    noExternal: ['react-idle-timer', 'fast-json-patch'],
  },
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

import { vitePlugin as remix } from '@remix-run/dev';
import type { DefineRouteFunction, DefineRoutesFunction } from '@remix-run/dev/dist/config/routes';

import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { expressDevServer } from 'remix-express-dev-server';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { coverageConfigDefaults } from 'vitest/config';

/**
 * Represents a single route definition in the JSON configuration file.
 * Used for generating localized routes in the Remix application.
 */
interface JsonRoute {
  children?: Array<JsonRoute>;
  file: string;
  id: string;
  index?: boolean;
  paths?: {
    en: string;
    fr: string;
  };
}

/**
 * Generates a Remix RouteManifest based on a JSON configuration file.
 *
 * This function iterates through an array of JsonRoute route definitions
 * and creates localized routes for both English ('en') and French ('fr') languages.
 *
 * @param defineRoutesFn - The Remix function for defining routes.
 * @param jsonRoutes - An array of JsonRoute route definitions.
 */
function jsonRoutes(defineRoutesFn: DefineRoutesFunction, jsonRoutes: Array<JsonRoute>) {
  return defineRoutesFn((routeFn) => {
    jsonRoutes.forEach((jsonRoute) => {
      defineRoute('en', routeFn, jsonRoute);
      defineRoute('fr', routeFn, jsonRoute);
    });
  });
}

/**
 * Generates a single route for a specific language.
 *
 * This function will determine the correct route path based on the language,
 * and uses Remix's `routeFn` to register the route with its associated file,
 * ID, and any child routes.
 *
 * @param language - The language for which to define the route ('en' or 'fr').
 * @param routeFn - The Remix function for defining a single route.
 * @param jsonRoute - The JsonRoute route definition.
 */
function defineRoute(language: 'en' | 'fr', routeFn: DefineRouteFunction, jsonRoute: JsonRoute) {
  const path = language === 'en' ? jsonRoute.paths?.en : jsonRoute.paths?.fr;
  const options = { ...jsonRoute, id: `${jsonRoute.id}-${language}` } as const;

  // if the route has child routes, generate a route function for each child (otherwise use a NOOP function)
  const defineRouteChildrenFn = jsonRoute.children ? () => jsonRoute.children?.forEach((child) => defineRoute(language, routeFn, child)) : () => {};

  routeFn(path, jsonRoute.file, options, defineRouteChildrenFn);
}

export default defineConfig({
  build: {
    //
    // build target `esnext` is required for top-level awaits to work
    //
    target: 'esnext',
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
          ignoredRouteFiles: ['**/*'], // we will manually configure routes
          routes: (defineRoutes) => jsonRoutes(defineRoutes, JSON.parse(readFileSync('./app/routes.json', 'utf8'))),
          future: {
            // Fix vite client-side dependency optimization issues that trigger a server restart.
            // https://remix.run/docs/en/main/guides/dependency-optimization
            unstable_optimizeDeps: true,
            v3_fetcherPersist: true,
            v3_relativeSplatPath: true,
            v3_throwAbortReason: true,
          },
        }),
  ],
  ssr: {
    noExternal: ['react-idle-timer', 'fast-json-patch'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./__tests__/setup-test-env.ts'],
    include: ['./__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      include: ['**/app/**/*.{ts,tsx}'],
      exclude: ['**/app/mocks/**', ...coverageConfigDefaults.exclude.filter((pattern) => pattern !== '**/[.]**'), '**/[.]!(server|client)**'],
    },
    globals: true,
  },
});

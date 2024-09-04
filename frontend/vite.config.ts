import { vitePlugin as remix } from '@remix-run/dev';
import type { DefineRouteFunction, DefineRoutesFunction } from '@remix-run/dev/dist/config/routes';

import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { expressDevServer } from 'remix-express-dev-server';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { configDefaults } from 'vitest/config';

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
 * @param {DefineRoutesFunction} defineRoutesFn - The Remix function for defining routes.
 * @param {Array<JsonRoute>} jsonRoutes - An array of JsonRoute route definitions.
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
 * @param {'en' | 'fr'} language - The language for which to define the route ('en' or 'fr').
 * @param {DefineRouteFunction} routeFn - The Remix function for defining a single route.
 * @param {JsonRoute} jsonRoute - The JsonRoute route definition.
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

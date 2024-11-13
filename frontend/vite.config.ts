import { vitePlugin as remix } from '@remix-run/dev';
import type { DefineRouteFunction, DefineRoutesFunction, RouteManifest } from '@remix-run/dev/dist/config/routes';

import react from '@vitejs/plugin-react';
import { expressDevServer } from 'remix-express-dev-server';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { coverageConfigDefaults } from 'vitest/config';

// note: we can't import aliased (~/) paths in vite.config.ts
import { routes } from './app/routes';

/**
 * Represents an internationalized route definition.
 */
export interface I18nRoute {
  children?: Array<I18nRoute>;
  file: string;
  id: string;
  index?: boolean;
  paths?: {
    en: string;
    fr: string;
  };
}

/**
 * Generates a Remix RouteManifest from a collection of i18n routes.
 *
 * This function iterates through an array of internationalized route definitions
 * and creates localized routes for both English ('en') and French ('fr') languages.
 *
 * @param defineRoutesFn - The Remix function for defining routes.
 * @param i18nRoutes - An array of i18n route definitions.
 */
function i18nRoutes(defineRoutesFn: DefineRoutesFunction, i18nRoutes: Array<I18nRoute>): RouteManifest {
  return defineRoutesFn((routeFn) => {
    i18nRoutes.forEach((i18nRoute) => {
      defineRoute('en', routeFn, i18nRoute);
      defineRoute('fr', routeFn, i18nRoute);
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
 * @param i18nRoute - The JsonRoute route definition.
 */
function defineRoute(language: 'en' | 'fr', routeFn: DefineRouteFunction, i18nRoute: I18nRoute): void {
  const path = language === 'en' ? i18nRoute.paths?.en : i18nRoute.paths?.fr;
  const options = { ...i18nRoute, id: `${i18nRoute.id}-${language}` } as const;

  // if the route has child routes, generate a route function for each child (otherwise use a NOOP function)
  const defineRouteChildrenFn = i18nRoute.children ? () => i18nRoute.children?.forEach((child) => defineRoute(language, routeFn, child)) : () => {};

  routeFn(path, i18nRoute.file, options, defineRouteChildrenFn);
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
          routes: (defineRoutes) => i18nRoutes(defineRoutes, routes),
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

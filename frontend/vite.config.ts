import { vitePlugin as remix } from '@remix-run/dev';
import type { DefineRouteFunction, DefineRoutesFunction } from '@remix-run/dev/dist/config/routes';
import { installGlobals } from '@remix-run/node';

import { readFileSync } from 'node:fs';
import { expressDevServer } from 'remix-express-dev-server';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';
import envOnly from 'vite-env-only';
import tsconfigPaths from 'vite-tsconfig-paths';

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

type Language = 'en' | 'fr';

// install global node polyfills
// see: https://remix.run/docs/en/main/other-api/node#polyfills
installGlobals({ nativeFetch: true });

function jsonRoutes(defineRoutesFn: DefineRoutesFunction, jsonRoutes: Array<JsonRoute>) {
  return defineRoutesFn((routeFn) => {
    jsonRoutes.forEach((jsonRoute) => {
      defineRoute('en', routeFn, jsonRoute);
      defineRoute('fr', routeFn, jsonRoute);
    });
  });
}

function defineRoute(language: Language, routeFn: DefineRouteFunction, jsonRoute: JsonRoute) {
  const path = language === 'en' ? jsonRoute.paths?.en : jsonRoute.paths?.fr;
  const defineRouteChildren = jsonRoute.children ? () => jsonRoute.children?.forEach((child) => defineRoute(language, routeFn, child)) : () => {};
  const options = { ...jsonRoute, id: `${jsonRoute.id}-${language}` } as const;

  routeFn(path, jsonRoute.file, options, defineRouteChildren);
}

export default defineConfig({
  build: {
    target: 'esnext', // XXX :: GjB :: is this needed?
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
    envOnly(),
    expressDevServer(),
    remix({
      ignoredRouteFiles: ['**/*'], // we will manually configure routes
      routes: (defineRoutes) => jsonRoutes(defineRoutes, JSON.parse(readFileSync('./app/routes.json', 'utf8'))),
      future: {
        unstable_singleFetch: true,
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
    tsconfigPaths(),
  ],
  ssr: {
    noExternal: ['react-idle-timer', 'fast-json-patch'],
  },
});

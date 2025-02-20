import type { RouteConfig, RouteConfigEntry } from '@react-router/dev/routes';
import { index, layout, route } from '@react-router/dev/routes';

// note: because the routes are processed at build time by vite,
//       we cannot use aliased imports (ie: ~/) here
import type { I18nPageRoute, I18nRoute } from './routes/routes';
import { i18nRoutes, isI18nPageRoute, routes } from './routes/routes';

/**
 * Generates a route id by combining a base id and a language code.
 * This is necessary because React Router route ids must be unique.
 *
 * @param id - The base route id.
 * @param language - The language code.
 * @returns The generated route id.
 */
function generateRouteId(id: string, language: string): string {
  return `${id}-${language}`;
}

/**
 * Generates an array of route config entries for different languages
 * based on a given file and i18n paths.
 *
 * @param i18nPageRoute - The i18n route to generate the route config entry from.
 * @returns An array of route config entries.
 */
function i18nPageRoutes(i18nPageRoute: I18nPageRoute): RouteConfigEntry[] {
  return Object.entries(i18nPageRoute.paths).map(([language, path]) => {
    const options = { id: generateRouteId(i18nPageRoute.id, language) };
    return route(path, i18nPageRoute.file, options);
  });
}

/**
 * Recursive function that converts an I18nRoute[] to a RouteConfigEntry[]
 * that can be used by React Router.
 *
 * @param routes - The array of i18n route definitions.
 * @returns An array of React Router route configuration entries.
 */
function toRouteConfigEntries(routes: I18nRoute[]): RouteConfigEntry[] {
  return routes.flatMap((route) => {
    return isI18nPageRoute(route)
      ? i18nPageRoutes(route) //
      : layout(route.file, toRouteConfigEntries(route.children));
  });
}

/**
 * see: https://reactrouter.com/dev/start/framework/routing
 */
export default [
  index('routes/language-chooser.tsx'), //
  route('/:lang/*', 'routes/catchall.tsx'),
  ...routes,
  ...toRouteConfigEntries(i18nRoutes),
] satisfies RouteConfig;

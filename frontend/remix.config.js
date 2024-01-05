import { flatRoutes } from 'remix-flat-routes';

/**
 * @type {import('@remix-run/dev').AppConfig}
 */
export default {
  ignoredRouteFiles: ['**/.*'],
  routes: async (defineRoutes) => flatRoutes('routes', defineRoutes),
};

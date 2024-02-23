import { flatRoutes } from 'remix-flat-routes';

/**
 * @type {import('@remix-run/dev').AppConfig}
 */
export default {
  cacheDirectory: './node_modules/.cache/remix',
  ignoredRouteFiles: ['**/.*'], // let remix-flat-routes handle routing
  routes: async (defineRoutes) => flatRoutes('routes', defineRoutes),
  serverDependenciesToBundle: ['react-idle-timer'],
};

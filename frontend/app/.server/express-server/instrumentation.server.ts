import { matchRoutes } from 'react-router';

import type { RequestHandler } from 'express';

import { getAppContainerProvider } from '~/.server/app.container';
import { TYPES } from '~/.server/constants';
import { createLogger } from '~/.server/logging';
import routes from '~/routes';

// Define a type for the cache value (can be string or null/undefined if no match/id)
type CachedRouteId = string | null | undefined;

/**
 * Creates an Express middleware to count requests based on matched React Router routes.
 * It caches the result of route matching for performance.
 *
 * @returns Express RequestHandler middleware.
 */
export function routeRequestCounter(): RequestHandler {
  const log = createLogger('express.server/routeRequestCounter');

  const appContainer = getAppContainerProvider();
  const instrumentationService = appContainer.get(TYPES.observability.InstrumentationService);

  // Cache to store: normalizedPath -> routeId (or null/undefined if no match)
  // This Map persists across requests for this middleware instance.
  const pathCache = new Map<string, CachedRouteId>();

  log.info('Initializing request counter middleware with route matching cache.');

  return (req, res, next) => {
    // Hook into the 'finish' event to capture the final status code
    res.on('finish', () => {
      try {
        // Use req.path to ignore query strings for routing/caching purposes
        // Normalize path (e.g., remove trailing .data for React Router loaders/actions)
        const normalizedPath = req.path.replace(/\.data$/, '');

        let routeId: CachedRouteId = undefined;

        // Check cache first
        if (pathCache.has(normalizedPath)) {
          routeId = pathCache.get(normalizedPath);
          log.debug(`Cache hit for path: ${normalizedPath}, routeId: ${routeId}`);
        } else {
          log.debug(`Cache miss for path: ${normalizedPath}. Matching routes...`);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const matches = matchRoutes(routes as any, normalizedPath);

          // Get the ID from the most specific matched route (last in the array)
          // Ensure the route and ID exist
          const lastMatch = matches?.at(-1); // Get the last match object
          routeId = lastMatch?.route.id ?? null; // Use null if no ID

          // Update cache with the result (even if null)
          pathCache.set(normalizedPath, routeId);
          log.debug(`Cached routeId '${routeId}' for path: ${normalizedPath}`);
        }

        if (routeId) {
          // Construct metric identifier (e.g., POST '/user/$id/profile' → 'user._id.profile.posts')
          const metricPrefix = `${routeId.replaceAll('/', '.').replace(/.\$([^.]+)/g, '_$1')}.${req.method.toLowerCase()}s`;
          instrumentationService.countHttpStatus(metricPrefix, res.statusCode);
        }
      } catch (error) {
        log.error('Error during request counting in "finish" handler:', error);
      }
    });

    next();
  };
}

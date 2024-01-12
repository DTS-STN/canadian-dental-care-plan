import { useMatches } from '@remix-run/react';

import { type RouteData } from '~/types';

export type BuildInfo = {
  buildDate?: string;
  buildId?: string;
  buildRevision?: string;
  buildVersion?: string;
};

/**
 * The useBuildInfo function is a React hook that returns the BuildInfo object for the current page. The BuildInfo
 * object contains information about the build, such as the version number and the build date.
 *
 * The function uses the useRouteData hook to get the loader data for the current routes. At least one route loader must
 * emit a BuildInfo object, otherwise this function will return undefined.
 */
export function useBuildInfo() {
  return useMatches()
    .map((route) => route.data)
    .filter((data): data is RouteData => !!data)
    .map((routeData) => routeData.buildInfo)
    .pop();
}

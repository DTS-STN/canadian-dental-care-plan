import { useMatches } from '@remix-run/react';

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
 * The function uses the useMatches hook to get the loader data for the current routes. At least one route loader must
 * emit a BuildInfo object, otherwise this function will return undefined.
 */
export function useBuildInfo() {
  return useMatches()
    .map((match) => match.data as { buildInfo?: BuildInfo })
    .map((data) => data?.buildInfo)
    .reduce((last, curr) => curr ?? last);
}

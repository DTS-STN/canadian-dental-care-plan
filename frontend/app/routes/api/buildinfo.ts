import type { Route } from './+types/buildinfo';

import { TYPES } from '~/.server/constants';

/**
 * An API endpoint that returns the build info.
 */
export function loader({ context: { appContainer }, params, request }: Route.LoaderArgs) {
  const buildInfo = appContainer.get(TYPES.BuildInfoService).getBuildInfo();
  const imageTag = `${buildInfo.buildVersion}-${buildInfo.buildRevision}-${buildInfo.buildId}`;

  return Response.json({ ...buildInfo, imageTag });
}

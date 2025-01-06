import type { LoaderFunctionArgs } from 'react-router';

import { TYPES } from '~/.server/constants';

/**
 * An API endpoint that returns the build info.
 */
export function loader({ context: { appContainer }, params, request }: LoaderFunctionArgs) {
  const buildInfo = appContainer.get(TYPES.core.BuildInfoService).getBuildInfo();
  const imageTag = `${buildInfo.buildVersion}-${buildInfo.buildRevision}-${buildInfo.buildId}`;

  return Response.json({ ...buildInfo, imageTag });
}

import type { LoaderFunctionArgs } from '@remix-run/node';

import { TYPES } from '~/.server/constants';

/**
 * An API endpoint that returns the build info.
 */
export function loader({ context: { appContainer }, params, request }: LoaderFunctionArgs) {
  const serverConfig = appContainer.get(TYPES.configs.ServerConfig);
  const { BUILD_DATE, BUILD_ID, BUILD_REVISION, BUILD_VERSION } = serverConfig;

  return Response.json({
    buildDate: BUILD_DATE,
    buildId: BUILD_ID,
    buildRevision: BUILD_REVISION,
    buildVersion: BUILD_VERSION,
    imageTag: `${BUILD_VERSION}-${BUILD_REVISION}-${BUILD_ID}`,
  });
}

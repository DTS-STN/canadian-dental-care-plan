import type { LoaderFunctionArgs } from '@remix-run/node';

import { getBuildInfoService } from '~/services/build-info-service.server';

/**
 * An API endpoint that returns the build info.
 */
export function loader({ context, params, request }: LoaderFunctionArgs) {
  const buildInfo = getBuildInfoService().getBuildInfo();
  const imageTag = `${buildInfo.buildVersion}-${buildInfo.buildRevision}-${buildInfo.buildId}`;

  return { ...buildInfo, imageTag };
}

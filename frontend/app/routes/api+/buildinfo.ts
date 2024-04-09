import { LoaderFunctionArgs, json } from '@remix-run/node';

import { getBuildInfoService } from '~/services/build-info-service.server';

/**
 * An API endpoint that returns the build info.
 */
export function loader({ context, params, request }: LoaderFunctionArgs) {
  return json(getBuildInfoService().getBuildInfo());
}

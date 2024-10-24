import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';

import type { HealthCheck, HealthCheckOptions } from '@dts-stn/health-checks';
import { HealthCheckConfig, execute, getHttpStatusCode } from '@dts-stn/health-checks';
import { isEmpty } from 'moderndash';

import { getBuildInfoService } from '~/services/build-info-service.server';

function isAuthorized(request: Request): boolean {
  return false; // TODO :: GjB :: add authentication check when AAD integration is ready
}

function toArray(str?: string): string[] | undefined {
  const result = str?.split(',').filter(Boolean);
  return isEmpty(result) ? undefined : result;
}

function toNumber(str?: string): number | undefined {
  const num = parseInt(str ?? '');
  return isNaN(num) ? undefined : num;
}

/**
 * A do-nothing health check intended to be used while testing.
 */
const dummyHealthCheck: HealthCheck = {
  name: 'dummy-check',
  check: () => new Promise((resolve) => setTimeout(resolve, 2 * 1000)),
};

export async function loader({ context: { configProvider, serviceProvider, session }, request }: LoaderFunctionArgs) {
  const { include, exclude, timeout } = Object.fromEntries(new URL(request.url).searchParams);
  const { buildRevision: buildId, buildVersion: version } = getBuildInfoService().getBuildInfo();

  const healthCheckOptions: HealthCheckOptions = {
    excludeComponents: toArray(exclude),
    includeComponents: toArray(include),
    includeDetails: isAuthorized(request),
    metadata: { buildId, version },
    timeout: toNumber(timeout),
  };

  //
  // TODO :: GjB ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //
  //   - add actual, non-dummy health checks
  //   - include details when isAuthorized()
  //   - cache execute() response for a short period (ie: rate-limiting)
  //
  // TODO :: GjB ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //

  const systemHealthSummary = await execute([dummyHealthCheck], healthCheckOptions);

  return json(systemHealthSummary, {
    headers: { 'Content-Type': HealthCheckConfig.responses.contentType },
    status: getHttpStatusCode(systemHealthSummary.status),
  });
}

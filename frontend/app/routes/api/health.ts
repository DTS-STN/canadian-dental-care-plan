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

export async function loader({ context: { configProvider, serviceProvider, session }, request }: LoaderFunctionArgs) {
  const { include, exclude, timeout } = Object.fromEntries(new URL(request.url).searchParams);
  const { buildRevision: buildId, buildVersion: version } = getBuildInfoService().getBuildInfo();

  const healthCheckOptions: HealthCheckOptions = {
    excludeComponents: toArray(exclude),
    includeComponents: toArray(include),
    includeDetails: isAuthorized(request),
    metadata: { buildId, version },
    timeoutMs: toNumber(timeout),
  };

  //
  // TODO :: GjB ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //
  //   - include details when isAuthorized()
  //   - cache execute() response for a short period (ie: rate-limiting)
  //
  // TODO :: GjB ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //

  const redisHealthCheck: HealthCheck = {
    name: 'redis',
    check: async () => {
      await serviceProvider.getRedisService()?.ping();
    },
  };

  // exclude the redis health check if the application is not using it
  const useRedis = configProvider.getServerConfig().SESSION_STORAGE_TYPE === 'redis';
  if (!useRedis) {
    healthCheckOptions.excludeComponents ??= [];
    healthCheckOptions.excludeComponents.push(redisHealthCheck.name);
  }

  // execute the health checks
  const systemHealthSummary = await execute([redisHealthCheck], healthCheckOptions);

  return json(systemHealthSummary, {
    headers: { 'Content-Type': HealthCheckConfig.responses.contentType },
    status: getHttpStatusCode(systemHealthSummary.status),
  });
}

import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';

import type { HealthCheck, HealthCheckOptions } from '@dts-stn/health-checks';
import { HealthCheckConfig, execute, getHttpStatusCode } from '@dts-stn/health-checks';
import { isEmpty } from 'moderndash';
import moize from 'moize';

import { SERVICE_IDENTIFIER } from '~/.server/constants';
import type { AppContainerProvider } from '~/.server/providers';
import { getBuildInfoService } from '~/services/build-info-service.server';

function getRedisCheck(appContainer: AppContainerProvider) {
  const { HEALTH_CACHE_TTL } = appContainer.get(SERVICE_IDENTIFIER.SERVER_CONFIG);
  const redisService = appContainer.find(SERVICE_IDENTIFIER.REDIS_SERVICE);

  async function redisCheckFn() {
    if (!redisService) return;
    await redisService.ping();
  }

  return moize.promise(redisCheckFn, { maxAge: HEALTH_CACHE_TTL, transformArgs: () => [] });
}

export async function loader({ context: { appContainer }, request }: LoaderFunctionArgs) {
  const { include, exclude, timeout } = Object.fromEntries(new URL(request.url).searchParams);
  const { buildRevision: buildId, buildVersion: version } = getBuildInfoService().getBuildInfo();
  const { SESSION_STORAGE_TYPE } = appContainer.get(SERVICE_IDENTIFIER.SERVER_CONFIG);

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
  //
  // TODO :: GjB ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  //

  const redisHealthCheck: HealthCheck = { name: 'redis', check: getRedisCheck(appContainer) };

  // exclude the redis health check if the application is not using it
  if (SESSION_STORAGE_TYPE !== 'redis') {
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

/**
 * Returns true if the incoming request is authorized to view detailed responses.
 */
function isAuthorized(request: Request): boolean {
  return false; // TODO :: GjB :: add authentication check when AAD integration is ready
}

/**
 * Transforms a comma-delimited string into an array of strings.
 * Will return undefined if the resulting array is empty.
 */
function toArray(str?: string): string[] | undefined {
  const result = str?.split(',').filter(Boolean);
  return isEmpty(result) ? undefined : result;
}

/**
 * Transforms a string into an ingeger.
 * Will return undefined if the string can't be transformed.
 */
function toNumber(str?: string): number | undefined {
  const num = parseInt(str ?? '');
  return isNaN(num) ? undefined : num;
}

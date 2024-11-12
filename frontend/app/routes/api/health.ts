import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';

import type { HealthCheck, HealthCheckOptions } from '@dts-stn/health-checks';
import { HealthCheckConfig, execute, getHttpStatusCode } from '@dts-stn/health-checks';
import { isEmpty } from 'moderndash';
import moize from 'moize';

import { getAppContainerProvider } from '~/.server/app.container';
import { TYPES } from '~/.server/constants';
import { getBuildInfoService } from '~/services/build-info-service.server';

const appContainerProvider = getAppContainerProvider();

const bearerTokenResolver = appContainerProvider.get(TYPES.auth.BearerTokenResolver);
const serverConfig = appContainerProvider.get(TYPES.configs.ServerConfig);
const tokenRolesExtractor = appContainerProvider.get(TYPES.auth.HealthTokenRolesExtractor);
const redisService = appContainerProvider.find(TYPES.data.services.RedisService);

// memoize the result of redisCheckFn for a period of time
// transformArgs is require to effectively ignore the abort signal sent from @dts-stn/health-checks when caching
// for memoization to work, the call to moize must be done in module scope, so it only ever happens once
const redisCheck = moize.promise(async () => void (await redisService?.ping()), { maxAge: serverConfig.HEALTH_CACHE_TTL, transformArgs: () => [] });

export async function loader({ request }: LoaderFunctionArgs) {
  const { include, exclude, timeout } = Object.fromEntries(new URL(request.url).searchParams);
  const { buildRevision: buildId, buildVersion: version } = getBuildInfoService().getBuildInfo();

  const healthCheckOptions: HealthCheckOptions = {
    excludeComponents: toArray(exclude),
    includeComponents: toArray(include),
    includeDetails: await isAuthorized(request),
    metadata: { buildId, version },
    timeoutMs: toNumber(timeout),
  };

  const redisHealthCheck: HealthCheck = {
    name: 'redis',
    check: redisCheck,
    metadata: {
      REDIS_USERNAME: serverConfig.REDIS_USERNAME ?? '',
      REDIS_STANDALONE_HOST: serverConfig.REDIS_STANDALONE_HOST,
      REDIS_STANDALONE_PORT: serverConfig.REDIS_STANDALONE_PORT.toString(),
      REDIS_SENTINEL_NAME: serverConfig.REDIS_SENTINEL_NAME ?? '',
      REDIS_SENTINEL_HOST: serverConfig.REDIS_SENTINEL_HOST ?? '',
      REDIS_SENTINEL_PORT: (serverConfig.REDIS_SENTINEL_PORT ?? '').toString(),
      REDIS_MAX_RETRIES_PER_REQUEST: serverConfig.REDIS_MAX_RETRIES_PER_REQUEST.toString(),
    },
  };

  // exclude the redis health check if the application is not using it
  if (serverConfig.SESSION_STORAGE_TYPE !== 'redis') {
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
async function isAuthorized(request: Request): Promise<boolean> {
  const token = bearerTokenResolver.resolve(request);
  const roles = await tokenRolesExtractor.extract(token);
  return roles.includes(serverConfig.HEALTH_AUTH_ROLE);
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

import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';

import type { HealthCheck, HealthCheckOptions } from '@dts-stn/health-checks';
import { HealthCheckConfig, execute, getHttpStatusCode } from '@dts-stn/health-checks';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { isEmpty } from 'moderndash';
import moize from 'moize';

import type { AppContainerProvider } from '~/.server/app-container.provider';
import { SERVICE_IDENTIFIER } from '~/.server/constants';
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
    includeDetails: await isAuthorized(appContainer, request),
    metadata: { buildId, version },
    timeoutMs: toNumber(timeout),
  };

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
async function isAuthorized(appContainer: AppContainerProvider, request: Request): Promise<boolean> {
  const log = appContainer.get(SERVICE_IDENTIFIER.LOG_FACTORY).createLogger('health/isAuthorized');

  const authorization = request.headers.get('authorization');
  const [scheme, accessToken] = authorization?.split(' ') ?? [];

  if (scheme.toLowerCase() !== 'bearer') {
    log.debug('Missing or invalid authorization header. Authorization failed.');
    return false;
  }

  const { HEALTH_AUTH_JWKS_URI: jwksUri, HEALTH_AUTH_ROLE: authorizedRole, HEALTH_AUTH_TOKEN_AUDIENCE: audience, HEALTH_AUTH_TOKEN_ISSUER: issuer } = appContainer.get(SERVICE_IDENTIFIER.SERVER_CONFIG);

  if (!jwksUri) {
    log.debug('JWK endpoint not configured. Authorization failed.');
    return false;
  }

  try {
    const { payload } = await jwtVerify<{ roles?: string[] }>(accessToken, createRemoteJWKSet(new URL(jwksUri)), { audience, issuer });
    return payload.roles?.includes(authorizedRole) ?? false;
  } catch (error) {
    log.error('Error verifying JWT: %o. Authorization failed.', error);
    return false;
  }
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

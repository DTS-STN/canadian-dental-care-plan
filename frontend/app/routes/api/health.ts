import type { HealthCheckOptions } from '@dts-stn/health-checks';
import { HealthCheckConfig, execute, getHttpStatusCode } from '@dts-stn/health-checks';
import { isEmpty } from 'moderndash';

import type { Route } from './+types/health';

import { TYPES } from '~/.server/constants';

export async function loader({ context, request }: Route.LoaderArgs) {
  const { include, exclude, timeout } = Object.fromEntries(new URL(request.url).searchParams);

  const allHealthChecks = context.appContainer.findAll(TYPES.HealthCheck);
  const buildInfoService = context.appContainer.get(TYPES.BuildInfoService);

  const { buildRevision: buildId, buildVersion: version } = buildInfoService.getBuildInfo();

  const healthCheckOptions: HealthCheckOptions = {
    excludeComponents: toArray(exclude),
    includeComponents: toArray(include),
    includeDetails: await isAuthorized({ context, request }),
    metadata: { buildId, version },
    timeoutMs: toNumber(timeout),
  };

  // execute the health checks
  const systemHealthSummary = await execute(allHealthChecks, healthCheckOptions);

  return Response.json(systemHealthSummary, {
    headers: { 'Content-Type': HealthCheckConfig.responses.contentType },
    status: getHttpStatusCode(systemHealthSummary.status),
  });
}

/**
 * Returns true if the incoming request is authorized to view detailed responses.
 */
async function isAuthorized({ context, request }: Omit<Route.LoaderArgs, 'params'>): Promise<boolean> {
  const bearerTokenResolver = context.appContainer.get(TYPES.BearerTokenResolver);
  const serverConfig = context.appContainer.get(TYPES.ServerConfig);
  const tokenRolesExtractor = context.appContainer.get(TYPES.HealthTokenRolesExtractor);

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
  const num = Number.parseInt(str ?? '');
  return Number.isNaN(num) ? undefined : num;
}

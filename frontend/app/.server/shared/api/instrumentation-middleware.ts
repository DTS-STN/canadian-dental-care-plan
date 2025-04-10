import type { Middleware } from 'openapi-fetch';

import { DefaultBuildInfoService } from '~/.server/core';
import { createLogger } from '~/.server/logging';
import { DefaultInstrumentationService } from '~/.server/observability';
import type { InteropClientPathMethodKeys } from '~/.server/shared/api/interop-client';
import { getEnv } from '~/.server/utils/env.utils';

export function instrumentationMiddleware(): Middleware {
  const log = createLogger('instrumentationyMiddleware');

  const serverConfig = getEnv();
  const buildInfoService = new DefaultBuildInfoService();
  const instrumentationService = new DefaultInstrumentationService(serverConfig, buildInfoService);

  return {
    onResponse: ({ options, response, request, schemaPath }) => {
      const metricPrefix = metrixPrefixMap.get(schemaPath);

      // skip middleware
      if (typeof metricPrefix !== 'string') {
        log.warn('Skipping instrumentation middleware; onResponse; url: [%s]', request.url);
        return undefined;
      }

      log.debug('Executing instrumentation middleware; onResponse; metricPrefix: [%s], url: [%s], options: [%j]', metricPrefix, request.url, options);
      log.trace('HTTP request completed; url: [%s], status: [%d]', request.url, response.status);
      instrumentationService.countHttpStatus(metricPrefix, response.status);
    },
    onError: ({ options, error, request, schemaPath }) => {
      const metricPrefix = metrixPrefixMap.get(schemaPath);

      // skip middleware
      if (typeof metricPrefix !== 'string') {
        log.warn('Skipping instrumentation middleware; onError; url: [%s]', request.url);
        return;
      }

      log.error('HTTP request failed; error: [%s]', error);
      instrumentationService.countHttpStatus(metricPrefix, 500);
    },
  };
}

export const pathMetricPrefix = {
  '/applicant|post': 'http.client.interop-api.client-application_by-sin.posts',
  '/benefit-application|post': 'http.client.interop-api.benefit-application.posts',
  '/benefit-application|post': 'http.client.interop-api.benefit-application-renewal.posts',
  '/retrieve-benefit-application-config-dates|get': 'http.client.interop-api.retrieve-benefit-application-config-dates.gets',
  '/retrieve-benefit-application|post': 'http.client.interop-api.retrieve-benefit-application_by-basic-info.posts',
  '/retrieve-benefit-application|post': 'http.client.interop-api.retrieve-benefit-application_by-sin.posts',
} as const satisfies Record<InteropClientPathMethodKeys, string>;

export const metrixPrefixMap: ReadonlyMap<string, string> = new Map(Object.entries(pathMetricPrefix));

import { ProxyAgent } from 'undici';

import { getEnv } from '~/.server/utils/env.utils';
import { getLogger } from '~/.server/utils/logging.utils';
import { getInstrumentationService } from '~/services/instrumentation-service.server';

/**
 * A custom fetch(..) function that can be used for making HTTP requests.
 * Primarily used for intercepting responses or configuring an HTTP proxy.
 */
export type FetchFn = typeof fetch;

/**
 * Return a custom fetch() function if a proxy URL has been provided.
 * If no proxy has been provided, simply return global.fetch().
 */
export function getFetchFn(proxyUrl?: string, timeout?: number): FetchFn {
  const log = getLogger('fetch-utils.server/getFetchFn');

  if (proxyUrl) {
    const { HTTP_PROXY_TLS_TIMEOUT } = getEnv();
    const proxyTlsTimeout = timeout ?? HTTP_PROXY_TLS_TIMEOUT;
    const dispatcher = new ProxyAgent({ uri: proxyUrl, proxyTls: { timeout: proxyTlsTimeout } });
    log.debug('A proxy [%s] has been configured with timeout [%d] ms; using custom fetch', proxyUrl, proxyTlsTimeout);

    return (input, init) => {
      // @ts-expect-error since remix v2.9.x, the server fetch() polyfill is provided by undici,
      //                  which accepts a dispatcher object to facilitate request proxying
      return fetch(input, { ...init, dispatcher });
    };
  }

  log.debug('No proxy configured; using global fetch');
  return fetch;
}

/**
 * Wraps a fetch() function and adds instrumentation/metrics collection
 *
 * @param fetchFn An existing fetch() function used to make the actual request
 * @param metricPrefix A string prefix used for naming metrics (ex. "http.client.example-api.example-endpoint.gets", "http.client.example-api.example-endpoint.posts").
 * @param input The URL or request object specifying the target of the fetch request
 * @param init An object containing additional options for the fetch request (ex. headers, method)
 * @returns A Promise that resolves to the Response object from the fetch() call
 * @throws The original error thrown by the underlying fetch() call
 */
export async function instrumentedFetch(fetchFn: FetchFn, metricPrefix: string, input: RequestInfo | URL, init?: RequestInit) {
  const instrumentationService = getInstrumentationService();
  try {
    const response = await fetchFn(input, init);
    instrumentationService.countHttpStatus(metricPrefix, response.status);
    return response;
  } catch (error) {
    instrumentationService.countHttpStatus(metricPrefix, 500);
    throw error;
  }
}

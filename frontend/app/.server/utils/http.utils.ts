import { ProxyAgent } from 'undici';

import { createLogger } from '../logging';
import { getEnv } from './env.utils';

/**
 * A custom fetch(..) function that can be used for making HTTP requests.
 * Primarily used for intercepting responses or configuring an HTTP proxy.
 */
export type FetchFn = typeof fetch;

/**
 * Options for configuring a custom fetch function.
 */
export interface FetchOptions {
  /**
   * The proxy URL to be used for HTTP requests.
   * If provided, the fetch function will use this proxy.
   */
  proxyUrl?: string;

  /**
   * Timeout value (in milliseconds) for the fetch requests.
   * If not provided, a default timeout may be used.
   */
  timeout?: number;
}

export function getFetchFn(options: FetchOptions): FetchFn {
  const log = createLogger('http.utils/getFetchFn');
  log.debug('Getting fetch function; options: [%j]', options);

  const { proxyUrl, timeout } = options;

  if (proxyUrl) {
    const { HTTP_PROXY_TLS_TIMEOUT } = getEnv();
    const proxyTlsTimeout = timeout ?? HTTP_PROXY_TLS_TIMEOUT;
    const dispatcher = new ProxyAgent({ uri: proxyUrl, proxyTls: { timeout: proxyTlsTimeout } });
    log.debug('A proxy [%s] has been configured with timeout [%d] ms; using custom fetch', proxyUrl, proxyTlsTimeout);

    return async (input, init) => {
      // @ts-expect-error since remix v2.9.x, the server fetch() polyfill is provided by undici,
      //                  which accepts a dispatcher object to facilitate request proxying
      return await fetch(input, { ...init, dispatcher });
    };
  }

  log.debug('No proxy configured; using global fetch');
  return fetch;
}

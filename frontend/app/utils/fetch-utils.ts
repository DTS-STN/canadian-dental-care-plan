import { ProxyAgent, fetch as undiciFetch } from 'undici';
import { toNodeReadable } from 'web-streams-node';

import { getEnv } from './env.server';
import { getLogger } from './logging.server';

const log = getLogger('fetch-utils.server');

/**
 * A custom fetch(..) function that can be used for making HTTP requests.
 * Primarily used for intercepting responses or configuring an HTTP proxy.
 */
export interface FetchFunction {
  (input: string | URL, init?: FetchFunctionInit): Promise<Response>;
}

/**
 * Init options for FetchFunction.
 */
export interface FetchFunctionInit extends RequestInit {
  body?: string; // forces compatibility between node.fetch() and undici.fetch()
}

/**
 * Return a custom fetch() function if a proxy URL has been provided.
 * If no proxy has been provided, simply return global.fetch().
 */
export function getFetchFn(proxyUrl?: string, timeout?: number) {
  if (proxyUrl) {
    const { HTTP_PROXY_TLS_TIMEOUT } = getEnv();
    const proxyTlsTimeout = timeout ?? HTTP_PROXY_TLS_TIMEOUT;
    log.debug('A proxy has been configured with timeout: [%s], [%d] milliseconds; using custom fetch', proxyUrl, proxyTlsTimeout);
    return async (input: string | URL, init?: FetchFunctionInit) => {
      const dispatcher = new ProxyAgent({ uri: proxyUrl, proxyTls: { timeout: proxyTlsTimeout } });
      const response = await undiciFetch(input, { ...init, dispatcher });
      return new Response(toNodeReadable(response.body));
    };
  }

  log.debug('No proxy configured; using global fetch');
  return global.fetch;
}

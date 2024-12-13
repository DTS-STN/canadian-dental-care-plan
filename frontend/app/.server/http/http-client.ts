import { inject } from 'inversify';
import { ProxyAgent } from 'undici';

import { TYPES } from '~/.server/constants';
import type { LogFactory, Logger } from '~/.server/factories';
import type { InstrumentationService } from '~/.server/observability';
import { getEnv } from '~/.server/utils/env.utils';

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

/**
 * Extended options for instrumented fetch calls.
 */
export type InstrumentedFetchOptions = RequestInit & FetchOptions;

/**
 * Service interface for managing HTTP requests with optional instrumentation and proxy support.
 */
export interface HttpClient {
  /**
   * Creates a custom fetch function based on the provided options.
   *
   * @param options - Configuration options for the fetch function.
   * @returns A custom fetch function.
   */
  getFetchFn(options: FetchOptions): FetchFn;

  /**
   * Makes an HTTP request with instrumentation support for metrics.
   *
   * @param metricPrefix - The prefix used for instrumentation metrics.
   * @param input - The input for the HTTP request, which can be a URL or a `RequestInfo` object.
   * @param options - (Optional) Additional options for the request, including proxy settings and initialization options.
   * @returns A promise that resolves with the `Response` object from the HTTP request.
   * @throws Will throw an error if the HTTP request fails.
   */
  instrumentedFetch(metricPrefix: string, input: RequestInfo | URL, options?: InstrumentedFetchOptions): Promise<Response>;
}

export class DefaultHttpClient implements HttpClient {
  private readonly log: Logger;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.observability.InstrumentationService) private readonly instrumentationService: InstrumentationService,
  ) {
    this.log = logFactory.createLogger(this.constructor.name);
  }

  getFetchFn(options: FetchOptions): FetchFn {
    this.log.debug('Getting fetch function; options: [%j]', options);
    const { proxyUrl, timeout } = options;
    if (proxyUrl) {
      const { HTTP_PROXY_TLS_TIMEOUT } = getEnv();
      const proxyTlsTimeout = timeout ?? HTTP_PROXY_TLS_TIMEOUT;
      const dispatcher = new ProxyAgent({ uri: proxyUrl, proxyTls: { timeout: proxyTlsTimeout } });
      this.log.debug('A proxy [%s] has been configured with timeout [%d] ms; using custom fetch', proxyUrl, proxyTlsTimeout);

      return (input, init) => {
        // @ts-expect-error since remix v2.9.x, the server fetch() polyfill is provided by undici,
        //                  which accepts a dispatcher object to facilitate request proxying
        return fetch(input, { ...init, dispatcher });
      };
    }

    this.log.debug('No proxy configured; using global fetch');
    return fetch;
  }

  async instrumentedFetch(metricPrefix: string, input: RequestInfo | URL, options: InstrumentedFetchOptions = {}): Promise<Response> {
    this.log.debug('Executing instumented fetch function; metricPrefix: [%s], input: [%s], options: [%j]', metricPrefix, input, options);
    const { proxyUrl, timeout, ...init } = options;
    const fetchFn = this.getFetchFn({ proxyUrl, timeout });
    try {
      const response = await fetchFn(input, init);
      this.log.trace('HTTP request completed; status: [%d]', response.status);
      this.instrumentationService.countHttpStatus(metricPrefix, response.status);
      return response;
    } catch (error) {
      this.log.error('HTTP request failed; error: [%s]', error);
      this.instrumentationService.countHttpStatus(metricPrefix, 500);
      throw error;
    }
  }
}

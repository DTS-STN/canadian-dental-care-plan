import { inject } from 'inversify';
import { retry } from 'moderndash';
import { ProxyAgent } from 'undici';

import { TYPES } from '~/.server/constants';
import { createLogger } from '~/.server/logging';
import type { Logger } from '~/.server/logging';
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
 * Options for configuring a retry mechanism for fetch function.
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts (excluding the first try).
   * Set to 0 or undefined to disable retries.
   */
  retries?: number;

  /**
   * Base delay in milliseconds before the first retry attempt.
   * Subsequent retries will use exponential backoff.
   */
  backoffMs?: number;

  /**
   * A mapping of HTTP status codes to body matchers (string or RegExp) that should trigger a retry.
   * If the array is empty, any response with the corresponding status code will trigger a retry.
   */
  retryConditions?: {
    [statusCode: number]: (string | RegExp)[];
  };
}

/**
 * Options for performing a fetch request with conditional retry logic
 * based on HTTP status codes and optional response body matchers.
 */
interface FetchRetryOptions {
  fetchFn: typeof fetch;
  input: RequestInfo | URL;
  init: RequestInit;
  retryConditions: Record<number, (string | RegExp)[]>;
}

/**
 * Extended options for instrumented fetch calls.
 */
export type InstrumentedFetchOptions = RequestInit &
  FetchOptions & {
    retryOptions?: RetryOptions;
  };

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
   * @param options - (Optional) Additional options for the request, including proxy settings, initialization options and retry configuration.
   * @returns A promise that resolves with the `Response` object from the HTTP request.
   * @throws Will throw an error if the HTTP request fails.
   */
  instrumentedFetch(metricPrefix: string, input: RequestInfo | URL, options?: InstrumentedFetchOptions): Promise<Response>;
}

export class DefaultHttpClient implements HttpClient {
  private readonly log: Logger;
  private readonly instrumentationService: InstrumentationService;

  constructor(@inject(TYPES.observability.InstrumentationService) instrumentationService: InstrumentationService) {
    this.log = createLogger('DefaultHttpClient');
    this.instrumentationService = instrumentationService;
  }

  getFetchFn(options: FetchOptions): FetchFn {
    this.log.debug('Getting fetch function; options: [%j]', options);
    const { proxyUrl, timeout } = options;
    if (proxyUrl) {
      const { HTTP_PROXY_TLS_TIMEOUT } = getEnv();
      const proxyTlsTimeout = timeout ?? HTTP_PROXY_TLS_TIMEOUT;
      const dispatcher = new ProxyAgent({ uri: proxyUrl, proxyTls: { timeout: proxyTlsTimeout } });
      this.log.debug('A proxy [%s] has been configured with timeout [%d] ms; using custom fetch', proxyUrl, proxyTlsTimeout);

      return async (input, init) => {
        // @ts-expect-error since remix v2.9.x, the server fetch() polyfill is provided by undici,
        //                  which accepts a dispatcher object to facilitate request proxying
        return await fetch(input, { ...init, dispatcher });
      };
    }

    this.log.debug('No proxy configured; using global fetch');
    return fetch;
  }

  async instrumentedFetch(metricPrefix: string, input: RequestInfo | URL, options: InstrumentedFetchOptions = {}): Promise<Response> {
    this.log.debug('Executing instumented fetch function; metricPrefix: [%s], input: [%s], options: [%j]', metricPrefix, input, options);
    const { proxyUrl, timeout, retryOptions, ...init } = options;

    // Configure default retry options if not specified
    const { retries = 0, backoffMs = 100, retryConditions = {} } = retryOptions ?? {};

    const fetchFn = this.getFetchFn({ proxyUrl, timeout });

    try {
      const response = await retry(async () => await this.fetchWithRetryConditions({ fetchFn, input, init, retryConditions }), {
        maxRetries: retries,
        backoff: (retries) => retries * backoffMs,
        onRetry: (error, attempt) => {
          this.log.warn('HTTP request failed; metricPrefix: [%s]; attempt [%d] of [%d]; error: [%s]', metricPrefix, attempt, retries, error);
          this.instrumentationService.countHttpStatus(metricPrefix, 500);
        },
      });

      this.log.trace('HTTP request succeeded; metricPrefix: [%s]; status: [%d]', metricPrefix, response.status);
      this.instrumentationService.countHttpStatus(metricPrefix, response.status);

      return response;
    } catch (error) {
      this.log.error('HTTP request failed after all attempts; metricPrefix: [%s]; error: [%s]', metricPrefix, error);
      this.instrumentationService.countHttpStatus(metricPrefix, 500);
      throw error;
    }
  }

  /**
   * Fetches a resource and checks for retry conditions based on the response status and body.
   *
   * @param fetchFn - The fetch function to use for making the request.
   * @param input - The input for the HTTP request, which can be a URL or a `RequestInfo` object.
   * @param init - The initialization options for the fetch request.
   * @param retryConditions - A map of status codes to response body contents that should trigger a retry.
   * @returns A promise that resolves with the `Response` object from the HTTP request.
   */
  private async fetchWithRetryConditions({ fetchFn, input, init, retryConditions }: FetchRetryOptions): Promise<Response> {
    const response = await fetchFn(input, init);
    this.log.trace('HTTP request completed; status: [%d]', response.status);

    const conditions = retryConditions[response.status];
    if (!conditions) {
      return response;
    }

    if (conditions.length === 0) {
      throw new Error(`Retryable response: ${response.status} (unconditional match)`);
    }

    const body = await response.clone().text(); // clone to avoid consuming body
    const matchedCondition = conditions.find((cond) => (typeof cond === 'string' ? cond === body : cond.test(body)));

    if (matchedCondition) {
      throw new Error(`Retryable response: ${response.status} (matched body condition: ${matchedCondition})`);
    }

    return response;
  }
}

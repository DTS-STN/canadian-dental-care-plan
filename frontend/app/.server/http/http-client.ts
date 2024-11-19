import { Dispatcher, getGlobalDispatcher, request } from 'undici';

import { HTTP_STATUS_CODES } from '../constants/http-status-codes.constant';
import type { LogFactory, Logger } from '../factories';
import { HttpClientResponseException } from './exceptions';

/**
 * Represents HTTP headers as a key-value mapping.
 * Keys are header names, and values can be:
 * - A single string value
 * - An array of strings for multiple values
 * - Undefined if the header is not set
 */
export type HttpHeaders = Record<string, string | string[] | undefined>;

/**
 * Represents the structure of an HTTP response.
 *
 * @template T - The type of the response payload.
 */
export interface HttpResponse<T> {
  /**
   * The HTTP status code of the response (e.g., 200, 404).
   */
  statusCode: number;

  /**
   * The parsed result of the HTTP response body.
   * If the status code indicates an error (e.g., 404), this may be `null`.
   */
  result: T | null;

  /**
   * The HTTP headers returned in the response.
   */
  headers: HttpHeaders;
}

/**
 * Options for configuring an HTTP request.
 *
 * Extends {@link Dispatcher.DispatchOptions} from `undici`, omitting the `method`, `path`, and `headers` properties
 * to allow custom handling.
 */
export interface HttpRequestOptions extends Omit<Dispatcher.DispatchOptions, 'method' | 'path' | 'headers'> {
  /**
   * The value of the `Accept` header to specify the desired response format.
   * Defaults to `application/json`. For example: `application/json;version=2.1`.
   */
  acceptHeader?: string;

  /**
   * Additional HTTP headers to include in the request.
   */
  headers?: HttpHeaders;
}

/**
 * Interface for an HTTP client to perform various HTTP requests.
 */
export interface HttpClient {
  /**
   * Sends an HTTP DELETE request to the specified URL.
   * Typically used to delete a resource.
   *
   * @template T - The type of the response data.
   * @param url - Fully qualified or relative URL of the endpoint.
   * @param options - (Optional) Additional options for the HTTP request.
   * @returns A promise that resolves to an {@link HttpResponse} containing the response data, status, and headers.
   */
  del<T>(url: string | URL, requestOptions?: HttpRequestOptions): Promise<HttpResponse<T>>;

  /**
   * Sends an HTTP GET request to the specified URL.
   * Typically used to retrieve data from an endpoint.
   *
   * @template T - The type of the response data.
   * @param url - Fully qualified or relative URL of the endpoint.
   * @param options - (Optional) Additional options for the HTTP request.
   * @returns A promise that resolves to an {@link HttpResponse} containing the response data, status, and headers.
   */
  get<T>(url: string | URL, requestOptions?: HttpRequestOptions): Promise<HttpResponse<T>>;

  /**
   * Sends an HTTP OPTIONS request to the specified URL.
   * Typically used to describe communication options for a resource.
   *
   * @template T - The type of the response data.
   * @param url - Fully qualified or relative URL of the endpoint.
   * @param options - (Optional) Additional options for the HTTP request.
   * @returns A promise that resolves to an {@link HttpResponse} containing the response data, status, and headers.
   */
  options<T>(url: string | URL, requestOptions?: HttpRequestOptions): Promise<HttpResponse<T>>;

  /**
   * Sends an HTTP PATCH request to the specified URL with the provided data.
   * Typically used to partially update a resource.
   *
   * @template T - The type of the response data.
   * @param url - Fully qualified or relative URL of the endpoint.
   * @param data - The data to be sent as the request body.
   * @param options - (Optional) Additional options for the HTTP request.
   * @returns A promise that resolves to an {@link HttpResponse} containing the response data, status, and headers.
   */
  patch<T>(url: string, data: unknown, requestOptions?: HttpRequestOptions): Promise<HttpResponse<T>>;

  /**
   * Sends an HTTP POST request to the specified URL with the provided data.
   * Typically used to create a new resource.
   *
   * @template T - The type of the response data.
   * @param url - Fully qualified or relative URL of the endpoint.
   * @param data - The data to be sent as the request body.
   * @param options - (Optional) Additional options for the HTTP request.
   * @returns A promise that resolves to an {@link HttpResponse} containing the response data, status, and headers.
   */
  post<T>(url: string | URL, data: unknown, requestOptions?: HttpRequestOptions): Promise<HttpResponse<T>>;

  /**
   * Sends an HTTP PUT request to the specified URL with the provided data.
   * Typically used to replace a resource or create a resource if it does not exist.
   *
   * @template T - The type of the response data.
   * @param url - Fully qualified or relative URL of the endpoint.
   * @param data - The data to be sent as the request body.
   * @param options - (Optional) Additional options for the HTTP request.
   * @returns A promise that resolves to an {@link HttpResponse} containing the response data, status, and headers.
   */
  put<T>(url: string, data: unknown, requestOptions?: HttpRequestOptions): Promise<HttpResponse<T>>;
}

export class UndiciHttpClient implements HttpClient {
  private readonly log: Logger;
  private readonly baseRequestDispatcher?: Dispatcher;

  constructor(logFactory: LogFactory, baseRequestDispatcher?: Dispatcher) {
    this.log = logFactory.createLogger('UndiciHttpClient');
    this.baseRequestDispatcher = baseRequestDispatcher;
  }

  public async del<T>(url: string | URL, requestOptions?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return await this.executeRequest<T>('DELETE', url, undefined, requestOptions);
  }

  public async get<T>(url: string | URL, requestOptions?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return await this.executeRequest<T>('GET', url, undefined, requestOptions);
  }

  public async options<T>(url: string | URL, requestOptions?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return await this.executeRequest<T>('OPTIONS', url, undefined, requestOptions);
  }

  public async patch<T>(url: string, data: unknown, requestOptions?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return await this.executeRequest<T>('PATCH', url, data, requestOptions);
  }

  public async post<T>(url: string | URL, data: unknown, requestOptions?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return await this.executeRequest<T>('POST', url, data, requestOptions);
  }

  public async put<T>(url: string, data: unknown, requestOptions?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return await this.executeRequest<T>('PUT', url, data, requestOptions);
  }

  /**
   * Executes an HTTP request.
   * @param method - HTTP method to use.
   * @param url - Fully qualified URL.
   * @param data - (Optional) Request body.
   * @param options - (Optional) Request options.
   * @returns A promise resolving to the HTTP response.
   * @throws HttpClientResponseException - If the request fails with a non-2xx status.
   */
  private async executeRequest<T>(method: Dispatcher.HttpMethod, url: string | URL, data?: unknown, requestOptions?: HttpRequestOptions): Promise<HttpResponse<T>> {
    const headers = this.headersFromOptions(requestOptions, data != null);
    const body = data ? JSON.stringify(data) : undefined;
    this.log.trace('Executing %s request for URL: [%s]', method, url);
    const res = await request(url, { ...requestOptions, method, headers, body, dispatcher });
    return await this.processResponse<T>(res);
  }

  private headersFromOptions(requestOptions?: HttpRequestOptions, contentTypeRequired = false): HttpHeaders {
    const headers: HttpHeaders = { ...requestOptions?.headers, Accept: requestOptions?.acceptHeader ?? 'application/json' };

    if (contentTypeRequired && !Object.keys(headers).some((key) => key.toLowerCase() === 'content-type')) {
      headers['Content-Type'] = 'application/json; charset=utf-8';
    }

    return headers;
  }

  private async processResponse<T>(res: Dispatcher.ResponseData): Promise<HttpResponse<T>> {
    const { statusCode } = res;
    const response: HttpResponse<T> = { statusCode, result: null, headers: res.headers };

    if (statusCode === HTTP_STATUS_CODES.NOT_FOUND) {
      return response;
    }

    let bodyContent = '';

    try {
      bodyContent = await res.body.text();
      if (bodyContent) {
        response.result = JSON.parse(bodyContent);
      }
    } catch (error) {
      this.log.warn('Failed to parse response body: %j', error);
    }

    if (statusCode > 299) {
      const msg = response.result && typeof response.result === 'object' && 'message' in response.result && typeof response.result.message === 'string' ? response.result.message : bodyContent;
      const errorMsg = msg.length > 0 ? msg : `HTTP ${statusCode}: Request failed.`;
      throw new HttpClientResponseException(errorMsg, statusCode, response.result, response.headers);
    }

    return response;
  }
}

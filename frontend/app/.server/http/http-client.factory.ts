import type { LogFactory } from '../factories';
import { UndiciHttpClient } from './http-client';
import type { HttpClient } from './http-client';

export interface CreateHttpClientOptions {
  proxyConfigs?: {
    proxyUrl: string;
  };
  instrumentationMetricsConfigs?: {
    prefix: string;
  };
}

export interface HttpClientFactory {
  createHttpClient(options: CreateHttpClientOptions): HttpClient;
}

export class DefaultHttpClientFactory implements HttpClientFactory {
  private readonly logFactory: LogFactory;

  constructor(logFactory: LogFactory) {
    this.logFactory = logFactory;
  }

  public createHttpClient(options: CreateHttpClientOptions): HttpClient {
    return new UndiciHttpClient(this.logFactory);
  }
}

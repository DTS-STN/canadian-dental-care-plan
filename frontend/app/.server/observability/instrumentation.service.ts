/**
 * This file provides useful OpenTelemetry utility functions.
 *
 * References:
 *
 *   - https://www.npmjs.com/package/@opentelemetry/sdk-node
 *   - https://www.dynatrace.com/support/help/extend-dynatrace/opentelemetry
 */
import type { Attributes, Counter, Histogram, MetricOptions, Span } from '@opentelemetry/api';
import { metrics, trace } from '@opentelemetry/api';
import { inject, injectable } from 'inversify';
import invariant from 'tiny-invariant';

import type { ServerConfig } from '~/.server/configs';
import { TYPES } from '~/.server/constants';
import type { BuildInfo, BuildInfoService } from '~/.server/core';
import type { LogFactory, Logger } from '~/.server/factories';

export interface InstrumentationService {
  /**
   * A helper function that will count the number of successful or
   * failed requests by examining the http status.
   *
   * @param prefix - The prefix to add to the metric name.
   * @param httpStatus - The HTTP status code.
   * @param options - Optional metric options.
   */
  countHttpStatus(prefix: string, httpStatus: number, options?: MetricOptions): void;
  /**
   * Creates a counter metric.
   *
   * @param name - The name of the counter.
   * @param options - Optional metric options.
   * @returns A counter metric.
   */
  createCounter(name: string, options?: MetricOptions): Counter<Attributes>;
  /**
   * Creates a histogram metric.
   *
   * @param name - The name of the histogram.
   * @param options - Optional metric options.
   * @returns A histogram metric.
   */
  createHistogram(name: string, options?: MetricOptions): Histogram<Attributes>;
  /**
   * Starts an active span.
   * @param name - The name of the span.
   * @param fn - The function to execute within the span.
   * @returns The result of the function.
   */
  startActiveSpan<T extends (span: Span) => unknown>(name: string, fn: T): ReturnType<T>;
}

export type DefaultInstrumentationServiceServerConfig = Pick<ServerConfig, 'OTEL_SERVICE_NAME'>;

@injectable()
export class DefaultInstrumentationService implements InstrumentationService {
  private readonly log: Logger;
  private readonly buildInfo: BuildInfo;

  constructor(
    @inject(TYPES.factories.LogFactory) logFactory: LogFactory,
    @inject(TYPES.configs.ServerConfig) private readonly serverConfig: DefaultInstrumentationServiceServerConfig,
    @inject(TYPES.core.BuildInfoService) buildInfoService: BuildInfoService,
  ) {
    this.log = logFactory.createLogger(DefaultInstrumentationService.name);
    this.buildInfo = buildInfoService.getBuildInfo();
  }

  /**
   * @see https://opentelemetry.io/docs/languages/js/instrumentation/#create-counters
   */
  createCounter(name: string, options?: MetricOptions): Counter<Attributes> {
    return metrics.getMeter(this.serverConfig.OTEL_SERVICE_NAME, this.buildInfo.buildVersion).createCounter(name, options);
  }

  /**
   * @see https://opentelemetry.io/docs/languages/js/instrumentation/#using-histograms
   */
  createHistogram(name: string, options?: MetricOptions): Histogram<Attributes> {
    return metrics.getMeter(this.serverConfig.OTEL_SERVICE_NAME, this.buildInfo.buildVersion).createHistogram(name, options);
  }

  /**
   * @see https://opentelemetry.io/docs/languages/js/instrumentation/#create-spans
   */
  startActiveSpan<T extends (span: Span) => unknown>(name: string, fn: T): ReturnType<T> {
    return trace.getTracer(this.serverConfig.OTEL_SERVICE_NAME, this.buildInfo.buildVersion).startActiveSpan(name, fn);
  }

  /**
   * A helper function that will count the number of successful or
   * failed requests by examining the http status.
   */
  countHttpStatus(prefix: string, httpStatus: number, options?: MetricOptions): void {
    invariant(httpStatus > 0, 'httpStatus must be a positive integer');
    this.createCounter(`${prefix}.requests.status.${httpStatus}`, options).add(1);
    this.createCounter(`${prefix}.requests.status.${httpStatus >= 400 ? 'failed' : 'success'}`, options).add(1);
  }
}

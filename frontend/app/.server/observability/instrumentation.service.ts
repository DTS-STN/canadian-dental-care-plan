/**
 * This file initializes OpenTelemetry for the application using the @opentelemetry/sdk-node package.
 *
 * Two Dynatrace exporters are provided, and rely on the following (optional) environment variables:
 *
 *   - OTEL_METRICS_ENDPOINT -- defines the Dynatrace OpenTelemetry metrics endpoint
 *     (ex: https://example.com/e/00000000-0000-0000-0000-000000000000/api/v2/otlp/v1/metrics)
 *   - OTEL_TRACES_ENDPOINT -- defines the Dynatrace Opentelemetry traces endpoint
 *     (ex: https://example.com/e/00000000-0000-0000-0000-000000000000/api/v2/otlp/v1/traces)
 *   - OTEL_API_KEY -- defines the Dynatrace API key used by the metrics and traces endpoint
 *     (ex: dt0c01.xxxxxxxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy)
 *
 * If either Dynatrace endpoint is not provided, a NOOP metrics and/or a NOOP traces exporter will be configured.
 *
 * NOTE: to ensure that tracing is fully initialized, NodeSDK must be initialized early during runtime.
 *       in Remix, this can be done by importing this file in remix.config.js.
 *
 * References:
 *
 *   - https://www.npmjs.com/package/@opentelemetry/sdk-node
 *   - https://www.dynatrace.com/support/help/extend-dynatrace/opentelemetry
 */
import type { Attributes, Counter, Histogram, MetricOptions, Span } from '@opentelemetry/api';
import { metrics, trace } from '@opentelemetry/api';
import { ExportResultCode } from '@opentelemetry/core';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { CompressionAlgorithm } from '@opentelemetry/otlp-exporter-base';
import { Resource, envDetector, hostDetector, osDetector, processDetector } from '@opentelemetry/resources';
import type { PushMetricExporter } from '@opentelemetry/sdk-metrics';
import { AggregationTemporality, ConsoleMetricExporter, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import type { SpanExporter } from '@opentelemetry/sdk-trace-base';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { SEMRESATTRS_DEPLOYMENT_ENVIRONMENT, SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { inject, injectable } from 'inversify';
import moize from 'moize';
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

  /**
   * Configure OpenTelemetry's NodeSDK and call the .start() function
   */
  startInstrumentation(): void;
}

export type DefaultInstrumentationServiceServerConfig = Pick<
  ServerConfig,
  'OTEL_API_KEY' | 'OTEL_ENVIRONMENT' | 'OTEL_METRICS_ENDPOINT' | 'OTEL_SERVICE_NAME' | 'OTEL_TRACES_ENDPOINT' | 'OTEL_USE_CONSOLE_EXPORTERS' | 'OTEL_METRICS_EXPORT_INTERVAL_MILLIS' | 'OTEL_METRICS_EXPORT_TIMEOUT_MILLIS'
>;

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

  startInstrumentation = moize(this._startInstrumentation, {
    onCacheAdd: () => {
      this.log.info('Starting OpenTelemetry instrumentation listener');
    },
  });

  private _startInstrumentation() {
    new NodeSDK({
      metricReader: new PeriodicExportingMetricReader({
        exporter: this.getMetricExporter(),
        exportIntervalMillis: this.serverConfig.OTEL_METRICS_EXPORT_INTERVAL_MILLIS,
        exportTimeoutMillis: this.serverConfig.OTEL_METRICS_EXPORT_TIMEOUT_MILLIS,
      }),
      resource: new Resource({
        // Note: any attributes added here must be configured in Dynatrace under
        // Settings → Metrics → OpenTelemetry metrics → Allow list: resource and scope attributes
        //
        // @see: node_modules/@opentelemetry/semantic-conventions/build/src/resource/SemanticResourceAttributes.js
        // @see: node_modules/@opentelemetry/semantic-conventions/build/src/trace/SemanticResourceAttributes.js
        [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: this.serverConfig.OTEL_ENVIRONMENT,
        [SEMRESATTRS_SERVICE_NAME]: this.serverConfig.OTEL_SERVICE_NAME,
        [SEMRESATTRS_SERVICE_VERSION]: this.buildInfo.buildVersion,
      }),
      resourceDetectors: [envDetector, hostDetector, osDetector, processDetector],
      traceExporter: this.getTraceExporter(),
    }).start();
  }

  private getMetricExporter(): PushMetricExporter {
    if (this.serverConfig.OTEL_USE_CONSOLE_EXPORTERS) {
      this.log.info(`Exporting metrics to console every %s ms`, this.serverConfig.OTEL_METRICS_EXPORT_INTERVAL_MILLIS);
      return new ConsoleMetricExporter();
    }

    if (this.serverConfig.OTEL_METRICS_ENDPOINT) {
      if (!this.serverConfig.OTEL_API_KEY) {
        throw new Error('OTEL_API_KEY must be configured when OTEL_METRICS_ENDPOINT is set');
      }

      this.log.info(`Exporting metrics to %s every %s ms`, this.serverConfig.OTEL_METRICS_ENDPOINT, this.serverConfig.OTEL_METRICS_EXPORT_INTERVAL_MILLIS);

      return new OTLPMetricExporter({
        compression: CompressionAlgorithm.GZIP,
        headers: { Authorization: `Api-Token ${this.serverConfig.OTEL_API_KEY}` },
        temporalityPreference: AggregationTemporality.DELTA,
        url: this.serverConfig.OTEL_METRICS_ENDPOINT,
      });
    }

    this.log.info('Metrics exporting is disabled; set OTEL_METRICS_ENDPOINT or OTEL_USE_CONSOLE_EXPORTERS to enable.');

    return {
      // a no-op PushMetricExporter implementation
      export: (metrics, resultCallback) => resultCallback({ code: ExportResultCode.SUCCESS }),
      forceFlush: async () => {},
      shutdown: async () => {},
    };
  }

  private getTraceExporter(): SpanExporter {
    if (this.serverConfig.OTEL_USE_CONSOLE_EXPORTERS) {
      this.log.info(`Exporting traces to console every 30000 ms`);
      return new ConsoleSpanExporter();
    }

    if (this.serverConfig.OTEL_TRACES_ENDPOINT) {
      if (!this.serverConfig.OTEL_API_KEY) {
        throw new Error('OTEL_API_KEY must be configured when OTEL_TRACES_ENDPOINT is set');
      }

      // TODO :: GjB :: can this 30000 ms be configured? (spoiler: I don't think so...)
      this.log.info(`Exporting traces to %s every 30000 ms`, this.serverConfig.OTEL_TRACES_ENDPOINT);

      return new OTLPTraceExporter({
        compression: CompressionAlgorithm.GZIP,
        headers: { Authorization: `Api-Token ${this.serverConfig.OTEL_API_KEY}` },
        url: this.serverConfig.OTEL_TRACES_ENDPOINT,
      });
    }

    this.log.info('Traces exporting is disabled; set OTEL_TRACES_ENDPOINT or OTEL_USE_CONSOLE_EXPORTERS to enable.');

    return {
      // a no-op SpanExporter implementation
      export: (spans, resultCallback) => resultCallback({ code: ExportResultCode.SUCCESS }),
      shutdown: async () => {},
    };
  }
}

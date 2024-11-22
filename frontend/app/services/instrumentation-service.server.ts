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
import type { MetricOptions, Span } from '@opentelemetry/api';
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
import moize from 'moize';
import invariant from 'tiny-invariant';

import { getEnv } from '~/.server/utils/env.utils';
import { getLogger } from '~/.server/utils/logging.utils';
import { getBuildInfoService } from '~/services/build-info-service.server';

/**
 * Return a singleton instance (by means of memomization) of the instrumentation service.
 */
export const getInstrumentationService = moize(createInstrumentationService, {
  onCacheAdd: () => {
    const log = getLogger('instrumentation.server/getInstrumentationService');
    log.info('Creating new OpenTelemetry instrumentation service');
  },
});

function createInstrumentationService() {
  const env = getEnv();

  const buildInfoService = getBuildInfoService();
  const buildInfo = buildInfoService.getBuildInfo();

  /**
   * Configure OpenTelemetry's NodeSDK and call the .start() function
   */
  function startInstrumentation() {
    new NodeSDK({
      metricReader: new PeriodicExportingMetricReader({
        exporter: getMetricExporter(),
        exportIntervalMillis: env.OTEL_METRICS_EXPORT_INTERVAL_MILLIS,
        exportTimeoutMillis: env.OTEL_METRICS_EXPORT_TIMEOUT_MILLIS,
      }),
      resource: new Resource({
        // Note: any attributes added here must be configured in Dynatrace under
        // Settings → Metrics → OpenTelemetry metrics → Allow list: resource and scope attributes
        //
        // @see: node_modules/@opentelemetry/semantic-conventions/build/src/resource/SemanticResourceAttributes.js
        // @see: node_modules/@opentelemetry/semantic-conventions/build/src/trace/SemanticResourceAttributes.js
        [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: env.OTEL_ENVIRONMENT,
        [SEMRESATTRS_SERVICE_NAME]: env.OTEL_SERVICE_NAME,
        [SEMRESATTRS_SERVICE_VERSION]: buildInfo.buildVersion,
      }),
      resourceDetectors: [envDetector, hostDetector, osDetector, processDetector],
      traceExporter: getTraceExporter(),
    }).start();
  }

  const getMetricExporter = (): PushMetricExporter => {
    const log = getLogger('instrumentation.server/getMetricExporter');
    if (env.OTEL_USE_CONSOLE_EXPORTERS) {
      log.info(`Exporting metrics to console every ${env.OTEL_METRICS_EXPORT_INTERVAL_MILLIS} ms`);
      return new ConsoleMetricExporter();
    }

    if (env.OTEL_METRICS_ENDPOINT) {
      if (!env.OTEL_API_KEY) {
        throw new Error('OTEL_API_KEY must be configured when OTEL_METRICS_ENDPOINT is set');
      }

      log.info(`Exporting metrics to ${env.OTEL_METRICS_ENDPOINT} every ${env.OTEL_METRICS_EXPORT_INTERVAL_MILLIS} ms`);

      return new OTLPMetricExporter({
        compression: CompressionAlgorithm.GZIP,
        headers: { Authorization: `Api-Token ${env.OTEL_API_KEY}` },
        temporalityPreference: AggregationTemporality.DELTA,
        url: env.OTEL_METRICS_ENDPOINT,
      });
    }

    log.info('Metrics exporting is disabled; set OTEL_METRICS_ENDPOINT or OTEL_USE_CONSOLE_EXPORTERS to enable.');

    return {
      // a no-op PushMetricExporter implementation
      export: (metrics, resultCallback) => resultCallback({ code: ExportResultCode.SUCCESS }),
      forceFlush: async () => {},
      shutdown: async () => {},
    };
  };

  const getTraceExporter = (): SpanExporter => {
    const log = getLogger('instrumentation.server/getTraceExporter');
    if (env.OTEL_USE_CONSOLE_EXPORTERS) {
      log.info(`Exporting traces to console every 30000 ms`);
      return new ConsoleSpanExporter();
    }

    if (env.OTEL_TRACES_ENDPOINT) {
      if (!env.OTEL_API_KEY) {
        throw new Error('OTEL_API_KEY must be configured when OTEL_TRACES_ENDPOINT is set');
      }

      // TODO :: GjB :: can this 30000 ms be configured? (spoiler: I don't think so...)
      log.info(`Exporting traces to ${env.OTEL_TRACES_ENDPOINT} every 30000 ms`);

      return new OTLPTraceExporter({
        compression: CompressionAlgorithm.GZIP,
        headers: { Authorization: `Api-Token ${env.OTEL_API_KEY}` },
        url: env.OTEL_TRACES_ENDPOINT,
      });
    }

    log.info('Traces exporting is disabled; set OTEL_TRACES_ENDPOINT or OTEL_USE_CONSOLE_EXPORTERS to enable.');

    return {
      // a no-op SpanExporter implementation
      export: (spans, resultCallback) => resultCallback({ code: ExportResultCode.SUCCESS }),
      shutdown: async () => {},
    };
  };

  /**
   * @see https://opentelemetry.io/docs/languages/js/instrumentation/#create-counters
   */
  function createCounter(name: string, options?: MetricOptions) {
    return metrics.getMeter(env.OTEL_SERVICE_NAME, buildInfo.buildVersion).createCounter(name, options);
  }

  /**
   * @see https://opentelemetry.io/docs/languages/js/instrumentation/#using-histograms
   */
  function createHistogram(name: string, options?: MetricOptions) {
    return metrics.getMeter(env.OTEL_SERVICE_NAME, buildInfo.buildVersion).createHistogram(name, options);
  }

  /**
   * @see https://opentelemetry.io/docs/languages/js/instrumentation/#create-spans
   */
  function startActiveSpan<T extends (span: Span) => unknown>(name: string, fn: T) {
    return trace.getTracer(env.OTEL_SERVICE_NAME, buildInfo.buildVersion).startActiveSpan(name, fn);
  }

  /**
   * A helper function that will count the number of successful or
   * failed requests by examining the http status.
   */
  function countHttpStatus(prefix: string, httpStatus: number, options?: MetricOptions) {
    invariant(httpStatus > 0, 'httpStatus must be a positive integer');

    createCounter(`${prefix}.requests.status.${httpStatus}`, options).add(1);
    createCounter(`${prefix}.requests.status.${httpStatus >= 400 ? 'failed' : 'success'}`, options).add(1);
  }

  return {
    countHttpStatus,
    createCounter,
    createHistogram,
    startActiveSpan,
    // the OpenTelemetry SDK should only be started once during runtime, so memoize the call to be sure it is
    startInstrumentation: moize(startInstrumentation, {
      onCacheAdd: () => {
        const log = getLogger('instrumentation.server/startInstrumentation');
        log.info('Starting OpenTelemetry instrumentation listener');
      },
    }),
  };
}

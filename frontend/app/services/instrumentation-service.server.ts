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
import { MetricOptions, metrics } from '@opentelemetry/api';
import { ExportResultCode } from '@opentelemetry/core';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { CompressionAlgorithm } from '@opentelemetry/otlp-exporter-base';
import { Resource, envDetector, hostDetector, osDetector, processDetector } from '@opentelemetry/resources';
import { AggregationTemporality, PeriodicExportingMetricReader, PushMetricExporter } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { SpanExporter } from '@opentelemetry/sdk-trace-base';
import { SEMRESATTRS_DEPLOYMENT_ENVIRONMENT, SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import moize from 'moize';

import { getBuildInfoService } from '~/services/build-info-service.server';
import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('instrumentation.server');

/**
 * Return a singleton instance (by means of memomization) of the instrumentation service.
 */
export const getInstrumentationService = moize(createInstrumentationService, { onCacheAdd: () => log.info('Creating new OpenTelemetry instrumentation service') });

function createInstrumentationService() {
  const env = getEnv();

  const buildInfoService = getBuildInfoService();
  const buildInfo = buildInfoService.getBuildInfo();

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
        // see: node_modules/@opentelemetry/semantic-conventions/build/src/resource/SemanticResourceAttributes.js
        // see: node_modules/@opentelemetry/semantic-conventions/build/src/trace/SemanticResourceAttributes.js
        [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: env.OTEL_ENVIRONMENT,
        [SEMRESATTRS_SERVICE_NAME]: env.OTEL_SERVICE_NAME,
        [SEMRESATTRS_SERVICE_VERSION]: buildInfo.buildVersion,
      }),
      resourceDetectors: [envDetector, hostDetector, osDetector, processDetector],
      traceExporter: getTraceExporter(),
    }).start();
  }

  const getMetricExporter = (): PushMetricExporter => {
    const exportMetrics = env.OTEL_METRICS_ENDPOINT;

    if (exportMetrics) {
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

    log.info('Metrics exporting is disabled; set OTEL_METRICS_ENDPOINT to enable.');

    return {
      // a no-op PushMetricExporter implementation
      export: (metrics, resultCallback) => resultCallback({ code: ExportResultCode.SUCCESS }),
      forceFlush: async () => {},
      shutdown: async () => {},
    };
  };

  const getTraceExporter = (): SpanExporter => {
    const exportTraces = env.OTEL_TRACES_ENDPOINT;

    if (exportTraces) {
      if (!env.OTEL_API_KEY) {
        throw new Error('OTEL_API_KEY must be configured when OTEL_TRACES_ENDPOINT is set');
      }

      log.info(`Exporting traces to ${env.OTEL_TRACES_ENDPOINT} every 30000 ms`);

      return new OTLPTraceExporter({
        compression: CompressionAlgorithm.GZIP,
        headers: { Authorization: `Api-Token ${env.OTEL_API_KEY}` },
        url: env.OTEL_TRACES_ENDPOINT,
      });
    }

    log.info('Traces exporting is disabled; set OTEL_TRACES_ENDPOINT to enable.');

    return {
      // a no-op SpanExporter implementation
      export: (spans, resultCallback) => resultCallback({ code: ExportResultCode.SUCCESS }),
      shutdown: async () => {},
    };
  };

  function createCounter(name: string, options?: MetricOptions) {
    return metrics.getMeter(env.OTEL_SERVICE_NAME, buildInfo.buildVersion).createCounter(name, options);
  }

  function createHistogram(name: string, options?: MetricOptions) {
    return metrics.getMeter(env.OTEL_SERVICE_NAME, buildInfo.buildVersion).createHistogram(name, options);
  }

  return {
    createCounter,
    createHistogram,
    startInstrumentation: moize(startInstrumentation, { onCacheAdd: () => log.info('Starting OpenTelemetry instrumentation service') }),
  };
}

import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ExportResultCode } from '@opentelemetry/core';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { CompressionAlgorithm } from '@opentelemetry/otlp-exporter-base';
import { Resource } from '@opentelemetry/resources';
import type { PushMetricExporter } from '@opentelemetry/sdk-metrics';
import { AggregationTemporality, ConsoleMetricExporter, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import type { SpanExporter } from '@opentelemetry/sdk-trace-base';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { ATTR_DEPLOYMENT_ENVIRONMENT_NAME } from '@opentelemetry/semantic-conventions/incubating';

import { getLogger } from '~/.server/utils/logging.utils';

const log = getLogger('opentelemetry');

/**
 * Gets the environment variable value, falling back to a default value if the environment variable is not set or is empty.
 */
function getEnvValue(defaultValue: string, envVar?: string): string {
  return envVar && envVar !== '' ? envVar : defaultValue;
}

function getMetricExporter(): PushMetricExporter {
  if (process.env.OTEL_USE_CONSOLE_EXPORTERS) {
    log.info(`Exporting metrics to console every %s ms`, process.env.OTEL_METRICS_EXPORT_INTERVAL_MILLIS);
    return new ConsoleMetricExporter();
  }

  if (process.env.OTEL_METRICS_ENDPOINT) {
    if (!process.env.OTEL_API_KEY) {
      throw new Error('OTEL_API_KEY must be configured when OTEL_METRICS_ENDPOINT is set');
    }

    log.info(`Exporting metrics to %s every %s ms`, process.env.OTEL_METRICS_ENDPOINT, process.env.OTEL_METRICS_EXPORT_INTERVAL_MILLIS);

    return new OTLPMetricExporter({
      compression: CompressionAlgorithm.GZIP,
      headers: { Authorization: `Api-Token ${process.env.OTEL_API_KEY}` },
      temporalityPreference: AggregationTemporality.DELTA,
      url: process.env.OTEL_METRICS_ENDPOINT,
    });
  }

  log.info('Metrics exporting is disabled; set OTEL_METRICS_ENDPOINT or OTEL_USE_CONSOLE_EXPORTERS to enable.');

  return {
    // a no-op PushMetricExporter implementation
    export: (metrics, resultCallback) => resultCallback({ code: ExportResultCode.SUCCESS }),
    forceFlush: async () => {},
    shutdown: async () => {},
  };
}

function getTraceExporter(): SpanExporter {
  if (process.env.OTEL_USE_CONSOLE_EXPORTERS === 'true') {
    log.info(`Exporting traces to console every 30000 ms`);
    return new ConsoleSpanExporter();
  }

  if (process.env.OTEL_TRACES_ENDPOINT) {
    if (!process.env.OTEL_API_KEY) {
      throw new Error('OTEL_API_KEY must be configured when OTEL_TRACES_ENDPOINT is set');
    }

    // TODO :: GjB :: can this 30000 ms be configured? (spoiler: I don't think so...)
    log.info(`Exporting traces to %s every 30000 ms`, process.env.OTEL_TRACES_ENDPOINT);

    return new OTLPTraceExporter({
      compression: CompressionAlgorithm.GZIP,
      headers: { Authorization: `Api-Token ${process.env.OTEL_API_KEY}` },
      url: process.env.OTEL_TRACES_ENDPOINT,
    });
  }

  log.info('Traces exporting is disabled; set OTEL_TRACES_ENDPOINT or OTEL_USE_CONSOLE_EXPORTERS to enable.');

  return {
    // a no-op SpanExporter implementation
    export: (spans, resultCallback) => resultCallback({ code: ExportResultCode.SUCCESS }),
    shutdown: async () => {},
  };
}

log.info('Initializing instrumentation');

new NodeSDK({
  instrumentations: [
    getNodeAutoInstrumentations({
      // winston auto-instrumentation adds a lot of unwanted attributes to the logs
      '@opentelemetry/instrumentation-winston': { enabled: false },
    }),
  ],

  resource: new Resource({
    [ATTR_SERVICE_NAME]: getEnvValue('canadian-dental-care-plan', process.env.OTEL_SERVICE_NAME),
    [ATTR_SERVICE_VERSION]: getEnvValue('0.0.0', process.env.OTEL_SERVICE_VERSION),
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: getEnvValue('localhost', process.env.OTEL_ENVIRONMENT),
  }),

  metricReader: new PeriodicExportingMetricReader({
    exporter: getMetricExporter(),
    exportIntervalMillis: Number(process.env.OTEL_METRICS_EXPORT_INTERVAL_MILLIS),
    exportTimeoutMillis: Number(process.env.OTEL_METRICS_EXPORT_TIMEOUT_MILLIS),
  }),
  traceExporter: getTraceExporter(),
}).start();

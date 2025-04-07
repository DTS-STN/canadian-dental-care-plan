import path from 'node:path';
import type * as w from 'winston';
import winston, { format } from 'winston';
import 'winston-daily-rotate-file';
import { fullFormat } from 'winston-error-format';

import type { LogLevel } from '~/.server/logging/log-levels';
import type { LoggingConfig } from '~/.server/logging/logging-config';
import { createConsoleTransport, createDailyRotateFileTransport } from '~/.server/logging/winston-transport-factory';

export type LevelsConfig = {
  levels: Record<LogLevel, number>;
  colors: Record<LogLevel, string>;
};

const levelsConfig = {
  levels: {
    audit: 0, // Highest priority - for security and compliance events
    error: 1, // Application errors requiring immediate attention
    warn: 2, // Warning conditions
    info: 3, // Informational messages highlighting application progress
    debug: 4, // Detailed debug information
    trace: 5, // Fine-grained debug information
  },
  colors: {
    audit: 'magenta',
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
    trace: 'dim',
  },
} as const satisfies LevelsConfig;

winston.addColors(levelsConfig.colors);

/**
 * Creates a configured Winston logger instance based on the provided environment settings.
 *
 * @param config - The logging environment configuration containing settings like log level
 *                and audit log parameters.
 * @returns A configured Winston logger instance.
 */
export function createWinstonInstance(config: LoggingConfig): w.Logger {
  // Validate that LOG_LEVEL is valid before creating the logger
  if (!levelsConfig.levels[config.LOG_LEVEL]) {
    throw new Error(`Invalid LOG_LEVEL: ${config.LOG_LEVEL}`);
  }

  // Create and configure the main logger instance
  const winstonInstance = winston.createLogger({
    level: config.LOG_LEVEL,
    levels: levelsConfig.levels,
    format: format.combine(
      format.timestamp(),
      format.splat(), // Enables string interpolation with %s, %d, etc.
      fullFormat(), // Enhanced error formatting from winston-error-format
    ),
    transports: [createConsoleTransport(levelsConfig)],
  });

  // Configure audit logging if enabled
  configureAuditLogging(winstonInstance, config);

  winstonInstance.info('Logger initialized with level "%s"', winstonInstance.level);
  return winstonInstance;
}

/**
 * Configures and adds audit logging if enabled in the configuration.
 *
 * @param logger - The Winston logger instance
 * @param config - The logging configuration
 */
function configureAuditLogging(logger: w.Logger, config: LoggingConfig): void {
  if (config.AUDIT_LOG_ENABLED) {
    const dailyRotateFileTransport = createDailyRotateFileTransport(config);
    logger.add(dailyRotateFileTransport);

    const logPath = path.join(dailyRotateFileTransport.dirname || '.', dailyRotateFileTransport.filename);
    logger.info(`Audit logging enabled. Writing logs to ${logPath}`);
  }
}

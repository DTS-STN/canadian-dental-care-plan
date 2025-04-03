import { isEmpty, omit } from 'moderndash';
import os from 'node:os';
import util from 'node:util';
import { LEVEL, MESSAGE, SPLAT } from 'triple-beam';
import type * as w from 'winston';
import winston, { format, transports } from 'winston';
import 'winston-daily-rotate-file';
import { fullFormat } from 'winston-error-format';

import type { LogLevel } from '~/.server/logging/log-levels';
import type { LoggingConfig } from '~/.server/logging/logging-config';

/**
 * Creates a configured Winston logger instance based on the provided environment settings.
 *
 * @param config - The logging environment configuration containing settings like log level
 *              and audit log parameters.
 * @returns A configured Winston logger instance.
 */
export function createWinstonInstance(config: LoggingConfig): w.Logger {
  // Define log levels with corresponding priorities (lower number = higher priority)
  const levels = {
    audit: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    trace: 5,
  } as const satisfies Record<LogLevel, number>;

  // Configure console transport with exception handling
  const consoleTransport = new transports.Console({
    handleExceptions: true, // Log uncaught exceptions
    handleRejections: true, // Log unhandled promise rejections
  });

  // Create and configure the main logger instance
  const winstonInstance = winston.createLogger({
    level: config.LOG_LEVEL,
    levels,
    format: format.combine(
      format.timestamp(),
      format.splat(), // Enables string interpolation with %s, %d, etc.
      fullFormat(), // Enhanced error formatting from winston-error-format
      format.printf((info) => consoleLogFormat(info)),
    ),
    transports: [consoleTransport],
  });

  // Add DailyRotateFile transport for audit logs if enabled in environment config
  if (config.AUDIT_LOG_ENABLED) {
    const dailyRotateFileTransport = new transports.DailyRotateFile({
      level: 'audit',
      dirname: config.AUDIT_LOG_DIRNAME,
      filename: config.AUDIT_LOG_FILENAME,
      format: format.printf((info) => `${info.message}`),
      extension: `_${os.hostname()}.log`,
      utc: true,
    });

    winstonInstance.add(dailyRotateFileTransport);
    winstonInstance.info(`Audit logging enabled. Writing logs to ${dailyRotateFileTransport.dirname}/${dailyRotateFileTransport.filename}`);
  }

  winstonInstance.info(`Logger initialized with level "${winstonInstance.level}"`);
  return winstonInstance;
}

/**
 * Formats a log label string to a fixed length.
 * If the label is longer than the specified size, it's truncated and prefixed with an ellipsis.
 *
 * @param label - The label string to format
 * @param size - The desired fixed width for the label
 * @returns The formatted label string with consistent width
 */
function formatLabel(label: string, size: number): string {
  const str = label.padStart(size);
  return str.length <= size ? str : `…${str.slice(-size + 1)}`;
}

/**
 * Custom Winston log formatter for console output.
 * Creates a readable, aligned format with timestamp, level, category, message,
 * and any additional metadata.
 *
 * Format: "[timestamp] [LEVEL] --- [category]: message --- {metadata}"
 *
 * @param info - The log information object provided by Winston
 * @returns The formatted log string
 */
function consoleLogFormat(info: w.Logform.TransformableInfo): string {
  const { label, level, message, timestamp, ...rest } = info;

  // Format the core log message with fixed-width fields for alignment
  let formattedInfo = `${timestamp} ${level.toUpperCase().padStart(7)} --- [${formatLabel(`${label ?? 'winston-factory'}`, 25)}]: ${message}`;

  // Append metadata if present, excluding Winston's internal properties
  if (!isEmpty(rest)) {
    const stripped = omit(rest, [LEVEL, MESSAGE, SPLAT]);
    formattedInfo += ` --- ${util.inspect(stripped, false, null, true)}`;
  }

  return formattedInfo;
}

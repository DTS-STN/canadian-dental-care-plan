import os from 'node:os';
import type * as w from 'winston';
import { format, transports } from 'winston';
import 'winston-daily-rotate-file';
import type DailyRotateFile from 'winston-daily-rotate-file';

import type { LoggingConfig } from '~/.server/logging/logging-config';
import type { LevelsConfig } from '~/.server/logging/winston-factory';
import { formatLabels, formatLevels, formatPrintf } from '~/.server/logging/winston-format';

/**
 * Creates and configures the console transport for Winston.
 *
 * @returns Configured console transport instance
 */
export function createConsoleTransport(levelsConfig: LevelsConfig): w.transports.ConsoleTransportInstance {
  return new transports.Console({
    handleExceptions: true, // Log uncaught exceptions
    handleRejections: true, // Log unhandled promise rejections
    format: format.combine(
      formatLevels(),
      formatLabels(),
      format.cli({
        all: false,
        message: false,
        level: true,
        ...levelsConfig,
      }), //
      formatPrintf(),
    ),
  });
}

/**
 * Creates and configures a daily rotating file transport for audit logs.
 *
 * @param config - The logging configuration
 * @returns Configured DailyRotateFile transport instance
 */
export function createDailyRotateFileTransport(config: LoggingConfig): DailyRotateFile {
  return new transports.DailyRotateFile({
    level: 'audit',
    dirname: config.AUDIT_LOG_DIRNAME,
    filename: config.AUDIT_LOG_FILENAME,
    format: format.printf((info) => `${info.message}`),
    extension: `_${os.hostname()}.log`,
    utc: true,
  });
}

import os from 'node:os';
import type { LeveledLogMethod, Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';
import { z } from 'zod';

// see https://github.com/winstonjs/winston?tab=readme-ov-file#using-custom-logging-levels
const logLevels = { audit: 0, error: 1, warn: 2, info: 3, debug: 4, trace: 5 } as const;

// prettier-ignore
const env = {
  logLevel: z.string().refine(((val: string) => Object.keys(logLevels).includes(val)), { message: 'Invalid log level' }).default('info').parse(process.env.LOG_LEVEL),
  auditLogEnabled: z.string().transform((val: string) => val === 'true').default('true').parse(process.env.AUDIT_LOG_ENABLED),
  auditLogDirname: z.string().trim().min(1, { message: 'Invalid audit log directory name' }).default('logs').parse(process.env.AUDIT_LOG_DIRNAME),
  auditLogFilename: z.string().trim().min(1, { message: 'Invalid audit log file name' }).default('audit').parse(process.env.AUDIT_LOG_FILENAME),
} as const;

/**
 * Formats a log category string to be a fixed length. When the category string
 * is longer than the specified size, it is truncated and prefixed by a
 * horizontal ellipsis (…).
 */
function formatCategory(category: string, size: number) {
  const str = category.padStart(size);
  return str.length <= size ? str : `…${str.slice(-size + 1)}`;
}

/**
 * Returns a logger for the specified logging category.
 */
export const getLogger = (category: string) => {
  const logger = createLogger({
    level: env.logLevel,
    levels: logLevels,
    format: format.combine(
      format.timestamp(),
      format.splat(),
      format.printf((info) => `${info.timestamp} ${info.level.toUpperCase().padStart(7)} --- [${formatCategory(category, 25)}]: ${info.stack ?? info.message}`),
    ),
    transports: [new transports.Console()],
  });

  //
  // Audit logs are persisted to disk to ensure that we
  // can retain a history record of important system events
  //
  if (env.auditLogEnabled) {
    logger.add(
      new transports.DailyRotateFile({
        level: 'audit',
        dirname: env.auditLogDirname,
        filename: env.auditLogFilename,
        format: format.printf((info) => info.message),
        extension: `_${os.hostname()}.log`,
        utc: true,
      }),
    );
  }

  // required so typescript knows about log.audit(..), log.trace(..), etc
  type LeveledLogMethods = { [level in keyof typeof logLevels]: LeveledLogMethod };

  return logger as Logger & LeveledLogMethods;
};

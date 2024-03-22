import { LeveledLogMethod, Logger, createLogger, format, transports } from 'winston';
import { z } from 'zod';

// see https://github.com/winstonjs/winston?tab=readme-ov-file#using-custom-logging-levels
const logLevels = { audit: 0, error: 1, warn: 2, info: 3, debug: 4, trace: 5 };

const isValidLogLevel = (val: string) => Object.keys(logLevels).includes(val);

const logLevel = z
  .string()
  .refine(isValidLogLevel, { message: 'Invalid log level', path: ['process.env.LOG_LEVEL'] })
  .default('info')
  .parse(process.env.LOG_LEVEL);

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
  // required so typescript knows about log.audit(..), log.trace(..), etc
  type CustomLogger = Logger & { [level in keyof typeof logLevels]: LeveledLogMethod };

  return createLogger({
    level: logLevel,
    levels: logLevels,
    format: format.combine(
      format.timestamp(),
      format.splat(),
      format.printf((info) => `${info.timestamp} ${info.level.toUpperCase().padStart(7)} --- [${formatCategory(category, 25)}]: ${info.stack ?? info.message}`),
    ),
    transports: [new transports.Console()],
  }) as CustomLogger;
};

import winston, { createLogger, format, transports } from 'winston';
import { z } from 'zod';

// ['error', 'warn', 'info', 'verbose', 'debug', 'silly']
const logLevels = Object.keys(winston.config.npm.levels);

const logLevel = z
  .string()
  .refine((val) => logLevels.includes(val), { message: 'Invalid log level', path: ['process.env.LOG_LEVEL'] })
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
  return createLogger({
    level: logLevel,
    format: format.combine(
      format.timestamp(),
      format.splat(),
      format.printf((info) => `${info.timestamp} ${info.level.toUpperCase().padStart(7)} --- [${formatCategory(category, 25)}]: ${info.stack ?? info.message}`),
    ),
    transports: [new transports.Console()],
  });
};

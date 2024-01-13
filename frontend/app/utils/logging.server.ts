import winston, { type Logger, createLogger, format, transports } from 'winston';
import { z } from 'zod';

// ['error', 'warn', 'info', 'verbose', 'debug', 'silly']
const logLevels = Object.keys(winston.config.npm.levels);

const logLevel = z
  .string()
  .refine((val) => logLevels.includes(val), { message: 'Invalid log level', path: ['process.env.LOG_LEVEL'] })
  .default('info')
  .parse(process.env.LOG_LEVEL);

function formatCategory(category: string, size: number) {
  const str = category.padStart(size);
  return str.length <= size ? str : `...${str.slice(-size + 3)}`;
}

export const getLogger = (category: string): Logger => {
  return createLogger({
    level: logLevel,
    format: format.combine(
      format.timestamp(),
      format.printf((info) => `${info.timestamp} ${info.level.toUpperCase().padStart(7)} --- [${formatCategory(category, 25)}]: ${info.message}`),
    ),
    transports: [new transports.Console()],
  });
};

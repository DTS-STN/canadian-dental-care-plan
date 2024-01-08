import { type Logger, createLogger, format, transports } from 'winston';

import { getEnv } from './environment.server';

export const getLogger = (category: string): Logger =>
  createLogger({
    level: getEnv('LOG_LEVEL') ?? 'info',
    format: format.combine(
      format.align(),
      format.timestamp(),
      format.printf((info) => `${info.timestamp}  ${info.level.toUpperCase()} --- [${category}]: ${info.message}`),
    ),
    transports: [new transports.Console()],
  });

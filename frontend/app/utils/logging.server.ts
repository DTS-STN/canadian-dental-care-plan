import { type Logger, createLogger, format, transports } from 'winston';

import { getEnv } from './env.server';

export const getLogger = (category: string): Logger => {
  const { LOG_LEVEL } = getEnv();

  return createLogger({
    level: LOG_LEVEL,
    format: format.combine(
      format.align(),
      format.timestamp(),
      format.printf((info) => `${info.timestamp}  ${info.level.toUpperCase()} --- [${category}]: ${info.message}`),
    ),
    transports: [new transports.Console()],
  });
};

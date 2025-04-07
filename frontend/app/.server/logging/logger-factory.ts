import invariant from 'tiny-invariant';
import type winston from 'winston';

import { singleton } from '../utils/instance-registry';
import { getLoggingConfig } from './logging-config';
import { createWinstonInstance } from './winston-factory';

import type { Logger } from '~/.server/logging/logger';
import { DefaultLogger } from '~/.server/logging/logger-default';

/**
 * Creates a contextual logger instance with the specified label.
 *
 * This function provides a standardized logging interface throughout the application,
 * ensuring consistent log format and behavior. It leverages a singleton Winston instance
 * under the hood for performance and resource efficiency.
 *
 * @remarks
 * The logger attaches the provided label to all log messages, making it easier to
 * identify the source of logs in a complex system. The underlying Winston instance
 * is shared across all loggers for efficiency.
 *
 * If the Winston instance initialization fails, the error will propagate from the
 * underlying factory functions. Callers should be prepared to handle these potential errors.
 *
 * @example
 * ```typescript
 * // In database service
 * const logger = createLogger('Database');
 * logger.info('Connection established');
 *
 * // In auth service
 * const logger = createLogger('AuthService');
 * logger.error('Authentication failed', { userId: '123', reason: 'invalid_token' });
 * ```
 *
 * @param label - A string identifying the logging context (e.g., 'Database', 'AuthService')
 * @throws {Error} If the label is empty, invalid, or contains only whitespace
 * @returns A configured logger instance that prefixes all logs with the given label
 */
export function createLogger(label: string): Logger {
  // Validate the label is non-empty
  invariant(typeof label === 'string' && label.trim().length > 0, 'Logger label must be a non-empty string and cannot be just whitespace.');

  // Get or create the singleton Winston logger instance
  // This ensures we only create one logger for the entire application
  const winstonLogger = singleton<winston.Logger>('winstonLogger', () => {
    const config = getLoggingConfig();
    const logger = createWinstonInstance(config);
    logger.info('Winston Logger Singleton Initialized 🚀');
    return logger;
  });

  // Create and return a new logger with the specified context
  return new DefaultLogger(winstonLogger, label.trim());
}

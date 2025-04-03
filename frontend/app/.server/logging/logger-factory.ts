import type * as w from 'winston';

import { createWinstonInstance } from './winston-factory';

import type { Logger } from '~/.server/logging/logger';
import { getLoggingConfig } from '~/.server/logging/logging-config';
import { WinstonLogger } from '~/.server/logging/winston-logger';

/**
 * Singleton Winston instance used across the application.
 * Lazily initialized on first access via getWinstonInstance().
 */
let singletonWinstonInstance: w.Logger | undefined = undefined;

/**
 * Creates and/or retrieves the singleton Winston logger instance.
 * This function initializes the logger on its first call based on environment settings.
 * Subsequent calls return the existing instance.
 *
 * @returns The configured Winston logger instance.
 */
function getWinstonInstance(): w.Logger {
  if (!singletonWinstonInstance) {
    const config = getLoggingConfig();
    singletonWinstonInstance = createWinstonInstance(config);
  }
  return singletonWinstonInstance;
}

/**
 * Creates a logger instance for the specified category.
 *
 * Each call returns a new wrapper instance (`WinstonLogger`) configured with the
 * provided category. These wrappers delegate logging calls to the shared,
 * underlying Winston logger instance.
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
 * @param category - A string identifying the logging context (e.g., 'Database', 'AuthService').
 *                   This category will be included in the log metadata.
 * @returns A logger instance configured for the specified category.
 * @throws {Error} If category is empty or not provided.
 */
export function createLogger(category: string): Logger {
  if (!category || category.trim() === '') {
    throw new Error('Logger category must be provided');
  }

  return new WinstonLogger(getWinstonInstance(), category);
}

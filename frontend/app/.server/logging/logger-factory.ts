import invariant from 'tiny-invariant';

import type { Logger } from '~/.server/logging/logger';
import { DefaultLogger } from '~/.server/logging/logger-default';
import { getWinstonLoggerSingleton } from '~/.server/logging/winston-logger-singleton';

/**
 * Creates a logger instance for the specified label. The label identifies the context
 * of the logging (e.g., which service or module the logs are coming from). This function
 * ensures that the label is non-empty and valid before returning a logger instance.
 *
 * The logger returned by this function will prefix logs with the provided label and
 * can be used for structured logging in the context of services like 'Database', 'AuthService', etc.
 *
 * The logger instance will be configured using a default Winston Logger instance obtained from
 * `getWinstonInstance()`. The logger will use this Winston Logger instance to log messages
 * with the provided context (label).
 *
 * @example
 * // In database service
 * const logger = createLogger('Database');
 * logger.info('Connection established');
 *
 * // In auth service
 * const logger = createLogger('AuthService');
 * logger.error('Authentication failed', { userId: '123', reason: 'invalid_token' });
 *
 * @param label - A string identifying the logging context (e.g., 'Database', 'AuthService').
 *                The label is used to contextualize logs and should not be empty or whitespace-only.
 *
 * @throws {Error} If the label is empty, invalid, or only whitespace.
 *
 * @returns A logger instance (configured with the given label) for use in logging.
 */
export function createLogger(label: string): Logger {
  // Ensure the label is a valid non-empty string
  invariant(typeof label === 'string' && label.trim().length > 0, 'Logger label must be a non-empty string and cannot be just whitespace.');

  // Return the logger instance configured with the label using the default Winston Logger instance
  return new DefaultLogger(getWinstonLoggerSingleton(), label);
}

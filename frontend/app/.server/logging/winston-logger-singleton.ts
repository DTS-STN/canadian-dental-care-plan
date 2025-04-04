import type { Logger } from 'winston';

import { getLoggingConfig } from '~/.server/logging/logging-config';
import { createWinstonInstance } from '~/.server/logging/winston-factory';

/**
 * Singleton Winston logger instance used across the application.
 * Lazily initialized on first access via getWinstonLoggerSingleton().
 */
let winstonLoggerSingleton: Logger | null = null;

/**
 * Creates and/or retrieves the singleton Winston logger instance.
 * This function initializes the logger on its first call based on environment settings.
 * Subsequent calls return the existing instance.
 *
 * @returns The configured Winston logger instance.
 */
export function getWinstonLoggerSingleton(): Logger {
  if (winstonLoggerSingleton === null) {
    const config = getLoggingConfig();
    winstonLoggerSingleton = createWinstonInstance(config);
    winstonLoggerSingleton.info('Winston Logger Singleton Initialized 🚀');
  }
  return winstonLoggerSingleton;
}

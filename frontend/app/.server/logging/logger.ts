import type winston from 'winston';

/**
 * Defines the standard logging methods.
 * Allows logging messages at various severity levels.
 * Supports optional metadata for structured logging.
 */
export interface Logger {
  /**
   * Logs a message at the 'audit' level. Typically used for audit trails.
   * @param message - The primary log message.
   * @param meta - Optional additional data (e.g., user ID, action).
   */
  audit(message: string, ...meta: unknown[]): void;

  /**
   * Logs a message at the 'error' level. Typically used for critical failures.
   * @param message - The primary log message.
   * @param meta - Optional additional data (e.g., error object, context).
   */
  error(message: string, ...meta: unknown[]): void;

  /**
   * Logs a message at the 'warn' level. Typically used for potential issues.
   * @param message - The primary log message.
   * @param meta - Optional additional data.
   */
  warn(message: string, ...meta: unknown[]): void;

  /**
   * Logs a message at the 'info' level. Typically used for informational messages.
   * @param message - The primary log message.
   * @param meta - Optional additional data.
   */
  info(message: string, ...meta: unknown[]): void;

  /**
   * Logs a message at the 'debug' level. Typically used for development/debugging.
   * @param message - The primary log message.
   * @param meta - Optional additional data.
   */
  debug(message: string, ...meta: unknown[]): void;

  /**
   * Logs a message at the 'trace' level. Typically used for detailed tracing.
   * @param message - The primary log message.
   * @param meta - Optional additional data.
   */
  trace(message: string, ...meta: unknown[]): void;
}

/**
 * Implements the ILogger interface using the Winston logging library.
 */
export class WinstonLogger implements Logger {
  private readonly logger: winston.Logger;
  private readonly category: string;

  /**
   * Creates an instance of WinstonLogger.
   * @param winstonInstance - A pre-configured Winston Logger instance.
   * @param category - The category or context for the logger (e.g., 'auth', 'db').
   */
  constructor(winstonInstance: winston.Logger, category: string) {
    this.logger = winstonInstance;
    this.category = category;
  }

  audit(message: string, ...meta: unknown[]): void {
    this.log('audit', message, ...meta);
  }

  error(message: string, ...meta: unknown[]): void {
    this.log('error', message, ...meta);
  }

  warn(message: string, ...meta: unknown[]): void {
    this.log('warn', message, ...meta);
  }

  info(message: string, ...meta: unknown[]): void {
    this.log('info', message, ...meta);
  }

  debug(message: string, ...meta: unknown[]): void {
    this.log('debug', message, ...meta);
  }

  trace(message: string, ...meta: unknown[]): void {
    this.log('trace', message, ...meta);
  }

  private log(level: string, message: string, ...meta: unknown[]) {
    this.logger.log(level, message, { label: this.category }, ...meta);
  }
}

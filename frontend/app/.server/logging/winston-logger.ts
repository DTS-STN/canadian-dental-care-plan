import type winston from 'winston';

import type { LogLevel } from './log-levels';

import type { Logger } from '~/.server/logging/logger';

/**
 * Implements the Logger interface using the Winston logging library.
 */
export class WinstonLogger implements Logger {
  private readonly logger: winston.Logger;

  /**
   * Creates an instance of WinstonLogger.
   * @param winstonInstance - A pre-configured Winston Logger instance.
   * @param category - The category or context for the logger (e.g., 'auth', 'db').
   */
  constructor(winstonInstance: winston.Logger, category: string) {
    this.logger = winstonInstance.child({
      label: category,
    });
  }

  audit(message: unknown): void;
  audit(message: string, ...meta: unknown[]): void {
    this.log('audit', message, meta);
  }

  debug(message: unknown): void;
  debug(message: string, ...meta: unknown[]): void {
    this.log('debug', message, meta);
  }

  error(message: unknown): void;
  error(message: string, ...meta: unknown[]): void {
    this.log('error', message, meta);
  }

  info(message: unknown): void;
  info(message: string, ...meta: unknown[]): void {
    this.log('info', message, meta);
  }

  trace(message: unknown): void;
  trace(message: string, ...meta: unknown[]): void {
    this.log('trace', message, meta);
  }

  warn(message: unknown): void;
  warn(message: string, ...meta: unknown[]): void {
    this.log('warn', message, meta);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private log(level: LogLevel, message: any, meta: unknown[]) {
    this.logger.log(level, message, ...meta);
  }
}

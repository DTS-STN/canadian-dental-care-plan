/**
 * Defines the standard logging methods.
 * Allows logging messages at various severity levels.
 * Supports optional metadata for structured logging.
 */
export interface Logger {
  audit: LeveledLogMethod;
  debug: LeveledLogMethod;
  error: LeveledLogMethod;
  info: LeveledLogMethod;
  trace: LeveledLogMethod;
  warn: LeveledLogMethod;
}

interface LeveledLogMethod {
  (message: string, ...meta: unknown[]): void;
  (message: unknown): void;
}

/**
 * Available log levels in order of increasing verbosity.
 * Each level includes messages from all levels above it, meaning:
 * - 'audit' includes 'error', 'warn', 'info', 'debug', and 'trace'
 * - 'error' includes 'warn', 'info', 'debug', and 'trace'
 * - 'warn' includes 'info', 'debug', and 'trace', etc.
 */
export const logLevels = [
  'audit', // Critical system events requiring persistence
  'error', // Runtime errors that may require immediate attention
  'warn', // Warnings, potential issues that don't stop execution
  'info', // General operational information about system status
  'debug', // Detailed information useful during development and debugging
  'trace', // Highly detailed tracing information, potentially performance-impacting
] as const;

/**
 * Type representing the tuple of available log levels.
 * This type is useful for ensuring type safety when working with the log level array.
 */
export type LogLevels = typeof logLevels;

/**
 * Type representing a valid log level string.
 * This type is a union of all possible log levels.
 */
export type LogLevel = LogLevels[number];

/**
 * Maximum length of log level names, used for padding log output for alignment.
 * This ensures that log entries with different log levels align neatly when output.
 */
export const maxLogLevelNameLength = Math.max(...logLevels.map((level) => level.length));

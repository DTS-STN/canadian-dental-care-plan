/**
 * Available log levels in order of increasing verbosity.
 * Each level includes messages from all levels above it.
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
 */
export type LogLevels = typeof logLevels;

/**
 * Type representing a valid log level string.
 */
export type LogLevel = LogLevels[number];

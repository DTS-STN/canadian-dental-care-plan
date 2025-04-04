import { z } from 'zod';

import { logLevels } from '~/.server/logging/log-levels';
import type { LogLevel } from '~/.server/logging/log-levels';

/**
 * Type definition for all logging configuration parameters.
 */
export type LoggingConfig = {
  /** The minimum log level to output (audit, error, warn, info, debug, trace) */
  LOG_LEVEL: LogLevel;

  /** Whether to enable separate audit logging */
  AUDIT_LOG_ENABLED: boolean;

  /** Directory where audit logs will be stored */
  AUDIT_LOG_DIRNAME: string;

  /** Filename pattern for audit logs (%DATE% will be replaced with the date) */
  AUDIT_LOG_FILENAME: string;
};

/**
 * Default configuration values used when specific settings are not provided.
 * LOG_LEVEL defaults based on the environment:
 * - 'info' in production
 * - 'debug' in other environments (e.g., development)
 */
export const defaultsConfig = {
  LOG_LEVEL: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  AUDIT_LOG_ENABLED: true,
  AUDIT_LOG_DIRNAME: 'logs',
  AUDIT_LOG_FILENAME: 'audit-%DATE%',
} as const satisfies LoggingConfig;

/**
 * Zod schema for validating and parsing logging-related environment variables.
 * This schema:
 *  - Validates the input against predefined constraints
 *  - Transforms string inputs to appropriate types
 *  - Falls back to default values when validation fails
 */
const loggingConfigSchema = z.object({
  LOG_LEVEL: z
    .enum(logLevels) // Ensures the log level is one of the predefined levels
    .catch(defaultsConfig.LOG_LEVEL),

  AUDIT_LOG_ENABLED: z
    .string() // Validates AUDIT_LOG_ENABLED as a string
    .transform((val) => val.toLowerCase() === 'true') // Converts to boolean
    .catch(defaultsConfig.AUDIT_LOG_ENABLED),

  AUDIT_LOG_DIRNAME: z
    .string() //
    .trim()
    .min(1, 'Audit log directory name cannot be empty.')
    .catch(defaultsConfig.AUDIT_LOG_DIRNAME),

  AUDIT_LOG_FILENAME: z
    .string() //
    .trim()
    .min(1, 'Audit log file name pattern cannot be empty.')
    .catch(defaultsConfig.AUDIT_LOG_FILENAME),
});

/**
 * Retrieves and validates logging configuration from environment variables.
 * This function parses environment variables according to the defined schema,
 * applies validation rules, and returns a fully validated configuration object.
 * If environment variables are missing or invalid, it falls back to default values.
 *
 * @returns The validated logging configuration.
 */
export function getLoggingConfig(): LoggingConfig {
  return loggingConfigSchema.parse(process.env);
}

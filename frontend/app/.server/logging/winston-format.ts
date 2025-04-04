import { isEmpty, omit } from 'moderndash';
import { inspect } from 'node:util';
import { LEVEL, MESSAGE, SPLAT } from 'triple-beam';
import { format } from 'winston';
import type { Logform } from 'winston';

import { maxLogLevelNameLength } from '~/.server/logging/log-levels';

type FormatLevelsOptions = {
  /**
   * Custom padding length (defaults to maxLogLevelNameLength)
   */
  padMaxLength?: number;
};

/**
 * Winston format that uppercases and pads the log level for alignment.
 *
 * Transforms `info.level` to uppercase and pads it to a fixed width
 * defined by `padMaxLength` (or `maxLogLevelNameLength` fallback).
 * This ensures consistent visual alignment of log output regardless of level name length.
 *
 * @param options - Configuration options
 * @returns A Winston formatter that modifies the log level
 */
export function formatLevels(options?: FormatLevelsOptions): Logform.Format {
  const { padMaxLength = maxLogLevelNameLength } = options ?? {};

  return format((info) => {
    const level = info.level.toUpperCase().padStart(padMaxLength);
    // Assign formatted level
    info.level = level;
    return info;
  })();
}

type FormatLabelsOptions = {
  /**
   * The default value used when `info.label` is missing (default: 'unlabeled')
   */
  fallback?: string;

  /**
   * The maximum allowed length for the label before truncation (default: 25)
   */
  maxLength?: number;
};

/**
 * Winston format that standardizes labels for consistent display in log output.
 *
 * Processes the `info.label` field to ensure the following:
 * 1. Uses a default value (`fallback`) if the label is missing.
 * 2. Truncates the label with an ellipsis (`…`) if it exceeds `maxLength`,
 *    preserving the last `maxLength - 1` characters to fit the ellipsis.
 * 3. Applies left-padding to align shorter labels to the specified `maxLength`.
 * 4. Wraps the final label in square brackets for visibility and consistency.
 *
 * @param options - Configuration options for label formatting:
 * @returns A Winston formatter that formats the `info.label` field according to the specified options.
 */
export function formatLabels(options?: FormatLabelsOptions): Logform.Format {
  const { fallback = 'unlabeled', maxLength = 25 } = options ?? {};

  return format((info) => {
    const rawLabel = String(info.label ?? fallback);

    // Format label with truncation and padding
    // prettier-ignore
    const paddedOrTruncated = rawLabel.length > maxLength
      ? '…' + rawLabel.slice(rawLabel.length - (maxLength - 1)) // Leave space for ellipsis
      : rawLabel.padStart(maxLength);

    // Apply the formatted label
    info.label = `[${paddedOrTruncated}]`;
    return info;
  })();
}

/**
 * Formats Winston logs into a structured, human-readable console output.
 *
 * Creates a consistent output format with timestamp, level, label, message,
 * and any additional metadata. The output is visually aligned for improved readability,
 * with metadata displayed using Node.js's `util.inspect` when present.
 *
 * Output format:
 *   "timestamp LEVEL --- [label]: message --- {metadata}"
 *
 * @returns A Winston formatter using printf for log message formatting
 */
export function formatPrintf(): Logform.Format {
  return format.printf((info) => {
    const { label, level, message, timestamp, ...rest } = info;

    let msg = `${timestamp} ${level} --- ${label}: ${message}`;

    // Append metadata if present, excluding Winston's internal properties
    if (!isEmpty(rest)) {
      const stripped = omit(rest, [LEVEL, MESSAGE, SPLAT]);

      // Only append metadata if there are still properties after stripped internals
      if (!isEmpty(stripped)) {
        msg += ` --- ${inspect(stripped, false, 4, true)}`;
      }
    }

    return msg;
  });
}

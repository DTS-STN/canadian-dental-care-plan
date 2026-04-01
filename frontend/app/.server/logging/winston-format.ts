import { isEmpty, omit } from 'moderndash';
import { inspect } from 'node:util';
import { LEVEL, MESSAGE, SPLAT } from 'triple-beam';
import { format } from 'winston';
import type { Logform } from 'winston';

import { maxLogLevelNameLength } from '~/.server/logging/log-levels';
import { isValidSin } from '~/utils/sin-utils';

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

/**
 * Matches Canadian SIN patterns in any formatting:
 *   - 9 consecutive digits: 123456789
 *   - space-separated:      123 456 789
 *   - hyphen-separated:     123-456-789
 *
 * Negative digit lookahead/lookbehind ensures sequences longer than 9 digits
 * (e.g. 123456789009890) are never matched.
 *
 * Only the last 3 digits are preserved: ***-***-789
 */
const SIN_PATTERN = /(?<!["\d])("?)(\d{3}[\s-]?\d{3}[\s-]?(\d{3}))\1(?!["\d])/g;

/**
 * Winston format transform that masks SIN values in log messages after splat
 * interpolation has already expanded all %s/%j tokens into the message string.
 * This provides a safety net so that SINs are never emitted to any transport,
 * regardless of how individual log call sites are written.
 *
 * Candidate matches are verified with `isValidSin` (Luhn checksum + format rules)
 * to avoid masking legitimate 9-digit reference codes and option-set IDs.
 *
 * The replacement is always emitted as a quoted string (e.g. `"***-***-782"`) because
 * the masked value is not a valid number type. Surrounding quotes from the original match
 * are consumed by the regex so that a string SIN (`"123456782"`) is never double-quoted.
 */
export const formatSensitiveData = format((info) => {
  if (typeof info.message === 'string') {
    info.message = info.message.replaceAll(SIN_PATTERN, (_match, _quote, sin, last3: string) => {
      return isValidSin(sin) ? `"***-***-${last3}"` : _match;
    });
  }
  return info;
});

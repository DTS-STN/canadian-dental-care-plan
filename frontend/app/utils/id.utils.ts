import { customAlphabet, urlAlphabet } from 'nanoid';
import { z } from 'zod';

/**
 * The fixed length for generated Nano IDs.
 * Ensure the generator and validator configurations remain synchronized with this value.
 */
const NANO_ID_LENGTH = 10;

/**
 * Configure the Nano ID generator with the standard URL-safe alphabet.
 * Using a custom alphabet allows for consistent ID behavior.
 */
const generateNanoIdInternal = customAlphabet(urlAlphabet, NANO_ID_LENGTH);

/**
 * Zod schema for validating the structure of a Nano ID.
 * Enforces length and character set (alphanumeric plus hyphens and underscores).
 */
const nanoidSchema = z
  .string()
  .length(NANO_ID_LENGTH)
  .regex(/^[a-zA-Z0-9_-]+$/);

/**
 * Generates a unique identifier string.
 *
 * Defaults to 'nanoid' format, but can generate standard UUID v4 strings if requested.
 *
 * @param format - The format of the ID to generate ('nanoid' or 'uuid'). Defaults to 'nanoid'.
 * @returns A unique ID string in the requested format.
 *
 * @example
 * // Generate a Nano ID (default)
 * const id = generateId(); // e.g. "V1StGXR8_Z"
 *
 * @example
 * // Generate a UUID
 * const uuid = generateId('uuid'); // e.g. "550e8400-e29b-41d4-a716-446655440000"
 */
export function generateId(format: 'nanoid' | 'uuid' = 'nanoid'): string {
  if (format === 'uuid') {
    return crypto.randomUUID();
  }
  return generateNanoIdInternal();
}

/**
 * Validates if the provided string matches the expected ID format.
 *
 * If `format` is specified, strictly validates against that format.
 * If `format` is omitted, returns true if the string matches *either* format.
 *
 * @param id - The identifier string to validate.
 * @param format - (Optional) The specific format to validate against.
 * @returns `true` if the ID is valid for the specified (or implied) format; `false` otherwise.
 *
 * @example
 * isValidId('V1StGXR8_Z', 'nanoid'); // true
 * isValidId('invalid-id', 'uuid'); // false
 * isValidId('550e8400-e29b-41d4-a716-446655440000'); // true (valid UUID)
 */
export function isValidId(id: string, format?: 'nanoid' | 'uuid'): boolean {
  if (format === 'uuid') {
    return z.uuid().safeParse(id).success;
  }

  if (format === 'nanoid') {
    return nanoidSchema.safeParse(id).success;
  }

  // If no specific format is requested, check if it matches any known format
  const isUuid = z.uuid().safeParse(id).success;
  const isNanoid = nanoidSchema.safeParse(id).success;

  return isUuid || isNanoid;
}

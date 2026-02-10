import { customAlphabet, urlAlphabet } from 'nanoid';
import { z } from 'zod';

/**
 * Length of generated IDs. Keep generator and validator in sync with this value.
 */
export const ID_LENGTH = 10;

/**
 * Internal ID generator implementation using nanoid.
 * This can be swapped out for a different library without affecting consumers.
 */
const nanoid = customAlphabet(urlAlphabet, ID_LENGTH);

/**
 * Schema for validating generated IDs.
 */
const idSchema = z
  .string()
  .length(ID_LENGTH)
  .regex(/^[a-zA-Z0-9_-]+$/);

/**
 * Generates a unique string ID.
 *
 * @returns A unique string identifier.
 */
export function generateId(): string {
  return nanoid();
}

/**
 * Validates whether a given string is a valid ID.
 *
 * @param id - The string to validate.
 * @returns `true` if the string is a valid ID, `false` otherwise.
 */
export function isValidId(id: string): boolean {
  return idSchema.safeParse(id).success;
}

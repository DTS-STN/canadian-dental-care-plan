/**
 * Expand the given string template using the provided variables.
 * A string template uses handlebar notation to denote placeholders. For example:
 *
 * expandTemplate('{greeting}, {subject}!', { greeting: 'Hello', subject: 'world' }) → 'Hello, world!
 */
export function expandTemplate(template: string, variables: Record<string, string>) {
  return Object.entries(variables).reduce((t, [key, value]) => t.replace(`{${key}}`, value), template);
}

/**
 * Generate a random string using only hex characters.
 */
export function randomHexString(len: number) {
  return randomString(len, '0123456789abcdef');
}

/**
 * Generate a random string using the provided characters, or alphanumeric characters if none are provided.
 */
export function randomString(len: number, allowedChars = '0123456789abcdefghijklmnopqrstuvwxyz') {
  const toRandomChar = () => allowedChars[Math.floor(Math.random() * allowedChars.length)];
  return Array(len).fill(undefined).map(toRandomChar).join('');
}

/**
 * Pads a number with zeros to the left to reach the specified length.
 * If the value is not a number or its length is greater than or equal to maxLength, it returns the value as a string.
 * @param value - The number to pad.
 * @param maxLength - The maximum length of the resulting string.
 * @returns The padded string or the value as a string if it's not a number or its length is already greater than or equal to maxLength.
 */
export const padWithZero = (value: number, maxLength: number) => {
  if (Number.isNaN(value)) return value.toString();
  if (value.toString().length >= maxLength) return value.toString();
  return value.toString().padStart(maxLength, '0');
};

export const invalidInputCharactersRegex = /[^a-zA-Z0-9(),\-.'\u2019\s\u00a0ÀÁÂÄÇÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜÝàáâäçèéêëìíîïòóôöùúûüýÿ]/g;

/**
 * Checks if the input string contains only valid characters.
 *
 * @param value - The input string to be checked.
 * @returns - Returns true if the input contains only valid characters, otherwise false.
 */
export function isAllValidInputCharacters(value: string) {
  const hasInvalidCharacters = invalidInputCharactersRegex.test(value);
  return !hasInvalidCharacters;
}

/**
 * Removes invalid characters from the input string based on a predefined regular expression.
 *
 * @param value - The input string to be filtered.
 * @returns - The filtered string with invalid characters removed.
 */
export function removeInvalidInputCharacters(value: string) {
  return value.replace(invalidInputCharactersRegex, '');
}

/**
 * Normalizes hyphens in the input string by replacing sequences of two or more hyphens with a single hyphen.
 *
 * @param str - The input string to normalize.
 * @returns - The normalized string with sequences of hyphens replaced by a single hyphen.
 */
export function normalizeHyphens(str: string) {
  return str.replace(/-{2,}/g, '-');
}

/**
 * @param value - The whole number percentage (i.e. multiplied by 100) to be formatted
 * @param locale - The Canadian locale to be used for formatting
 * @returns - The number formatted as a percentage in the givenlocale
 */
export function formatPercent(value: number, locale: string) {
  if (!/en|fr/i.test(locale)) throw new Error(`locale must be 'en' or 'fr'`);
  return Intl.NumberFormat(`${locale}-CA`, { style: 'percent' }).format(value / 100);
}

/**
 *
 * @param input - A string
 * @returns The given string with removed spaces
 */
export function extractDigits(input: string) {
  return input.replace(/\D/g, '');
}

/**
 * Normalizes spaces in a string by replacing all whitespace characters
 * (including non-breaking spaces) with regular spaces.
 *
 * @param str - The string to normalize.
 * @returns The normalized string with all spaces replaced by regular spaces.
 */
export function normalizeSpaces(str: string) {
  return str.replace(/[\s\u00a0]/g, ' ');
}

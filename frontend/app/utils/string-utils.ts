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

/**
 *
 * @param input - The string value of the input field to be validated
 * @returns Boolean indicating whether the input contains all valid characters
 */
export function isAllValidInputCharacters(input: string): boolean {
  const validCharactersRegex = /^[a-zA-Z0-9'(),\-.ÀÁÂÄÇÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜÝàáâäçèéêëìíîïòóôöùúûüýÿ\u00a0 ]+$/;
  return validCharactersRegex.test(input);
}

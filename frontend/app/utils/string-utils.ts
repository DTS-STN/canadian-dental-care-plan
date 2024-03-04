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

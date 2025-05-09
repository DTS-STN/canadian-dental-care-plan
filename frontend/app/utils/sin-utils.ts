/**
 * Regular expression to validate Canadian SIN (Social Insurance Number) format.
 *
 * The SIN must follow the format XXXXXXXXX or XXX XXX XXX or XXX-XXX-XXX.
 * The SIN number cannot consist entirely of zeros (e.g., 000000000 or 000 000 000 or 000-000-000 is not valid).
 *
 * Note: This regular expression only validates the format of the SIN.
 * Consumers must validate the SIN against the Luhn algorithm separately.
 *
 * Examples of valid SIN formats:
 * - 123-456-789
 * - 123 456 789
 * - 123456789
 * - 000-000-010
 *
 * Examples of invalid SIN formats:
 * - 000-000-000
 * - 000000000
 * - 123-45-6789
 * - ABC-DEF-GHI
 */
const sinFormatRegex = /^(?!0{3}[ -]?0{3}[ -]?0{3})\d{3}[ -]?\d{3}[ -]?\d{3}$/;

/**
 * This pattern is intended for use with the `format` property of the `InputPatternField` component.
 *
 * Example:
 * ```typescript
 * // Usage with InputPatternField
 * <InputPatternField format={sinInputPatternFormat} />
 * ```
 */
export const sinInputPatternFormat = '### ### ###';

/**
 *
 * @param sin - the Social Insurance Number (SIN)
 * @returns a boolean indicating if a SIN is valid using Luhn's Algorithm
 *
 * Luhn's Alogrithm (also known as "mod 10")
 * Social Insurance Numbers can be validated through a simple check digit process called the Luhn algorithm.
 * 046 454 286 <--- A fictitious, but valid, SIN.
 * 121 212 121 <--- Multiply every second digit by 2.
 * The result of the multiplication is:
 * 0 8 6 8 5 8 2 16 6
 * Then, add all of the digits together (note that 16 is 1+6):
 * 0 + 8 + 6 + 8 + 5 + 8 + 2 + 1+6 + 6 = 50
 * If the SIN is valid, this number will be evenly divisible by 10.
 *
 */
export function isValidSin(sin: string): boolean {
  if (!sinFormatRegex.test(sin)) return false;
  const multDigitString = [...sin.replaceAll(/\D/g, '')].map((digit, index) => Number(digit) * (index % 2 === 0 ? 1 : 2)).join('');
  const digitSum = [...multDigitString].reduce((acc, cur) => acc + Number(cur), 0);
  return digitSum % 10 === 0;
}

/**
 *
 * @param sin - the Social Insurance Number (SIN)
 * @returns a formatted SIN using a supplied separator
 */
export function formatSin(sin: string, separator = ' '): string {
  if (!isValidSin(sin)) throw new Error('Invalid SIN format');
  return (sin.replaceAll(/\D/g, '').match(/.../g) ?? []).join(separator);
}

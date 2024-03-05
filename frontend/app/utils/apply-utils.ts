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
  if (!/^\d{9}$/.test(sin)) return false;
  const multDigitString = [...sin].map((digit, index) => Number(digit) * (index % 2 === 0 ? 1 : 2)).join('');
  const digitSum = [...multDigitString].reduce((acc, cur) => acc + Number(cur), 0);
  return digitSum % 10 === 0;
}

/**
 *
 * @param firstDate - the first date to compute difference
 * @param secondDate - the second date to compute difference
 * @returns the differenece in years between two dates
 *
 * DOB utility function to compute the differenece in years between two dates
 *
 */
export function yearsBetween(firstDate: Date, secondDate: Date): number {
  const diffYear = firstDate.getFullYear() - secondDate.getFullYear();
  const diffMonth = firstDate.getMonth() - secondDate.getMonth();
  const diffDay = firstDate.getDate() - secondDate.getDate();
  return diffYear > 0 ? (diffMonth >= 0 && diffDay >= 0 ? diffYear : diffYear - 1) : diffMonth <= 0 && diffDay <= 0 ? Math.abs(diffYear) : Math.abs(diffYear) - 1;
}

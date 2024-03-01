/**
 *
 * @param sin - the Social Insurance Number
 * @returns a boolean using Luhn's Algorithm
 */
export function isValidSin(sin: string): boolean {
  if (sin.length !== 9) return false;
  return (
    (
      [...sin]
        .map((digit, index) => Number(digit) * (index & 1 ? 2 : 1))
        .join('')
        .match(/\d/g) ?? []
    ).reduce((acc, cur) => acc + Number(cur), 0) %
      10 ===
    0
  );
}

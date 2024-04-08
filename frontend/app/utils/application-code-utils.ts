/**
 *
 * @param applicationCode - the application code / client number / confirmation number
 * @returns - a boolean value indicating if the application code has the correct format
 * application code: 6 digits
 * client number: 11 digits
 * confirmation number: 13 digits
 */
export function isValidApplicationCode(applicationCode: string): boolean {
  const applicationCodeRegex = /^(?:\d{13}|\d{11}|\d{6})$/;
  return applicationCodeRegex.test(applicationCode);
}

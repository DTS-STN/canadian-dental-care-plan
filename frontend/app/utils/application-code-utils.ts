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

/**
 *
 * @param applicationCode the 13 digit application code returned from PP after an applicant submits their application
 * @returns submission code in the format of XXX XXX XXX XXXX if it is valid otherwise the input
 */
export function formatSubmissionApplicationCode(applicationCode: string): string {
  const strippedCode = applicationCode.replace(/ /g, '');
  if (!/^\d{13}$/.test(strippedCode)) return applicationCode;
  return (strippedCode.match(/....$|.../g) ?? []).join(' ');
}

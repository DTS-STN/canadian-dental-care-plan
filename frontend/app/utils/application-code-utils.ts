export const applicationCodeInputPatternFormat = '### ### ### ####';
export const renewalCodeInputPatternFormat = '### ### ### ##';

const applicationCodeFormatRegex = /^\d{3}[ ]?\d{3}$/;
const clientNumberFormatRegex = /^\d{3}[ ]?\d{3}[ ]?\d{3}[ ]?\d{2}$/;
const confirmationNumberFormatRegex = /^\d{3}[ ]?\d{3}[ ]?\d{3}[ ]?\d{4}$/;

/**
 * @param value - the application code
 * @returns - a boolean value indicating if the application code has the correct format
 *
 * application code: 6 digits
 */
function isValidApplicationCode(value: string) {
  return applicationCodeFormatRegex.test(value);
}

/**
 * @param value - client number
 * @returns - a boolean value indicating if the client number has the correct format
 *
 * client number: 11 digits
 */
function isValidClientNumber(value: string) {
  return clientNumberFormatRegex.test(value);
}

/**
 * @param value - confirmation number
 * @returns - a boolean value indicating if the confirmation number has the correct format
 *
 * confirmation number: 13 digits
 */
function isValidConfirmationNumberCode(value: string) {
  return confirmationNumberFormatRegex.test(value);
}

/**
 * @param applicationCode - the application code / client number / confirmation number
 * @returns - a boolean value indicating if the application code / client number / confirmation number has the correct format
 *
 * application code: 6 digits
 * client number: 11 digits
 * confirmation number: 13 digits
 */
export function isValidCodeOrNumber(applicationCode: string) {
  return isValidApplicationCode(applicationCode) || isValidClientNumber(applicationCode) || isValidConfirmationNumberCode(applicationCode);
}

/**
 * @param clientNumber - the client number for renewal
 * @returns - a boolean value indicating if the client number has the correct format
 *
 * client number: 11 or 13 digits
 */
export function isValidClientNumberRenewal(clientNumber: string) {
  return isValidClientNumber(clientNumber) || isValidConfirmationNumberCode(clientNumber);
}

/**
 * @param applicationCode the 13 digit application code returned from PP after an applicant submits their application
 * @returns submission code in the format of XXX XXX XXX XXXX if it is valid otherwise the input
 */
export function formatSubmissionApplicationCode(applicationCode: string) {
  const strippedCode = applicationCode.replace(/ /g, '');
  return /^\d{13}$/.test(strippedCode) ? (strippedCode.match(/....$|.../g) ?? []).join(' ') : applicationCode;
}

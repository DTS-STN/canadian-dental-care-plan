import { getEnv } from './env.server';

export const applicationCodeInputPatternFormat = '### ### ### ####';
const applicationCodeFormatRegex = /^\d{3}[ ]?\d{3}$/;
const clientNumberFormatRegex = /^\d{3}[ ]?\d{3}[ ]?\d{3}[ ]?\d{2}$/;
const confirmationNumberFormatRegex = /^\d{3}[ ]?\d{3}[ ]?\d{3}[ ]?\d{4}$/;

/**
 *
 * @param value - the application code
 * @returns - a boolean value indicating if the application code has the correct format
 * application code: 6 digits
 */
function isValidApplicationCode(value: string): boolean {
  return applicationCodeFormatRegex.test(value);
}

/**
 *
 * @param value - client number
 * @returns - a boolean value indicating if the client number has the correct format
 * client number: 11 digits
 */
function isValidClientNumber(value: string): boolean {
  return clientNumberFormatRegex.test(value);
}

/**
 *
 * @param value - confirmation number
 * @returns - a boolean value indicating if the confirmation number has the correct format
 * confirmation number: 13 digits
 */
function isValidConfirmationNumberCode(value: string): boolean {
  return confirmationNumberFormatRegex.test(value);
}

/**
 *
 * @param applicationCode - the application code / client number / confirmation number
 * @returns - a boolean value indicating if the application code / client number / confirmation number has the correct format
 * application code: 6 digits
 * client number: 11 digits
 * confirmation number: 13 digits
 */
export function isValidCodeOrNumber(applicationCode: string): boolean {
  return isValidApplicationCode(applicationCode) || isValidClientNumber(applicationCode) || isValidConfirmationNumberCode(applicationCode);
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

/**
 *
 * @param statusId - the statusId of the application to check
 * @param nullStatusMapping- the type to return if a null statusId is supplied; defaults to 'info'
 * @returns the "info" | "success" | "danger" | "warning" which is consumed by the ContextualAlert component
 */
export function getContextualAlertType(statusId: string | null, nullStatusMapping = 'info') {
  const { CLIENT_STATUS_SUCCESS_ID, INVALID_CLIENT_FRIENDLY_STATUS } = getEnv();
  switch (statusId) {
    case null:
      return nullStatusMapping as 'info' | 'success' | 'danger' | 'warning';
    case INVALID_CLIENT_FRIENDLY_STATUS:
      return 'danger';
    case CLIENT_STATUS_SUCCESS_ID:
      return 'success';
    default:
      return 'info';
  }
}

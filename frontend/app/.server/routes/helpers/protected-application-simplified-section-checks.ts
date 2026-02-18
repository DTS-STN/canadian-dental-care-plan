import type { ChildState, ProtectedApplicationState } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getEnv } from '~/.server/utils/env.utils';

/**
 * Checks if the phone number section is completed for simplified application.
 */
export function isPhoneNumberSectionCompleted(state: Pick<ProtectedApplicationState, 'phoneNumber'>): boolean {
  return state.phoneNumber !== undefined;
}

/**
 * Checks if the address section is completed for simplified application.
 */
export function isAddressSectionCompleted(state: Pick<ProtectedApplicationState, 'mailingAddress' | 'homeAddress' | 'isHomeAddressSameAsMailingAddress'>): boolean {
  return state.mailingAddress !== undefined && (state.homeAddress !== undefined || state.isHomeAddressSameAsMailingAddress !== undefined);
}

/**
 * Checks if the communication preferences section is completed for simplified application.
 */
export function isCommunicationPreferencesSectionCompleted(state: Pick<ProtectedApplicationState, 'communicationPreferences'>): boolean {
  return state.communicationPreferences !== undefined;
}

/**
 * Checks if the email section is completed for simplified application.
 */
export function isEmailSectionCompleted(state: Pick<ProtectedApplicationState, 'email' | 'emailVerified'>): boolean {
  return state.email !== undefined && state.emailVerified === true;
}

/**
 * Checks if the dental insurance section is completed for simplified application.
 */
export function isDentalInsuranceSectionCompleted(state: Pick<ProtectedApplicationState, 'dentalInsurance'>): boolean {
  return state.dentalInsurance !== undefined;
}

/**
 * Checks if the dental benefits section is completed for simplified application.
 */
export function isDentalBenefitsSectionCompleted(state: Pick<ProtectedApplicationState, 'dentalBenefits'>): boolean {
  return state.dentalBenefits !== undefined;
}

/**
 * Checks if the marital status section is completed for simplified application.
 */
export function isMaritalStatusSectionCompleted(state: Pick<ProtectedApplicationState, 'maritalStatus' | 'partnerInformation'>): boolean {
  if (state.maritalStatus === undefined) return false; // marital status not selected

  const { MARITAL_STATUS_CODE_COMMON_LAW, MARITAL_STATUS_CODE_MARRIED } = getEnv();
  const partnerMaritalStatuses = [MARITAL_STATUS_CODE_COMMON_LAW, MARITAL_STATUS_CODE_MARRIED]; // statuses that require partner information

  if (partnerMaritalStatuses.includes(state.maritalStatus)) {
    return state.partnerInformation?.confirm === true; // partner information required and consent given
  }

  return true; // no partner information required
}

/**
 * Checks if the child information section is completed for simplified application.
 */
export function isChildInformationSectionCompleted(child: Pick<ChildState, 'information'>): boolean {
  // TODO: Check with age category and live independently status
  return child.information !== undefined && child.information.dateOfBirth !== '';
}

/**
 * Checks if the child dental insurance section is completed for simplified application.
 */
export function isChildDentalInsuranceSectionCompleted(child: Pick<ChildState, 'dentalInsurance'>): boolean {
  return child.dentalInsurance !== undefined;
}

/**
 * Checks if the child dental benefits section is completed for simplified application.
 */
export function isChildDentalBenefitsSectionCompleted(child: Pick<ChildState, 'dentalBenefits'>): boolean {
  return child.dentalBenefits !== undefined;
}

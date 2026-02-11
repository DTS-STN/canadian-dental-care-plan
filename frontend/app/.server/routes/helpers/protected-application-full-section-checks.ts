import type { ChildState, ProtectedApplicationState } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getEnv } from '~/.server/utils/env.utils';

/**
 * Checks if the phone number section is completed for full application.
 */
export function isPhoneNumberSectionCompleted(state: Pick<ProtectedApplicationState, 'phoneNumber'>): boolean {
  return state.phoneNumber?.hasChanged === true;
}

/**
 * Checks if the address section is completed for full application.
 */
export function isAddressSectionCompleted(state: Pick<ProtectedApplicationState, 'mailingAddress' | 'homeAddress' | 'isHomeAddressSameAsMailingAddress'>): boolean {
  return (
    state.mailingAddress?.hasChanged === true && //
    state.homeAddress?.hasChanged === true &&
    state.isHomeAddressSameAsMailingAddress !== undefined
  );
}

/**
 * Checks if the communication preferences section is completed for full application.
 */
export function isCommunicationPreferencesSectionCompleted(state: Pick<ProtectedApplicationState, 'communicationPreferences' | 'email' | 'emailVerified'>): boolean {
  if (state.communicationPreferences?.hasChanged !== true) {
    return false; // communication preferences not set
  }

  const { COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID, COMMUNICATION_METHOD_GC_DIGITAL_ID } = getEnv();
  const emailMethods = new Set([COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID, COMMUNICATION_METHOD_GC_DIGITAL_ID]); // methods that require email
  const isEmailRequired =
    emailMethods.has(state.communicationPreferences.value.preferredMethod) || //
    emailMethods.has(state.communicationPreferences.value.preferredNotificationMethod);

  return isEmailRequired ? state.email !== undefined && state.emailVerified === true : true;
}

/**
 * Checks if the dental insurance section is completed for full application.
 */
export function isDentalInsuranceSectionCompleted(state: Pick<ProtectedApplicationState, 'dentalInsurance'>): boolean {
  return state.dentalInsurance?.dentalInsuranceEligibilityConfirmation === true;
}

/**
 * Checks if the dental benefits section is completed for full application.
 */
export function isDentalBenefitsSectionCompleted(state: Pick<ProtectedApplicationState, 'dentalBenefits'>): boolean {
  return state.dentalBenefits?.hasChanged === true;
}

/**
 * Checks if the marital status section is completed for full application.
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
 * Checks if the child information section is completed for full application.
 */
export function isChildInformationSectionCompleted(child: Pick<ChildState, 'information'>): boolean {
  // TODO: Check with age category and live independently status
  return child.information !== undefined && child.information.dateOfBirth !== '';
}

/**
 * Checks if the child dental insurance section is completed for full application.
 */
export function isChildDentalInsuranceSectionCompleted(child: Pick<ChildState, 'dentalInsurance'>): boolean {
  return child.dentalInsurance !== undefined;
}

/**
 * Checks if the child dental benefits section is completed for full application.
 */
export function isChildDentalBenefitsSectionCompleted(child: Pick<ChildState, 'dentalBenefits'>): boolean {
  return child.dentalBenefits?.hasChanged === true;
}

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
export function isAddressSectionCompleted(state: Pick<ProtectedApplicationState, 'mailingAddress' | 'homeAddress'>): boolean {
  return state.mailingAddress !== undefined && state.homeAddress !== undefined;
}

/**
 * Checks if the communication preferences section is completed for simplified application.
 */
export function isCommunicationPreferencesSectionCompleted(state: Pick<ProtectedApplicationState, 'communicationPreferences' | 'email' | 'emailVerified'>): boolean {
  if (state.communicationPreferences === undefined) {
    return false; // communication preferences not set
  }

  if (state.communicationPreferences.hasChanged === false) {
    return true; // communication preferences set but has not changed
  }

  const { COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID, COMMUNICATION_METHOD_GC_DIGITAL_ID } = getEnv();
  const emailMethods = new Set([COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID, COMMUNICATION_METHOD_GC_DIGITAL_ID]); // methods that require email
  const isEmailRequired =
    emailMethods.has(state.communicationPreferences.value.preferredMethod) || //
    emailMethods.has(state.communicationPreferences.value.preferredNotificationMethod);

  return isEmailRequired ? state.email !== undefined && state.emailVerified === true : true;
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

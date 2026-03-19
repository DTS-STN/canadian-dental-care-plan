import type { PickDeep } from 'type-fest';

import type { ClientApplicationRenewalEligibleDto } from '~/.server/domain/dtos';
import { isChildClientNumberValid, isChildOrYouth } from '~/.server/routes/helpers/base-application-route-helpers';
import type { ChildState, ProtectedApplicationState } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getEnv } from '~/.server/utils/env.utils';
import { isValidDateString } from '~/utils/date-utils';

/**
 * Checks if the phone number section is completed for renewal application.
 */
export function isPhoneNumberSectionCompleted(state: Pick<ProtectedApplicationState, 'phoneNumber'>): boolean {
  return state.phoneNumber !== undefined;
}

/**
 * Checks if the address section is completed for renewal application.
 */
export function isAddressSectionCompleted(state: Pick<ProtectedApplicationState, 'mailingAddress' | 'homeAddress' | 'isHomeAddressSameAsMailingAddress'>): boolean {
  return state.mailingAddress !== undefined && (state.homeAddress !== undefined || state.isHomeAddressSameAsMailingAddress !== undefined);
}

/**
 * Checks if the communication preferences section is completed for renewal application.
 */
export function isCommunicationPreferencesSectionCompleted(state: Pick<ProtectedApplicationState, 'communicationPreferences' | 'email' | 'emailVerified'>): boolean {
  const { COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID, COMMUNICATION_METHOD_GC_DIGITAL_ID } = getEnv();
  return (
    state.communicationPreferences !== undefined &&
    (state.communicationPreferences.value?.preferredMethod === COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID || state.communicationPreferences.value?.preferredNotificationMethod === COMMUNICATION_METHOD_GC_DIGITAL_ID
      ? state.email !== undefined && state.emailVerified === true
      : true)
  );
}

/**
 * Checks if the dental insurance section is completed for renewal application.
 */
export function isDentalInsuranceSectionCompleted(state: Pick<ProtectedApplicationState, 'dentalInsurance'>): boolean {
  return state.dentalInsurance !== undefined;
}

/**
 * Checks if the dental benefits section is completed for renewal application.
 *
 * The dental benefits section is considered complete if the user has indicated whether their access to government
 * dental benefits has changed. If they have indicated that their access has changed, the section is complete regardless
 * of whether they have access or not. If they have indicated that their access has not changed, then they must indicate
 * their existing access to government dental benefits for the section to be considered complete.
 */
export function isDentalBenefitsSectionCompleted(state: PickDeep<ProtectedApplicationState, 'dentalBenefits' | 'clientApplication.dentalBenefits'>): boolean {
  if (!state.dentalBenefits) return false; // user must indicate if their access to government dental benefits has changed
  if (state.dentalBenefits.hasChanged) return true; // if access has changed, section is complete regardless of whether they have access or not
  return state.clientApplication?.dentalBenefits !== undefined; // if access has not changed, existing access must be indicated
}

/**
 * Checks if the marital status section is completed for renewal application.
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
 * Checks if the child information section is completed for renewal application.
 */
export function isChildInformationSectionCompleted(context: 'intake' | 'renewal', child: Pick<ChildState, 'information'>, clientApplication?: ClientApplicationRenewalEligibleDto): boolean {
  // TODO: Check with age category and live independently status
  return (
    child.information?.dateOfBirth !== undefined && //
    isValidDateString(child.information.dateOfBirth) &&
    isChildOrYouth(child.information.dateOfBirth, 'renewal') &&
    isChildClientNumberValid(context, clientApplication, child.information.memberId)
  );
}

/**
 * Checks if the child parent or legal guardian section is completed for renewal application.
 */
export function isChildParentGuardianSectionCompleted(child: Pick<ChildState, 'information'>): boolean {
  return child.information?.isParent !== undefined;
}

/**
 * Checks if the child Social Insurance Number section is completed for renewal application.
 */
export function isChildSinSectionCompleted(child: Pick<ChildState, 'information'>): boolean {
  return child.information?.socialInsuranceNumber !== undefined;
}

/**
 * Checks if the child dental insurance section is completed for renewal application.
 */
export function isChildDentalInsuranceSectionCompleted(child: Pick<ChildState, 'dentalInsurance'>): boolean {
  return child.dentalInsurance !== undefined;
}

/**
 * Checks if the child dental benefits section is completed for renewal application.
 */
export function isChildDentalBenefitsSectionCompleted(child: Pick<ChildState, 'dentalBenefits'>): boolean {
  return child.dentalBenefits !== undefined;
}

import type { ProtectedApplicationState } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getContextualAgeCategoryFromDate } from '~/.server/routes/helpers/protected-application-route-helpers';

/**
 * Checks if the type of application section is completed.
 */
export function isTypeOfApplicationSectionCompleted(state: Pick<ProtectedApplicationState, 'typeOfApplication'>): boolean {
  return state.typeOfApplication !== undefined && state.typeOfApplication !== 'delegate';
}

/**
 * Checks if the personal information section is completed.
 */
export function isPersonalInformationSectionCompleted(state: Pick<ProtectedApplicationState, 'applicantInformation' | 'livingIndependently'>): boolean {
  if (!state.applicantInformation?.dateOfBirth) {
    return false;
  }

  const ageCategory = getContextualAgeCategoryFromDate(state.applicantInformation.dateOfBirth, 'renewal');

  if (ageCategory === 'children') {
    return false;
  }

  if (ageCategory === 'youth') {
    return state.livingIndependently === true;
  }

  // adults or seniors
  return true;
}

/**
 * Checks if the new or returning member section is completed.
 */
export function isNewOrReturningMemberSectionCompleted(state: Pick<ProtectedApplicationState, 'context' | 'applicantInformation' | 'livingIndependently' | 'newOrReturningMember'>): boolean {
  return state.context === 'intake' && isPersonalInformationSectionCompleted(state) && state.newOrReturningMember?.isNewOrReturningMember !== undefined;
}

/**
 * Checks if the terms and conditions section is completed.
 */
export function isTermsAndConditionsSectionCompleted(state: Pick<ProtectedApplicationState, 'termsAndConditions'>): boolean {
  return (
    state.termsAndConditions?.acknowledgePrivacy === true && //
    state.termsAndConditions.acknowledgeTerms === true &&
    state.termsAndConditions.shareData === true
  );
}

/**
 * Checks if the tax filing section is completed.
 */
export function isTaxFilingSectionCompleted(state: Pick<ProtectedApplicationState, 'hasFiledTaxes'>): boolean {
  return state.hasFiledTaxes === true;
}

/**
 * Checks if the renewal selection section is completed.
 */
export function isRenewalSelectionCompleted(state: Pick<ProtectedApplicationState, 'applicantClientIdsToRenew' | 'applicantInformation' | 'livingIndependently'>): boolean {
  if (!state.applicantClientIdsToRenew || state.applicantClientIdsToRenew.length === 0 || !state.applicantInformation) {
    return false;
  }

  const ageCategory = getContextualAgeCategoryFromDate(state.applicantInformation.dateOfBirth, 'renewal');

  if (ageCategory === 'children') {
    return false;
  }

  if (ageCategory === 'youth') {
    return state.livingIndependently === true;
  }

  // adults or seniors
  return true;
}

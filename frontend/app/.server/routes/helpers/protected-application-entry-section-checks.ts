import type { ProtectedApplicationState } from '~/.server/routes/helpers/protected-application-route-helpers';

/**
 * Checks if the type of application section is completed.
 */
export function isTypeOfApplicationSectionCompleted(state: Pick<ProtectedApplicationState, 'typeOfApplication'>): boolean {
  return state.typeOfApplication !== undefined && state.typeOfApplication !== 'delegate';
}

/**
 * Checks if the personal information section is completed.
 */
export function isPersonalInformationSectionCompleted(state: Pick<ProtectedApplicationState, 'inputModel' | 'applicantInformation'>): boolean {
  return state.inputModel !== undefined && state.applicantInformation !== undefined;
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
export function isRenewalSelectionCompleted(state: Pick<ProtectedApplicationState, 'applicantClientIdsToRenew'>): boolean {
  return state.applicantClientIdsToRenew !== undefined;
}

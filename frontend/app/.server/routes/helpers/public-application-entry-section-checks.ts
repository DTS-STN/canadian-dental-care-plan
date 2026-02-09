import type { PublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';

/**
 * Checks if the type of application section is completed.
 */
export function isTypeOfApplicationSectionCompleted(state: Pick<PublicApplicationState, 'typeOfApplication'>): boolean {
  return state.typeOfApplication !== undefined && state.typeOfApplication !== 'delegate';
}

/**
 * Checks if the personal information section is completed.
 */
export function isPersonalInformationSectionCompleted(state: Pick<PublicApplicationState, 'inputModel' | 'applicantInformation'>): boolean {
  return state.inputModel !== undefined && state.applicantInformation !== undefined;
}

/**
 * Checks if the terms and conditions section is completed.
 */
export function isTermsAndConditionsSectionCompleted(state: Pick<PublicApplicationState, 'termsAndConditions'>): boolean {
  return (
    state.termsAndConditions?.acknowledgePrivacy === true && //
    state.termsAndConditions.acknowledgeTerms === true &&
    state.termsAndConditions.shareData === true
  );
}

/**
 * Checks if the tax filing section is completed.
 */
export function isTaxFilingSectionCompleted(state: Pick<PublicApplicationState, 'hasFiledTaxes'>): boolean {
  return state.hasFiledTaxes === true;
}

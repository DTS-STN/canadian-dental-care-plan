import { redirect } from 'react-router';

import { createLogger } from '~/.server/logging';
import type { ApplyState, ApplyStateParams } from '~/.server/routes/helpers/apply-route-helpers';
import { applicantInformationStateHasPartner, getAgeCategoryFromDateString, loadApplyState, saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { isRedirectResponse } from '~/.server/utils/response.utils';
import type { Session } from '~/.server/web/session';
import { getPathById } from '~/utils/route-utils';

interface LoadApplyAdultStateArgs {
  params: ApplyStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads apply adult state.
 * @param args - The arguments.
 * @returns The loaded adult state.
 */
export function loadApplyAdultState({ params, request, session }: LoadApplyAdultStateArgs) {
  const log = createLogger('apply-adult-route-helpers.server/loadApplyAdultState');
  const { pathname } = new URL(request.url);
  const applyState = loadApplyState({ params, session });

  if (applyState.typeOfApplication !== 'adult') {
    throw redirect(getPathById('public/apply/$id/type-application', params));
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = getPathById('public/apply/$id/adult/confirmation', params);
  if (applyState.submissionInfo && !pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has been submitted; sessionId: [%s], ', applyState.id, confirmationRouteUrl);
    throw redirect(confirmationRouteUrl);
  }

  // Redirect to the first flow page if the application has not been submitted and
  // the current route is the confirmation page.
  const termsAndConditionsRouteUrl = getPathById('public/apply/$id/terms-and-conditions', params);
  if (!applyState.submissionInfo && pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has not been submitted; sessionId: [%s], ', applyState.id, termsAndConditionsRouteUrl);
    throw redirect(termsAndConditionsRouteUrl);
  }

  return applyState;
}

interface LoadApplyAdultStateForReviewArgs {
  params: ApplyStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads the adult state for the review page. It validates the state and throws a redirect if invalid.
 * If a redirect exception is thrown, state.editMode is set to false.
 * @param args - The arguments.
 * @returns The validated adult state.
 */
export function loadApplyAdultStateForReview({ params, request, session }: LoadApplyAdultStateForReviewArgs) {
  const state = loadApplyAdultState({ params, request, session });

  try {
    return validateApplyAdultStateForReview({ params, state });
  } catch (error) {
    if (isRedirectResponse(error)) {
      saveApplyState({ params, session, state: { editMode: false } });
    }
    throw error;
  }
}

interface ValidateApplyAdultStateForReviewArgs {
  params: ApplyStateParams;
  state: ApplyState;
}

export function validateApplyAdultStateForReview({ params, state }: ValidateApplyAdultStateForReviewArgs) {
  const {
    applicantInformation,
    applicationYear,
    communicationPreferences,
    contactInformation,
    dentalBenefits,
    dentalInsurance,
    editMode,
    email,
    emailVerified,
    hasFederalProvincialTerritorialBenefits,
    hasFiledTaxes,
    homeAddress,
    id,
    isHomeAddressSameAsMailingAddress,
    lastUpdatedOn,
    livingIndependently,
    mailingAddress,
    maritalStatus,
    newOrExistingMember,
    partnerInformation,
    submissionInfo,
    termsAndConditions,
    typeOfApplication,
  } = state;

  if (termsAndConditions === undefined) {
    throw redirect(getPathById('public/apply/$id/terms-and-conditions', params));
  }

  if (typeOfApplication === undefined) {
    throw redirect(getPathById('public/apply/$id/type-application', params));
  }

  if (typeOfApplication === 'delegate') {
    throw redirect(getPathById('public/apply/$id/application-delegate', params));
  }

  if (typeOfApplication !== 'adult') {
    throw redirect(getPathById('public/apply/$id/type-application', params));
  }

  if (hasFiledTaxes === undefined) {
    throw redirect(getPathById('public/apply/$id/tax-filing', params));
  }

  if (hasFiledTaxes === false) {
    throw redirect(getPathById('public/apply/$id/file-taxes', params));
  }

  if (applicantInformation === undefined) {
    throw redirect(getPathById('public/apply/$id/adult/applicant-information', params));
  }

  const ageCategory = getAgeCategoryFromDateString(applicantInformation.dateOfBirth);

  if (ageCategory === 'children') {
    throw redirect(getPathById('public/apply/$id/adult/parent-or-guardian', params));
  }

  if (ageCategory === 'youth' && livingIndependently === undefined) {
    throw redirect(getPathById('public/apply/$id/adult/living-independently', params));
  }

  if (ageCategory === 'youth' && livingIndependently === false) {
    throw redirect(getPathById('public/apply/$id/adult/parent-or-guardian', params));
  }

  if (applicantInformationStateHasPartner(maritalStatus) && !partnerInformation) {
    throw redirect(getPathById('public/apply/$id/adult/marital-status', params));
  }

  if (!applicantInformationStateHasPartner(maritalStatus) && partnerInformation) {
    throw redirect(getPathById('public/apply/$id/adult/marital-status', params));
  }

  if (contactInformation === undefined) {
    throw redirect(getPathById('public/apply/$id/adult/phone-number', params));
  }

  if (communicationPreferences === undefined) {
    throw redirect(getPathById('public/apply/$id/adult/communication-preference', params));
  }

  if (dentalInsurance === undefined) {
    throw redirect(getPathById('public/apply/$id/adult/dental-insurance', params));
  }

  if (hasFederalProvincialTerritorialBenefits === undefined) {
    throw redirect(getPathById('public/apply/$id/adult/confirm-federal-provincial-territorial-benefits', params));
  }

  if (dentalBenefits === undefined && hasFederalProvincialTerritorialBenefits === true) {
    throw redirect(getPathById('public/apply/$id/adult/federal-provincial-territorial-benefits', params));
  }

  return {
    ageCategory,
    applicantInformation,
    applicationYear,
    communicationPreferences,
    contactInformation,
    hasFederalProvincialTerritorialBenefits,
    dentalBenefits,
    dentalInsurance,
    editMode,
    email,
    emailVerified,
    hasFiledTaxes,
    homeAddress,
    id,
    isHomeAddressSameAsMailingAddress,
    lastUpdatedOn,
    livingIndependently,
    mailingAddress,
    maritalStatus,
    newOrExistingMember,
    partnerInformation,
    submissionInfo,
    termsAndConditions,
    typeOfApplication,
  };
}

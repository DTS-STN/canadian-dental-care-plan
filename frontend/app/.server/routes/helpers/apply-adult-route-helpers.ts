import type { Session } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import type { Params } from '@remix-run/react';
import { isRedirectResponse, isResponse } from '@remix-run/server-runtime/dist/responses';

import type { ApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { applicantInformationStateHasPartner, getAgeCategoryFromDateString, loadApplyState, saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { getLogger } from '~/.server/utils/logging.utils';
import { getPathById } from '~/utils/route-utils';

interface LoadApplyAdultStateArgs {
  params: Params;
  request: Request;
  session: Session;
}

/**
 * Loads apply adult state.
 * @param args - The arguments.
 * @returns The loaded adult state.
 */
export function loadApplyAdultState({ params, request, session }: LoadApplyAdultStateArgs) {
  const log = getLogger('apply-adult-route-helpers.server/loadApplyAdultState');
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
  params: Params;
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
  } catch (err) {
    if (isResponse(err) && isRedirectResponse(err)) {
      saveApplyState({ params, session, state: { editMode: false } });
    }
    throw err;
  }
}

interface ValidateApplyAdultStateForReviewArgs {
  params: Params;
  state: ApplyState;
}

export function validateApplyAdultStateForReview({ params, state }: ValidateApplyAdultStateForReviewArgs) {
  const {
    applicantInformation,
    communicationPreferences,
    dateOfBirth,
    dentalBenefits,
    dentalInsurance,
    disabilityTaxCredit,
    editMode,
    id,
    lastUpdatedOn,
    livingIndependently,
    partnerInformation,
    contactInformation,
    submissionInfo,
    taxFiling2023,
    typeOfApplication,
  } = state;

  if (typeOfApplication === undefined) {
    throw redirect(getPathById('public/apply/$id/type-application', params));
  }

  if (typeOfApplication === 'delegate') {
    throw redirect(getPathById('public/apply/$id/application-delegate', params));
  }

  if (typeOfApplication !== 'adult') {
    throw redirect(getPathById('public/apply/$id/type-application', params));
  }

  if (taxFiling2023 === undefined) {
    throw redirect(getPathById('public/apply/$id/adult/tax-filing', params));
  }

  if (taxFiling2023 === false) {
    throw redirect(getPathById('public/apply/$id/adult/file-taxes', params));
  }

  if (dateOfBirth === undefined) {
    throw redirect(getPathById('public/apply/$id/adult/date-of-birth', params));
  }

  const ageCategory = getAgeCategoryFromDateString(dateOfBirth);

  if (ageCategory === 'children') {
    throw redirect(getPathById('public/apply/$id/adult/parent-or-guardian', params));
  }

  if (ageCategory === 'youth' && livingIndependently === undefined) {
    throw redirect(getPathById('public/apply/$id/adult/living-independently', params));
  }

  if (ageCategory === 'youth' && livingIndependently === false) {
    throw redirect(getPathById('public/apply/$id/adult/parent-or-guardian', params));
  }

  if (ageCategory === 'adults' && disabilityTaxCredit === undefined) {
    throw redirect(getPathById('public/apply/$id/adult/disability-tax-credit', params));
  }

  if (ageCategory === 'adults' && disabilityTaxCredit === false) {
    throw redirect(getPathById('public/apply/$id/adult/dob-eligibility', params));
  }

  if (applicantInformation === undefined) {
    throw redirect(getPathById('public/apply/$id/adult/applicant-information', params));
  }

  if (applicantInformationStateHasPartner(applicantInformation) && !partnerInformation) {
    throw redirect(getPathById('public/apply/$id/adult/partner-information', params));
  }

  if (!applicantInformationStateHasPartner(applicantInformation) && partnerInformation) {
    throw redirect(getPathById('public/apply/$id/adult/applicant-information', params));
  }

  if (contactInformation === undefined) {
    throw redirect(getPathById('public/apply/$id/adult/contact-information', params));
  }

  if (communicationPreferences === undefined) {
    throw redirect(getPathById('public/apply/$id/adult/communication-preference', params));
  }

  if (dentalInsurance === undefined) {
    throw redirect(getPathById('public/apply/$id/adult/dental-insurance', params));
  }

  if (dentalBenefits === undefined) {
    throw redirect(getPathById('public/apply/$id/adult/federal-provincial-territorial-benefits', params));
  }

  return {
    ageCategory,
    applicantInformation,
    communicationPreferences,
    contactInformation,
    dateOfBirth,
    dentalBenefits,
    dentalInsurance,
    disabilityTaxCredit,
    editMode,
    id,
    lastUpdatedOn,
    livingIndependently,
    partnerInformation,
    submissionInfo,
    taxFiling2023,
    typeOfApplication,
  };
}

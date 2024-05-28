import { Session, redirect } from '@remix-run/node';
import { Params } from '@remix-run/react';

import { ApplyState, applicantInformationStateHasPartner, getAgeCategoryFromDateString, loadApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getLogger } from '~/utils/logging.server';
import { getPathById } from '~/utils/route-utils';

const log = getLogger('apply-route-helpers.server');

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
  const { pathname } = new URL(request.url);
  const applyState = loadApplyState({ params, session });

  if (applyState.typeOfApplication !== 'adult') {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = getPathById('$lang+/_public+/apply+/$id+/adult/confirmation', params);
  if (applyState.submissionInfo && !pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has been submitted; sessionId: [%s], ', applyState.id, confirmationRouteUrl);
    throw redirect(confirmationRouteUrl);
  }

  // Redirect to the first flow page if the application has not been submitted and
  // the current route is the confirmation page.
  const termsAndConditionsRouteUrl = getPathById('$lang+/_public+/apply+/$id+/terms-and-conditions', params);
  if (!applyState.submissionInfo && pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has not been submitted; sessionId: [%s], ', applyState.id, termsAndConditionsRouteUrl);
    throw redirect(termsAndConditionsRouteUrl);
  }

  return applyState;
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
    personalInformation,
    submissionInfo,
    taxFiling2023,
    typeOfApplication,
  } = state;

  if (typeOfApplication === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
  }

  if (typeOfApplication === 'delegate') {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/application-delegate', params));
  }

  if (typeOfApplication !== 'adult') {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
  }

  if (taxFiling2023 === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/tax-filing', params));
  }

  if (taxFiling2023 === false) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/file-taxes', params));
  }

  if (dateOfBirth === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/date-of-birth', params));
  }

  const ageCategory = getAgeCategoryFromDateString(dateOfBirth);

  if (ageCategory === 'children') {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/parent-or-guardian', params));
  }

  if (ageCategory === 'youth' && livingIndependently === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/living-independently', params));
  }

  if (ageCategory === 'youth' && livingIndependently === false) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/parent-or-guardian', params));
  }

  if (ageCategory === 'adults' && disabilityTaxCredit === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/disability-tax-credit', params));
  }

  if (ageCategory === 'adults' && disabilityTaxCredit === false) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/dob-eligibility', params));
  }

  if (applicantInformation === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/applicant-information', params));
  }

  if (applicantInformationStateHasPartner(applicantInformation) && !partnerInformation) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/partner-information', params));
  }

  if (!applicantInformationStateHasPartner(applicantInformation) && partnerInformation) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/applicant-information', params));
  }

  if (personalInformation === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/personal-information', params));
  }

  if (communicationPreferences === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/communication-preference', params));
  }

  if (dentalInsurance === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/dental-insurance', params));
  }

  if (dentalBenefits === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/federal-provincial-territorial-benefits', params));
  }

  return {
    ageCategory,
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
    personalInformation,
    submissionInfo,
    taxFiling2023,
    typeOfApplication,
  };
}

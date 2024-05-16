import { Session, redirect } from '@remix-run/node';
import { Params } from '@remix-run/react';

import { ApplyState, getAgeCategoryFromDateString, loadApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getEnv } from '~/utils/env.server';
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

interface ApplicantInformationStateHasPartnerArgs {
  maritalStatus: string;
}

export function applicantInformationStateHasPartner({ maritalStatus }: ApplicantInformationStateHasPartnerArgs) {
  const { MARITAL_STATUS_CODE_MARRIED, MARITAL_STATUS_CODE_COMMONLAW } = getEnv();
  return [MARITAL_STATUS_CODE_MARRIED, MARITAL_STATUS_CODE_COMMONLAW].includes(Number(maritalStatus));
}

interface ValidateStateForReviewArgs {
  params: Params;
  state: ApplyState;
}

export function validateApplyAdultStateForReview({ params, state }: ValidateStateForReviewArgs) {
  if (state.typeOfApplication === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
  }

  if (state.typeOfApplication === 'delegate') {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/application-delegate', params));
  }

  if (state.typeOfApplication !== 'adult') {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
  }

  if (state.taxFiling2023 === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/tax-filing', params));
  }

  if (state.taxFiling2023 === false) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/file-taxes', params));
  }

  if (state.dateOfBirth === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/date-of-birth', params));
  }

  const ageCategory = getAgeCategoryFromDateString(state.dateOfBirth);

  if (ageCategory === 'children') {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/parent-or-guardian', params));
  }

  if (ageCategory === 'youth' && state.livingIndependently === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/living-independently', params));
  }

  if (ageCategory === 'youth' && state.livingIndependently === false) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/parent-or-guardian', params));
  }

  if (ageCategory === 'adults' && state.disabilityTaxCredit === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/disability-tax-credit', params));
  }

  if (ageCategory === 'adults' && state.disabilityTaxCredit === false) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/dob-eligibility', params));
  }

  if (state.applicantInformation === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/applicant-information', params));
  }

  if (applicantInformationStateHasPartner(state.applicantInformation) && !state.partnerInformation) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/partner-information', params));
  }

  if (!applicantInformationStateHasPartner(state.applicantInformation) && state.partnerInformation) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/applicant-information', params));
  }

  if (state.personalInformation === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/personal-information', params));
  }

  if (state.communicationPreferences === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/communication-preference', params));
  }

  if (state.dentalInsurance === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/dental-insurance', params));
  }

  if (state.dentalBenefits === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/federal-provincial-territorial-benefits', params));
  }
}

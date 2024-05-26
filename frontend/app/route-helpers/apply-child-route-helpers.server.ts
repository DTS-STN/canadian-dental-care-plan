import { Session, redirect } from '@remix-run/node';
import { Params } from '@remix-run/react';

import { ApplyState, applicantInformationStateHasPartner, getAgeCategoryFromDateString, getChildrenState, loadApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getLogger } from '~/utils/logging.server';
import { getPathById } from '~/utils/route-utils';

const log = getLogger('apply-route-helpers.server');

interface LoadApplyChildStateArgs {
  params: Params;
  request: Request;
  session: Session;
}

/**
 * Loads apply child state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function loadApplyChildState({ params, request, session }: LoadApplyChildStateArgs) {
  const { pathname } = new URL(request.url);
  const applyState = loadApplyState({ params, session });

  if (applyState.typeOfApplication !== 'child') {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = getPathById('$lang+/_public+/apply+/$id+/child/confirmation', params);
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

interface ValidateStateForReviewArgs {
  params: Params;
  state: ApplyState;
}

export function validateApplyChildStateForReview({ params, state }: ValidateStateForReviewArgs) {
  if (state.typeOfApplication === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
  }

  if (state.typeOfApplication === 'delegate') {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/application-delegate', params));
  }

  if (state.typeOfApplication !== 'child') {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
  }

  if (state.taxFiling2023 === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/child/tax-filing', params));
  }

  if (state.taxFiling2023 === false) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/child/file-taxes', params));
  }

  if (getChildrenState(state).length === 0) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/child/children/index', params));
  }

  getChildrenState(state).forEach((child) => {
    const childId = child.id;

    if (child.information === undefined) {
      throw redirect(getPathById('$lang+/_public+/apply+/$id+/child/children/$childId/information', { ...params, childId }));
    }

    if (!child.information.isParent) {
      throw redirect(getPathById('$lang+/_public+/apply+/$id+/child/children/$childId/parent-or-guardian', { ...params, childId }));
    }

    const childAgeCategory = getAgeCategoryFromDateString(child.information.dateOfBirth);

    if (childAgeCategory === 'adults' || childAgeCategory === 'seniors') {
      throw redirect(getPathById('$lang+/_public+/apply+/$id+/child/children/$childId/cannot-apply-child', { ...params, childId }));
    }

    if (child.dentalInsurance === undefined) {
      throw redirect(getPathById('$lang+/_public+/apply+/$id+/child/children/$childId/dental-insurance', { ...params, childId }));
    }

    if (child.dentalBenefits === undefined) {
      throw redirect(getPathById('$lang+/_public+/apply+/$id+/child/children/$childId/federal-provincial-territorial-benefits', { ...params, childId }));
    }
  });

  if (state.applicantInformation === undefined || state.dateOfBirth === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/child/applicant-information', params));
  }

  const ageCategory = getAgeCategoryFromDateString(state.dateOfBirth);

  if (ageCategory === 'children') {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/child/contact-apply-child', params));
  }

  if (applicantInformationStateHasPartner(state.applicantInformation) && !state.partnerInformation) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/child/partner-information', params));
  }

  if (!applicantInformationStateHasPartner(state.applicantInformation) && state.partnerInformation) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/child/applicant-information', params));
  }

  if (state.personalInformation === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/child/personal-information', params));
  }

  if (state.communicationPreferences === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/child/communication-preference', params));
  }
}

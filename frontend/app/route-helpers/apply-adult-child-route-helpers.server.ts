import { Session, redirect } from '@remix-run/node';
import { Params } from '@remix-run/react';

import { z } from 'zod';

import { ApplyState, applicantInformationStateHasPartner, getAgeCategoryFromDateString, getChildrenState, isNewChildState, loadApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getLogger } from '~/utils/logging.server';
import { getPathById } from '~/utils/route-utils';

const log = getLogger('apply-route-helpers.server');

interface LoadApplyAdultChildStateArgs {
  params: Params;
  request: Request;
  session: Session;
}

/**
 * Loads apply adult child(ren) state.
 * @param args - The arguments.
 * @returns The loaded adult child(ren) state.
 */
export function loadApplyAdultChildState({ params, request, session }: LoadApplyAdultChildStateArgs) {
  const { pathname } = new URL(request.url);
  const applyState = loadApplyState({ params, session });

  if (applyState.typeOfApplication !== 'adult-child') {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = getPathById('$lang+/_public+/apply+/$id+/adult-child/confirmation', params);
  if (applyState.submissionInfo && !pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has been submitted; sessionId: [%s], ', applyState.id, confirmationRouteUrl);
    throw redirect(confirmationRouteUrl);
  }

  // Redirect to the first flow page if the application has not been submitted and
  // the current route is the confirmation page.
  const termsAndConditionsRouteUrl = getPathById('$lang+/_public+/apply+/$id+/terms-and-conditions', params);
  if (!applyState.submissionInfo && pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has not been submitted; sessionId: [%s], ', applyState.id, termsAndConditionsRouteUrl);
    //throw redirect(termsAndConditionsRouteUrl);
    //TODO: re-add throw when apply adult-child flow is completed
  }

  return applyState;
}

interface LoadApplyAdultSingleChildStateArgs {
  params: Params;
  request: Request;
  session: Session;
}

/**
 * Loads single child state from apply adult child state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function loadApplyAdultSingleChildState({ params, request, session }: LoadApplyAdultSingleChildStateArgs) {
  const applyState = loadApplyAdultChildState({ params, request, session });

  const parsedChildId = z.string().uuid().safeParse(params.childId);

  if (!parsedChildId.success) {
    log.warn('Invalid "childId" param format; childId: [%s]', params.childId);
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/children/index', params));
  }

  const childId = parsedChildId.data;
  const childStateIndex = applyState.children.findIndex(({ id }) => id === childId);

  if (childStateIndex === -1) {
    log.warn('Apply single child has not been found; childId: [%s]', childId);
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/children/index', params));
  }

  const childState = applyState.children[childStateIndex];
  const isNew = isNewChildState(childState);
  const editMode = !isNew && applyState.editMode;

  return {
    ...childState,
    childNumber: childStateIndex + 1,
    editMode,
    isNew,
  };
}

interface ValidateStateForReviewArgs {
  params: Params;
  state: ApplyState;
}

export function validateApplyAdultChildStateForReview({ params, state }: ValidateStateForReviewArgs) {
  if (state.typeOfApplication === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
  }

  if (state.typeOfApplication === 'delegate') {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/application-delegate', params));
  }

  if (state.typeOfApplication !== 'adult-child') {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
  }

  if (state.taxFiling2023 === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/tax-filing', params));
  }

  if (state.taxFiling2023 === false) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/file-taxes', params));
  }

  if (state.dateOfBirth === undefined || state.allChildrenUnder18 === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/date-of-birth', params));
  }

  const ageCategory = getAgeCategoryFromDateString(state.dateOfBirth);

  if (ageCategory === 'children' && state.allChildrenUnder18) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/contact-apply-child', params));
  }

  if (ageCategory === 'children' && !state.allChildrenUnder18) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/parent-or-guardian', params));
  }

  if (ageCategory === 'youth' && !state.allChildrenUnder18) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/parent-or-guardian', params));
  }

  if (ageCategory === 'youth' && state.allChildrenUnder18 && state.livingIndependently === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/living-independently', params));
  }

  if (ageCategory === 'adults' && state.disabilityTaxCredit === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/disability-tax-credit', params));
  }

  if (ageCategory === 'adults' && state.disabilityTaxCredit === true && !state.allChildrenUnder18) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/apply-yourself', params));
  }

  if (ageCategory === 'adults' && state.disabilityTaxCredit === false && state.allChildrenUnder18) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/apply-children', params));
  }

  if (ageCategory === 'adults' && state.disabilityTaxCredit === false && !state.allChildrenUnder18) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/dob-eligibility', params));
  }

  if (ageCategory === 'seniors' && !state.allChildrenUnder18) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/apply-yourself', params));
  }

  if (state.applicantInformation === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/applicant-information', params));
  }

  if (applicantInformationStateHasPartner(state.applicantInformation) && !state.partnerInformation) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/partner-information', params));
  }

  if (!applicantInformationStateHasPartner(state.applicantInformation) && state.partnerInformation) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/applicant-information', params));
  }

  if (state.personalInformation === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/personal-information', params));
  }

  if (state.communicationPreferences === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/communication-preference', params));
  }

  if (state.dentalInsurance === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/dental-insurance', params));
  }

  if (state.dentalBenefits === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/federal-provincial-territorial-benefits', params));
  }

  if (getChildrenState(state).length === 0) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/children/index', params));
  }

  getChildrenState(state).forEach((child) => {
    const childId = child.id;

    if (child.information === undefined) {
      throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/children/$childId/information', { ...params, childId }));
    }

    if (!child.information.isParent) {
      throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/children/$childId/parent-or-guardian', { ...params, childId }));
    }

    const childAgeCategory = getAgeCategoryFromDateString(child.information.dateOfBirth);

    if (childAgeCategory === 'adults' || childAgeCategory === 'seniors') {
      throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/children/$childId/cannot-apply-child', { ...params, childId }));
    }

    if (child.dentalInsurance === undefined) {
      throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/children/$childId/dental-insurance', { ...params, childId }));
    }

    if (child.dentalBenefits === undefined) {
      throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/children/$childId/federal-provincial-territorial-benefits', { ...params, childId }));
    }
  });
}

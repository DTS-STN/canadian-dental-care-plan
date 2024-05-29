import { Session, redirect } from '@remix-run/node';
import { Params } from '@remix-run/react';

import { z } from 'zod';

import { ApplyState, ChildState, applicantInformationStateHasPartner, getAgeCategoryFromDateString, getChildrenState, isNewChildState, loadApplyState } from '~/route-helpers/apply-route-helpers.server';
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
    throw redirect(getPathById('$lang/_public/apply/$id/type-application', params));
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = getPathById('$lang/_public/apply/$id/child/confirmation', params);
  if (applyState.submissionInfo && !pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has been submitted; sessionId: [%s], ', applyState.id, confirmationRouteUrl);
    throw redirect(confirmationRouteUrl);
  }

  // Redirect to the first flow page if the application has not been submitted and
  // the current route is the confirmation page.
  const termsAndConditionsRouteUrl = getPathById('$lang/_public/apply/$id/terms-and-conditions', params);
  if (!applyState.submissionInfo && pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has not been submitted; sessionId: [%s], ', applyState.id, termsAndConditionsRouteUrl);
    throw redirect(termsAndConditionsRouteUrl);
  }

  return applyState;
}

interface LoadApplySingleChildStateArgs {
  params: Params;
  request: Request;
  session: Session;
}

/**
 * Loads single child state from apply child state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function loadApplySingleChildState({ params, request, session }: LoadApplySingleChildStateArgs) {
  const applyState = loadApplyChildState({ params, request, session });

  const parsedChildId = z.string().uuid().safeParse(params.childId);

  if (!parsedChildId.success) {
    log.warn('Invalid "childId" param format; childId: [%s]', params.childId);
    throw redirect(getPathById('$lang/_public/apply/$id/child/children/index', params));
  }

  const childId = parsedChildId.data;
  const childStateIndex = applyState.children.findIndex(({ id }) => id === childId);

  if (childStateIndex === -1) {
    log.warn('Apply single child has not been found; childId: [%s]', childId);
    throw redirect(getPathById('$lang/_public/apply/$id/child/children/index', params));
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

export function validateApplyChildStateForReview({ params, state }: ValidateStateForReviewArgs) {
  const { applicantInformation, communicationPreferences, dateOfBirth, editMode, id, lastUpdatedOn, partnerInformation, personalInformation, submissionInfo, taxFiling2023, typeOfApplication } = state;

  if (typeOfApplication === undefined) {
    throw redirect(getPathById('$lang/_public/apply/$id/type-application', params));
  }

  if (typeOfApplication === 'delegate') {
    throw redirect(getPathById('$lang/_public/apply/$id/application-delegate', params));
  }

  if (typeOfApplication !== 'child') {
    throw redirect(getPathById('$lang/_public/apply/$id/type-application', params));
  }

  if (taxFiling2023 === undefined) {
    throw redirect(getPathById('$lang/_public/apply/$id/child/tax-filing', params));
  }

  if (taxFiling2023 === false) {
    throw redirect(getPathById('$lang/_public/apply/$id/child/file-taxes', params));
  }

  const children = validateChildrenStateForReview({ childrenState: state.children, params });

  if (applicantInformation === undefined || dateOfBirth === undefined) {
    throw redirect(getPathById('$lang/_public/apply/$id/child/applicant-information', params));
  }

  const ageCategory = getAgeCategoryFromDateString(dateOfBirth);

  if (ageCategory === 'children') {
    throw redirect(getPathById('$lang/_public/apply/$id/child/contact-apply-child', params));
  }

  if (applicantInformationStateHasPartner(applicantInformation) && !partnerInformation) {
    throw redirect(getPathById('$lang/_public/apply/$id/child/partner-information', params));
  }

  if (!applicantInformationStateHasPartner(applicantInformation) && partnerInformation) {
    throw redirect(getPathById('$lang/_public/apply/$id/child/applicant-information', params));
  }

  if (personalInformation === undefined) {
    throw redirect(getPathById('$lang/_public/apply/$id/child/personal-information', params));
  }

  if (communicationPreferences === undefined) {
    throw redirect(getPathById('$lang/_public/apply/$id/child/communication-preference', params));
  }

  return {
    ageCategory,
    applicantInformation,
    children,
    communicationPreferences,
    dateOfBirth,
    editMode,
    id,
    lastUpdatedOn,
    partnerInformation,
    personalInformation,
    submissionInfo,
    taxFiling2023,
    typeOfApplication,
  };
}

interface ValidateChildrenStateForReviewArgs {
  childrenState: ChildState[];
  params: Params;
}

function validateChildrenStateForReview({ childrenState, params }: ValidateChildrenStateForReviewArgs) {
  const children = getChildrenState({ children: childrenState });

  if (children.length === 0) {
    throw redirect(getPathById('$lang/_public/apply/$id/child/children/index', params));
  }

  return children.map(({ id, dentalBenefits, dentalInsurance, information }) => {
    const childId = id;

    if (information === undefined) {
      throw redirect(getPathById('$lang/_public/apply/$id/child/children/$childId/information', { ...params, childId }));
    }

    if (!information.isParent) {
      throw redirect(getPathById('$lang/_public/apply/$id/child/children/$childId/parent-or-guardian', { ...params, childId }));
    }

    const ageCategory = getAgeCategoryFromDateString(information.dateOfBirth);

    if (ageCategory === 'adults' || ageCategory === 'seniors') {
      throw redirect(getPathById('$lang/_public/apply/$id/child/children/$childId/cannot-apply-child', { ...params, childId }));
    }

    if (dentalInsurance === undefined) {
      throw redirect(getPathById('$lang/_public/apply/$id/child/children/$childId/dental-insurance', { ...params, childId }));
    }

    if (dentalBenefits === undefined) {
      throw redirect(getPathById('$lang/_public/apply/$id/child/children/$childId/federal-provincial-territorial-benefits', { ...params, childId }));
    }

    return {
      ageCategory,
      dentalBenefits,
      dentalInsurance,
      id,
      information,
    };
  });
}

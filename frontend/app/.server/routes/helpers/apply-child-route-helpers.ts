import { redirect } from 'react-router';

import { z } from 'zod';

import type { ApplyState, ApplyStateParams, ChildrenState } from '~/.server/routes/helpers/apply-route-helpers';
import { applicantInformationStateHasPartner, getAgeCategoryFromDateString, getChildrenState, isNewChildState, loadApplyState, saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { getLogger } from '~/.server/utils/logging.utils';
import { isRedirectResponse } from '~/.server/utils/response.utils';
import type { Session } from '~/.server/web/session';
import { getPathById } from '~/utils/route-utils';

interface LoadApplyChildStateArgs {
  params: ApplyStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads apply child state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function loadApplyChildState({ params, request, session }: LoadApplyChildStateArgs) {
  const log = getLogger('apply-child-route-helpers.server/loadApplyChildState');
  const { pathname } = new URL(request.url);
  const applyState = loadApplyState({ params, session });

  if (applyState.typeOfApplication !== 'child') {
    throw redirect(getPathById('public/apply/$id/type-application', params));
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = getPathById('public/apply/$id/child/confirmation', params);
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

interface LoadApplyChildStateForReviewArgs {
  params: ApplyStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads the child state for the review page. It validates the state and throws a redirect if invalid.
 * If a redirect exception is thrown, state.editMode is set to false.
 * @param args - The arguments.
 * @returns The validated child state.
 */
export function loadApplyChildStateForReview({ params, request, session }: LoadApplyChildStateForReviewArgs) {
  const state = loadApplyChildState({ params, request, session });

  try {
    return validateApplyChildStateForReview({ params, state });
  } catch (err) {
    if (isRedirectResponse(err)) {
      saveApplyState({ params, session, state: { editMode: false } });
    }
    throw err;
  }
}

interface LoadApplySingleChildStateArgs {
  params: ApplyStateParams & { childId: string };
  request: Request;
  session: Session;
}

/**
 * Loads single child state from apply child state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function loadApplySingleChildState({ params, request, session }: LoadApplySingleChildStateArgs) {
  const log = getLogger('apply-child-route-helpers.server/loadApplySingleChildState');
  const applyState = loadApplyChildState({ params, request, session });

  const parsedChildId = z.string().uuid().safeParse(params.childId);

  if (!parsedChildId.success) {
    log.warn('Invalid "childId" param format; childId: [%s]', params.childId);
    throw redirect(getPathById('public/apply/$id/child/children/index', params));
  }

  const childId = parsedChildId.data;
  const childStateIndex = applyState.children.findIndex(({ id }) => id === childId);

  if (childStateIndex === -1) {
    log.warn('Apply single child has not been found; childId: [%s]', childId);
    throw redirect(getPathById('public/apply/$id/child/children/index', params));
  }

  const childState = applyState.children[childStateIndex];
  const isNew = isNewChildState(childState);
  const editMode = !isNew && applyState.editMode;

  return { ...childState, childNumber: childStateIndex + 1, editMode, isNew };
}

interface ValidateStateForReviewArgs {
  params: ApplyStateParams;
  state: ApplyState;
}

export function validateApplyChildStateForReview({ params, state }: ValidateStateForReviewArgs) {
  const { applicantInformation, applicationYear, communicationPreferences, dateOfBirth, maritalStatus, editMode, id, lastUpdatedOn, partnerInformation, contactInformation, submissionInfo, taxFiling2023, typeOfApplication } = state;

  if (typeOfApplication === undefined) {
    throw redirect(getPathById('public/apply/$id/type-application', params));
  }

  if (typeOfApplication === 'delegate') {
    throw redirect(getPathById('public/apply/$id/application-delegate', params));
  }

  if (typeOfApplication !== 'child') {
    throw redirect(getPathById('public/apply/$id/type-application', params));
  }

  if (taxFiling2023 === undefined) {
    throw redirect(getPathById('public/apply/$id/tax-filing', params));
  }

  if (taxFiling2023 === false) {
    throw redirect(getPathById('public/apply/$id/file-taxes', params));
  }

  const children = validateChildrenStateForReview({ childrenState: state.children, params });

  if (applicantInformation === undefined || dateOfBirth === undefined) {
    throw redirect(getPathById('public/apply/$id/child/applicant-information', params));
  }

  const ageCategory = getAgeCategoryFromDateString(dateOfBirth);

  if (ageCategory === 'children') {
    throw redirect(getPathById('public/apply/$id/child/contact-apply-child', params));
  }

  if (applicantInformationStateHasPartner(maritalStatus) && !partnerInformation) {
    throw redirect(getPathById('public/apply/$id/child/partner-information', params));
  }

  if (!applicantInformationStateHasPartner(maritalStatus) && partnerInformation) {
    throw redirect(getPathById('public/apply/$id/child/applicant-information', params));
  }

  if (contactInformation === undefined) {
    throw redirect(getPathById('public/apply/$id/child/contact-information', params));
  }

  if (communicationPreferences === undefined) {
    throw redirect(getPathById('public/apply/$id/child/communication-preference', params));
  }

  return { ageCategory, applicantInformation, applicationYear, children, communicationPreferences, contactInformation, dateOfBirth, maritalStatus, editMode, id, lastUpdatedOn, partnerInformation, submissionInfo, taxFiling2023, typeOfApplication };
}

interface ValidateChildrenStateForReviewArgs {
  childrenState: ChildrenState;
  params: ApplyStateParams;
}

function validateChildrenStateForReview({ childrenState, params }: ValidateChildrenStateForReviewArgs) {
  const children = getChildrenState({ children: childrenState });

  if (children.length === 0) {
    throw redirect(getPathById('public/apply/$id/child/children/index', params));
  }

  return children.map(({ id, dentalBenefits, dentalInsurance, information, hasFederalProvincialTerritorialBenefits }) => {
    const childId = id;

    if (information === undefined) {
      throw redirect(getPathById('public/apply/$id/child/children/$childId/information', { ...params, childId }));
    }

    if (!information.isParent) {
      throw redirect(getPathById('public/apply/$id/child/children/$childId/parent-or-guardian', { ...params, childId }));
    }

    const ageCategory = getAgeCategoryFromDateString(information.dateOfBirth);

    if (ageCategory === 'adults' || ageCategory === 'seniors') {
      throw redirect(getPathById('public/apply/$id/child/children/$childId/cannot-apply-child', { ...params, childId }));
    }

    if (dentalInsurance === undefined) {
      throw redirect(getPathById('public/apply/$id/child/children/$childId/dental-insurance', { ...params, childId }));
    }

    //TODO: refactor to allow dentalBenefits to be undefined if hasFederalProvincialTerritorialBenefits is false
    if (dentalBenefits === undefined || hasFederalProvincialTerritorialBenefits === undefined) {
      throw redirect(getPathById('public/apply/$id/child/children/$childId/confirm-federal-provincial-territorial-benefits', { ...params, childId }));
    }

    return { ageCategory, dentalBenefits, dentalInsurance, id, information, hasFederalProvincialTerritorialBenefits };
  });
}

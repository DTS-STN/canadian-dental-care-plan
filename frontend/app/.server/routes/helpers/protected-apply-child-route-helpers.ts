import { redirect } from 'react-router';

import { z } from 'zod';

import { createLogger } from '~/.server/logging';
import type { ChildrenState, ProtectedApplyState, ProtectedApplyStateParams } from '~/.server/routes/helpers/protected-apply-route-helpers';
import { applicantInformationStateHasPartner, getAgeCategoryFromDateString, getChildrenState, isNewChildState, loadProtectedApplyState, saveProtectedApplyState } from '~/.server/routes/helpers/protected-apply-route-helpers';
import { isRedirectResponse } from '~/.server/utils/response.utils';
import type { Session } from '~/.server/web/session';
import { getPathById } from '~/utils/route-utils';

interface LoadApplyChildStateArgs {
  params: ProtectedApplyStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads protected apply child state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function loadProtectedApplyChildState({ params, request, session }: LoadApplyChildStateArgs) {
  const log = createLogger('protected-apply-child-route-helpers.server/loadProtectedApplyChildState');
  const { pathname } = new URL(request.url);
  const applyState = loadProtectedApplyState({ params, session });

  if (applyState.typeOfApplication !== 'child') {
    throw redirect(getPathById('protected/apply/$id/type-application', params));
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = getPathById('protected/apply/$id/child/confirmation', params);
  if (applyState.submissionInfo && !pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has been submitted; sessionId: [%s], ', applyState.id, confirmationRouteUrl);
    throw redirect(confirmationRouteUrl);
  }

  // Redirect to the first flow page if the application has not been submitted and
  // the current route is the confirmation page.
  const termsAndConditionsRouteUrl = getPathById('protected/apply/$id/terms-and-conditions', params);
  if (!applyState.submissionInfo && pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has not been submitted; sessionId: [%s], ', applyState.id, termsAndConditionsRouteUrl);
    throw redirect(termsAndConditionsRouteUrl);
  }

  return applyState;
}

interface LoadProtectedApplyChildStateForReviewArgs {
  params: ProtectedApplyStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads the protected child state for the review page. It validates the state and throws a redirect if invalid.
 * If a redirect exception is thrown, state.editMode is set to false.
 * @param args - The arguments.
 * @returns The validated child state.
 */
export function loadProtectedApplyChildStateForReview({ params, request, session }: LoadProtectedApplyChildStateForReviewArgs) {
  const state = loadProtectedApplyChildState({ params, request, session });

  try {
    return validateProtectedApplyChildStateForReview({ params, state });
  } catch (error) {
    if (isRedirectResponse(error)) {
      saveProtectedApplyState({ params, session, state: { editMode: false } });
    }
    throw error;
  }
}

interface LoadApplySingleChildStateArgs {
  params: ProtectedApplyStateParams & { childId: string };
  request: Request;
  session: Session;
}

/**
 * Loads single protected child state from apply child state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function loadProtectedApplySingleChildState({ params, request, session }: LoadApplySingleChildStateArgs) {
  const log = createLogger('apply-child-route-helpers.server/loadProtectedApplySingleChildState');
  const applyState = loadProtectedApplyChildState({ params, request, session });

  const parsedChildId = z.string().uuid().safeParse(params.childId);

  if (!parsedChildId.success) {
    log.warn('Invalid "childId" param format; childId: [%s]', params.childId);
    throw redirect(getPathById('protected/apply/$id/child/children/index', params));
  }

  const childId = parsedChildId.data;
  const childStateIndex = applyState.children.findIndex(({ id }) => id === childId);

  if (childStateIndex === -1) {
    log.warn('Protected apply single child has not been found; childId: [%s]', childId);
    throw redirect(getPathById('protected/apply/$id/child/children/index', params));
  }

  const childState = applyState.children[childStateIndex];
  const isNew = isNewChildState(childState);
  const editMode = !isNew && applyState.editMode;

  return { ...childState, childNumber: childStateIndex + 1, editMode, isNew };
}

interface ValidateProtectedStateForReviewArgs {
  params: ProtectedApplyStateParams;
  state: ProtectedApplyState;
}

export function validateProtectedApplyChildStateForReview({ params, state }: ValidateProtectedStateForReviewArgs) {
  const {
    applicantInformation,
    applicationYear,
    communicationPreferences,
    contactInformation,
    editMode,
    email,
    emailVerified,
    hasFiledTaxes,
    homeAddress,
    id,
    isHomeAddressSameAsMailingAddress,
    lastUpdatedOn,
    mailingAddress,
    maritalStatus,
    newOrExistingMember,
    partnerInformation,
    submissionInfo,
    termsAndConditions,
    typeOfApplication,
  } = state;

  if (termsAndConditions === undefined) {
    throw redirect(getPathById('protected/apply/$id/terms-and-conditions', params));
  }

  if (typeOfApplication === undefined) {
    throw redirect(getPathById('protected/apply/$id/type-application', params));
  }

  if (typeOfApplication === 'delegate') {
    throw redirect(getPathById('protected/apply/$id/application-delegate', params));
  }

  if (typeOfApplication !== 'child') {
    throw redirect(getPathById('protected/apply/$id/type-application', params));
  }

  if (hasFiledTaxes === undefined) {
    throw redirect(getPathById('protected/apply/$id/tax-filing', params));
  }

  if (hasFiledTaxes === false) {
    throw redirect(getPathById('protected/apply/$id/file-taxes', params));
  }

  const children = validateChildrenStateForReview({ childrenState: state.children, params });

  if (applicantInformation === undefined) {
    throw redirect(getPathById('protected/apply/$id/child/applicant-information', params));
  }

  const ageCategory = getAgeCategoryFromDateString(applicantInformation.dateOfBirth);

  if (ageCategory === 'children') {
    throw redirect(getPathById('protected/apply/$id/child/contact-apply-child', params));
  }

  if (applicantInformationStateHasPartner(maritalStatus) && !partnerInformation) {
    throw redirect(getPathById('protected/apply/$id/child/marital-status', params));
  }

  if (!applicantInformationStateHasPartner(maritalStatus) && partnerInformation) {
    throw redirect(getPathById('protected/apply/$id/child/marital-status', params));
  }

  if (contactInformation === undefined) {
    throw redirect(getPathById('protected/apply/$id/child/phone-number', params));
  }

  if (communicationPreferences === undefined) {
    throw redirect(getPathById('protected/apply/$id/child/communication-preference', params));
  }

  return {
    ageCategory,
    applicantInformation,
    applicationYear,
    children,
    communicationPreferences,
    contactInformation,
    editMode,
    email,
    emailVerified,
    hasFiledTaxes,
    homeAddress,
    id,
    isHomeAddressSameAsMailingAddress,
    lastUpdatedOn,
    mailingAddress,
    maritalStatus,
    newOrExistingMember,
    partnerInformation,
    submissionInfo,
    termsAndConditions,
    typeOfApplication,
  };
}

interface ValidateProtectedChildrenStateForReviewArgs {
  childrenState: ChildrenState;
  params: ProtectedApplyStateParams;
}

function validateChildrenStateForReview({ childrenState, params }: ValidateProtectedChildrenStateForReviewArgs) {
  const children = getChildrenState({ children: childrenState });

  if (children.length === 0) {
    throw redirect(getPathById('protected/apply/$id/child/children/index', params));
  }

  return children.map(({ id, dentalBenefits, dentalInsurance, information, hasFederalProvincialTerritorialBenefits }) => {
    const childId = id;

    if (information === undefined) {
      throw redirect(getPathById('protected/apply/$id/child/children/$childId/information', { ...params, childId }));
    }

    if (!information.isParent) {
      throw redirect(getPathById('protected/apply/$id/child/children/$childId/parent-or-guardian', { ...params, childId }));
    }

    const ageCategory = getAgeCategoryFromDateString(information.dateOfBirth);

    if (ageCategory === 'adults' || ageCategory === 'seniors') {
      throw redirect(getPathById('protected/apply/$id/child/children/$childId/cannot-apply-child', { ...params, childId }));
    }

    if (dentalInsurance === undefined) {
      throw redirect(getPathById('protected/apply/$id/child/children/$childId/dental-insurance', { ...params, childId }));
    }

    if (hasFederalProvincialTerritorialBenefits === undefined) {
      throw redirect(getPathById('protected/apply/$id/child/children/$childId/confirm-federal-provincial-territorial-benefits', { ...params, childId }));
    }

    if (dentalBenefits === undefined && hasFederalProvincialTerritorialBenefits === true) {
      throw redirect(getPathById('protected/apply/$id/child/children/$childId/confirm-federal-provincial-territorial-benefits', { ...params, childId }));
    }

    return {
      ageCategory,
      dentalBenefits,
      dentalInsurance,
      id,
      information,
      hasFederalProvincialTerritorialBenefits,
    };
  });
}

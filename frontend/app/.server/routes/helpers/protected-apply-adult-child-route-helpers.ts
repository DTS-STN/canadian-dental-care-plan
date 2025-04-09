import { redirect } from 'react-router';

import { z } from 'zod';

import type { ChildrenState, ProtectedApplyState, ProtectedApplyStateParams } from './protected-apply-route-helpers';

import { createLogger } from '~/.server/logging';
import { applicantInformationStateHasPartner, getAgeCategoryFromDateString, getChildrenState, isNewChildState, loadProtectedApplyState, saveProtectedApplyState } from '~/.server/routes/helpers/protected-apply-route-helpers';
import { isRedirectResponse } from '~/.server/utils/response.utils';
import type { Session } from '~/.server/web/session';
import { getPathById } from '~/utils/route-utils';

interface LoadProtectedApplyAdultChildStateArgs {
  params: ProtectedApplyStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads apply adult child(ren) state.
 * @param args - The arguments.
 * @returns The loaded adult child(ren) state.
 */
export function loadProtectedApplyAdultChildState({ params, request, session }: LoadProtectedApplyAdultChildStateArgs) {
  const log = createLogger('protected-apply-adult-child-route-helpers.server/loadProtectedApplyAdultChildState');
  const { pathname } = new URL(request.url);
  const protectedApplyState = loadProtectedApplyState({ params, session });

  if (protectedApplyState.typeOfApplication !== 'adult-child') {
    throw redirect(getPathById('protected/apply/$id/type-application', params));
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = getPathById('protected/apply/$id/adult-child/confirmation', params);
  if (protectedApplyState.submissionInfo && !pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has been submitted; sessionId: [%s], ', protectedApplyState.id, confirmationRouteUrl);
    throw redirect(confirmationRouteUrl);
  }

  // Redirect to the first flow page if the application has not been submitted and
  // the current route is the confirmation page.
  const termsAndConditionsRouteUrl = getPathById('protected/apply/$id/terms-and-conditions', params);
  if (!protectedApplyState.submissionInfo && pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has not been submitted; sessionId: [%s], ', protectedApplyState.id, termsAndConditionsRouteUrl);
    throw redirect(termsAndConditionsRouteUrl);
  }

  return protectedApplyState;
}

interface LoadProtectedApplyAdultSingleChildStateArgs {
  params: ProtectedApplyStateParams & { childId: string };
  request: Request;
  session: Session;
}

/**
 * Loads single child state from apply adult child state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function loadProtectedApplyAdultSingleChildState({ params, request, session }: LoadProtectedApplyAdultSingleChildStateArgs) {
  const log = createLogger('protected-apply-adult-child-route-helpers.server/loadProtectedApplyAdultSingleChildState');
  const protectedApplyState = loadProtectedApplyAdultChildState({ params, request, session });

  const parsedChildId = z.string().uuid().safeParse(params.childId);

  if (!parsedChildId.success) {
    log.warn('Invalid "childId" param format; childId: [%s]', params.childId);
    throw redirect(getPathById('protected/apply/$id/adult-child/children/index', params));
  }

  const childId = parsedChildId.data;
  const childStateIndex = protectedApplyState.children.findIndex(({ id }) => id === childId);

  if (childStateIndex === -1) {
    log.warn('Apply single child has not been found; childId: [%s]', childId);
    throw redirect(getPathById('protected/apply/$id/adult-child/children/index', params));
  }

  const childState = protectedApplyState.children[childStateIndex];
  const isNew = isNewChildState(childState);
  const editMode = !isNew && protectedApplyState.editMode;

  return { ...childState, childNumber: childStateIndex + 1, editMode, isNew };
}

interface LoadProtectedApplyAdultChildStateForReviewArgs {
  params: ProtectedApplyStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads the adult-child state for the review page. It validates the state and throws a redirect if invalid.
 * If a redirect exception is thrown, state.editMode is set to false.
 * @param args - The arguments.
 * @returns The validated adult-child state.
 */
export function loadProtectedApplyAdultChildStateForReview({ params, request, session }: LoadProtectedApplyAdultChildStateForReviewArgs) {
  const state = loadProtectedApplyAdultChildState({ params, request, session });

  try {
    return validateProtectedApplyAdultChildStateForReview({ params, state });
  } catch (err) {
    if (isRedirectResponse(err)) {
      saveProtectedApplyState({ params, session, state: { editMode: false } });
    }
    throw err;
  }
}

interface ValidateProtectedApplyAdultChildStateForReviewArgs {
  params: ProtectedApplyStateParams;
  state: ProtectedApplyState;
}

export function validateProtectedApplyAdultChildStateForReview({ params, state }: ValidateProtectedApplyAdultChildStateForReviewArgs) {
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
    throw redirect(getPathById('protected/apply/$id/terms-and-conditions', params));
  }

  if (typeOfApplication === undefined) {
    throw redirect(getPathById('protected/apply/$id/type-application', params));
  }

  if (typeOfApplication === 'delegate') {
    throw redirect(getPathById('protected/apply/$id/application-delegate', params));
  }

  if (typeOfApplication !== 'adult-child') {
    throw redirect(getPathById('protected/apply/$id/type-application', params));
  }

  if (hasFiledTaxes === undefined) {
    throw redirect(getPathById('protected/apply/$id/tax-filing', params));
  }

  if (hasFiledTaxes === false) {
    throw redirect(getPathById('protected/apply/$id/file-taxes', params));
  }

  if (applicantInformation === undefined) {
    throw redirect(getPathById('protected/apply/$id/adult-child/applicant-information', params));
  }

  const ageCategory = getAgeCategoryFromDateString(applicantInformation.dateOfBirth);

  if (ageCategory === 'children') {
    throw redirect(getPathById('protected/apply/$id/adult-child/parent-or-guardian', params));
  }

  if (applicantInformationStateHasPartner(maritalStatus) && !partnerInformation) {
    throw redirect(getPathById('protected/apply/$id/adult-child/marital-status', params));
  }

  if (!applicantInformationStateHasPartner(maritalStatus) && partnerInformation) {
    throw redirect(getPathById('protected/apply/$id/adult-child/marital-status', params));
  }

  if (contactInformation === undefined) {
    throw redirect(getPathById('protected/apply/$id/adult-child/phone-number', params));
  }

  if (communicationPreferences === undefined) {
    throw redirect(getPathById('protected/apply/$id/adult-child/communication-preference', params));
  }

  if (dentalInsurance === undefined) {
    throw redirect(getPathById('protected/apply/$id/adult-child/dental-insurance', params));
  }

  if (hasFederalProvincialTerritorialBenefits === undefined) {
    throw redirect(getPathById('protected/apply/$id/adult-child/confirm-federal-provincial-territorial-benefits', params));
  }

  if (dentalBenefits === undefined && hasFederalProvincialTerritorialBenefits === true) {
    throw redirect(getPathById('protected/apply/$id/adult-child/federal-provincial-territorial-benefits', params));
  }

  const children = validateChildrenStateForReview({ childrenState: state.children, params });

  return {
    ageCategory,
    applicantInformation,
    applicationYear,
    children,
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
  };
}

interface ValidateChildrenStateForReviewArgs {
  childrenState: ChildrenState;
  params: ProtectedApplyStateParams;
}

function validateChildrenStateForReview({ childrenState, params }: ValidateChildrenStateForReviewArgs) {
  const children = getChildrenState({ children: childrenState });

  if (children.length === 0) {
    throw redirect(getPathById('protected/apply/$id/adult-child/children/index', params));
  }

  return children.map(({ id, dentalBenefits, dentalInsurance, information, hasFederalProvincialTerritorialBenefits }) => {
    const childId = id;

    if (information === undefined) {
      throw redirect(getPathById('protected/apply/$id/adult-child/children/$childId/information', { ...params, childId }));
    }

    if (!information.isParent) {
      throw redirect(getPathById('protected/apply/$id/adult-child/children/$childId/parent-or-guardian', { ...params, childId }));
    }

    const ageCategory = getAgeCategoryFromDateString(information.dateOfBirth);

    if (ageCategory === 'adults' || ageCategory === 'seniors') {
      throw redirect(getPathById('protected/apply/$id/adult-child/children/$childId/cannot-apply-child', { ...params, childId }));
    }

    if (dentalInsurance === undefined) {
      throw redirect(getPathById('protected/apply/$id/adult-child/children/$childId/dental-insurance', { ...params, childId }));
    }

    if (hasFederalProvincialTerritorialBenefits === undefined) {
      throw redirect(getPathById('protected/apply/$id/adult-child/children/$childId/confirm-federal-provincial-territorial-benefits', { ...params, childId }));
    }

    if (dentalBenefits === undefined && hasFederalProvincialTerritorialBenefits === true) {
      throw redirect(getPathById('protected/apply/$id/adult-child/children/$childId/federal-provincial-territorial-benefits', { ...params, childId }));
    }

    return {
      ageCategory,
      id,
      dentalBenefits,
      dentalInsurance,
      information,
      hasFederalProvincialTerritorialBenefits,
    };
  });
}

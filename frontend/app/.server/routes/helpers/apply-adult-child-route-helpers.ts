import { redirect } from 'react-router';

import { z } from 'zod';

import { createLogger } from '~/.server/logging';
import type { ApplyState, ApplyStateParams, ChildrenState } from '~/.server/routes/helpers/apply-route-helpers';
import { applicantInformationStateHasPartner, getAgeCategoryFromDateString, getChildrenState, isNewChildState, loadApplyState, saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { isRedirectResponse } from '~/.server/utils/response.utils';
import type { Session } from '~/.server/web/session';
import { getPathById } from '~/utils/route-utils';

interface LoadApplyAdultChildStateArgs {
  params: ApplyStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads apply adult child(ren) state.
 * @param args - The arguments.
 * @returns The loaded adult child(ren) state.
 */
export function loadApplyAdultChildState({ params, request, session }: LoadApplyAdultChildStateArgs) {
  const log = createLogger('apply-adult-child-route-helpers.server/loadApplyAdultChildState');
  const { pathname } = new URL(request.url);
  const applyState = loadApplyState({ params, session });

  if (applyState.typeOfApplication !== 'adult-child') {
    throw redirect(getPathById('public/apply/$id/type-application', params));
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = getPathById('public/apply/$id/adult-child/confirmation', params);
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

interface LoadApplyAdultSingleChildStateArgs {
  params: ApplyStateParams & { childId: string };
  request: Request;
  session: Session;
}

/**
 * Loads single child state from apply adult child state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function loadApplyAdultSingleChildState({ params, request, session }: LoadApplyAdultSingleChildStateArgs) {
  const log = createLogger('apply-adult-child-route-helpers.server/loadApplyAdultSingleChildState');
  const applyState = loadApplyAdultChildState({ params, request, session });

  const parsedChildId = z.string().uuid().safeParse(params.childId);

  if (!parsedChildId.success) {
    log.warn('Invalid "childId" param format; childId: [%s]', params.childId);
    throw redirect(getPathById('public/apply/$id/adult-child/children/index', params));
  }

  const childId = parsedChildId.data;
  const childStateIndex = applyState.children.findIndex(({ id }) => id === childId);

  if (childStateIndex === -1) {
    log.warn('Apply single child has not been found; childId: [%s]', childId);
    throw redirect(getPathById('public/apply/$id/adult-child/children/index', params));
  }

  const childState = applyState.children[childStateIndex];
  const isNew = isNewChildState(childState);
  const editMode = !isNew && applyState.editMode;

  return { ...childState, childNumber: childStateIndex + 1, editMode, isNew };
}

interface LoadApplyAdultChildStateForReviewArgs {
  params: ApplyStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads the adult-child state for the review page. It validates the state and throws a redirect if invalid.
 * If a redirect exception is thrown, state.editMode is set to false.
 * @param args - The arguments.
 * @returns The validated adult-child state.
 */
export function loadApplyAdultChildStateForReview({ params, request, session }: LoadApplyAdultChildStateForReviewArgs) {
  const state = loadApplyAdultChildState({ params, request, session });

  try {
    return validateApplyAdultChildStateForReview({ params, state });
  } catch (error) {
    if (isRedirectResponse(error)) {
      saveApplyState({ params, session, state: { editMode: false } });
    }
    throw error;
  }
}

interface ValidateApplyAdultChildStateForReviewArgs {
  params: ApplyStateParams;
  state: ApplyState;
}

export function validateApplyAdultChildStateForReview({ params, state }: ValidateApplyAdultChildStateForReviewArgs) {
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

  if (typeOfApplication !== 'adult-child') {
    throw redirect(getPathById('public/apply/$id/type-application', params));
  }

  if (hasFiledTaxes === undefined) {
    throw redirect(getPathById('public/apply/$id/tax-filing', params));
  }

  if (hasFiledTaxes === false) {
    throw redirect(getPathById('public/apply/$id/file-taxes', params));
  }

  if (applicantInformation === undefined) {
    throw redirect(getPathById('public/apply/$id/adult-child/applicant-information', params));
  }

  const ageCategory = getAgeCategoryFromDateString(applicantInformation.dateOfBirth);

  if (ageCategory === 'children') {
    throw redirect(getPathById('public/apply/$id/adult-child/parent-or-guardian', params));
  }

  if (applicantInformationStateHasPartner(maritalStatus) && !partnerInformation) {
    throw redirect(getPathById('public/apply/$id/adult-child/marital-status', params));
  }

  if (!applicantInformationStateHasPartner(maritalStatus) && partnerInformation) {
    throw redirect(getPathById('public/apply/$id/adult-child/marital-status', params));
  }

  if (contactInformation === undefined) {
    throw redirect(getPathById('public/apply/$id/adult-child/phone-number', params));
  }

  if (communicationPreferences === undefined) {
    throw redirect(getPathById('public/apply/$id/adult-child/communication-preference', params));
  }

  if (dentalInsurance === undefined) {
    throw redirect(getPathById('public/apply/$id/adult-child/dental-insurance', params));
  }

  if (hasFederalProvincialTerritorialBenefits === undefined) {
    throw redirect(getPathById('public/apply/$id/adult-child/confirm-federal-provincial-territorial-benefits', params));
  }

  if (dentalBenefits === undefined && hasFederalProvincialTerritorialBenefits === true) {
    throw redirect(getPathById('public/apply/$id/adult-child/federal-provincial-territorial-benefits', params));
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
  params: ApplyStateParams;
}

function validateChildrenStateForReview({ childrenState, params }: ValidateChildrenStateForReviewArgs) {
  const children = getChildrenState({ children: childrenState });

  if (children.length === 0) {
    throw redirect(getPathById('public/apply/$id/adult-child/children/index', params));
  }

  return children.map(({ id, dentalBenefits, dentalInsurance, information, hasFederalProvincialTerritorialBenefits }) => {
    const childId = id;

    if (information === undefined) {
      throw redirect(getPathById('public/apply/$id/adult-child/children/$childId/information', { ...params, childId }));
    }

    if (!information.isParent) {
      throw redirect(getPathById('public/apply/$id/adult-child/children/$childId/parent-or-guardian', { ...params, childId }));
    }

    const ageCategory = getAgeCategoryFromDateString(information.dateOfBirth);

    if (ageCategory === 'adults' || ageCategory === 'seniors') {
      throw redirect(getPathById('public/apply/$id/adult-child/children/$childId/cannot-apply-child', { ...params, childId }));
    }

    if (dentalInsurance === undefined) {
      throw redirect(getPathById('public/apply/$id/adult-child/children/$childId/dental-insurance', { ...params, childId }));
    }

    if (hasFederalProvincialTerritorialBenefits === undefined) {
      throw redirect(getPathById('public/apply/$id/adult-child/children/$childId/confirm-federal-provincial-territorial-benefits', { ...params, childId }));
    }

    if (dentalBenefits === undefined && hasFederalProvincialTerritorialBenefits === true) {
      throw redirect(getPathById('public/apply/$id/adult-child/children/$childId/federal-provincial-territorial-benefits', { ...params, childId }));
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

import { redirect } from 'react-router';

import { z } from 'zod';

import { createLogger } from '~/.server/logging';
import type { ChildState, RenewState, RenewStateParams } from '~/.server/routes/helpers/renew-route-helpers';
import { getChildrenState, isNewChildState, loadRenewState, saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { isRedirectResponse } from '~/.server/utils/response.utils';
import type { Session } from '~/.server/web/session';
import { getPathById } from '~/utils/route-utils';

interface LoadRenewChildStateArgs {
  params: RenewStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads renew child state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function loadRenewChildState({ params, request, session }: LoadRenewChildStateArgs) {
  const log = createLogger('renew-child-route-helpers.server/loadRenewChildState');
  const { pathname } = new URL(request.url);
  const renewState = loadRenewState({ params, session });

  if (renewState.typeOfRenewal !== 'child') {
    throw redirect(getPathById('public/renew/$id/type-renewal', params));
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = getPathById('public/renew/$id/child/confirmation', params);
  if (renewState.submissionInfo && !pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has been submitted; sessionId: [%s], ', renewState.id, confirmationRouteUrl);
    throw redirect(confirmationRouteUrl);
  }

  // Redirect to the first flow page if the application has not been submitted and
  // the current route is the confirmation page.
  const termsAndConditionsRouteUrl = getPathById('public/renew/$id/terms-and-conditions', params);
  if (!renewState.submissionInfo && pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has not been submitted; sessionId: [%s], ', renewState.id, termsAndConditionsRouteUrl);
    throw redirect(termsAndConditionsRouteUrl);
  }

  return renewState;
}

interface LoadRenewChildStateForReviewArgs {
  params: RenewStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads the child state for the review page. It validates the state and throws a redirect if invalid.
 * If a redirect exception is thrown, state.editMode is set to false.
 * @param args - The arguments.
 * @returns The validated child state.
 */
export function loadRenewChildStateForReview({ params, request, session }: LoadRenewChildStateForReviewArgs) {
  const state = loadRenewChildState({ params, request, session });

  try {
    return validateRenewChildStateForReview({ params, state });
  } catch (error) {
    if (isRedirectResponse(error)) {
      saveRenewState({ params, session, state: { editMode: false } });
    }
    throw error;
  }
}

interface LoadRenewSingleChildStateArgs {
  params: RenewStateParams & { childId: string };
  request: Request;
  session: Session;
}

/**
 * Loads single child state from renew child state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function loadRenewSingleChildState({ params, request, session }: LoadRenewSingleChildStateArgs) {
  const log = createLogger('renew-child-route-helpers.server/loadRenewSingleChildState');
  const renewState = loadRenewChildState({ params, request, session });

  const parsedChildId = z.string().uuid().safeParse(params.childId);

  if (!parsedChildId.success) {
    log.warn('Invalid "childId" param format; childId: [%s]', params.childId);
    throw redirect(getPathById('public/renew/$id/child/children/index', params));
  }

  const childId = parsedChildId.data;
  const childStateIndex = renewState.children.findIndex(({ id }) => id === childId);

  if (childStateIndex === -1) {
    log.warn('Renew single child has not been found; childId: [%s]', childId);
    throw redirect(getPathById('public/renew/$id/child/children/index', params));
  }

  const childState = renewState.children[childStateIndex];
  const isNew = isNewChildState(childState);
  const editMode = !isNew && renewState.editMode;

  return {
    ...childState,
    childNumber: childStateIndex + 1,
    editMode,
    isNew,
  };
}

interface ValidateStateForReviewArgs {
  params: RenewStateParams;
  state: RenewState;
}

export function validateRenewChildStateForReview({ params, state }: ValidateStateForReviewArgs) {
  const {
    applicationYear,
    hasFederalProvincialTerritorialBenefitsChanged,
    clientApplication,
    hasMaritalStatusChanged,
    hasAddressChanged,
    isHomeAddressSameAsMailingAddress,
    mailingAddress,
    homeAddress,
    maritalStatus,
    partnerInformation,
    contactInformation,
    communicationPreferences,
    email,
    editMode,
    id,
    submissionInfo,
    typeOfRenewal,
    applicantInformation,
    emailVerified,
  } = state;

  if (typeOfRenewal === undefined) {
    throw redirect(getPathById('public/renew/$id/type-renewal', params));
  }

  if (typeOfRenewal === 'delegate') {
    throw redirect(getPathById('public/renew/$id/renewal-delegate', params));
  }

  if (typeOfRenewal !== 'child') {
    throw redirect(getPathById('public/renew/$id/type-renewal', params));
  }

  if (applicantInformation === undefined) {
    throw redirect(getPathById('public/renew/$id/applicant-information', params));
  }

  if (clientApplication === undefined) {
    throw redirect(getPathById('public/renew/$id/applicant-information', params));
  }

  if (hasMaritalStatusChanged === undefined) {
    throw redirect(getPathById('public/renew/$id/child/confirm-marital-status', params));
  }

  if (hasMaritalStatusChanged && maritalStatus === undefined) {
    throw redirect(getPathById('public/renew/$id/child/confirm-marital-status', params));
  }

  if (communicationPreferences === undefined) {
    throw redirect(getPathById('public/renew/$id/child/communication-preference', params));
  }

  if (hasAddressChanged === undefined) {
    throw redirect(getPathById('public/renew/$id/child/confirm-address', params));
  }

  if (hasAddressChanged && mailingAddress === undefined) {
    throw redirect(getPathById('public/renew/$id/child/update-mailing-address', params));
  }

  if (hasAddressChanged && !isHomeAddressSameAsMailingAddress && homeAddress === undefined) {
    throw redirect(getPathById('public/renew/$id/child/update-home-address', params));
  }

  if (contactInformation?.isNewOrUpdatedPhoneNumber === undefined) {
    throw redirect(getPathById('public/renew/$id/child/confirm-phone', params));
  }

  const children = validateChildrenStateForReview({ childrenState: state.children, params });

  return {
    applicationYear,
    maritalStatus,
    editMode,
    id,
    submissionInfo,
    typeOfRenewal,
    contactInformation,
    communicationPreferences,
    email,
    applicantInformation,
    partnerInformation,
    children,
    hasFederalProvincialTerritorialBenefitsChanged,
    hasMaritalStatusChanged,
    hasAddressChanged,
    isHomeAddressSameAsMailingAddress,
    mailingAddress,
    homeAddress,
    clientApplication,
    emailVerified,
  };
}

interface ValidateChildrenStateForReviewArgs {
  childrenState: ChildState[];
  params: RenewStateParams;
}

export function validateChildrenStateForReview({ childrenState, params }: ValidateChildrenStateForReviewArgs) {
  const children = getChildrenState({ children: childrenState });

  if (children.length === 0) {
    throw redirect(getPathById('public/renew/$id/child/children/index', params));
  }

  return children.map(({ id, dentalBenefits, dentalInsurance, information, demographicSurvey, hasFederalProvincialTerritorialBenefitsChanged }) => {
    const childId = id;

    if (information === undefined) {
      throw redirect(getPathById('public/renew/$id/child/children/$childId/information', { ...params, childId }));
    }

    if (!information.isParent) {
      throw redirect(getPathById('public/renew/$id/child/children/$childId/parent-or-guardian', { ...params, childId }));
    }

    if (dentalInsurance === undefined) {
      throw redirect(getPathById('public/renew/$id/child/children/$childId/dental-insurance', { ...params, childId }));
    }

    if (hasFederalProvincialTerritorialBenefitsChanged === undefined) {
      throw redirect(getPathById('public/renew/$id/child/children/$childId/confirm-federal-provincial-territorial-benefits', { ...params, childId }));
    }

    if (hasFederalProvincialTerritorialBenefitsChanged && dentalBenefits === undefined) {
      throw redirect(getPathById('public/renew/$id/child/children/$childId/update-federal-provincial-territorial-benefits', { ...params, childId }));
    }

    return {
      id,
      dentalBenefits,
      dentalInsurance,
      information,
      demographicSurvey,
      hasFederalProvincialTerritorialBenefitsChanged,
    };
  });
}

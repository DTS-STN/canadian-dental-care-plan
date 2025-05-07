import { redirect } from 'react-router';

import { z } from 'zod';

import { createLogger } from '~/.server/logging';
import { getChildrenState, isNewChildState, loadRenewState, saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import type { ChildState, RenewState, RenewStateParams } from '~/.server/routes/helpers/renew-route-helpers';
import { isRedirectResponse } from '~/.server/utils/response.utils';
import type { Session } from '~/.server/web/session';
import { getPathById } from '~/utils/route-utils';

interface LoadRenewAdultChildStateArgs {
  params: RenewStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads renew AdultChild state.
 * @param args - The arguments.
 * @returns The loaded AdultChild state.
 */
export function loadRenewAdultChildState({ params, request, session }: LoadRenewAdultChildStateArgs) {
  const log = createLogger('renew-adult-child-route-helpers.server/loadRenewAdultChildState');
  const { pathname } = new URL(request.url);
  const renewState = loadRenewState({ params, session });

  if (renewState.typeOfRenewal !== 'adult-child') {
    throw redirect(getPathById('public/renew/$id/type-renewal', params));
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = getPathById('public/renew/$id/adult-child/confirmation', params);
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

interface LoadRenewAdultSingleChildStateArgs {
  params: RenewStateParams & { childId: string };
  request: Request;
  session: Session;
}

/**
 * Loads single child state from renew adult child state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function loadRenewAdultSingleChildState({ params, request, session }: LoadRenewAdultSingleChildStateArgs) {
  const log = createLogger('renew-adult-child-route-helpers.server/loadRenewAdultSingleChildState');
  const applyState = loadRenewAdultChildState({ params, request, session });

  const parsedChildId = z.string().uuid().safeParse(params.childId);

  if (!parsedChildId.success) {
    log.warn('Invalid "childId" param format; childId: [%s]', params.childId);
    throw redirect(getPathById('public/renew/$id/adult-child/children/index', params));
  }

  const childId = parsedChildId.data;
  const childStateIndex = applyState.children.findIndex(({ id }) => id === childId);

  if (childStateIndex === -1) {
    log.warn('Apply single child has not been found; childId: [%s]', childId);
    throw redirect(getPathById('public/renew/$id/adult-child/children/index', params));
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

interface LoadRenewAdultChildStateForReviewArgs {
  params: RenewStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads the renewal state for the review page. It validates the state and throws a redirect if invalid.
 * If a redirect exception is thrown, state.editMode is set to false.
 * @param args - The arguments.
 * @returns The validated adult state.
 */
export function loadRenewAdultChildStateForReview({ params, request, session }: LoadRenewAdultChildStateForReviewArgs) {
  const state = loadRenewAdultChildState({ params, request, session });

  try {
    return validateRenewAdultChildStateForReview({ params, state });
  } catch (error) {
    if (isRedirectResponse(error)) {
      saveRenewState({ params, session, state: { editMode: false } });
    }
    throw error;
  }
}

interface ValidateRenewAdultChildStateForReviewArgs {
  params: RenewStateParams;
  state: RenewState;
}

export function validateRenewAdultChildStateForReview({ params, state }: ValidateRenewAdultChildStateForReviewArgs) {
  const {
    applicationYear,
    hasMaritalStatusChanged,
    hasAddressChanged,
    maritalStatus,
    partnerInformation,
    contactInformation,
    editMode,
    id,
    submissionInfo,
    typeOfRenewal,
    homeAddress,
    mailingAddress,
    applicantInformation,
    clientApplication,
    dentalBenefits,
    dentalInsurance,
    demographicSurvey,
    hasFederalProvincialTerritorialBenefitsChanged,
    isHomeAddressSameAsMailingAddress,
  } = state;

  if (typeOfRenewal === undefined) {
    throw redirect(getPathById('public/renew/$id/type-renewal', params));
  }

  if (typeOfRenewal === 'delegate') {
    throw redirect(getPathById('public/renew/$id/renewal-delegate', params));
  }

  if (typeOfRenewal !== 'adult-child') {
    throw redirect(getPathById('public/renew/$id/type-renewal', params));
  }

  if (applicantInformation === undefined) {
    throw redirect(getPathById('public/renew/$id/applicant-information', params));
  }

  if (clientApplication === undefined) {
    throw redirect(getPathById('public/renew/$id/applicant-information', params));
  }

  if (hasMaritalStatusChanged === undefined) {
    throw redirect(getPathById('public/renew/$id/adult-child/confirm-marital-status', params));
  }

  if (hasMaritalStatusChanged && maritalStatus === undefined) {
    throw redirect(getPathById('public/renew/$id/adult-child/confirm-marital-status', params));
  }

  if (hasAddressChanged === undefined) {
    throw redirect(getPathById('public/renew/$id/adult-child/confirm-address', params));
  }

  if (hasAddressChanged && mailingAddress === undefined) {
    throw redirect(getPathById('public/renew/$id/adult-child/update-mailing-address', params));
  }

  if (contactInformation?.isNewOrUpdatedPhoneNumber === undefined) {
    throw redirect(getPathById('public/renew/$id/adult-child/confirm-phone', params));
  }

  if (contactInformation.isNewOrUpdatedEmail === undefined) {
    throw redirect(getPathById('public/renew/$id/adult-child/confirm-email', params));
  }

  if (dentalInsurance === undefined) {
    throw redirect(getPathById('public/renew/$id/adult-child/dental-insurance', params));
  }

  if (hasFederalProvincialTerritorialBenefitsChanged === undefined) {
    throw redirect(getPathById('public/renew/$id/adult-child/confirm-federal-provincial-territorial-benefits', params));
  }

  if (hasFederalProvincialTerritorialBenefitsChanged && dentalBenefits === undefined) {
    throw redirect(getPathById('public/renew/$id/adult-child/update-federal-provincial-territorial-benefits', params));
  }

  const children = getChildrenState(state).length > 0 ? validateChildrenStateForReview({ childrenState: state.children, params }) : [];

  return {
    applicationYear,
    hasMaritalStatusChanged,
    maritalStatus,
    editMode,
    id,
    submissionInfo,
    typeOfRenewal,
    clientApplication,
    contactInformation,
    applicantInformation,
    dentalBenefits,
    dentalInsurance,
    homeAddress,
    mailingAddress,
    partnerInformation,
    children,
    hasAddressChanged,
    demographicSurvey,
    hasFederalProvincialTerritorialBenefitsChanged,
    isHomeAddressSameAsMailingAddress,
  };
}

interface ValidateChildrenStateForReviewArgs {
  childrenState: ChildState[];
  params: RenewStateParams;
}

function validateChildrenStateForReview({ childrenState, params }: ValidateChildrenStateForReviewArgs) {
  const children = getChildrenState({ children: childrenState });

  if (children.length === 0) {
    throw redirect(getPathById('public/renew/$id/adult-child/children/index', params));
  }

  return children.map(({ id, dentalBenefits, dentalInsurance, information, demographicSurvey, hasFederalProvincialTerritorialBenefitsChanged }) => {
    const childId = id;

    if (information === undefined) {
      throw redirect(getPathById('public/renew/$id/adult-child/children/$childId/information', { ...params, childId }));
    }

    if (!information.isParent) {
      throw redirect(getPathById('public/renew/$id/adult-child/children/$childId/parent-or-guardian', { ...params, childId }));
    }

    if (dentalInsurance === undefined) {
      throw redirect(getPathById('public/renew/$id/adult-child/children/$childId/dental-insurance', { ...params, childId }));
    }

    if (hasFederalProvincialTerritorialBenefitsChanged === undefined) {
      throw redirect(getPathById('public/renew/$id/adult-child/children/$childId/confirm-federal-provincial-territorial-benefits', { ...params, childId }));
    }

    if (hasFederalProvincialTerritorialBenefitsChanged && dentalBenefits === undefined) {
      throw redirect(getPathById('public/renew/$id/adult-child/children/$childId/update-federal-provincial-territorial-benefits', { ...params, childId }));
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

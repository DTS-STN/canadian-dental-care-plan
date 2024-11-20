import type { Session } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import type { Params } from '@remix-run/react';
import { isRedirectResponse, isResponse } from '@remix-run/server-runtime/dist/responses';

import { z } from 'zod';

import type { ChildState, RenewState } from './renew-route-helpers';
import { getChildrenState, isNewChildState, loadRenewState, saveRenewState } from './renew-route-helpers';
import { getLogger } from '~/utils/logging.server';
import { getPathById } from '~/utils/route-utils';

interface LoadRenewChildStateArgs {
  params: Params;
  request: Request;
  session: Session;
}

/**
 * Loads renew child state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function loadRenewChildState({ params, request, session }: LoadRenewChildStateArgs) {
  const log = getLogger('renew-child-route-helpers.server/loadRenewChildState');
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
  params: Params;
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
  } catch (err) {
    if (isResponse(err) && isRedirectResponse(err)) {
      saveRenewState({ params, session, state: { editMode: false } });
    }
    throw err;
  }
}

interface LoadRenewSingleChildStateArgs {
  params: Params;
  request: Request;
  session: Session;
}

/**
 * Loads single child state from renew child state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function loadRenewSingleChildState({ params, request, session }: LoadRenewSingleChildStateArgs) {
  const log = getLogger('renew-child-route-helpers.server/loadRenewSingleChildState');
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
  params: Params;
  state: RenewState;
}

export function validateRenewChildStateForReview({ params, state }: ValidateStateForReviewArgs) {
  const { hasAddressChanged, maritalStatus, partnerInformation, contactInformation, editMode, id, submissionInfo, typeOfRenewal, addressInformation, applicantInformation } = state;

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

  if (maritalStatus === undefined) {
    throw redirect(getPathById('public/renew/$id/child/marital-status', params));
  }

  if (hasAddressChanged && addressInformation === undefined) {
    throw redirect(getPathById('public/renew/$id/child/update-address', params));
  }

  if (contactInformation?.isNewOrUpdatedPhoneNumber === undefined) {
    throw redirect(getPathById('public/renew/$id/confirm-phone', params));
  }

  if (contactInformation.isNewOrUpdatedEmail === undefined) {
    throw redirect(getPathById('public/renew/$id/confirm-email', params));
  }

  const children = validateChildrenStateForReview({ childrenState: state.children, params });

  return {
    maritalStatus,
    editMode,
    id,
    submissionInfo,
    typeOfRenewal,
    contactInformation,
    applicantInformation,
    addressInformation,
    partnerInformation,
    children,
  };
}

interface ValidateChildrenStateForReviewArgs {
  childrenState: ChildState[];
  params: Params;
}

function validateChildrenStateForReview({ childrenState, params }: ValidateChildrenStateForReviewArgs) {
  const children = getChildrenState({ children: childrenState });

  if (children.length === 0) {
    throw redirect(getPathById('public/renew/$id/child/children/index', params));
  }

  return children.map(({ id, dentalBenefits, dentalInsurance, information }) => {
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

    if (dentalBenefits === undefined) {
      throw redirect(getPathById('public/renew/$id/child/children/$childId/federal-provincial-territorial-benefits', { ...params, childId }));
    }

    return {
      id,
      dentalBenefits,
      dentalInsurance,
      information,
    };
  });
}

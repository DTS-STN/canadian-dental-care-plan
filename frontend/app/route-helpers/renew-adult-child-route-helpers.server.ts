import type { Session } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import type { Params } from '@remix-run/react';
import { isRedirectResponse, isResponse } from '@remix-run/server-runtime/dist/responses';

import { z } from 'zod';

import { getChildrenState, isNewChildState, loadRenewState, saveRenewState } from './renew-route-helpers.server';
import type { ChildState, RenewState } from './renew-route-helpers.server';
import { getLogger } from '~/utils/logging.server';
import { getPathById } from '~/utils/route-utils';

interface LoadRenewAdultChildStateArgs {
  params: Params;
  request: Request;
  session: Session;
}

/**
 * Loads renew AdultChild state.
 * @param args - The arguments.
 * @returns The loaded AdultChild state.
 */
export function loadRenewAdultChildState({ params, request, session }: LoadRenewAdultChildStateArgs) {
  const log = getLogger('renew-adult-child-route-helpers.server/loadRenewAdultChildState');
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
  params: Params;
  request: Request;
  session: Session;
}

/**
 * Loads single child state from renew adult child state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function loadRenewAdultSingleChildState({ params, request, session }: LoadRenewAdultSingleChildStateArgs) {
  const log = getLogger('renew-adult-child-route-helpers.server/loadRenewAdultSingleChildState');
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
  params: Params;
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
  } catch (err) {
    if (isResponse(err) && isRedirectResponse(err)) {
      saveRenewState({ params, session, state: { editMode: false } });
    }
    throw err;
  }
}

interface ValidateRenewAdultChildStateForReviewArgs {
  params: Params;
  state: RenewState;
}

export function validateRenewAdultChildStateForReview({ params, state }: ValidateRenewAdultChildStateForReviewArgs) {
  const { hasAddressChanged, maritalStatus, partnerInformation, contactInformation, editMode, id, submissionInfo, typeOfRenewal, communicationPreference, addressInformation, applicantInformation, dentalBenefits, confirmDentalBenefits, dentalInsurance } =
    state;

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

  if (maritalStatus === undefined) {
    throw redirect(getPathById('public/renew/$id/adult-child/confirm-marital-status', params));
  }

  if (hasAddressChanged && addressInformation === undefined) {
    throw redirect(getPathById('public/renew/$id/adult-child/update-address', params));
  }

  if (contactInformation?.isNewOrUpdatedPhoneNumber === undefined) {
    throw redirect(getPathById('public/renew/$id/confirm-phone', params));
  }

  if (contactInformation.isNewOrUpdatedEmail === undefined) {
    throw redirect(getPathById('public/renew/$id/confirm-email', params));
  }

  if (dentalInsurance === undefined) {
    throw redirect(getPathById('public/renew/$id/adult-child/dental-insurance', params));
  }

  if (confirmDentalBenefits === undefined) {
    throw redirect(getPathById('public/renew/$id/adult-child/confirm-federal-provincial-territorial-benefits', params));
  }

  if ((confirmDentalBenefits.federalBenefitsChanged || confirmDentalBenefits.provincialTerritorialBenefitsChanged) && dentalBenefits === undefined) {
    throw redirect(getPathById('public/renew/$id/adult-child/update-federal-provincial-territorial-benefits', params));
  }

  const children = getChildrenState(state).length > 0 ? validateChildrenStateForReview({ childrenState: state.children, params }) : [];

  return {
    maritalStatus,
    editMode,
    id,
    submissionInfo,
    typeOfRenewal,
    contactInformation,
    communicationPreference,
    applicantInformation,
    dentalBenefits,
    confirmDentalBenefits,
    dentalInsurance,
    addressInformation,
    partnerInformation,
    children,
    hasAddressChanged,
  };
}

interface ValidateChildrenStateForReviewArgs {
  childrenState: ChildState[];
  params: Params;
}

function validateChildrenStateForReview({ childrenState, params }: ValidateChildrenStateForReviewArgs) {
  const children = getChildrenState({ children: childrenState });

  if (children.length === 0) {
    throw redirect(getPathById('public/renew/$id/adult-child/children/index', params));
  }

  return children.map(({ id, confirmDentalBenefits, dentalBenefits, dentalInsurance, information }) => {
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

    if (confirmDentalBenefits === undefined) {
      throw redirect(getPathById('public/renew/$id/adult-child/children/$childId/confirm-federal-provincial-territorial-benefits', { ...params, childId }));
    }

    if ((confirmDentalBenefits.federalBenefitsChanged || confirmDentalBenefits.provincialTerritorialBenefitsChanged) && dentalBenefits === undefined) {
      throw redirect(getPathById('public/renew/$id/adult-child/children/$childId/update-federal-provincial-territorial-benefits', { ...params, childId }));
    }

    return {
      id,
      confirmDentalBenefits,
      dentalBenefits,
      dentalInsurance,
      information,
    };
  });
}

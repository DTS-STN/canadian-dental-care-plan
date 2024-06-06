import { Session, redirect } from '@remix-run/node';
import { Params } from '@remix-run/react';
import { isRedirectResponse, isResponse } from '@remix-run/server-runtime/dist/responses';

import { z } from 'zod';

import { ApplyState, ChildState, applicantInformationStateHasPartner, getAgeCategoryFromDateString, getChildrenState, isNewChildState, loadApplyState, saveApplyState } from '~/route-helpers/apply-route-helpers.server';
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
    throw redirect(getPathById('$lang/_public/apply/$id/type-application', params));
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = getPathById('$lang/_public/apply/$id/adult-child/confirmation', params);
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
    throw redirect(getPathById('$lang/_public/apply/$id/adult-child/children/index', params));
  }

  const childId = parsedChildId.data;
  const childStateIndex = applyState.children.findIndex(({ id }) => id === childId);

  if (childStateIndex === -1) {
    log.warn('Apply single child has not been found; childId: [%s]', childId);
    throw redirect(getPathById('$lang/_public/apply/$id/adult-child/children/index', params));
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

interface LoadApplyAdultChildStateForReviewArgs {
  params: Params;
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
  } catch (err) {
    if (isResponse(err) && isRedirectResponse(err)) {
      saveApplyState({ params, session, state: { editMode: false } });
    }
    throw err;
  }
}

interface ValidateApplyAdultChildStateForReviewArgs {
  params: Params;
  state: ApplyState;
}

export function validateApplyAdultChildStateForReview({ params, state }: ValidateApplyAdultChildStateForReviewArgs) {
  const {
    allChildrenUnder18,
    applicantInformation,
    communicationPreferences,
    dateOfBirth,
    dentalBenefits,
    dentalInsurance,
    disabilityTaxCredit,
    editMode,
    id,
    lastUpdatedOn,
    livingIndependently,
    partnerInformation,
    contactInformation,
    submissionInfo,
    taxFiling2023,
    typeOfApplication,
  } = state;

  if (typeOfApplication === undefined) {
    throw redirect(getPathById('$lang/_public/apply/$id/type-application', params));
  }

  if (typeOfApplication === 'delegate') {
    throw redirect(getPathById('$lang/_public/apply/$id/application-delegate', params));
  }

  if (typeOfApplication !== 'adult-child') {
    throw redirect(getPathById('$lang/_public/apply/$id/type-application', params));
  }

  if (taxFiling2023 === undefined) {
    throw redirect(getPathById('$lang/_public/apply/$id/adult-child/tax-filing', params));
  }

  if (taxFiling2023 === false) {
    throw redirect(getPathById('$lang/_public/apply/$id/adult-child/file-taxes', params));
  }

  if (dateOfBirth === undefined || allChildrenUnder18 === undefined) {
    throw redirect(getPathById('$lang/_public/apply/$id/adult-child/date-of-birth', params));
  }

  const ageCategory = getAgeCategoryFromDateString(dateOfBirth);

  if (ageCategory === 'children' && allChildrenUnder18) {
    throw redirect(getPathById('$lang/_public/apply/$id/adult-child/contact-apply-child', params));
  }

  if (ageCategory === 'children' && !allChildrenUnder18) {
    throw redirect(getPathById('$lang/_public/apply/$id/adult-child/parent-or-guardian', params));
  }

  if (ageCategory === 'youth' && !allChildrenUnder18) {
    throw redirect(getPathById('$lang/_public/apply/$id/adult-child/parent-or-guardian', params));
  }

  if (ageCategory === 'youth' && allChildrenUnder18 && livingIndependently === undefined) {
    throw redirect(getPathById('$lang/_public/apply/$id/adult-child/living-independently', params));
  }

  if (ageCategory === 'adults' && disabilityTaxCredit === undefined) {
    throw redirect(getPathById('$lang/_public/apply/$id/adult-child/disability-tax-credit', params));
  }

  if (ageCategory === 'adults' && disabilityTaxCredit === true && !allChildrenUnder18) {
    throw redirect(getPathById('$lang/_public/apply/$id/adult-child/apply-yourself', params));
  }

  if (ageCategory === 'adults' && disabilityTaxCredit === false && allChildrenUnder18) {
    throw redirect(getPathById('$lang/_public/apply/$id/adult-child/apply-children', params));
  }

  if (ageCategory === 'adults' && disabilityTaxCredit === false && !allChildrenUnder18) {
    throw redirect(getPathById('$lang/_public/apply/$id/adult-child/dob-eligibility', params));
  }

  if (ageCategory === 'seniors' && !allChildrenUnder18) {
    throw redirect(getPathById('$lang/_public/apply/$id/adult-child/apply-yourself', params));
  }

  if (applicantInformation === undefined) {
    throw redirect(getPathById('$lang/_public/apply/$id/adult-child/applicant-information', params));
  }

  if (applicantInformationStateHasPartner(applicantInformation) && !partnerInformation) {
    throw redirect(getPathById('$lang/_public/apply/$id/adult-child/partner-information', params));
  }

  if (!applicantInformationStateHasPartner(applicantInformation) && partnerInformation) {
    throw redirect(getPathById('$lang/_public/apply/$id/adult-child/applicant-information', params));
  }

  if (contactInformation === undefined) {
    throw redirect(getPathById('$lang/_public/apply/$id/adult-child/personal-information', params));
  }

  if (communicationPreferences === undefined) {
    throw redirect(getPathById('$lang/_public/apply/$id/adult-child/communication-preference', params));
  }

  if (dentalInsurance === undefined) {
    throw redirect(getPathById('$lang/_public/apply/$id/adult-child/dental-insurance', params));
  }

  if (dentalBenefits === undefined) {
    throw redirect(getPathById('$lang/_public/apply/$id/adult-child/federal-provincial-territorial-benefits', params));
  }

  const children = validateChildrenStateForReview({ childrenState: state.children, params });

  return {
    ageCategory,
    allChildrenUnder18,
    applicantInformation,
    children,
    communicationPreferences,
    contactInformation,
    dateOfBirth,
    dentalBenefits,
    dentalInsurance,
    disabilityTaxCredit,
    editMode,
    id,
    lastUpdatedOn,
    livingIndependently,
    partnerInformation,
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
    throw redirect(getPathById('$lang/_public/apply/$id/adult-child/children/index', params));
  }

  return children.map(({ id, dentalBenefits, dentalInsurance, information }) => {
    const childId = id;

    if (information === undefined) {
      throw redirect(getPathById('$lang/_public/apply/$id/adult-child/children/$childId/information', { ...params, childId }));
    }

    if (!information.isParent) {
      throw redirect(getPathById('$lang/_public/apply/$id/adult-child/children/$childId/parent-or-guardian', { ...params, childId }));
    }

    const ageCategory = getAgeCategoryFromDateString(information.dateOfBirth);

    if (ageCategory === 'adults' || ageCategory === 'seniors') {
      throw redirect(getPathById('$lang/_public/apply/$id/adult-child/children/$childId/cannot-apply-child', { ...params, childId }));
    }

    if (dentalInsurance === undefined) {
      throw redirect(getPathById('$lang/_public/apply/$id/adult-child/children/$childId/dental-insurance', { ...params, childId }));
    }

    if (dentalBenefits === undefined) {
      throw redirect(getPathById('$lang/_public/apply/$id/adult-child/children/$childId/federal-provincial-territorial-benefits', { ...params, childId }));
    }

    return {
      ageCategory,
      id,
      dentalBenefits,
      dentalInsurance,
      information,
    };
  });
}

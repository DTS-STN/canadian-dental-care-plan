import { redirect } from 'react-router';

import { z } from 'zod';

import type { ApplyState, ApplyStateParams, ChildrenState } from '~/.server/routes/helpers/apply-route-helpers';
import { applicantInformationStateHasPartner, getAgeCategoryFromDateString, getChildrenState, isNewChildState, loadApplyState, saveApplyState } from '~/.server/routes/helpers/apply-route-helpers';
import { getLogger } from '~/.server/utils/logging.utils';
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
  const log = getLogger('apply-adult-child-route-helpers.server/loadApplyAdultChildState');
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
  const log = getLogger('apply-adult-child-route-helpers.server/loadApplyAdultSingleChildState');
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
  } catch (err) {
    if (isRedirectResponse(err)) {
      saveApplyState({ params, session, state: { editMode: false } });
    }
    throw err;
  }
}

interface ValidateApplyAdultChildStateForReviewArgs {
  params: ApplyStateParams;
  state: ApplyState;
}

export function validateApplyAdultChildStateForReview({ params, state }: ValidateApplyAdultChildStateForReviewArgs) {
  const {
    allChildrenUnder18,
    applicantInformation,
    applicationYear,
    communicationPreferences,
    dateOfBirth,
    hasFederalProvincialTerritorialBenefits,
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
    throw redirect(getPathById('public/apply/$id/type-application', params));
  }

  if (typeOfApplication === 'delegate') {
    throw redirect(getPathById('public/apply/$id/application-delegate', params));
  }

  if (typeOfApplication !== 'adult-child') {
    throw redirect(getPathById('public/apply/$id/type-application', params));
  }

  if (taxFiling2023 === undefined) {
    throw redirect(getPathById('public/apply/$id/tax-filing', params));
  }

  if (taxFiling2023 === false) {
    throw redirect(getPathById('public/apply/$id/file-taxes', params));
  }

  if (dateOfBirth === undefined || allChildrenUnder18 === undefined) {
    throw redirect(getPathById('public/apply/$id/adult-child/date-of-birth', params));
  }

  const ageCategory = getAgeCategoryFromDateString(dateOfBirth);

  if (ageCategory === 'children' && allChildrenUnder18) {
    throw redirect(getPathById('public/apply/$id/adult-child/contact-apply-child', params));
  }

  if (ageCategory === 'children' && !allChildrenUnder18) {
    throw redirect(getPathById('public/apply/$id/adult-child/parent-or-guardian', params));
  }

  if (ageCategory === 'youth' && !allChildrenUnder18) {
    throw redirect(getPathById('public/apply/$id/adult-child/parent-or-guardian', params));
  }

  if (ageCategory === 'youth' && allChildrenUnder18 && livingIndependently === undefined) {
    throw redirect(getPathById('public/apply/$id/adult-child/living-independently', params));
  }

  if (ageCategory === 'adults' && disabilityTaxCredit === undefined) {
    throw redirect(getPathById('public/apply/$id/adult-child/disability-tax-credit', params));
  }

  if (ageCategory === 'adults' && disabilityTaxCredit === true && !allChildrenUnder18) {
    throw redirect(getPathById('public/apply/$id/adult-child/apply-yourself', params));
  }

  if (ageCategory === 'adults' && disabilityTaxCredit === false && allChildrenUnder18) {
    throw redirect(getPathById('public/apply/$id/adult-child/apply-children', params));
  }

  if (ageCategory === 'adults' && disabilityTaxCredit === false && !allChildrenUnder18) {
    throw redirect(getPathById('public/apply/$id/adult-child/dob-eligibility', params));
  }

  if (ageCategory === 'seniors' && !allChildrenUnder18) {
    throw redirect(getPathById('public/apply/$id/adult-child/apply-yourself', params));
  }

  if (applicantInformation === undefined) {
    throw redirect(getPathById('public/apply/$id/adult-child/applicant-information', params));
  }

  if (applicantInformationStateHasPartner(applicantInformation) && !partnerInformation) {
    throw redirect(getPathById('public/apply/$id/adult-child/partner-information', params));
  }

  if (!applicantInformationStateHasPartner(applicantInformation) && partnerInformation) {
    throw redirect(getPathById('public/apply/$id/adult-child/applicant-information', params));
  }

  if (contactInformation === undefined) {
    throw redirect(getPathById('public/apply/$id/adult-child/contact-information', params));
  }

  if (communicationPreferences === undefined) {
    throw redirect(getPathById('public/apply/$id/adult-child/communication-preference', params));
  }

  if (dentalInsurance === undefined) {
    throw redirect(getPathById('public/apply/$id/adult-child/dental-insurance', params));
  }

  if (dentalBenefits === undefined || hasFederalProvincialTerritorialBenefits === undefined) {
    throw redirect(getPathById('public/apply/$id/adult-child/confirm-federal-provincial-territorial-benefits', params));
  }

  const children = validateChildrenStateForReview({ childrenState: state.children, params });

  return {
    ageCategory,
    allChildrenUnder18,
    applicantInformation,
    applicationYear,
    children,
    communicationPreferences,
    contactInformation,
    dateOfBirth,
    hasFederalProvincialTerritorialBenefits,
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

    if (dentalBenefits === undefined || hasFederalProvincialTerritorialBenefits === undefined) {
      throw redirect(getPathById('public/apply/$id/adult-child/children/$childId/confirm-federal-provincial-territorial-benefits', { ...params, childId }));
    }

    return { ageCategory, id, dentalBenefits, dentalInsurance, information, hasFederalProvincialTerritorialBenefits };
  });
}

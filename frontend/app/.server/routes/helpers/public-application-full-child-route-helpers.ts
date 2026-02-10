import { redirect } from 'react-router';

import { createLogger } from '~/.server/logging';
import type { ApplicationStateParams, ChildrenState, PublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';
import { applicantInformationStateHasPartner, getAgeCategoryFromDateString, getChildrenState, getPublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';
import { getEnv } from '~/.server/utils/env.utils';
import { isValidId } from '~/.server/utils/id.utils';
import type { Session } from '~/.server/web/session';
import { getPathById } from '~/utils/route-utils';

interface LoadPublicApplicationFullChildStateArgs {
  params: ApplicationStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads public application full child state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function loadPublicApplicationFullChildState({ params, request, session }: LoadPublicApplicationFullChildStateArgs) {
  const log = createLogger('public-application-full-child-route-helpers/loadPublicApplicationFullChildState');
  const { pathname } = new URL(request.url);
  const applicationState = getPublicApplicationState({ params, session });

  if (applicationState.inputModel !== 'full' || applicationState.typeOfApplication !== 'children') {
    throw redirect(getPathById('public/application/$id/type-application', params));
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = getPathById('public/application/$id/full-children/confirmation', params);
  if (applicationState.submissionInfo && !pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has been submitted; sessionId: [%s], ', confirmationRouteUrl, applicationState.id);
    throw redirect(confirmationRouteUrl);
  }

  // Redirect to the first flow page if the application has not been submitted and
  // the current route is the confirmation page.
  const typeOfApplicationRouteUrl = getPathById('public/application/$id/type-application', params);
  if (!applicationState.submissionInfo && pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has not been submitted; sessionId: [%s], ', typeOfApplicationRouteUrl, applicationState.id);
    throw redirect(typeOfApplicationRouteUrl);
  }

  return applicationState;
}

interface LoadPublicApplicationFullChildStateForReviewArgs {
  params: ApplicationStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads the full child state for the review page. It validates the state and throws a redirect if invalid.
 * @param args - The arguments.
 * @returns The validated child state.
 */
export function loadPublicApplicationFullChildStateForReview({ params, request, session }: LoadPublicApplicationFullChildStateForReviewArgs) {
  const state = loadPublicApplicationFullChildState({ params, request, session });
  return validatePublicApplicationFullChildStateForReview({ params, state });
}

interface LoadPublicApplicationSingleFullChildStateArgs {
  params: ApplicationStateParams & { childId: string };
  request: Request;
  session: Session;
}

/**
 * Loads single full child state from apply full child state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function loadPublicApplicationSingleFullChildState({ params, request, session }: LoadPublicApplicationSingleFullChildStateArgs) {
  const log = createLogger('public-application-full-child-route-helpers/loadPublicApplicationSingleFullChildState');
  const applicationState = loadPublicApplicationFullChildState({ params, request, session });
  const childId = params.childId;

  if (!isValidId(childId)) {
    log.warn('Invalid "childId" param format; childId: [%s]', childId);
    throw redirect(getPathById('public/application/$id/full-children/childrens-application', params));
  }

  const childStateIndex = applicationState.children.findIndex(({ id }) => id === childId);

  if (childStateIndex === -1) {
    log.warn('Public application single child has not been found; childId: [%s]', childId);
    throw redirect(getPathById('public/application/$id/full-children/childrens-application', params));
  }

  const childState = applicationState.children[childStateIndex];

  return { ...childState, childNumber: childStateIndex + 1 };
}

interface ValidatePublicApplicationFullChildStateForReviewArgs {
  params: ApplicationStateParams;
  state: PublicApplicationState;
}

export function validatePublicApplicationFullChildStateForReview({ params, state }: ValidatePublicApplicationFullChildStateForReviewArgs) {
  const {
    applicantInformation,
    applicationYear,
    context,
    communicationPreferences,
    phoneNumber,
    email,
    emailVerified,
    hasFiledTaxes,
    homeAddress,
    id,
    isHomeAddressSameAsMailingAddress,
    lastUpdatedOn,
    mailingAddress,
    maritalStatus,
    partnerInformation,
    submissionInfo,
    termsAndConditions,
    inputModel,
    typeOfApplication,
  } = state;

  const { COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID, COMMUNICATION_METHOD_GC_DIGITAL_ID } = getEnv();

  if (termsAndConditions === undefined) {
    throw redirect(getPathById('public/application/$id/eligibility-requirements', params));
  }

  if (inputModel !== 'full') {
    throw redirect(getPathById('public/application/$id/type-of-application', params));
  }

  if (typeOfApplication !== 'children') {
    throw redirect(getPathById('public/application/$id/type-of-application', params));
  }

  if (hasFiledTaxes === undefined) {
    throw redirect(getPathById('public/application/$id/eligibility-requirements', params));
  }

  if (hasFiledTaxes === false) {
    throw redirect(getPathById('public/application/$id/eligibility-requirements', params));
  }

  const children = validateChildrenStateForReview({ childrenState: state.children, params });

  if (applicantInformation === undefined) {
    throw redirect(getPathById('public/application/$id/type-of-application', params));
  }

  const ageCategory = getAgeCategoryFromDateString(applicantInformation.dateOfBirth);

  if (ageCategory === 'children') {
    throw redirect(getPathById('public/application/$id/type-of-application', params));
  }

  if (applicantInformationStateHasPartner(maritalStatus) && !partnerInformation) {
    throw redirect(getPathById('public/application/$id/full-children/parent-or-guardian', params));
  }

  if (!applicantInformationStateHasPartner(maritalStatus) && partnerInformation) {
    throw redirect(getPathById('public/application/$id/full-children/parent-or-guardian', params));
  }

  if (phoneNumber === undefined) {
    throw redirect(getPathById('public/application/$id/full-children/parent-or-guardian', params));
  }

  if (mailingAddress === undefined) {
    throw redirect(getPathById('public/application/$id/full-children/parent-or-guardian', params));
  }

  if (communicationPreferences === undefined) {
    throw redirect(getPathById('public/application/$id/full-children/parent-or-guardian', params));
  }

  if ((communicationPreferences.value?.preferredMethod === COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID || communicationPreferences.value?.preferredMethod === COMMUNICATION_METHOD_GC_DIGITAL_ID) && !emailVerified) {
    throw redirect(getPathById('public/application/$id/full-children/contact-information', params));
  }

  return {
    ageCategory,
    applicantInformation,
    applicationYear,
    children,
    context,
    communicationPreferences,
    phoneNumber,
    email,
    emailVerified,
    hasFiledTaxes,
    homeAddress,
    id,
    isHomeAddressSameAsMailingAddress,
    lastUpdatedOn,
    mailingAddress,
    maritalStatus,
    partnerInformation,
    submissionInfo,
    termsAndConditions,
    inputModel,
    typeOfApplication,
  };
}

interface ValidateChildrenStateForReviewArgs {
  childrenState: ChildrenState;
  params: ApplicationStateParams;
}

function validateChildrenStateForReview({ childrenState, params }: ValidateChildrenStateForReviewArgs) {
  const children = getChildrenState({ children: childrenState });

  if (children.length === 0) {
    throw redirect(getPathById('public/application/$id/full-children/childrens-application', params));
  }

  return children.map(({ id, dentalBenefits, dentalInsurance, information }) => {
    if (information === undefined) {
      throw redirect(getPathById('public/application/$id/full-children/childrens-application', params));
    }

    if (information.dateOfBirth === '') {
      throw redirect(getPathById('public/application/$id/full-children/childrens-application', params));
    }

    if (!information.isParent) {
      throw redirect(getPathById('public/application/$id/full-children/childrens-application', params));
    }

    const ageCategory = getAgeCategoryFromDateString(information.dateOfBirth);

    if (ageCategory === 'adults' || ageCategory === 'seniors') {
      throw redirect(getPathById('public/application/$id/type-of-application', params));
    }

    if (dentalInsurance === undefined) {
      throw redirect(getPathById('public/application/$id/full-children/childrens-application', params));
    }

    if (dentalBenefits === undefined) {
      throw redirect(getPathById('public/application/$id/full-children/childrens-application', params));
    }

    return {
      ageCategory,
      dentalBenefits,
      dentalInsurance,
      id,
      information,
    };
  });
}

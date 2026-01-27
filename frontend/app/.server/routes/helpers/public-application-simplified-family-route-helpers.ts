import { redirect } from 'react-router';

import { z } from 'zod';

import { createLogger } from '~/.server/logging';
import { applicantInformationStateHasPartner, getAgeCategoryFromDateString, getChildrenState, getPublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';
import type { ApplicationStateParams, ChildrenState, PublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';
import type { Session } from '~/.server/web/session';
import { getPathById } from '~/utils/route-utils';

interface LoadPublicApplicationSimplifiedFamilyStateArgs {
  params: ApplicationStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads public application simplified family state.
 * @param args - The arguments.
 * @returns The loaded public simplified family state.
 */
export function loadPublicApplicationSimplifiedFamilyState({ params, request, session }: LoadPublicApplicationSimplifiedFamilyStateArgs) {
  const log = createLogger('public-application-simplified-family-route-helpers/loadPublicApplicationSimplifiedFamilyState');
  const { pathname } = new URL(request.url);
  const applicationState = getPublicApplicationState({ params, session });

  if (applicationState.inputModel !== 'simplified' || applicationState.typeOfApplication !== 'family') {
    throw redirect(getPathById('public/application/$id/type-application', params));
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = getPathById('public/application/$id/simplified-family/confirmation', params);
  if (applicationState.submissionInfo && !pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has been submitted; sessionId: [%s], ', confirmationRouteUrl, applicationState.id);
    throw redirect(confirmationRouteUrl);
  }

  // Redirect to the first flow page if the application has not been submitted and
  // the current route is the confirmation page.
  const typeOfApplicationRouteUrl = getPathById('public/application/$id/type-of-application', params);
  if (!applicationState.submissionInfo && pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has not been submitted; sessionId: [%s], ', typeOfApplicationRouteUrl, applicationState.id);
    throw redirect(typeOfApplicationRouteUrl);
  }

  return applicationState;
}

interface LoadPublicApplicationSimplifiedFamilySingleChildStateArgs {
  params: ApplicationStateParams & { childId: string };
  request: Request;
  session: Session;
}

/**
 * Loads single child state from public application simplified family state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function loadPublicApplicationSimplifiedFamilyChildState({ params, request, session }: LoadPublicApplicationSimplifiedFamilySingleChildStateArgs) {
  const log = createLogger('public-application-simplified-family-route-helpers/loadPublicApplicationSimplifiedFamilyChildState');
  const applicationState = loadPublicApplicationSimplifiedFamilyState({ params, request, session });

  const parsedChildId = z.uuid().safeParse(params.childId);

  if (!parsedChildId.success) {
    log.warn('Invalid "childId" param format; childId: [%s]', params.childId);
    throw redirect(getPathById('public/application/$id/simplified-family/childrens-application', params));
  }

  const childId = parsedChildId.data;
  const childStateIndex = applicationState.children.findIndex(({ id }) => id === childId);

  if (childStateIndex === -1) {
    log.warn('Simplified family single child has not been found; childId: [%s]', childId);
    throw redirect(getPathById('public/application/$id/simplified-family/childrens-application', params));
  }

  const childState = applicationState.children[childStateIndex];

  return { ...childState, childNumber: childStateIndex + 1 };
}

interface LoadPublicApplicationSimplifiedFamilyStateForReviewArgs {
  params: ApplicationStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads the simplified family state for the review page. It validates the state and throws a redirect if invalid.
 * @param args - The arguments.
 * @returns The validated family state.
 */
export function loadPublicApplicationSimplifiedFamilyStateForReview({ params, request, session }: LoadPublicApplicationSimplifiedFamilyStateForReviewArgs) {
  const state = loadPublicApplicationSimplifiedFamilyState({ params, request, session });
  return validatePublicApplicationFamilyStateForReview({ params, state });
}

interface ValidatePublicApplicationFamilyStateForReviewArgs {
  params: ApplicationStateParams;
  state: PublicApplicationState;
}

export function validatePublicApplicationFamilyStateForReview({ params, state }: ValidatePublicApplicationFamilyStateForReviewArgs) {
  const {
    applicantInformation,
    applicationYear,
    context,
    clientApplication,
    communicationPreferences,
    phoneNumber,
    dentalBenefits,
    dentalInsurance,
    email,
    emailVerified,
    hasFiledTaxes,
    homeAddress,
    id,
    isHomeAddressSameAsMailingAddress,
    lastUpdatedOn,
    livingIndependently,
    mailingAddress,
    maritalStatus,
    partnerInformation,
    submissionInfo,
    termsAndConditions,
    inputModel,
    typeOfApplication,
  } = state;

  if (clientApplication === undefined) {
    throw redirect(getPathById('public/application/$id/type-of-application', params));
  }

  if (termsAndConditions === undefined) {
    throw redirect(getPathById('public/application/$id/eligibility-requirements', params));
  }

  if (inputModel !== 'simplified') {
    throw redirect(getPathById('public/application/$id/type-of-application', params));
  }

  if (typeOfApplication !== 'family') {
    throw redirect(getPathById('public/application/$id/type-of-application', params));
  }

  if (hasFiledTaxes === undefined) {
    throw redirect(getPathById('public/application/$id/eligibility-requirements', params));
  }

  if (hasFiledTaxes === false) {
    throw redirect(getPathById('public/application/$id/eligibility-requirements', params));
  }

  if (applicantInformation === undefined) {
    throw redirect(getPathById('public/application/$id/type-of-application', params));
  }

  const ageCategory = getAgeCategoryFromDateString(applicantInformation.dateOfBirth);

  if (ageCategory === 'children') {
    throw redirect(getPathById('public/application/$id/type-of-application', params));
  }

  if (applicantInformationStateHasPartner(maritalStatus) && !partnerInformation) {
    throw redirect(getPathById('public/application/$id/simplified-family/marital-status', params));
  }

  if (!applicantInformationStateHasPartner(maritalStatus) && partnerInformation) {
    throw redirect(getPathById('public/application/$id/simplified-family/marital-status', params));
  }

  if (phoneNumber === undefined) {
    throw redirect(getPathById('public/application/$id/simplified-family/contact-information', params));
  }

  if (mailingAddress === undefined) {
    throw redirect(getPathById('public/application/$id/simplified-family/contact-information', params));
  }

  if (communicationPreferences === undefined) {
    throw redirect(getPathById('public/application/$id/simplified-family/contact-information', params));
  }

  if (dentalInsurance === undefined) {
    throw redirect(getPathById('public/application/$id/simplified-family/dental-insurance', params));
  }

  if (dentalBenefits === undefined) {
    throw redirect(getPathById('public/application/$id/simplified-family/dental-insurance', params));
  }

  const children = validateChildrenStateForReview({ childrenState: state.children, params });

  return {
    ageCategory,
    applicantInformation,
    applicationYear,
    clientApplication,
    children,
    context,
    communicationPreferences,
    phoneNumber,
    dentalBenefits,
    dentalInsurance,
    email,
    emailVerified,
    hasFiledTaxes,
    homeAddress,
    id,
    isHomeAddressSameAsMailingAddress,
    lastUpdatedOn,
    livingIndependently,
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
    throw redirect(getPathById('public/application/$id/simplified-family/childrens-application', params));
  }

  return children.map(({ id, dentalBenefits, dentalInsurance, information }) => {
    if (information === undefined) {
      throw redirect(getPathById('public/application/$id/simplified-family/childrens-application', params));
    }

    if (!information.isParent) {
      throw redirect(getPathById('public/application/$id/simplified-family/childrens-application', params));
    }

    const ageCategory = getAgeCategoryFromDateString(information.dateOfBirth);

    if (ageCategory === 'adults' || ageCategory === 'seniors') {
      throw redirect(getPathById('public/application/$id/type-of-application', params));
    }

    if (dentalInsurance === undefined) {
      throw redirect(getPathById('public/application/$id/simplified-family/childrens-application', params));
    }

    if (dentalBenefits === undefined) {
      throw redirect(getPathById('public/application/$id/simplified-family/childrens-application', params));
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

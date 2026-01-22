import { redirect } from 'react-router';

import { z } from 'zod';

import { createLogger } from '~/.server/logging';
import { applicantInformationStateHasPartner, getAgeCategoryFromDateString, getChildrenState, getPublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';
import type { ApplicationStateParams, ChildrenState, PublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';
import type { Session } from '~/.server/web/session';
import { getPathById } from '~/utils/route-utils';

interface LoadPublicApplicationFamilyStateArgs {
  params: ApplicationStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads public application family state.
 * @param args - The arguments.
 * @returns The loaded public application family state.
 */
export function loadPublicApplicationFamilyState({ params, request, session }: LoadPublicApplicationFamilyStateArgs) {
  const log = createLogger('public-application-family-route-helpers.server/loadPublicApplicationFamilyState');
  const { pathname } = new URL(request.url);
  const applicationState = getPublicApplicationState({ params, session });

  if (applicationState.typeOfApplicationFlow !== 'family') {
    throw redirect(getPathById('public/application/$id/type-application', params));
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = getPathById('public/application/$id/new-family/confirmation', params);
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

interface LoadPublicApplicationFamilySingleChildStateArgs {
  params: ApplicationStateParams & { childId: string };
  request: Request;
  session: Session;
}

/**
 * Loads single child state from public application child state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function loadPublicApplicationFamilyChildState({ params, request, session }: LoadPublicApplicationFamilySingleChildStateArgs) {
  const log = createLogger('public-application-family-route-helpers.server/loadPublicApplicationFamilyChildState');
  const applicationState = loadPublicApplicationFamilyState({ params, request, session });

  const parsedChildId = z.uuid().safeParse(params.childId);

  if (!parsedChildId.success) {
    log.warn('Invalid "childId" param format; childId: [%s]', params.childId);
    throw redirect(getPathById('public/application/$id/new-family/childrens-application', params));
  }

  const childId = parsedChildId.data;
  const childStateIndex = applicationState.children.findIndex(({ id }) => id === childId);

  if (childStateIndex === -1) {
    log.warn('Apply single child has not been found; childId: [%s]', childId);
    throw redirect(getPathById('public/application/$id/new-family/childrens-application', params));
  }

  const childState = applicationState.children[childStateIndex];

  return { ...childState, childNumber: childStateIndex + 1 };
}

interface LoadPublicApplicationFamilyStateForReviewArgs {
  params: ApplicationStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads the family state for the review page. It validates the state and throws a redirect if invalid.
 * If a redirect exception is thrown, state.editMode is set to false.
 * @param args - The arguments.
 * @returns The validated family state.
 */
export function loadPublicApplicationFamilyStateForReview({ params, request, session }: LoadPublicApplicationFamilyStateForReviewArgs) {
  const state = loadPublicApplicationFamilyState({ params, request, session });
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
    communicationPreferences,
    phoneNumber,
    dentalBenefits,
    dentalInsurance,
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
    typeOfApplicationFlow,
  } = state;

  if (termsAndConditions === undefined) {
    throw redirect(getPathById('public/application/$id/eligibility-requirements', params));
  }

  if (typeOfApplicationFlow === 'delegate') {
    throw redirect(getPathById('public/application/$id/type-of-application', params));
  }

  if (typeOfApplicationFlow !== 'family') {
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
    throw redirect(getPathById('public/application/$id/new-family/marital-status', params));
  }

  if (!applicantInformationStateHasPartner(maritalStatus) && partnerInformation) {
    throw redirect(getPathById('public/application/$id/new-family/marital-status', params));
  }

  if (phoneNumber === undefined) {
    throw redirect(getPathById('public/application/$id/new-family/contact-information', params));
  }

  if (mailingAddress === undefined) {
    throw redirect(getPathById('public/application/$id/new-family/contact-information', params));
  }

  if (communicationPreferences === undefined) {
    throw redirect(getPathById('public/application/$id/new-family/contact-information', params));
  }

  if (dentalInsurance === undefined) {
    throw redirect(getPathById('public/application/$id/new-family/dental-insurance', params));
  }

  if (hasFederalProvincialTerritorialBenefits === undefined) {
    throw redirect(getPathById('public/application/$id/new-family/dental-insurance', params));
  }

  if (dentalBenefits === undefined && hasFederalProvincialTerritorialBenefits.value === true) {
    throw redirect(getPathById('public/application/$id/new-family/dental-insurance', params));
  }

  const children = validateChildrenStateForReview({ childrenState: state.children, params });

  return {
    ageCategory,
    applicantInformation,
    applicationYear,
    children,
    communicationPreferences,
    phoneNumber,
    dentalBenefits,
    dentalInsurance,
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
    typeOfApplicationFlow,
  };
}

interface ValidateChildrenStateForReviewArgs {
  childrenState: ChildrenState;
  params: ApplicationStateParams;
}

function validateChildrenStateForReview({ childrenState, params }: ValidateChildrenStateForReviewArgs) {
  const children = getChildrenState({ children: childrenState });

  if (children.length === 0) {
    throw redirect(getPathById('public/application/$id/new-family/childrens-application', params));
  }

  return children.map(({ id, dentalBenefits, dentalInsurance, information }) => {
    if (information === undefined) {
      throw redirect(getPathById('public/application/$id/new-family/childrens-application', params));
    }

    if (!information.isParent) {
      throw redirect(getPathById('public/application/$id/new-family/childrens-application', params));
    }

    const ageCategory = getAgeCategoryFromDateString(information.dateOfBirth);

    if (ageCategory === 'adults' || ageCategory === 'seniors') {
      throw redirect(getPathById('public/application/$id/type-of-application', params));
    }

    if (dentalInsurance === undefined) {
      throw redirect(getPathById('public/application/$id/new-family/childrens-application', params));
    }

    if (dentalBenefits === undefined) {
      throw redirect(getPathById('public/application/$id/new-family/childrens-application', params));
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

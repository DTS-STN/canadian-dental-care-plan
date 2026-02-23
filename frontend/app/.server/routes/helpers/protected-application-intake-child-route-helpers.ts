import { redirect } from 'react-router';

import { createLogger } from '~/.server/logging';
import type { ApplicationStateParams, ChildrenState, ProtectedApplicationState } from '~/.server/routes/helpers/protected-application-route-helpers';
import { applicantInformationStateHasPartner, getAgeCategoryFromDateString, getChildrenState, getProtectedApplicationState } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getEnv } from '~/.server/utils/env.utils';
import type { Session } from '~/.server/web/session';
import { getPathById } from '~/utils/route-utils';

interface LoadProtectedApplicationIntakeChildStateArgs {
  params: ApplicationStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads protected application intake child state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function loadProtectedApplicationIntakeChildState({ params, request, session }: LoadProtectedApplicationIntakeChildStateArgs) {
  const log = createLogger('protected-application-intake-child-route-helpers/loadProtectedApplicationIntakeChildState');
  const { pathname } = new URL(request.url);
  const applicationState = getProtectedApplicationState({ params, session });

  if (applicationState.context !== 'intake' || applicationState.typeOfApplication !== 'children') {
    throw redirect(getPathById('protected/application/$id/type-application', params));
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = getPathById('protected/application/$id/intake-children/confirmation', params);
  if (applicationState.submissionInfo && !pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has been submitted; sessionId: [%s], ', confirmationRouteUrl, applicationState.id);
    throw redirect(confirmationRouteUrl);
  }

  // Redirect to the first flow page if the application has not been submitted and
  // the current route is the confirmation page.
  const typeOfApplicationRouteUrl = getPathById('protected/application/$id/type-application', params);
  if (!applicationState.submissionInfo && pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has not been submitted; sessionId: [%s], ', typeOfApplicationRouteUrl, applicationState.id);
    throw redirect(typeOfApplicationRouteUrl);
  }

  return applicationState;
}

interface LoadProtectedApplicationIntakeChildStateForReviewArgs {
  params: ApplicationStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads the intake child state for the review page. It validates the state and throws a redirect if invalid.
 * @param args - The arguments.
 * @returns The validated child state.
 */
export function loadProtectedApplicationIntakeChildStateForReview({ params, request, session }: LoadProtectedApplicationIntakeChildStateForReviewArgs) {
  const state = loadProtectedApplicationIntakeChildState({ params, request, session });
  return validateProtectedApplicationIntakeChildStateForReview({ params, state });
}

interface ValidateProtectedApplicationIntakeChildStateForReviewArgs {
  params: ApplicationStateParams;
  state: ProtectedApplicationState;
}

export function validateProtectedApplicationIntakeChildStateForReview({ params, state }: ValidateProtectedApplicationIntakeChildStateForReviewArgs) {
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
    typeOfApplication,
  } = state;

  const { COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID, COMMUNICATION_METHOD_GC_DIGITAL_ID } = getEnv();

  if (termsAndConditions === undefined) {
    throw redirect(getPathById('protected/application/$id/eligibility-requirements', params));
  }

  if (context !== 'intake') {
    throw redirect(getPathById('protected/application/$id/type-of-application', params));
  }

  if (typeOfApplication !== 'children') {
    throw redirect(getPathById('protected/application/$id/type-of-application', params));
  }

  if (hasFiledTaxes === undefined) {
    throw redirect(getPathById('protected/application/$id/eligibility-requirements', params));
  }

  if (hasFiledTaxes === false) {
    throw redirect(getPathById('protected/application/$id/eligibility-requirements', params));
  }

  const children = validateChildrenStateForReview({ childrenState: state.children, params });

  if (applicantInformation === undefined) {
    throw redirect(getPathById('protected/application/$id/type-of-application', params));
  }

  const ageCategory = getAgeCategoryFromDateString(applicantInformation.dateOfBirth);

  if (ageCategory === 'children') {
    throw redirect(getPathById('protected/application/$id/type-of-application', params));
  }

  if (applicantInformationStateHasPartner(maritalStatus) && !partnerInformation) {
    throw redirect(getPathById('protected/application/$id/intake-children/parent-or-guardian', params));
  }

  if (!applicantInformationStateHasPartner(maritalStatus) && partnerInformation) {
    throw redirect(getPathById('protected/application/$id/intake-children/parent-or-guardian', params));
  }

  if (phoneNumber === undefined) {
    throw redirect(getPathById('protected/application/$id/intake-children/parent-or-guardian', params));
  }

  if (mailingAddress === undefined) {
    throw redirect(getPathById('protected/application/$id/intake-children/parent-or-guardian', params));
  }

  if (communicationPreferences === undefined) {
    throw redirect(getPathById('protected/application/$id/intake-children/parent-or-guardian', params));
  }

  if ((communicationPreferences.value?.preferredMethod === COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID || communicationPreferences.value?.preferredMethod === COMMUNICATION_METHOD_GC_DIGITAL_ID) && !emailVerified) {
    throw redirect(getPathById('protected/application/$id/intake-children/contact-information', params));
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
    throw redirect(getPathById('protected/application/$id/intake-children/childrens-application', params));
  }

  return children.map(({ id, dentalBenefits, dentalInsurance, information }) => {
    if (information === undefined) {
      throw redirect(getPathById('protected/application/$id/intake-children/childrens-application', params));
    }

    if (information.dateOfBirth === '') {
      throw redirect(getPathById('protected/application/$id/intake-children/childrens-application', params));
    }

    if (!information.isParent) {
      throw redirect(getPathById('protected/application/$id/intake-children/childrens-application', params));
    }

    const ageCategory = getAgeCategoryFromDateString(information.dateOfBirth);

    if (ageCategory === 'adults' || ageCategory === 'seniors') {
      throw redirect(getPathById('protected/application/$id/type-of-application', params));
    }

    if (dentalInsurance === undefined) {
      throw redirect(getPathById('protected/application/$id/intake-children/childrens-application', params));
    }

    if (dentalBenefits === undefined) {
      throw redirect(getPathById('protected/application/$id/intake-children/childrens-application', params));
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

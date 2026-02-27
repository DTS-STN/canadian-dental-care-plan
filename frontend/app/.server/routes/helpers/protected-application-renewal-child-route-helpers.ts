import { redirect } from 'react-router';

import { invariant } from '@dts-stn/invariant';

import { createLogger } from '~/.server/logging';
import type { ApplicationStateParams, ChildrenState, ProtectedApplicationState } from '~/.server/routes/helpers/protected-application-route-helpers';
import { applicantInformationStateHasPartner, getAgeCategoryFromDateString, getChildrenState, getProtectedApplicationState } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getEnv } from '~/.server/utils/env.utils';
import type { Session } from '~/.server/web/session';
import { getPathById } from '~/utils/route-utils';

type ProtectedApplicationRenewalChildState = OmitStrict<ProtectedApplicationState, 'clientApplication'> & {
  clientApplication: NonNullable<ProtectedApplicationState['clientApplication']>;
};

interface LoadProtectedApplicationRenewalChildStateArgs {
  params: ApplicationStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads protected application renewal renew child state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function loadProtectedApplicationRenewalChildState({ params, request, session }: LoadProtectedApplicationRenewalChildStateArgs): ProtectedApplicationRenewalChildState {
  const log = createLogger('protected-application-renewal-child-route-helpers/loadProtectedApplicationRenewalChildState');
  const { pathname } = new URL(request.url);
  const applicationState = getProtectedApplicationState({ params, session });

  if (applicationState.context !== 'renewal' || applicationState.typeOfApplication !== 'children') {
    throw redirect(getPathById('protected/application/$id/type-application', params));
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = getPathById('protected/application/$id/renewal-children/confirmation', params);
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

  const { clientApplication, ...rest } = applicationState;
  invariant(clientApplication, 'clientApplication must be defined in the protected renewal child application state');
  return { ...rest, clientApplication };
}

interface LoadProtectedApplicationRenewalChildStateForReviewArgs {
  params: ApplicationStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads the application renewal child state for the review page. It validates the state and throws a redirect if invalid.
 * @param args - The arguments.
 * @returns The validated child state.
 */
export function loadProtectedApplicationRenewalChildStateForReview({ params, request, session }: LoadProtectedApplicationRenewalChildStateForReviewArgs) {
  const state = loadProtectedApplicationRenewalChildState({ params, request, session });
  return validateProtectedApplicationRenewalChildStateForReview({ params, state });
}

interface ValidateProtectedApplicationRenewalChildStateForReviewArgs {
  params: ApplicationStateParams;
  state: ProtectedApplicationRenewalChildState;
}

export function validateProtectedApplicationRenewalChildStateForReview({ params, state }: ValidateProtectedApplicationRenewalChildStateForReviewArgs) {
  const {
    applicantInformation,
    applicationYear,
    clientApplication,
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

  if (context !== 'renewal') {
    throw redirect(getPathById('protected/application/$id/renew', params));
  }

  if (typeOfApplication !== 'children') {
    throw redirect(getPathById('protected/application/$id/renew', params));
  }

  if (hasFiledTaxes === undefined) {
    throw redirect(getPathById('protected/application/$id/eligibility-requirements', params));
  }

  if (hasFiledTaxes === false) {
    throw redirect(getPathById('protected/application/$id/eligibility-requirements', params));
  }

  const children = validateChildrenStateForReview({ childrenState: state.children, params });

  if (applicantInformation === undefined) {
    throw redirect(getPathById('protected/application/$id/renew', params));
  }

  const ageCategory = getAgeCategoryFromDateString(applicantInformation.dateOfBirth);

  if (ageCategory === 'children') {
    throw redirect(getPathById('protected/application/$id/renew', params));
  }

  if (applicantInformationStateHasPartner(maritalStatus) && !partnerInformation) {
    throw redirect(getPathById('protected/application/$id/renewal-children/parent-or-guardian', params));
  }

  if (!applicantInformationStateHasPartner(maritalStatus) && partnerInformation) {
    throw redirect(getPathById('protected/application/$id/renewal-children/parent-or-guardian', params));
  }

  if (phoneNumber === undefined) {
    throw redirect(getPathById('protected/application/$id/renewal-children/parent-or-guardian', params));
  }

  if (mailingAddress === undefined) {
    throw redirect(getPathById('protected/application/$id/renewal-children/parent-or-guardian', params));
  }

  if (communicationPreferences === undefined) {
    throw redirect(getPathById('protected/application/$id/renewal-children/parent-or-guardian', params));
  }

  if ((communicationPreferences.value?.preferredMethod === COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID || communicationPreferences.value?.preferredMethod === COMMUNICATION_METHOD_GC_DIGITAL_ID) && !emailVerified) {
    throw redirect(getPathById('protected/application/$id/renewal-children/parent-or-guardian', params));
  }

  if (
    communicationPreferences.hasChanged === false &&
    (clientApplication.communicationPreferences.preferredMethodSunLife === COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID || clientApplication.communicationPreferences.preferredMethodGovernmentOfCanada === COMMUNICATION_METHOD_GC_DIGITAL_ID) &&
    !(clientApplication.contactInformation.email && clientApplication.contactInformation.emailVerified)
  ) {
    throw redirect(getPathById('protected/application/$id/renewal-children/parent-or-guardian', params));
  }

  return {
    ageCategory,
    applicantInformation,
    applicationYear,
    children,
    clientApplication,
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
    throw redirect(getPathById('protected/application/$id/renewal-children/childrens-application', params));
  }

  return children.map(({ id, dentalBenefits, dentalInsurance, information }) => {
    if (information === undefined) {
      throw redirect(getPathById('protected/application/$id/renewal-children/childrens-application', params));
    }

    if (information.dateOfBirth === '') {
      throw redirect(getPathById('protected/application/$id/renewal-children/childrens-application', params));
    }

    if (!information.isParent) {
      throw redirect(getPathById('protected/application/$id/renewal-children/childrens-application', params));
    }

    const ageCategory = getAgeCategoryFromDateString(information.dateOfBirth);

    if (ageCategory === 'adults' || ageCategory === 'seniors') {
      throw redirect(getPathById('protected/application/$id/renew', params));
    }

    if (dentalInsurance === undefined) {
      throw redirect(getPathById('protected/application/$id/renewal-children/childrens-application', params));
    }

    if (dentalBenefits === undefined) {
      throw redirect(getPathById('protected/application/$id/renewal-children/childrens-application', params));
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

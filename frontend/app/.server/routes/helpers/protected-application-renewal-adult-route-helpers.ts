import { redirect } from 'react-router';

import { invariant } from '@dts-stn/invariant';

import { createLogger } from '~/.server/logging';
import type { ApplicationStateParams, ProtectedApplicationState } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getAgeCategoryFromDateString, getProtectedApplicationState } from '~/.server/routes/helpers/protected-application-route-helpers';
import { getEnv } from '~/.server/utils/env.utils';
import type { Session } from '~/.server/web/session';
import { getPathById } from '~/utils/route-utils';

type ProtectedApplicationRenewalAdultState = OmitStrict<ProtectedApplicationState, 'clientApplication'> & {
  clientApplication: NonNullable<ProtectedApplicationState['clientApplication']>;
};

interface LoadProtectedApplicationRenewalAdultStateArgs {
  params: ApplicationStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads protected application renewal adult state.
 * @param args - The arguments.
 * @returns The loaded adult state.
 */
export function loadProtectedApplicationRenewalAdultState({ params, request, session }: LoadProtectedApplicationRenewalAdultStateArgs): ProtectedApplicationRenewalAdultState {
  const log = createLogger('protected-application-renewal-adult-route-helpers/loadProtectedApplicationRenewalAdultState');
  const { pathname } = new URL(request.url);
  const applicationState = getProtectedApplicationState({ params, session });

  if (applicationState.context !== 'renewal' || applicationState.typeOfApplication !== 'adult') {
    throw redirect(getPathById('protected/application/$id/type-application', params));
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = getPathById('protected/application/$id/renewal-adult/confirmation', params);
  if (applicationState.submissionInfo && !pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has been submitted; sessionId: [%s], ', confirmationRouteUrl, applicationState.id);
    throw redirect(confirmationRouteUrl);
  }

  // Redirect to the first flow page if the application has not been submitted and
  // the current route is the confirmation page.
  const typeOfApplicationRouteUrl = getPathById('protected/application/$id/type-of-application', params);
  if (!applicationState.submissionInfo && pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has not been submitted; sessionId: [%s], ', typeOfApplicationRouteUrl, applicationState.id);
    throw redirect(typeOfApplicationRouteUrl);
  }

  const { clientApplication, ...rest } = applicationState;
  invariant(clientApplication, 'clientApplication must be defined in the protected renewal adult application state');
  return { ...rest, clientApplication };
}

interface LoadProtectedApplicationRenewalAdultStateForReviewArgs {
  params: ApplicationStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads the application renewal adult state for the review page. It validates the state and throws a redirect if invalid.
 * @param args - The arguments.
 * @returns The validated adult state.
 */
export function loadProtectedApplicationRenewalAdultStateForReview({ params, request, session }: LoadProtectedApplicationRenewalAdultStateForReviewArgs) {
  const state = loadProtectedApplicationRenewalAdultState({ params, request, session });
  return validateProtectedRenewAdultStateForReview({ params, state });
}

interface ValidateProtectedRenewAdultStateForReviewArgs {
  params: ApplicationStateParams;
  state: ProtectedApplicationRenewalAdultState;
}

export function validateProtectedRenewAdultStateForReview({ params, state }: ValidateProtectedRenewAdultStateForReviewArgs) {
  const {
    applicantInformation,
    applicationYear,
    clientApplication,
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
    typeOfApplication,
    children,
  } = state;

  const { COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID, COMMUNICATION_METHOD_GC_DIGITAL_ID } = getEnv();

  if (termsAndConditions === undefined) {
    throw redirect(getPathById('protected/application/$id/eligibility-requirements', params));
  }

  if (context !== 'renewal') {
    throw redirect(getPathById('protected/application/$id/type-of-application', params));
  }

  if (typeOfApplication !== 'adult') {
    throw redirect(getPathById('protected/application/$id/type-of-application', params));
  }

  if (hasFiledTaxes === undefined) {
    throw redirect(getPathById('protected/application/$id/eligibility-requirements', params));
  }

  if (hasFiledTaxes === false) {
    throw redirect(getPathById('protected/application/$id/eligibility-requirements', params));
  }

  if (applicantInformation === undefined) {
    throw redirect(getPathById('protected/application/$id/type-of-application', params));
  }

  const ageCategory = getAgeCategoryFromDateString(applicantInformation.dateOfBirth);

  if (ageCategory === 'children') {
    throw redirect(getPathById('protected/application/$id/type-of-application', params));
  }

  if (ageCategory === 'youth' && livingIndependently === undefined) {
    throw redirect(getPathById('protected/application/$id/type-of-application', params));
  }

  if (ageCategory === 'youth' && livingIndependently === false) {
    throw redirect(getPathById('protected/application/$id/type-of-application', params));
  }

  if (phoneNumber === undefined) {
    throw redirect(getPathById('protected/application/$id/renewal-adult/contact-information', params));
  }

  if (mailingAddress === undefined) {
    throw redirect(getPathById('protected/application/$id/renewal-adult/contact-information', params));
  }

  if (communicationPreferences === undefined) {
    throw redirect(getPathById('protected/application/$id/renewal-adult/contact-information', params));
  }

  if ((communicationPreferences.value?.preferredMethod === COMMUNICATION_METHOD_SUNLIFE_EMAIL_ID || communicationPreferences.value?.preferredMethod === COMMUNICATION_METHOD_GC_DIGITAL_ID) && !emailVerified) {
    throw redirect(getPathById('protected/application/$id/renewal-adult/contact-information', params));
  }

  if (dentalInsurance === undefined) {
    throw redirect(getPathById('protected/application/$id/renewal-adult/dental-insurance', params));
  }

  if (dentalBenefits === undefined) {
    throw redirect(getPathById('protected/application/$id/renewal-adult/federal-provincial-territorial-benefits', params));
  }

  return {
    ageCategory,
    applicantInformation,
    applicationYear,
    clientApplication,
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
    typeOfApplication,
    children,
  };
}

import { redirect } from 'react-router';

import { createLogger } from '~/.server/logging';
import type { ApplicationStateParams, PublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';
import { getAgeCategoryFromDateString, getPublicApplicationState } from '~/.server/routes/helpers/public-application-route-helpers';
import type { Session } from '~/.server/web/session';
import { getPathById } from '~/utils/route-utils';

interface LoadPublicApplicationSimplifiedAdultStateArgs {
  params: ApplicationStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads public application simplified adult state.
 * @param args - The arguments.
 * @returns The loaded adult state.
 */
export function loadPublicApplicationSimplifiedAdultState({ params, request, session }: LoadPublicApplicationSimplifiedAdultStateArgs) {
  const log = createLogger('public-application-simplified-adult-route-helpers/loadPublicApplicationSimplifiedAdultState');
  const { pathname } = new URL(request.url);
  const applicationState = getPublicApplicationState({ params, session });

  if (applicationState.inputModel !== 'simplified' || applicationState.typeOfApplication !== 'adult') {
    throw redirect(getPathById('public/application/$id/type-application', params));
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = getPathById('public/application/$id/simplified-adult/confirmation', params);
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

interface LoadPublicApplicationSimplifiedAdultStateForReviewArgs {
  params: ApplicationStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads the application simplified adult state for the review page. It validates the state and throws a redirect if invalid.
 * @param args - The arguments.
 * @returns The validated adult state.
 */
export function loadPublicApplicationSimplifiedAdultStateForReview({ params, request, session }: LoadPublicApplicationSimplifiedAdultStateForReviewArgs) {
  const state = loadPublicApplicationSimplifiedAdultState({ params, request, session });
  return validatePublicRenewAdultStateForReview({ params, state });
}

interface ValidatePublicRenewAdultStateForReviewArgs {
  params: ApplicationStateParams;
  state: PublicApplicationState;
}

export function validatePublicRenewAdultStateForReview({ params, state }: ValidatePublicRenewAdultStateForReviewArgs) {
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
    inputModel,
    typeOfApplication,
    children,
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

  if (typeOfApplication !== 'adult') {
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

  if (ageCategory === 'youth' && livingIndependently === undefined) {
    throw redirect(getPathById('public/application/$id/type-of-application', params));
  }

  if (ageCategory === 'youth' && livingIndependently === false) {
    throw redirect(getPathById('public/application/$id/type-of-application', params));
  }

  if (phoneNumber === undefined) {
    throw redirect(getPathById('public/application/$id/simplified-adult/contact-information', params));
  }

  if (mailingAddress === undefined) {
    throw redirect(getPathById('public/application/$id/simplified-adult/contact-information', params));
  }

  if (communicationPreferences === undefined) {
    throw redirect(getPathById('public/application/$id/simplified-adult/contact-information', params));
  }

  if (dentalInsurance === undefined) {
    throw redirect(getPathById('public/application/$id/simplified-adult/dental-insurance', params));
  }

  if (dentalBenefits === undefined) {
    throw redirect(getPathById('public/application/$id/simplified-adult/federal-provincial-territorial-benefits', params));
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
    inputModel,
    typeOfApplication,
    children,
  };
}

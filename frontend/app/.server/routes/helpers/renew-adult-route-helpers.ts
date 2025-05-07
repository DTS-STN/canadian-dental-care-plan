import { redirect } from 'react-router';

import { createLogger } from '~/.server/logging';
import type { RenewState, RenewStateParams } from '~/.server/routes//helpers/renew-route-helpers';
import { loadRenewState, saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { isRedirectResponse } from '~/.server/utils/response.utils';
import type { Session } from '~/.server/web/session';
import { getPathById } from '~/utils/route-utils';

interface LoadRenewAdultStateArgs {
  params: RenewStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads renew Adult state.
 * @param args - The arguments.
 * @returns The loaded Adult state.
 */
export function loadRenewAdultState({ params, request, session }: LoadRenewAdultStateArgs) {
  const log = createLogger('renew-adult-route-helpers.server/loadRenewAdultState');
  const { pathname } = new URL(request.url);
  const renewState = loadRenewState({ params, session });

  if (renewState.typeOfRenewal !== 'adult') {
    throw redirect(getPathById('public/renew/$id/type-renewal', params));
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = getPathById('public/renew/$id/adult/confirmation', params);
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

interface LoadRenewAdultStateForReviewArgs {
  params: RenewStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads the renewal state for the review page. It validates the state and throws a redirect if invalid.
 * If a redirect exception is thrown, state.editMode is set to false.
 * @param args - The arguments.
 * @returns The validated adult state.
 */
export function loadRenewAdultStateForReview({ params, request, session }: LoadRenewAdultStateForReviewArgs) {
  const state = loadRenewAdultState({ params, request, session });

  try {
    return validateRenewAdultStateForReview({ params, state });
  } catch (error) {
    if (isRedirectResponse(error)) {
      saveRenewState({ params, session, state: { editMode: false } });
    }
    throw error;
  }
}

interface ValidateRenewAdultStateForReviewArgs {
  params: RenewStateParams;
  state: RenewState;
}

export function validateRenewAdultStateForReview({ params, state }: ValidateRenewAdultStateForReviewArgs) {
  const {
    applicationYear,
    hasMaritalStatusChanged,
    hasAddressChanged,
    maritalStatus,
    partnerInformation,
    contactInformation,
    homeAddress,
    mailingAddress,
    isHomeAddressSameAsMailingAddress,
    editMode,
    id,
    submissionInfo,
    typeOfRenewal,
    applicantInformation,
    clientApplication,
    dentalBenefits,
    dentalInsurance,
    demographicSurvey,
    hasFederalProvincialTerritorialBenefitsChanged,
  } = state;

  if (typeOfRenewal === undefined) {
    throw redirect(getPathById('public/renew/$id/type-renewal', params));
  }

  if (typeOfRenewal === 'delegate') {
    throw redirect(getPathById('public/renew/$id/renewal-delegate', params));
  }

  if (typeOfRenewal !== 'adult') {
    throw redirect(getPathById('public/renew/$id/type-renewal', params));
  }

  if (applicantInformation === undefined) {
    throw redirect(getPathById('public/renew/$id/applicant-information', params));
  }

  if (clientApplication === undefined) {
    throw redirect(getPathById('public/renew/$id/applicant-information', params));
  }

  if (hasMaritalStatusChanged === undefined) {
    throw redirect(getPathById('public/renew/$id/adult/confirm-marital-status', params));
  }

  if (hasMaritalStatusChanged && maritalStatus === undefined) {
    throw redirect(getPathById('public/renew/$id/adult/confirm-marital-status', params));
  }

  if (hasAddressChanged === undefined) {
    throw redirect(getPathById('public/renew/$id/adult/confirm-address', params));
  }

  if (hasAddressChanged && mailingAddress === undefined) {
    throw redirect(getPathById('public/renew/$id/adult/update-mailing-address', params));
  }

  if (hasAddressChanged && !isHomeAddressSameAsMailingAddress && homeAddress === undefined) {
    throw redirect(getPathById('public/renew/$id/adult/update-home-address', params));
  }

  if (contactInformation?.isNewOrUpdatedPhoneNumber === undefined) {
    throw redirect(getPathById('public/renew/$id/adult/confirm-phone', params));
  }

  if (contactInformation.isNewOrUpdatedEmail === undefined) {
    throw redirect(getPathById('public/renew/$id/adult/confirm-email', params));
  }

  if (dentalInsurance === undefined) {
    throw redirect(getPathById('public/renew/$id/adult/dental-insurance', params));
  }

  if (hasFederalProvincialTerritorialBenefitsChanged === undefined) {
    throw redirect(getPathById('public/renew/$id/adult/confirm-federal-provincial-territorial-benefits', params));
  }

  if (hasFederalProvincialTerritorialBenefitsChanged && dentalBenefits === undefined) {
    throw redirect(getPathById('public/renew/$id/adult/update-federal-provincial-territorial-benefits', params));
  }

  return {
    applicationYear,
    hasMaritalStatusChanged,
    maritalStatus,
    editMode,
    id,
    submissionInfo,
    typeOfRenewal,
    clientApplication,
    contactInformation,
    applicantInformation,
    dentalBenefits,
    dentalInsurance,
    homeAddress,
    mailingAddress,
    isHomeAddressSameAsMailingAddress,
    partnerInformation,
    hasAddressChanged,
    demographicSurvey,
    hasFederalProvincialTerritorialBenefitsChanged,
  };
}

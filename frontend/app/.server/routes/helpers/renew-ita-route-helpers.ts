import { redirect } from 'react-router';

import type { RenewState, RenewStateParams } from '~/.server/routes//helpers/renew-route-helpers';
import { loadRenewState, saveRenewState } from '~/.server/routes/helpers/renew-route-helpers';
import { getLogger } from '~/.server/utils/logging.utils';
import { isRedirectResponse } from '~/.server/utils/response.utils';
import type { Session } from '~/.server/web/session';
import { getPathById } from '~/utils/route-utils';

interface LoadRenewItaStateArgs {
  params: RenewStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads renew ITA state.
 * @param args - The arguments.
 * @returns The loaded ITA state.
 */
export function loadRenewItaState({ params, request, session }: LoadRenewItaStateArgs) {
  const log = getLogger('renew-ita-route-helpers.server/loadRenewItaState');
  const { pathname } = new URL(request.url);
  const renewState = loadRenewState({ params, session });

  if (renewState.typeOfRenewal !== 'adult-child' && renewState.typeOfRenewal !== 'adult') {
    throw redirect(getPathById('public/renew/$id/type-renewal', params));
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = getPathById('public/renew/$id/ita/confirmation', params);
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

interface LoadRenewItaStateForReviewArgs {
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
export function loadRenewItaStateForReview({ params, request, session }: LoadRenewItaStateForReviewArgs) {
  const state = loadRenewItaState({ params, request, session });

  try {
    return validateRenewItaStateForReview({ params, state });
  } catch (err) {
    if (isRedirectResponse(err)) {
      saveRenewState({ params, session, state: { editMode: false } });
    }
    throw err;
  }
}

interface ValidateRenewItaStateForReviewArgs {
  params: RenewStateParams;
  state: RenewState;
}

export function validateRenewItaStateForReview({ params, state }: ValidateRenewItaStateForReviewArgs) {
  const {
    applicationYear,
    maritalStatus,
    partnerInformation,
    contactInformation,
    editMode,
    id,
    submissionInfo,
    typeOfRenewal,
    isHomeAddressSameAsMailingAddress,
    mailingAddress,
    homeAddress,
    applicantInformation,
    clientApplication,
    dentalBenefits,
    dentalInsurance,
    hasAddressChanged,
    demographicSurvey,
  } = state;

  if (typeOfRenewal === undefined) {
    throw redirect(getPathById('public/renew/$id/type-renewal', params));
  }

  if (typeOfRenewal === 'delegate') {
    throw redirect(getPathById('public/renew/$id/renewal-delegate', params));
  }

  if (typeOfRenewal !== 'adult-child' && typeOfRenewal !== 'adult') {
    throw redirect(getPathById('public/renew/$id/type-renewal', params));
  }

  if (applicantInformation === undefined) {
    throw redirect(getPathById('public/renew/$id/applicant-information', params));
  }

  if (clientApplication === undefined) {
    throw redirect(getPathById('public/renew/$id/applicant-information', params));
  }

  if (maritalStatus === undefined) {
    throw redirect(getPathById('public/renew/$id/ita/marital-status', params));
  }

  if (contactInformation === undefined) {
    throw redirect(getPathById('public/renew/$id/ita/confirm-email', params));
  }

  if (hasAddressChanged === undefined) {
    throw redirect(getPathById('public/renew/$id/ita/confirm-address', params));
  }

  if (hasAddressChanged && mailingAddress === undefined) {
    throw redirect(getPathById('public/renew/$id/ita/update-mailing-address', params));
  }

  if (dentalInsurance === undefined) {
    throw redirect(getPathById('public/renew/$id/ita/dental-insurance', params));
  }

  if (dentalBenefits === undefined) {
    throw redirect(getPathById('public/renew/$id/ita/federal-provincial-territorial-benefits', params));
  }

  return {
    applicationYear,
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
    isHomeAddressSameAsMailingAddress,
    mailingAddress,
    homeAddress,
    partnerInformation,
    hasAddressChanged,
    demographicSurvey,
  };
}

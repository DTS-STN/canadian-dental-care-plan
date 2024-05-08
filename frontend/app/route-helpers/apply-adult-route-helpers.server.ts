import { Session, redirect } from '@remix-run/node';
import { Params } from '@remix-run/react';

import { ApplyState, loadApplyState, saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { ApplicantInformationState } from '~/routes/$lang+/_public+/apply+/$id+/adult/applicant-information';
import { CommunicationPreferencesState } from '~/routes/$lang+/_public+/apply+/$id+/adult/communication-preference';
import { DateOfBirthState } from '~/routes/$lang+/_public+/apply+/$id+/adult/date-of-birth';
import { DentalInsuranceState } from '~/routes/$lang+/_public+/apply+/$id+/adult/dental-insurance';
import { DisabilityTaxCreditState } from '~/routes/$lang+/_public+/apply+/$id+/adult/disability-tax-credit';
import { DentalBenefitsState } from '~/routes/$lang+/_public+/apply+/$id+/adult/federal-provincial-territorial-benefits';
import { LivingIndependentlyState } from '~/routes/$lang+/_public+/apply+/$id+/adult/living-independently';
import { PartnerInformationState } from '~/routes/$lang+/_public+/apply+/$id+/adult/partner-information';
import { PersonalInformationState } from '~/routes/$lang+/_public+/apply+/$id+/adult/personal-information';
import { SubmissionInfoState } from '~/routes/$lang+/_public+/apply+/$id+/adult/review-information';
import { TaxFilingState } from '~/routes/$lang+/_public+/apply+/$id+/adult/tax-filing';
import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';
import { getPathById } from '~/utils/route-utils';

const log = getLogger('apply-route-helpers.server');

export interface ApplyAdultState {
  readonly applicantInformation?: ApplicantInformationState;
  readonly communicationPreferences?: CommunicationPreferencesState;
  readonly dateOfBirth?: DateOfBirthState;
  readonly dentalBenefits?: DentalBenefitsState;
  readonly dentalInsurance?: DentalInsuranceState;
  readonly partnerInformation?: PartnerInformationState;
  readonly personalInformation?: PersonalInformationState;
  readonly submissionInfo?: SubmissionInfoState;
  readonly taxFiling2023?: TaxFilingState;
  readonly editMode: boolean;
  readonly disabilityTaxCredit?: DisabilityTaxCreditState;
  readonly livingIndependently?: LivingIndependentlyState;
}

interface LoadApplyAdultStateArgs {
  params: Params;
  request: Request;
  session: Session;
}

/**
 * Loads apply adult state.
 * @param args - The arguments.
 * @returns The loaded adult state.
 */
export function loadApplyAdultState({ params, request, session }: LoadApplyAdultStateArgs) {
  const { pathname } = new URL(request.url);
  const applyState = loadApplyState({ params, session }) as ApplyState & { adultState?: ApplyAdultState };

  if (applyState.typeOfApplication !== 'adult' || applyState.adultState === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = getPathById('$lang+/_public+/apply+/$id+/adult/confirmation', params);
  if (applyState.adultState.submissionInfo && !pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has been submitted; sessionId: [%s], ', applyState.id, confirmationRouteUrl);
    throw redirect(confirmationRouteUrl);
  }

  // Redirect to the first flow page if the application has not been submitted and
  // the current route is the confirmation page.
  const termsAndConditionsRouteUrl = getPathById('$lang+/_public+/apply+/$id+/terms-and-conditions', params);
  if (!applyState.adultState.submissionInfo && pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has not been submitted; sessionId: [%s], ', applyState.id, termsAndConditionsRouteUrl);
    throw redirect(termsAndConditionsRouteUrl);
  }

  return {
    ...applyState,
    adultState: applyState.adultState as ApplyAdultState,
  };
}

interface SaveStateArgs {
  params: Params;
  request: Request;
  session: Session;
  state: Partial<ApplyAdultState>;
  remove?: keyof ApplyAdultState;
}

/**
 * Saves state.
 * @param args - The arguments.
 * @returns The new adult state.
 */
export function saveApplyAdultState({ params, request, session, state, remove = undefined }: SaveStateArgs) {
  const currentState = loadApplyAdultState({ params, request, session });

  const newState: ApplyAdultState = {
    ...currentState.adultState,
    ...state,
  };

  if (remove && remove in newState) {
    delete newState[remove];
  }

  saveApplyState({ params, session, state: { adultState: newState } });

  return newState;
}

interface ApplicantInformationStateHasPartnerArgs {
  maritalStatus: string;
}

export function applicantInformationStateHasPartner({ maritalStatus }: ApplicantInformationStateHasPartnerArgs) {
  const { MARITAL_STATUS_CODE_MARRIED, MARITAL_STATUS_CODE_COMMONLAW } = getEnv();
  return [MARITAL_STATUS_CODE_MARRIED, MARITAL_STATUS_CODE_COMMONLAW].includes(Number(maritalStatus));
}

interface ValidateStateForReviewArgs {
  params: Params;
  state: ApplyState & { adultState?: ApplyAdultState };
}

export function validateApplyAdultStateForReview({ params, state }: ValidateStateForReviewArgs) {
  if (state.typeOfApplication === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
  }

  if (state.typeOfApplication === 'delegate') {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/application-delegate', params));
  }

  if (state.typeOfApplication !== 'adult') {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
  }

  if (state.adultState === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
  }

  if (state.adultState.taxFiling2023 === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/tax-filing', params));
  }

  if (state.adultState.taxFiling2023 === 'no') {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/file-taxes', params));
  }

  if (state.adultState.dateOfBirth === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/date-of-birth', params));
  }

  if (state.adultState.applicantInformation === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/applicant-information', params));
  }

  if (state.adultState.partnerInformation === undefined && applicantInformationStateHasPartner(state.adultState.applicantInformation)) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/partner-information', params));
  }

  if (state.adultState.partnerInformation !== undefined && !applicantInformationStateHasPartner(state.adultState.applicantInformation)) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/applicant-information', params));
  }

  if (state.adultState.personalInformation === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/personal-information', params));
  }

  if (state.adultState.communicationPreferences === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/communication-preference', params));
  }

  if (state.adultState.dentalInsurance === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/dental-insurance', params));
  }

  if (state.adultState.dentalBenefits === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/federal-provincial-territorial-benefits', params));
  }
}

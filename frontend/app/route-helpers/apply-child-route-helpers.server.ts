import { Session, redirect } from '@remix-run/node';
import { Params } from '@remix-run/react';

import { ApplyState, loadApplyState, saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { DisabilityTaxCreditState } from '~/routes/$lang+/_public+/apply+/$id+/adult-child/disability-tax-credit';
import { LivingIndependentlyState } from '~/routes/$lang+/_public+/apply+/$id+/adult-child/living-independently';
import { ApplicantInformationState } from '~/routes/$lang+/_public+/apply+/$id+/child/applicant-information';
import { CommunicationPreferencesState } from '~/routes/$lang+/_public+/apply+/$id+/child/communication-preference';
import { AllChildrenUnder18State, DateOfBirthState } from '~/routes/$lang+/_public+/apply+/$id+/child/date-of-birth';
import { DentalInsuranceState } from '~/routes/$lang+/_public+/apply+/$id+/child/dental-insurance';
import { DentalBenefitsState } from '~/routes/$lang+/_public+/apply+/$id+/child/federal-provincial-territorial-benefits';
import { PartnerInformationState } from '~/routes/$lang+/_public+/apply+/$id+/child/partner-information';
import { PersonalInformationState } from '~/routes/$lang+/_public+/apply+/$id+/child/personal-information';
import { SubmissionInfoState } from '~/routes/$lang+/_public+/apply+/$id+/child/review-information';
import { TaxFilingState } from '~/routes/$lang+/_public+/apply+/$id+/child/tax-filing';
import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';
import { getPathById } from '~/utils/route-utils';

const log = getLogger('apply-route-helpers.server');

export interface ApplyChildState {
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
  readonly allChildrenUnder18?: AllChildrenUnder18State;
}

interface LoadApplyChildStateArgs {
  params: Params;
  request: Request;
  session: Session;
}

/**
 * Loads apply child state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function loadApplyChildState({ params, request, session }: LoadApplyChildStateArgs) {
  const { pathname } = new URL(request.url);
  const applyState = loadApplyState({ params, session }) as ApplyState & { childState?: ApplyChildState };

  if (applyState.typeOfApplication !== 'child' || applyState.childState === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = getPathById('$lang+/_public+/apply+/$id+/child/confirmation', params);
  if (applyState.childState.submissionInfo && !pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has been submitted; sessionId: [%s], ', applyState.id, confirmationRouteUrl);
    throw redirect(confirmationRouteUrl);
  }

  // Redirect to the first flow page if the application has not been submitted and
  // the current route is the confirmation page.
  const termsAndConditionsRouteUrl = getPathById('$lang+/_public+/apply+/$id+/terms-and-conditions', params);
  if (!applyState.childState.submissionInfo && pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has not been submitted; sessionId: [%s], ', applyState.id, termsAndConditionsRouteUrl);
    throw redirect(termsAndConditionsRouteUrl);
  }

  return {
    ...applyState,
    childState: applyState.childState as ApplyChildState,
  };
}

interface SaveStateArgs {
  params: Params;
  request: Request;
  session: Session;
  state: Partial<ApplyChildState>;
  remove?: keyof ApplyChildState;
}

/**
 * Saves state.
 * @param args - The arguments.
 * @returns The new child state.
 */
export function saveApplyChildState({ params, request, session, state, remove = undefined }: SaveStateArgs) {
  const currentState = loadApplyChildState({ params, request, session });

  const newState: ApplyChildState = {
    ...currentState.childState,
    ...state,
  };

  if (remove && remove in newState) {
    delete newState[remove];
  }

  saveApplyState({ params, session, state: { childState: newState } });

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
  state: ApplyState & { childState?: ApplyChildState };
}

export function validateApplyChildStateForReview({ params, state }: ValidateStateForReviewArgs) {
  if (state.typeOfApplication === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
  }

  if (state.typeOfApplication === 'delegate') {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/application-delegate', params));
  }

  if (state.typeOfApplication !== 'child') {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
  }

  if (state.childState === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
  }

  if (state.childState.taxFiling2023 === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/child/tax-filing', params));
  }

  if (state.childState.taxFiling2023 === 'no') {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/child/file-taxes', params));
  }

  if (state.childState.dateOfBirth === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/child/date-of-birth', params));
  }

  if (state.childState.applicantInformation === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/child/applicant-information', params));
  }

  if (state.childState.partnerInformation === undefined && applicantInformationStateHasPartner(state.childState.applicantInformation)) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/child/partner-information', params));
  }

  if (state.childState.partnerInformation !== undefined && !applicantInformationStateHasPartner(state.childState.applicantInformation)) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/child/applicant-information', params));
  }

  if (state.childState.personalInformation === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/child/personal-information', params));
  }

  if (state.childState.communicationPreferences === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/child/communication-preference', params));
  }

  if (state.childState.dentalInsurance === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/child/dental-insurance', params));
  }

  if (state.childState.dentalBenefits === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/child/federal-provincial-territorial-benefits', params));
  }
}

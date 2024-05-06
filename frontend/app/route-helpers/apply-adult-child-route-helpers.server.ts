import { Session, redirect } from '@remix-run/node';
import { Params } from '@remix-run/react';

import { ApplyState, loadApplyState, saveApplyState } from '~/route-helpers/apply-route-helpers.server';
import { ChildInformationState } from '~/routes/$lang+/_public+/apply+/$id+/adult-child/child-information';
import { AllChildrenUnder18State, DateOfBirthState } from '~/routes/$lang+/_public+/apply+/$id+/adult-child/date-of-birth';
import { TaxFilingState } from '~/routes/$lang+/_public+/apply+/$id+/adult-child/tax-filing';
import { SubmissionInfoState } from '~/routes/$lang+/_public+/apply+/$id+/adult/review-information';
import { DisabilityTaxCreditState } from '~/routes/$lang+/_public+/apply+/$id+/disability-tax-credit';
import { LivingIndependentlyState } from '~/routes/$lang+/_public+/apply+/$id+/living-independently';
import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';
import { getPathById } from '~/utils/route-utils';

const log = getLogger('apply-route-helpers.server');

export interface ApplyAdultChildState {
  readonly taxFiling2023?: TaxFilingState;
  readonly dateOfBirth?: DateOfBirthState;
  readonly submissionInfo?: SubmissionInfoState;
  readonly editMode: boolean;
  readonly disabilityTaxCredit?: DisabilityTaxCreditState;
  readonly livingIndependently?: LivingIndependentlyState;
  readonly allChildrenUnder18?: AllChildrenUnder18State;
  readonly childInformation?: ChildInformationState;
}

interface LoadApplyAdultChildStateArgs {
  params: Params;
  request: Request;
  session: Session;
}

/**
 * Loads apply adult child(ren) state.
 * @param args - The arguments.
 * @returns The loaded adult child(ren) state.
 */
export function loadApplyAdultChildState({ params, request, session }: LoadApplyAdultChildStateArgs) {
  const { pathname } = new URL(request.url);
  const applyState = loadApplyState({ params, session }) as ApplyState & { adultChildState?: ApplyAdultChildState };

  if (applyState.typeOfApplication !== 'adult-child' || applyState.adultChildState === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = getPathById('$lang+/_public+/apply+/$id+/adult-child/confirmation', params);
  if (applyState.adultChildState.submissionInfo && !pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has been submitted; sessionId: [%s], ', applyState.id, confirmationRouteUrl);
    throw redirect(confirmationRouteUrl);
  }

  // Redirect to the first flow page if the application has not been submitted and
  // the current route is the confirmation page.
  const termsAndConditionsRouteUrl = getPathById('$lang+/_public+/apply+/$id+/terms-and-conditions', params);
  if (!applyState.adultChildState.submissionInfo && pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has not been submitted; sessionId: [%s], ', applyState.id, termsAndConditionsRouteUrl);
    throw redirect(termsAndConditionsRouteUrl);
  }

  return {
    ...applyState,
    adultChildState: applyState.adultChildState as ApplyAdultChildState,
  };
}

interface SaveStateArgs {
  params: Params;
  request: Request;
  session: Session;
  state: Partial<ApplyAdultChildState>;
  remove?: keyof ApplyAdultChildState;
}

/**
 * Saves state.
 * @param args - The arguments.
 * @returns The new adult child(ren) state.
 */
export function saveApplyAdultChildState({ params, request, session, state, remove = undefined }: SaveStateArgs) {
  const currentState = loadApplyAdultChildState({ params, request, session });

  const newState: ApplyAdultChildState = {
    ...currentState.adultChildState,
    ...state,
  };

  if (remove && remove in newState) {
    delete newState[remove];
  }

  saveApplyState({ params, session, state: { adultChildState: newState } });

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
  state: ApplyState & { adultChildState?: ApplyAdultChildState };
}

export function validateApplyAdultChildStateForReview({ params, state }: ValidateStateForReviewArgs) {
  if (state.typeOfApplication === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
  }

  if (state.typeOfApplication === 'delegate') {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/application-delegate', params));
  }

  if (state.typeOfApplication !== 'adult-child') {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
  }

  if (state.adultChildState === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
  }

  if (state.adultChildState.taxFiling2023 === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/tax-filing', params));
  }

  if (state.adultChildState.taxFiling2023 === 'no') {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/file-taxes', params));
  }

  if (state.adultChildState.dateOfBirth === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult-child/date-of-birth', params));
  }

  // TODO: Need to create routes for adult-child flow
  // if (state.adultChildState.applicantInformation === undefined) {
  //   throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/applicant-information', params));
  // }

  // if (state.adultChildState.partnerInformation === undefined && applicantInformationStateHasPartner(state.adultChildState.applicantInformation)) {
  //   throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/partner-information', params));
  // }

  // if (state.adultChildState.partnerInformation !== undefined && !applicantInformationStateHasPartner(state.adultChildState.applicantInformation)) {
  //   throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/applicant-information', params));
  // }

  // if (state.adultChildState.personalInformation === undefined) {
  //   throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/personal-information', params));
  // }

  // if (state.adultChildState.communicationPreferences === undefined) {
  //   throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/communication-preference', params));
  // }

  // if (state.adultChildState.dentalInsurance === undefined) {
  //   throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/dental-insurance', params));
  // }

  // if (state.adultChildState.dentalBenefits === undefined) {
  //   throw redirect(getPathById('$lang+/_public+/apply+/$id+/adult/federal-provincial-territorial-benefits', params));
  // }
}

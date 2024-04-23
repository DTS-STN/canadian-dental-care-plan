import { Session, redirect } from '@remix-run/node';
import { Params } from '@remix-run/react';

import { differenceInMinutes } from 'date-fns';
import { z } from 'zod';

import { ApplicantInformationState } from '~/routes/$lang+/_public+/apply+/$id+/applicant-information';
import { CommunicationPreferencesState } from '~/routes/$lang+/_public+/apply+/$id+/communication-preference';
import { DateOfBirthState } from '~/routes/$lang+/_public+/apply+/$id+/date-of-birth';
import { DentalInsuranceState } from '~/routes/$lang+/_public+/apply+/$id+/dental-insurance';
import { DisabilityTaxCreditState } from '~/routes/$lang+/_public+/apply+/$id+/disability-tax-credit';
import { DentalBenefitsState } from '~/routes/$lang+/_public+/apply+/$id+/federal-provincial-territorial-benefits';
import { LivingIndependentlyState } from '~/routes/$lang+/_public+/apply+/$id+/living-independently';
import { PartnerInformationState } from '~/routes/$lang+/_public+/apply+/$id+/partner-information';
import { PersonalInformationState } from '~/routes/$lang+/_public+/apply+/$id+/personal-information';
import { SubmissionInfoState } from '~/routes/$lang+/_public+/apply+/$id+/review-information';
import { TaxFilingState } from '~/routes/$lang+/_public+/apply+/$id+/tax-filing';
import { TypeOfApplicationState } from '~/routes/$lang+/_public+/apply+/$id+/type-application';
import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';
import { getPathById } from '~/utils/route-utils';

const log = getLogger('apply-route-helpers.server');

/**
 * Schema for validating UUID.
 */
const idSchema = z.string().uuid();

export interface ApplyState {
  readonly id: string;
  readonly applicantInformation?: ApplicantInformationState;
  readonly communicationPreferences?: CommunicationPreferencesState;
  readonly dateOfBirth?: DateOfBirthState;
  readonly dentalBenefits?: DentalBenefitsState;
  readonly dentalInsurance?: DentalInsuranceState;
  readonly partnerInformation?: PartnerInformationState;
  readonly personalInformation?: PersonalInformationState;
  readonly submissionInfo?: SubmissionInfoState;
  readonly taxFiling2023?: TaxFilingState;
  readonly typeOfApplication?: TypeOfApplicationState;
  readonly editMode: boolean;
  readonly lastUpdatedOn: string;
  readonly disabilityTaxCredit?: DisabilityTaxCreditState;
  readonly livingIndependently?: LivingIndependentlyState;
}

/**
 * Gets the session name.
 * @param id - The ID.
 * @returns The session name.
 */
function getSessionName(id: string) {
  return `apply-flow-${idSchema.parse(id)}`;
}

interface LoadStateArgs {
  params: Params;
  request: Request;
  session: Session;
}

/**
 * Loads state.
 * @param args - The arguments.
 * @returns The loaded state.
 */
async function loadState({ params, request, session }: LoadStateArgs) {
  const { pathname } = new URL(request.url);
  const parsedId = idSchema.safeParse(params.id);

  if (!parsedId.success) {
    log.warn('Invalid "id" param format; id: [%s]', params.id);
    throw redirect(getPathById('$lang+/_public+/apply+/index', params));
  }

  const sessionName = getSessionName(parsedId.data);

  if (!session.has(sessionName)) {
    log.warn('Apply session has not been found; sessionName: [%s]', sessionName);
    throw redirect(getPathById('$lang+/_public+/apply+/index', params));
  }

  const state: ApplyState = session.get(sessionName);

  // Checks if the elapsed time since the last update exceeds 15 minutes,
  // and performs necessary actions if it does.
  const lastUpdatedOn = new Date(state.lastUpdatedOn);
  const now = new Date();

  if (differenceInMinutes(now, lastUpdatedOn) >= 15) {
    session.unset(sessionName);
    log.warn('Apply session has expired; sessionName: [%s]', sessionName);
    throw redirect(getPathById('$lang+/_public+/apply+/index', params));
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = getPathById('$lang+/_public+/apply+/$id+/confirmation', params);
  if (state.submissionInfo && !pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has been submitted; sessionName: [%s], ', sessionName, confirmationRouteUrl);
    throw redirect(confirmationRouteUrl);
  }

  // Redirect to the first flow page if the application has not been submitted and
  // the current route is the confirmation page.
  const termsAndConditionsRouteUrl = getPathById('$lang+/_public+/apply+/$id+/terms-and-conditions', params);
  if (!state.submissionInfo && pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has not been submitted; sessionName: [%s], ', sessionName, termsAndConditionsRouteUrl);
    throw redirect(termsAndConditionsRouteUrl);
  }

  return state;
}

interface SaveStateArgs {
  params: Params;
  request: Request;
  session: Session;
  state: Partial<Omit<ApplyState, 'id' | 'lastUpdatedOn'>>;
  remove?: keyof Omit<ApplyState, 'id' | 'lastUpdatedOn'>;
}

/**
 * Saves state.
 * @param args - The arguments.
 * @returns The Set-Cookie header to be used in the HTTP response.
 */
async function saveState({ params, request, session, state, remove = undefined }: SaveStateArgs) {
  const currentState = await loadState({ params, request, session });

  const newState: ApplyState = {
    ...currentState,
    ...state,
    lastUpdatedOn: new Date().toISOString(),
  };

  if (remove && remove in newState) {
    delete newState[remove];
  }

  const sessionName = getSessionName(currentState.id);
  session.set(sessionName, newState);

  return newState;
}

interface ClearStateArgs {
  params: Params;
  request: Request;
  session: Session;
}

/**
 * Clears state.
 * @param args - The arguments.
 * @returns The Set-Cookie header to be used in the HTTP response.
 */
async function clearState({ params, request, session }: ClearStateArgs) {
  const { id } = await loadState({ params, request, session });

  const sessionName = getSessionName(id);
  session.unset(sessionName);
}

interface StartArgs {
  id: string;
  session: Session;
}

/**
 * Starts apply flow.
 * @param args - The arguments.
 * @returns The Set-Cookie header to be used in the HTTP response.
 */
async function start({ id, session }: StartArgs) {
  const parsedId = idSchema.parse(id);

  const initialState: ApplyState = {
    id: parsedId,
    editMode: false,
    lastUpdatedOn: new Date().toISOString(),
  };

  const sessionName = getSessionName(parsedId);
  session.set(sessionName, initialState);

  return initialState;
}

interface ValidateStateForReviewArgs {
  params: Params;
  state: ApplyState;
}

interface HasPartnerArgs {
  maritalStatus: string;
}

function hasPartner({ maritalStatus }: HasPartnerArgs) {
  const { MARITAL_STATUS_CODE_MARRIED, MARITAL_STATUS_CODE_COMMONLAW } = getEnv();
  return [MARITAL_STATUS_CODE_MARRIED, MARITAL_STATUS_CODE_COMMONLAW].includes(Number(maritalStatus));
}

interface ValidateStateForReviewArgs {
  params: Params;
  state: ApplyState;
}

function validateStateForReview({ params, state }: ValidateStateForReviewArgs) {
  if (state.typeOfApplication === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/type-application', params));
  }

  if (state.typeOfApplication === 'delegate') {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/application-delegate', params));
  }

  if (state.taxFiling2023 === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/tax-filing', params));
  }

  if (state.taxFiling2023 === 'no') {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/file-taxes', params));
  }

  if (state.dateOfBirth === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/date-of-birth', params));
  }

  if (state.applicantInformation === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/applicant-information', params));
  }

  if (state.partnerInformation === undefined && hasPartner(state.applicantInformation)) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/partner-information', params));
  }

  if (state.partnerInformation !== undefined && !hasPartner(state.applicantInformation)) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/applicant-information', params));
  }

  if (state.personalInformation === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/personal-information', params));
  }

  if (state.communicationPreferences === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/communication-preference', params));
  }

  if (state.dentalInsurance === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/dental-insurance', params));
  }

  if (state.dentalBenefits === undefined) {
    throw redirect(getPathById('$lang+/_public+/apply+/$id+/federal-provincial-territorial-benefits', params));
  }
}

/**
 * Returns functions related to the apply routes.
 * @returns Functions related to the apply routes.
 */
export function getApplyRouteHelpers() {
  return {
    clearState,
    hasPartner,
    loadState,
    saveState,
    start,
    validateStateForReview,
  };
}

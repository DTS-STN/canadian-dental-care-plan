import { Session } from '@remix-run/node';
import { Params } from '@remix-run/react';

import { differenceInMinutes } from 'date-fns';
import { z } from 'zod';

import { ApplicantInformationState } from '~/routes/$lang+/_public+/apply+/$id+/applicant-information';
import { CommunicationPreferencesState } from '~/routes/$lang+/_public+/apply+/$id+/communication-preference';
import { DateOfBirthState } from '~/routes/$lang+/_public+/apply+/$id+/date-of-birth';
import { DentalInsuranceState } from '~/routes/$lang+/_public+/apply+/$id+/dental-insurance';
import { DentalBenefitsState } from '~/routes/$lang+/_public+/apply+/$id+/federal-provincial-territorial-benefits';
import { PartnerInformationState } from '~/routes/$lang+/_public+/apply+/$id+/partner-information';
import { PersonalInformationState } from '~/routes/$lang+/_public+/apply+/$id+/personal-information';
import { ReviewInformationState, SubmissionInfoState } from '~/routes/$lang+/_public+/apply+/$id+/review-information';
import { TaxFilingState } from '~/routes/$lang+/_public+/apply+/$id+/tax-filing';
import { TypeOfApplicationState } from '~/routes/$lang+/_public+/apply+/$id+/type-application';
import { redirectWithLocale } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('apply-route-helpers.server');

/**
 * Schema for validating UUID.
 */
const idSchema = z.string().uuid();

interface ApplyState {
  applicantInformation?: ApplicantInformationState;
  communicationPreferences?: CommunicationPreferencesState;
  dateOfBirth?: DateOfBirthState;
  dentalBenefits?: DentalBenefitsState;
  dentalInsurance?: DentalInsuranceState;
  editMode?: ReviewInformationState;
  partnerInformation?: PartnerInformationState;
  personalInformation?: PersonalInformationState;
  submissionInfo?: SubmissionInfoState;
  taxFiling2023?: TaxFilingState;
  typeOfApplication?: TypeOfApplicationState;
}

/**
 * Gets the session name.
 * @param id - The ID.
 * @returns The session name.
 */
function getSessionName(id: string) {
  return `apply-flow-${idSchema.parse(id)}`;
}

/**
 * Generates a session name based on the provided ID for time updates in the application flow.
 * @param id - The ID used to generate the session name.
 * @returns The generated session name.
 */
function getTimeUpdatedSessionName(id: string) {
  return `apply-flow-${idSchema.parse(id)}-time-updated`;
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
  const applyRouteUrl = '/apply';
  const { pathname } = new URL(request.url);
  const parsedId = idSchema.safeParse(params.id);

  if (!parsedId.success) {
    log.warn('Invalid "id" param format; id: [%s]', params.id);
    throw redirectWithLocale(request, applyRouteUrl);
  }

  const id = parsedId.data;
  const sessionName = getSessionName(id);

  if (!session.has(sessionName)) {
    log.warn('Apply session has not been found; sessionName: [%s]', sessionName);
    throw redirectWithLocale(request, applyRouteUrl);
  }

  const state: ApplyState = session.get(sessionName);

  // Checks if the elapsed time since the last update exceeds 15 minutes,
  // and performs necessary actions if it does.
  const timeUpdatedSessionName = getTimeUpdatedSessionName(id);
  const timeUpdatedSession: string = session.get(timeUpdatedSessionName);
  const timeUpdated = new Date(timeUpdatedSession);
  const now = new Date();

  if (differenceInMinutes(now, timeUpdated) >= 15) {
    session.unset(sessionName);
    session.unset(timeUpdatedSessionName);
    log.warn('Apply session has expired; sessionName: [%s]', sessionName);
    throw redirectWithLocale(request, applyRouteUrl);
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = `/apply/${id}/confirmation`;
  if (state.submissionInfo && !pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has been submitted; sessionName: [%s], ', sessionName, confirmationRouteUrl);
    throw redirectWithLocale(request, confirmationRouteUrl);
  }

  // Redirect to the first flow page if the application has not been submitted and
  // the current route is the confirmation page.
  const termsAndConditionsRouteUrl = `/apply/${id}/terms-and-condition`;
  if (!state.submissionInfo && pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has not been submitted; sessionName: [%s], ', sessionName, termsAndConditionsRouteUrl);
    throw redirectWithLocale(request, termsAndConditionsRouteUrl);
  }

  return { id: id, state };
}

interface SaveStateArgs {
  params: Params;
  request: Request;
  session: Session;
  state: ApplyState;
  remove?: keyof ApplyState;
}

/**
 * Saves state.
 * @param args - The arguments.
 * @returns The Set-Cookie header to be used in the HTTP response.
 */
async function saveState({ params, request, session, state, remove = undefined }: SaveStateArgs) {
  const { id, state: currentState } = await loadState({ params, request, session });
  const newState = { ...currentState, ...state };

  if (remove && remove in newState) {
    delete newState[remove];
  }

  const sessionName = getSessionName(id);
  session.set(sessionName, newState);

  const timeUpdatedSessionName = getTimeUpdatedSessionName(id);
  session.set(timeUpdatedSessionName, new Date().toISOString());

  return {};
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

  const timeUpdatedSessionName = getTimeUpdatedSessionName(id);
  session.unset(timeUpdatedSessionName);

  return {};
}

interface StartArgs {
  id: string;
  request: Request;
  session: Session;
}

/**
 * Starts apply flow.
 * @param args - The arguments.
 * @returns The Set-Cookie header to be used in the HTTP response.
 */
async function start({ id, request, session }: StartArgs) {
  const parsedId = idSchema.parse(id);
  const initialState = {};

  const sessionName = getSessionName(parsedId);
  session.set(sessionName, initialState);

  const timeUpdatedSessionName = getTimeUpdatedSessionName(id);
  session.set(timeUpdatedSessionName, new Date().toISOString());

  return {};
}

/**
 * Returns functions related to the apply routes.
 * @returns Functions related to the apply routes.
 */
export function getApplyRouteHelpers() {
  return {
    clearState,
    loadState,
    saveState,
    start,
  };
}

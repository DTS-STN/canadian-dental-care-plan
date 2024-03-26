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
import { TypeOfApplicationState } from '~/routes/$lang+/_public+/apply+/$id+/type-of-application';
import { getSessionService } from '~/services/session-service.server';
import { redirectWithLocale } from '~/utils/locale-utils.server';

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
}

/**
 * Loads state.
 * @param args - The arguments.
 * @returns The loaded state.
 */
async function loadState({ params, request }: LoadStateArgs) {
  const applyRouteUrl = '/apply';
  const { pathname } = new URL(request.url);
  const parsedId = idSchema.safeParse(params.id);

  if (!parsedId.success) {
    throw redirectWithLocale(request, applyRouteUrl);
  }

  const id = parsedId.data;

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);
  const sessionName = getSessionName(id);

  if (!session.has(sessionName)) {
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
    throw redirectWithLocale(request, applyRouteUrl, {
      headers: {
        'Set-Cookie': await sessionService.commitSession(session),
      },
    });
  }

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = `/apply/${id}/confirmation`;
  if (state.submissionInfo && !pathname.endsWith(confirmationRouteUrl)) {
    throw redirectWithLocale(request, confirmationRouteUrl);
  }

  // Redirect to the first flow page if the application has not been submitted and
  // the current route is the confirmation page.
  if (!state.submissionInfo && pathname.endsWith(confirmationRouteUrl)) {
    throw redirectWithLocale(request, `/apply/${id}/type-of-application`);
  }

  return { id: id, state };
}

interface SaveStateArgs {
  params: Params;
  request: Request;
  state: ApplyState;
  remove?: keyof ApplyState;
}

/**
 * Saves state.
 * @param args - The arguments.
 * @returns The Set-Cookie header to be used in the HTTP response.
 */
async function saveState({ params, request, state, remove = undefined }: SaveStateArgs) {
  const { id, state: currentState } = await loadState({ params, request });
  const newState = { ...currentState, ...state };

  if (remove && remove in newState) {
    delete newState[remove];
  }

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);

  const sessionName = getSessionName(id);
  session.set(sessionName, newState);

  const timeUpdatedSessionName = getTimeUpdatedSessionName(id);
  session.set(timeUpdatedSessionName, new Date().toISOString());

  return {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  };
}

interface ClearStateArgs {
  params: Params;
  request: Request;
}

/**
 * Clears state.
 * @param args - The arguments.
 * @returns The Set-Cookie header to be used in the HTTP response.
 */
async function clearState({ params, request }: ClearStateArgs) {
  const { id } = await loadState({ params, request });

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);

  const sessionName = getSessionName(id);
  session.unset(sessionName);

  const timeUpdatedSessionName = getTimeUpdatedSessionName(id);
  session.unset(timeUpdatedSessionName);

  return {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  };
}

interface StartArgs {
  id: string;
  request: Request;
}

/**
 * Starts apply flow.
 * @param args - The arguments.
 * @returns The Set-Cookie header to be used in the HTTP response.
 */
async function start({ id, request }: StartArgs) {
  const parsedId = idSchema.parse(id);
  const initialState = {};

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);

  const sessionName = getSessionName(parsedId);
  session.set(sessionName, initialState);

  const timeUpdatedSessionName = getTimeUpdatedSessionName(id);
  session.set(timeUpdatedSessionName, new Date().toISOString());

  return {
    headers: {
      'Set-Cookie': await sessionService.commitSession(session),
    },
  };
}

/**
 * Returns functions related to the apply flow.
 * @returns Functions related to the apply flow.
 */
export function getApplyFlow() {
  return {
    clearState,
    loadState,
    saveState,
    start,
  };
}

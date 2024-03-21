import { Params } from '@remix-run/react';

import { z } from 'zod';

import { ApplicantInformationState } from '~/routes/$lang+/_public+/apply+/$id+/applicant-information';
import { CommunicationPreferencesState } from '~/routes/$lang+/_public+/apply+/$id+/communication-preference';
import { DateOfBirthState } from '~/routes/$lang+/_public+/apply+/$id+/date-of-birth';
import { DentalInsuranceState } from '~/routes/$lang+/_public+/apply+/$id+/dental-insurance';
import { DentalBenefitsState } from '~/routes/$lang+/_public+/apply+/$id+/federal-provincial-territorial-benefits';
import { PartnerInformationState } from '~/routes/$lang+/_public+/apply+/$id+/partner-information';
import { PersonalInformationState } from '~/routes/$lang+/_public+/apply+/$id+/personal-information';
import { TaxFilingState } from '~/routes/$lang+/_public+/apply+/$id+/tax-filing';
import { TypeOfApplicationState } from '~/routes/$lang+/_public+/apply+/$id+/type-of-application';
import { getSessionService } from '~/services/session-service.server';
import { redirectWithLocale } from '~/utils/locale-utils.server';

/**
 * Schema for validating UUID.
 */
const idSchema = z.string().uuid();

interface ApplyState {
  dateOfBirth?: DateOfBirthState;
  dentalInsurance?: DentalInsuranceState;
  partnerInformation?: PartnerInformationState;
  typeOfApplication?: TypeOfApplicationState;
  personalInformation?: PersonalInformationState;
  dentalBenefits?: DentalBenefitsState;
  applicantInformation?: ApplicantInformationState;
  communicationPreferences?: CommunicationPreferencesState;
  taxFiling2023?: TaxFilingState;
}

/**
 * Gets the session name.
 * @param id - The ID.
 * @returns The session name.
 */
function getSessionName(id: string) {
  return `apply-flow-` + idSchema.parse(id);
}

interface LoadStateArgs {
  params: Params;
  request: Request;
  fallbackRedirectUrl?: string;
}

/**
 * Loads state.
 * @param args - The arguments.
 * @returns The loaded state.
 */
async function loadState({ params, request, fallbackRedirectUrl = '/apply' }: LoadStateArgs) {
  const id = idSchema.safeParse(params.id);

  if (!id.success) {
    throw redirectWithLocale(request, fallbackRedirectUrl, 302);
  }

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);

  const sessionName = getSessionName(id.data);

  if (!session.has(sessionName)) {
    throw redirectWithLocale(request, fallbackRedirectUrl, 302);
  }

  const state = session.get(sessionName) as ApplyState;
  return { id: id.data, state };
}

interface SaveStateArgs {
  params: Params;
  request: Request;
  state: ApplyState;
}

/**
 * Saves state.
 * @param args - The arguments.
 * @returns The Set-Cookie header to be used in the HTTP response.
 */
async function saveState({ params, request, state }: SaveStateArgs) {
  const { id, state: currentState } = await loadState({ params, request });
  const newState = { ...currentState, ...state };

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);

  const sessionName = getSessionName(id);
  session.set(sessionName, newState);

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

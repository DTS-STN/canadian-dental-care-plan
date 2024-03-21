import { Params } from '@remix-run/react';

import { z } from 'zod';

import { ApplicantInformationState } from '~/routes/$lang+/_public+/apply+/$id+/applicant-information';
import { DateOfBirthState } from '~/routes/$lang+/_public+/apply+/$id+/date-of-birth';
import { DentalInsuranceState } from '~/routes/$lang+/_public+/apply+/$id+/dental-insurance';
import { DentalBenefitsState } from '~/routes/$lang+/_public+/apply+/$id+/federal-provincial-territorial-benefits';
import { PartnerInformationState } from '~/routes/$lang+/_public+/apply+/$id+/partner-information';
import { PersonalInformationState } from '~/routes/$lang+/_public+/apply+/$id+/personal-information';
import { TypeOfApplicationState } from '~/routes/$lang+/_public+/apply+/$id+/type-of-application';
import { getSessionService } from '~/services/session-service.server';
import { redirectWithLocale } from '~/utils/locale-utils.server';

/**
 * Schema for validating UUID.
 */
const idSchema = z.string().uuid();

/**
 * Schema for tax filing.
 */
const taxFilingSchema = z.object({
  taxFiling2023: z.string(),
});

/**
 * Schema for communication reference.
 */
const communicationPreferencesStateSchema = z.object({
  preferredLanguage: z.string().min(1),
  preferredMethod: z.string().min(1),
  email: z.string().min(1).optional(),
  confirmEmail: z.string().min(1).optional(),
  emailForFuture: z.string().optional(),
  confirmEmailForFuture: z.string().optional(),
});

/**
 * Schema for demographic reference.
 */
const demographicsPart1StateSchema = z.object({
  otherEquity: z.string().trim().min(1).optional(),
  indigenousType: z.string().trim().optional(),
  indigenousGroup: z.string().trim().optional(),
  bornType: z.string().trim().optional(),
  disabilityType: z.string().trim().optional(),
});

/**
 * Schema for communication reference.
 */
const demographicsPart2StateSchema = z.object({
  gender: z.string().trim().optional(),
  otherGender: z.string().min(1).optional(),
  mouthPainType: z.string().trim().optional(),
  lastDentalVisitType: z.string().trim().optional(),
  avoidedDentalCareDueToCost: z.string().trim().optional(),
});

/**
 * Schema for apply state.
 */
const applyStateSchema = z.object({
  communicationPreferences: communicationPreferencesStateSchema.optional(),
  demographicsPart1: demographicsPart1StateSchema.optional(),
  demographicsPart2: demographicsPart2StateSchema.optional(),
  taxFiling2023: taxFilingSchema.optional(),
});

interface ApplyState extends z.infer<typeof applyStateSchema> {
  dateOfBirth?: DateOfBirthState;
  dentalInsurance?: DentalInsuranceState;
  partnerInformation?: PartnerInformationState;
  typeOfApplication?: TypeOfApplicationState;
  personalInformation?: PersonalInformationState;
  dentalBenefits?: DentalBenefitsState;
  applicantInformation?: ApplicantInformationState;
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
    applyStateSchema,
    loadState,
    saveState,
    start,
    taxFilingSchema,
    demographicsPart2StateSchema,
    demographicsPart1StateSchema,
  };
}

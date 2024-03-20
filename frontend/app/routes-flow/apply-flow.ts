import { Params } from '@remix-run/react';

import { z } from 'zod';

import { DateOfBirthState } from '~/routes/$lang+/_public+/apply+/$id+/date-of-birth';
import { DentalInsuranceState } from '~/routes/$lang+/_public+/apply+/$id+/dental-insurance';
import { DentalBenefitsState } from '~/routes/$lang+/_public+/apply+/$id+/federal-provincial-territorial-benefits';
import { PartnerInformationState } from '~/routes/$lang+/_public+/apply+/$id+/partner-information';
import { TypeOfApplicationState } from '~/routes/$lang+/_public+/apply+/$id+/type-of-application';
import { getSessionService } from '~/services/session-service.server';
import { redirectWithLocale } from '~/utils/locale-utils.server';
import { isValidSin } from '~/utils/sin-utils';

/**
 * Schema for validating UUID.
 */
const idSchema = z.string().uuid();

/**
 * Schema for terms and conditions
 */
const termsAndConditionSchema = z.object({});

/**
 * Schema applicant information.
 */
const applicantInformationSchema = z.object({
  socialInsuranceNumber: z.string().refine(isValidSin, { message: 'valid-sin' }),
  firstName: z.string().optional(),
  lastName: z.string().min(1, { message: 'last-name' }),
  maritalStatus: z.string({ required_error: 'marital-status' }),
});

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
 * Schema for personal information.
 */
const personalInformationStateSchema = z.object({
  phoneNumber: z.string().optional(),
  phoneNumberAlt: z.string().optional(),
  mailingAddress: z.string().min(1),
  mailingApartment: z.string().optional(),
  mailingCountry: z.string().min(1),
  mailingProvince: z.string().min(1).optional(),
  mailingCity: z.string().min(1),
  mailingPostalCode: z.string().optional(),
  copyMailingAddress: z.string().optional(),
  homeAddress: z.string().optional(),
  homeApartment: z.string().optional(),
  homeCountry: z.string().optional(),
  homeProvince: z.string().optional(),
  homeCity: z.string().optional(),
  homePostalCode: z.string().optional(),
});

/**
 * Schema for apply state.
 */
const applyStateSchema = z.object({
  applicantInformation: applicantInformationSchema.optional(),
  personalInformation: personalInformationStateSchema.optional(),
  communicationPreferences: communicationPreferencesStateSchema.optional(),
  demographicsPart1: demographicsPart1StateSchema.optional(),
  demographicsPart2: demographicsPart2StateSchema.optional(),
  termsAndConditions: termsAndConditionSchema.optional(),
  taxFiling2023: taxFilingSchema.optional(),
});

interface ApplyState extends z.infer<typeof applyStateSchema> {
  dateOfBirth?: DateOfBirthState;
  dentalInsurance?: DentalInsuranceState;
  partnerInformation?: PartnerInformationState;
  typeOfApplication?: TypeOfApplicationState;
  dentalBenefits?: DentalBenefitsState;
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
    applicantInformationSchema,
    applyStateSchema,
    loadState,
    saveState,
    start,
    taxFilingSchema,
    termsAndConditionSchema,
    demographicsPart2StateSchema,
    demographicsPart1StateSchema,
  };
}

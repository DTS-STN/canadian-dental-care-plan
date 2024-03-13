import { redirect } from '@remix-run/node';
import { Params } from '@remix-run/react';

import { z } from 'zod';

import { getSessionService } from '~/services/session-service.server';
import { isValidSin } from '~/utils/apply-utils';

/**
 * Schema for validating UUID.
 */
const idSchema = z.string().uuid();

/**
 * Schema for date of birth.
 */
const dobSchema = z.object({
  month: z.coerce.number({ required_error: 'month' }).int().min(0, { message: 'month' }).max(11, { message: 'month' }),
  day: z.coerce.number({ required_error: 'day' }).int().min(1, { message: 'day' }).max(31, { message: 'day' }),
  year: z.coerce.number({ required_error: 'year' }).int().min(1, { message: 'year' }).max(new Date().getFullYear(), { message: 'year' }),
});

/**
 * Schema for terms and conditions
 */
const termsAndConditionSchema = z.object({});

const dentalInsuranceStateSchema = z.object({
  dentalInsurance: z.string({ required_error: 'required' }).trim().min(1),
});

const dentalBenefitsStateSchema = z.object({
  federalBenefit: z.string({ required_error: 'federal-benefit' }).trim().min(1),
  federalSocialProgram: z.string().trim().min(1).optional(),
  provincialTerritorialBenefit: z.string({ required_error: 'provincial-benefit' }).trim().min(1),
  provincialTerritorialSocialProgram: z.string().trim().min(1).optional(),
});

/**
 * Schema applicant information.
 */
const applicantInformationSchema = z.object({
  socialInsuranceNumber: z.string().refine(isValidSin, { message: 'valid-sin' }),
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
 * Schema for application delegate.
 */
const typeOfApplicationSchema = z.object({
  applicationDelegate: z.string(),
});

/**
 * Schema for intake state.
 */
const partnerInformationSchema = z.object({
  socialInsuranceNumber: z.string().refine(isValidSin, { message: 'valid-sin' }),
  lastName: z.string().min(1, { message: 'last-name' }),
  month: z.coerce.number({ required_error: 'month' }).int().min(0, { message: 'month' }).max(11, { message: 'month' }),
  day: z.coerce.number({ required_error: 'day' }).int().min(1, { message: 'day' }).max(31, { message: 'day' }),
  year: z.coerce.number({ required_error: 'year' }).int().min(1, { message: 'year' }).max(new Date().getFullYear(), { message: 'year' }),
  confirm: z.string({ required_error: 'confirm' }),
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
  dob: dobSchema.optional(),
  applicationDelegate: typeOfApplicationSchema.optional(),
  applicantInformation: applicantInformationSchema.optional(),
  personalInformation: personalInformationStateSchema.optional(),
  communicationPreferences: communicationPreferencesStateSchema.optional(),
  demographicsPart1: demographicsPart1StateSchema.optional(),
  demographicsPart2: demographicsPart2StateSchema.optional(),
  partnerInformation: partnerInformationSchema.optional(),
  termsAndConditions: termsAndConditionSchema.optional(),
  taxFiling2023: taxFilingSchema.optional(),
  dentalInsurance: dentalInsuranceStateSchema.optional(),
  dentalBenefit: dentalBenefitsStateSchema.optional(),
});

type ApplyState = z.infer<typeof applyStateSchema>;

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
    throw redirect(fallbackRedirectUrl, 302);
  }

  const sessionService = await getSessionService();
  const session = await sessionService.getSession(request);

  const sessionName = getSessionName(id.data);

  if (!session.has(sessionName)) {
    throw redirect(fallbackRedirectUrl, 302);
  }

  const sessionState = session.get(sessionName);
  const state = applyStateSchema.parse(sessionState);

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
  const newState = applyStateSchema.parse({ ...currentState, ...state });

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
  const initialState = applyStateSchema.parse({});

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
    dobSchema,
    applicantInformationSchema,
    partnerInformationSchema,
    idSchema,
    applyStateSchema,
    loadState,
    dentalInsuranceStateSchema,
    dentalBenefitsStateSchema,
    saveState,
    start,
    taxFilingSchema,
    typeOfApplicationSchema,
    termsAndConditionSchema,
    demographicsPart2StateSchema,
    demographicsPart1StateSchema,
  };
}

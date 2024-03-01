import { redirect } from '@remix-run/node';
import { Params } from '@remix-run/react';

import { z } from 'zod';

import { getSessionService } from '~/services/session-service.server';
import { isValidSin } from '~/utils/intake-utils';

/**
 * Schema for validating UUID.
 */
const idSchema = z.string().uuid();

/**
 * Schema for personal information.
 */
const personalInfoStateSchema = z.object({
  givenName: z.string().min(1),
  age: z.coerce.number().int().min(0),
  surname: z.string().min(1),
});

/**
 * Schema for email address.
 */
const emailStateSchema = z.object({
  emailAddress: z.string().email(),
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
 * Schema partner information.
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
  preferredMethod: z.string().min(1),
  email: z.string().min(1).optional(),
  confirmEmail: z.string().min(1).optional(),
  preferredLanguage: z.string().min(1),
});

/**
 * Schema for intake state.
 */
const intakeStateSchema = z.object({
  personalInfo: personalInfoStateSchema.optional(),
  email: emailStateSchema.optional(),
  applicantInformation: applicantInformationSchema.optional(),
  communicationPreferences: communicationPreferencesStateSchema.optional(),
  partnerInformation: partnerInformationSchema.optional(),
});

type IntakeState = z.infer<typeof intakeStateSchema>;

/**
 * Gets the session name.
 * @param id - The ID.
 * @returns The session name.
 */
function getSessionName(id: string) {
  return `intake-flow-` + idSchema.parse(id);
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
async function loadState({ params, request, fallbackRedirectUrl = '/intake' }: LoadStateArgs) {
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
  const state = intakeStateSchema.parse(sessionState);

  return { id: id.data, state };
}

interface SaveStateArgs {
  params: Params;
  request: Request;
  state: IntakeState;
}

/**
 * Saves state.
 * @param args - The arguments.
 * @returns The Set-Cookie header to be used in the HTTP response.
 */
async function saveState({ params, request, state }: SaveStateArgs) {
  const { id, state: currentState } = await loadState({ params, request });
  const newState = intakeStateSchema.parse({ ...currentState, ...state });

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
 * Starts intake flow.
 * @param args - The arguments.
 * @returns The Set-Cookie header to be used in the HTTP response.
 */
async function start({ id, request }: StartArgs) {
  const parsedId = idSchema.parse(id);
  const initialState = intakeStateSchema.parse({});

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
 * Returns functions related to the intake flow.
 * @returns Functions related to the intake flow.
 */
export function getIntakeFlow() {
  return {
    clearState,
    emailStateSchema,
    applicantInformationSchema,
    partnerInformationSchema,
    idSchema,
    intakeStateSchema,
    loadState,
    personalInfoStateSchema,
    saveState,
    start,
  };
}

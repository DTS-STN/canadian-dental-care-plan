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
 * Schema for social insurance number.
 */
const applicantInformationSchema = z.object({
  socialInsuranceNumber: z.string().refine(isValidSin, { message: 'valid-sin' }),
  lastName: z.string().min(1, { message: 'last-name' }),
  maritalStatus: z.string(),
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
const intakeStateSchema = z.object({
  personalInfo: personalInfoStateSchema.optional(),
  email: emailStateSchema.optional(),
  applicationDelegate: typeOfApplicationSchema.optional(),
  applicantInformation: applicantInformationSchema.optional(),
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
    idSchema,
    intakeStateSchema,
    loadState,
    personalInfoStateSchema,
    saveState,
    start,
    typeOfApplicationSchema,
  };
}

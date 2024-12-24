import { redirectDocument } from '@remix-run/node';
import type { Params } from '@remix-run/react';

import { z } from 'zod';

import { getLogger } from '~/.server/utils/logging.utils';
import type { Session } from '~/.server/web/session';
import { getPathById } from '~/utils/route-utils';

export interface StatusState {
  readonly id: string;
  readonly statusCheckResult: {
    statusId?: string | null;
  };
}

/**
 * Schema for validating UUID.
 */
const idSchema = z.string().uuid();

/**
 * Gets the session name.
 * @param id - The ID.
 * @returns The session name.
 */
function getSessionName(id: string) {
  return `status-flow-${idSchema.parse(id)}`;
}

export function getStatusStateIdFromUrl(url: string | URL) {
  const { searchParams } = new URL(url);
  return searchParams.get('id');
}

interface LoadStateArgs {
  id: string | null;
  params: Params;
  session: Session;
}

/**
 * Loads state.
 * @param args - The arguments.
 * @returns The loaded state.
 */
export function loadStatusState({ id, params, session }: LoadStateArgs) {
  const log = getLogger('status-route-helpers.server/loadStatusState');
  const statusIndexUrl = getPathById('public/status/index', params);

  const parsedId = idSchema.safeParse(id);

  if (!parsedId.success) {
    log.warn('Invalid "id" query string format; redirecting to [%s]; id: [%s], sessionId: [%s]', statusIndexUrl, id, session.id);
    throw redirectDocument(statusIndexUrl);
  }

  const sessionName = getSessionName(parsedId.data);

  if (!session.has(sessionName)) {
    log.warn('Status session state has not been found; redirecting to [%s]; sessionName: [%s], sessionId: [%s]', statusIndexUrl, sessionName, session.id);
    throw redirectDocument(statusIndexUrl);
  }

  const state: StatusState = session.get(sessionName);
  return state;
}

interface SaveStateArgs {
  id: string;
  params: Params;
  session: Session;
  state: Partial<OmitStrict<StatusState, 'id' | 'statusCheckResult'>>;
  remove?: keyof OmitStrict<StatusState, 'id' | 'statusCheckResult'>;
}

/**
 * Saves status state.
 * @param args - The arguments.
 * @returns The new status state.
 */
export function saveStatusState({ id, params, session, state }: SaveStateArgs) {
  const log = getLogger('status-route-helpers.server/saveStatusState');
  const currentState = loadStatusState({ id, params, session });

  const newState = {
    ...currentState,
    ...state,
  } satisfies StatusState;

  const sessionName = getSessionName(currentState.id);
  session.set(sessionName, newState);
  log.info('Status session state saved; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
  return newState;
}

interface ClearStateArgs {
  id: string;
  params: Params;
  session: Session;
}

/**
 * Clears status state.
 * @param args - The arguments.
 */
export function clearStatusState({ id, params, session }: ClearStateArgs) {
  const log = getLogger('status-route-helpers.server/clearStatusState');
  const state = loadStatusState({ id, params, session });
  const sessionName = getSessionName(state.id);
  session.unset(sessionName);
  log.info('Status session state cleared; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
}

interface StartArgs {
  id: string;
  session: Session;
}

/**
 * Starts status state.
 * @param args - The arguments.
 * @returns The initial status state.
 */
export function startStatusState({ id, session }: StartArgs) {
  const log = getLogger('status-route-helpers.server/startStatusState');
  const parsedId = idSchema.parse(id);

  const initialState: StatusState = {
    id: parsedId,
    statusCheckResult: {},
  };

  const sessionName = getSessionName(parsedId);
  session.set(sessionName, initialState);
  log.info('Status session state started; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
  return initialState;
}

interface GetStatusResultUrlArgs {
  id: string;
  params: Params;
}

export function getStatusResultUrl({ id, params }: GetStatusResultUrlArgs) {
  return getPathById('public/status/result', params) + `?id=${id}`;
}

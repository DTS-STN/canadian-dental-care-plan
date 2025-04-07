import { redirectDocument } from 'react-router';

import { z } from 'zod';

import { createLogger } from '~/.server/logging';
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

export type StatusStateParams = {
  lang: string;
};

export function getStatusStateIdFromUrl(url: string | URL) {
  const { searchParams } = new URL(url);
  return searchParams.get('id');
}

interface LoadStateArgs {
  id: string | null;
  params: StatusStateParams;
  session: Session;
}

/**
 * Loads state.
 * @param args - The arguments.
 * @returns The loaded state.
 */
export function loadStatusState({ id, params, session }: LoadStateArgs) {
  const log = createLogger('status-route-helpers.server/loadStatusState');
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
  params: StatusStateParams;
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
  const log = createLogger('status-route-helpers.server/saveStatusState');
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
  params: StatusStateParams;
  session: Session;
}

/**
 * Clears status state.
 * @param args - The arguments.
 */
export function clearStatusState({ id, params, session }: ClearStateArgs) {
  const log = createLogger('status-route-helpers.server/clearStatusState');
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
  const log = createLogger('status-route-helpers.server/startStatusState');
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
  params: StatusStateParams;
}

export function getStatusResultUrl({ id, params }: GetStatusResultUrlArgs) {
  return getPathById('public/status/result', params) + `?id=${id}`;
}

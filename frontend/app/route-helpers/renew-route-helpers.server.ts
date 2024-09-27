import type { Session } from '@remix-run/node';
import { redirectDocument } from '@remix-run/node';
import type { Params } from '@remix-run/react';

import { z } from 'zod';

import { getLocaleFromParams } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { getCdcpWebsiteApplyUrl } from '~/utils/url-utils.server';

export interface RenewState {
  readonly id: string;
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
  return `renew-flow-${idSchema.parse(id)}`;
}

export function getRenewStateIdFromUrl(url: string | URL) {
  const { searchParams } = new URL(url);
  return searchParams.get('id');
}

interface LoadStateArgs {
  params: Params;
  session: Session;
}

/**
 * Loads renew state.
 * @param args - The arguments.
 * @returns The loaded state.
 */
export function loadRenewState({ params, session }: LoadStateArgs) {
  const log = getLogger('renew-route-helpers.server/loadRenewState');
  const locale = getLocaleFromParams(params);
  const cdcpWebsiteApplyUrl = getCdcpWebsiteApplyUrl(locale);

  const parsedId = idSchema.safeParse(params.id);

  if (!parsedId.success) {
    log.warn('Invalid "id" query string format; redirecting to [%s]; id: [%s], sessionId: [%s]', cdcpWebsiteApplyUrl, params.id, session.id);
    throw redirectDocument(cdcpWebsiteApplyUrl);
  }

  const sessionName = getSessionName(parsedId.data);

  if (!session.has(sessionName)) {
    log.warn('Renew session state has not been found; redirecting to [%s]; sessionName: [%s], sessionId: [%s]', cdcpWebsiteApplyUrl, sessionName, session.id);
    throw redirectDocument(cdcpWebsiteApplyUrl);
  }

  const state: RenewState = session.get(sessionName);
  return state;
}

interface SaveStateArgs {
  params: Params;
  session: Session;
  state: Partial<OmitStrict<RenewState, 'id'>>;
  remove?: keyof OmitStrict<RenewState, 'id'>;
}

/**
 * Saves renew state.
 * @param args - The arguments.
 * @returns The new renew state.
 */
export function saveRenewState({ params, session, state }: SaveStateArgs) {
  const log = getLogger('renew-route-helpers.server/saveRenewState');
  const currentState = loadRenewState({ params, session });

  const newState = {
    ...currentState,
    ...state,
  } satisfies RenewState;

  const sessionName = getSessionName(currentState.id);
  session.set(sessionName, newState);
  log.info('Renew session state saved; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
  return newState;
}

interface ClearStateArgs {
  params: Params;
  session: Session;
}

/**
 * Clears renew state.
 * @param args - The arguments.
 */
export function clearRenewState({ params, session }: ClearStateArgs) {
  const log = getLogger('renew-route-helpers.server/clearRenewState');
  const state = loadRenewState({ params, session });
  const sessionName = getSessionName(state.id);
  session.unset(sessionName);
  log.info('Renew session state cleared; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
}

interface StartArgs {
  id: string;
  session: Session;
}

/**
 * Starts Renew state.
 * @param args - The arguments.
 * @returns The initial Renew state.
 */
export function startRenewState({ id, session }: StartArgs) {
  const log = getLogger('renew-route-helpers.server/startRenewState');
  const parsedId = idSchema.parse(id);

  const initialState: RenewState = {
    id: parsedId,
  };

  const sessionName = getSessionName(parsedId);
  session.set(sessionName, initialState);
  log.info('Renew session state started; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
  return initialState;
}

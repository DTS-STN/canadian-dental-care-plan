import type { Session } from '@remix-run/node';
import { redirectDocument } from '@remix-run/node';
import type { Params } from '@remix-run/react';

import { z } from 'zod';

import { getLocaleFromParams } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { getCdcpWebsiteApplyUrl } from '~/utils/url-utils.server';

export interface ProtectedRenewState {
  readonly id: string;
  readonly editMode: boolean;
  readonly taxFiling?: boolean;
  readonly termsAndConditions?: {
    readonly acknowledgeTerms: boolean;
    readonly acknowledgePrivacy: boolean;
    readonly shareData: boolean;
  };
  // TODO Add remaining states
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
  return `protected-renew-flow-${idSchema.parse(id)}`;
}

export function getProtectedRenewStateIdFromUrl(url: string | URL) {
  const { searchParams } = new URL(url);
  return searchParams.get('id');
}

interface LoadStateArgs {
  params: Params;
  session: Session;
}

/**
 * Loads protected renew state.
 * @param args - The arguments.
 * @returns The loaded state.
 */
export function loadProtectedRenewState({ params, session }: LoadStateArgs) {
  const log = getLogger('protected-renew-route-helpers.server/loadProtectedRenewState');
  const locale = getLocaleFromParams(params);
  const cdcpWebsiteApplyUrl = getCdcpWebsiteApplyUrl(locale);

  const parsedId = idSchema.safeParse(params.id);

  if (!parsedId.success) {
    log.warn('Invalid "id" query string format; redirecting to [%s]; id: [%s], sessionId: [%s]', cdcpWebsiteApplyUrl, params.id, session.id);
    throw redirectDocument(cdcpWebsiteApplyUrl);
  }

  const sessionName = getSessionName(parsedId.data);

  if (!session.has(sessionName)) {
    log.warn('Protected renew session state has not been found; redirecting to [%s]; sessionName: [%s], sessionId: [%s]', cdcpWebsiteApplyUrl, sessionName, session.id);
    throw redirectDocument(cdcpWebsiteApplyUrl);
  }

  const state: ProtectedRenewState = session.get(sessionName);
  return state;
}

interface SaveStateArgs {
  params: Params;
  session: Session;
  state: Partial<OmitStrict<ProtectedRenewState, 'id'>>;
  remove?: keyof OmitStrict<ProtectedRenewState, 'id'>;
}

/**
 * Saves protected renew state.
 * @param args - The arguments.
 * @returns The new protected renew state.
 */
export function saveProtectedRenewState({ params, session, state }: SaveStateArgs) {
  const log = getLogger('protected-renew-route-helpers.server/saveProtectedRenewState');
  const currentState = loadProtectedRenewState({ params, session });

  const newState = {
    ...currentState,
    ...state,
  } satisfies ProtectedRenewState;

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
 * Clears protected renew state.
 * @param args - The arguments.
 */
export function clearProtectedRenewState({ params, session }: ClearStateArgs) {
  const log = getLogger('protected-renew-route-helpers.server/clearProtectedRenewState');
  const state = loadProtectedRenewState({ params, session });
  const sessionName = getSessionName(state.id);
  session.unset(sessionName);
  log.info('Renew session state cleared; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
}

interface StartArgs {
  id: string;
  session: Session;
}

/**
 * Starts protected renew state.
 * @param args - The arguments.
 * @returns The initial protected renew state.
 */
export function startProtectedRenewState({ id, session }: StartArgs) {
  const log = getLogger('protected-renew-route-helpers.server/startProtectedRenewState');
  const parsedId = idSchema.parse(id);

  const initialState: ProtectedRenewState = {
    id: parsedId,
    editMode: false,
  };

  const sessionName = getSessionName(parsedId);
  session.set(sessionName, initialState);
  log.info('Protected renew session state started; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
  return initialState;
}

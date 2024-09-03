import type { Session } from '@remix-run/node';
import { redirectDocument } from '@remix-run/node';
import type { Params } from '@remix-run/react';

import { UTCDate } from '@date-fns/utc';
import { differenceInMinutes } from 'date-fns';
import { omit } from 'moderndash';
import { z } from 'zod';

import type { ContextualAlertType } from '~/utils/application-code-utils.server';
import { getLocaleFromParams } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { getCdcpWebsiteStatusUrl } from '~/utils/url-utils.server';

const log = getLogger('status-route-helpers.server');

export interface StatusState {
  readonly lastUpdatedOn: string;
  readonly id: string;
  readonly statusCheckResult?: {
    alertType: ContextualAlertType;
    name?: string;
    id?: string;
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

interface LoadStateArgs {
  params: Params;
  session: Session;
}

/**
 * Loads state.
 * @param args - The arguments.
 * @returns The loaded state.
 */
export function loadStatusState({ params, session }: LoadStateArgs) {
  const locale = getLocaleFromParams(params);
  const cdcpWebsiteStatusUrl = getCdcpWebsiteStatusUrl(locale);

  const parsedId = idSchema.safeParse(params.id);

  if (!parsedId.success) {
    log.warn('Invalid "id" param format; redirecting to [%s]; id: [%s], sessionId: [%s]', cdcpWebsiteStatusUrl, params.id, session.id);
    throw redirectDocument(cdcpWebsiteStatusUrl);
  }

  const sessionName = getSessionName(parsedId.data);

  if (!session.has(sessionName)) {
    log.warn('Status session state has not been found; redirecting to [%s]; sessionName: [%s], sessionId: [%s]', cdcpWebsiteStatusUrl, sessionName, session.id);
    throw redirectDocument(cdcpWebsiteStatusUrl);
  }

  const state: StatusState = session.get(sessionName);

  // Checks if the elapsed time since the last update exceeds 20 minutes,
  // and performs necessary actions if it does.
  const lastUpdatedOn = new UTCDate(state.lastUpdatedOn);
  const now = new UTCDate();

  if (differenceInMinutes(now, lastUpdatedOn) >= 20) {
    session.unset(sessionName);
    log.warn('Status session state has expired; redirecting to [%s]; sessionName: [%s], sessionId: [%s]', cdcpWebsiteStatusUrl, sessionName, session.id);
    throw redirectDocument(cdcpWebsiteStatusUrl);
  }

  return state;
}

interface SaveStateArgs {
  params: Params;
  session: Session;
  state: Partial<OmitStrict<StatusState, 'id' | 'lastUpdatedOn'>>;
  remove?: keyof OmitStrict<StatusState, 'id' | 'lastUpdatedOn'>;
}

/**
 * Saves status state.
 * @param args - The arguments.
 * @returns The new status state.
 */
export function saveStatusState({ params, session, state, remove = undefined }: SaveStateArgs) {
  const currentState = loadStatusState({ params, session });

  let newState = {
    ...currentState,
    ...state,
    lastUpdatedOn: new UTCDate().toISOString(),
  } satisfies StatusState;

  if (remove && remove in newState) {
    newState = omit(newState, [remove]);
  }

  const sessionName = getSessionName(currentState.id);
  session.set(sessionName, newState);
  log.info('Status session state saved; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
  return newState;
}

interface ClearStateArgs {
  params: Params;
  session: Session;
}

/**
 * Clears status state.
 * @param args - The arguments.
 */
export function clearStatusState({ params, session }: ClearStateArgs) {
  const { id } = loadStatusState({ params, session });

  const sessionName = getSessionName(id);
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
  const parsedId = idSchema.parse(id);

  const initialState: StatusState = {
    id: parsedId,
    lastUpdatedOn: new UTCDate().toISOString(),
  };

  const sessionName = getSessionName(parsedId);
  session.set(sessionName, initialState);
  log.info('Status session state started; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
  return initialState;
}

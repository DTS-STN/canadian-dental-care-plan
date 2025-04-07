import { redirectDocument } from 'react-router';

import { UTCDate } from '@date-fns/utc';
import { differenceInMinutes } from 'date-fns';
import { omit } from 'moderndash';
import type { ReadonlyDeep } from 'type-fest';
import { z } from 'zod';

import { getLocaleFromParams } from '~/.server/utils/locale.utils';
import { getLogger } from '~/.server/utils/logging.utils';
import { getCdcpWebsiteApplyUrl } from '~/.server/utils/url.utils';
import type { Session } from '~/.server/web/session';

export type ProtectedApplyState = ReadonlyDeep<{
  id: string;
  editMode: boolean;
  lastUpdatedOn: string;
  applicationYear: {
    intakeYearId: string;
    taxYear: string;
    coverageStartDate: string;
  };
  children: object;
  typeOfApplication?: 'adult' | 'adult-child' | 'child' | 'delegate';
}>;

export type ProtectedApplicationYearState = NonNullable<ProtectedApplyState['applicationYear']>;

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
  return `protected-apply-flow-${idSchema.parse(id)}`;
}

export type ProtectedApplyStateParams = {
  id: string;
  lang: string;
};

interface StartArgs {
  applicationYear: ProtectedApplicationYearState;
  id: string;
  session: Session;
}

interface LoadStateArgs {
  params: ProtectedApplyStateParams;
  session: Session;
}

/**
 * Loads state.
 * @param args - The arguments.
 * @returns The loaded state.
 */
export function loadProtectedApplyState({ params, session }: LoadStateArgs) {
  const log = getLogger('apply-route-helpers.server/loadProtectedApplyState');
  const locale = getLocaleFromParams(params);
  const cdcpWebsiteApplyUrl = getCdcpWebsiteApplyUrl(locale);

  const parsedId = idSchema.safeParse(params.id);

  if (!parsedId.success) {
    log.warn('Invalid "id" param format; redirecting to [%s]; id: [%s], sessionId: [%s]', cdcpWebsiteApplyUrl, params.id, session.id);
    throw redirectDocument(cdcpWebsiteApplyUrl);
  }

  const sessionName = getSessionName(parsedId.data);

  if (!session.has(sessionName)) {
    log.warn('Apply session state has not been found; redirecting to [%s]; sessionName: [%s], sessionId: [%s]', cdcpWebsiteApplyUrl, sessionName, session.id);
    throw redirectDocument(cdcpWebsiteApplyUrl);
  }

  const state: ProtectedApplyState = session.get(sessionName);

  // Checks if the elapsed time since the last update exceeds 20 minutes,
  // and performs necessary actions if it does.
  const lastUpdatedOn = new UTCDate(state.lastUpdatedOn);
  const now = new UTCDate();

  if (differenceInMinutes(now, lastUpdatedOn) >= 20) {
    session.unset(sessionName);
    log.warn('Protected apply session state has expired; redirecting to [%s]; sessionName: [%s], sessionId: [%s]', cdcpWebsiteApplyUrl, sessionName, session.id);
    throw redirectDocument(cdcpWebsiteApplyUrl);
  }

  return state;
}

/**
 * Starts protected apply state.
 * @param args - The arguments.
 * @returns The initial protected apply state.
 */
export function startProtectedApplyState({ applicationYear, id, session }: StartArgs) {
  const log = getLogger('protected-apply-route-helpers.server/startProtectedApplyState');
  const parsedId = idSchema.parse(id);
  const sessionName = getSessionName(parsedId);

  const initialState: ProtectedApplyState = {
    id: parsedId,
    editMode: false,
    applicationYear,
    lastUpdatedOn: new UTCDate().toISOString(),
    children: [],
  };

  session.set(sessionName, initialState);
  log.info('Protected apply session state started; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
  return initialState;
}

interface SaveStateArgs {
  params: ProtectedApplyStateParams;
  session: Session;
  state: Partial<OmitStrict<ProtectedApplyState, 'id' | 'lastUpdatedOn' | 'applicationYear'>>;
  remove?: keyof OmitStrict<ProtectedApplyState, 'children' | 'editMode' | 'id' | 'lastUpdatedOn' | 'applicationYear'>;
}

/**
 * Saves protected apply state.
 * @param args - The arguments.
 * @returns The new protected apply state.
 */
export function saveProtectedApplyState({ params, session, state, remove = undefined }: SaveStateArgs) {
  const log = getLogger('protected-apply-route-helpers.server/saveProtectedApplyState');
  const currentState = loadProtectedApplyState({ params, session });

  let newState = {
    ...currentState,
    ...state,
    lastUpdatedOn: new UTCDate().toISOString(),
  } satisfies ProtectedApplyState;

  if (remove && remove in newState) {
    newState = omit(newState, [remove]);
  }

  const sessionName = getSessionName(currentState.id);
  session.set(sessionName, newState);
  log.info('Protected apply session state saved; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
  return newState;
}

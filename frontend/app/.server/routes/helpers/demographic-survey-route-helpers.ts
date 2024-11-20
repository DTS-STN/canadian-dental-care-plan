import type { Session } from '@remix-run/node';
import { redirect, redirectDocument } from '@remix-run/node';
import type { Params } from '@remix-run/react';

import { randomUUID } from 'crypto';
import { z } from 'zod';

import type { RenewState } from './renew-route-helpers';
import { getChildrenState } from './renew-route-helpers';
import { getLocaleFromParams } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { getPathById } from '~/utils/route-utils';
import { getCdcpWebsiteApplyUrl } from '~/utils/url-utils.server';

export interface DemographicSurveyState {
  readonly id: string;
  readonly memberInformation: {
    readonly id: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly isSurveyCompleted: boolean;
    readonly questions?: {
      readonly indigenousStatus?: string;
      readonly firstNations?: string[];
      readonly disabilityStatus?: string;
      readonly ethnicGroups?: string[];
      readonly anotherEthnicGroup?: string;
      readonly locationBornStatus?: string;
      readonly genderStatus?: string;
    };
  }[];
}

export type MemberInformationState = NonNullable<DemographicSurveyState['memberInformation']>;

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
  return `demographic-survey-${idSchema.parse(id)}`;
}

export function getDemographicSurveyIdFromUrl(url: string | URL) {
  const { searchParams } = new URL(url);
  return searchParams.get('id');
}

interface LoadStateArgs {
  params: Params;
  session: Session;
}

/**
 * Loads demographic survey state.
 * @param args - The arguments.
 * @returns The loaded state.
 */
export function loadDemographicSurveyState({ params, session }: LoadStateArgs) {
  const log = getLogger('demographic-survey-route-helpers.server/loadDemographicSurveyState');
  const locale = getLocaleFromParams(params);
  const cdcpWebsiteApplyUrl = getCdcpWebsiteApplyUrl(locale);

  const parsedId = idSchema.safeParse(params.id);

  if (!parsedId.success) {
    log.warn('Invalid "id" query string format; redirecting to [%s]; id: [%s], sessionId: [%s]', cdcpWebsiteApplyUrl, params.id, session.id);
    throw redirectDocument(cdcpWebsiteApplyUrl);
  }

  const sessionName = getSessionName(parsedId.data);

  if (!session.has(sessionName)) {
    log.warn('Demographic survey session state has not been found; redirecting to [%s]; sessionName: [%s], sessionId: [%s]', cdcpWebsiteApplyUrl, sessionName, session.id);
    throw redirectDocument(cdcpWebsiteApplyUrl);
  }

  const state: DemographicSurveyState = session.get(sessionName);
  return state;
}

interface LoadDemographicSurveySingleMemberStateArgs {
  params: Params;
  session: Session;
}

/**
 * Loads single member state from renew adult member state.
 * @param args - The arguments.
 * @returns The loaded member state.
 */
export function loadDemographicSurveySingleMemberState({ params, session }: LoadDemographicSurveySingleMemberStateArgs) {
  const log = getLogger('demographic-survey-route-helpers.server/loadDemographicSurveySingleMemberState');
  const demographicSurveyState = loadDemographicSurveyState({ params, session });

  const parsedMemberId = z.string().uuid().safeParse(params.memberId);

  if (!parsedMemberId.success) {
    log.warn('Invalid "memberId" param format; memberId: [%s]', params.memberId);
    throw redirect(getPathById('public/demographic-survey/$id/summary', params));
  }

  const memberId = parsedMemberId.data;
  const memberIndex = demographicSurveyState.memberInformation.findIndex(({ id }) => id === memberId);

  if (memberIndex === -1) {
    log.warn('Demographic survey single member has not been found; memberId: [%s]', memberId);
    throw redirect(getPathById('public/demographic-survey/$id/summary', params));
  }

  const memberState = demographicSurveyState.memberInformation[memberIndex];

  return memberState;
}

interface SaveStateArgs {
  params: Params;
  session: Session;
  state: Partial<OmitStrict<DemographicSurveyState, 'id'>>;
  remove?: keyof OmitStrict<DemographicSurveyState, 'id'>;
}

/**
 * Saves DemographicSurvey state.
 * @param args - The arguments.
 * @returns The new DemographicSurvey state.
 */
export function saveDemographicSurveyState({ params, session, state }: SaveStateArgs) {
  const log = getLogger('demographic-survey-route-helpers.server/saveDemographicSurveyState');
  const currentState = loadDemographicSurveyState({ params, session });

  const newState = {
    ...currentState,
    ...state,
  } satisfies DemographicSurveyState;

  const sessionName = getSessionName(currentState.id);
  session.set(sessionName, newState);
  log.info('Demographic survey session state saved; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
  return newState;
}

interface ClearStateArgs {
  params: Params;
  session: Session;
}

/**
 * Clears DemographicSurvey state.
 * @param args - The arguments.
 */
export function clearDemographicSurveyState({ params, session }: ClearStateArgs) {
  const log = getLogger('demographic-survey-route-helpers.server/clearDemographicSurveyState');
  const state = loadDemographicSurveyState({ params, session });
  const sessionName = getSessionName(state.id);
  session.unset(sessionName);
  log.info('Demographic survey session state cleared; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
}

interface StartArgs {
  id: string;
  session: Session;
  memberInformation: MemberInformationState;
}

/**
 * Starts DemographicSurvey state.
 * @param args - The arguments.
 * @returns The initial DemographicSurvey state.
 */
export function startDemographicSurveyState({ id, session, memberInformation }: StartArgs) {
  const log = getLogger('demographic-survey-route-helpers.server/startDemographicSurveyState');
  const parsedId = idSchema.parse(id);

  const initialState: DemographicSurveyState = {
    id: parsedId,
    memberInformation,
  };

  const sessionName = getSessionName(parsedId);
  session.set(sessionName, initialState);
  log.info('Demographic survey session state started; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
  return initialState;
}

export function getMemberInformationFromRenewState(state: RenewState) {
  function composeMemberInformation(firstName: string, lastName: string) {
    return {
      id: randomUUID().toString(),
      firstName,
      lastName,
      isSurveyCompleted: false,
    };
  }

  const memberInformation = [
    composeMemberInformation(state.applicantInformation?.firstName ?? '', state.applicantInformation?.lastName ?? ''),
    ...getChildrenState(state).map((child) => composeMemberInformation(child.information?.firstName ?? '', child.information?.lastName ?? '')),
  ];

  return memberInformation;
}

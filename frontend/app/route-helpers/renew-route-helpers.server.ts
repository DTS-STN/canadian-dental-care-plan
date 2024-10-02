import type { Session } from '@remix-run/node';
import { redirectDocument } from '@remix-run/node';
import type { Params } from '@remix-run/react';

import { z } from 'zod';

import { getLocaleFromParams } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { getCdcpWebsiteApplyUrl } from '~/utils/url-utils.server';

export interface RenewState {
  readonly id: string;
  readonly editMode: boolean;
  readonly applicantInformation?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    clientNumber: string;
  };
  readonly maritalStatus?: {
    firstName: string;
    lastName: string;
    maritalStatus: string;
    socialInsuranceNumber: string;
  };
  readonly contactInformation?: {
    copyMailingAddress: boolean;
    homeAddress?: string;
    homeApartment?: string;
    homeCity?: string;
    homeCountry?: string;
    homePostalCode?: string;
    homeProvince?: string;
    mailingAddress: string;
    mailingApartment?: string;
    mailingCity: string;
    mailingCountry: string;
    mailingPostalCode?: string;
    mailingProvince?: string;
    phoneNumber?: string;
    phoneNumberAlt?: string;
    email?: string;
  };
  readonly communicationPreferences?: {
    email?: string;
    preferredLanguage: string;
    preferredMethod: string;
  };
  readonly dentalBenefits?: {
    hasFederalBenefits: boolean;
    federalSocialProgram?: string;
    hasProvincialTerritorialBenefits: boolean;
    provincialTerritorialSocialProgram?: string;
    province?: string;
  };
  readonly dentalInsurance?: boolean;
  readonly partnerInformation?: {
    confirm: boolean;
    dateOfBirth: string;
    firstName: string;
    lastName: string;
    socialInsuranceNumber: string;
  };
  readonly submissionInfo?: {
    /**
     * The confirmation code associated with the application submission.
     */
    confirmationCode: string;

    /**
     * The UTC date and time when the application was submitted.
     * Format: ISO 8601 string (e.g., "YYYY-MM-DDTHH:mm:ss.sssZ")
     */
    submittedOn: string;
  };
  readonly typeOfRenewal?: 'adult-child' | 'child' | 'delegate';
}

export type ApplicantInformationState = NonNullable<RenewState['applicantInformation']>;
export type MaritalStatusState = NonNullable<RenewState['maritalStatus']>;
export type TypeOfApplicationState = NonNullable<RenewState['typeOfRenewal']>;
export type CommunicationPreferencesState = NonNullable<RenewState['communicationPreferences']>;
export type DentalFederalBenefitsState = Pick<NonNullable<RenewState['dentalBenefits']>, 'federalSocialProgram' | 'hasFederalBenefits'>;
export type DentalInsuranceState = NonNullable<RenewState['dentalInsurance']>;
export type DentalProvincialTerritorialBenefitsState = Pick<NonNullable<RenewState['dentalBenefits']>, 'hasProvincialTerritorialBenefits' | 'province' | 'provincialTerritorialSocialProgram'>;
export type PartnerInformationState = NonNullable<RenewState['partnerInformation']>;
export type ContactInformationState = NonNullable<RenewState['contactInformation']>;
export type SubmissionInfoState = NonNullable<RenewState['submissionInfo']>;

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
    editMode: false,
  };

  const sessionName = getSessionName(parsedId);
  session.set(sessionName, initialState);
  log.info('Renew session state started; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
  return initialState;
}

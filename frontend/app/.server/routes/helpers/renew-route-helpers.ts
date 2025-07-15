import { redirectDocument } from 'react-router';

import { UTCDate } from '@date-fns/utc';
import { differenceInMinutes } from 'date-fns';
import { z } from 'zod';

import type { ClientApplicationDto } from '~/.server/domain/dtos';
import { createLogger } from '~/.server/logging';
import { getLocaleFromParams } from '~/.server/utils/locale.utils';
import { getCdcpWebsiteRenewUrl } from '~/.server/utils/url.utils';
import type { Session } from '~/.server/web/session';

export type RenewStateSessionKey = `renew-flow-${string}`;

export interface RenewState {
  readonly id: string;
  readonly editMode: boolean;
  readonly lastUpdatedOn: string;
  readonly applicationYear: {
    renewalYearId: string;
    taxYear: string;
    coverageEndDate: string;
  };
  readonly applicantInformation?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    clientNumber: string;
  };
  readonly clientApplication?: ClientApplicationDto;
  readonly children: {
    readonly id: string;
    readonly dentalBenefits?: {
      hasFederalBenefits: boolean;
      federalSocialProgram?: string;
      hasProvincialTerritorialBenefits: boolean;
      provincialTerritorialSocialProgram?: string;
      province?: string;
    };
    readonly hasFederalProvincialTerritorialBenefitsChanged?: boolean;
    readonly dentalInsurance?: boolean;
    readonly information?: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      isParent: boolean;
      clientNumber?: string;
    };
    readonly demographicSurvey?: {
      readonly indigenousStatus?: string;
      readonly firstNations?: string;
      readonly disabilityStatus?: string;
      readonly ethnicGroups?: string[];
      readonly anotherEthnicGroup?: string;
      readonly locationBornStatus?: string;
      readonly genderStatus?: string;
    };
  }[];
  readonly partnerInformation?: {
    confirm: boolean;
    yearOfBirth: string;
    socialInsuranceNumber: string;
  };
  readonly hasMaritalStatusChanged?: boolean;
  readonly maritalStatus?: string;
  readonly contactInformation?: {
    isNewOrUpdatedPhoneNumber?: boolean;
    phoneNumber?: string;
    phoneNumberAlt?: string;
  };
  readonly communicationPreferences?: {
    readonly preferredMethod: string;
    readonly preferredNotificationMethod: string;
  };
  readonly editModeCommunicationPreferences?: {
    preferredMethod: string;
    preferredNotificationMethod: string;
  };
  readonly editModeEmail?: string;
  readonly email?: string;
  readonly verifyEmail?: {
    verificationCode: string;
    verificationAttempts: number;
  };
  readonly emailVerified?: boolean;
  readonly hasAddressChanged?: boolean;
  readonly isHomeAddressSameAsMailingAddress?: boolean;
  readonly previousAddressState?: {
    hasAddressChanged?: boolean;
    isHomeAddressSameAsMailingAddress?: boolean;
  };
  readonly mailingAddress?: {
    address: string;
    city: string;
    country: string;
    postalCode?: string;
    province?: string;
  };
  readonly homeAddress?: {
    address: string;
    city: string;
    country: string;
    postalCode?: string;
    province?: string;
  };
  readonly dentalInsurance?: boolean;
  readonly hasFederalProvincialTerritorialBenefitsChanged?: boolean;
  readonly dentalBenefits?: {
    hasFederalBenefits: boolean;
    federalSocialProgram?: string;
    hasProvincialTerritorialBenefits: boolean;
    provincialTerritorialSocialProgram?: string;
    province?: string;
  };
  readonly typeOfRenewal?: 'adult' | 'adult-child' | 'child' | 'delegate';
  readonly submissionInfo?: {
    /**
     * The UTC date and time when the application was submitted.
     * Format: ISO 8601 string (e.g., "YYYY-MM-DDTHH:mm:ss.sssZ")
     */
    submittedOn: string;
  };
  readonly taxFiling?: boolean;
  readonly demographicSurvey?: {
    readonly indigenousStatus?: string;
    readonly firstNations?: string;
    readonly disabilityStatus?: string;
    readonly ethnicGroups?: string[];
    readonly anotherEthnicGroup?: string;
    readonly locationBornStatus?: string;
    readonly genderStatus?: string;
  };
}

export type ApplicationYearState = RenewState['applicationYear'];
export type ChildState = RenewState['children'][number];
export type ApplicantInformationState = NonNullable<RenewState['applicantInformation']>;
export type TypeOfRenewalState = NonNullable<RenewState['typeOfRenewal']>;
export type PartnerInformationState = NonNullable<RenewState['partnerInformation']>;
export type MailingAddressState = NonNullable<RenewState['mailingAddress']>;
export type HomeAddressState = NonNullable<RenewState['homeAddress']>;
export type DentalFederalBenefitsState = Pick<NonNullable<RenewState['dentalBenefits']>, 'federalSocialProgram' | 'hasFederalBenefits'>;
export type DentalProvincialTerritorialBenefitsState = Pick<NonNullable<RenewState['dentalBenefits']>, 'hasProvincialTerritorialBenefits' | 'province' | 'provincialTerritorialSocialProgram'>;
export type ContactInformationState = NonNullable<RenewState['contactInformation']>;
export type DemographicSurveyState = NonNullable<RenewState['demographicSurvey']>;
export type CommunicationPreferencesState = NonNullable<RenewState['communicationPreferences']>;

/**
 * Schema for validating UUID.
 */
const idSchema = z.uuid();

/**
 * Gets the renew flow session key.
 * @param id - The renew flow ID.
 * @returns The renew flow session key.
 */
function getSessionName(id: string): RenewStateSessionKey {
  return `renew-flow-${idSchema.parse(id)}`;
}

export type RenewStateParams = {
  id: string;
  lang: string;
};

interface LoadStateArgs {
  params: RenewStateParams;
  session: Session;
}

/**
 * Loads renew state.
 * @param args - The arguments.
 * @returns The loaded state.
 */
export function loadRenewState({ params, session }: LoadStateArgs) {
  const log = createLogger('renew-route-helpers.server/loadRenewState');
  const locale = getLocaleFromParams(params);
  const cdcpWebsiteRenewUrl = getCdcpWebsiteRenewUrl(locale);

  const parsedId = idSchema.safeParse(params.id);

  if (!parsedId.success) {
    log.warn('Invalid "id" query string format; redirecting to [%s]; id: [%s], sessionId: [%s]', cdcpWebsiteRenewUrl, params.id, session.id);
    throw redirectDocument(cdcpWebsiteRenewUrl);
  }

  const sessionKey = getSessionName(parsedId.data);

  if (!session.has(sessionKey)) {
    log.warn('Renew session state has not been found; redirecting to [%s]; sessionKey: [%s], sessionId: [%s]', cdcpWebsiteRenewUrl, sessionKey, session.id);
    throw redirectDocument(cdcpWebsiteRenewUrl);
  }

  const state: RenewState = session.get(sessionKey);

  // Checks if the elapsed time since the last update exceeds 20 minutes,
  // and performs necessary actions if it does.
  const lastUpdatedOn = new UTCDate(state.lastUpdatedOn);
  const now = new UTCDate();

  if (differenceInMinutes(now, lastUpdatedOn) >= 20) {
    session.unset(sessionKey);
    log.warn('Renew session state has expired; redirecting to [%s]; sessionKey: [%s], sessionId: [%s]', cdcpWebsiteRenewUrl, sessionKey, session.id);
    throw redirectDocument(cdcpWebsiteRenewUrl);
  }

  return state;
}

interface SaveStateArgs {
  params: RenewStateParams;
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
  const log = createLogger('renew-route-helpers.server/saveRenewState');
  const currentState = loadRenewState({ params, session });

  const newState = {
    ...currentState,
    ...state,
    lastUpdatedOn: new UTCDate().toISOString(),
  } satisfies RenewState;

  const sessionKey = getSessionName(currentState.id);
  session.set(sessionKey, newState);
  log.info('Renew session state saved; sessionKey: [%s], sessionId: [%s]', sessionKey, session.id);
  return newState;
}

interface ClearStateArgs {
  params: RenewStateParams;
  session: Session;
}

/**
 * Clears renew state.
 * @param args - The arguments.
 */
export function clearRenewState({ params, session }: ClearStateArgs) {
  const log = createLogger('renew-route-helpers.server/clearRenewState');
  const state = loadRenewState({ params, session });
  const sessionKey = getSessionName(state.id);
  session.unset(sessionKey);
  log.info('Renew session state cleared; sessionKey: [%s], sessionId: [%s]', sessionKey, session.id);
}

interface StartArgs {
  applicationYear: ApplicationYearState;
  id: string;
  session: Session;
}

/**
 * Starts Renew state.
 * @param args - The arguments.
 * @returns The initial Renew state.
 */
export function startRenewState({ applicationYear, id, session }: StartArgs) {
  const log = createLogger('renew-route-helpers.server/startRenewState');
  const parsedId = idSchema.parse(id);

  const initialState: RenewState = {
    id: parsedId,
    editMode: false,
    lastUpdatedOn: new UTCDate().toISOString(),
    applicationYear,
    children: [],
  };

  const sessionKey = getSessionName(parsedId);
  session.set(sessionKey, initialState);
  log.info('Renew session state started; sessionKey: [%s], sessionId: [%s]', sessionKey, session.id);
  return initialState;
}

export function renewStateHasPartner(maritalStatus: string) {
  return ['married', 'commonlaw'].includes(maritalStatus);
}

export function isNewChildState(child: ChildState) {
  return child.dentalInsurance === undefined || child.information === undefined || child.hasFederalProvincialTerritorialBenefitsChanged === undefined;
}

export function getChildrenState<TState extends Pick<RenewState, 'children'>>(state: TState, includesNewChildState: boolean = false) {
  // prettier-ignore
  return includesNewChildState
    ? state.children
    : state.children.filter((child) => isNewChildState(child) === false);
}

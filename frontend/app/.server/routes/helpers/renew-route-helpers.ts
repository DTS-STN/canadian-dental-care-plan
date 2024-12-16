import type { Session } from '@remix-run/node';
import { redirectDocument } from '@remix-run/node';
import type { Params } from '@remix-run/react';

import { merge } from 'moderndash';
import { z } from 'zod';

import type { ClientApplicationDto } from '~/.server/domain/dtos';
import { getEnv } from '~/.server/utils/env.utils';
import { getLocaleFromParams } from '~/.server/utils/locale.utils';
import { getLogger } from '~/.server/utils/logging.utils';
import { getCdcpWebsiteApplyUrl } from '~/.server/utils/url.utils';

export interface RenewState {
  readonly id: string;
  readonly editMode: boolean;
  readonly applicationYear: {
    id: string;
    taxYear: string;
    coverageStartDate: string;
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
    isNewOrUpdatedEmail?: boolean;
    phoneNumber?: string;
    phoneNumberAlt?: string;
    email?: string;
    shouldReceiveEmailCommunication?: boolean;
  };
  readonly hasAddressChanged?: boolean;
  readonly isHomeAddressSameAsMailingAddress?: boolean;
  readonly addressInformation?: {
    copyMailingAddress?: boolean;
    homeAddress?: string;
    homeApartment?: string;
    homeCity?: string;
    homeCountry?: string;
    homePostalCode?: string;
    homeProvince?: string;
    mailingAddress?: string;
    mailingApartment?: string;
    mailingCity?: string;
    mailingCountry?: string;
    mailingPostalCode?: string;
    mailingProvince?: string;
  };
  readonly mailingAddress?: {
    address: string;
    apartment?: string;
    city: string;
    country: string;
    postalCode?: string;
    province?: string;
  };
  readonly homeAddress?: {
    address: string;
    apartment?: string;
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
  readonly typeOfRenewal?: 'adult-child' | 'child' | 'delegate';
  readonly submissionInfo?: {
    /**
     * The UTC date and time when the application was submitted.
     * Format: ISO 8601 string (e.g., "YYYY-MM-DDTHH:mm:ss.sssZ")
     */
    submittedOn: string;
  };
  readonly taxFiling?: boolean;
  readonly termsAndConditions?: {
    acknowledgeTerms: boolean;
    acknowledgePrivacy: boolean;
    shareData: boolean;
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
  // TODO Add remaining states
}

export type ApplicationYearState = RenewState['applicationYear'];
export type ChildState = RenewState['children'][number];
export type ApplicantInformationState = NonNullable<RenewState['applicantInformation']>;
export type TypeOfRenewalState = NonNullable<RenewState['typeOfRenewal']>;
export type PartnerInformationState = NonNullable<RenewState['partnerInformation']>;
export type AddressInformationState = NonNullable<RenewState['addressInformation']>;
export type MailingAddressState = NonNullable<RenewState['mailingAddress']>;
export type HomeAddressState = NonNullable<RenewState['homeAddress']>;
export type DentalFederalBenefitsState = Pick<NonNullable<RenewState['dentalBenefits']>, 'federalSocialProgram' | 'hasFederalBenefits'>;
export type DentalProvincialTerritorialBenefitsState = Pick<NonNullable<RenewState['dentalBenefits']>, 'hasProvincialTerritorialBenefits' | 'province' | 'provincialTerritorialSocialProgram'>;
export type ContactInformationState = NonNullable<RenewState['contactInformation']>;
export type DemographicSurveyState = NonNullable<RenewState['demographicSurvey']>;

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

  // https://moderndash.io/docs/merge
  // Merges two objects without overwriting any unmentioned properties
  const newState = merge({}, currentState, state) satisfies RenewState;

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
  const log = getLogger('renew-route-helpers.server/startRenewState');
  const parsedId = idSchema.parse(id);

  const initialState: RenewState = {
    id: parsedId,
    editMode: false,
    applicationYear,
    children: [],
  };

  const sessionName = getSessionName(parsedId);
  session.set(sessionName, initialState);
  log.info('Renew session state started; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
  return initialState;
}

export function renewStateHasPartner(maritalStatus: string) {
  const { MARITAL_STATUS_CODE_MARRIED, MARITAL_STATUS_CODE_COMMONLAW } = getEnv();
  return [MARITAL_STATUS_CODE_MARRIED, MARITAL_STATUS_CODE_COMMONLAW].includes(Number(maritalStatus));
}

export function isNewChildState(child: ChildState) {
  return child.dentalInsurance === undefined || child.information === undefined;
}

export function getChildrenState<TState extends Pick<RenewState, 'children'>>(state: TState, includesNewChildState: boolean = false) {
  // prettier-ignore
  return includesNewChildState
    ? state.children
    : state.children.filter((child) => isNewChildState(child) === false);
}

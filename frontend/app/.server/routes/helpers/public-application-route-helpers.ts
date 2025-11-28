import { redirectDocument } from 'react-router';

import { UTCDate } from '@date-fns/utc';
import { differenceInMinutes } from 'date-fns';
import { omit } from 'moderndash';
import { nanoid } from 'nanoid';
import type { ReadonlyDeep } from 'type-fest';
import { z } from 'zod';

import { createLogger } from '~/.server/logging';
import { getEnv } from '~/.server/utils/env.utils';
import { getLocaleFromParams } from '~/.server/utils/locale.utils';
import { getCdcpWebsiteApplyUrl } from '~/.server/utils/url.utils';
import type { Session } from '~/.server/web/session';
import { getAgeFromDateString } from '~/utils/date-utils';

export type PublicApplicationStateSessionKey = `public-application-flow-${string}`;

export type PublicApplicationState = ReadonlyDeep<{
  id: string;
  editMode: boolean;
  lastUpdatedOn: string;
  editModeApplicantInformation?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    socialInsuranceNumber: string;
  };
  editModeLivingIndependently?: boolean;
  applicantInformation?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    socialInsuranceNumber: string;
  };
  applicationYear: {
    applicationYearId: string;
    taxYear: string;
    dependentEligibilityEndDate: string;
  };
  children: {
    id: string;
    hasFederalProvincialTerritorialBenefits?: boolean;
    dentalBenefits?: {
      hasFederalBenefits: boolean;
      federalSocialProgram?: string;
      hasProvincialTerritorialBenefits: boolean;
      provincialTerritorialSocialProgram?: string;
      province?: string;
    };
    dentalInsurance?: boolean;
    information?: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      isParent: boolean;
      hasSocialInsuranceNumber: boolean;
      socialInsuranceNumber?: string;
    };
  }[];
  communicationPreferences?: {
    preferredLanguage: string;
    preferredMethod: string;
    preferredNotificationMethod: string;
  };
  editModeCommunicationPreferences?: {
    preferredLanguage: string;
    preferredMethod: string;
    preferredNotificationMethod: string;
  };
  editModeEmail?: string;
  email?: string;
  verifyEmail?: {
    verificationCode: string;
    verificationAttempts: number;
  };
  emailVerified?: boolean;
  hasFederalProvincialTerritorialBenefits?: boolean;
  maritalStatus?: string;
  dentalBenefits?: {
    hasFederalBenefits: boolean;
    federalSocialProgram?: string;
    hasProvincialTerritorialBenefits: boolean;
    provincialTerritorialSocialProgram?: string;
    province?: string;
  };
  dentalInsurance?: boolean;
  livingIndependently?: boolean;
  partnerInformation?: {
    confirm: boolean;
    yearOfBirth: string;
    socialInsuranceNumber: string;
  };
  isHomeAddressSameAsMailingAddress?: boolean;
  mailingAddress?: {
    address: string;
    city: string;
    country: string;
    postalCode?: string;
    province?: string;
  };
  homeAddress?: {
    address: string;
    city: string;
    country: string;
    postalCode?: string;
    province?: string;
  };
  contactInformation?: {
    phoneNumber?: string;
    phoneNumberAlt?: string;
  };
  newOrExistingMember?: {
    isNewOrExistingMember: boolean;
    clientNumber?: string;
  };
  submissionInfo?: {
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
  hasFiledTaxes?: boolean;
  termsAndConditions?: {
    acknowledgeTerms: boolean;
    acknowledgePrivacy: boolean;
    shareData: boolean;
  };
  typeOfApplication?: 'new' | 'renew';
  typeOfApplicationFlow?: 'adult' | 'children' | 'family';
}>;

export type ApplicantInformationState = NonNullable<PublicApplicationState['applicantInformation']>;
export type ApplicationYearState = PublicApplicationState['applicationYear'];
export type ChildrenState = PublicApplicationState['children'];
export type ChildState = ChildrenState[number];
export type ChildDentalBenefitsState = NonNullable<ChildState['dentalBenefits']>;
export type ChildDentalInsuranceState = NonNullable<ChildState['dentalInsurance']>;
export type ChildInformationState = NonNullable<ChildState['information']>;
export type ChildSinState = Pick<NonNullable<ChildState['information']>, 'hasSocialInsuranceNumber' | 'socialInsuranceNumber'>;
export type CommunicationPreferencesState = NonNullable<PublicApplicationState['communicationPreferences']>;
export type ContactInformationState = NonNullable<PublicApplicationState['contactInformation']>;
export type DentalFederalBenefitsState = Pick<NonNullable<PublicApplicationState['dentalBenefits']>, 'federalSocialProgram' | 'hasFederalBenefits'>;
export type DentalInsuranceState = NonNullable<PublicApplicationState['dentalInsurance']>;
export type DentalProvincialTerritorialBenefitsState = Pick<NonNullable<PublicApplicationState['dentalBenefits']>, 'hasProvincialTerritorialBenefits' | 'province' | 'provincialTerritorialSocialProgram'>;
export type HomeAddressState = NonNullable<PublicApplicationState['homeAddress']>;
export type MailingAddressState = NonNullable<PublicApplicationState['mailingAddress']>;
export type NewOrExistingMemberState = NonNullable<PublicApplicationState['newOrExistingMember']>;
export type PartnerInformationState = NonNullable<PublicApplicationState['partnerInformation']>;
export type SubmissionInfoState = NonNullable<PublicApplicationState['submissionInfo']>;
export type TermsAndConditionsState = NonNullable<PublicApplicationState['termsAndConditions']>;
export type TypeOfApplicationState = NonNullable<PublicApplicationState['typeOfApplication']>;

/**
 * Schema for validating Nano ID.
 */
const idSchema = z.nanoid();

/**
 * Gets the public application flow session key.
 * @param id - The public application flow ID.
 * @returns The public application flow session key.
 */
function getSessionKey(id: string): PublicApplicationStateSessionKey {
  return `public-application-flow-${idSchema.parse(id)}`;
}

export type ApplicationStateParams = {
  id: string;
  lang: string;
};

interface LoadStateArgs {
  params: ApplicationStateParams;
  session: Session;
}

/**
 * Gets public application state.
 * @param args - The arguments.
 * @returns The public applicqation state.
 */
export function getPublicApplicationState({ params, session }: LoadStateArgs): PublicApplicationState {
  const log = createLogger('application-route-helpers.server/loadApplicationState');
  const locale = getLocaleFromParams(params);
  const cdcpWebsiteApplicationUrl = getCdcpWebsiteApplyUrl(locale);

  const parsedId = idSchema.safeParse(params.id);

  if (!parsedId.success) {
    log.warn('Invalid "id" param format; redirecting to [%s]; id: [%s], sessionId: [%s]', cdcpWebsiteApplicationUrl, params.id, session.id);
    throw redirectDocument(cdcpWebsiteApplicationUrl);
  }

  const sessionKey = getSessionKey(parsedId.data);

  if (!session.has(sessionKey)) {
    log.warn('Application session state has not been found; redirecting to [%s]; sessionKey: [%s], sessionId: [%s]', cdcpWebsiteApplicationUrl, sessionKey, session.id);
    throw redirectDocument(cdcpWebsiteApplicationUrl);
  }

  const state = session.get(sessionKey);

  // Checks if the elapsed time since the last update exceeds 20 minutes,
  // and performs necessary actions if it does.
  const lastUpdatedOn = new UTCDate(state.lastUpdatedOn);
  const now = new UTCDate();

  if (differenceInMinutes(now, lastUpdatedOn) >= 20) {
    session.unset(sessionKey);
    log.warn('Application session state has expired; redirecting to [%s]; sessionKey: [%s], sessionId: [%s]', cdcpWebsiteApplicationUrl, sessionKey, session.id);
    throw redirectDocument(cdcpWebsiteApplicationUrl);
  }

  return state;
}

interface SaveStateArgs {
  params: ApplicationStateParams;
  session: Session;
  state: Partial<OmitStrict<PublicApplicationState, 'id' | 'lastUpdatedOn' | 'applicationYear'>>;
  remove?: keyof OmitStrict<PublicApplicationState, 'children' | 'editMode' | 'id' | 'lastUpdatedOn' | 'applicationYear'>;
}

/**
 * Saves public application state.
 * @param args - The arguments.
 * @returns The new public application state.
 */
export function savePublicApplicationState({ params, session, state, remove }: SaveStateArgs): PublicApplicationState {
  const log = createLogger('application-route-helpers.server/saveApplicationState');
  const currentState = getPublicApplicationState({ params, session });

  let newState = {
    ...currentState,
    ...state,
    lastUpdatedOn: new UTCDate().toISOString(),
  } satisfies PublicApplicationState;

  if (remove && remove in newState) {
    newState = omit(newState, [remove]);
  }

  const sessionkey = getSessionKey(currentState.id);
  session.set(sessionkey, newState);
  log.info('Application session state saved; sessionKey: [%s], sessionId: [%s]', sessionkey, session.id);
  return newState;
}

interface ClearStateArgs {
  params: ApplicationStateParams;
  session: Session;
}

/**
 * Clears public application state.
 * @param args - The arguments.
 */
export function clearPublicApplicationState({ params, session }: ClearStateArgs): void {
  const log = createLogger('application-route-helpers.server/clearApplicationState');
  const { id } = getPublicApplicationState({ params, session });

  const sessionKey = getSessionKey(id);
  session.unset(sessionKey);
  log.info('Application session state cleared; sessionKey: [%s], sessionId: [%s]', sessionKey, session.id);
}

interface StartArgs {
  applicationYear: ApplicationYearState;
  session: Session;
}

/**
 * Starts application state.
 * @param args - The arguments.
 * @returns The initial application state.
 */
export function startApplicationState({ applicationYear, session }: StartArgs): PublicApplicationState {
  const log = createLogger('application-route-helpers.server/startApplicationState');

  const id = nanoid(12);
  const initialState: PublicApplicationState = {
    id,
    editMode: false,
    lastUpdatedOn: new UTCDate().toISOString(),
    applicationYear,
    children: [],
  };

  const sessionKey = getSessionKey(initialState.id);
  session.set(sessionKey, initialState);
  log.info('Application session state started; sessionKey: [%s], sessionId: [%s]', sessionKey, session.id);
  return initialState;
}

export type AgeCategory = 'children' | 'youth' | 'adults' | 'seniors';

export function getAgeCategoryFromDateString(date: string, coverageStartDate?: string) {
  const age = getAgeFromDateString(date, coverageStartDate);
  return getAgeCategoryFromAge(age);
}

export function getAgeCategoryFromAge(age: number): AgeCategory {
  if (age >= 65) return 'seniors';
  if (age >= 18 && age < 65) return 'adults';
  if (age >= 16 && age < 18) return 'youth';
  if (age >= 0 && age < 16) return 'children';
  throw new Error(`Invalid age [${age}]`);
}

export function isNewChildState(child: ChildState) {
  return child.dentalInsurance === undefined || child.information === undefined || child.hasFederalProvincialTerritorialBenefits === undefined;
}

export function getChildrenState<TState extends Pick<PublicApplicationState, 'children'>>(state: TState, includesNewChildState: boolean = false) {
  // prettier-ignore
  return includesNewChildState
    ? state.children
    : state.children.filter((child) => isNewChildState(child) === false);
}

export function applicantInformationStateHasPartner(maritalStatus?: string) {
  return maritalStatus === 'commonlaw' || maritalStatus === 'married';
}

type EligibilityRule = {
  minAge: number;
  maxAge: number;
  startDate: string;
};

type EligibilityResult = {
  eligible: boolean;
  startDate?: string;
};

function getEligibilityRules(): EligibilityRule[] {
  const { APPLY_ELIGIBILITY_RULES } = getEnv();
  return JSON.parse(APPLY_ELIGIBILITY_RULES);
}

export function getEligibilityByAge(dateOfBirth: string): EligibilityResult {
  const { APPLICATION_CURRENT_DATE } = getEnv();

  const today = APPLICATION_CURRENT_DATE ? new Date(APPLICATION_CURRENT_DATE) : new Date();
  const age = getAgeFromDateString(dateOfBirth, APPLICATION_CURRENT_DATE);

  for (const { minAge, maxAge, startDate } of getEligibilityRules()) {
    if (age >= minAge && age <= maxAge) {
      return today < new Date(startDate) ? { eligible: false, startDate } : { eligible: true };
    }
  }

  // No eligibility group found; Young and seniors are outisde the eligibility range validation.
  return { eligible: true };
}

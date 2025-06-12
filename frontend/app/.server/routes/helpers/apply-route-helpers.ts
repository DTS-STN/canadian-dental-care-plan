import { redirectDocument } from 'react-router';

import { UTCDate } from '@date-fns/utc';
import { differenceInMinutes } from 'date-fns';
import { omit } from 'moderndash';
import type { ReadonlyDeep } from 'type-fest';
import { z } from 'zod';

import { createLogger } from '~/.server/logging';
import { getEnv } from '~/.server/utils/env.utils';
import { getLocaleFromParams } from '~/.server/utils/locale.utils';
import { getCdcpWebsiteApplyUrl } from '~/.server/utils/url.utils';
import type { Session } from '~/.server/web/session';
import { getAgeFromDateString } from '~/utils/date-utils';

export type ApplyState = ReadonlyDeep<{
  id: string;
  editMode: boolean;
  lastUpdatedOn: string;
  editModeApplicantInformation?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    socialInsuranceNumber: string;
    disabilityTaxCredit?: string;
  };
  editModeLivingIndependently?: boolean;
  applicantInformation?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    socialInsuranceNumber: string;
    disabilityTaxCredit?: string;
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
  typeOfApplication?: 'adult' | 'adult-child' | 'child' | 'delegate';
}>;

export type ApplicantInformationState = NonNullable<ApplyState['applicantInformation']>;
export type ApplicationYearState = ApplyState['applicationYear'];
export type ChildrenState = ApplyState['children'];
export type ChildState = ChildrenState[number];
export type ChildDentalBenefitsState = NonNullable<ChildState['dentalBenefits']>;
export type ChildDentalInsuranceState = NonNullable<ChildState['dentalInsurance']>;
export type ChildInformationState = NonNullable<ChildState['information']>;
export type ChildSinState = Pick<NonNullable<ChildState['information']>, 'hasSocialInsuranceNumber' | 'socialInsuranceNumber'>;
export type CommunicationPreferencesState = NonNullable<ApplyState['communicationPreferences']>;
export type ContactInformationState = NonNullable<ApplyState['contactInformation']>;
export type DentalFederalBenefitsState = Pick<NonNullable<ApplyState['dentalBenefits']>, 'federalSocialProgram' | 'hasFederalBenefits'>;
export type DentalInsuranceState = NonNullable<ApplyState['dentalInsurance']>;
export type DentalProvincialTerritorialBenefitsState = Pick<NonNullable<ApplyState['dentalBenefits']>, 'hasProvincialTerritorialBenefits' | 'province' | 'provincialTerritorialSocialProgram'>;
export type HomeAddressState = NonNullable<ApplyState['homeAddress']>;
export type MailingAddressState = NonNullable<ApplyState['mailingAddress']>;
export type NewOrExistingMemberState = NonNullable<ApplyState['newOrExistingMember']>;
export type PartnerInformationState = NonNullable<ApplyState['partnerInformation']>;
export type SubmissionInfoState = NonNullable<ApplyState['submissionInfo']>;
export type TermsAndConditionsState = NonNullable<ApplyState['termsAndConditions']>;
export type TypeOfApplicationState = NonNullable<ApplyState['typeOfApplication']>;

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
  return `apply-flow-${idSchema.parse(id)}`;
}

export type ApplyStateParams = {
  id: string;
  lang: string;
};

interface LoadStateArgs {
  params: ApplyStateParams;
  session: Session;
}

/**
 * Loads state.
 * @param args - The arguments.
 * @returns The loaded state.
 */
export function loadApplyState({ params, session }: LoadStateArgs) {
  const log = createLogger('apply-route-helpers.server/loadApplyState');
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

  const state: ApplyState = session.get(sessionName);

  // Checks if the elapsed time since the last update exceeds 20 minutes,
  // and performs necessary actions if it does.
  const lastUpdatedOn = new UTCDate(state.lastUpdatedOn);
  const now = new UTCDate();

  if (differenceInMinutes(now, lastUpdatedOn) >= 20) {
    session.unset(sessionName);
    log.warn('Apply session state has expired; redirecting to [%s]; sessionName: [%s], sessionId: [%s]', cdcpWebsiteApplyUrl, sessionName, session.id);
    throw redirectDocument(cdcpWebsiteApplyUrl);
  }

  return state;
}

interface SaveStateArgs {
  params: ApplyStateParams;
  session: Session;
  state: Partial<OmitStrict<ApplyState, 'id' | 'lastUpdatedOn' | 'applicationYear'>>;
  remove?: keyof OmitStrict<ApplyState, 'children' | 'editMode' | 'id' | 'lastUpdatedOn' | 'applicationYear'>;
}

/**
 * Saves apply state.
 * @param args - The arguments.
 * @returns The new apply state.
 */
export function saveApplyState({ params, session, state, remove }: SaveStateArgs) {
  const log = createLogger('apply-route-helpers.server/saveApplyState');
  const currentState = loadApplyState({ params, session });

  let newState = {
    ...currentState,
    ...state,
    lastUpdatedOn: new UTCDate().toISOString(),
  } satisfies ApplyState;

  if (remove && remove in newState) {
    newState = omit(newState, [remove]);
  }

  const sessionName = getSessionName(currentState.id);
  session.set(sessionName, newState);
  log.info('Apply session state saved; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
  return newState;
}

interface ClearStateArgs {
  params: ApplyStateParams;
  session: Session;
}

/**
 * Clears apply state.
 * @param args - The arguments.
 */
export function clearApplyState({ params, session }: ClearStateArgs) {
  const log = createLogger('apply-route-helpers.server/clearApplyState');
  const { id } = loadApplyState({ params, session });

  const sessionName = getSessionName(id);
  session.unset(sessionName);
  log.info('Apply session state cleared; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
}

interface StartArgs {
  applicationYear: ApplicationYearState;
  id: string;
  session: Session;
}

/**
 * Starts apply state.
 * @param args - The arguments.
 * @returns The initial apply state.
 */
export function startApplyState({ applicationYear, id, session }: StartArgs) {
  const log = createLogger('apply-route-helpers.server/startApplyState');
  const parsedId = idSchema.parse(id);

  const initialState: ApplyState = {
    id: parsedId,
    editMode: false,
    lastUpdatedOn: new UTCDate().toISOString(),
    applicationYear,
    children: [],
  };

  const sessionName = getSessionName(parsedId);
  session.set(sessionName, initialState);
  log.info('Apply session state started; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
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

export function getChildrenState<TState extends Pick<ApplyState, 'children'>>(state: TState, includesNewChildState: boolean = false) {
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

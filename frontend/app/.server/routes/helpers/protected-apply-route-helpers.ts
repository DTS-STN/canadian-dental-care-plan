import { redirect } from 'react-router';

import { UTCDate } from '@date-fns/utc';
import { differenceInMinutes } from 'date-fns';
import { omit } from 'moderndash';
import type { ReadonlyDeep } from 'type-fest';
import { z } from 'zod';

import { createLogger } from '~/.server/logging';
import { getEnv } from '~/.server/utils/env.utils';
import type { Session } from '~/.server/web/session';
import { getAgeFromDateString } from '~/utils/date-utils';
import { getPathById } from '~/utils/route-utils';

export type ProtectedApplyState = ReadonlyDeep<{
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
  typeOfApplication?: 'adult' | 'adult-child' | 'child' | 'delegate';
}>;

export type ApplicantInformationState = NonNullable<ProtectedApplyState['applicantInformation']>;
export type ApplicationYearState = ProtectedApplyState['applicationYear'];
export type ChildrenState = ProtectedApplyState['children'];
export type ChildState = ChildrenState[number];
export type ChildDentalBenefitsState = NonNullable<ChildState['dentalBenefits']>;
export type ChildDentalInsuranceState = NonNullable<ChildState['dentalInsurance']>;
export type ChildInformationState = NonNullable<ChildState['information']>;
export type ChildSinState = Pick<NonNullable<ChildState['information']>, 'hasSocialInsuranceNumber' | 'socialInsuranceNumber'>;
export type CommunicationPreferencesState = NonNullable<ProtectedApplyState['communicationPreferences']>;
export type ContactInformationState = NonNullable<ProtectedApplyState['contactInformation']>;
export type DentalFederalBenefitsState = Pick<NonNullable<ProtectedApplyState['dentalBenefits']>, 'federalSocialProgram' | 'hasFederalBenefits'>;
export type DentalInsuranceState = NonNullable<ProtectedApplyState['dentalInsurance']>;
export type DentalProvincialTerritorialBenefitsState = Pick<NonNullable<ProtectedApplyState['dentalBenefits']>, 'hasProvincialTerritorialBenefits' | 'province' | 'provincialTerritorialSocialProgram'>;
export type HomeAddressState = NonNullable<ProtectedApplyState['homeAddress']>;
export type MailingAddressState = NonNullable<ProtectedApplyState['mailingAddress']>;
export type NewOrExistingMemberState = NonNullable<ProtectedApplyState['newOrExistingMember']>;
export type PartnerInformationState = NonNullable<ProtectedApplyState['partnerInformation']>;
export type SubmissionInfoState = NonNullable<ProtectedApplyState['submissionInfo']>;
export type TermsAndConditionsState = NonNullable<ProtectedApplyState['termsAndConditions']>;
export type TypeOfApplicationState = NonNullable<ProtectedApplyState['typeOfApplication']>;

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
  applicationYear: ApplicationYearState;
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
  const log = createLogger('apply-route-helpers.server/loadProtectedApplyState');

  const parsedId = idSchema.safeParse(params.id);

  if (!parsedId.success) {
    log.warn('Invalid "id" param format; redirecting to protected/apply; id: [%s], sessionId: [%s]', params.id, session.id);
    throw redirect(getPathById('protected/apply/index', params));
  }

  const sessionName = getSessionName(parsedId.data);

  if (!session.has(sessionName)) {
    log.warn('Apply session state has not been found; redirecting to protected/apply; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
    throw redirect(getPathById('protected/apply/index', params));
  }

  const state: ProtectedApplyState = session.get(sessionName);

  // Checks if the elapsed time since the last update exceeds 20 minutes,
  // and performs necessary actions if it does.
  const lastUpdatedOn = new UTCDate(state.lastUpdatedOn);
  const now = new UTCDate();

  if (differenceInMinutes(now, lastUpdatedOn) >= 20) {
    session.unset(sessionName);
    log.warn('Protected apply session state has expired; redirecting to protected/apply; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
    throw redirect(getPathById('protected/apply/index', params));
  }

  return state;
}

/**
 * Starts protected apply state.
 * @param args - The arguments.
 * @returns The initial protected apply state.
 */
export function startProtectedApplyState({ applicationYear, id, session }: StartArgs) {
  const log = createLogger('protected-apply-route-helpers.server/startProtectedApplyState');
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
export function saveProtectedApplyState({ params, session, state, remove }: SaveStateArgs) {
  const log = createLogger('protected-apply-route-helpers.server/saveProtectedApplyState');
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

interface ClearStateArgs {
  params: ProtectedApplyStateParams;
  session: Session;
}

/**
 * Clears protected apply state.
 * @param args - The arguments.
 */
export function clearProtectedApplyState({ params, session }: ClearStateArgs) {
  const log = createLogger('protected-apply-route-helpers.server/clearProtectedApplyState');
  const { id } = loadProtectedApplyState({ params, session });

  const sessionName = getSessionName(id);
  session.unset(sessionName);
  log.info('Protected apply session state cleared; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
}

export function applicantInformationStateHasPartner(maritalStatus?: string) {
  if (!maritalStatus) return false;
  return ['married', 'commonlaw'].includes(maritalStatus);
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

export function isNewChildState(child: ChildState) {
  return child.dentalInsurance === undefined || child.information === undefined || child.hasFederalProvincialTerritorialBenefits === undefined;
}

export function getChildrenState<TState extends Pick<ProtectedApplyState, 'children'>>(state: TState, includesNewChildState: boolean = false) {
  // prettier-ignore
  return includesNewChildState
    ? state.children
    : state.children.filter((child) => isNewChildState(child) === false);
}

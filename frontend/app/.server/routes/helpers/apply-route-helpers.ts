import { redirectDocument } from 'react-router';

import { UTCDate } from '@date-fns/utc';
import { differenceInMinutes } from 'date-fns';
import { omit } from 'moderndash';
import type { ReadonlyDeep } from 'type-fest';
import { z } from 'zod';

import { getEnv } from '~/.server/utils/env.utils';
import { getLocaleFromParams } from '~/.server/utils/locale.utils';
import { getLogger } from '~/.server/utils/logging.utils';
import { getCdcpWebsiteApplyUrl } from '~/.server/utils/url.utils';
import type { Session } from '~/.server/web/session';
import { getAgeFromDateString } from '~/utils/date-utils';

export type ApplyState = ReadonlyDeep<{
  id: string;
  editMode: boolean;
  lastUpdatedOn: string;
  allChildrenUnder18?: boolean;
  applicantInformation?: {
    firstName: string;
    lastName: string;
    maritalStatus: string;
    socialInsuranceNumber: string;
  };
  applicationYear?: {
    intakeYearId: string;
    taxYear: string;
  };
  children: {
    id: string;
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
    email?: string;
    preferredLanguage: string;
    preferredMethod: string;
  };
  dateOfBirth?: string;
  dentalBenefits?: {
    hasFederalBenefits: boolean;
    federalSocialProgram?: string;
    hasProvincialTerritorialBenefits: boolean;
    provincialTerritorialSocialProgram?: string;
    province?: string;
  };
  dentalInsurance?: boolean;
  disabilityTaxCredit?: boolean;
  livingIndependently?: boolean;
  partnerInformation?: {
    confirm: boolean;
    dateOfBirth: string;
    firstName: string;
    lastName: string;
    socialInsuranceNumber: string;
  };
  contactInformation?: {
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
  taxFiling2023?: boolean;
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
export type DentalFederalBenefitsState = Pick<NonNullable<ApplyState['dentalBenefits']>, 'federalSocialProgram' | 'hasFederalBenefits'>;
export type DentalInsuranceState = NonNullable<ApplyState['dentalInsurance']>;
export type DentalProvincialTerritorialBenefitsState = Pick<NonNullable<ApplyState['dentalBenefits']>, 'hasProvincialTerritorialBenefits' | 'province' | 'provincialTerritorialSocialProgram'>;
export type PartnerInformationState = NonNullable<ApplyState['partnerInformation']>;
export type ContactInformationState = NonNullable<ApplyState['contactInformation']>;
export type SubmissionInfoState = NonNullable<ApplyState['submissionInfo']>;
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
  const log = getLogger('apply-route-helpers.server/loadApplyState');
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
export function saveApplyState({ params, session, state, remove = undefined }: SaveStateArgs) {
  const log = getLogger('apply-route-helpers.server/saveApplyState');
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
  const log = getLogger('apply-route-helpers.server/clearApplyState');
  const { id } = loadApplyState({ params, session });

  const sessionName = getSessionName(id);
  session.unset(sessionName);
  log.info('Apply session state cleared; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
}

interface StartArgs {
  applicationYear?: ApplicationYearState;
  id: string;
  session: Session;
}

/**
 * Starts apply state.
 * @param args - The arguments.
 * @returns The initial apply state.
 */
export function startApplyState({ applicationYear, id, session }: StartArgs) {
  const log = getLogger('apply-route-helpers.server/startApplyState');
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

export function getAgeCategoryFromDateString(date: string) {
  const age = getAgeFromDateString(date);
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
  return child.dentalBenefits === undefined || child.dentalInsurance === undefined || child.information === undefined;
}

export function getChildrenState<TState extends Pick<ApplyState, 'children'>>(state: TState, includesNewChildState: boolean = false) {
  // prettier-ignore
  return includesNewChildState
    ? state.children
    : state.children.filter((child) => isNewChildState(child) === false);
}

interface ApplicantInformationStateHasPartnerArgs {
  maritalStatus: string;
}

export function applicantInformationStateHasPartner({ maritalStatus }: ApplicantInformationStateHasPartnerArgs) {
  const { MARITAL_STATUS_CODE_MARRIED, MARITAL_STATUS_CODE_COMMONLAW } = getEnv();
  return [MARITAL_STATUS_CODE_MARRIED, MARITAL_STATUS_CODE_COMMONLAW].includes(Number(maritalStatus));
}

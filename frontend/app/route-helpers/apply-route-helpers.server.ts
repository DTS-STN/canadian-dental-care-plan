import { Session, redirect } from '@remix-run/node';
import { Params } from '@remix-run/react';

import { UTCDate } from '@date-fns/utc';
import { differenceInMinutes } from 'date-fns';
import { omit } from 'moderndash';
import { z } from 'zod';

import { getAgeFromDateString } from '~/utils/date-utils';
import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';
import { getPathById } from '~/utils/route-utils';

const log = getLogger('apply-route-helpers.server');

export interface ApplyState {
  readonly id: string;
  readonly editMode: boolean;
  readonly lastUpdatedOn: string;
  readonly allChildrenUnder18?: boolean;
  readonly applicantInformation?: {
    firstName: string;
    lastName: string;
    maritalStatus: string;
    socialInsuranceNumber: string;
  };
  readonly children: {
    readonly id: string;
    readonly dentalBenefits?: {
      hasFederalBenefits: boolean;
      federalSocialProgram?: string;
      hasProvincialTerritorialBenefits: boolean;
      provincialTerritorialSocialProgram?: string;
      province?: string;
    };
    readonly dentalInsurance?: boolean;
    readonly information?: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      isParent: boolean;
      hasSocialInsuranceNumber: boolean;
      socialInsuranceNumber?: string;
    };
  }[];
  readonly communicationPreferences?: {
    email?: string;
    preferredLanguage: string;
    preferredMethod: string;
  };
  readonly dateOfBirth?: string;
  readonly dentalBenefits?: {
    hasFederalBenefits: boolean;
    federalSocialProgram?: string;
    hasProvincialTerritorialBenefits: boolean;
    provincialTerritorialSocialProgram?: string;
    province?: string;
  };
  readonly dentalInsurance?: boolean;
  readonly disabilityTaxCredit?: boolean;
  readonly livingIndependently?: boolean;
  readonly partnerInformation?: {
    confirm: boolean;
    dateOfBirth: string;
    firstName: string;
    lastName: string;
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
  readonly taxFiling2023?: boolean;
  readonly typeOfApplication?: 'adult' | 'adult-child' | 'child' | 'delegate';
}

export type ApplicantInformationState = NonNullable<ApplyState['applicantInformation']>;
export type ChildState = ApplyState['children'][number];
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

interface LoadStateArgs {
  params: Params;
  session: Session;
}

/**
 * Loads state.
 * @param args - The arguments.
 * @returns The loaded state.
 */
export function loadApplyState({ params, session }: LoadStateArgs) {
  const parsedId = idSchema.safeParse(params.id);

  if (!parsedId.success) {
    log.warn('Invalid "id" param format; id: [%s], sessionId: [%s]', params.id, session.id);
    throw new Response(null, { status: 404 });
  }

  const sessionName = getSessionName(parsedId.data);

  if (!session.has(sessionName)) {
    log.warn('Apply session state has not been found; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
    throw new Response(null, { status: 404 });
  }

  const state: ApplyState = session.get(sessionName);

  // Checks if the elapsed time since the last update exceeds 15 minutes,
  // and performs necessary actions if it does.
  const lastUpdatedOn = new UTCDate(state.lastUpdatedOn);
  const now = new UTCDate();

  if (differenceInMinutes(now, lastUpdatedOn) >= 15) {
    session.unset(sessionName);
    log.warn('Apply session state has expired; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
    throw redirect(getPathById('$lang/_public/apply/index', params));
  }

  return state;
}

interface SaveStateArgs {
  params: Params;
  session: Session;
  state: Partial<OmitStrict<ApplyState, 'id' | 'lastUpdatedOn'>>;
  remove?: keyof OmitStrict<ApplyState, 'children' | 'editMode' | 'id' | 'lastUpdatedOn'>;
}

/**
 * Saves apply state.
 * @param args - The arguments.
 * @returns The new apply state.
 */
export function saveApplyState({ params, session, state, remove = undefined }: SaveStateArgs) {
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
  params: Params;
  session: Session;
}

/**
 * Clears apply state.
 * @param args - The arguments.
 */
export function clearApplyState({ params, session }: ClearStateArgs) {
  const { id } = loadApplyState({ params, session });

  const sessionName = getSessionName(id);
  session.unset(sessionName);
  log.info('Apply session state cleared; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
}

interface StartArgs {
  id: string;
  session: Session;
}

/**
 * Starts apply state.
 * @param args - The arguments.
 * @returns The initial apply state.
 */
export function startApplyState({ id, session }: StartArgs) {
  const parsedId = idSchema.parse(id);

  const initialState: ApplyState = {
    id: parsedId,
    editMode: false,
    lastUpdatedOn: new UTCDate().toISOString(),
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

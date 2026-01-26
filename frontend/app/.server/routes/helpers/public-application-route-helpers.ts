import { redirect, redirectDocument } from 'react-router';
import type { Params } from 'react-router';

import { UTCDate } from '@date-fns/utc';
import { differenceInMinutes } from 'date-fns';
import { omit } from 'moderndash';
import { customAlphabet, urlAlphabet } from 'nanoid';
import type { ReadonlyDeep } from 'type-fest';
import { z } from 'zod';

import type { ClientApplicationDto } from '~/.server/domain/dtos';
import { createLogger } from '~/.server/logging';
import type { DeclaredChange } from '~/.server/routes/helpers/declared-change-type';
import { getEnv } from '~/.server/utils/env.utils';
import { getLocaleFromParams } from '~/.server/utils/locale.utils';
import { getCdcpWebsiteApplyUrl } from '~/.server/utils/url.utils';
import type { Session } from '~/.server/web/session';
import type { EligibilityType } from '~/components/eligibility';
import { getAgeFromDateString } from '~/utils/date-utils';
import { getPathById } from '~/utils/route-utils';

export type PublicApplicationStateSessionKey = `public-application-${string}`;

export type PublicApplicationState = ReadonlyDeep<{
  /**
   * The unique identifier for the public application.
   */
  id: string;

  /**
   * The context of the application, either 'intake' for new applications or 'renewal' for renewal applications.
   * Immutable and set at the start of the application process based on renewal period status.
   */
  context: 'intake' | 'renewal';

  lastUpdatedOn: string;
  applicantInformation?: {
    memberId?: string;
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
    dentalBenefits?: DeclaredChange<{
      hasFederalBenefits: boolean;
      federalSocialProgram?: string;
      hasProvincialTerritorialBenefits: boolean;
      provincialTerritorialSocialProgram?: string;
      province?: string;
    }>;
    dentalInsurance?: {
      hasDentalInsurance: boolean;
      dentalInsuranceEligibilityConfirmation?: boolean;
    };
    information?: {
      memberId?: string;
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      isParent: boolean;
      hasSocialInsuranceNumber: boolean;
      socialInsuranceNumber?: string;
    };
  }[];
  communicationPreferences?: DeclaredChange<{
    preferredLanguage: string;
    preferredMethod: string;
    preferredNotificationMethod: string;
  }>;
  email?: string;
  verifyEmail?: {
    verificationCode: string;
    verificationAttempts: number;
  };
  emailVerified?: boolean;
  maritalStatus?: string;
  dentalBenefits?: DeclaredChange<{
    hasFederalBenefits: boolean;
    federalSocialProgram?: string;
    hasProvincialTerritorialBenefits: boolean;
    provincialTerritorialSocialProgram?: string;
    province?: string;
  }>;
  dentalInsurance?: {
    hasDentalInsurance: boolean;
    dentalInsuranceEligibilityConfirmation: boolean;
  };
  livingIndependently?: boolean;
  partnerInformation?: {
    confirm: boolean;
    yearOfBirth: string;
    socialInsuranceNumber: string;
  };
  isHomeAddressSameAsMailingAddress?: boolean;
  mailingAddress?: DeclaredChange<{
    address: string;
    city: string;
    country: string;
    postalCode?: string;
    province?: string;
  }>;
  homeAddress?: DeclaredChange<{
    address: string;
    city: string;
    country: string;
    postalCode?: string;
    province?: string;
  }>;
  phoneNumber?: DeclaredChange<{
    primary: string;
    alternate?: string;
  }>;
  submitTerms?: {
    acknowledgeInfo: boolean;
    acknowledgeCriteria: boolean;
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
  inputModel?: 'new' | 'renew';
  typeOfApplicationFlow?: 'adult' | 'children' | 'family' | 'delegate';
  clientApplication?: ClientApplicationDto;
}>;

export type ApplicantInformationState = NonNullable<PublicApplicationState['applicantInformation']>;
export type ApplicationYearState = PublicApplicationState['applicationYear'];
export type ChildrenState = PublicApplicationState['children'];
export type ChildState = ChildrenState[number];
export type ChildDentalBenefitsState = NonNullable<ChildState['dentalBenefits']>;
export type ChildDentalInsuranceState = NonNullable<ChildState['dentalInsurance']>;
export type ChildInformationState = NonNullable<ChildState['information']>;
export type ChildSinState = Pick<NonNullable<ChildState['information']>, 'hasSocialInsuranceNumber' | 'socialInsuranceNumber'>;
export type DeclaredChangeCommunicationPreferencesState = NonNullable<NonNullable<PublicApplicationState['communicationPreferences']>>;
export type CommunicationPreferencesState = NonNullable<NonNullable<PublicApplicationState['communicationPreferences']>['value']>;
export type DeclaredChangePhoneNumberState = NonNullable<NonNullable<PublicApplicationState['phoneNumber']>>;
export type PhoneNumberState = NonNullable<NonNullable<PublicApplicationState['phoneNumber']>['value']>;
export type DeclaredChangeDentalFederalBenefitsState = NonNullable<PublicApplicationState['dentalBenefits']>;
export type DentalFederalBenefitsState = Pick<NonNullable<NonNullable<PublicApplicationState['dentalBenefits']>['value']>, 'federalSocialProgram' | 'hasFederalBenefits'>;
export type DentalInsuranceState = NonNullable<PublicApplicationState['dentalInsurance']>;
export type DeclaredChangeDentalProvincialTerritorialBenefitsState = NonNullable<PublicApplicationState['dentalBenefits']>;
export type DentalProvincialTerritorialBenefitsState = Pick<NonNullable<NonNullable<PublicApplicationState['dentalBenefits']>['value']>, 'hasProvincialTerritorialBenefits' | 'province' | 'provincialTerritorialSocialProgram'>;
export type HomeAddressState = NonNullable<PublicApplicationState['homeAddress']>;
export type MailingAddressState = NonNullable<PublicApplicationState['mailingAddress']>;
export type PartnerInformationState = NonNullable<PublicApplicationState['partnerInformation']>;
export type SubmissionInfoState = NonNullable<PublicApplicationState['submissionInfo']>;
export type TermsAndConditionsState = NonNullable<PublicApplicationState['termsAndConditions']>;
export type InputModelState = NonNullable<PublicApplicationState['inputModel']>;
export type TypeOfApplicationFlowState = NonNullable<PublicApplicationState['typeOfApplicationFlow']>;
export type DeclaredChangeHomeAddressState = NonNullable<PublicApplicationState['homeAddress']>;
export type DeclaredChangeMailingAddressState = NonNullable<PublicApplicationState['mailingAddress']>;

/**
 * Predefined Nano ID function.
 */
const nanoid = customAlphabet(urlAlphabet, 10);

/**
 * Schema for validating Nano ID.
 */
const idSchema = z.string().regex(/^[a-zA-Z0-9_-]+$/);

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
  state: Partial<OmitStrict<PublicApplicationState, 'id' | 'lastUpdatedOn' | 'applicationYear' | 'context'>>;
  remove?: keyof OmitStrict<PublicApplicationState, 'children' | 'id' | 'lastUpdatedOn' | 'applicationYear' | 'context'>;
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

  const id = nanoid();
  const initialState: PublicApplicationState = {
    id,
    context: isWithinRenewalPeriod() ? 'renewal' : 'intake',
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
  return child.dentalInsurance === undefined || child.information === undefined || child.dentalBenefits === undefined;
}

export function getChildrenState<TState extends Pick<PublicApplicationState, 'children'>>(state: TState, includesNewChildState: boolean = false) {
  // prettier-ignore
  return includesNewChildState
    ? state.children
    : state.children.filter((child) => isNewChildState(child) === false);
}

export function applicantInformationStateHasPartner(maritalStatus?: string) {
  if (!maritalStatus) return false;
  const { MARITAL_STATUS_CODE_COMMON_LAW, MARITAL_STATUS_CODE_MARRIED } = getEnv();
  return [MARITAL_STATUS_CODE_COMMON_LAW, MARITAL_STATUS_CODE_MARRIED].includes(maritalStatus);
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

/**
 * Extracts the input model and type of application flow from a combined string.
 *
 * @template S - A string in the format `${InputModelState}-${TypeOfApplicationFlowState}`
 *
 * @returns An object containing `inputModel` and `typeOfApplicationFlow` if the input string is valid; otherwise, `never`.
 *
 * @example
 * ```typescript
 * type Result = ExtractStateFromTypeAndFlow<'new-adult'>;
 * // Result is { inputModel: 'new'; typeOfApplicationFlow: 'adult' }
 * ```
 */
type ExtractStateFromTypeAndFlow<S extends string> = S extends `${infer I}-${infer F}` //
  ? I extends InputModelState
    ? F extends TypeOfApplicationFlowState
      ? { inputModel: I; typeOfApplicationFlow: F }
      : never
    : never
  : never;

/**
 * Validates the application flow based on the provided state and allowed flows.
 *
 * @template TAllowedFlows - A readonly array of allowed flow combinations in the format `${InputModelState}-${TypeOfApplicationFlowState}`.
 *
 * @param state - The current public application state to validate.
 * @param params - The route parameters used for redirection if validation fails.
 * @param allowedFlows - An array of allowed flow combinations.
 *
 * @throws {RedirectDocument} If the input model or flow is not defined, or if the combination is not allowed.
 *
 * @example
 * ```typescript
 * validateApplicationFlow(state, params, ['new-adult', 'renew-children']);
 * ```
 */
export function validateApplicationFlow<TAllowedFlows extends ReadonlyArray<`${InputModelState}-${TypeOfApplicationFlowState}`>>(
  state: PublicApplicationState,
  params: Params,
  allowedFlows: TAllowedFlows,
): asserts state is OmitStrict<PublicApplicationState, 'inputModel' | 'typeOfApplicationFlow'> & ExtractStateFromTypeAndFlow<TAllowedFlows[number]> {
  const log = createLogger('application-route-helpers.server/validateApplicationFlow');

  const inputModel = state.inputModel;
  const flow = state.typeOfApplicationFlow;

  if (!inputModel || !flow) {
    const redirectUrl = getInitialTypeAndFlowUrl('entry', params);
    log.warn('Input model or flow is not defined in the state; redirecting to [%s], stateId: [%s]', redirectUrl, state.id);
    throw redirectDocument(redirectUrl);
  }

  const flowKey = `${inputModel}-${flow}` as const;

  if (!allowedFlows.includes(flowKey)) {
    const redirectUrl = getInitialTypeAndFlowUrl(flowKey, params);
    log.warn('Flow [%s] is not allowed; allowedTypesAndFlows: [%s], redirecting to [%s], stateId: [%s]', flowKey, allowedFlows, redirectUrl, state.id);
    throw redirectDocument(redirectUrl);
  }
}

export type ApplicationFlow = 'entry' | `${InputModelState}-${TypeOfApplicationFlowState}`;

/**
 * Determines the initial URL path based on the application type and flow state.
 *
 * @param typeAndFlow - Either 'entry' for initial entry point, or a combination of application type
 *                      and flow state in the format `${TypeOfApplicationState}-${TypeOfApplicationFlowState}`
 * @param params - Route parameters used to generate the path, typically containing an application ID
 * @returns The URL path string for the corresponding application type and flow
 * @throws {Error} When an unknown typeAndFlow value is provided
 */
export function getInitialTypeAndFlowUrl(typeAndFlow: ApplicationFlow, params: Params) {
  switch (typeAndFlow) {
    case 'entry': {
      return getPathById('public/application/$id/eligibility-requirements', params);
    }
    case 'new-adult': {
      return getPathById('public/application/$id/new-adult/marital-status', params);
    }
    case 'new-children': {
      return getPathById('public/application/$id/new-children/parent-or-guardian', params);
    }
    case 'new-family': {
      return getPathById('public/application/$id/new-family/marital-status', params);
    }
    case 'new-delegate': {
      return getPathById('public/application/$id/application-delegate', params);
    }
    case 'renew-adult': {
      return getPathById('public/application/$id/renew-adult/contact-information', params);
    }
    case 'renew-children': {
      return getPathById('public/application/$id/renew-children/parent-or-guardian', params);
    }
    case 'renew-family': {
      throw new Error('Not implemented yet: "renew-family" case');
    }
    case 'renew-delegate': {
      return getPathById('public/application/$id/application-delegate', params);
    }
    default: {
      throw new Error(`Unknown typeAndFlow value: [${typeAndFlow}]`);
    }
  }
}

interface getSingleChildStateArgs {
  params: ApplicationStateParams & { childId: string };
  request: Request;
  session: Session;
}

/**
 * Loads single child state from public application state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function getSingleChildState({ params, request, session }: getSingleChildStateArgs) {
  const log = createLogger('public-application-route-helpers.server/publicApplicationSingleChildState');
  const applicationState = getPublicApplicationState({ params, session });

  const parsedChildId = z.uuid().safeParse(params.childId);

  if (!parsedChildId.success) {
    log.warn('Invalid "childId" param format; childId: [%s]', params.childId);
    throw redirect(getPathById(`public/application/$id/${applicationState.inputModel}-${applicationState.typeOfApplicationFlow}/children/index`, params));
  }

  const childId = parsedChildId.data;
  const childStateIndex = applicationState.children.findIndex(({ id }) => id === childId);

  if (childStateIndex === -1) {
    log.warn('Apply single child has not been found; childId: [%s]', childId);
    throw redirect(getPathById(`public/application/$id/${applicationState.inputModel}-${applicationState.typeOfApplicationFlow}/children/index`, params));
  }

  const childState = applicationState.children[childStateIndex];
  const isNew = isNewChildState(childState);

  return { ...childState, childNumber: childStateIndex + 1, isNew };
}

/**
 * Checks if the provided date falls within the configured renewal period.
 *
 * The renewal period is defined by the `RENEWAL_PERIOD_START_DATE` and
 * `RENEWAL_PERIOD_END_DATE` environment variables.
 *
 * @param date - The date to check. Defaults to the current date and time.
 * @returns `true` if the date is within the renewal period (inclusive); otherwise, `false`.
 */
export function isWithinRenewalPeriod(date: Date = new Date()): boolean {
  const { RENEWAL_PERIOD_START_DATE, RENEWAL_PERIOD_END_DATE } = getEnv();
  const startDate = new Date(RENEWAL_PERIOD_START_DATE);
  const endDate = new Date(RENEWAL_PERIOD_END_DATE);
  return date >= startDate && date <= endDate;
}

export function getEligibilityStatus(hasPrivateDentalInsurance: boolean, t4DentalIndicator?: boolean): EligibilityType {
  if (!hasPrivateDentalInsurance && !t4DentalIndicator) return 'eligible';
  if (!hasPrivateDentalInsurance && t4DentalIndicator) return 'eligible-proof';
  return 'ineligible';
}

import { redirect, redirectDocument } from 'react-router';
import type { Params } from 'react-router';

import { UTCDate } from '@date-fns/utc';
import { invariant } from '@dts-stn/invariant';
import { differenceInMinutes } from 'date-fns';
import type { PickDeep, ReadonlyDeep } from 'type-fest';

import type { ClientApplicationDto } from '~/.server/domain/dtos';
import { createLogger } from '~/.server/logging';
import type { DeclaredChange } from '~/.server/routes/helpers/declared-change-type';
import { getEnv } from '~/.server/utils/env.utils';
import { getLocaleFromParams } from '~/.server/utils/locale.utils';
import { getCdcpWebsiteApplyUrl } from '~/.server/utils/url.utils';
import type { Session } from '~/.server/web/session';
import type { EligibilityType } from '~/components/eligibility';
import { getAgeFromDateString } from '~/utils/date-utils';
import { generateId, isValidId } from '~/utils/id.utils';
import { getPathById } from '~/utils/route-utils';

export type ProtectedApplicationStateSessionKey = `protected-application-flow-${string}`;

export type ProtectedApplicationState = ReadonlyDeep<{
  /**
   * The unique identifier for the protected application.
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

  typeOfApplication?: 'adult' | 'children' | 'family' | 'delegate';
  clientApplication?: ClientApplicationDto;
  applicantClientIdsToRenew?: string[];
}>;

export type ApplicantInformationState = NonNullable<ProtectedApplicationState['applicantInformation']>;
export type ApplicationYearState = ProtectedApplicationState['applicationYear'];
export type ChildrenState = ProtectedApplicationState['children'];
export type ChildState = ChildrenState[number];
export type ChildDentalBenefitsState = NonNullable<ChildState['dentalBenefits']>;
export type ChildDentalInsuranceState = NonNullable<ChildState['dentalInsurance']>;
export type ChildInformationState = NonNullable<ChildState['information']>;
export type ChildSinState = Pick<NonNullable<ChildState['information']>, 'hasSocialInsuranceNumber' | 'socialInsuranceNumber'>;
export type DeclaredChangeCommunicationPreferencesState = NonNullable<NonNullable<ProtectedApplicationState['communicationPreferences']>>;
export type CommunicationPreferencesState = NonNullable<NonNullable<ProtectedApplicationState['communicationPreferences']>['value']>;
export type DeclaredChangePhoneNumberState = NonNullable<NonNullable<ProtectedApplicationState['phoneNumber']>>;
export type PhoneNumberState = NonNullable<NonNullable<ProtectedApplicationState['phoneNumber']>['value']>;
export type DeclaredChangeDentalFederalBenefitsState = NonNullable<ProtectedApplicationState['dentalBenefits']>;
export type DentalFederalBenefitsState = Pick<NonNullable<NonNullable<ProtectedApplicationState['dentalBenefits']>['value']>, 'federalSocialProgram' | 'hasFederalBenefits'>;
export type DentalInsuranceState = NonNullable<ProtectedApplicationState['dentalInsurance']>;
export type DeclaredChangeDentalProvincialTerritorialBenefitsState = NonNullable<ProtectedApplicationState['dentalBenefits']>;
export type DentalProvincialTerritorialBenefitsState = Pick<NonNullable<NonNullable<ProtectedApplicationState['dentalBenefits']>['value']>, 'hasProvincialTerritorialBenefits' | 'province' | 'provincialTerritorialSocialProgram'>;
export type HomeAddressState = NonNullable<ProtectedApplicationState['homeAddress']>;
export type MailingAddressState = NonNullable<ProtectedApplicationState['mailingAddress']>;
export type PartnerInformationState = NonNullable<ProtectedApplicationState['partnerInformation']>;
export type SubmissionInfoState = NonNullable<ProtectedApplicationState['submissionInfo']>;
export type TermsAndConditionsState = NonNullable<ProtectedApplicationState['termsAndConditions']>;
export type ContextState = NonNullable<ProtectedApplicationState['context']>;
export type TypeOfApplicationState = NonNullable<ProtectedApplicationState['typeOfApplication']>;
export type DeclaredChangeHomeAddressState = NonNullable<ProtectedApplicationState['homeAddress']>;
export type DeclaredChangeMailingAddressState = NonNullable<ProtectedApplicationState['mailingAddress']>;

/**
 * Gets the protected application flow session key.
 * @param id - The protected application flow ID.
 * @returns The protected application flow session key.
 */
function getSessionKey(id: string): ProtectedApplicationStateSessionKey {
  return `protected-application-flow-${id}`;
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
 * Gets protected application state.
 * @param args - The arguments.
 * @returns The protected application state.
 */
export function getProtectedApplicationState({ params, session }: LoadStateArgs): ProtectedApplicationState {
  const log = createLogger('application-route-helpers.server/loadApplicationState');
  const locale = getLocaleFromParams(params);
  const cdcpWebsiteApplicationUrl = getCdcpWebsiteApplyUrl(locale);

  const id = params.id;

  if (!isValidId(id)) {
    log.warn('Invalid "id" param format; redirecting to [%s]; id: [%s], sessionId: [%s]', cdcpWebsiteApplicationUrl, params.id, session.id);
    throw redirectDocument(cdcpWebsiteApplicationUrl);
  }

  const sessionKey = getSessionKey(id);

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

interface SaveProtectedApplicationStateArgs {
  params: ApplicationStateParams;
  session: Session;
  state: Partial<OmitStrict<ProtectedApplicationState, 'id' | 'lastUpdatedOn' | 'applicationYear' | 'context'>>;
}

/**
 * Saves protected application state.
 * @param args - The arguments.
 * @returns The new protected application state.
 */
export function saveProtectedApplicationState({ params, session, state }: SaveProtectedApplicationStateArgs): ProtectedApplicationState {
  const log = createLogger('application-route-helpers.server/saveApplicationState');
  const currentState = getProtectedApplicationState({ params, session });

  const newState = {
    ...currentState,
    ...state,
    lastUpdatedOn: new UTCDate().toISOString(),
  } satisfies ProtectedApplicationState;

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
 * Clears protected application state.
 * @param args - The arguments.
 */
export function clearProtectedApplicationState({ params, session }: ClearStateArgs): void {
  const log = createLogger('application-route-helpers.server/clearApplicationState');
  const { id } = getProtectedApplicationState({ params, session });

  const sessionKey = getSessionKey(id);
  session.unset(sessionKey);
  log.info('Application session state cleared; sessionKey: [%s], sessionId: [%s]', sessionKey, session.id);
}

interface StartProtectedApplicationStateArgs {
  /**
   * The application year data used to determine the application year. This is required to initialize the state
   */
  applicationYear: ApplicationYearState;

  /**
   * The client application data used to determine the input model for renewal applications. This should be
   * provided when starting a renewal application, and can be omitted for intake applications.
   */
  clientApplication?: ClientApplicationDto;

  /**
   * The session object used to store the application state. This is required to initialize the state
   * and should be provided when starting the application.
   */
  session: Session;
}

/**
 * Starts the application state by creating a new state object with the provided application year
 * and client application data, and storing it in the session. The function determines the application
 * context (intake or renewal) based on the current date and the defined renewal period, and
 * sets the input model accordingly.
 *
 * @param args - The arguments.
 * @returns The initialized protected application state.
 */
export function startProtectedApplicationState({ applicationYear, clientApplication, session }: StartProtectedApplicationStateArgs): ProtectedApplicationState {
  const id = generateId();
  const context = isWithinRenewalPeriod() ? 'renewal' : 'intake';

  // For renewal applications, client application data is required to initialize the state
  if (context === 'renewal' && !clientApplication) {
    throw new Error('Client application data is required to start a renewal application');
  }

  // Create the initial state object
  const initialState = {
    id,
    context,
    lastUpdatedOn: new UTCDate().toISOString(),
    applicationYear,
    clientApplication,
    children: [],
  } satisfies ProtectedApplicationState;

  // Store the initial state in the session
  const sessionKey = getSessionKey(initialState.id);
  session.set(sessionKey, initialState);

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

export function getChildrenState<TState extends Pick<ProtectedApplicationState, 'children'>>(state: TState, includesNewChildState: boolean = false) {
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
 * Extracts the input model and type of application from a combined string.
 *
 * @template S - A string in the format `${ContextState}-${TypeOfApplicationState}`
 *
 * @returns An object containing `context` and `typeOfApplication` if the input string is valid; otherwise, `never`.
 *
 * @example
 * ```typescript
 * type Result = ExtractStateFromApplicationFlow<'intake-adult'>;
 * // Result is { context: 'intake'; typeOfApplication: 'adult' }
 * ```
 */
type ExtractStateFromApplicationFlow<S extends string> = S extends `${infer I}-${infer T}` //
  ? I extends ContextState
    ? T extends TypeOfApplicationState
      ? { context: I; typeOfApplication: T }
      : never
    : never
  : never;

/**
 * Validates the application flow based on the provided state and allowed flows.
 *
 * @template TAllowedFlows - A readonly array of allowed flow combinations in the format `${InputModelState}-${TypeOfApplicationState}`.
 *
 * @param state - The current protected application state to validate.
 * @param params - The route parameters used for redirection if validation fails.
 * @param allowedFlows - An array of allowed flow combinations.
 *
 * @throws {RedirectDocument} If the input model or flow is not defined, or if the combination is not allowed.
 *
 * @example
 * ```typescript
 * validateApplicationFlow(state, params, ['intake-adult', 'renewal-children']);
 * ```
 */
export function validateApplicationFlow<TAllowedFlows extends ReadonlyArray<`${ContextState}-${TypeOfApplicationState}`>>(
  state: ProtectedApplicationState,
  params: Params,
  allowedFlows: TAllowedFlows,
): asserts state is OmitStrict<ProtectedApplicationState, 'context' | 'typeOfApplication'> & ExtractStateFromApplicationFlow<TAllowedFlows[number]> {
  const log = createLogger('application-route-helpers.server/validateApplicationFlow');

  const context = state.context;
  const type = state.typeOfApplication;

  if (!type) {
    const redirectUrl = getInitialApplicationFlowUrl('entry', params);
    log.warn('Type is not defined in the state; redirecting to [%s], stateId: [%s]', redirectUrl, state.id);
    throw redirectDocument(redirectUrl);
  }

  const flowKey = `${context}-${type}` as const;
  if (!allowedFlows.includes(flowKey)) {
    const redirectUrl = getInitialApplicationFlowUrl(flowKey, params);
    log.warn('Flow [%s] is not allowed; allowedTypesAndFlows: [%s], redirecting to [%s], stateId: [%s]', flowKey, allowedFlows, redirectUrl, state.id);
    throw redirectDocument(redirectUrl);
  }

  if (context === 'renewal' && state.clientApplication === undefined) {
    const redirectUrl = getInitialApplicationFlowUrl('entry', params);
    log.warn("Context is 'renewal' but clientApplication is not defined in state; redirecting to [%s], stateId: [%s]", redirectUrl, state.id);
    throw redirectDocument(redirectUrl);
  }
}

export type ApplicationFlow = 'entry' | `${ContextState}-${TypeOfApplicationState}`;

/**
 * Determines the initial URL path based on the context and type of application.
 *
 * @param applicationFlow - Either 'entry' for initial entry point, or a combination of context
 *                      and type of application in the format `${ContextState}-${TypeOfApplicationState}`
 * @param params - Route parameters used to generate the path, typically containing an application ID
 * @returns The URL path string for the corresponding context and application type
 * @throws {Error} When an unknown applicationFlow value is provided
 */
export function getInitialApplicationFlowUrl(applicationFlow: ApplicationFlow, params: Params) {
  switch (applicationFlow) {
    case 'entry': {
      return getPathById('protected/application/$id/eligibility-requirements', params);
    }
    case 'intake-adult': {
      return getPathById('protected/application/$id/intake-adult/marital-status', params);
    }
    case 'intake-children': {
      return getPathById('protected/application/$id/intake-children/parent-or-guardian', params);
    }
    case 'intake-family': {
      return getPathById('protected/application/$id/intake-family/marital-status', params);
    }
    case 'intake-delegate': {
      return getPathById('protected/application/$id/application-delegate', params);
    }
    case 'renewal-adult': {
      return getPathById('protected/application/$id/renewal-adult/marital-status', params);
    }
    case 'renewal-children': {
      return getPathById('protected/application/$id/renewal-children/parent-or-guardian', params);
    }
    case 'renewal-family': {
      return getPathById('protected/application/$id/renewal-family/marital-status', params);
    }
    case 'renewal-delegate': {
      return getPathById('protected/application/$id/application-delegate', params);
    }
    default: {
      throw new Error(`Unknown applicationFlow value: [${applicationFlow}]`);
    }
  }
}

interface getSingleChildStateArgs {
  params: ApplicationStateParams & { childId: string };
  request: Request;
  session: Session;
}

/**
 * Loads single child state from protected application state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function getSingleChildState({ params, request, session }: getSingleChildStateArgs) {
  const log = createLogger('protected-application-route-helpers.server/ProtectedApplicationSingleChildState');
  const applicationState = getProtectedApplicationState({ params, session });
  const childId = params.childId;

  if (!isValidId(childId)) {
    log.warn('Invalid "childId" param format; childId: [%s]', childId);
    throw redirect(getPathById(`protected/application/$id/${applicationState.context}-${applicationState.typeOfApplication}/children/index`, params));
  }

  const childStateIndex = applicationState.children.findIndex(({ id }) => id === childId);

  if (childStateIndex === -1) {
    log.warn('Apply single child has not been found; childId: [%s]', childId);
    throw redirect(getPathById(`protected/application/$id/${applicationState.context}-${applicationState.typeOfApplication}/children/index`, params));
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

/**
 * Determines if the provided client ID corresponds to the primary applicant in the protected application state.
 *
 * @param state - The protected application state.
 * @param clientId - The ID of the client to check.
 * @returns `true` if the primary applicant is included in the renewal selection; otherwise, `false`.
 */
export function isPrimaryApplicant(state: ProtectedApplicationState, clientId: string): boolean {
  invariant(state.clientApplication, 'Expected clientApplication to be defined');
  return state.clientApplication.applicantInformation.clientId === clientId;
}

/**
 * Determines if the provided client ID corresponds to a child of the primary applicant in the protected application state.
 *
 * @param state - The protected application state.
 * @param clientId - The ID of the client to check.
 * @returns `true` if the client ID corresponds to a child of the primary applicant; otherwise, `false`.
 */
export function isPrimaryApplicantChild(state: ProtectedApplicationState, clientId: string): boolean {
  invariant(state.clientApplication, 'Expected clientApplication to be defined');
  return state.clientApplication.children.some((child) => child.information.clientId === clientId);
}

export function getTypeOfApplicationFromRenewalSelectionClientIds(state: ProtectedApplicationState, clientIds: string[]): TypeOfApplicationState {
  invariant(state.clientApplication, 'Expected clientApplication to be defined');
  const hasPrimaryApplicant = clientIds.some((id) => isPrimaryApplicant(state, id));
  const hasDependent = clientIds.some((id) => isPrimaryApplicantChild(state, id));
  if (hasPrimaryApplicant && hasDependent) return 'family';
  if (hasPrimaryApplicant) return 'adult';
  if (hasDependent) return 'children';
  return 'delegate';
}

// Helper function to get value from either state or client application
export function getDeclaredChangeValueOrClientValue<T>(declaredChange: { hasChanged: boolean; value?: T } | undefined, clientValue: T | undefined): T | undefined {
  if (declaredChange?.hasChanged === true) return declaredChange.value;
  if (declaredChange?.hasChanged === false) return clientValue;
  return undefined;
}

/**
 * Validates if the protected application state context matches the expected context. If the context
 * does not match, it redirects to the initial application flow URL.
 */
export function validateProtectedApplicationContext<TExpectedContext extends ProtectedApplicationState['context']>(
  state: ProtectedApplicationState,
  params: ApplicationStateParams,
  expectedContext: TExpectedContext,
): asserts state is Omit<ProtectedApplicationState, 'context'> & { context: TExpectedContext } {
  if (state.context !== expectedContext) {
    const redirectUrl = getInitialApplicationFlowUrl('entry', params);
    const log = createLogger('protected-application-route-helpers.server/validateProtectedApplicationContext');
    log.warn('Application context [%s] does not match expected context [%s]; redirecting to [%s], stateId: [%s]', state.context, expectedContext, redirectUrl, state.id);
    throw redirectDocument(redirectUrl);
  }
}

/**
 * Determines whether the marital status state should be skipped in the application flow based on the
 * application input model and client application data.
 *
 * @param state - The protected application state containing the application input model and client application data.
 * @returns A boolean value indicating whether to skip the marital status state (true) or not (false). The marital
 * status state should be skipped if the application context is 'renewal' and the client application has a copay tier
 * earning record; otherwise, it should not be skipped.
 */
export function shouldSkipMaritalStatus(state: PickDeep<ProtectedApplicationState, 'context' | 'clientApplication.copayTierEarningRecord'>): boolean {
  if (state.context !== 'renewal') return false;
  if (state.clientApplication === undefined) return false;
  return state.clientApplication.copayTierEarningRecord === true;
}

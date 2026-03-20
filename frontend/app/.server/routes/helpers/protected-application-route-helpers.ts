import { data, redirectDocument } from 'react-router';
import type { Params } from 'react-router';

import { UTCDate } from '@date-fns/utc';
import { invariant } from '@dts-stn/invariant';
import { differenceInMinutes } from 'date-fns';
import type { PickDeep, ReadonlyDeep } from 'type-fest';

import type {
  ClientApplicationRenewalEligibleDto,
  CountryLocalizedDto,
  FederalGovernmentInsurancePlanLocalizedDto,
  GCCommunicationMethodLocalizedDto,
  LanguageLocalizedDto,
  ProvinceTerritoryStateLocalizedDto,
  ProvincialGovernmentInsurancePlanLocalizedDto,
  SunLifeCommunicationMethodLocalizedDto,
} from '~/.server/domain/dtos';
import type {
  CountryService,
  FederalGovernmentInsurancePlanService,
  GCCommunicationMethodService,
  LanguageService,
  ProvinceTerritoryStateService,
  ProvincialGovernmentInsurancePlanService,
  SunLifeCommunicationMethodService,
} from '~/.server/domain/services';
import { createLogger } from '~/.server/logging';
import { getAgeCategoryFromAge, getAgeCategoryReferenceDate } from '~/.server/routes/helpers/base-application-route-helpers';
import type { DeclaredChange } from '~/.server/routes/helpers/declared-change-type';
import { getEnv } from '~/.server/utils/env.utils';
import { getLocaleFromParams } from '~/.server/utils/locale.utils';
import { getCdcpWebsiteApplyUrl } from '~/.server/utils/url.utils';
import type { Session } from '~/.server/web/session';
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
  clientApplication?: ClientApplicationRenewalEligibleDto;
  applicantClientIdsToRenew?: string[];
}>;

export type ApplicantInformationState = NonNullable<ProtectedApplicationState['applicantInformation']>;
type ApplicationYearState = ProtectedApplicationState['applicationYear'];
export type ChildrenState = ProtectedApplicationState['children'];
export type ChildState = ChildrenState[number];
export type ChildInformationState = NonNullable<ChildState['information']>;
export type ChildSinState = Pick<NonNullable<ChildState['information']>, 'hasSocialInsuranceNumber' | 'socialInsuranceNumber'>;
export type CommunicationPreferencesState = NonNullable<NonNullable<ProtectedApplicationState['communicationPreferences']>['value']>;
export type DentalFederalBenefitsState = Pick<NonNullable<NonNullable<ProtectedApplicationState['dentalBenefits']>['value']>, 'federalSocialProgram' | 'hasFederalBenefits'>;
export type DentalProvincialTerritorialBenefitsState = Pick<NonNullable<NonNullable<ProtectedApplicationState['dentalBenefits']>['value']>, 'hasProvincialTerritorialBenefits' | 'province' | 'provincialTerritorialSocialProgram'>;
export type PartnerInformationState = NonNullable<ProtectedApplicationState['partnerInformation']>;
export type ContextState = NonNullable<ProtectedApplicationState['context']>;
export type TypeOfApplicationState = NonNullable<ProtectedApplicationState['typeOfApplication']>;
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
  clientApplication?: ClientApplicationRenewalEligibleDto;

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

/**
 * Gets the age category based on the given date string and application context. The reference date for age calculation
 * is determined by the application context: 'intake' uses the current date, while 'renewal' uses the end date of the
 * current coverage period.
 *
 * @param date - The date of birth as a string.
 * @param context - The application context, either 'intake' or 'renewal'.
 * @returns The age category as a string.
 */
export function getContextualAgeCategoryFromDate(date: string, context: 'intake' | 'renewal') {
  const referenceDate = getAgeCategoryReferenceDate(context);
  const age = getAgeFromDateString(date, referenceDate);
  return getAgeCategoryFromAge(age);
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
  session: Session;
}

/**
 * Loads single child state from protected application state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function getSingleChildState({ params, session }: getSingleChildStateArgs) {
  const log = createLogger('protected-application-route-helpers.server/ProtectedApplicationSingleChildState');
  const applicationState = getProtectedApplicationState({ params, session });
  const childId = params.childId;
  const childStateIndex = applicationState.children.findIndex(({ id }) => id === childId);

  if (childStateIndex === -1) {
    log.warn('Protected application single child has not been found; stateId: [%s] childId: [%s]', applicationState.id, childId);
    throw data(null, { status: 404 });
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
 * status state should be skipped if the application context is 'renewal' and the client application has a simplified
 * input model; otherwise, it should not be skipped.
 */
export function shouldSkipMaritalStatus(state: PickDeep<ProtectedApplicationState, 'context' | 'clientApplication.inputModel'>): boolean {
  if (state.context !== 'renewal') return false;
  if (state.clientApplication === undefined) return false;
  return state.clientApplication.inputModel === 'simplified';
}

/**
 * Resolves the effective communication preferences value for a renewal application state.
 * If the user has declared a change, the updated values from the state are used;
 * otherwise, the values are sourced from the client application data.
 *
 * @param state - The renewal application state containing communication preferences and client application data.
 * @param locale - The locale used to retrieve localized values.
 * @param languageService - Service for resolving localized language details.
 * @param sunLifeCommunicationMethodService - Service for resolving localized Sun Life communication methods.
 * @param gcCommunicationMethodService - Service for resolving localized Government of Canada communication methods.
 * @returns The resolved preferred language, Sun Life communication method, and Government of Canada communication method.
 */
export function resolveRenewalStateCommunicationPreferencesValue(
  state: Required<PickDeep<ProtectedApplicationState, 'communicationPreferences' | 'clientApplication.communicationPreferences'>>,
  locale: AppLocale,
  languageService: LanguageService,
  sunLifeCommunicationMethodService: SunLifeCommunicationMethodService,
  gcCommunicationMethodService: GCCommunicationMethodService,
): {
  preferredLanguage: LanguageLocalizedDto;
  preferredMethodSunLife: SunLifeCommunicationMethodLocalizedDto;
  preferredMethodGovernmentOfCanada: GCCommunicationMethodLocalizedDto;
} {
  if (state.communicationPreferences.hasChanged) {
    return {
      preferredLanguage: languageService.getLocalizedLanguageById(state.communicationPreferences.value.preferredLanguage, locale),
      preferredMethodSunLife: sunLifeCommunicationMethodService.getLocalizedSunLifeCommunicationMethodById(state.communicationPreferences.value.preferredMethod, locale),
      preferredMethodGovernmentOfCanada: gcCommunicationMethodService.getLocalizedGCCommunicationMethodById(state.communicationPreferences.value.preferredNotificationMethod, locale),
    };
  }

  // If hash changed is false, client application communication preferences must be defined, as the value would have
  // been set on the state when the user made a change to the communication preferences step, which requires client
  // application communication preferences to be defined.
  invariant(state.clientApplication.communicationPreferences.preferredLanguage, 'Expected clientApplication.communicationPreferences.preferredLanguage to be defined when communicationPreferences.hasChanged is false');
  invariant(state.clientApplication.communicationPreferences.preferredMethodSunLife, 'Expected clientApplication.communicationPreferences.preferredMethodSunLife to be defined when communicationPreferences.hasChanged is false');
  invariant(state.clientApplication.communicationPreferences.preferredMethodGovernmentOfCanada, 'Expected clientApplication.communicationPreferences.preferredMethodGovernmentOfCanada to be defined when communicationPreferences.hasChanged is false');

  return {
    preferredLanguage: languageService.getLocalizedLanguageById(state.clientApplication.communicationPreferences.preferredLanguage, locale),
    preferredMethodSunLife: sunLifeCommunicationMethodService.getLocalizedSunLifeCommunicationMethodById(state.clientApplication.communicationPreferences.preferredMethodSunLife, locale),
    preferredMethodGovernmentOfCanada: gcCommunicationMethodService.getLocalizedGCCommunicationMethodById(state.clientApplication.communicationPreferences.preferredMethodGovernmentOfCanada, locale),
  };
}

/**
 * Resolves the effective phone number value for a renewal application state.
 * If the user has declared a change, the updated values from the state are used;
 * otherwise, the values are sourced from the client application data.
 *
 * @param state - The renewal application state containing phone number and client application contact information.
 * @returns The resolved primary phone number and optional alternate phone number.
 */
export function resolveRenewalStatePhoneNumberValue(state: Required<PickDeep<ProtectedApplicationState, 'phoneNumber' | 'clientApplication.contactInformation.phoneNumber' | 'clientApplication.contactInformation.phoneNumberAlt'>>): {
  primary: string;
  alternate?: string;
} {
  if (state.phoneNumber.hasChanged) {
    return {
      primary: state.phoneNumber.value.primary,
      alternate: state.phoneNumber.value.alternate,
    };
  }

  // If hash changed is false, client application phone number must be defined, as the value would have been set on the
  // state when the user made a change to the phone number step, which requires client application phone number to be
  // defined.
  invariant(state.clientApplication.contactInformation.phoneNumber, 'Expected clientApplication.contactInformation.phoneNumber to be defined when phoneNumber.hasChanged is false');

  return {
    primary: state.clientApplication.contactInformation.phoneNumber,
    alternate: state.clientApplication.contactInformation.phoneNumberAlt,
  };
}

/**
 * Resolves the effective mailing address value for a renewal application state.
 * If the user has declared a change, the updated values from the state are used;
 * otherwise, the values are sourced from the client application data.
 *
 * @param state - The renewal application state containing mailing address and client application contact information.
 * @param locale - The locale used to retrieve localized country and province/territory values.
 * @param countryService - Service for resolving localized country details.
 * @param provinceTerritoryStateService - Service for resolving localized province/territory/state details.
 * @returns The resolved mailing address including address, city, country, and optional postal code and province.
 */
export async function resolveRenewalStateMailingAddressValue(
  state: Required<
    PickDeep<
      ProtectedApplicationState,
      | 'mailingAddress'
      | 'clientApplication.contactInformation.mailingAddress'
      | 'clientApplication.contactInformation.mailingCity'
      | 'clientApplication.contactInformation.mailingCountry'
      | 'clientApplication.contactInformation.mailingPostalCode'
      | 'clientApplication.contactInformation.mailingProvince'
    >
  >,
  locale: AppLocale,
  countryService: CountryService,
  provinceTerritoryStateService: ProvinceTerritoryStateService,
): Promise<{
  address: string;
  city: string;
  country: CountryLocalizedDto;
  postalCode?: string;
  province?: ProvinceTerritoryStateLocalizedDto;
}> {
  if (state.mailingAddress.hasChanged) {
    return {
      address: state.mailingAddress.value.address,
      city: state.mailingAddress.value.city,
      country: await countryService.getLocalizedCountryById(state.mailingAddress.value.country, locale),
      postalCode: state.mailingAddress.value.postalCode,
      province: state.mailingAddress.value.province ? await provinceTerritoryStateService.getLocalizedProvinceTerritoryStateById(state.mailingAddress.value.province, locale) : undefined,
    };
  }

  return {
    address: state.clientApplication.contactInformation.mailingAddress,
    city: state.clientApplication.contactInformation.mailingCity,
    country: await countryService.getLocalizedCountryById(state.clientApplication.contactInformation.mailingCountry, locale),
    postalCode: state.clientApplication.contactInformation.mailingPostalCode,
    province: state.clientApplication.contactInformation.mailingProvince ? await provinceTerritoryStateService.getLocalizedProvinceTerritoryStateById(state.clientApplication.contactInformation.mailingProvince, locale) : undefined,
  };
}

/**
 * Resolves the effective home address value for a renewal application state.
 * If the user has declared a change, the updated values from the state are used;
 * otherwise, the values are sourced from the client application data.
 *
 * @param state - The renewal application state containing home address and client application contact information.
 * @param locale - The locale used to retrieve localized country and province/territory values.
 * @param countryService - Service for resolving localized country details.
 * @param provinceTerritoryStateService - Service for resolving localized province/territory/state details.
 * @returns The resolved home address including address, city, country, and optional postal code and province.
 */
export async function resolveRenewalStateHomeAddressValue(
  state: Required<
    PickDeep<
      ProtectedApplicationState,
      | 'homeAddress'
      | 'clientApplication.contactInformation.homeAddress'
      | 'clientApplication.contactInformation.homeCity'
      | 'clientApplication.contactInformation.homeCountry'
      | 'clientApplication.contactInformation.homePostalCode'
      | 'clientApplication.contactInformation.homeProvince'
    >
  >,
  locale: AppLocale,
  countryService: CountryService,
  provinceTerritoryStateService: ProvinceTerritoryStateService,
): Promise<{
  address: string;
  city: string;
  country: CountryLocalizedDto;
  postalCode?: string;
  province?: ProvinceTerritoryStateLocalizedDto;
}> {
  if (state.homeAddress.hasChanged) {
    return {
      address: state.homeAddress.value.address,
      city: state.homeAddress.value.city,
      country: await countryService.getLocalizedCountryById(state.homeAddress.value.country, locale),
      postalCode: state.homeAddress.value.postalCode,
      province: state.homeAddress.value.province ? await provinceTerritoryStateService.getLocalizedProvinceTerritoryStateById(state.homeAddress.value.province, locale) : undefined,
    };
  }

  // If hash changed is false, client application home address fields must be defined, as the value would have
  // been set on the state when the user made a change to the home address step, which requires client
  // application home address to be defined.
  invariant(state.clientApplication.contactInformation.homeAddress, 'Expected clientApplication.contactInformation.homeAddress to be defined when homeAddress.hasChanged is false');
  invariant(state.clientApplication.contactInformation.homeCity, 'Expected clientApplication.contactInformation.homeCity to be defined when homeAddress.hasChanged is false');
  invariant(state.clientApplication.contactInformation.homeCountry, 'Expected clientApplication.contactInformation.homeCountry to be defined when homeAddress.hasChanged is false');

  return {
    address: state.clientApplication.contactInformation.homeAddress,
    city: state.clientApplication.contactInformation.homeCity,
    country: await countryService.getLocalizedCountryById(state.clientApplication.contactInformation.homeCountry, locale),
    postalCode: state.clientApplication.contactInformation.homePostalCode,
    province: state.clientApplication.contactInformation.homeProvince ? await provinceTerritoryStateService.getLocalizedProvinceTerritoryStateById(state.clientApplication.contactInformation.homeProvince, locale) : undefined,
  };
}

/**
 * Resolves the effective email value for a renewal application state.
 * The state email (set by the user during the session) takes precedence over the
 * client application email on file.
 *
 * @param state - The renewal application state containing the optional email and client application contact information.
 * @returns The resolved email address, or `undefined` if neither is available.
 */
export function resolveRenewalStateEmailValue(state: Pick<ProtectedApplicationState, 'email'> & Required<PickDeep<ProtectedApplicationState, 'clientApplication.contactInformation.email'>>): string | undefined {
  return state.email ?? state.clientApplication.contactInformation.email;
}

/**
 * Resolves the effective dental benefits value for a renewal application state.
 * If the user has declared a change, the updated federal and provincial program selections from the state
 * are used; otherwise, the benefit IDs from the client application are matched against both federal
 * and provincial insurance plan services to determine the applicable plans.
 *
 * @param state - The renewal application state containing dental benefits and client application dental benefits.
 * @param locale - The locale used to retrieve localized insurance plan details.
 * @param federalGovernmentInsurancePlanService - Service for resolving localized federal government insurance plans.
 * @param provincialGovernmentInsurancePlanService - Service for resolving localized provincial government insurance plans.
 * @returns The resolved federal and provincial government insurance plans, each of which may be `undefined` if not applicable.
 */
export async function resolveRenewalStateDentalBenefitsValue(
  state: Required<Pick<ProtectedApplicationState, 'dentalBenefits'>> & Required<PickDeep<ProtectedApplicationState, 'clientApplication.dentalBenefits'>>,
  locale: AppLocale,
  federalGovernmentInsurancePlanService: FederalGovernmentInsurancePlanService,
  provincialGovernmentInsurancePlanService: ProvincialGovernmentInsurancePlanService,
): Promise<{
  federalGovernmentInsurancePlan?: FederalGovernmentInsurancePlanLocalizedDto;
  provincialGovernmentInsurancePlan?: ProvincialGovernmentInsurancePlanLocalizedDto;
}> {
  if (state.dentalBenefits.hasChanged) {
    return {
      federalGovernmentInsurancePlan: state.dentalBenefits.value.federalSocialProgram //
        ? await federalGovernmentInsurancePlanService.getLocalizedFederalGovernmentInsurancePlanById(state.dentalBenefits.value.federalSocialProgram, locale)
        : undefined,
      provincialGovernmentInsurancePlan: state.dentalBenefits.value.provincialTerritorialSocialProgram //
        ? await provincialGovernmentInsurancePlanService.getLocalizedProvincialGovernmentInsurancePlanById(state.dentalBenefits.value.provincialTerritorialSocialProgram, locale)
        : undefined,
    };
  }

  invariant(state.clientApplication.dentalBenefits, 'Expected clientApplication.dentalBenefits to be defined when hasChanged is false');

  let federalGovernmentInsurancePlan: FederalGovernmentInsurancePlanLocalizedDto | undefined;
  let provincialGovernmentInsurancePlan: ProvincialGovernmentInsurancePlanLocalizedDto | undefined;

  for (const benefitId of state.clientApplication.dentalBenefits) {
    const federalProgram = await federalGovernmentInsurancePlanService.findLocalizedFederalGovernmentInsurancePlanById(benefitId, locale);
    if (federalProgram.isSome()) {
      federalGovernmentInsurancePlan = federalProgram.unwrap();
      continue;
    }

    const provincialProgram = await provincialGovernmentInsurancePlanService.findLocalizedProvincialGovernmentInsurancePlanById(benefitId, locale);
    if (provincialProgram.isSome()) {
      provincialGovernmentInsurancePlan = provincialProgram.unwrap();
    }
  }

  return {
    federalGovernmentInsurancePlan,
    provincialGovernmentInsurancePlan,
  };
}

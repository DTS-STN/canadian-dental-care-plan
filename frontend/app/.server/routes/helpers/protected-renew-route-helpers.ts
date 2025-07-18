import { redirect } from 'react-router';

import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import type { ClientApplicationDto } from '~/.server/domain/dtos';
import { createLogger } from '~/.server/logging';
import { isRedirectResponse } from '~/.server/utils/response.utils';
import type { Session } from '~/.server/web/session';
import { getAgeFromDateString } from '~/utils/date-utils';
import { getPathById } from '~/utils/route-utils';

export type ProtectedRenewStateSessionKey = `protected-renew-flow-${string}`;

export interface ProtectedRenewState {
  readonly id: string;
  readonly editMode: boolean;
  readonly applicationYear: {
    renewalYearId: string;
    taxYear: string;
    coverageEndDate: string;
  };
  readonly clientApplication: ClientApplicationDto;
  readonly previouslyReviewed?: boolean;
  readonly taxFiling?: boolean;
  readonly dentalInsurance?: boolean;
  readonly dentalBenefits?: {
    hasFederalBenefits: boolean;
    federalSocialProgram?: string;
    hasProvincialTerritorialBenefits: boolean;
    provincialTerritorialSocialProgram?: string;
    province?: string;
  };
  readonly isSurveyCompleted?: boolean;
  readonly demographicSurvey?: {
    readonly indigenousStatus?: string;
    readonly firstNations?: string;
    readonly disabilityStatus?: string;
    readonly ethnicGroups?: string[];
    readonly anotherEthnicGroup?: string;
    readonly locationBornStatus?: string;
    readonly genderStatus?: string;
  };
  readonly maritalStatus?: string;
  readonly partnerInformation?: {
    confirm: boolean;
    yearOfBirth: string;
    socialInsuranceNumber: string;
  };
  readonly children: {
    readonly id: string;
    readonly isParentOrLegalGuardian?: boolean;
    readonly dentalInsurance?: boolean;
    readonly information?: {
      readonly firstName: string;
      readonly lastName: string;
      readonly dateOfBirth: string;
      readonly isParent: boolean;
      readonly clientNumber?: string;
      readonly socialInsuranceNumber: string;
    };
    readonly isSurveyCompleted?: boolean;
    readonly previouslyReviewed?: boolean;
    readonly demographicSurvey?: {
      readonly indigenousStatus?: string;
      readonly firstNations?: string;
      readonly disabilityStatus?: string;
      readonly ethnicGroups?: string[];
      readonly anotherEthnicGroup?: string;
      readonly locationBornStatus?: string;
      readonly genderStatus?: string;
    };
    readonly dentalBenefits?: {
      hasFederalBenefits: boolean;
      federalSocialProgram?: string;
      hasProvincialTerritorialBenefits: boolean;
      provincialTerritorialSocialProgram?: string;
      province?: string;
    };
  }[];
  readonly contactInformation?: {
    readonly phoneNumber?: string;
    readonly phoneNumberAlt?: string;
    readonly email?: string;
  };
  readonly preferredLanguage?: string;
  readonly communicationPreferences?: {
    readonly preferredMethod: string;
    readonly preferredNotificationMethod: string;
  };
  readonly verifyEmail?: {
    verificationCode: string;
    verificationAttempts: number;
  };
  readonly email?: string;
  readonly editModeEmail?: string;
  readonly editModeCommunicationPreferences?: {
    preferredMethod: string;
    preferredNotificationMethod: string;
  };
  readonly emailVerified?: boolean;
  readonly hasAddressChanged?: boolean;
  readonly isHomeAddressSameAsMailingAddress?: boolean;
  readonly mailingAddress?: {
    readonly address: string;
    readonly city: string;
    readonly country: string;
    readonly postalCode?: string;
    readonly province?: string;
  };
  readonly homeAddress?: {
    readonly address: string;
    readonly city: string;
    readonly country: string;
    readonly postalCode?: string;
    readonly province?: string;
  };
  readonly submissionInfo?: {
    /**
     * The UTC date and time when the application was submitted.
     * Format: ISO 8601 string (e.g., "YYYY-MM-DDTHH:mm:ss.sssZ")
     */
    submittedOn: string;
  };
}

export type ProtectedApplicationYearState = NonNullable<ProtectedRenewState['applicationYear']>;
export type ProtectedPartnerInformationState = NonNullable<ProtectedRenewState['partnerInformation']>;
export type ProtectedChildState = ProtectedRenewState['children'][number];
export type ProtectedHomeAddressState = NonNullable<ProtectedRenewState['homeAddress']>;
export type ProtectedMailingAddressState = NonNullable<ProtectedRenewState['mailingAddress']>;
export type ProtectedClientApplicationState = NonNullable<ProtectedRenewState['clientApplication']>;
export type ProtectedDentalFederalBenefitsState = Pick<NonNullable<ProtectedRenewState['dentalBenefits']>, 'federalSocialProgram' | 'hasFederalBenefits'>;
export type ProtectedDentalProvincialTerritorialBenefitsState = Pick<NonNullable<ProtectedRenewState['dentalBenefits']>, 'hasProvincialTerritorialBenefits' | 'province' | 'provincialTerritorialSocialProgram'>;
export type ProtectedContactInformationState = NonNullable<ProtectedRenewState['contactInformation']>;
export type ProtectedDemographicSurveyState = NonNullable<ProtectedRenewState['demographicSurvey']>;
export type ProtectedConmmunicationPreferenceState = NonNullable<ProtectedRenewState['communicationPreferences']>;

/**
 * Schema for validating UUID.
 */
const idSchema = z.string().uuid();

/**
 * Gets the protected renew flow session key.
 * @param id - The protected renew flow ID.
 * @returns The protected renew flow session key.
 */
function getSessionKey(id: string): ProtectedRenewStateSessionKey {
  return `protected-renew-flow-${idSchema.parse(id)}`;
}

export type ProtectedRenewStateParams = {
  id: string;
  lang: string;
};

interface LoadStateArgs {
  params: ProtectedRenewStateParams;
  request: Request;
  session: Session;
}

/**
 * Loads protected renew state.
 * @param args - The arguments.
 * @returns The loaded state.
 */
export function loadProtectedRenewState({ params, request, session }: LoadStateArgs): ProtectedRenewState {
  const log = createLogger('protected-renew-route-helpers.server/loadProtectedRenewState');
  const { pathname } = new URL(request.url);

  const parsedId = idSchema.safeParse(params.id);

  if (!parsedId.success) {
    log.warn('Invalid "id" query string format; redirecting to protected/renew; id: [%s], sessionId: [%s]', params.id, session.id);
    throw redirect(getPathById('protected/renew/index', params));
  }

  const sessionKey = getSessionKey(parsedId.data);

  if (!session.has(sessionKey)) {
    log.warn('Protected renew session state has not been found; redirecting to protected/renew; sessionKey: [%s], sessionId: [%s]', sessionKey, session.id);
    throw redirect(getPathById('protected/renew/index', params));
  }

  const state = session.get(sessionKey);

  // Redirect to the confirmation page if the application has been submitted and
  // the current route is not the confirmation page.
  const confirmationRouteUrl = getPathById('protected/renew/$id/confirmation', params);
  if (state.submissionInfo && !pathname.endsWith(confirmationRouteUrl)) {
    log.warn('Redirecting user to "%s" since the application has been submitted; sessionId: [%s], ', state.id, confirmationRouteUrl);
    throw redirect(confirmationRouteUrl);
  }

  return state;
}

interface SaveStateArgs {
  params: ProtectedRenewStateParams;
  request: Request;
  session: Session;
  state: Partial<OmitStrict<ProtectedRenewState, 'id'>>;
  remove?: keyof OmitStrict<ProtectedRenewState, 'id'>;
}

/**
 * Saves protected renew state.
 * @param args - The arguments.
 * @returns The new protected renew state.
 */
export function saveProtectedRenewState({ params, request, session, state }: SaveStateArgs) {
  const log = createLogger('protected-renew-route-helpers.server/saveProtectedRenewState');
  const currentState = loadProtectedRenewState({ params, request, session });

  const newState = {
    ...currentState,
    ...state,
  } satisfies ProtectedRenewState;

  const sessionKey = getSessionKey(currentState.id);
  session.set(sessionKey, newState);
  log.info('Renew session state saved; sessionKey: [%s], sessionId: [%s]', sessionKey, session.id);
  return newState;
}

interface ClearStateArgs {
  params: ProtectedRenewStateParams;
  request: Request;
  session: Session;
}

/**
 * Clears protected renew state.
 * @param args - The arguments.
 */
export function clearProtectedRenewState({ params, request, session }: ClearStateArgs) {
  const log = createLogger('protected-renew-route-helpers.server/clearProtectedRenewState');
  const state = loadProtectedRenewState({ params, request, session });
  const sessionKey = getSessionKey(state.id);
  session.unset(sessionKey);
  log.info('Renew session state cleared; sessionKey: [%s], sessionId: [%s]', sessionKey, session.id);
}

interface StartArgs {
  applicationYear: ProtectedApplicationYearState;
  clientApplication: ProtectedClientApplicationState;
  id: string;
  session: Session;
}

/**
 * Starts protected renew state.
 * @param args - The arguments.
 * @returns The initial protected renew state.
 */
export function startProtectedRenewState({ applicationYear, clientApplication, id, session }: StartArgs) {
  const log = createLogger('protected-renew-route-helpers.server/startProtectedRenewState');
  const parsedId = idSchema.parse(id);
  const sessionKey = getSessionKey(parsedId);

  const initialState: ProtectedRenewState = {
    id: parsedId,
    editMode: false,
    applicationYear,
    clientApplication,
    contactInformation: {
      phoneNumber: clientApplication.contactInformation.phoneNumber,
      phoneNumberAlt: clientApplication.contactInformation.phoneNumberAlt,
      email: clientApplication.isInvitationToApplyClient ? undefined : clientApplication.contactInformation.email,
    },
    children: clientApplication.children
      // filter out children who will be 18 or older at the start of the coverage period as they are ineligible for renewal
      .filter((child) => getAgeFromDateString(child.information.dateOfBirth, applicationYear.coverageEndDate) < 18) //
      .map((child) => {
        const childStateObj = {
          id: randomUUID(),
          information: child.information,
        };
        return childStateObj;
      }),
  };

  session.set(sessionKey, initialState);
  log.info('Protected renew session state started; sessionKey: [%s], sessionId: [%s]', sessionKey, session.id);
  return initialState;
}

export function renewStateHasPartner(maritalStatus?: string) {
  if (!maritalStatus) return false;
  return ['married', 'commonlaw'].includes(maritalStatus);
}

export function isNewChildState(child: ProtectedChildState) {
  return child.dentalInsurance === undefined;
}

export function getProtectedChildrenState<TState extends Pick<ProtectedRenewState, 'children'>>(state: TState, includesNewChildState: boolean = false) {
  // prettier-ignore
  return includesNewChildState
    ? state.children
    : state.children.filter((child) => isNewChildState(child) === false);
}

interface LoadProtectedRenewSingleChildStateArgs {
  params: ProtectedRenewStateParams & { childId: string };
  request: Request;
  session: Session;
}

/**
 * Loads single child state from renew state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function loadProtectedRenewSingleChildState({ params, request, session }: LoadProtectedRenewSingleChildStateArgs) {
  const log = createLogger('protected-renew-route-helpers.server/loadProtectedRenewSingleChildState');
  const protectedRenewState = loadProtectedRenewState({ params, request, session });

  const parsedChildId = z.string().uuid().safeParse(params.childId);

  if (!parsedChildId.success) {
    log.warn('Invalid "childId" param format; childId: [%s]', params.childId);
    throw redirect(getPathById('protected/renew/$id/member-selection', params));
  }

  const childId = parsedChildId.data;
  const childStateIndex = protectedRenewState.children.findIndex(({ id }) => id === childId);

  if (childStateIndex === -1) {
    log.warn('Protected renew single child has not been found; childId: [%s]', childId);
    throw redirect(getPathById('protected/renew/$id/member-selection', params));
  }

  const childState = protectedRenewState.children[childStateIndex];
  const isNew = isNewChildState(childState);
  const editMode = !isNew && protectedRenewState.editMode;

  return {
    ...childState,
    childNumber: childStateIndex + 1,
    editMode,
    isNew,
  };
}

interface LoadProtectedRenewStateForReviewArgs {
  params: ProtectedRenewStateParams;
  request: Request;
  session: Session;
  demographicSurveyEnabled: boolean;
}

/**
 * Loads the renewal state for the review page. It validates the state and throws a redirect if invalid.
 * If a redirect exception is thrown, state.editMode is set to false.
 * @param args - The arguments.
 * @returns The validated adult state.
 */
export function loadProtectedRenewStateForReview({ params, request, session, demographicSurveyEnabled }: LoadProtectedRenewStateForReviewArgs) {
  const state = loadProtectedRenewState({ params, request, session });

  try {
    return validateProtectedRenewStateForReview({ params, state, demographicSurveyEnabled });
  } catch (error) {
    if (isRedirectResponse(error)) {
      saveProtectedRenewState({ params, request, session, state: { editMode: false } });
    }
    throw error;
  }
}

export function isPrimaryApplicantStateComplete(state: ProtectedRenewState, demographicSurveyEnabled: boolean) {
  return !!state.previouslyReviewed && state.dentalInsurance !== undefined && (demographicSurveyEnabled ? state.demographicSurvey !== undefined : true);
}

export function isChildrenStateComplete(state: ProtectedRenewState, demographicSurveyEnabled: boolean) {
  return state.children.some((child) => !!child.previouslyReviewed && child.isParentOrLegalGuardian !== undefined && child.dentalInsurance !== undefined && (demographicSurveyEnabled ? child.demographicSurvey !== undefined : true));
}

interface ValidateProtectedRenewStateForReviewArgs {
  params: ProtectedRenewStateParams;
  state: ProtectedRenewState;
  demographicSurveyEnabled: boolean;
}

export function validateProtectedRenewStateForReview({ params, state, demographicSurveyEnabled }: ValidateProtectedRenewStateForReviewArgs) {
  const { applicationYear, maritalStatus, partnerInformation, mailingAddress, homeAddress, clientApplication, contactInformation, communicationPreferences, editMode, id, dentalBenefits, dentalInsurance, demographicSurvey, email, preferredLanguage } =
    state;

  const children = validateProtectedChildrenStateForReview(state.children, demographicSurveyEnabled);

  if (!isPrimaryApplicantStateComplete(state, demographicSurveyEnabled) && children.length === 0) {
    throw redirect(getPathById('protected/renew/$id/member-selection', params));
  }

  if (communicationPreferences === undefined) {
    throw redirect(getPathById('protected/renew/$id/communication-preference', params));
  }

  return {
    applicationYear,
    maritalStatus,
    partnerInformation,
    mailingAddress,
    homeAddress,
    clientApplication,
    contactInformation,
    communicationPreferences,
    editMode,
    id,
    dentalInsurance,
    children,
    dentalBenefits,
    demographicSurvey,
    email,
    preferredLanguage,
  };
}

export function validateProtectedChildrenStateForReview(childrenState: ProtectedChildState[], demographicSurveyEnabled: boolean) {
  return childrenState
    .filter((child) => (demographicSurveyEnabled ? child.demographicSurvey !== undefined : true) && child.dentalInsurance !== undefined && child.isParentOrLegalGuardian !== undefined)
    .map(({ id, dentalInsurance, demographicSurvey, information, dentalBenefits, isParentOrLegalGuardian }) => {
      return {
        id,
        isParentOrLegalGuardian,
        information,
        dentalBenefits,
        dentalInsurance,
        demographicSurvey,
      };
    });
}

export function isInvitationToApplyClient(clientApplication: ProtectedClientApplicationState) {
  return (
    clientApplication.isInvitationToApplyClient || clientApplication.applicantInformation.maritalStatus === undefined || (renewStateHasPartner(clientApplication.applicantInformation.maritalStatus) && clientApplication.partnerInformation === undefined)
  );
}

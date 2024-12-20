import type { Session } from '@remix-run/node';
import { redirect, redirectDocument } from '@remix-run/node';
import type { Params } from '@remix-run/react';
import { isRedirectResponse, isResponse } from '@remix-run/react/dist/data';

import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import type { ClientApplicationDto } from '~/.server/domain/dtos';
import { getEnv } from '~/.server/utils/env.utils';
import { getLocaleFromParams } from '~/.server/utils/locale.utils';
import { getLogger } from '~/.server/utils/logging.utils';
import { getCdcpWebsiteApplyUrl } from '~/.server/utils/url.utils';
import { getAgeFromDateString } from '~/utils/date-utils';
import { getPathById } from '~/utils/route-utils';

export interface ProtectedRenewState {
  readonly id: string;
  readonly editMode: boolean;
  readonly applicationYear: {
    id: string;
    taxYear: string;
    coverageStartDate: string;
  };
  readonly clientApplication: ClientApplicationDto;
  readonly externallyReviewed?: boolean;
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
    readonly externallyReviewed?: boolean;
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
    readonly shouldReceiveEmailCommunication?: boolean;
  };
  readonly communicationPreferences?: {
    readonly email?: string;
    readonly preferredLanguage: string;
    readonly preferredMethod: string;
  };
  readonly hasAddressChanged?: boolean;
  readonly isHomeAddressSameAsMailingAddress?: boolean;
  readonly mailingAddress?: {
    readonly address: string;
    readonly apartment?: string;
    readonly city: string;
    readonly country: string;
    readonly postalCode?: string;
    readonly province?: string;
  };
  readonly homeAddress?: {
    readonly address: string;
    readonly apartment?: string;
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
  return `protected-renew-flow-${idSchema.parse(id)}`;
}

export function getProtectedRenewStateIdFromUrl(url: string | URL) {
  const { searchParams } = new URL(url);
  return searchParams.get('id');
}

interface LoadStateArgs {
  params: Params;
  session: Session;
}

/**
 * Loads protected renew state.
 * @param args - The arguments.
 * @returns The loaded state.
 */
export function loadProtectedRenewState({ params, session }: LoadStateArgs) {
  const log = getLogger('protected-renew-route-helpers.server/loadProtectedRenewState');
  const locale = getLocaleFromParams(params);
  const cdcpWebsiteApplyUrl = getCdcpWebsiteApplyUrl(locale);

  const parsedId = idSchema.safeParse(params.id);

  if (!parsedId.success) {
    log.warn('Invalid "id" query string format; redirecting to [%s]; id: [%s], sessionId: [%s]', cdcpWebsiteApplyUrl, params.id, session.id);
    throw redirectDocument(cdcpWebsiteApplyUrl);
  }

  const sessionName = getSessionName(parsedId.data);

  if (!session.has(sessionName)) {
    log.warn('Protected renew session state has not been found; redirecting to [%s]; sessionName: [%s], sessionId: [%s]', cdcpWebsiteApplyUrl, sessionName, session.id);
    throw redirectDocument(cdcpWebsiteApplyUrl);
  }

  const state: ProtectedRenewState = session.get(sessionName);
  return state;
}

interface SaveStateArgs {
  params: Params;
  session: Session;
  state: Partial<OmitStrict<ProtectedRenewState, 'id'>>;
  remove?: keyof OmitStrict<ProtectedRenewState, 'id'>;
}

/**
 * Saves protected renew state.
 * @param args - The arguments.
 * @returns The new protected renew state.
 */
export function saveProtectedRenewState({ params, session, state }: SaveStateArgs) {
  const log = getLogger('protected-renew-route-helpers.server/saveProtectedRenewState');
  const currentState = loadProtectedRenewState({ params, session });

  const newState = {
    ...currentState,
    ...state,
  } satisfies ProtectedRenewState;

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
 * Clears protected renew state.
 * @param args - The arguments.
 */
export function clearProtectedRenewState({ params, session }: ClearStateArgs) {
  const log = getLogger('protected-renew-route-helpers.server/clearProtectedRenewState');
  const state = loadProtectedRenewState({ params, session });
  const sessionName = getSessionName(state.id);
  session.unset(sessionName);
  log.info('Renew session state cleared; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
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
  const log = getLogger('protected-renew-route-helpers.server/startProtectedRenewState');
  const parsedId = idSchema.parse(id);
  const sessionName = getSessionName(parsedId);

  const initialState: ProtectedRenewState = {
    id: parsedId,
    editMode: false,
    applicationYear,
    clientApplication,
    contactInformation: {
      phoneNumber: clientApplication.contactInformation.phoneNumber,
      phoneNumberAlt: clientApplication.contactInformation.phoneNumberAlt,
      email: clientApplication.contactInformation.email,
    },
    communicationPreferences: clientApplication.communicationPreferences,
    children: clientApplication.children
      // filter out children who will be 18 or older at the start of the coverage period as they are ineligible for renewal
      .filter((child) => getAgeFromDateString(child.information.dateOfBirth, applicationYear.coverageStartDate) < 18) //
      .map((child) => {
        const immutableChild = clientApplication.children.find((c) => c.information.socialInsuranceNumber === child.information.socialInsuranceNumber);
        const childStateObj = {
          id: randomUUID(),
          information: child.information,
          dentalInsurance: immutableChild?.dentalInsurance,
        };
        return childStateObj;
      }),
  };

  session.set(sessionName, initialState);
  log.info('Protected renew session state started; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
  return initialState;
}

export function renewStateHasPartner(maritalStatus: string) {
  const { MARITAL_STATUS_CODE_MARRIED, MARITAL_STATUS_CODE_COMMONLAW } = getEnv();
  return [MARITAL_STATUS_CODE_MARRIED, MARITAL_STATUS_CODE_COMMONLAW].includes(Number(maritalStatus));
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
  params: Params;
  session: Session;
}

/**
 * Loads single child state from renew state.
 * @param args - The arguments.
 * @returns The loaded child state.
 */
export function loadProtectedRenewSingleChildState({ params, session }: LoadProtectedRenewSingleChildStateArgs) {
  const log = getLogger('protected-renew-route-helpers.server/loadProtectedRenewSingleChildState');
  const protectedRenewState = loadProtectedRenewState({ params, session });

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
  params: Params;
  session: Session;
}

/**
 * Loads the renewal state for the review page. It validates the state and throws a redirect if invalid.
 * If a redirect exception is thrown, state.editMode is set to false.
 * @param args - The arguments.
 * @returns The validated adult state.
 */
export function loadProtectedRenewStateForReview({ params, session }: LoadProtectedRenewStateForReviewArgs) {
  const state = loadProtectedRenewState({ params, session });

  try {
    return validateProtectedRenewStateForReview({ params, state });
  } catch (err) {
    if (isResponse(err) && isRedirectResponse(err)) {
      saveProtectedRenewState({ params, session, state: { editMode: false } });
    }
    throw err;
  }
}

export function isPrimaryApplicantStateComplete(state: ProtectedRenewState) {
  return state.dentalInsurance !== undefined && state.demographicSurvey !== undefined;
}

export function isChildrenStateComplete(state: ProtectedRenewState) {
  return state.children.every((child) => child.isParentOrLegalGuardian !== undefined && child.dentalInsurance !== undefined && child.demographicSurvey !== undefined);
}

interface ValidateProtectedRenewStateForReviewArgs {
  params: Params;
  state: ProtectedRenewState;
}

export function validateProtectedRenewStateForReview({ params, state }: ValidateProtectedRenewStateForReviewArgs) {
  const { applicationYear, maritalStatus, partnerInformation, mailingAddress, homeAddress, clientApplication, contactInformation, communicationPreferences, editMode, id, dentalBenefits, dentalInsurance, demographicSurvey } = state;

  const children = validateProtectedChildrenStateForReview(state.children);

  if (!isPrimaryApplicantStateComplete(state)) {
    if (children.length === 0) {
      throw redirect(getPathById('protected/renew/$id/member-selection', params));
    }
    throw redirect(getPathById('protected/renew/$id/review-child-information', params));
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
  };
}

export function validateProtectedChildrenStateForReview(childrenState: ProtectedChildState[]) {
  return childrenState
    .filter((child) => child.demographicSurvey !== undefined && child.dentalInsurance !== undefined && child.isParentOrLegalGuardian !== undefined)
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

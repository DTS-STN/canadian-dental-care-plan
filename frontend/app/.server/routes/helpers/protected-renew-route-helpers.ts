import type { Session } from '@remix-run/node';
import { redirect, redirectDocument } from '@remix-run/node';
import type { Params } from '@remix-run/react';
import { isRedirectResponse, isResponse } from '@remix-run/react/dist/data';

import { z } from 'zod';

import { getEnv } from '~/.server/utils/env.utils';
import { getLocaleFromParams } from '~/.server/utils/locale.utils';
import { getLogger } from '~/.server/utils/logging.utils';
import { getCdcpWebsiteApplyUrl } from '~/.server/utils/url.utils';
import { getPathById } from '~/utils/route-utils';

export interface ProtectedRenewState {
  readonly id: string;
  readonly editMode: boolean;
  readonly taxFiling?: boolean;
  readonly termsAndConditions?: {
    readonly acknowledgeTerms: boolean;
    readonly acknowledgePrivacy: boolean;
    readonly shareData: boolean;
  };
  readonly dentalInsurance?: boolean;
  readonly isSurveyCompleted?: boolean;
  readonly demographicSurvey?: {
    readonly indigenousStatus?: string;
    readonly firstNations?: string[];
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
    readonly firstName?: string;
    readonly isSurveyCompleted?: boolean;
    readonly demographicSurvey?: {
      readonly indigenousStatus?: string;
      readonly firstNations?: string[];
      readonly disabilityStatus?: string;
      readonly ethnicGroups?: string[];
      readonly anotherEthnicGroup?: string;
      readonly locationBornStatus?: string;
      readonly genderStatus?: string;
    };
  }[];
  readonly contactInformation?: {
    isNewOrUpdatedPhoneNumber?: boolean;
    isNewOrUpdatedEmail?: boolean;
    phoneNumber?: string;
    phoneNumberAlt?: string;
    email?: string;
    shouldReceiveEmailCommunication?: boolean;
  };
  readonly preferredLanguage?: string;
  readonly hasAddressChanged?: boolean;
  readonly isHomeAddressSameAsMailingAddress?: boolean;
  readonly addressInformation?: {
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
  };
  // TODO Add remaining states
}

export type PartnerInformationState = NonNullable<ProtectedRenewState['partnerInformation']>;
export type ChildState = ProtectedRenewState['children'][number];
export type AddressInformationState = NonNullable<ProtectedRenewState['addressInformation']>;

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
  id: string;
  session: Session;
}

/**
 * Starts protected renew state.
 * @param args - The arguments.
 * @returns The initial protected renew state.
 */
export function startProtectedRenewState({ id, session }: StartArgs) {
  const log = getLogger('protected-renew-route-helpers.server/startProtectedRenewState');
  const parsedId = idSchema.parse(id);

  const initialState: ProtectedRenewState = {
    id: parsedId,
    editMode: false,
    children: [],
  };

  const sessionName = getSessionName(parsedId);
  session.set(sessionName, initialState);
  log.info('Protected renew session state started; sessionName: [%s], sessionId: [%s]', sessionName, session.id);
  return initialState;
}

export function renewStateHasPartner(maritalStatus: string) {
  const { MARITAL_STATUS_CODE_MARRIED, MARITAL_STATUS_CODE_COMMONLAW } = getEnv();
  return [MARITAL_STATUS_CODE_MARRIED, MARITAL_STATUS_CODE_COMMONLAW].includes(Number(maritalStatus));
}

export function isNewChildState(child: ChildState) {
  return child.dentalInsurance === undefined;
}

export function getChildrenState<TState extends Pick<ProtectedRenewState, 'children'>>(state: TState, includesNewChildState: boolean = false) {
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
  request: Request;
  session: Session;
}

/**
 * Loads the renewal state for the review page. It validates the state and throws a redirect if invalid.
 * If a redirect exception is thrown, state.editMode is set to false.
 * @param args - The arguments.
 * @returns The validated adult state.
 */
export function loadProtectedRenewStateForReview({ params, request, session }: LoadProtectedRenewStateForReviewArgs) {
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

interface ValidateProtectedRenewStateForReviewArgs {
  params: Params;
  state: ProtectedRenewState;
}

export function validateProtectedRenewStateForReview({ params, state }: ValidateProtectedRenewStateForReviewArgs) {
  const { hasAddressChanged, maritalStatus, partnerInformation, contactInformation, editMode, id, addressInformation, dentalInsurance, demographicSurvey } = state;

  if (maritalStatus === undefined) {
    throw redirect(getPathById('protected/renew/$id/marital-status', params));
  }

  if (hasAddressChanged === undefined) {
    throw redirect(getPathById('protected/renew/$id/confirm-address', params));
  }

  if (hasAddressChanged && addressInformation === undefined) {
    throw redirect(getPathById('protected/renew/$id/update-address', params));
  }

  if (contactInformation?.isNewOrUpdatedPhoneNumber === undefined) {
    throw redirect(getPathById('protected/renew/$id/confirm-phone', params));
  }

  if (contactInformation.isNewOrUpdatedEmail === undefined) {
    throw redirect(getPathById('protected/renew/$id/confirm-email', params));
  }

  if (dentalInsurance === undefined) {
    throw redirect(getPathById('protected/renew/$id/dental-insurance', params));
  }

  if (demographicSurvey === undefined) {
    throw redirect(getPathById('protected/renew/$id/demographic-survey', params));
  }

  // TODO: complete state validations when all screens are created

  const children = getChildrenState(state).length > 0 ? validateProtectedChildrenStateForReview({ childrenState: state.children, params }) : [];

  return {
    maritalStatus,
    editMode,
    id,
    contactInformation,
    dentalInsurance,
    addressInformation,
    partnerInformation,
    children,
    hasAddressChanged,
  };
}

interface ValidateProtectedChildrenStateForReviewArgs {
  childrenState: ChildState[];
  params: Params;
}

function validateProtectedChildrenStateForReview({ childrenState, params }: ValidateProtectedChildrenStateForReviewArgs) {
  const children = getChildrenState({ children: childrenState });

  if (children.length === 0) {
    throw redirect(getPathById('protected/renew/$id/member-selection', params));
  }

  return children.map(({ id, dentalInsurance, demographicSurvey }) => {
    const childId = id;

    if (dentalInsurance === undefined) {
      throw redirect(getPathById('protected/renew/$id/$childId/dental-insurance', { ...params, childId }));
    }

    if (demographicSurvey === undefined) {
      throw redirect(getPathById('protected/renew/$id/$childId/demographic-survey', { ...params, childId }));
    }

    // TODO: complete state validations when all screens are created

    return {
      id,
      dentalInsurance,
      demographicSurvey,
    };
  });
}

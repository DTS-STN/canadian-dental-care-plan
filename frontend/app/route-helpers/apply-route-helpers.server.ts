import { Session, redirect } from '@remix-run/node';
import { Params } from '@remix-run/react';

import { differenceInMinutes } from 'date-fns';
import { z } from 'zod';

import { ApplicantInformationState } from '~/routes/$lang+/_public+/apply+/$id+/adult-child/applicant-information';
import { ChildInformationState } from '~/routes/$lang+/_public+/apply+/$id+/adult-child/child-information';
import { CommunicationPreferencesState } from '~/routes/$lang+/_public+/apply+/$id+/adult-child/communication-preference';
import { DateOfBirthState } from '~/routes/$lang+/_public+/apply+/$id+/adult-child/date-of-birth';
import { DentalInsuranceState } from '~/routes/$lang+/_public+/apply+/$id+/adult-child/dental-insurance';
import { DisabilityTaxCreditState } from '~/routes/$lang+/_public+/apply+/$id+/adult-child/disability-tax-credit';
import { DentalBenefitsState } from '~/routes/$lang+/_public+/apply+/$id+/adult-child/federal-provincial-territorial-benefits';
import { LivingIndependentlyState } from '~/routes/$lang+/_public+/apply+/$id+/adult-child/living-independently';
import { PartnerInformationState } from '~/routes/$lang+/_public+/apply+/$id+/adult-child/partner-information';
import { PersonalInformationState } from '~/routes/$lang+/_public+/apply+/$id+/adult-child/personal-information';
import { TaxFilingState } from '~/routes/$lang+/_public+/apply+/$id+/adult-child/tax-filing';
import { SubmissionInfoState } from '~/routes/$lang+/_public+/apply+/$id+/adult/review-information';
import { TypeOfApplicationState } from '~/routes/$lang+/_public+/apply+/$id+/type-application';
import { getAgeFromDateString } from '~/utils/date-utils';
import { getLogger } from '~/utils/logging.server';
import { getPathById } from '~/utils/route-utils';

const log = getLogger('apply-route-helpers.server');

export interface ApplyState {
  readonly id: string;
  readonly editMode: boolean;
  readonly lastUpdatedOn: string;
  readonly childState?: unknown;
  readonly adultState?: unknown;
  readonly allChildrenUnder18?: boolean;
  readonly applicantInformation?: ApplicantInformationState;
  readonly children?: {
    readonly id: string;
    readonly dentalBenefits?: DentalBenefitsState;
    readonly dentalInsurance?: DentalInsuranceState;
    readonly information?: ChildInformationState;
  }[];
  readonly communicationPreferences?: CommunicationPreferencesState;
  readonly dateOfBirth?: DateOfBirthState;
  readonly dentalBenefits?: DentalBenefitsState;
  readonly dentalInsurance?: DentalInsuranceState;
  readonly disabilityTaxCredit?: DisabilityTaxCreditState;
  readonly livingIndependently?: LivingIndependentlyState;
  readonly partnerInformation?: PartnerInformationState;
  readonly personalInformation?: PersonalInformationState;
  readonly submissionInfo?: SubmissionInfoState;
  readonly taxFiling2023?: TaxFilingState;
  readonly typeOfApplication?: TypeOfApplicationState;
}

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
    log.warn('Invalid "id" param format; id: [%s]', params.id);
    throw redirect(getPathById('$lang+/_public+/apply+/index', params));
  }

  const sessionName = getSessionName(parsedId.data);

  if (!session.has(sessionName)) {
    log.warn('Apply session has not been found; sessionName: [%s]', sessionName);
    throw redirect(getPathById('$lang+/_public+/apply+/index', params));
  }

  const state: ApplyState = session.get(sessionName);

  // Checks if the elapsed time since the last update exceeds 15 minutes,
  // and performs necessary actions if it does.
  const lastUpdatedOn = new Date(state.lastUpdatedOn);
  const now = new Date();

  if (differenceInMinutes(now, lastUpdatedOn) >= 15) {
    session.unset(sessionName);
    log.warn('Apply session has expired; sessionName: [%s]', sessionName);
    throw redirect(getPathById('$lang+/_public+/apply+/index', params));
  }

  return state;
}

interface SaveStateArgs {
  params: Params;
  session: Session;
  state: Partial<Omit<ApplyState, 'id' | 'lastUpdatedOn'>>;
  remove?: keyof Omit<ApplyState, 'id' | 'lastUpdatedOn'>;
}

/**
 * Saves apply state.
 * @param args - The arguments.
 * @returns The new apply state.
 */
export function saveApplyState({ params, session, state, remove = undefined }: SaveStateArgs) {
  const currentState = loadApplyState({ params, session });

  const newState: ApplyState = {
    ...currentState,
    ...state,
    lastUpdatedOn: new Date().toISOString(),
  };

  if (remove && remove in newState) {
    delete newState[remove];
  }

  const sessionName = getSessionName(currentState.id);
  session.set(sessionName, newState);

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
    lastUpdatedOn: new Date().toISOString(),
  };

  const sessionName = getSessionName(parsedId);
  session.set(sessionName, initialState);

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
  if (age > 0 && age < 16) return 'children';
  throw new Error(`Invalid age [${age}]`);
}

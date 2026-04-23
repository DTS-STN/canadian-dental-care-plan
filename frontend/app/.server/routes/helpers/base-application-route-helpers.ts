// Shared state field types for Public/Protected ApplicationState
import type { PickDeep, ReadonlyDeep } from 'type-fest';

import type { ClientApplicationRenewalEligibleDto } from '~/.server/domain/dtos';
import type { DeclaredChange } from '~/.server/routes/helpers/declared-change-type';
import { getEnv } from '~/.server/utils/env.utils';
import type { EligibilityType } from '~/components/eligibility';
import { getAgeFromDateString } from '~/utils/date-utils';

/**
 * The context of the application, either 'intake' for new applications or 'renewal' for renewal applications.
 * Immutable and set at the start of the application process based on renewal period status.
 */
export type BaseApplicationContextState = 'intake' | 'renewal';

/**
 * The type of application being submitted.
 * Can be 'adult', 'children', 'family', or 'delegate'.
 */
export type BaseApplicationTypeOfApplicationState = 'adult' | 'children' | 'family' | 'delegate';

/**
 * Applicant's personal information for the application state.
 */
export type BaseApplicationApplicantInformationState = ReadonlyDeep<{
  memberId?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  socialInsuranceNumber: string;
}>;

/**
 * Application year information for the application state.
 */
export type BaseApplicationYearState = ReadonlyDeep<{
  applicationYearId: string;
  taxYear: string;
  dependentEligibilityEndDate: string;
}>;

/**
 * Child's personal information for the application state.
 */
export type BaseApplicationChildInformationState = ReadonlyDeep<{
  memberId?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  isParent: boolean;
  hasSocialInsuranceNumber: boolean;
  socialInsuranceNumber?: string;
}>;

/**
 * Dental benefits information for the application state.
 */
export type BaseApplicationDentalBenefitsState = ReadonlyDeep<{
  hasFederalBenefits: boolean;
  federalSocialProgram?: string;
  hasProvincialTerritorialBenefits: boolean;
  provincialTerritorialSocialProgram?: string;
  province?: string;
}>;

/**
 * Dental benefits state wrapped in DeclaredChange for tracking changes in the application state.
 */
export type BaseApplicationDentalBenefitsDeclaredChangeState = ReadonlyDeep<DeclaredChange<BaseApplicationDentalBenefitsState>>;

/**
 * Dental insurance information for the application state.
 */
export type BaseApplicationDentalInsuranceState = ReadonlyDeep<{
  hasDentalInsurance: boolean;
  dentalInsuranceEligibilityConfirmation?: boolean;
}>;

/**
 * Child state object for the application, including benefits and insurance.
 */
export type BaseApplicationChildState = ReadonlyDeep<{
  id: string;
  dentalBenefits?: BaseApplicationDentalBenefitsDeclaredChangeState;
  dentalInsurance?: BaseApplicationDentalInsuranceState;
  information?: BaseApplicationChildInformationState;
}>;

/**
 * Communication preferences for the application state.
 */
export type BaseApplicationCommunicationPreferencesState = ReadonlyDeep<{
  preferredLanguage: string;
  preferredMethod: string;
  preferredNotificationMethod: string;
}>;

/**
 * Communication preferences state wrapped in DeclaredChange for tracking changes in the application state.
 */
export type BaseApplicationCommunicationPreferencesDeclaredChangeState = ReadonlyDeep<DeclaredChange<BaseApplicationCommunicationPreferencesState>>;

/**
 * Address information for the application state.
 */
export type BaseApplicationAddressState = ReadonlyDeep<{
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  province?: string;
}>;

/**
 * Address state wrapped in DeclaredChange for tracking changes in the application state.
 */
export type BaseApplicationAddressDeclaredChangeState = ReadonlyDeep<DeclaredChange<BaseApplicationAddressState>>;

/**
 * Phone number information for the application state.
 */
export type BaseApplicationPhoneNumberState = ReadonlyDeep<{
  primary: string;
  alternate?: string;
}>;

/**
 * Phone number state wrapped in DeclaredChange for tracking changes in the application state.
 */
export type BaseApplicationPhoneNumberDeclaredChangeState = ReadonlyDeep<DeclaredChange<BaseApplicationPhoneNumberState>>;

/**
 * Partner's information for the application state.
 */
export type BaseApplicationPartnerInformationState = ReadonlyDeep<{
  consentToSharePersonalInformation: true;
  yearOfBirth: string;
  socialInsuranceNumber: string;
}>;

/**
 * New or returning member state for the application state.
 */
export type BaseApplicationNewOrReturningMemberState = ReadonlyDeep<{
  isNewOrReturningMember: boolean;
  memberId?: string;
}>;

/**
 * Terms and conditions acceptance for the application state.
 */
export type BaseApplicationTermsAndConditionsState = ReadonlyDeep<{
  acknowledgeTerms: boolean;
  acknowledgePrivacy: boolean;
  shareData: boolean;
}>;

/**
 * Submission info for the application state.
 */
export type BaseApplicationSubmissionInfoState = ReadonlyDeep<{
  confirmationCode: string;
  submittedOn: string; // ISO 8601
}>;

/**
 * Email verification state for the application.
 */
export type BaseApplicationVerifyEmailState = ReadonlyDeep<{
  verificationCode: string;
  verificationAttempts: number;
}>;

/**
 * Terms acceptance for submitting the application.
 */
export type BaseApplicationSubmitTermsState = ReadonlyDeep<{
  acknowledgeInfo: boolean;
  acknowledgeCriteria: boolean;
}>;

/**
 * Age categories based on the age of the individual.
 */
type AgeCategory = 'children' | 'youth' | 'adults' | 'seniors';

/**
 * Gets the age category based on the given date string and an optional reference date.
 *
 * @param date - The date string representing the individual's date of birth.
 * @param referenceDate - An optional reference date to calculate the age against.
 * @returns The age category.
 */
export function getAgeCategoryFromDateString(date: string, referenceDate?: string): AgeCategory {
  const age = getAgeFromDateString(date, referenceDate);
  return getAgeCategoryFromAge(age);
}

/**
 * Gets the age category based on the given age.
 *
 * @param age - The age of the individual.
 * @returns The age category.
 */
export function getAgeCategoryFromAge(age: number): AgeCategory {
  if (age >= 65) return 'seniors';
  if (age >= 18 && age < 65) return 'adults';
  if (age >= 16 && age < 18) return 'youth';
  if (age >= 0 && age < 16) return 'children';
  throw new Error(`Invalid age [${age}]`);
}

/**
 * Gets the reference date for calculating the age category based on the context (intake or renewal).
 * In the "intake" context, the reference date is today's date, as the age is calculated at the time of application submission.
 * In the "renewal" context, the reference date is the end of the current coverage year (June 30th).
 * If the current month is July or later, the coverage year ends on June 30th of the next year; otherwise, it ends on June 30th of the current year.
 *
 * @param context - The context for which to get the age category reference date ('intake' or 'renewal').
 * @returns The reference date as a string in YYYY-MM-DD format.
 */
export function getAgeCategoryReferenceDate(context: 'intake' | 'renewal'): string {
  const now = new Date();

  if (context === 'intake') {
    // "intake" context age reference date is today's date,
    // as the age is calculated at the time of application submission.
    return now.toISOString().split('T')[0];
  }

  // "renewal" context age reference date is the end of the current coverage year (June 30th)
  // If the current month is July or later, the coverage year ends on June 30th of the next year;
  // otherwise, it ends on June 30th of the current year.
  const coverageEndYear = now.getUTCFullYear() + (now.getUTCMonth() >= 6 ? 1 : 0);
  return `${coverageEndYear}-06-30`;
}

/**
 * Determines if the individual is categorized as a child or youth based on their date of birth and the context (intake
 * or renewal).
 *
 * @param dateOfBirth - The date of birth of the individual.
 * @param context - The context of the application ('intake' or 'renewal').
 * @returns A boolean indicating whether the individual is a child or youth.
 */
export function isChildOrYouth(dateOfBirth: string, context: 'intake' | 'renewal'): boolean {
  const referenceDate = getAgeCategoryReferenceDate(context);
  const ageCategory = getAgeCategoryFromDateString(dateOfBirth, referenceDate);
  return ageCategory === 'children' || ageCategory === 'youth';
}

interface GetEligibilityStatusArgs {
  /**
   * Indicates whether the applicant has private dental insurance.
   */
  hasPrivateDentalInsurance: boolean;

  /**
   * Indicates whether the applicant has private dental insurance on record.
   */
  privateDentalInsuranceOnRecord?: boolean;
}

/**
 * Determines the eligibility status based on private dental insurance and whether the applicant has private dental insurance on record.
 *
 * The eligibility status is determined as follows:
 * - 'eligible' if the applicant does not have private dental insurance and the private dental insurance on record is false or undefined.
 * - 'eligible-proof' if the applicant does not have private dental insurance but the private dental insurance on record is true,
 *   indicating that proof of eligibility may be required.
 * - 'ineligible' if the applicant has private dental insurance, regardless of the private dental insurance on record.
 *
 * @returns The eligibility status as 'eligible', 'eligible-proof', or 'ineligible'.
 */
export function getEligibilityStatus({ hasPrivateDentalInsurance, privateDentalInsuranceOnRecord }: GetEligibilityStatusArgs): EligibilityType {
  if (!hasPrivateDentalInsurance && !privateDentalInsuranceOnRecord) return 'eligible';
  if (!hasPrivateDentalInsurance && privateDentalInsuranceOnRecord) return 'eligible-proof';
  return 'ineligible';
}

/**
 * Validates whether a client number is valid for a child in the context of an application.
 *
 * In the "intake" context, this function always returns true as client number validation
 * is not required during initial application submission.
 *
 * In the "renewal" context, a client number is considered valid if it exists in both:
 * - The list of eligible client numbers (excluding the applicant's own client number)
 * - The list of client numbers associated with the applicant's children
 *
 * If either clientApplication or clientNumber is undefined in the renewal context,
 * the function returns true to allow for partial form completion.
 *
 * @param context - The application context ('intake' for new applications, 'renewal' for renewals)
 * @param clientApplication - Optional client application data containing applicant information,
 *                           eligible client numbers, and children's information
 * @param clientNumber - Optional client number to validate
 * @returns A boolean indicating whether the client number is valid:
 *          - Always true for intake context
 *          - True for renewal context if:
 *            - clientApplication or clientNumber is undefined
 *          - clientNumber exists in both the set of eligible non-applicant client numbers and children's client numbers
 *          - False for renewal context if clientNumber is not found in the valid set
 */
export function isChildClientNumberValid(context: 'intake' | 'renewal', clientApplication?: ClientApplicationRenewalEligibleDto, clientNumber?: string) {
  if (context === 'intake' || clientApplication === undefined || clientNumber === undefined) return true;
  const isChildrensClientNumberValid = clientApplication.children.some((child) => child.information.clientNumber === clientNumber);
  const isEligibleClientNumberValid = clientApplication.eligibleClientNumbers.includes(clientNumber) && clientNumber !== clientApplication.applicantInformation.clientNumber;
  return isChildrensClientNumberValid && isEligibleClientNumberValid;
}

/**
 * Determines the allowed types of applications based on the current state. The allowed types of applications can be
 * 'adult', 'children', or 'family', and they depend on the context (intake or renewal) and the eligibility of the
 * primary applicant and their children for renewal.
 *
 * @param state - The current state, which can be either 'intake' or 'renewal' with optional client application data.
 * @returns An array of allowed application types: 'adult', 'children', or 'family'.
 */
export function getAllowedTypeOfApplication({
  context,
  clientApplication,
}:
  | { context: 'intake'; clientApplication?: undefined } //
  | {
      context: 'renewal';
      clientApplication: PickDeep<
        ClientApplicationRenewalEligibleDto,
        | 'applicantInformation.clientNumber' //
        | `children.${number}.information.clientNumber`
        | 'eligibleClientNumbers'
      >;
    }): ReadonlyArray<'adult' | 'children' | 'family'> {
  if (context === 'intake') {
    return ['adult', 'children', 'family'];
  }

  // In the renewal context, the allowed types of applications depend on the eligibility of the primary applicant and
  // their children for renewal.
  const primaryApplicantEligibleForRenewal = clientApplication.eligibleClientNumbers.includes(clientApplication.applicantInformation.clientNumber);
  const anyChildEligibleForRenewal = clientApplication.children.some((child) => clientApplication.eligibleClientNumbers.includes(child.information.clientNumber));

  if (primaryApplicantEligibleForRenewal && anyChildEligibleForRenewal) {
    return ['adult', 'children', 'family'];
  }

  if (primaryApplicantEligibleForRenewal) {
    return ['adult'];
  }

  // If the primary applicant is not eligible for renewal but at least one child is eligible for renewal, we allow
  // 'children' applications to enable the user to submit an application on behalf of their eligible child(ren).
  return ['children'];
}

/**
 * Determines whether a marital status indicates that a person has a partner.
 *
 * @param maritalStatus - The marital status code to check. If undefined or empty, returns false.
 * @returns `true` if the marital status is either common law or married, `false` otherwise.
 */
export function maritalStatusHasPartner(maritalStatus?: string) {
  if (!maritalStatus) return false;
  const { MARITAL_STATUS_CODE_COMMON_LAW, MARITAL_STATUS_CODE_MARRIED } = getEnv();
  return [MARITAL_STATUS_CODE_COMMON_LAW, MARITAL_STATUS_CODE_MARRIED].includes(maritalStatus);
}

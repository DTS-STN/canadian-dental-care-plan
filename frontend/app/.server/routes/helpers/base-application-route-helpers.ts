import type { ClientApplicationRenewalEligibleDto } from '~/.server/domain/dtos';
import type { EligibilityType } from '~/components/eligibility';
import { getAgeFromDateString } from '~/utils/date-utils';

/**
 * Age categories based on the age of the individual.
 */
export type AgeCategory = 'children' | 'youth' | 'adults' | 'seniors';

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
   * Indicates the T4 dental indicator status.
   */
  t4DentalIndicator?: boolean;
}

/**
 * Determines the eligibility status based on private dental insurance and T4 dental indicator.
 *
 * The eligibility status is determined as follows:
 * - 'eligible' if the applicant does not have private dental insurance and the T4 dental indicator is false or undefined.
 * - 'eligible-proof' if the applicant does not have private dental insurance but the T4 dental indicator is true,
 *   indicating that proof of eligibility may be required.
 * - 'ineligible' if the applicant has private dental insurance, regardless of the T4 dental indicator.
 *
 * @returns The eligibility status as 'eligible', 'eligible-proof', or 'ineligible'.
 */
export function getEligibilityStatus({ hasPrivateDentalInsurance, t4DentalIndicator }: GetEligibilityStatusArgs): EligibilityType {
  if (!hasPrivateDentalInsurance && !t4DentalIndicator) return 'eligible';
  if (!hasPrivateDentalInsurance && t4DentalIndicator) return 'eligible-proof';
  return 'ineligible';
}

/**
 * Validates whether a client number is valid for a child in the context of an application.
 *
 * In the "intake" context, this function always returns true as client number validation
 * is not required during initial application submission.
 *
 * In the "renewal" context, a client number is considered valid if it exists in either:
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
 *            - clientNumber exists in the set of eligible non-applicant client numbers or children's client numbers
 *          - False for renewal context if clientNumber is not found in the valid set
 */
export function isChildClientNumberValid(context: 'intake' | 'renewal', clientApplication?: ClientApplicationRenewalEligibleDto, clientNumber?: string) {
  if (context === 'intake' || clientApplication === undefined || clientNumber === undefined) return true;
  return new Set(
    [
      ...clientApplication.eligibleClientNumbers, //
      ...clientApplication.children.map((child) => child.information.clientNumber),
    ].filter((val) => val !== clientApplication.applicantInformation.clientNumber),
  ).has(clientNumber);
}

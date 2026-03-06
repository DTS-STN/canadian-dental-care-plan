import type { ClientApplicationDto } from '~/.server/domain/dtos';
import { getEnv } from '~/.server/utils/env.utils';
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
 * Determines if a child is eligible to apply (intake) or renew (renewal) based on their date of birth and the context
 * of the application (intake or renewal). The eligibility is determined by calculating the age category of the child
 * using their date of birth and the appropriate reference date for the given context. A child is considered eligible
 * if they fall into the 'children' or 'youth' age categories.
 *
 * @param dateOfBirth - The date of birth of the child.
 * @param context - The context of the application ('intake' or 'renewal').
 * @returns A boolean indicating whether the child is eligible.
 */
export function isChildEligible(dateOfBirth: string, context: 'intake' | 'renewal'): boolean {
  const referenceDate = getAgeCategoryReferenceDate(context);
  const ageCategory = getAgeCategoryFromDateString(dateOfBirth, referenceDate);
  return ageCategory === 'children' || ageCategory === 'youth';
}

/**
 * Determines if a client application is eligible to renew based on its eligibility status code. If the eligibility
 * status code is missing or empty (i.e., falsy), the application is assumed to be eligible to renew.
 *
 * @param clientApplicationDto - The client application DTO.
 * @returns A boolean indicating whether the client application is eligible to renew.
 */
export function isEligibleToRenew(clientApplicationDto: Pick<ClientApplicationDto, 'eligibilityStatusCode'>): boolean {
  if (!clientApplicationDto.eligibilityStatusCode) {
    // If the eligibility status code is missing or empty (i.e., falsy), we assume the application is eligible to renew.
    return true;
  }

  // If the eligibility status code is defined, we check if it is equal to the eligible status code.
  const { ELIGIBILITY_STATUS_CODE_ELIGIBLE } = getEnv();
  return clientApplicationDto.eligibilityStatusCode === ELIGIBILITY_STATUS_CODE_ELIGIBLE;
}

import { useMemo } from 'react';

import { UTCDate } from '@date-fns/utc';
import { differenceInYears, isExists, isPast } from 'date-fns';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import { padWithZero } from './string-utils';

/**
 * Parses a date string in the format "YYYY-MM-DD" and returns an object with the parsed components.
 * @param date The date string to parse.
 * @returns An object containing the parsed components (year, month, day). Returns an empty object if parsing fails or if the date does not exist.
 */
export function extractDateParts(date: string) {
  const dateParts = date.split('-');

  if (dateParts.length !== 3) {
    return {};
  }

  const year = Number.parseInt(dateParts[0]);
  const month = Number.parseInt(dateParts[1]);
  const day = Number.parseInt(dateParts[2]);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return {};
  }

  if (!isExists(year, month - 1, day)) {
    return {};
  }

  return {
    year: padWithZero(year, 4),
    month: padWithZero(month, 2),
    day: padWithZero(day, 2),
  };
}

/**
 *
 * @param date string representing the date (ex. '2024-01-01')
 * @returns difference in full years from the current date and the input.  This operation rounds the year down for fractional time differences.
 */
export function getAgeFromDateString(date: string) {
  invariant(isValidDateString(date), `date is invalid [${date}]`);
  return getAgeFromDate(parseDateString(date));
}

/**
 *
 * @param dateTime string representing the datetime (ex. '2024-01-01T00:00:00Z')
 * @returns difference in full years from the current date and the input.  This operation rounds the year down for fractional time differences.
 */
export function getAgeFromDateTimeString(dateTime: string) {
  invariant(isValidDateTimeString(dateTime), `dateTime is invalid [${dateTime}]`);
  return getAgeFromDate(parseDateTimeString(dateTime));
}

/**
 *
 * @param utcDate UTC date object (ex. new UTCDate(2024,1,1))
 * @returns difference in full years from the current date and the input.  This operation rounds the year down for fractional time differences.
 */
export function getAgeFromDate(utcDate: UTCDate) {
  invariant(isPastDate(utcDate), `utcDate must be in past [${utcDate}]`);
  return differenceInYears(new UTCDate(), utcDate);
}

export function isPastDateString(date: string) {
  invariant(isValidDateString(date), `date is invalid [${date}]`);
  return isPastDate(parseDateString(date));
}

export function isPastDateTimeString(dateTime: string) {
  invariant(isValidDateTimeString(dateTime), `dateTime is invalid [${dateTime}]`);
  return isPastDate(parseDateTimeString(dateTime));
}

export function isPastDate(utcDate: UTCDate) {
  return isPast(utcDate);
}

/**
 * Validates whether a given string is in the format YYYY-MM-DD.
 *
 * This function uses `z.string().date()` from the Zod library to ensure the date string
 * conforms to the standard date format (YYYY-MM-DD).
 *
 * @param date - The date string to be validated.
 * @returns Returns `true` if the string is a valid date in the format YYYY-MM-DD, otherwise `false`.
 *
 * @example
 * ```javascript
 * const validDate = "2023-05-20";
 * const invalidDate = "20-05-2023";
 *
 * console.log(isValidDateString(validDate)); // true
 * console.log(isValidDateString(invalidDate)); // false
 * ```
 */
export function isValidDateString(date: string) {
  return z.string().date().safeParse(date).success;
}

/**
 * Validates whether a given string is a valid ISO 8601 date-time string.
 *
 * This function uses z.string().datetime() from the Zod library to ensure the date-time string
 * conforms to the ISO 8601 standard, which includes the date and time format without timezone offsets
 * and allows arbitrary sub-second decimal precision.
 *
 * @param dateTime - The date-time string to be validated.
 * @returns Returns true if the string is a valid ISO 8601 date-time, otherwise false.
 *
 * @example
 * ```javascript
 * const validDateTime = "2020-01-01T00:00:00Z";
 * const invalidDateTime = "2020-01-01 00:00:00";
 *
 * console.log(isValidDateTimeString(validDateTime)); // true
 * console.log(isValidDateTimeString(invalidDateTime)); // false
 * ```
 */
export function isValidDateTimeString(dateTime: string) {
  return z.string().datetime().safeParse(dateTime).success;
}

/**
 * Parses a date string in the format YYYY-MM-DD and returns a UTCDate object representing the date.
 *
 * This function first validates the input date string using the `isValidDateString` function.
 * If the date string is invalid, an error is thrown. Otherwise, it constructs a new UTCDate
 * object with the date string set to the start of the day in UTC (00:00:00.000Z).
 *
 * @param date - The date string to be parsed in the format YYYY-MM-DD.
 * @throws Will throw an error if the date string is invalid.
 * @returns A UTCDate object representing the parsed date.
 *
 * @example
 * ```javascript
 * const dateString = "2023-05-20";
 * const utcDate = parseDateString(dateString);
 * console.log(utcDate); // UTCDate object representing 2023-05-20T00:00:00.000Z
 *
 * // Example with invalid date
 * const invalidDateString = "20-05-2023";
 * try {
 *   parseDateString(invalidDateString);
 * } catch (error) {
 *   console.error(error.message); // "date is invalid [20-05-2023]"
 * }
 * ```
 */
export function parseDateString(date: string) {
  invariant(isValidDateString(date), `date is invalid [${date}]`);
  return new UTCDate(`${date}T00:00:00.000Z`);
}

/**
 * Parses a date-time string in the ISO 8601 format and returns a UTCDate object representing the date-time.
 *
 * This function first validates the input date-time string using the `isValidDateTimeString` function.
 * If the date-time string is invalid, an error is thrown. Otherwise, it constructs a new UTCDate
 * object with the given date-time string.
 *
 * @param dateTime - The date-time string to be parsed in the ISO 8601 format.
 * @throws Will throw an error if the date-time string is invalid.
 * @returns A UTCDate object representing the parsed date-time.
 *
 * @example
 * ```javascript
 * const dateTimeString = "2023-05-20T15:30:00.000Z";
 * const utcDateTime = parseDateTimeString(dateTimeString);
 * console.log(utcDateTime); // UTCDate object representing 2023-05-20T15:30:00.000Z
 *
 * // Example with invalid date-time
 * const invalidDateTimeString = "20-05-2023 15:30:00";
 * try {
 *   parseDateTimeString(invalidDateTimeString);
 * } catch (error) {
 *   console.error(error.message); // "dateTime is invalid [20-05-2023 15:30:00]"
 * }
 * ```
 */
export function parseDateTimeString(dateTime: string) {
  invariant(isValidDateTimeString(dateTime), `dateTime is invalid [${dateTime}]`);
  return new UTCDate(dateTime);
}

export function toLocaleDateString(date: UTCDate, locale: string) {
  invariant(/^(en|fr)$/i.test(locale), `Canadian locale is invalid [${locale}]`);
  return date.toLocaleDateString(`${locale}-CA`, { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Custom hook to retrieve an array of months based on the provided locale and format.
 * @param locale - The locale to use for formatting the months.
 * @param format - The format for displaying the months.
 * @returns An array containing objects with month index and formatted month text.
 */
export function useMonths(locale: string, format: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow' | undefined = 'long') {
  return useMemo(() => {
    const formatter = new Intl.DateTimeFormat(`${locale}-CA`, { month: format, timeZone: 'UTC' });
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((monthIndex) => {
      const mm = monthIndex < 10 ? `0${monthIndex}` : monthIndex;
      const date = new UTCDate(`2017-${mm}-01T00:00:00Z`);
      return {
        index: monthIndex,
        text: formatter.format(date),
      };
    });
  }, [format, locale]);
}

/**
 * Custom function that returns the current date formatted ex.: 2020-12-30.
 * @returns the current date as a string.
 */
export function getCurrentDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

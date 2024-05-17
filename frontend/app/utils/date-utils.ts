import { useMemo } from 'react';

import { differenceInYears, isExists, isPast, isValid, parse } from 'date-fns';
import invariant from 'tiny-invariant';

import { padWithZero } from './string-utils';

/**
 * Parses a date string in the format "YYYY-MM-DD" and returns an object with the parsed components.
 * @param dateString The date string to parse.
 * @param validate Validate or not if the given date exists. (default: true)
 * @returns An object containing the parsed components (year, month, day). Returns an empty object if parsing fails or if the date does not exist.
 */
export function parseDateString(dateString: string, validate: boolean = true): { year?: string; month?: string; day?: string } {
  const dateParts = dateString.split('-');

  if (dateParts.length !== 3) {
    return {};
  }

  const year = Number.parseInt(dateParts[0]);
  const month = Number.parseInt(dateParts[1]);
  const day = Number.parseInt(dateParts[2]);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return {};
  }

  if (validate && !isExists(year, month - 1, day)) {
    return {};
  }

  return {
    year: padWithZero(year, 4),
    month: padWithZero(month, 2),
    day: padWithZero(day, 2),
  };
}

/**
 * Checks if a string is a validad date. Else returns false.
 * @param dateString The date string to parse.
 * @param pattern Format to check against.
 * @param delimitter What to splice the dateString by.
 * @returns Returns a boolean.
 */
export function isValidDate(dateString: string, pattern: string, delimitter: string): boolean {
  const dateParts = dateString.split(delimitter);

  if (dateParts.length !== 3) {
    return false;
  }

  const { day, month, year } = parseDateValue(dateParts, pattern);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return false;
  }

  if (!isExists(year, month - 1, day)) {
    return false;
  }

  try {
    parse(dateString, pattern, new Date());
    return true;
  } catch {
    return false;
  }
}

/**
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
      const date = new Date(`2017-${mm}-01T00:00:00+00:00`);
      return {
        index: monthIndex,
        text: formatter.format(date),
      };
    });
  }, [format, locale]);
}

// TODO: add unit tests
export function toLocaleDateString(date: Date, locale: string) {
  return date.toLocaleDateString(`${locale}-CA`, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function getAgeFromDateString(date: string) {
  const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
  invariant(isValid(parsedDate), `date is invalid [${date}]`);
  invariant(isPast(parsedDate), `date must be in past [${date}]`);
  return differenceInYears(new Date(), parsedDate);
}

/**
 * Checks if a string is a validad date. Else returns false.
 * @param dateParts String[3] with the corresponding date components
 * @param pattern Format to check against.
 * @returns An object containing the parsed components (year, month, day). Returns { day: -1, month: -1, year: -1 } if the date does not exist or is invalid.
 */
function parseDateValue(dateParts: string[], pattern: string): { day: number; month: number; year: number } {
  // Have to add the '+' because that is how TS isNaN works apparently
  if (dateParts.filter((element) => isNaN(+element)).length > 0) {
    return { day: -1, month: -1, year: -1 };
  }

  // TODO: TO FILL OUT OTHER DATE FORMATS
  if (pattern == 'yyyy/mm/dd' || pattern == 'yyyy-mm-dd' || pattern == 'yyyymmdd') {
    return { day: Number.parseInt(dateParts[2]), month: Number.parseInt(dateParts[1]), year: Number.parseInt(dateParts[0]) };
  } else if (pattern == 'dd/mm/yyyy' || pattern == 'dd-mm-yyyy' || pattern == 'ddmmyyyy') {
    return { day: Number.parseInt(dateParts[0]), month: Number.parseInt(dateParts[1]), year: Number.parseInt(dateParts[2]) };
  } else if (pattern == 'mm/dd/yyyy' || pattern == 'mm-dd-yyyy' || pattern == 'mmddyyyy') {
    return { day: Number.parseInt(dateParts[1]), month: Number.parseInt(dateParts[0]), year: Number.parseInt(dateParts[2]) };
  } else {
    return { day: -1, month: -1, year: -1 };
  }
}

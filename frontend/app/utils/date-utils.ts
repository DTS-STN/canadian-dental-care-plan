/**
 *
 * @param dateObj an object that represents the month, day, and year of a person's birthday
 * @returns a boolean indicating whether the date is valid
 */
export function isValidDateOfBirth(dateObj: { month: number; day: number; year: number }): boolean {
  const { month, day, year } = dateObj;

  if (year < 1900 || year > new Date().getFullYear()) return false;
  if (month < 0 || month > 11) return false;
  if (day < 1 || day > 31) return false;

  if (month === 1) {
    // check for leap years
    if (year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0)) {
      return day <= 29;
    }
    return day <= 28;
  }
  return day <= ([3, 5, 8, 10].includes(month) ? 30 : 31);
}

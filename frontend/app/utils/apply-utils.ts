/**
 *
 * @param firstDate - the first date to compute difference
 * @param secondDate - the second date to compute difference
 * @returns the differenece in years between two dates
 *
 * DOB utility function to compute the differenece in years between two dates
 *
 */
export function yearsBetween(firstDate: Date, secondDate: Date): number {
  const diffYear = firstDate.getFullYear() - secondDate.getFullYear();
  const diffMonth = firstDate.getMonth() - secondDate.getMonth();
  const diffDay = firstDate.getDate() - secondDate.getDate();
  return diffYear > 0 ? (diffMonth >= 0 && diffDay >= 0 ? diffYear : diffYear - 1) : diffMonth <= 0 && diffDay <= 0 ? Math.abs(diffYear) : Math.abs(diffYear) - 1;
}

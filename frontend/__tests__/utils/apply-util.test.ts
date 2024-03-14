import { describe, expect, it } from 'vitest';

import { yearsBetween } from '~/utils/apply-utils';

describe('yearsBetween', () => {
  it('yearsBetween correctly calculates years difference for future date', () => {
    const firstDate = new Date(2020, 1, 1); // February 1st, 2020
    const secondDate = new Date(2023, 3, 3); // April 3rd, 2023
    const years = yearsBetween(firstDate, secondDate);
    expect(years).toBe(3);
  });

  it('yearsBetween correctly calculates years difference for past date (same month, same day)', () => {
    const firstDate = new Date(2024, 2, 7); // Today's date (assuming test runs on March 7th, 2024)
    const secondDate = new Date(2023, 2, 7); // March 7th, 2023
    const years = yearsBetween(firstDate, secondDate);
    expect(years).toBe(1);
  });

  it('yearsBetween correctly calculates years difference for past date (different month)', () => {
    const firstDate = new Date(2024, 2, 7); // Today's date (assuming test runs on March 7th, 2024)
    const secondDate = new Date(2023, 11, 7); // December 7th, 2023
    const years = yearsBetween(firstDate, secondDate);
    expect(years).toBe(0);
  });

  it('yearsBetween considers days for year difference on same month next year', () => {
    const firstDate = new Date(2023, 11, 30); // November 30th, 2023
    const secondDate = new Date(2024, 11, 29); // November 29th, 2024
    const years = yearsBetween(firstDate, secondDate);
    expect(years).toBe(0);
  });

  it('yearsBetween considers days for year difference on same month previous year', () => {
    const firstDate = new Date(2024, 2, 29); // February 29th, 2024 (leap year)
    const secondDate = new Date(2023, 2, 28); // February 28th, 2023
    const years = yearsBetween(firstDate, secondDate);
    expect(years).toBe(1);
  });
});

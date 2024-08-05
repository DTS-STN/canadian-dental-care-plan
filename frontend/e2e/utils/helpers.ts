import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

interface FillOutAddressArgs {
  address: string;
  city: string;
  country: string;
  group: string;
  page: Page;
  postalCode: string;
  province: string;
  unit: string;
}

// Reusable function to fill out address
export async function fillOutAddress({ address, city, country, group, page, postalCode, province, unit }: FillOutAddressArgs) {
  const groupLocator = page.getByRole('group', { name: group });
  await expect(groupLocator).toBeVisible();
  await groupLocator.getByRole('textbox', { name: 'Address', exact: true }).fill(address);
  await groupLocator.getByRole('textbox', { name: 'Apartment, suite, etc. (optional)', exact: true }).fill(unit);
  await groupLocator.getByRole('combobox', { name: 'Country', exact: true }).selectOption(country);
  await groupLocator.getByRole('combobox', { name: 'Province, territory, state, or region', exact: true }).selectOption(province);
  await groupLocator.getByRole('textbox', { name: 'City or town', exact: true }).fill(city);
  await groupLocator.getByRole('textbox', { name: 'Postal code or ZIP code', exact: true }).fill(postalCode);
}

// Calculate date based on the given age
export function calculateDOB(age: number, date: Date = new Date()): { year: string; month: string; day: string } {
  const year = date.getFullYear() - age;
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return { year: year.toString(), month, day };
}

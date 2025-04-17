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
}

// Reusable function to fill out address
export async function fillOutAddress({ address, city, country, page, postalCode, province, group }: FillOutAddressArgs) {
  const groupLocator = page.locator(group);
  await expect(groupLocator).toBeVisible();
  await groupLocator.getByRole('textbox', { name: 'Address', exact: true }).fill(address);
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

export async function acceptLegalCheckboxes(page: Page) {
  const checkboxes = ['I have read the Terms and Conditions', 'I have read the Privacy Notice Statement', 'I consent to the sharing of data'];

  for (const label of checkboxes) {
    const checkbox = page.getByRole('checkbox', { name: label });
    await expect(checkbox).toBeVisible();
    await checkbox.check();
  }
}

export async function clickContinue(page: Page) {
  const continueButton = page.getByRole('button', { name: 'Continue' });
  await expect(continueButton).toBeEnabled();
  await continueButton.click();
}

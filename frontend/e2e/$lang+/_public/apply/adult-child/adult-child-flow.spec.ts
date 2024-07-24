import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

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

// Reusable funtion to check empty input
async function hasError(page: Page, error: string) {
  await expect(page.getByRole('link', { name: error })).toBeVisible();
}

// Reusable function to fill out date of birth
async function fillOutDOB(page: Page, year: string, month: string, day: string) {
  await page.getByRole('combobox', { name: 'Month' }).selectOption(month);
  await page.getByRole('textbox', { name: 'Day (DD)' }).fill(day);
  await page.getByRole('textbox', { name: 'Year (YYYY)' }).fill(year);
}

// Reusable function to fill out address
async function fillOutAddress({ address, city, country, group, page, postalCode, province, unit }: FillOutAddressArgs) {
  const groupLocator = page.getByRole('group', { name: group });
  await expect(groupLocator).toBeVisible();
  await groupLocator.getByRole('textbox', { name: 'Address', exact: true }).fill(address);
  await groupLocator.getByRole('textbox', { name: 'Apartment, suite, etc. (optional)', exact: true }).fill(unit);
  await groupLocator.getByRole('combobox', { name: 'Country', exact: true }).selectOption(country);
  await groupLocator.getByRole('combobox', { name: 'Province, territory, state, or region', exact: true }).selectOption(province);
  await groupLocator.getByRole('textbox', { name: 'City or town', exact: true }).fill(city);
  await groupLocator.getByRole('textbox', { name: 'Postal code or ZIP code', exact: true }).fill(postalCode);
}

// Reusable function for Type of application step
async function typeOfApplication(page: Page) {
  await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/type-application/);
  await expect(page.getByRole('heading', { level: 1, name: 'Type of application' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();

  //check for empty fields
  await hasError(page, 'Select who this application is for');

  await page.getByRole('radio', { name: 'I am applying for myself and my child(ren)', exact: true }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
}

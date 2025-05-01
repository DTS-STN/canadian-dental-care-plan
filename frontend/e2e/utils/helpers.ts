import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

interface FillOutAddressArgs {
  address: string;
  city: string;
  country: string;
  page: Page;
  postalCode: string;
  province: string;
}

interface fillApplicantInformationFormArgs {
  firstName: string;
  lastName: string;
  sin: string;
  day: string;
  month: string;
  year: string;
  dtcEligible?: boolean;
  page: Page;
}

interface fillChildrenInformationFormArgs {
  firstName: string;
  lastName: string;
  sin?: string;
  day: string;
  month: string;
  year: string;
  hasSin: boolean;
  isGuardian: boolean;
  page: Page;
}

// Reusable function to fill out address
export async function fillOutAddress({ address, city, country, page, postalCode, province }: FillOutAddressArgs) {
  await page.getByRole('textbox', { name: 'Address', exact: true }).fill(address);
  await page.getByRole('combobox', { name: 'Country', exact: true }).selectOption(country);
  await page.getByRole('combobox', { name: 'Province, territory, state, or region', exact: true }).selectOption(province);
  await page.getByRole('textbox', { name: 'City or town', exact: true }).fill(city);
  await page.getByRole('textbox', { name: 'Postal code or ZIP code', exact: true }).fill(postalCode);
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

export async function fillApplicantInformationForm({ firstName, lastName, sin, day, month, year, dtcEligible, page }: fillApplicantInformationFormArgs) {
  await page.getByRole('textbox', { name: 'First name' }).fill(firstName);
  await page.getByRole('textbox', { name: 'Last name' }).fill(lastName);
  await page.getByRole('textbox', { name: 'Social Insurance Number (SIN)' }).fill(sin);
  await page.getByRole('combobox', { name: 'Month' }).selectOption(month);
  await page.getByRole('textbox', { name: 'Day (DD)' }).fill(day);
  await page.getByRole('textbox', { name: 'Year (YYYY)' }).fill(year);
  if (dtcEligible !== undefined) {
    await page.getByRole('radio', { name: dtcEligible ? 'Yes' : 'No', exact: true }).check();
  }
}

export async function fillChildrenInformationForm({ firstName, lastName, sin, day, month, year, hasSin, isGuardian, page }: fillChildrenInformationFormArgs) {
  await page.getByRole('textbox', { name: 'First name' }).fill(firstName);
  await page.getByRole('textbox', { name: 'Last name' }).fill(lastName);
  await page.getByRole('combobox', { name: 'Month' }).selectOption(month);
  await page.getByRole('textbox', { name: 'Day (DD)' }).fill(day);
  await page.getByRole('textbox', { name: 'Year (YYYY)' }).fill(year);
  if (hasSin && sin) {
    await page.getByRole('radio', { name: "Yes, enter the child's 9-digit SIN", exact: true }).check();
    await page.getByRole('textbox', { name: 'Enter the 9-digit SIN' }).fill(sin);
  } else {
    await page.getByRole('radio', { name: 'No, this child does not have a SIN', exact: true }).check();
  }
  if (isGuardian) {
    await page.getByRole('radio', { name: 'Yes', exact: true }).check();
  } else {
    await page.getByRole('radio', { name: 'No', exact: true }).check();
  }
}

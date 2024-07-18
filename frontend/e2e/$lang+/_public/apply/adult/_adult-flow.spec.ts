import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// Reusable funtion to check empty input
async function hasError(page: Page, error: string) {
  await expect(page.getByRole('link', { name: error })).toBeVisible();
}

// Reusable function to fill out date of birth
async function fillOutDOB(page: Page, year: string) {
  await page.getByRole('combobox', { name: 'Month' }).selectOption('01');
  await page.getByRole('textbox', { name: 'Day (DD)' }).fill('1');
  await page.getByRole('textbox', { name: 'Year (YYYY)' }).fill(year);
}

// Reusable function to fill out address
async function fillOutAddress(page: Page, group: string, address: string, unit: string, country: string, province: string, city: string, postalCode: string) {
  await page.getByRole('group', { name: group }).getByRole('textbox', { name: 'Address', exact: true }).fill(address);
  await page.getByRole('group', { name: group }).getByRole('textbox', { name: 'Apartment, suite, etc. (optional)', exact: true }).fill(unit);
  await page.getByRole('group', { name: group }).getByRole('combobox', { name: 'Country', exact: true }).selectOption(country);
  await page.getByRole('group', { name: group }).getByRole('combobox', { name: 'Province, territory, state, or region', exact: true }).selectOption(province);
  await page.getByRole('group', { name: group }).getByRole('textbox', { name: 'City or town', exact: true }).fill(city);

  //invalid postal code
  await page.getByRole('group', { name: group }).getByRole('textbox', { name: 'Postal code or ZIP code', exact: true }).fill('12345678');
  await page.getByRole('button', { name: 'Continue' }).click();
  if (group === 'Mailing address') {
    await hasError(page, 'Enter mailing address postal code in the correct format, such as A1A 1A1');
  }
  if (group === 'Home address') {
    await hasError(page, 'Enter home address postal code in the correct format, such as A1A 1A1');
  }

  await page.getByRole('group', { name: group }).getByRole('textbox', { name: 'Postal code or ZIP code', exact: true }).fill(postalCode);
}

test.describe('Adult flow', () => {
  test.beforeEach('Navigate to online application', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/en/apply');
    await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/terms-and-conditions/);
    await expect(page.getByRole('heading', { level: 1, name: 'Terms and conditions' })).toBeVisible();
    await page.getByRole('button', { name: 'Agree and continue' }).click();
  });

  test('should complete application as adult applicant', async ({ page }) => {
    await test.step('Type of application page', async () => {
      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/type-application/);
      await expect(page.getByRole('heading', { level: 1, name: 'Type of application' })).toBeVisible();
      await page.getByRole('button', { name: 'Continue' }).click();

      //check for empty fields
      await hasError(page, 'Select who this application is for');

      await page.getByRole('radio', { name: 'I am applying for myself', exact: true }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Tax filing page', async () => {
      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult\/tax-filing/);
      await expect(page.getByRole('heading', { level: 1, name: 'Tax filing' })).toBeVisible();
      await page.getByRole('button', { name: 'Continue' }).click();

      //check for empty fields
      await hasError(page, 'Select whether or not you have filed your taxes');

      await page.getByRole('radio', { name: 'No', exact: true }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('File taxes page', async () => {
      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult\/file-taxes/);
      await expect(page.getByRole('heading', { level: 1, name: 'File your taxes' })).toBeVisible();
      await page.getByRole('link', { name: 'Back' }).click();
      await page.getByRole('radio', { name: 'Yes', exact: true }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Date of birth page', async () => {
      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult\/date-of-birth/);
      await expect(page.getByRole('heading', { level: 1, name: 'Date of birth' })).toBeVisible();
      await page.getByRole('button', { name: 'Continue' }).click();

      //check for empty fields
      await hasError(page, 'Date of birth must include a year');
      await hasError(page, 'Date of birth must include a month');
      await hasError(page, 'Date of birth must include a day');

      await fillOutDOB(page, '1990');
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Disability tax credit page', async () => {
      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult\/disability-tax-credit/);
      await expect(page.getByRole('heading', { level: 1, name: 'Disability tax credit' })).toBeVisible();
      await page.getByRole('button', { name: 'Continue' }).click();

      //check for empty fields
      await hasError(page, 'Select whether or not you have a valid disability tax credit');

      await page.getByRole('radio', { name: 'No' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Find out when you can apply page', async () => {
      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult\/dob-eligibility/);
      await expect(page.getByRole('heading', { level: 1, name: 'Find out when you can apply' })).toBeVisible();
      await page.getByRole('link', { name: 'Back' }).click();
      await page.getByRole('radio', { name: 'Yes' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Applicant information page', async () => {
      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult\/applicant-information/);
      await expect(page.getByRole('heading', { level: 1, name: 'Applicant information' })).toBeVisible();
      await page.getByRole('button', { name: 'Continue' }).click();

      //check for empty fields
      await hasError(page, 'Enter first name');
      await hasError(page, 'Enter last name');
      await hasError(page, 'Enter 9-digit SIN, for example 123 456 789');
      await hasError(page, 'Select marital status');

      await page.getByRole('textbox', { name: 'First name' }).fill('John');
      await page.getByRole('textbox', { name: 'Last name' }).fill('Smith');
      await page.getByRole('textbox', { name: 'Social Insurance Number (SIN)' }).fill('900000001');
      await page.getByRole('radio', { name: 'Married' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Partner information page', async () => {
      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult\/partner-information/);
      await expect(page.getByRole('heading', { level: 1, name: 'Spouse or common-law partner information' })).toBeVisible();
      await page.getByRole('button', { name: 'Continue' }).click();

      //check for empty fields
      await hasError(page, 'Enter first name');
      await hasError(page, 'Enter last name');
      await hasError(page, 'Date of birth must include a year');
      await hasError(page, 'Date of birth must include a month');
      await hasError(page, 'Date of birth must include a day');
      await hasError(page, 'Enter 9-digit SIN, for example 123 456 789');
      await hasError(page, 'Checkbox must be selected');

      await page.getByRole('textbox', { name: 'First name' }).fill('John');
      await page.getByRole('textbox', { name: 'Last name' }).fill('Smith');
      await fillOutDOB(page, '1995');

      //check if sin is unique
      await page.getByRole('textbox', { name: 'Social Insurance Number (SIN)' }).fill('900000001');
      await page.getByRole('button', { name: 'Continue' }).click();
      await hasError(page, 'The Social Insurance Number (SIN) must be unique');

      await page.getByRole('textbox', { name: 'Social Insurance Number (SIN)' }).fill('800000002');
      await page.getByRole('checkbox', { name: 'I confirm that my spouse or common-law partner is aware and has agreed to share their personal information.' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Contact information page', async () => {
      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult\/contact-information/);
      await expect(page.getByRole('heading', { level: 1, name: 'Contact information' })).toBeVisible();
      await page.getByRole('button', { name: 'Continue' }).click();

      //check for empty fields
      await hasError(page, 'Enter mailing address, typically number and street');
      await hasError(page, 'Select a country for your mailing address your mailing address');
      await hasError(page, 'Enter a city or town for your mailing address');
      await hasError(page, 'Enter home address, typically number and street');
      await hasError(page, 'Select a country for your home address');
      await hasError(page, 'Enter a city or town for your home address');

      //invalid phone number
      await page.getByRole('group', { name: 'Phone number' }).getByRole('textbox', { name: 'Phone number (optional)', exact: true }).fill('111');
      await page.getByRole('button', { name: 'Continue' }).click();
      await hasError(page, "Phone number does not exist. If it's an international phone number, add '+' in front");

      await page.getByRole('group', { name: 'Phone number' }).getByRole('textbox', { name: 'Phone number (optional)', exact: true }).fill('2345678901');
      await page.getByRole('group', { name: 'Phone number' }).getByRole('textbox', { name: 'Alternate phone number (optional)', exact: true }).fill('2345678902');

      //invalid email
      await page.getByRole('group', { name: 'Email' }).getByRole('textbox', { name: 'Email address (optional)', exact: true }).fill('123mail');
      await page.getByRole('button', { name: 'Continue' }).click();
      await hasError(page, 'Enter an email address in the correct format, such as name@example.com');

      //email does not match
      await page.getByRole('group', { name: 'Email' }).getByRole('textbox', { name: 'Email address (optional)', exact: true }).fill('123@mail.com');
      await page.getByRole('group', { name: 'Email' }).getByRole('textbox', { name: 'Confirm email address (optional)', exact: true }).fill('124@mail.com');
      await page.getByRole('button', { name: 'Continue' }).click();
      await hasError(page, 'The email addresses entered do not match');

      await page.getByRole('group', { name: 'Email' }).getByRole('textbox', { name: 'Confirm email address (optional)', exact: true }).fill('123@mail.com');

      //fillout mailing address
      await fillOutAddress(page, 'Mailing address', '123 street', '404', 'Canada', 'Ontario', 'Ottawa', 'H0H0H0');

      //fillout home address
      await fillOutAddress(page, 'Home address', '555 street', '', 'Canada', 'Quebec', 'Montreal', 'K1K1K1');

      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Communication preference page', async () => {
      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult\/communication-preference/);
      await expect(page.getByRole('heading', { level: 1, name: 'Communication' })).toBeVisible();
      await page.getByRole('button', { name: 'Continue' }).click();

      //check for empty fields
      await hasError(page, 'Select preferred language of communication');
      await hasError(page, 'Select preferred method of communication');

      await page.getByRole('group', { name: 'What is your preferred official language of communication?' }).getByRole('radio', { name: 'English' }).check();
      await page.getByRole('group', { name: 'What is your preferred method of communication for Sun Life?' }).getByRole('radio', { name: 'Email' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Dental insurance page', async () => {
      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult\/dental-insurance/);
      await expect(page.getByRole('heading', { level: 1, name: 'Access to other dental insurance' })).toBeVisible();
      await page.getByRole('button', { name: 'Continue' }).click();

      //check for empty fields
      await hasError(page, 'Select whether you have access to dental insurance');

      await page.getByRole('radio', { name: 'Yes, I have access to dental insurance or coverage', exact: true }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Access to other dental benefits page', async () => {
      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult\/federal-provincial-territorial-benefits/);
      await expect(page.getByRole('heading', { level: 1, name: 'Access to other federal, provincial or territorial dental benefits' })).toBeVisible();
      await page.getByRole('button', { name: 'Continue' }).click();

      //check for empty fields
      await hasError(page, 'Select whether you have federal dental benefits');
      await hasError(page, 'Select whether you have provincial or territorial dental benefits');

      await page.getByRole('group', { name: 'Federal benefits' }).getByRole('radio', { name: 'Yes, I have federal dental benefits' }).check();
      await page.getByRole('group', { name: 'Provincial or territorial benefits' }).getByRole('radio', { name: 'Yes, I have provincial or territorial dental benefits' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      // check for empty fields
      await hasError(page, 'Select which federal program you are covered under');
      await hasError(page, 'Select a province or territory');

      await page.getByRole('group', { name: 'Federal benefits' }).getByRole('radio', { name: 'Correctional Service Canada Health Services' }).check();
      await page.getByRole('group', { name: 'Provincial or territorial benefits' }).getByRole('combobox', { name: 'If yes, through which province or territory?' }).selectOption('Alberta');
      await page.getByRole('button', { name: 'Continue' }).click();

      await hasError(page, 'Select which provincial or territorial program you are covered under');
      await page.getByRole('group', { name: 'Provincial or territorial benefits' }).getByRole('radio', { name: 'Alberta Adult Health Benefits' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult\/review-information/);
    await expect(page.getByRole('heading', { level: 1, name: 'Review your information' })).toBeVisible();
    await page.getByRole('button', { name: 'Submit Application' }).click();
    await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult\/confirmation/);
    await expect(page.getByRole('heading', { level: 1, name: 'Application successfully submitted' })).toBeVisible();
  });

  test('should complete application as youth applicant', () => {
    //TODO write test for youth flow
  });

  test('should complete application as senior applicant', () => {
    //TODO write test for senior flow
  });
});

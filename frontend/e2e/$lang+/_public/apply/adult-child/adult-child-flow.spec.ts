import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

import { PlaywrightApplyAdultChildPage } from '../../../../models/PlaywrightApplyAdultChildPage';
import { PlaywrightApplyPage } from '../../../../models/PlaywrightApplyPage';

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

// Calculate date based on the given age
function calculateDOB(age: number, date: Date = new Date()): { year: string; month: string; day: string } {
  const year = date.getFullYear() - age;
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return { year: year.toString(), month, day };
}

// Reusable function to fill out date of birth
async function fillOutDOB(page: Page, year: string, month: string, day: string, childUnder18: string) {
  // applicant date of birth
  await page.getByRole('combobox', { name: 'Month' }).selectOption(month);
  await page.getByRole('textbox', { name: 'Day (DD)' }).fill(day);
  await page.getByRole('textbox', { name: 'Year (YYYY)' }).fill(year);

  // child age
  await page.getByRole('group', { name: 'Are all the children you are applying for under 18?' }).getByRole('radio', { name: childUnder18 }).check();
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
  const applyPage = new PlaywrightApplyPage(page);
  await applyPage.isLoaded('type-application');
  await page.getByRole('button', { name: 'Continue' }).click();

  //check for empty fields
  await hasError(page, 'Select who this application is for');

  await page.getByRole('radio', { name: 'I am applying for myself and my child(ren)', exact: true }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
}

// Reusable function for Tax filing step
async function taxFiling(page: Page) {
  const applyAdultChildPage = new PlaywrightApplyAdultChildPage(page);
  await applyAdultChildPage.isLoaded('tax-filing');
  await page.getByRole('button', { name: 'Continue' }).click();

  //check for empty fields
  await hasError(page, 'Select whether or not you have filed your taxes');

  await page.getByRole('radio', { name: 'No', exact: true }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
}

// Reusable function for File your taxes step
async function fileTaxes(page: Page) {
  const applyAdultChildPage = new PlaywrightApplyAdultChildPage(page);
  await applyAdultChildPage.isLoaded('file-taxes');
  await page.getByRole('link', { name: 'Back' }).click();

  await applyAdultChildPage.isLoaded('tax-filing');
  await page.getByRole('radio', { name: 'Yes', exact: true }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
}

// Reusable function for applicant information step
async function applicantInformation(page: Page) {
  const applyAdultChildPage = new PlaywrightApplyAdultChildPage(page);
  await applyAdultChildPage.isLoaded('applicant-information');
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
}

// Reusable function for partner information step
async function partnerInformation(page: Page) {
  const applyAdultChildPage = new PlaywrightApplyAdultChildPage(page);
  await applyAdultChildPage.isLoaded('partner-information');
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

  await page.getByRole('combobox', { name: 'Month' }).selectOption('01');
  await page.getByRole('textbox', { name: 'Day (DD)' }).fill('01');
  await page.getByRole('textbox', { name: 'Year (YYYY)' }).fill('1960');

  //check if sin is unique
  await page.getByRole('textbox', { name: 'Social Insurance Number (SIN)' }).fill('900000001');
  await page.getByRole('button', { name: 'Continue' }).click();
  await hasError(page, 'The Social Insurance Number (SIN) must be unique');

  await page.getByRole('textbox', { name: 'Social Insurance Number (SIN)' }).fill('800000002');
  await page.getByRole('checkbox', { name: 'I confirm that my spouse or common-law partner is aware and has agreed to share their personal information.' }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
}

// Reusable function for contact information step
async function contactInformation(page: Page) {
  const applyAdultChildPage = new PlaywrightApplyAdultChildPage(page);
  await applyAdultChildPage.isLoaded('contact-information');
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
  await fillOutAddress({ page, group: 'Mailing address', address: '123 street', unit: '404', country: 'Canada', province: 'Ontario', city: 'Ottawa', postalCode: 'H0H0H0' });

  //fillout home address
  await fillOutAddress({ page, group: 'Home address', address: '555 street', unit: '', country: 'Canada', province: 'Quebec', city: 'Montreal', postalCode: 'K1K1K1' });

  await page.getByRole('button', { name: 'Continue' }).click();
}

// Reusable function for communication preference step
async function communicationPreference(page: Page) {
  const applyAdultChildPage = new PlaywrightApplyAdultChildPage(page);
  await applyAdultChildPage.isLoaded('communication-preference');
  await page.getByRole('button', { name: 'Continue' }).click();

  //check for empty fields
  await hasError(page, 'Select preferred language of communication');
  await hasError(page, 'Select preferred method of communication');

  await page.getByRole('group', { name: 'What is your preferred official language of communication?' }).getByRole('radio', { name: 'English' }).check();
  await page.getByRole('group', { name: 'What is your preferred method of communication for Sun Life?' }).getByRole('radio', { name: 'Email' }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
}

// Reusable function for dental insurance step
async function dentalInsurance(page: Page) {
  const applyAdultChildPage = new PlaywrightApplyAdultChildPage(page);
  await applyAdultChildPage.isLoaded('dental-insurance');
  await page.getByRole('button', { name: 'Continue' }).click();

  //check for empty fields
  await hasError(page, 'Select whether you have access to dental insurance');

  await page.getByRole('radio', { name: 'Yes, I have access to dental insurance or coverage', exact: true }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
}

// Reusable function for other dental benefits step
async function otherDentalBenefits(page: Page) {
  const applyAdultChildPage = new PlaywrightApplyAdultChildPage(page);
  await applyAdultChildPage.isLoaded('federal-provincial-territorial-benefits');
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
}

test.describe('Family flow', () => {
  test.beforeEach('Navigate to online application', async ({ page }) => {
    test.setTimeout(60000);
    const applyPage = new PlaywrightApplyPage(page);
    await applyPage.gotoIndexPage();

    await applyPage.isLoaded('terms-and-conditions');
    await page.getByRole('button', { name: 'Agree and continue' }).click();
  });

  test('Should complete adult and child application', async ({ page }) => {
    const applyAdultChildPage = new PlaywrightApplyAdultChildPage(page);

    await test.step('Should navigate to type of application page', async () => {
      await typeOfApplication(page);
    });

    await test.step('Should navigate to tax filing page', async () => {
      await taxFiling(page);
    });

    await test.step('Shoud navigate to file your taxes page', async () => {
      await fileTaxes(page);
    });

    // Applicant age is 65 or older, child is under 18
    await test.step('Should navigate to date of birth page', async () => {
      await applyAdultChildPage.isLoaded('date-of-birth');
      await page.getByRole('button', { name: 'Continue' }).click();

      // check empty fields
      await hasError(page, 'Date of birth must include a year');
      await hasError(page, 'Date of birth must include a month');
      await hasError(page, 'Date of birth must include a day');
      await hasError(page, 'Select whether or not all the children are under 18');

      const { year, month, day } = calculateDOB(65);
      await fillOutDOB(page, year, month, day, 'Yes');
      await page.getByRole('button', { name: 'Continue' }).click();
      await applyAdultChildPage.isLoaded('applicant-information');
    });

    await test.step('Should navigate to DTC page if applicant age is 18-64', async () => {
      await applyAdultChildPage.isLoaded('applicant-information');
      await page.getByRole('link', { name: 'Back' }).click();

      await applyAdultChildPage.isLoaded('date-of-birth');

      const { year, month, day } = calculateDOB(35);
      await fillOutDOB(page, year, month, day, 'Yes');
      await page.getByRole('button', { name: 'Continue' }).click();

      await applyAdultChildPage.isLoaded('disability-tax-credit');
    });

    await test.step('Should navigate to apply for your children page if applicant has no DTC, child is under 18', async () => {
      await applyAdultChildPage.isLoaded('disability-tax-credit');
      await page.getByRole('button', { name: 'Continue' }).click();

      //check for empty fields
      await hasError(page, 'Select whether or not you have a valid disability tax credit');

      await page.getByRole('radio', { name: 'No' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      await applyAdultChildPage.isLoaded('apply-children');
    });

    await test.step('Should navigate to dob eligibility page if applicant is 18-64, has no DTC, child is not under 18', async () => {
      await applyAdultChildPage.isLoaded('apply-children');
      await page.getByRole('link', { name: 'Back' }).click();

      await applyAdultChildPage.isLoaded('disability-tax-credit');
      await page.getByRole('link', { name: 'Back' }).click();

      // Back to date of birth
      await applyAdultChildPage.isLoaded('date-of-birth');
      const { year, month, day } = calculateDOB(40);
      await fillOutDOB(page, year, month, day, 'No');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Back to DTC
      await applyAdultChildPage.isLoaded('disability-tax-credit');
      await page.getByRole('button', { name: 'Continue' }).click();

      await applyAdultChildPage.isLoaded('dob-eligibility');
    });

    await test.step('Should navigate to apply for yourself page if applicant is 18-64, has DTC, child is not under 18', async () => {
      await applyAdultChildPage.isLoaded('dob-eligibility');
      await page.getByRole('link', { name: 'Back' }).click();

      await applyAdultChildPage.isLoaded('disability-tax-credit');
      await page.getByRole('link', { name: 'Back' }).click();

      // Back to date of birth
      await applyAdultChildPage.isLoaded('date-of-birth');
      const { year, month, day } = calculateDOB(35);
      await fillOutDOB(page, year, month, day, 'No');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Continue to DTC
      await applyAdultChildPage.isLoaded('disability-tax-credit');
      await page.getByRole('radio', { name: 'Yes' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      await applyAdultChildPage.isLoaded('apply-yourself');
    });

    await test.step('Should navigate to living independently page if applicant is 16 or 17, child is under 18', async () => {
      await applyAdultChildPage.isLoaded('apply-yourself');
      await page.getByRole('link', { name: 'Back' }).click();

      await applyAdultChildPage.isLoaded('date-of-birth');
      const { year, month, day } = calculateDOB(16);
      await fillOutDOB(page, year, month, day, 'Yes');
      await page.getByRole('button', { name: 'Continue' }).click();

      await applyAdultChildPage.isLoaded('living-independently');

      //check for empty fields
      await page.getByRole('button', { name: 'Continue' }).click();
      await hasError(page, 'Select whether or not you live independently from your parents');
    });

    await test.step('Should navigate to contact apply child page if applicant is under 16, child is under 18', async () => {
      await applyAdultChildPage.isLoaded('living-independently');
      await page.getByRole('link', { name: 'Back' }).click();

      await applyAdultChildPage.isLoaded('date-of-birth');
      const { year, month, day } = calculateDOB(15);
      await fillOutDOB(page, year, month, day, 'Yes');
      await page.getByRole('button', { name: 'Continue' }).click();

      await applyAdultChildPage.isLoaded('contact-apply-child');
    });

    await test.step('Should navigate to parent guardian page if applicant is 16 or 17, child is not under 18', async () => {
      await applyAdultChildPage.isLoaded('contact-apply-child');
      await page.getByRole('link', { name: 'Back' }).click();

      await applyAdultChildPage.isLoaded('date-of-birth');
      const { year, month, day } = calculateDOB(16);
      await fillOutDOB(page, year, month, day, 'No');
      await page.getByRole('button', { name: 'Continue' }).click();

      await applyAdultChildPage.isLoaded('parent-or-guardian');
    });

    await test.step('Should navigate to parent guardian page if applicant is under 16, child is not under 18', async () => {
      await applyAdultChildPage.isLoaded('parent-or-guardian');
      await page.getByRole('link', { name: 'Back' }).click();

      await applyAdultChildPage.isLoaded('date-of-birth');
      const { year, month, day } = calculateDOB(15);
      await fillOutDOB(page, year, month, day, 'No');
      await page.getByRole('button', { name: 'Continue' }).click();

      await applyAdultChildPage.isLoaded('parent-or-guardian');
    });

    await test.step('Should return to date of birth page', async () => {
      await applyAdultChildPage.isLoaded('parent-or-guardian');
      await page.getByRole('link', { name: 'Back' }).click();

      await applyAdultChildPage.isLoaded('date-of-birth');

      // Continue the flow
      const { year, month, day } = calculateDOB(65);
      await fillOutDOB(page, year, month, day, 'Yes');
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to applicant information page', async () => {
      await applicantInformation(page);
    });

    await test.step('Should navigate to partner information page', async () => {
      await partnerInformation(page);
    });

    await test.step('Should navigate to contact information page', async () => {
      await contactInformation(page);
    });

    await test.step('Should navigate to communication preference page', async () => {
      await communicationPreference(page);
    });

    await test.step('Should navigate to dental insurance page', async () => {
      await dentalInsurance(page);
    });

    await test.step('Should navigate to access to other dental benefits page', async () => {
      await otherDentalBenefits(page);
    });

    await test.step('Should navigate to children page', async () => {
      await applyAdultChildPage.isLoaded('children');
    });

    // TODO: Add missing flow steps until it reaches confirm page
  });
});

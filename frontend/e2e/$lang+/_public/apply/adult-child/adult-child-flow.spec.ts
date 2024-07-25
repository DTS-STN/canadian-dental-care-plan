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
  await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/type-application/);
  await expect(page.getByRole('heading', { level: 1, name: 'Type of application' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();

  //check for empty fields
  await hasError(page, 'Select who this application is for');

  await page.getByRole('radio', { name: 'I am applying for myself and my child(ren)', exact: true }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
}

// Reusable function for Tax filing step
async function taxFiling(page: Page) {
  await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult-child\/tax-filing/);
  await expect(page.getByRole('heading', { level: 1, name: 'Tax filing' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();

  //check for empty fields
  await hasError(page, 'Select whether or not you have filed your taxes');

  await page.getByRole('radio', { name: 'No', exact: true }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
}

// Reusable function for File your taxes step
async function fileTaxes(page: Page) {
  await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult-child\/file-taxes/);
  await expect(page.getByRole('heading', { level: 1, name: 'File your taxes' })).toBeVisible();
  await page.getByRole('link', { name: 'Back' }).click();
  await page.getByRole('radio', { name: 'Yes', exact: true }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
}

// Reusable function for applicant information step
async function applicantInformation(page: Page) {
  await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult-child\/applicant-information/);
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
}

// Reusable function for partner information step
async function partnerInformation(page: Page) {
  await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult-child\/partner-information/);
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
  await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult-child\/contact-information/);
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
  await fillOutAddress({ page, group: 'Mailing address', address: '123 street', unit: '404', country: 'Canada', province: 'Ontario', city: 'Ottawa', postalCode: 'H0H0H0' });

  //fillout home address
  await fillOutAddress({ page, group: 'Home address', address: '555 street', unit: '', country: 'Canada', province: 'Quebec', city: 'Montreal', postalCode: 'K1K1K1' });

  await page.getByRole('button', { name: 'Continue' }).click();
}

// Reusable function for communication preference step
async function communicationPreference(page: Page) {
  await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult-child\/communication-preference/);
  await expect(page.getByRole('heading', { level: 1, name: 'Communication' })).toBeVisible();
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
  await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult-child\/dental-insurance/);
  await expect(page.getByRole('heading', { level: 1, name: 'Access to other dental insurance' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();

  //check for empty fields
  await hasError(page, 'Select whether you have access to dental insurance');

  await page.getByRole('radio', { name: 'Yes, I have access to dental insurance or coverage', exact: true }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
}

// Reusable function for other dental benefits step
async function otherDentalBenefits(page: Page) {
  await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult-child\/federal-provincial-territorial-benefits/);
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
}

test.describe('Family flow', () => {
  test.beforeEach('Navigate to online application', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/en/apply');
    await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/terms-and-conditions/);
    await expect(page.getByRole('heading', { level: 1, name: 'Terms and conditions' })).toBeVisible();
    await page.getByRole('button', { name: 'Agree and continue' }).click();
  });

  test('Should complete adult and child application', async ({ page }) => {
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
      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult-child\/date-of-birth/);
      await expect(page.getByRole('heading', { level: 1, name: 'Age' })).toBeVisible();
      await page.getByRole('button', { name: 'Continue' }).click();

      // check empty fields
      await hasError(page, 'Date of birth must include a year');
      await hasError(page, 'Date of birth must include a month');
      await hasError(page, 'Date of birth must include a day');
      await hasError(page, 'Select wether or not all the children are under 18');

      await fillOutDOB(page, '1958', '01', '01', 'Yes');
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to applicant information page when applicant is 18-64', async () => {
      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult-child\/applicant-information/);
      await expect(page.getByRole('heading', { level: 1, name: 'Applicant information' })).toBeVisible();

      // Back to date of birth
      await page.getByRole('link', { name: 'Back' }).click();
      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult-child\/date-of-birth/);
      await expect(page.getByRole('heading', { level: 1, name: 'Age' })).toBeVisible();

      await fillOutDOB(page, '1985', '02', '10', 'Yes');
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to DTC page', async () => {
      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult-child\/disability-tax-credit/);
      await expect(page.getByRole('heading', { level: 1, name: 'Disability tax credit' })).toBeVisible();
      await page.getByRole('button', { name: 'Continue' }).click();

      //check for empty fields
      await hasError(page, 'Select whether or not you have a valid disability tax credit');

      await page.getByRole('radio', { name: 'No' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await test.step('Should navigate to apply for your children page if applicant has no DTC, child is under 18', async () => {
      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult-child\/apply-children/);
      await expect(page.getByRole('heading', { level: 1, name: 'Apply for your child(ren)' })).toBeVisible();
    });

    await test.step('Should navigate to dob eligibility page if applicant is 18-64, has no DTC, child is not under 18', async () => {
      await page.getByRole('link', { name: 'Back' }).click();
      await page.getByRole('link', { name: 'Back' }).click();

      // Back to date of birth
      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult-child\/date-of-birth/);
      await expect(page.getByRole('heading', { level: 1, name: 'Age' })).toBeVisible();
      await fillOutDOB(page, '1985', '02', '10', 'No');

      // Back to DTC
      await page.getByRole('button', { name: 'Continue' }).click();
      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult-child\/disability-tax-credit/);
      await expect(page.getByRole('heading', { level: 1, name: 'Disability tax credit' })).toBeVisible();
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult-child\/dob-eligibility/);
      await expect(page.getByRole('heading', { level: 1, name: 'Find out when you can apply' })).toBeVisible();
    });

    await test.step('Should navigate to apply for yourself page if applicant is 18-64, has DTC, child is not under 18', async () => {
      await page.getByRole('link', { name: 'Back' }).click();
      await page.getByRole('link', { name: 'Back' }).click();

      // Back to date of birth
      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult-child\/date-of-birth/);
      await expect(page.getByRole('heading', { level: 1, name: 'Age' })).toBeVisible();
      await fillOutDOB(page, '1985', '02', '10', 'No');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Continue to DTC
      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult-child\/disability-tax-credit/);
      await expect(page.getByRole('heading', { level: 1, name: 'Disability tax credit' })).toBeVisible();
      await page.getByRole('radio', { name: 'Yes' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult-child\/apply-yourself/);
      await expect(page.getByRole('heading', { level: 1, name: 'Apply for yourself' })).toBeVisible();
    });

    await test.step('Should navigate to living independently page if applicant is 16 or 17, child is under 18', async () => {
      await page.getByRole('link', { name: 'Back' }).click();

      await fillOutDOB(page, '2007', '03', '20', 'Yes');
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult-child\/living-independently/);
      await expect(page.getByRole('heading', { level: 1, name: 'Living independently' })).toBeVisible();

      //check for empty fields
      await page.getByRole('button', { name: 'Continue' }).click();
      await hasError(page, 'Select whether or not you live independently from your parents');
    });

    await test.step('Should navigate to contact apply child page if applicant is under 16, child is under 18', async () => {
      await page.getByRole('link', { name: 'Back' }).click();

      await fillOutDOB(page, '2012', '02', '10', 'Yes');
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult-child\/contact-apply-child/);
      await expect(page.getByRole('heading', { level: 1, name: 'Contact us to apply for your child' })).toBeVisible();
    });

    await test.step('Should navigate to parent guardian page if applicant is 16 or 17, child is not under 18', async () => {
      await page.getByRole('link', { name: 'Back' }).click();

      await fillOutDOB(page, '2007', '02', '10', 'No');
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult-child\/parent-or-guardian/);
      await expect(page.getByRole('heading', { level: 1, name: 'Parent or legal guardian needs to apply' })).toBeVisible();
    });

    await test.step('Should navigate to parent guardian page if applicant is under 16, child is not under 18', async () => {
      await page.getByRole('link', { name: 'Back' }).click();

      await fillOutDOB(page, '2017', '02', '10', 'No');
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult-child\/parent-or-guardian/);
      await expect(page.getByRole('heading', { level: 1, name: 'Parent or legal guardian needs to apply' })).toBeVisible();
    });

    await test.step('Should return to date of birth page', async () => {
      await page.getByRole('link', { name: 'Back' }).click();
      await expect(page).toHaveURL(/\/en\/apply\/[a-f0-9-]+\/adult-child\/date-of-birth/);
      await expect(page.getByRole('heading', { level: 1, name: 'Age' })).toBeVisible();

      // Continue the flow
      await fillOutDOB(page, '1958', '02', '10', 'Yes');
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

    // TODO: Create tests for child application
  });
});
